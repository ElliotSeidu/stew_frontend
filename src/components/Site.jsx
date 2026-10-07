import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button, Logo, ThemeToggle } from './ui'
import { NAV_DOCS } from '../pages/legal/content'
import { CONTACT } from '../config'

const links = [['How it works', '/#how'], ['Features', '/#features'], ['Sell on STEW', '/#chefs'], ['FAQ', '/#faq']]
const CURRENT_YEAR = new Date().getFullYear()

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <a href="/" aria-label="STEW home"><Logo /></a>
        <nav className="ml-8 hidden gap-1 md:flex" aria-label="Main">
          {links.map(([l, h]) => <a key={l} href={h} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-sunken">{l}</a>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button to="/app/login" variant="ghost" className="hidden sm:inline-flex">Log in</Button>
          <Button to="/app/signup" className="hidden sm:inline-flex">Get started</Button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-line md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-1 border-t border-line px-4 py-3 md:hidden">
          {links.map(([l, h]) => <a key={l} href={h} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-sunken">{l}</a>)}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button to="/app/login" variant="outline">Log in</Button>
            <Button to="/app/signup">Get started</Button>
          </div>
        </div>
      )}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-3 text-sm text-ink-2">Campus food, sorted. Made for KNUST students, by KNUST students.</p>
        </div>
        <div>
          <h3 className="text-sm font-bold">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            <li><Link to="/app/signup" className="hover:underline">Create account</Link></li>
            <li><Link to="/app/login" className="hover:underline">Log in</Link></li>
            <li><a href="/#chefs" className="hover:underline">Sell on STEW</a></li>
            <li><a href="/#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </div>
        <div className="md:col-span-1">
          <h3 className="text-sm font-bold">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {NAV_DOCS.map((d) => <li key={d.slug}><Link to={`/legal/${d.slug}`} className="hover:underline">{d.title}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {CONTACT.phone && <li><a href={`tel:${CONTACT.phone}`} className="hover:underline">{CONTACT.phone}</a></li>}
            {CONTACT.email && <li><a href={`mailto:${CONTACT.email}`} className="hover:underline">{CONTACT.email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink-3">© {CURRENT_YEAR} STEW. Not officially affiliated with KNUST unless agreed in writing.</div>
    </footer>
  )
}
