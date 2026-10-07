import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Bell, CalendarClock, Check, ChefHat, CircleCheck, Handshake, Info, Lock, MapPin,
  MessageSquare, Package, ReceiptText, ShieldCheck, ShoppingBasket, Wallet,
} from 'lucide-react'
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, Modal, Price, Stars, Textarea } from '../../components/ui'
import { OrderCardSkeleton } from '../../components/cards'
import { CANCEL_WINDOW, MEET_SPOTS, PICKUP_SLOTS, SAFETY_POINTS, feeFor, MOMO, niceDay } from '../../config'
import { useAuth, useCart, useToast } from '../../context/Providers'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { PREP_STAGES, stageIndex } from '../../lib/mockData'
import { notifyLocal } from '../../lib/push'
import { payForOrder, settlePendingPayment } from '../../lib/payments'
import { money, timeAgo } from '../../lib/utils'

const LABEL = { preparing: 'Cooking in progress', ready: 'Ready for pickup', delivered: 'Collected', cancelled: 'Cancelled' }
const TONE = { preparing: 'warn', ready: 'ok', delivered: 'mute', cancelled: 'bad' }
const MSG = {
  shopping: 'Your chef is buying ingredients',
  cooking: 'Your pot is on the fire',
  packing: 'Your food is being packed',
  ready: 'Ready for pickup — time to meet',
  collected: 'Collected. Enjoy!',
  cancelled: 'Order cancelled',
}
const PAY_LABEL = {
  pending: 'Not paid',
  paid: 'Held by STEW',
  released: 'Released to the chef',
  refund_pending: 'Refund pending',
  cancelled: 'No charge',
  refunded: 'Refunded',
}
const PAY_TONE = { pending: 'warn', paid: 'brand', released: 'ok', refund_pending: 'bad', cancelled: 'mute', refunded: 'ok' }
const finished = (s) => s === 'delivered' || s === 'cancelled'
const slotLabel = (id) => PICKUP_SLOTS.find((s) => s.id === id)?.label

const payStatus = (o) => o?.payment?.status || 'pending'
const orderStage = (o) => o?.prepStage || 'accepted'

/* The student's window into the pot: the same five steps the chef taps through. */
const STAGE_ICON = { accepted: Check, shopping: ShoppingBasket, cooking: ChefHat, packing: Package, ready: Bell, collected: CircleCheck }

