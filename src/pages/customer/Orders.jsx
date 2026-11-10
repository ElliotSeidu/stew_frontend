import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Bell, CalendarClock, Check, ChefHat, CircleCheck, Copy, Lock,
  MessageSquare, Package, ReceiptText, ShoppingBasket, Star, Wallet,
} from 'lucide-react'
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, Modal, Price, Stars, Textarea } from '../../components/ui'
import { OrderCardSkeleton } from '../../components/cards'
import { CANCEL_WINDOW, PICKUP_SLOTS, feeFor, niceDay } from '../../config'
import { useCart, useToast } from '../../context/Providers'
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

/* Notes back and forth with the kitchen: meeting spot, allergies, pepper level, running late. */
function OrderThread({ order, from, onSent }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)
  const toast = useToast()
  const messages = order.messages || []
  const prevCountRef = useRef(messages.length)

  useEffect(() => {
    if (listRef.current && messages.length !== prevCountRef.current) {
      prevCountRef.current = messages.length
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages.length])

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
      <div>
        <h2 className="flex items-center gap-2 font-bold"><MessageSquare className="h-4 w-4 text-brand-strong" />Message the kitchen</h2>
        <p className="mt-0.5 text-xs text-ink-3">Chat with {order.vendorName} here to decide where and when to meet for pickup, or ask about pepper and allergies.</p>
      </div>
      {messages.length ? (
        <ul ref={listRef} className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-sunken p-3">
          {messages.map((m, i) => (
            <li key={i} className={'max-w-[85%] rounded-xl px-3 py-2 text-sm ' + (m.from === from ? 'ml-auto bg-brand text-on-brand' : 'bg-surface text-ink')}>
              <span className="block">{m.text}</span>
              <span className="mt-0.5 block text-[10px] opacity-70">{m.from === from ? 'You' : 'Kitchen'} · {timeAgo(m.at)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-ink-3">No messages yet. Send a message to agree on a public meeting place for pickup.</p>}
      <form onSubmit={send} className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="e.g. Let's meet at Commercial Area pharmacy at 5pm" aria-label="Message the kitchen" />
        <Button type="submit" size="sm" loading={busy} disabled={!text.trim()}>Send</Button>
      </form>
    </Card>
  )
}

export function Orders() {
  const [tab, setTab] = useState('active')
  const orders = useAsync(() => api.orders(), [])
  useEffect(() => { const t = setInterval(() => orders.retry(true), 4000); return () => clearInterval(t) }, [orders.retry])
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
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  if (order.collectedAt || order.status === 'delivered') return null

  const confirmed = async () => {
    setBusy(true)
    try {
      await api.markCollected(order.id)
      toast('Food received! Payment has been released to the chef. Please rate your meal.')
      setConfirm(false)
      await onDone?.()
      nav(`/app/orders/${order.id}/review`)
    } catch (e) {
      toast(e.message, 'bad')
      setConfirm(false)
    } finally { setBusy(false) }
  }

  const copyCode = () => {
    if (!order.handoffCode) return
    navigator.clipboard?.writeText(order.handoffCode)
    toast('6-digit pickup code copied!')
  }

  const ready = orderStage(order) === 'ready'
  return (
    <Card className="space-y-4 border-brand/40 bg-brand-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 font-bold text-brand-strong">
            <Wallet className="h-4 w-4" />Held in STEW Escrow · {money(order.total)}
          </h2>
          <p className="text-sm text-ink-2">
            STEW is holding your payment safely. Once you receive your food, confirm below or give your 6-digit pickup code to {order.vendorName} so STEW releases {money(order.subtotal)} to the chef.
          </p>
        </div>
        {order.handoffCode && (
          <div className="flex items-center gap-2 rounded-2xl border border-brand/30 bg-surface px-3.5 py-2 text-center shadow-2xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Pickup Code</p>
              <p className="num text-xl font-extrabold tracking-widest text-brand-strong">{order.handoffCode}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={copyCode} aria-label="Copy pickup code" title="Copy code">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-xs text-ink-3">
          {ready
            ? 'Your order is marked ready for pickup!'
            : 'Already met the chef and received your food? You can confirm below right away.'}
        </p>
        <Button onClick={() => setConfirm(true)}>
          I received my food · Release payment
        </Button>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Confirm you received your food?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(false)}>Not yet</Button>
            <Button loading={busy} onClick={confirmed}>Yes, I received it — pay the chef</Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          This tells STEW to immediately release <span className="num font-bold">{money(order.subtotal)}</span> to {order.vendorName}, and then takes you to rate your meal. Only confirm once the food is actually in your hands.
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
  const { data: o, error, retry } = useAsync(() => api.order(id), [id])
  const [paying, setPaying] = useState(false)
  const [payStage, setPayStage] = useState(null)
  const prev = useRef(null)

  useEffect(() => {
    let alive = true
    settlePendingPayment().then((done) => {
      if (alive && done) {
        toast('Payment received! STEW is holding your payment until you collect your food.')
        retry()
      }
    })
    return () => { alive = false }
  }, [retry, toast])

  useEffect(() => { const t = setInterval(() => retry(true), 3000); return () => clearInterval(t) }, [retry])
  // Follow the chef's progress taps, not elapsed time.
  useEffect(() => {
    if (!o) return
    const stage = o.prepStage || 'accepted'
    if (prev.current && prev.current !== stage && MSG[stage]) {
      if (document.hidden) notifyLocal(`Order ${o.id}`, MSG[stage], `/app/orders/${o.id}`)
      else toast(MSG[stage])
      if (stage === 'collected' && !o.reviewed) {
        nav(`/app/orders/${o.id}/review`)
      }
    }
    prev.current = stage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o?.prepStage])

  const payNow = async () => {
    if (!o) return
    setPaying(true)
    try {
      const res = await payForOrder(o, { onStatus: setPayStage })
      if (res?.pending) return
      toast('Payment received! STEW is holding your money until you receive your food.')
      retry()
    } catch (e) {
      if (e.code !== 'closed') toast(e.message, 'bad')
      else toast('Payment window was closed', 'bad')
    } finally {
      setPaying(false)
      setPayStage(null)
    }
  }

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

      {ps === 'pending' && !cancelled && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-warn/40 bg-warn-soft">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-warn"><Lock className="mr-1 inline h-4 w-4" />Complete your Paystack payment to confirm this order</p>
            <p className="text-xs text-warn">STEW holds your money in escrow until you receive your food.</p>
          </div>
          <Button size="sm" loading={paying} onClick={payNow}>
            {payStage === 'verifying' ? 'Confirming…' : payStage === 'awaiting-approval' ? 'Approve prompt…' : `Pay with Paystack · ${money(o.total)}`}
          </Button>
        </Card>
      )}
      {sp.get('paid') === '1' && ps === 'paid' && (
        <div className="rounded-xl bg-ok-soft p-4 text-sm font-semibold text-ok">
          Payment received via Paystack! STEW is holding {money(o.total)} in escrow until you confirm you received your food.
        </div>
      )}

      <CancelBox order={o} onDone={retry} />

      {ps === 'paid' && !cancelled && <ConfirmCollection order={o} onDone={retry} />}
      {ps === 'released' && !cancelled && (
        <Card className="space-y-3 border-ok/40 bg-ok-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ok">
                Food received · {money(o.subtotal)} released to {o.vendorName}
              </p>
              <p className="text-xs text-ink-2">
                Confirmed on {new Date(o.collectedAt || Date.now()).toLocaleDateString()}.
              </p>
            </div>
            {!o.reviewed ? (
              <Button size="sm" to={`/app/orders/${o.id}/review`}>
                <Star className="h-4 w-4" />Rate your meal
              </Button>
            ) : (
              <Badge tone="ok">Meal rated</Badge>
            )}
          </div>
        </Card>
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
      </Card>

      {!cancelled && <OrderThread order={o} from="student" onSent={retry} />}

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
        {o.status === 'delivered' && !o.reviewed ? (
          <Button to={`/app/orders/${o.id}/review`}>Rate your meal</Button>
        ) : o.reviewed ? (
          <Button disabled>Meal rated</Button>
        ) : (
          <Button disabled>Rate after collection</Button>
        )}
      </div>
    </div>
  )
}

/* Standalone payment page removed: payments happen on the spot via Paystack at checkout or inline on OrderDetail. */
export function PayOrder() {
  const { id } = useParams()
  return <Navigate to={`/app/orders/${id}`} replace />
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
