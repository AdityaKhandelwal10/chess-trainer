import { useEffect, useState } from 'react'
import { db } from './storage/db'
import { seedIfEmpty } from './storage/seedLoader'
import { Explore } from './openings/ExploreTab'
import { DrillTab } from './drill/DrillTab'
import { AnalyzeTab } from './analyze/AnalyzeTab'
import { ThemeToggle, useTheme } from './ui/ThemeToggle'

type Tab = 'explore' | 'drill' | 'analyze'

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'explore', label: 'Explore', hint: 'Step through openings move by move' },
  { id: 'drill', label: 'Drill', hint: 'System plays opponent, you play the repertoire' },
  { id: 'analyze', label: 'Analyze', hint: 'Review your Lichess / Chess.com games vs the repertoire' },
]

function App() {
  // Activate theme class on <html>.
  useTheme()

  const [seeded, setSeeded] = useState(false)
  const [tab, setTab] = useState<Tab>('explore')

  useEffect(() => {
    ;(async () => {
      await seedIfEmpty(db())
      setSeeded(true)
    })()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--bg)] text-[color:var(--text)]">
      <header className="border-b border-[color:var(--border)] bg-[color:var(--bg-panel)]">
        <div className="mx-auto max-w-[1400px] px-6 py-3 flex items-center gap-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-[color:var(--text)]">
              Chess Openings Trainer
            </h1>
            <span className="hidden sm:inline text-xs text-[color:var(--text-muted)]">
              for 1000–2000 rated players
            </span>
          </div>

          <nav className="flex items-center gap-1 ml-auto">
            {TABS.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  title={t.hint}
                  className={
                    active
                      ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-[color:var(--accent)] text-white'
                      : 'px-3 py-1.5 rounded-md text-sm font-medium text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--bg-panel-2)]'
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-6 py-5">
        {!seeded ? (
          <EmptyState
            title="Loading your repertoire…"
            body="Seeding the local database with openings. This happens once."
          />
        ) : tab === 'explore' ? (
          <Explore />
        ) : tab === 'drill' ? (
          <DrillTab />
        ) : (
          <AnalyzeTab />
        )}
      </main>

      <footer className="border-t border-[color:var(--border)] bg-[color:var(--bg-panel)]">
        <div className="mx-auto max-w-[1400px] px-6 py-3 text-xs text-[color:var(--text-muted)] flex flex-wrap gap-x-6 gap-y-1">
          <span>
            Lines from{' '}
            <a
              href="https://lichess.org/analysis"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[color:var(--text)]"
            >
              Lichess Opening Explorer
            </a>{' '}
            (1600–1800 band)
          </span>
          <span>Roadmap: higher-tier packs (2000–2400, 2400+) planned</span>
        </div>
      </footer>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        aria-hidden
        className="mb-4 text-5xl text-[color:var(--text-muted)] select-none"
        style={{ fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif' }}
      >
        ♞
      </div>
      <h2 className="text-lg font-semibold text-[color:var(--text)]">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-[color:var(--text-muted)]">{body}</p>
    </div>
  )
}

export default App
