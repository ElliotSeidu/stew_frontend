import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo, ThemeToggle } from '../../components/ui'
import { LEGAL_UPDATED, contactText } from '../../config'
import { cx } from '../../lib/utils'
import { NAV_DOCS } from './content'
import NotFound from '../NotFound'

export default function Legal() {
  const { slug = 'privacy' } = useParams()
  const { pathname } = useLocation()
  const nav = useNavigate()
  const inApp = pathname.startsWith('/app')
  const base = inApp ? '/app/legal' : '/legal'
  const doc = NAV_DOCS.find((d) => d.slug === slug)
  if (!doc) return <NotFound />
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {inApp ? <Link to="/app"><Logo /></Link> : <a href="/"><Logo /></a>}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => nav(-1)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-sunken"><ArrowLeft className="h-4 w-4" />Back</button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[220px_1fr]">
        <nav aria-label="Legal documents" className="flex gap-1 overflow-x-auto md:flex-col md:self-start">
          {NAV_DOCS.map((d) => (
            <NavLink key={d.slug} to={`${base}/${d.slug}`} className={({ isActive }) => cx('shrink-0 rounded-lg px-3 py-2 text-sm font-semibold', isActive ? 'bg-brand-soft text-brand-strong' : 'text-ink-2 hover:bg-sunken')}>{d.title}</NavLink>
          ))}
        </nav>
        <article className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight">{doc.title}</h1>
          <p className="mt-1 text-sm text-ink-3">Last updated: {LEGAL_UPDATED}</p>
          {doc.sections.map((s, i) => (
            <section key={s.h} className="mt-8">
              <h2 className="text-lg font-bold">{i + 1}. {s.h}</h2>
              {s.p.map((t) => <p key={t} className="mt-2 text-ink-2">{t.replace('{{contact}}', contactText())}</p>)}
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}
