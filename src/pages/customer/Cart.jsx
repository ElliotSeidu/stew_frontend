import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarClock, Info, MapPin, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, Field, Food, Input, Price, Qty, Select } from '../../components/ui'
import { CAMPUS, PICKUP_SLOTS, SAFETY_POINTS, cookDays, feeFor } from '../../config'
import { useAuth, useCart } from '../../context/Providers'
import { api } from '../../lib/api'
import { track } from '../../lib/analytics'
import { money } from '../../lib/utils'

/* Shared order maths. The 5% STEW fee is ADDED ON TOP of the menu price, so the
   student pays it and the chef still receives the full menu price. */
export function Summary({ subtotal }) {
  const fee = feeFor(subtotal)
  return (
    <Card className="space-y-2 bg-sunken text-sm">
      <div className="flex justify-between"><span className="text-ink-2">Subtotal</span><span className="num font-semibold">{money(subtotal)}</span></div>
      <div className="flex justify-between"><span className="text-ink-2">STEW service fee (5%)</span><span className="num font-semibold">{money(fee)}</span></div>
      <div className="flex justify-between border-t border-line pt-2 text-base"><span className="font-bold">Total to pay</span><Price v={subtotal + fee} className="text-lg" /></div>
      <p className="pt-1 text-xs text-ink-3">Paid in the app, and held by STEW until you confirm you collected your food. The chef receives the full menu price — the 5% fee is added on top, not taken from them.</p>
    </Card>
  )
}

function SafetyList() {
  return (
    <Card className="space-y-2 border-warn/40 bg-warn-soft">
      <p className="flex items-center gap-2 font-bold text-warn"><ShieldCheck className="h-4 w-4" />Before you meet</p>
      <ul className="list-disc space-y-1 pl-5 text-xs text-warn">
        {SAFETY_POINTS.map((s) => <li key={s}>{s}</li>)}
      </ul>
    </Card>
  )
}

