import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CupSoda, Flame, Search, SearchX, SlidersHorizontal, Soup, Utensils, Wheat, X } from 'lucide-react'
import { Button, Card, EmptyState, ErrorState, Select } from '../../components/ui'
import { MealCard, MealCardSkeleton, useTray } from '../../components/cards'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { CAMPUS } from '../../config'
import { read, write, money } from '../../lib/utils'

const CATEGORY_MAP = [
  { id: '', label: 'All', icon: null },
  { id: 'Soups', label: 'Soups', icon: Soup },
  { id: 'Stews', label: 'Stews', icon: Flame },
  { id: 'Swallows', label: 'Swallows', icon: Wheat },
  { id: 'Rice & sides', label: 'Rice & Sides', icon: Utensils },
  { id: 'Drinks', label: 'Drinks', icon: CupSoda },
]

export default function Discover() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || ''
  const cat = sp.get('cat') || ''
  const [text, setText] = useState(q)
  const [now, setNow] = useState(false)
  const [max, setMax] = useState(0)
  const [hall, setHall] = useState('')
  const [sort, setSort] = useState('relevance')
  const [recent, setRecent] = useState(() => read('stew.recent', []))
  const { add, openDetail, modal } = useTray()
  const meals = useAsync(() => api.meals(), [])
  const prices = (meals.data || []).map((m) => m.price)
  const priceCeiling = prices.length ? Math.ceil(Math.max(...prices) / 5) * 5 : 60

  const setParam = (k, v) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v)
    else n.delete(k)
    setSp(n, { replace: true })
  }

  useEffect(() => {
    const t = text.trim()
    const n = new URLSearchParams(sp)
    if (t) n.set('q', t)
    else n.delete('q')
    if (n.toString() !== sp.toString()) setSp(n, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const submit = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (t) {
      const r = [t, ...recent.filter((x) => x !== t)].slice(0, 5)
      setRecent(r)
      write('stew.recent', r)
    }
  }

  const results = useMemo(() => {
    let r = (meals.data || []).filter((m) =>
      (!q || [m.name, m.vendorName, m.cat, m.desc].join(' ').toLowerCase().includes(q.toLowerCase())) &&
      (!cat || m.cat === cat) &&
      (!max || m.price <= max) &&
      (!hall || m.hall === hall) &&
      (!now || (m.open && m.left > 0))
    )
    if (sort === 'low') r = [...r].sort((a, b) => a.price - b.price)
    if (sort === 'high') r = [...r].sort((a, b) => b.price - a.price)
    if (sort === 'rating') r = [...r].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return r
  }, [meals.data, q, cat, max, hall, now, sort])

  const [showFilters, setShowFilters] = useState(false)

  const reset = () => {
    setSp({}, { replace: true })
    setText('')
    setNow(false)
    setMax(0)
    setHall('')
    setShowFilters(false)
  }

  return (
    <div className="space-y-6">
      {/* Top Search Bar & Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink">
            Discover Food
          </h1>
          <p className="mt-1 text-sm font-semibold text-ink-2">
            Browse homemade meals, stews, and swallows cooking this week on campus.
          </p>
        </div>

        {/* Pill Search Input */}
        <form onSubmit={submit} role="search" className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search soups, stews, swallows, chefs..."
            aria-label="Search dishes"
            className="w-full rounded-full border border-line/70 bg-surface pl-11 pr-10 h-12 text-sm font-semibold text-ink placeholder:text-ink-3 shadow-xs transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {text && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setText('')
                setParam('q', '')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-sunken text-ink transition hover:bg-line active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Category Pills matching Screen 2 with React Icons */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
          {CATEGORY_MAP.map((c) => {
            const Icon = c.icon
            const active = cat === c.id
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setParam('cat', active && c.id !== '' ? '' : c.id)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                  active
                    ? 'border border-brand bg-brand text-on-brand shadow-sm scale-105'
                    : 'border border-line/70 bg-surface text-ink-2 hover:bg-sunken hover:text-ink active:scale-95'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{c.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid + Filter Section */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters Sidebar — hidden on mobile unless toggled */}
        <aside className={showFilters ? 'block' : 'hidden lg:block'}>
          <Card className="rounded-3xl border border-line/70 bg-surface p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-black text-ink">
                <SlidersHorizontal className="h-4 w-4 text-brand-strong" />
                Filters
              </span>
              <button
                type="button"
                onClick={reset}
                className="text-xs font-extrabold text-brand-strong hover:underline"
              >
                Reset all
              </button>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-bold text-ink cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-brand"
                checked={now}
                onChange={(e) => setNow(e.target.checked)}
              />
              Available now (in stock)
            </label>

            {/* Price slider */}
            <div className="space-y-2 border-t border-line/70 pt-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-ink-2">Max price:</span>
                <span className="num font-black text-brand-strong">
                  {max ? money(max) : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={priceCeiling}
                step="2"
                value={max || priceCeiling}
                onChange={(e) => setMax(+e.target.value)}
                className="w-full accent-brand cursor-pointer"
                aria-label="Maximum price"
              />
            </div>

            {/* Campus Hall Filter */}
            <div className="space-y-1.5 border-t border-line/70 pt-3">
              <label className="block text-xs font-bold text-ink-2">
                Operating Hall
                <Select
                  value={hall}
                  onChange={(e) => setHall(e.target.value)}
                  className="mt-1 !h-10 text-xs font-semibold"
                >
                  <option value="">All Halls</option>
                  {CAMPUS.halls.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </Card>
        </aside>

        {/* Results Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-bold text-ink-2" aria-live="polite">
              {meals.loading && !meals.data
                ? 'Searching dishes…'
                : `${results.length} dish${results.length === 1 ? '' : 'es'} available`}
            </p>
            <div className="flex items-center gap-2">
              {/* Mobile filter toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`lg:hidden inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  showFilters || now || max || hall
                    ? 'border-brand bg-brand text-on-brand'
                    : 'border-line/70 bg-surface text-ink-2 hover:bg-sunken'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {showFilters ? 'Hide filters' : 'Filters'}
                {(now || max || hall) && <span className="grid h-4 w-4 place-items-center rounded-full bg-on-brand/20 text-[10px] font-black">{[now, !!max, !!hall].filter(Boolean).length}</span>}
              </button>
              <span className="text-xs font-bold text-ink-3 hidden sm:inline">Sort:</span>
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="!h-9 !w-auto text-xs font-bold !rounded-full pl-3.5 pr-8"
                aria-label="Sort dishes"
              >
                <option value="relevance">Relevance</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </Select>
            </div>
          </div>

          {meals.error ? (
            <ErrorState message="Could not fetch meals." onRetry={meals.retry} />
          ) : meals.loading && !meals.data ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <MealCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {results.map((m) => (
                <MealCard
                  key={m.id}
                  meal={m}
                  onAdd={add}
                  onOpenDetail={openDetail}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title={q ? `No dishes match "${q}"` : 'No matching dishes'}
              text="Try adjusting your search terms or clearing your price and hall filters."
              action={
                <Button variant="outline" onClick={reset}>
                  Clear all filters
                </Button>
              }
            />
          )}
        </section>
      </div>

      {modal}
    </div>
  )
}
