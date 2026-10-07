import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ChartColumn, LayoutDashboard, LogOut, Settings, ShieldAlert, Store, UtensilsCrossed, Users,
  ReceiptText, MessageSquareCheck, ShieldCheck, Wallet, FileText,
} from 'lucide-react'
import { Badge, Button, ConfirmDialog, KitchenLogo, Logo, ThemeToggle } from '../components/ui'
import { useAuth } from '../context/Providers'
import { useScrollTop } from '../lib/hooks'
import { cx } from '../lib/utils'

const LINKS = {
  vendor: [
    { to: '/app/vendor', label: 'Orders', icon: LayoutDashboard, end: true },
    { to: '/app/vendor/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/app/vendor/kitchen', label: 'Kitchen', icon: Store },
    { to: '/app/vendor/earnings', label: 'Earnings', icon: ChartColumn },
    { to: '/app/vendor/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/app/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/app/admin/vendors', label: 'Vendors', icon: Store },
    { to: '/app/admin/orders', label: 'Orders', icon: ReceiptText },
    { to: '/app/admin/disputes', label: 'Disputes', icon: ShieldAlert },
    { to: '/app/admin/moderation', label: 'Reviews', icon: MessageSquareCheck },
    { to: '/app/admin/compliance', label: 'Compliance', icon: ShieldCheck },
    { to: '/app/admin/payouts', label: 'Payouts', icon: Wallet },
    { to: '/app/admin/audit', label: 'Audit Log', icon: FileText },
    { to: '/app/admin/users', label: 'Users', icon: Users },
  ],
}

export default function DashLayout({ kind }) {
  const links = LINKS[kind]
  const { logout, user } = useAuth()
  const nav = useNavigate()
  const [askLogout, setAskLogout] = useState(false)
  useScrollTop()
  const isVendor = kind === 'vendor'
  const kitchenName = user?.kitchenName || 'Your kitchen'

  const out = () => { setAskLogout(false); logout(); nav('/app/login') }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Top sticky navigation bar on larger screens, matching CustomerLayout */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 backdrop-blur-md">
        {isVendor ? (
          /* Vendor Header: Logo & Nav links on the same row on larger screens */
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            <Link to="/app/vendor" className="flex shrink-0 items-center gap-2.5">
              <KitchenLogo vendor={{ name: kitchenName, logo: user?.logo }} size="h-9 w-9" className="rounded-xl" />
              <span className="min-w-0">
                <span className="block max-w-[140px] truncate text-sm font-extrabold leading-tight sm:max-w-xs">{kitchenName}</span>
                <span className="block text-[10px] font-semibold text-brand-strong">Kitchen manager</span>
              </span>
            </Link>

            <nav className="ml-4 hidden items-center gap-1.5 overflow-x-auto no-scrollbar md:flex" aria-label="Kitchen navigation">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cx(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all lg:px-4 lg:text-sm',
                      isActive ? 'bg-brand text-on-brand shadow-xs' : 'text-ink-2 hover:bg-sunken hover:text-ink'
                    )
                  }
                >
                  <l.icon className="h-4 w-4 shrink-0" />
                  <span>{l.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {user?.accountType === 'both' && (
                <Button to="/app" variant="outline" size="sm">
                  Order food
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        ) : (
          /* Admin Header: Logo row on top, and dedicated navigation bar BELOW the logo on larger screens */
          <div>
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
              <div className="flex shrink-0 items-center gap-2.5">
                <Link to="/app/admin" aria-label="STEW admin"><Logo /></Link>
                <Badge tone="brand">Admin Console</Badge>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAskLogout(true)}
                  className="text-ink-2"
                  title="Log out"
                  aria-label="Log out"
                >
                  <span className="hidden sm:inline">Log out</span>
                  <LogOut className="h-4 w-4 sm:hidden" />
                </Button>
              </div>
            </div>

            {/* Admin navigation bar BELOW the STEW logo on larger screens */}
            <div className="hidden border-t border-line/60 bg-sunken/40 md:block">
              <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar" aria-label="Admin navigation">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cx(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all lg:px-3.5 lg:text-sm',
                        isActive ? 'bg-brand text-on-brand shadow-xs' : 'text-ink-2 hover:bg-surface hover:text-ink'
                      )
                    }
                  >
                    <l.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{l.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content with clearance at bottom on mobile */}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-12 md:pt-6">
        <Outlet />
      </main>

      {/* Floating bottom capsule dock on small screens matching insp.webp (stationary against scrolling) */}
      <div
        className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none md:hidden"
        style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
      >
        <nav
          aria-label="Dashboard mobile navigation"
          className={cx(
            'pointer-events-auto flex items-center gap-1 rounded-full border border-line/80 bg-surface/95 px-3 py-2 text-ink shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#141518]/95 dark:text-white',
            isVendor ? 'w-full max-w-sm justify-around' : 'w-full max-w-md overflow-x-auto no-scrollbar justify-start px-2'
          )}
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              title={l.label}
              aria-label={l.label}
              className={({ isActive }) =>
                cx(
                  'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                  isActive
                    ? 'bg-brand text-on-brand shadow-md scale-105'
                    : 'text-ink-3 hover:text-ink hover:bg-sunken dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 active:scale-95'
                )
              }
            >
              <l.icon className="h-5 w-5" />
            </NavLink>
          ))}
        </nav>
      </div>

      <ConfirmDialog
        open={askLogout}
        onClose={() => setAskLogout(false)}
        onConfirm={out}
        title="Log out of STEW?"
        confirmLabel="Yes, log out"
      >
        <p className="text-sm text-ink-2">
          You will need your email and password to get back in.
        </p>
      </ConfirmDialog>
    </div>
  )
}
