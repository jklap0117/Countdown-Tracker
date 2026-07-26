import { useMemo, type CSSProperties } from 'react'
import type { PersonFilter as PersonFilterValue } from '../types'
import { categoryById } from '../data/categories'
import { PARTNER_NAME, USER_NAME, WHO, matchesPerson } from '../data/people'
import { byDateAscending, countdownCopy, formatWhen, isPast } from '../lib/date'
import { useApp } from '../store/AppContext'
import type { ShareRules } from '../store/appReducer'
import { Switch } from '../components/Switch'
import screen from './Screen.module.css'
import styles from './Sharing.module.css'

const BUCKETS: { id: PersonFilterValue; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'me', name: USER_NAME },
  { id: 'maddie', name: PARTNER_NAME },
  { id: 'both', name: 'Shared' },
]

const RULES: { key: keyof ShareRules; title: string; sub: string; dot: string; color: string }[] = [
  {
    key: 'upcoming',
    title: 'Shared upcoming milestones',
    sub: `Everything tagged ${USER_NAME} + ${PARTNER_NAME}`,
    dot: 'S',
    color: 'var(--color-accent-600)',
  },
  {
    key: 'past',
    title: 'Shared history',
    sub: 'The Past tab, once things happen',
    dot: 'H',
    color: 'var(--color-accent-2-600)',
  },
  {
    key: 'reminders',
    title: `Her reminders ping me too`,
    sub: 'Off by default — she may not want this',
    dot: 'R',
    color: 'var(--color-neutral-600)',
  },
]

export function Sharing() {
  const { state, dispatch } = useApp()
  const { items, now, linked, rules, widgetPerson } = state

  const sharedCount = items.filter((item) => item.who === 'both').length

  // The widget follows its OWN bucket — changing it must not touch the
  // browsing filter, and vice versa.
  const widgetItems = useMemo(
    () =>
      items
        .filter((item) => !isPast(item, now))
        .filter((item) => matchesPerson(item.who, widgetPerson))
        .sort(byDateAscending)
        .slice(0, 3),
    [items, now, widgetPerson],
  )

  const bucketName = BUCKETS.find((bucket) => bucket.id === widgetPerson)?.name ?? 'All'

  return (
    <div className={screen.screen}>
      <div className={`${screen.header} ${styles.headerPad}`}>
        <h1 className={screen.title}>Sharing</h1>
        <div className={screen.tagline}>
          {linked ? `Linked with ${PARTNER_NAME}` : 'Just you for now'}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.pair}>
          <div className={styles.faces}>
            <div className={`${styles.face} ${styles.faceMe}`} aria-hidden="true">
              J
            </div>
            <div className={`${styles.face} ${styles.facePartner}`} aria-hidden="true">
              M
            </div>
          </div>

          {linked ? (
            <>
              <div className={styles.pairTitle}>
                {USER_NAME} &amp; {PARTNER_NAME}
              </div>
              <div className={styles.pairBlurb}>
                Shared milestones appear on both phones and in both widgets, live.
              </div>
              <div className={styles.tags}>
                <span className={`tag tag-accent-2 ${styles.tag}`}>
                  {sharedCount} shared {sharedCount === 1 ? 'milestone' : 'milestones'}
                </span>
                <span className={`tag tag-neutral ${styles.tag}`}>Synced just now</span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.pairTitle}>Invite {PARTNER_NAME}</div>
              <div className={styles.pairBlurb}>
                Send a link. Once she joins, anything tagged Shared syncs to you both.
              </div>
            </>
          )}

          <button
            type="button"
            className={styles.cta}
            onClick={() => dispatch({ type: 'linked/toggle' })}
          >
            {linked ? 'Manage sharing' : `Send ${PARTNER_NAME} an invite`}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>What she can see</div>
        <div className={styles.rules}>
          {RULES.map((rule) => (
            <div key={rule.key} className={styles.rule}>
              <div
                className={styles.ruleDot}
                aria-hidden="true"
                style={{ '--dot-color': rule.color } as CSSProperties}
              >
                {rule.dot}
              </div>
              <div className={styles.ruleMain}>
                <div className={styles.ruleTitle}>{rule.title}</div>
                <div className={styles.ruleSub}>{rule.sub}</div>
              </div>
              <Switch
                checked={rules[rule.key]}
                onChange={() => dispatch({ type: 'rules/toggle', key: rule.key })}
                label={rule.title}
              />
            </div>
          ))}
          <div className={styles.footnote}>
            Private milestones stay on your phone — she'll never see them, even in the count.
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>Home screen widget</div>
        <div className={styles.widgetCard}>
          <div className={styles.widgetBlurb}>
            Choose which bucket the next-three widget follows.
          </div>

          <div className={styles.buckets}>
            {BUCKETS.map((bucket) => {
              const active = widgetPerson === bucket.id
              return (
                <button
                  key={bucket.id}
                  type="button"
                  className={`${styles.bucket} ${active ? styles.bucketActive : ''}`}
                  aria-pressed={active}
                  onClick={() => dispatch({ type: 'widgetPerson/set', person: bucket.id })}
                >
                  {bucket.name}
                </button>
              )
            })}
          </div>

          <div className={styles.wallpaper}>
            <div className={styles.widget}>
              <div className={styles.widgetHead}>
                <div className={styles.widgetTitle}>Coming up</div>
                <div className={styles.widgetSub}>
                  {bucketName === 'All' ? 'Everything' : bucketName}
                </div>
              </div>

              <div className={styles.widgetRows}>
                {widgetItems.map((item) => {
                  const { big, unit } = countdownCopy(item, now)
                  return (
                    <div
                      key={item.id}
                      className={styles.widgetRow}
                      style={{ '--row-color': categoryById(item.cat).color } as CSSProperties}
                    >
                      <div className={styles.widgetBar} aria-hidden="true" />
                      <div className={styles.widgetMain}>
                        <div className={styles.widgetName}>{item.title}</div>
                        <div className={styles.widgetMeta}>
                          {formatWhen(item)} · {WHO[item.who].label}
                        </div>
                      </div>
                      <div className={styles.widgetCount}>
                        <div className={styles.widgetBig}>{big}</div>
                        <div className={styles.widgetUnit}>{unit}</div>
                      </div>
                    </div>
                  )
                })}

                {widgetItems.length === 0 && (
                  <div className={styles.widgetEmpty}>Nothing in this bucket yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.widgetNote}>
            Long-press your home screen → add the widget → pick this bucket there too.
          </div>
        </div>
      </div>
    </div>
  )
}
