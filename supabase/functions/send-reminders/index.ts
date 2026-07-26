/**
 * send-reminders — hourly reminder job.
 *
 * Runs every hour via pg_cron. Each push subscription carries the IANA
 * timezone of the device that created it, so the job sends when it is 9 AM
 * *there*. That is why this runs hourly rather than once a day: it is the only
 * way to hit 9 AM local for everyone without a code change every DST shift, or
 * when one of you is on a trip.
 *
 * Auth is a shared secret rather than a JWT — pg_cron has no user session.
 * Every secret comes from Vault through get_reminder_config(), which only the
 * service role may call, so nothing sensitive lives in the function's env.
 */

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SEND_AT_HOUR = 9

interface ReminderConfig {
  vapid_public: string
  vapid_private: string
  vapid_subject: string
  cron_secret: string
}

interface Subscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  timezone: string
}

interface MilestoneRow {
  id: string
  owner_id: string
  title: string
  occurs_at: string
  has_time: boolean
  who: 'me' | 'maddie' | 'both'
}

/** Local calendar date and hour for an instant, in a given IANA zone. */
function localParts(instant: Date, timeZone: string): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
  }
}

/** Calendar arithmetic on the date string — no timezone involved. */
function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function formatTime(occursAt: string): string {
  const time = occursAt.slice(11, 16)
  if (time === '') return ''
  const [h, m] = time.split(':').map(Number)
  const meridiem = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${meridiem}`
}

Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: configRows, error: configError } = await admin.rpc('get_reminder_config')
  if (configError || !configRows?.[0]) {
    console.error('config lookup failed', configError)
    return new Response('config unavailable', { status: 500 })
  }
  const config = configRows[0] as ReminderConfig

  if (req.headers.get('x-cron-secret') !== config.cron_secret) {
    return new Response('forbidden', { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun = body?.dryRun === true
  // Lets a test pin the clock instead of waiting for 9 AM to come round.
  const now = typeof body?.now === 'string' ? new Date(body.now) : new Date()

  webpush.setVapidDetails(config.vapid_subject, config.vapid_public, config.vapid_private)

  const { data: subscriptions, error: subError } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth, timezone')
  if (subError) {
    console.error('subscription lookup failed', subError)
    return new Response('subscription lookup failed', { status: 500 })
  }

  const due = (subscriptions ?? []).filter(
    (s: Subscription) => localParts(now, s.timezone).hour === SEND_AT_HOUR,
  )

  const results: { endpoint: string; milestone: string; status: string }[] = []
  const sent = new Set<string>()

  for (const sub of due as Subscription[]) {
    const tomorrow = nextDay(localParts(now, sub.timezone).date)

    // Service role bypasses RLS, so visibility is enforced here by hand and
    // must match the SELECT policy in 0001: your own, plus a partner's
    // non-private ones.
    const { data: links } = await admin
      .from('partners')
      .select('partner_id')
      .eq('user_id', sub.user_id)
    const owners = [sub.user_id, ...(links ?? []).map((l: { partner_id: string }) => l.partner_id)]

    const { data: milestones } = await admin
      .from('milestones')
      .select('id, owner_id, title, occurs_at, has_time, who')
      .in('owner_id', owners)
      .eq('remind', true)
      .like('occurs_at', `${tomorrow}%`)

    for (const milestone of (milestones ?? []) as MilestoneRow[]) {
      const isOwner = milestone.owner_id === sub.user_id
      if (!isOwner && milestone.who === 'me') continue // private to its owner

      const alreadySent = await admin
        .from('reminder_log')
        .select('milestone_id')
        .eq('milestone_id', milestone.id)
        .eq('user_id', sub.user_id)
        .maybeSingle()
      if (alreadySent.data) continue

      const when = milestone.has_time ? `Tomorrow at ${formatTime(milestone.occurs_at)}` : 'Tomorrow'
      const payload = JSON.stringify({
        title: milestone.title,
        body: when,
        milestoneId: milestone.id,
      })

      if (dryRun) {
        results.push({ endpoint: sub.endpoint, milestone: milestone.title, status: 'dry-run' })
        continue
      }

      try {
        // generateRequestDetails builds the encrypted body and VAPID headers
        // without touching node's http stack, which keeps this on plain fetch.
        const details = webpush.generateRequestDetails(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        const res = await fetch(details.endpoint, {
          method: details.method,
          headers: details.headers,
          body: details.body,
        })

        if (res.status === 404 || res.status === 410) {
          // The push service has retired this endpoint — the device is gone.
          await admin.from('push_subscriptions').delete().eq('id', sub.id)
          results.push({ endpoint: sub.endpoint, milestone: milestone.title, status: 'expired' })
          continue
        }

        if (!res.ok) {
          results.push({
            endpoint: sub.endpoint,
            milestone: milestone.title,
            status: `error ${res.status}`,
          })
          continue
        }

        await admin
          .from('reminder_log')
          .insert({ milestone_id: milestone.id, user_id: sub.user_id })
        sent.add(`${milestone.id}:${sub.user_id}`)
        results.push({ endpoint: sub.endpoint, milestone: milestone.title, status: 'sent' })
      } catch (cause) {
        console.error('push failed', cause)
        results.push({ endpoint: sub.endpoint, milestone: milestone.title, status: 'threw' })
      }
    }
  }

  const summary = {
    checkedSubscriptions: subscriptions?.length ?? 0,
    dueSubscriptions: due.length,
    sent: sent.size,
    dryRun,
    results,
  }
  console.log('send-reminders', JSON.stringify(summary))

  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  })
})
