import { Link, Outlet } from 'react-router-dom'
import { Logo, ThemeToggle } from '../components/ui'
import { useScrollTop } from '../lib/hooks'

export default function AuthLayout() {
  useScrollTop()
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <a href="/" aria-label="STEW"><Logo /></a>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-md px-4 pb-12 pt-2"><Outlet /></main>
      <footer className="pb-8 text-center text-xs text-ink-3">
        <Link to="/app/legal/terms" className="hover:underline">Terms</Link> · <Link to="/app/legal/privacy" className="hover:underline">Privacy</Link>
      </footer>
    </div>
  )
}
