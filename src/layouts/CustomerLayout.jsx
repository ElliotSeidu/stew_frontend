import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, Download, Heart, House, MapPin, ReceiptText, ShoppingBag, Store, User, WifiOff } from 'lucide-react'
import { Button, Logo, ThemeToggle } from '../components/ui'
import { useAuth, useCart } from '../context/Providers'
import { useInstall, useOnline, useScrollTop } from '../lib/hooks'
import { cx, money } from '../lib/utils'

const tabs = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/discover', label: 'Discover', icon: Compass },
  { to: '/app/orders', label: 'Orders', icon: ReceiptText },
  { to: '/app/favorites', label: 'Favorites', icon: Heart },
  { to: '/app/account', label: 'Account', icon: User },
]

export default function CustomerLayout() {
  const { count, subtotal } = useCart()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const online = useOnline()
  const { canInstall, install } = useInstall()
  useScrollTop()
  const hideBar = /\/(cart|checkout)/.test(pathname)

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Top Header - Consistent on large screens, app-bar on small screens */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/app" aria-label="STEW home"><Logo /></Link>
          <nav className="ml-6 hidden gap-1.5 md:flex" aria-label="Main">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cx(
                    'rounded-full px-4 py-2 text-sm font-bold transition-all',
                    isActive ? 'bg-brand text-on-brand shadow-xs' : 'text-ink-2 hover:bg-sunken hover:text-ink'
                  )
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-sunken px-3.5 py-1.5 text-xs font-bold text-ink-2 sm:inline-flex border border-line/60">
              <MapPin className="h-3.5 w-3.5 text-brand-strong" />
              {user?.area || user?.hall || 'Select Hall'}
            </span>
            {user?.accountType === 'both' && (
              <Link to="/app/vendor" className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-xs font-bold text-brand-strong hover:brightness-95 shadow-xs">
                <Store className="h-3.5 w-3.5" /><span className="hidden sm:inline">Kitchen</span> dashboard
              </Link>
            )}
            {canInstall && (
              <Button size="sm" variant="outline" onClick={install} className="hidden sm:inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />Install
              </Button>
            )}
            <ThemeToggle />
            <Link
              to="/app/cart"
              aria-label={`Tray, ${count} items`}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-line/80 bg-surface text-ink hover:bg-sunken shadow-xs transition active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="num absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-black text-on-brand shadow-xs">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-warn-soft px-4 py-2 text-xs font-semibold text-warn">
            <WifiOff className="h-3.5 w-3.5" />You're offline. Some things may not load.
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-5 md:pb-16"><Outlet /></main>

      {/* Floating Tray Button if items are added */}
      {count > 0 && !hideBar && (
        <Link
          to="/app/cart"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between rounded-full bg-brand px-5 py-3.5 text-sm font-extrabold text-on-brand shadow-xl w-[92%] max-w-sm md:left-auto md:translate-x-0 md:bottom-6 md:right-6 md:w-80 transition hover:brightness-95 active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>{count} in tray</span>
          </span>
          <span className="num font-black">View tray · {money(subtotal)}</span>
        </Link>
      )}

      {/* Floating capsule dock on small screens matching insp.webp (locked stationary against scrolling) */}
      <div
        className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none md:hidden"
        style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
      >
        <nav
          aria-label="Primary navigation"
          className="pointer-events-auto flex w-full max-w-sm items-center justify-around gap-1 rounded-full border border-line/80 bg-surface/95 px-3 py-2 text-ink shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#141518]/95 dark:text-white"
        >
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              title={t.label}
              aria-label={t.label}
              className={({ isActive }) =>
                cx(
                  'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                  isActive
                    ? 'bg-brand text-on-brand shadow-md scale-105'
                    : 'text-ink-3 hover:text-ink hover:bg-sunken dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 active:scale-95'
                )
              }
            >
              <t.icon className="h-5 w-5" />
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
