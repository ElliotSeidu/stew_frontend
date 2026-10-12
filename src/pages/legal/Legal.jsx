import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, ExternalLink, Info } from 'lucide-react'
import { Logo, ThemeToggle } from '../../components/ui'
import { LEGAL_UPDATED, contactText } from '../../config'
import { cx } from '../../lib/utils'
import { NAV_DOCS } from './content'
import { CREDIT_NOTE, IMAGE_CREDITS } from '../../lib/images'
import NotFound from '../NotFound'

export default function Legal() {
  const { slug = 'privacy' } = useParams()
  const { pathname } = useLocation()
  const nav = useNavigate()
  const inApp = pathname.startsWith('/app')
  const base = inApp ? '/app/legal' : '/legal'
  const doc = NAV_DOCS.find((d) => d.slug === slug)
  if (!doc) return <NotFound />

  const isCredits = slug === 'credits'

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="border-b border-line bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {inApp ? <Link to="/app"><Logo /></Link> : <a href="/"><Logo /></a>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nav(-1)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-sunken active:scale-95 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:py-8 md:grid-cols-[220px_1fr] md:gap-8">
        <nav
          aria-label="Legal documents"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:px-0 md:flex-col md:self-start"
        >
          {NAV_DOCS.map((d) => (
            <NavLink
              key={d.slug}
              to={`${base}/${d.slug}`}
              className={({ isActive }) =>
                cx(
                  'shrink-0 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all shadow-2xs',
                  isActive
                    ? 'bg-brand-soft text-brand-strong ring-1 ring-brand/30'
                    : 'text-ink-2 bg-surface border border-line/60 hover:bg-sunken md:bg-transparent md:border-0'
                )
              }
            >
              {d.title}
            </NavLink>
          ))}
        </nav>

        <article className="w-full max-w-2xl min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            {doc.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-ink-3">
            Last updated: {LEGAL_UPDATED}
          </p>

          {isCredits ? (
            <div className="mt-6 space-y-6">
              {/* About these photos callout */}
              <div className="flex items-start gap-3 rounded-2xl border border-line/80 bg-sunken/60 p-4 sm:p-5 text-xs sm:text-sm font-medium text-ink-2 shadow-2xs">
                <Info className="h-5 w-5 shrink-0 text-brand-strong mt-0.5" />
                <p className="leading-relaxed">{CREDIT_NOTE}</p>
              </div>

              {/* Photo Cards Grid */}
              <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                {IMAGE_CREDITS.map((item) => (
                  <div
                    key={item.file}
                    className="flex flex-col overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-xs transition hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-sunken">
                      <img
                        src={`/foods/${item.file}`}
                        alt={item.dish}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute bottom-2 left-2 rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
                        {item.licence}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                      <h3 className="text-xs sm:text-sm font-black text-ink leading-snug line-clamp-2">
                        {item.dish}
                      </h3>

                      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink-2">
                        <Camera className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                        <span className="truncate">
                          Photo by <strong className="text-ink">{item.author}</strong>
                        </span>
                      </div>

                      <div className="mt-auto pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                        <a
                          href={item.licenceUrl || 'https://creativecommons.org'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-ink-3 hover:text-ink underline text-[11px]"
                        >
                          Licence terms
                        </a>
                        <a
                          href={item.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-brand-strong hover:underline text-[11px]"
                        >
                          Wikimedia source <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reusing content notice */}
              <div className="rounded-2xl border border-line/80 bg-surface p-4 sm:p-5 shadow-2xs">
                <h3 className="text-sm sm:text-base font-bold text-ink">
                  Reusing our content
                </h3>
                <p className="mt-2 text-xs sm:text-sm font-medium text-ink-2 leading-relaxed">
                  The STEW name, logo and app design belong to us. The dish photos above belong to the photographers named and are used here under their Creative Commons licences, which also allow you to reuse them if you credit the photographer and keep the same licence.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {doc.sections.map((s, i) => (
                <section key={s.h} className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-ink">
                    {i + 1}. {s.h}
                  </h2>
                  {s.p.map((t) => (
                    <p key={t} className="text-xs sm:text-sm font-medium text-ink-2 leading-relaxed break-words">
                      {t.replace('{{contact}}', contactText())}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
