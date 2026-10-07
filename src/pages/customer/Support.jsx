import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { CircleCheck, CreditCard, PackageX, ShieldAlert, Truck, UtensilsCrossed } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Select, Textarea } from '../../components/ui'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { timeAgo } from '../../lib/utils'

const TYPES = [
  { id: 'missing', label: 'Missing item', icon: PackageX },
  { id: 'wrong', label: 'Wrong item', icon: UtensilsCrossed },
  { id: 'late', label: 'Late or not delivered', icon: Truck },
  { id: 'payment', label: 'Payment issue', icon: CreditCard },
  { id: 'safety', label: 'Food safety concern', icon: ShieldAlert },
]
const FAQ = [
  ['How do refunds work?', 'Open your order, tap "Report a problem" and pick what happened. Our Refund Policy lists what is covered.'],
  ['My MoMo payment was taken but the order failed', 'Report it under "Payment issue" with the order number and MoMo reference.'],
  ['The kitchen cancelled my order', 'You will not be charged for a cancelled order. If you were, report a payment issue.'],
  ['I think my food made me ill', 'If you feel unwell, get medical help first. Then report a food safety concern here so we can act quickly.'],
]

export function Support() {
  const cases = useAsync(() => api.cases(), [])
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Help & support</h1>
        <p className="mt-1 text-sm font-semibold text-ink-2">Need assistance with an order, payment, or kitchen on campus?</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TYPES.map((t) => (
          <Link
            key={t.id}
            to={`/app/support/new?type=${t.id}`}
            className="group rounded-3xl border border-line/70 bg-surface p-5 shadow-xs transition hover:border-brand/50 hover:shadow-sm hover:scale-[1.02] active:scale-95"
          >
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${t.id === 'safety' ? 'bg-bad-soft text-bad' : 'bg-brand-soft text-brand-strong'}`}>
              <t.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-black text-ink group-hover:text-brand-strong">{t.label}</span>
          </Link>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-black text-ink">Your cases</h2>
        {cases.loading && !cases.data ? (
          <ul className="space-y-2">
            {[1, 2].map((i) => (
              <li key={i} className="flex items-center justify-between rounded-2xl border border-line/70 bg-surface p-4 shadow-xs">
                <div className="space-y-1.5">
                  <div className="h-4 w-28 animate-pulse rounded bg-sunken" />
                  <div className="h-3 w-40 animate-pulse rounded bg-sunken" />
                </div>
                <div className="h-6 w-14 animate-pulse rounded-full bg-sunken" />
              </li>
            ))}
          </ul>
        ) : (cases.data || []).length ? (
          <ul className="space-y-2">
            {cases.data.map((c) => (
              <li key={c.code} className="flex items-center justify-between rounded-2xl border border-line/70 bg-surface p-4 text-sm shadow-xs">
                <span>
                  <span className="num font-black text-ink">{c.code}</span>
                  <span className="block text-xs font-semibold text-ink-3">
                    {TYPES.find((t) => t.id === c.type)?.label} · {timeAgo(c.createdAt)}
                  </span>
                </span>
                <Badge tone={c.type === 'safety' ? 'bad' : 'brand'}>{c.type === 'safety' ? 'Priority' : 'Open'}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs font-semibold text-ink-3">No open cases.</p>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-black text-ink">Common questions</h2>
        <div className="space-y-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-2xl border border-line/70 bg-surface p-4 shadow-xs">
              <summary className="cursor-pointer font-bold text-ink">{q}</summary>
              <p className="mt-2 text-sm font-medium text-ink-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}

export function NewCase() {
  const [sp] = useSearchParams()
  const orders = useAsync(() => api.orders(), [])
  const [done, setDone] = useState(null)
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({
    mode: 'onTouched',
    defaultValues: { orderId: sp.get('order') || '', type: sp.get('type') || '', description: '' },
  })
  const type = watch('type')
  const onSubmit = async (d) => {
    try {
      const c = await api.createCase({ orderId: d.orderId, type: d.type, description: d.description, files: Array.from(d.files || []).map((f) => f.name) })
      setDone(c)
    } catch (e) { setError('root', { message: e.message }) }
  }
  if (done) return (
    <div className="mx-auto max-w-md"><EmptyState icon={CircleCheck} title="Report submitted" text={`Your case number is ${done.code}. We'll update you in the app.`} action={<Button to="/app/support">Back to support</Button>} /></div>
  )
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Report a problem</h1>
        <p className="mt-1 text-sm font-semibold text-ink-2">Tell us what went wrong and we will help resolve it.</p>
      </div>
      <Card className="rounded-3xl border border-line/70 bg-surface p-6 shadow-xs space-y-4">
        <Field label="Which order?" error={errors.orderId}>
          <Select invalid={errors.orderId} {...register('orderId', { required: 'Choose an order' })}>
            <option value="">{orders.loading ? 'Loading orders…' : 'Select an order…'}</option>
            {(orders.data || []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} · {o.vendorName}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="mb-2 text-xs font-bold text-ink-2">What happened?</legend>
          <div className="grid gap-2">
            {TYPES.map((t) => (
              <label key={t.id} className="cursor-pointer">
                <input
                  type="radio"
                  value={t.id}
                  className="peer sr-only"
                  {...register('type', { required: 'Choose an issue type' })}
                />
                <span className="flex items-center gap-3 rounded-2xl border border-line/70 p-3.5 text-sm font-bold peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand-strong transition hover:bg-sunken">
                  <t.icon className="h-4 w-4 shrink-0" />
                  {t.label}
                </span>
              </label>
            ))}
          </div>
          {errors.type && <p role="alert" className="mt-1.5 text-xs font-semibold text-bad">{errors.type.message}</p>}
        </fieldset>
        {type === 'safety' && (
          <div role="alert" className="rounded-2xl bg-bad-soft p-4 text-xs font-bold text-bad">
            Food safety reports are escalated as priority. If you feel unwell, please seek medical help now.
          </div>
        )}
        <Field label="Describe the issue" error={errors.description} hint="At least 20 characters">
          <Textarea
            invalid={errors.description}
            className="rounded-2xl"
            {...register('description', {
              required: 'Please describe the issue',
              minLength: { value: 20, message: 'Add a few more details (20+ characters)' },
              maxLength: { value: 1000, message: 'Max 1000 characters' },
            })}
          />
        </Field>
        <Field label="Photo evidence (up to 3)" error={errors.files}>
          <input
            type="file"
            accept="image/*"
            multiple
            className="block w-full text-xs font-semibold file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-bold file:text-brand-strong cursor-pointer"
            {...register('files', { validate: (f) => !f || f.length <= 3 || 'Max 3 photos' })}
          />
        </Field>
      </Card>
      {errors.root && (
        <p role="alert" className="rounded-2xl bg-bad-soft p-3 text-xs font-semibold text-bad">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full !rounded-full shadow-md" loading={isSubmitting}>
        Submit report
      </Button>
    </form>
  )
}
