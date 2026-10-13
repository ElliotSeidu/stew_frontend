import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Heart, MapPin, ThumbsUp } from 'lucide-react'
import { Button, Card, EmptyState, ErrorState, Food, KitchenLogo, Price, Skeleton, Verified, Badge, Stars } from '../../components/ui'
import { useTray } from '../../components/cards'
import { useFavs } from '../../context/Providers'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { cx, timeAgo } from '../../lib/utils'

function VendorPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-20 animate-pulse rounded-full bg-sunken" />
      <Card className="rounded-3xl border border-line/70 bg-surface p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-sunken" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-sunken" />
            <div className="h-4 w-28 animate-pulse rounded bg-sunken" />
            <div className="flex gap-2 pt-1">
              <div className="h-5 w-24 animate-pulse rounded-full bg-sunken" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-sunken" />
            </div>
            <div className="h-3 w-full animate-pulse rounded bg-sunken" />
          </div>
        </div>
      </Card>
      <section className="space-y-3">
        <div className="h-6 w-20 animate-pulse rounded bg-sunken" />
        <ul className="divide-y divide-line/70 rounded-3xl border border-line/70 bg-surface">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-stretch gap-3 p-4">
              <div className="aspect-[4/3] w-24 shrink-0 animate-pulse rounded-2xl bg-sunken sm:w-28" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-sunken" />
                <div className="h-3 w-full animate-pulse rounded bg-sunken" />
                <div className="h-4 w-16 animate-pulse rounded bg-sunken" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default function VendorPage() {
  const { id } = useParams()
  const vendor = useAsync(() => api.vendor(id), [id])
  const meals = useAsync(() => api.meals(), [])
  const reviews = useAsync(() => api.reviews({ vendorId: id }), [id])
  const { openDetail, modal } = useTray()
  const { isFav, toggle } = useFavs()
  const v = vendor.data
  const list = (meals.data || []).filter((m) => m.vendorId === id)

  if (vendor.error) return <ErrorState message={vendor.error.message} onRetry={vendor.retry} />
  if (!v) return <VendorPageSkeleton />

  return (
    <div className="space-y-6">
      <Link to="/app/discover" className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to food
      </Link>

      {/* Kitchen Profile Card */}
      <Card className="rounded-3xl border border-line/70 bg-surface p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <KitchenLogo vendor={v} size="h-20 w-20 sm:h-24 sm:w-24" className="rounded-2xl shadow-sm" text="text-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-ink">{v.name}</h1>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-ink-2">
                  <MapPin className="h-3.5 w-3.5 text-brand-strong" />
                  {v.hall}
                </p>
              </div>
              <button
                type="button"
                aria-pressed={isFav('v:' + v.id)}
                aria-label="Favorite kitchen"
                onClick={() => toggle('v:' + v.id)}
                className="grid h-10 w-10 place-items-center rounded-full bg-sunken shadow-xs transition hover:scale-105 active:scale-95"
              >
                <Heart className={cx('h-5 w-5', isFav('v:' + v.id) ? 'fill-bad text-bad' : 'text-ink-3')} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Verified />
              <Badge tone={v.open ? 'ok' : 'mute'}>{v.open ? 'Cooking now' : 'Closed'}</Badge>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-strong">
                <ThumbsUp className="h-3.5 w-3.5" />
                {v.rating} <span className="font-semibold text-ink-3">({v.reviews || (reviews.data || []).length || 0})</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
                <Clock className="h-3.5 w-3.5 text-brand-strong" />~{v.prep} min prep
              </span>
            </div>
            {v.bio && <p className="mt-3 text-xs sm:text-sm font-medium text-ink-2 leading-relaxed">{v.bio}</p>}
          </div>
        </div>
      </Card>

      {/* Menu Section */}
      <section aria-labelledby="menu" className="space-y-3">
        <h2 id="menu" className="text-xl sm:text-2xl font-black text-ink">
          Menu & Weekly Pots
        </h2>
        {meals.loading && !meals.data ? (
          <ul className="divide-y divide-line/70 rounded-3xl border border-line/70 bg-surface shadow-xs">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-stretch gap-3 p-4">
                <div className="aspect-[4/3] w-24 shrink-0 animate-pulse rounded-2xl bg-sunken sm:w-28" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-sunken" />
                  <div className="h-3 w-full animate-pulse rounded bg-sunken" />
                  <div className="h-4 w-16 animate-pulse rounded bg-sunken" />
                </div>
              </li>
            ))}
          </ul>
        ) : list.length ? (
          <ul className="divide-y divide-line/70 rounded-3xl border border-line/70 bg-surface shadow-xs">
            {list.map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-4 hover:bg-sunken/40 transition">
                <button
                  type="button"
                  onClick={() => openDetail(m)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Food meal={m} frame="aspect-[4/3]" className="w-24 shrink-0 rounded-2xl sm:w-28 shadow-xs" />
                  <span className="min-w-0">
                    <span className="block font-black text-sm sm:text-base text-ink">{m.name}</span>
                    <span className="block truncate text-xs font-medium text-ink-2">{m.desc}</span>
                    <span className="mt-1 flex items-center gap-2">
                      <Price v={m.price} className="text-sm font-black" />
                      {m.left > 0 && m.left <= 5 && <Badge tone="warn" className="text-[10px]">{m.left} left</Badge>}
                      {m.left === 0 && <Badge tone="bad" className="text-[10px]">Sold out</Badge>}
                    </span>
                  </span>
                </button>
                <Button
                  size="sm"
                  className="self-center shrink-0 !rounded-full !h-8 !px-4 text-xs font-black"
                  disabled={!v.open || m.left === 0}
                  onClick={() => openDetail(m)}
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No items yet" text="This kitchen hasn't added dishes to the menu yet." />
        )}
      </section>

      {/* Reviews Section */}
      <section aria-labelledby="reviews" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="reviews" className="text-xl sm:text-2xl font-black text-ink">
            Customer Reviews
          </h2>
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-brand-strong">
            <ThumbsUp className="h-4 w-4" />
            {v.rating} <span className="font-semibold text-ink-3">({v.reviews || (reviews.data || []).length || 0})</span>
          </span>
        </div>
        {reviews.loading && !reviews.data ? (
          <Skeleton className="h-28" />
        ) : (reviews.data || []).length ? (
          <ul className="space-y-3">
            {reviews.data.map((r, i) => (
              <li key={i} className="rounded-3xl border border-line/70 bg-surface p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Stars value={r.rating} size="h-4 w-4" />
                    <span className="text-xs font-bold">{r.rating}.0</span>
                  </div>
                  <span className="text-[11px] font-semibold text-ink-3">{timeAgo(r.createdAt)}</span>
                </div>
                {r.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <span key={t} className="rounded-full bg-sunken px-2.5 py-0.5 text-[11px] font-semibold text-ink-2">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {r.text && <p className="text-xs sm:text-sm font-medium text-ink-2 leading-relaxed">{r.text}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs font-semibold text-ink-3">No reviews yet. Verified students who collect their food can leave a review.</p>
        )}
      </section>

      {modal}
    </div>
  )
}
