/**
 * Web push subscription.
 *
 * Permission is granted per browser, not per account, so this is always a
 * per-device action — signing in on a second phone does not carry it over.
 */

import { isSupabaseConfigured, requireSupabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export type PushState =
  | 'unsupported' // browser has no push API
  | 'needs-install' // iOS: only works once added to the home screen
  | 'needs-sync' // no Supabase credentials, so there is nowhere to store it
  | 'denied' // user said no; only they can undo it, in browser settings
  | 'off' // available, not yet enabled
  | 'on'

/**
 * The push service wants the key as raw bytes, not base64url. Backed by an
 * explicit ArrayBuffer because `applicationServerKey` rejects the
 * SharedArrayBuffer-compatible type that `Uint8Array.from` infers.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function supported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * iOS refuses push to a Safari tab — the site must be installed to the home
 * screen first. Everywhere else this is irrelevant.
 */
function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) return isIos() && !isStandalone() ? 'needs-install' : 'unsupported'
  if (isIos() && !isStandalone()) return 'needs-install'
  if (!isSupabaseConfigured) return 'needs-sync'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'

  const registration = await navigator.serviceWorker.getRegistration()
  const existing = await registration?.pushManager.getSubscription()
  return existing ? 'on' : 'off'
}

/** Registers the worker, asks permission, subscribes, and stores the result. */
export async function enablePush(): Promise<PushState> {
  if (!supported()) return 'unsupported'
  if (!isSupabaseConfigured) return 'needs-sync'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }))

  const json = subscription.toJSON()
  const { error } = await requireSupabase()
    .from('push_subscriptions')
    .upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        // The job sends at 9 AM in whatever zone this device is in.
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      { onConflict: 'endpoint' },
    )

  if (error) throw new Error(`Could not save the subscription: ${error.message}`)
  return 'on'
}

/** Unsubscribes this device and forgets it server-side. */
export async function disablePush(): Promise<PushState> {
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return 'off'

  const { endpoint } = subscription
  await subscription.unsubscribe()
  if (isSupabaseConfigured) {
    await requireSupabase().from('push_subscriptions').delete().eq('endpoint', endpoint)
  }
  return 'off'
}
