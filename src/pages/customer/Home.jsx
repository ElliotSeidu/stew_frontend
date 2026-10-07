import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, CupSoda, Flame, MapPin, Search, SlidersHorizontal, Soup, Utensils, Wheat } from 'lucide-react'
import { Button, EmptyState, ErrorState } from '../../components/ui'
import { MealCard, MealCardSkeleton, VendorCard, VendorCardSkeleton, useTray } from '../../components/cards'
import { CAMPUS, ZONES, zoneName } from '../../config'
import { useAuth, useToast } from '../../context/Providers'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { track } from '../../lib/analytics'
import { KINDS } from '../../lib/mockData'

const CATEGORY_MAP = [
  { id: '', label: 'All', icon: null },
  { id: 'Soups', label: 'Soups', icon: Soup },
  { id: 'Stews', label: 'Stews', icon: Flame },
  { id: 'Swallows', label: 'Swallows', icon: Wheat },
  { id: 'Rice & sides', label: 'Rice & Sides', icon: Utensils },
  { id: 'Drinks', label: 'Drinks', icon: CupSoda },
]

export default function Home() {
  const { user, saveProfile } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const { add, openDetail, modal } = useTray()
  const meals = useAsync(() => api.meals(), [])
  const vendors = useAsync(() => api.vendors(), [])
  const [kind, setKind] = useState('')
  const [q, setQ] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [busyZone, setBusyZone] = useState(false)

  const currentZone = user?.area || user?.hall || ''
  const zone = zoneName(currentZone)
  const initials = (user?.fullName || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()

  const changeZone = async (name) => {
    if (!name || name === currentZone) return
    setBusyZone(true)
    try {
      await saveProfile({ area: name })
      track('zone_selected')
      toast(`Showing food near ${name}`)
    } catch (e) {
      toast(e.message, 'bad')
    } finally {
      setBusyZone(false)
    }
  }

  // Filter and prioritize nearby dishes
  const list = (meals.data || [])
    .filter((m) => m.open && (!kind || m.cat === kind))
    .sort((a, b) => (b.hall === zone ? 1 : 0) - (a.hall === zone ? 1 : 0))

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Top Header Row matching Screen 2 in insp.webp */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* User avatar on left */}
        <Link
          to="/app/account"
          aria-label="Your account"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand font-extrabold text-sm shadow-xs transition hover:scale-105 active:scale-95"
        >
          {initials}
        </Link>

        {/* Location selector in center */}
        <div className="relative inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/90 px-3.5 py-1.5 shadow-xs">
          <MapPin className="h-3.5 w-3.5 text-brand-strong shrink-0" />
          <select
            value={currentZone}
            onChange={(e) => changeZone(e.target.value)}
            disabled={busyZone}
            aria-label="Delivery location"
            className="cursor-pointer appearance-none bg-transparent pr-5 text-xs font-extrabold text-ink focus:outline-none"
          >
            <option value="">Choose Hall / Area…</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-3" />
        </div>

        {/* Right side search action */}
        <Link
          to="/app/discover"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line/70 bg-surface text-ink shadow-xs transition hover:bg-sunken active:scale-95"
          aria-label="Explore all food"
        >
          <Search className="h-4 w-4 text-ink-2" />
        </Link>
      </div>

      {/* Hero Title Section matching Screen 2 in insp.webp */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-ink leading-[1.1]">
          Fresh and Homemade <br />
          <span className="text-brand-strong">Campus Favorites</span>
        </h1>
        <p className="text-sm font-semibold text-ink-2 max-w-md">
          Homemade food from verified {CAMPUS.short} student chefs, cooked in weekly batches.
        </p>
      </div>

      {/* Pill Search Bar with Filters matching Screen 2 in insp.webp */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            nav(`/app/discover?q=${encodeURIComponent(q)}`)
          }}
          className="relative flex items-center"
          role="search"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dishes, kitchens, soups..."
              aria-label="Search food"
              className="w-full rounded-full border border-line/70 bg-surface pl-11 pr-14 h-12 text-sm font-semibold text-ink placeholder:text-ink-3 shadow-xs transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filter options"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-sunken text-ink transition hover:bg-line active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4 text-ink-2" />
          </button>
        </form>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line/70 bg-surface p-3 text-xs shadow-sm">
            <span className="font-bold text-ink-2">Filter by:</span>
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(kind === k ? '' : k)}
                className={`rounded-full px-3 py-1 font-bold transition ${
                  kind === k ? 'bg-brand text-on-brand shadow-xs' : 'bg-sunken text-ink-2 hover:bg-line'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category Pills matching Screen 2 with React Icons */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
        {CATEGORY_MAP.map((cat) => {
          const Icon = cat.icon
          const active = kind === cat.id
          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => setKind(active && cat.id !== '' ? '' : cat.id)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                active
                  ? 'border border-brand bg-brand text-on-brand shadow-sm scale-105'
                  : 'border border-line/70 bg-surface text-ink-2 hover:bg-sunken hover:text-ink active:scale-95'
              }`}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Food Grid: 2 columns on mobile (insp.webp), 3 on medium, 4 on large */}
      <section aria-labelledby="dishes-heading" className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="dishes-heading" className="text-xl sm:text-2xl font-black text-ink">
              {kind ? `${kind} Cooking Now` : 'Popular Dishes'}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-ink-3">
              Tap any dish to see ingredients, portion details and customize.
            </p>
          </div>
          <Link to="/app/discover" className="text-xs sm:text-sm font-extrabold text-brand-strong hover:underline">
            See all
          </Link>
        </div>

        {meals.error ? (
          <ErrorState onRetry={meals.retry} />
        ) : meals.loading && !meals.data ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <MealCardSkeleton key={i} />
            ))}
          </div>
        ) : list.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((m) => (
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
            title="Nothing in this category yet"
            text="Try another category or browse all available kitchens."
            action={
              <Button onClick={() => setKind('')} variant="outline">
                Show all dishes
              </Button>
            }
          />
        )}
      </section>

      {/* Verified Student Chefs Section */}
      <section aria-labelledby="chefs-heading" className="space-y-4 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="chefs-heading" className="text-xl sm:text-2xl font-black text-ink">
              Verified Student Chefs
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-ink-3">
              Trusted kitchens cooking at KNUST halls this week.
            </p>
          </div>
          <Link to="/app/discover" className="text-xs sm:text-sm font-extrabold text-brand-strong hover:underline">
            All kitchens
          </Link>
        </div>

        {vendors.loading && !vendors.data ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <VendorCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(vendors.data || []).slice(0, 6).map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
      </section>

      {modal}
    </div>
  )
}
