import { Calendar, Clock, Users } from 'lucide-react'

/**
 * Scaffold placeholder. Nothing here is from the design — it exists to confirm
 * the toolchain, fonts and design tokens are wired up. Replace it with the
 * Upcoming screen (README.md → "Screens").
 */
export default function App() {
  return (
    <main style={{ padding: '58px 20px' }}>
      <h1 style={{ font: '400 34px/1.12 var(--font-heading)', margin: 0 }}>
        Coming up
      </h1>
      <p
        style={{
          font: '400 13px/1.5 var(--font-body)',
          color: 'var(--color-neutral-600)',
          margin: '6px 0 0',
        }}
      >
        Scaffold is running — no screens built yet.
      </p>

      <div style={{ display: 'flex', gap: 24, marginTop: 'var(--space-8)' }}>
        {[Calendar, Clock, Users].map((Icon, i) => (
          <Icon key={i} size={23} strokeWidth={2.75} color="var(--color-accent-700)" />
        ))}
      </div>

      <div
        style={{
          marginTop: 'var(--space-6)',
          padding: 20,
          background: 'var(--color-surface)',
          borderRadius: 28,
        }}
      >
        <p style={{ font: '400 13px/1.6 var(--font-body)', margin: 0 }}>
          Tokens, Caprasimo/Figtree and Lucide are loaded. Build the real screens
          against <code>src/styles/organic-styles.css</code> and the prototypes in{' '}
          <code>design/</code>.
        </p>
      </div>
    </main>
  )
}