function PrepTracker({ order }) {
  const cur = stageIndex(orderStage(order))
  return (
    <ol className="space-y-2">
      {PREP_STAGES.map((s, i) => {
        const Icon = STAGE_ICON[s.id]
        const done = i < cur
        const active = i === cur
        return (
          <li key={s.id} className="flex items-start gap-3">
            <span className={
              'grid h-7 w-7 shrink-0 place-items-center rounded-full ' +
              (done ? 'bg-ok text-on-solid' : active ? 'bg-brand text-on-brand' : 'bg-sunken text-ink-3')
            }>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={'block text-sm ' + (done || active ? 'font-bold' : 'text-ink-3')}>{s.label}</span>
              {active && <span className="block text-xs text-ink-2">{s.note}</span>}
              {order.prepAt?.[s.id] && <span className="block text-[11px] text-ink-3">{timeAgo(order.prepAt[s.id])}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* Notes back and forth with the kitchen: allergies, pepper level, running late. */
function OrderThread({ order, from, onSent }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const messages = order.messages || []
  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try { await api.sendMessage(order.id, { text, from }); setText(''); onSent?.() }
    catch (err) { toast(err.message, 'bad') }
    finally { setBusy(false) }
  }
  return (
    <Card className="space-y-3">
      <h2 className="flex items-center gap-2 font-bold"><MessageSquare className="h-4 w-4 text-brand-strong" />Message the kitchen</h2>
      {messages.length ? (
        <ul className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-sunken p-3">
          {messages.map((m, i) => (
            <li key={i} className={'max-w-[85%] rounded-xl px-3 py-2 text-sm ' + (m.from === from ? 'ml-auto bg-brand text-on-brand' : 'bg-surface text-ink')}>
              <span className="block">{m.text}</span>
              <span className="mt-0.5 block text-[10px] opacity-70">{m.from === from ? 'You' : 'Kitchen'} · {timeAgo(m.at)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-ink-3">No messages yet. Ask about pepper, allergies or timing.</p>}
      <form onSubmit={send} className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="e.g. Please make it small pepper" aria-label="Message the kitchen" />
        <Button type="submit" size="sm" loading={busy} disabled={!text.trim()}>Send</Button>
      </form>
    </Card>
  )
}

export function Orders() {
  const [tab, setTab] = useState('active')
  const orders = useAsync(() => api.orders(), [])
  useEffect(() => { const t = setInterval(orders.retry, 8000); return () => clearInterval(t) }, [orders.retry])
  const list = (orders.data || []).filter((o) => (tab === 'active') === !finished(o.status))
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">Orders</h1>
      <div className="flex gap-2"><Chip active={tab === 'active'} onClick={() => setTab('active')}>Active</Chip><Chip active={tab === 'history'} onClick={() => setTab('history')}>History</Chip></div>
      {orders.error ? <ErrorState onRetry={orders.retry} /> : orders.loading && !orders.data ? (
        <ul className="space-y-3">{[1, 2, 3].map((i) => <OrderCardSkeleton key={i} />)}</ul>
      ) : list.length ? (
        <ul className="space-y-3">
          {list.map((o) => (
            <li key={o.id}>
              <Link to={`/app/orders/${o.id}`} className="block rounded-3xl border border-line/70 bg-surface p-5 shadow-xs transition hover:border-brand/40 hover:bg-surface hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="num text-sm font-bold">{o.id}</span>
                  <span className="flex gap-1">
                    <Badge tone={PAY_TONE[payStatus(o)]}>{PAY_LABEL[payStatus(o)]}</Badge>
                    <Badge tone={TONE[o.status]}>{LABEL[o.status]}</Badge>
                  </span>
                </div>
                <p className="mt-1 font-bold">{o.vendorName}</p>
                <p className="truncate text-sm text-ink-2">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-ink-3">
                  <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{niceDay(o.pickupDay)}</span>
                  <Price v={o.total} className="text-sm text-ink" />
                </div>
                <p className="mt-1 text-xs font-semibold text-brand-strong">
                  {PREP_STAGES[stageIndex(orderStage(o))].label}
                </p>
                {o.meetup?.agreed && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-ok"><Handshake className="h-3.5 w-3.5" />Meeting at {o.meetup.place}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={ReceiptText} title={tab === 'active' ? 'No active orders' : 'No past orders yet'} action={<Button to="/app/discover">Find food</Button>} />}
    </div>
  )
}

/* The student's confirmation is what releases the chef's money. Until they tap this,
   STEW keeps holding the payment. */
function ConfirmCollection({ order, onDone }) {
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  if (order.collectedAt) return null

  const confirmed = async () => {
    setBusy(true)
    try {
      await api.markCollected(order.id)
      toast('Thanks! The chef has been paid.')
      setConfirm(false)
      onDone()
    } catch (e) {
      toast(e.message, 'bad')
      setConfirm(false)
    } finally { setBusy(false) }
  }

  const ready = orderStage(order) === 'ready'
  return (
    <Card className="space-y-3 border-brand/40 bg-brand-soft">
      <h2 className="flex items-center gap-2 font-bold text-brand-strong">
        <Wallet className="h-4 w-4" />Your money is being held
      </h2>
      <p className="text-sm text-ink-2">
        STEW is holding {money(order.total)} for this order. The chef is paid only after you
        confirm you collected your food — so if something goes wrong, your money is still here.
      </p>
      {ready ? (
        <Button onClick={() => setConfirm(true)}>I collected my food</Button>
      ) : (
        <p className="text-xs text-ink-3">
          You can confirm once your chef marks the order ready for pickup.
        </p>
      )}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Confirm you collected your food?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(false)}>Not yet</Button>
            <Button loading={busy} onClick={confirmed}>Yes, I have it</Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          This tells STEW to release {money(order.subtotal)} to {order.vendorName}. Only confirm
          once the food is actually in your hands. If something was wrong, report a problem
          instead so we can hold the money while we look into it.
        </p>
      </Modal>
    </Card>
  )
}

function CancelBox({ order, onDone }) {
  const toast = useToast()
  const [left, setLeft] = useState(() => Math.max(0, CANCEL_WINDOW - Math.floor((Date.now() - order.createdAt) / 1000)))
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  if (orderStage(order) !== 'accepted' || left <= 0) return null
  const cancel = async () => {
    setBusy(true)
    try { await api.cancelOrder(order.id); toast('Order cancelled'); setConfirm(false); onDone() } catch (e) { toast(e.message, 'bad'); setConfirm(false); onDone() } finally { setBusy(false) }
  }
  return (
    <Card className="flex items-center justify-between gap-3 border-warn/40 bg-warn-soft">
      <p className="text-sm text-warn">Changed your mind? You can cancel for <span className="num font-bold">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>, as long as the kitchen hasn't started.</p>
      <Button size="sm" variant="outline" onClick={() => setConfirm(true)}>Cancel order</Button>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Cancel this order?"
        footer={<><Button variant="outline" onClick={() => setConfirm(false)}>Keep order</Button><Button variant="danger" loading={busy} onClick={cancel}>Yes, cancel</Button></>}>
        <p className="text-sm text-ink-2">The kitchen will be told right away. If you already paid, the refund goes back to the MoMo number you paid with.</p>
      </Modal>
    </Card>
  )
}

/* The student and the chef must both confirm the same place. Until then the order
   stays unagreed and we keep nudging them. */
function MeetupPanel({ order, onDone, role }) {
  const toast = useToast()
  const [place, setPlace] = useState(order.meetup?.place || '')
  const [note, setNote] = useState(order.meetup?.note || '')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(!order.meetup?.place)
  const m = order.meetup
  const mine = role || 'student'
  const iConfirmed = !!m?.confirmedBy?.includes(mine)

  const run = async (fn, ok) => {
    setBusy(true)
    try { await fn(); toast(ok); onDone() } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-brand-strong" />Meeting point</h2>
        {m?.agreed ? <Badge tone="ok"><Handshake className="h-3 w-3" />Agreed</Badge> : <Badge tone="warn">Not agreed yet</Badge>}
      </div>

      {m?.place && !editing ? (
        <>
          <p className="text-lg font-extrabold">{m.place}</p>
          {m.note && <p className="text-sm text-ink-2">{m.note}</p>}
          <p className="text-xs text-ink-3">
            Suggested by {m.proposedBy === 'vendor' ? 'the chef' : 'you'} {timeAgo(m.proposedAt)} ·{' '}
            confirmed by {m.confirmedBy?.length ? m.confirmedBy.map((r) => (r === 'vendor' ? 'the chef' : 'you')).join(' and ') : 'nobody yet'}
          </p>
          <div className="flex flex-wrap gap-2">
            {!iConfirmed && <Button size="sm" loading={busy} onClick={() => run(() => api.confirmMeetup(order.id), 'Meeting point confirmed')}>Confirm this place</Button>}
            {iConfirmed && !m.agreed && <p className="text-sm text-ink-2">Waiting for the other person to confirm.</p>}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Suggest a different place</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-2">Choose a busy, public, well-lit place. You can suggest your own.</p>
          <div className="flex flex-wrap gap-2">
            {MEET_SPOTS.map((s) => <Chip key={s} active={place === s} onClick={() => setPlace(s)}>{s}</Chip>)}
          </div>
          <Field label="Meeting point">
            <Input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={80} placeholder="Type the exact place, e.g. Commercial Area, by the pharmacy" />
          </Field>
          <Field label="Details for the other person (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="e.g. I'll be by the blue kiosk" />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" loading={busy} disabled={place.trim().length < 3} onClick={() => run(() => api.proposeMeetup(order.id, { place: place.trim(), note: note.trim(), proposedBy: mine }), 'Meeting point sent')}>Send meeting point</Button>
            {m?.place && <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </>
      )}

      <ul className="list-disc space-y-1 border-t border-line pt-3 pl-5 text-xs text-ink-3">
        {SAFETY_POINTS.map((s) => <li key={s}>{s}</li>)}
      </ul>
    </Card>
  )
}

function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="h-8 w-40 animate-pulse rounded bg-sunken" />
        <div className="flex gap-1.5">
          <div className="h-6 w-20 animate-pulse rounded-full bg-sunken" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-sunken" />
        </div>
      </div>
      <Card className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-xl bg-sunken" />
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-sunken" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 animate-pulse rounded bg-sunken" />
                <div className="h-3 w-48 animate-pulse rounded bg-sunken" />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-3">
        <div className="h-5 w-36 animate-pulse rounded bg-sunken" />
        <div className="space-y-2 py-2">
          <div className="flex justify-between"><div className="h-4 w-40 animate-pulse rounded bg-sunken" /><div className="h-4 w-16 animate-pulse rounded bg-sunken" /></div>
          <div className="flex justify-between"><div className="h-4 w-32 animate-pulse rounded bg-sunken" /><div className="h-4 w-14 animate-pulse rounded bg-sunken" /></div>
        </div>
        <div className="flex justify-between border-t border-line pt-2"><div className="h-5 w-24 animate-pulse rounded bg-sunken" /><div className="h-5 w-20 animate-pulse rounded bg-sunken" /></div>
      </Card>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="h-10 animate-pulse rounded-lg bg-sunken" />
        <div className="h-10 animate-pulse rounded-lg bg-sunken" />
        <div className="h-10 animate-pulse rounded-lg bg-sunken" />
      </div>
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const cart = useCart()
  const toast = useToast()
  const { user } = useAuth()
  const { data: o, error, loading, retry } = useAsync(() => api.order(id), [id])
  const prev = useRef(null)
  useEffect(() => { const t = setInterval(retry, 5000); return () => clearInterval(t) }, [retry])
  // Follow the chef's progress taps, not elapsed time.
  useEffect(() => {
    if (!o) return
    const stage = o.prepStage || 'accepted'
    if (prev.current && prev.current !== stage && MSG[stage]) {
      if (document.hidden) notifyLocal(`Order ${o.id}`, MSG[stage], `/app/orders/${o.id}`)
      else toast(MSG[stage])
    }
    prev.current = stage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o?.prepStage])

  const reorder = async () => {
    const meals = await api.meals()
    const lines = o.lines.map((l) => ({ meal: meals.find((m) => m.id === l.mealId), qty: l.qty, note: l.note || '' })).filter((l) => l.meal)
    cart.load(lines)
    toast('Items added to your tray')
    nav('/app/cart')
  }
  if (error && !o) return <ErrorState message={error.message} onRetry={retry} />
  if (!o) return <OrderDetailSkeleton />
  const cancelled = o.status === 'cancelled'
  const ps = payStatus(o)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Order <span className="num">{o.id}</span></h1>
        <span className="flex gap-1"><Badge tone={PAY_TONE[ps]}>{PAY_LABEL[ps]}</Badge><Badge tone={TONE[o.status]}>{LABEL[o.status]}</Badge></span>
      </div>

      {o.handoffCode && !cancelled && o.status !== 'delivered' && (
        <Card className="border-brand/40 bg-brand-soft p-4 text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-strong">Pickup Verification Code</p>
          <p className="num text-3xl font-extrabold tracking-widest text-brand-strong">{o.handoffCode}</p>
          <p className="text-xs text-ink-2">Show or read this 6-digit code to the chef at collection to verify handoff.</p>
        </Card>
      )}

      {ps !== 'paid' && !cancelled && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-warn/40 bg-warn-soft">
          <p className="text-sm font-semibold text-warn"><Lock className="mr-1 inline h-4 w-4" />This order is not paid yet. Pay in the app to confirm it with the kitchen.</p>
          <Button size="sm" to={`/app/orders/${o.id}/pay`}>Pay now · {money(o.total)}</Button>
        </Card>
      )}
      {sp.get('paid') === '1' && ps !== 'pending' && (
        <div className="rounded-xl bg-ok-soft p-4 text-sm font-semibold text-ok">
          Payment received. STEW is holding {money(o.total)} until you confirm you collected your food.
        </div>
      )}

      <CancelBox order={o} onDone={retry} />

      {ps === 'paid' && !cancelled && <ConfirmCollection order={o} onDone={retry} />}
      {ps === 'released' && !cancelled && (
        <div className="rounded-xl bg-ok-soft p-4 text-sm font-semibold text-ok">
          Thanks — you confirmed collection on {new Date(o.collectedAt).toLocaleDateString()}, and {money(o.subtotal)} was released to {o.vendorName}.
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sunken p-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <CalendarClock className="h-4 w-4 text-brand-strong" />
            Collect {niceDay(o.pickupDay)}
          </span>
          {o.pickupSlot && <span className="text-xs text-ink-2">{slotLabel(o.pickupSlot)}</span>}
        </div>
        {cancelled
          ? <p className="text-center text-sm font-semibold text-bad">This order was cancelled.</p>
          : <PrepTracker order={o} />}
        {loading && <p className="sr-only" aria-live="polite">Updating</p>}
      </Card>

      {!cancelled && <OrderThread order={o} from="student" onSent={retry} />}

      {!cancelled && <MeetupPanel order={o} onDone={retry} role={user?.role === 'vendor' ? 'vendor' : 'student'} />}

      <Card>
        <h2 className="font-bold">{o.vendorName}</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {o.lines.map((l) => <li key={l.mealId} className="flex justify-between py-2"><span>{l.qty}× {l.name}{l.note && <em className="block text-xs text-ink-3">“{l.note}”</em>}</span><span className="num">{money(l.price * l.qty)}</span></li>)}
        </ul>        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink-2">Subtotal</dt><dd className="num">{money(o.subtotal ?? o.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-2">STEW service fee (5%)</dt><dd className="num">{money(o.fee ?? feeFor(o.subtotal ?? o.total))}</dd></div>
          <div className="flex justify-between font-bold"><dt>Total paid</dt><dd className="num">{money(o.total)}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-ink-3">Coming from: {o.area || o.hall}{o.contactNote ? ` · ${o.contactNote}` : ''}</p>
        {o.payment?.reference && <p className="mt-1 text-xs text-ink-3">Payment reference: <span className="num">{o.payment.reference}</span></p>}
      </Card>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="outline" onClick={reorder}>Order again</Button>
        <Button variant="outline" to={`/app/support/new?order=${o.id}`}>Report a problem</Button>
        {o.status === 'delivered' ? <Button to={`/app/orders/${o.id}/review`}>Rate order</Button> : <Button disabled>Rate order</Button>}
      </div>
    </div>
  )
}

function PayOrderSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="h-8 w-56 animate-pulse rounded bg-sunken" />
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 animate-pulse rounded bg-sunken" />
          <div className="h-4 w-32 animate-pulse rounded bg-sunken" />
        </div>
        <div className="divide-y divide-line">
          <div className="flex justify-between py-2"><div className="h-4 w-36 animate-pulse rounded bg-sunken" /><div className="h-4 w-16 animate-pulse rounded bg-sunken" /></div>
          <div className="flex justify-between py-2"><div className="h-4 w-28 animate-pulse rounded bg-sunken" /><div className="h-4 w-16 animate-pulse rounded bg-sunken" /></div>
        </div>
        <div className="flex justify-between"><div className="h-4 w-20 animate-pulse rounded bg-sunken" /><div className="h-4 w-16 animate-pulse rounded bg-sunken" /></div>
        <div className="flex justify-between border-t border-line pt-2"><div className="h-5 w-20 animate-pulse rounded bg-sunken" /><div className="h-5 w-24 animate-pulse rounded bg-sunken" /></div>
      </Card>
      <Card className="space-y-3">
        <div className="h-5 w-44 animate-pulse rounded bg-sunken" />
        <div className="h-4 w-full animate-pulse rounded bg-sunken" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-sunken" />
      </Card>
      <div className="h-12 w-full animate-pulse rounded-xl bg-sunken" />
    </div>
  )
}

/* Payment step. Paystack handles the MoMo prompt; we only ever hold the public key. */
export function PayOrder() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data: o, error, loading, retry } = useAsync(() => api.order(id), [id])
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState(null)

  // Returning from a hosted Paystack page? finish the verification then refresh.
  useEffect(() => {
    let alive = true
    settlePendingPayment().then((done) => { if (alive && done) { toast('Payment received'); retry() } })
    return () => { alive = false }
  }, [retry, toast])

  const pay = async () => {
    setBusy(true)
    try {
      const res = await payForOrder(o, { onStatus: setStage })
      if (res?.pending) return // browser is navigating to Paystack
      toast('Payment received')
      nav(`/app/orders/${id}?paid=1`, { replace: true })
    } catch (e) {
      if (e.code !== 'closed') toast(e.message, 'bad')
      else toast('Payment not completed', 'bad')
    } finally { setBusy(false); setStage(null) }
  }

  if (error && !o) return <ErrorState message={error.message} onRetry={retry} />
  if (!o) return <PayOrderSkeleton />
  const ps = payStatus(o)
  const fee = o.fee ?? feeFor(o.subtotal ?? o.total)

  if (ps === 'paid') return (
    <div className="mx-auto max-w-lg space-y-4">
      <EmptyState icon={Wallet} title="Already paid" text={`This order was paid in the app. Reference ${o.payment?.reference || '—'}.`} action={<Button to={`/app/orders/${id}`}>Back to order</Button>} />
    </div>
  )

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-extrabold">Pay for this order</h1>
      {sp.get('new') && <div className="rounded-xl bg-ok-soft p-4 text-sm font-semibold text-ok">Order created. Pay now so the kitchen can start cooking.</div>}
      <Card className="space-y-3">
        <div className="flex items-center justify-between"><span className="text-ink-2">Kitchen</span><span className="font-bold">{o.vendorName}</span></div>
        <ul className="divide-y divide-line text-sm">
          {o.lines.map((l) => <li key={l.mealId} className="flex justify-between py-2"><span>{l.qty}× {l.name}</span><span className="num">{money(l.price * l.qty)}</span></li>)}
        </ul>
        <div className="flex justify-between text-sm"><span className="text-ink-2">Subtotal</span><span className="num">{money(o.subtotal ?? o.total)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-ink-2">STEW service fee (5%)</span><span className="num">{money(fee)}</span></div>
        <div className="flex justify-between border-t border-line pt-2 font-bold"><span>Total</span><Price v={o.total} className="text-lg" /></div>
      </Card>

      <Card className="space-y-2">
        <h2 className="flex items-center gap-2 font-bold"><Wallet className="h-4 w-4 text-brand-strong" />Pay by Mobile Money</h2>
        <p className="text-sm text-ink-2">
          Tap the button below and approve the prompt on your phone. You can pay with {MOMO.map((m) => m.label).join(', ')}.
        </p>
        <p className="rounded-lg bg-sunken p-3 text-xs text-ink-3">
          <Info className="mr-1 inline h-3.5 w-3.5" />
          STEW holds your money and only pays the chef after you confirm you collected your food.
          Never send Mobile Money to the chef directly.
        </p>
      </Card>

      <div className="flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-xs text-warn">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Agree the meeting point with the chef on the order page and meet somewhere busy and public. Paying in the app is what protects you if something goes wrong.</p>
      </div>

      <Button size="lg" className="w-full" loading={busy} onClick={pay}>
        {stage === 'verifying' ? 'Confirming payment…' : stage === 'awaiting-approval' ? 'Waiting for your approval…' : `Pay ${money(o.total)}`}
      </Button>
      <Link to={`/app/orders/${id}`} className="block text-center text-sm font-semibold text-ink-2 underline">I'll pay later</Link>
      {loading && <p className="sr-only" aria-live="polite">Updating</p>}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="h-8 w-44 animate-pulse rounded bg-sunken" />
      <div className="h-4 w-36 animate-pulse rounded bg-sunken" />
      <Card className="space-y-4">
        <div>
          <div className="mb-2 h-3 w-16 animate-pulse rounded bg-sunken" />
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-8 animate-pulse rounded-full bg-sunken" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 h-3 w-28 animate-pulse rounded bg-sunken" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-sunken" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 h-3 w-32 animate-pulse rounded bg-sunken" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-sunken" />
        </div>
      </Card>
      <div className="h-11 w-full animate-pulse rounded-xl bg-sunken" />
    </div>
  )
}

const TAGS = ['Tasty', 'Good portion', 'Fresh', 'Hot', 'Fast', 'Good value']
export function Review() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const order = useAsync(() => api.order(id), [id])
  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { rating: 0, tags: [], text: '' } })
  if (order.loading && !order.data) return <ReviewSkeleton />
  if (order.data && order.data.status !== 'delivered')
    return <EmptyState title="Not ready to review yet" text="You can rate this order once it has been handed over." action={<Button to={`/app/orders/${id}`}>Back to order</Button>} />
  const onSubmit = async (d) => { await api.createReview({ orderId: id, ...d }); toast('Thanks for your review!'); nav(`/app/orders/${id}`) }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-extrabold">Rate your meal</h1>
      <p className="text-sm text-ink-2">{order.data?.vendorName} · <span className="num">{id}</span></p>
      <Card className="space-y-4">
        <div>
          <p className="mb-1 text-xs font-semibold text-ink-2">Overall</p>
          <Controller name="rating" control={control} rules={{ validate: (v) => v > 0 || 'Please choose a rating' }} render={({ field }) => <Stars value={field.value} onChange={field.onChange} size="h-8 w-8" />} />
          {errors.rating && <p role="alert" className="text-xs font-medium text-bad">{errors.rating.message}</p>}
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-ink-2">What went well?</legend>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <label key={t} className="cursor-pointer"><input type="checkbox" value={t} className="peer sr-only" {...register('tags')} />
                <span className="block rounded-full border border-line px-3.5 py-2 text-xs font-semibold peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand">{t}</span></label>
            ))}
          </div>
        </fieldset>
        <Field label="Comment (optional)" error={errors.text}>
          <Textarea maxLength={500} invalid={errors.text} {...register('text', { maxLength: { value: 500, message: 'Max 500 characters' } })} />
        </Field>
      </Card>
      <Button type="submit" className="w-full" loading={isSubmitting}>Submit review</Button>
    </form>
  )
}