export function Cart() {
  const { cart, subtotal, setQty, setNote, clear, vendorName } = useCart()
  const { user } = useAuth()
  if (!cart.lines.length) return <EmptyState icon={ShoppingBag} title="Your tray is empty" text="Add something delicious from a verified student chef." action={<Button to="/app/discover">Browse food</Button>} />
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-extrabold">Your tray</h1><p className="text-sm text-ink-2">From <Link to={`/app/vendors/${cart.vendorId}`} className="font-semibold text-brand-strong">{vendorName}</Link></p></div>
          <Button variant="ghost" size="sm" onClick={clear}><Trash2 className="h-4 w-4" />Clear</Button>
        </div>
        <ul className="divide-y divide-line/70 rounded-3xl border border-line/70 bg-surface shadow-xs">
          {cart.lines.map((l) => (
            <li key={l.meal.id} className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <Food meal={l.meal} frame="aspect-[4/3]" className="w-20 shrink-0 rounded-2xl sm:w-24 shadow-xs" />
                <div className="flex-1"><p className="font-bold">{l.meal.name}</p><Price v={l.meal.price} className="text-sm text-ink-2" /></div>
                <Price v={l.meal.price * l.qty} />
              </div>
              <div className="flex items-center gap-3">
                <Qty value={l.qty} max={l.meal.left ?? Infinity} onChange={(q) => setQty(l.meal.id, q)} />
                <Input value={l.note} maxLength={80} onChange={(e) => setNote(l.meal.id, e.target.value)} placeholder="Note for chef" aria-label="Note for chef" className="h-9 text-xs" />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-4">
        <Card className="flex items-start gap-3 border-brand/40">
          <MapPin className="mt-0.5 h-5 w-5 text-brand-strong" />
          <div className="text-sm">
            <p className="font-bold">You are coming from</p>
            <p className="text-ink-2">{user?.area || user?.hall}</p>
            <p className="mt-1 text-xs text-ink-3">There is no delivery. You and the chef agree a meeting point after you order.</p>
          </div>
        </Card>
        <Summary subtotal={subtotal} />
        <Button to="/app/checkout" size="lg" className="w-full">Go to checkout</Button>
      </div>
    </div>
  )
}

export function Checkout() {
  const { cart, subtotal, clear, vendorName } = useCart()
  const { user } = useAuth()
  const nav = useNavigate()
  const [safetyOk, setSafetyOk] = useState(false)
  const days = useMemo(() => cookDays(), [])
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      area: user?.area || user?.hall || '',
      contactNote: '',
      phone: user?.phone || '',
      pickupDay: days[0]?.id || '',
      pickupSlot: PICKUP_SLOTS[1].id,
      note: '',
    },
  })
  useEffect(() => { track('checkout_started') }, [])
  if (!cart.lines.length) return <EmptyState icon={ShoppingBag} title="Nothing to check out" action={<Button to="/app/discover">Browse food</Button>} />

  const fee = feeFor(subtotal)
  const total = subtotal + fee

  const onSubmit = async (d) => {
    try {
      const order = await api.createOrder({
        vendorId: cart.vendorId,
        vendorName,
        email: user?.email,
        lines: cart.lines.map((l) => ({ mealId: l.meal.id, name: l.meal.name, price: l.meal.price, qty: l.qty, note: l.note })),
        area: d.area,
        contactNote: d.contactNote,
        phone: d.phone,
        // batch cooking: the chef cooks towards this day
        pickupDay: d.pickupDay,
        pickupSlot: d.pickupSlot,
        orderNote: d.note,
        subtotal,
      })
      clear()
      track('order_placed')
      nav(`/app/orders/${order.id}/pay?new=1`, { replace: true })
    } catch (e) {
      setError('root', { message: e.message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold">Checkout</h1>
          <p className="mt-1 text-sm text-ink-2">Your kitchen cooks this in a batch. Pick the day you will collect it.</p>
        </div>

        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 font-bold"><CalendarClock className="h-4 w-4 text-brand-strong" />Pickup day</h2>
          <p className="rounded-lg bg-sunken p-3 text-xs text-ink-2">
            <Info className="mr-1 inline h-3.5 w-3.5" />
            Your chef needs about a week to shop for ingredients and cook the pot. You will follow the progress in the app.
          </p>
          <Field label="Which day will you collect?" error={errors.pickupDay}>
            <Select invalid={errors.pickupDay} {...register('pickupDay', { required: 'Choose a pickup day' })}>
              {days.map((d) => <option key={d.id} value={d.id}>{d.weekday} {d.date}</option>)}
            </Select>
          </Field>
          <Field label="Roughly what time?" error={errors.pickupSlot}>
            <Select invalid={errors.pickupSlot} {...register('pickupSlot', { required: 'Choose a time' })}>
              {PICKUP_SLOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold">Where you are coming from</h2>
          <p className="rounded-lg bg-sunken p-3 text-xs text-ink-2">
            <Info className="mr-1 inline h-3.5 w-3.5" />
            STEW has no delivery. The exact meeting point is agreed with the chef on the order page.
          </p>
          <Field label="Hall / area" error={errors.area}>
            <Select invalid={errors.area} {...register('area', { required: 'Choose your hall or area' })}>
              {CAMPUS.areas.map((a) => <option key={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="How can the chef recognise you? (optional)" error={errors.contactNote}>
            <Input maxLength={80} placeholder="e.g. blue backpack, Block B porch" {...register('contactNote', { maxLength: { value: 80, message: 'Too long' } })} />
          </Field>
          <Field label="Contact phone" error={errors.phone} hint="Shared with the chef for handover only.">
            <Input type="tel" invalid={errors.phone} {...register('phone', { required: 'Enter your phone', setValueAs: (v) => v.replace(/\s/g, ''), pattern: { value: CAMPUS.phoneRe, message: 'Enter a valid Ghana mobile number' } })} />
          </Field>
          <Field label="Anything the chef should know? (optional)" error={errors.note}>
            <Input maxLength={120} placeholder="e.g. small pepper, no okro" {...register('note', { maxLength: { value: 120, message: 'Too long' } })} />
          </Field>
        </Card>

        <SafetyList />

        <Card className="space-y-3">
          <h2 className="font-bold">Payment</h2>
          <p className="text-sm text-ink-2">
            You will pay <Price v={total} className="text-ink" /> in the app on the next step, by Mobile Money through Paystack.
            STEW holds that money and only pays your chef once you confirm you collected the food.
            Nothing is paid in cash at the meetup, and you should never send Mobile Money to a chef directly.
          </p>
          <label className="flex items-start gap-2 text-sm text-ink-2">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={safetyOk} onChange={(e) => setSafetyOk(e.target.checked)} />
            <span>I have read the meeting safety points above and I will meet in a public, well-lit place.</span>
          </label>
          {!safetyOk && <p className="text-xs text-ink-3">Please confirm the safety points to continue.</p>}
        </Card>
      </div>

      <div className="space-y-4 md:pt-12">
        <Card>
          <p className="text-xs font-semibold text-ink-3">Cooking for you</p>
          <p className="font-bold">{vendorName}</p>
          <ul className="mt-1 space-y-1 text-sm text-ink-2">
            {cart.lines.map((l) => <li key={l.meal.id}>{l.qty}× {l.meal.name}</li>)}
          </ul>
        </Card>
        <Summary subtotal={subtotal} />
        {errors.root && <p role="alert" className="rounded-lg bg-bad-soft p-3 text-sm font-medium text-bad">{errors.root.message}</p>}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={!safetyOk}>Continue to payment · {money(total)}</Button>
        <Link to="/app/cart" className="block text-center text-sm font-semibold text-ink-2 underline">Back to tray</Link>
      </div>
    </form>
  )
}
