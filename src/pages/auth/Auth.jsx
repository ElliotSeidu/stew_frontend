import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Field, Input, Select } from '../../components/ui'
import { CAMPUS } from '../../config'
import { useAuth, useToast } from '../../context/Providers'
import { api, MOCK } from '../../lib/api'
import { track } from '../../lib/analytics'

const emailRe = new RegExp(`^[^\\s@]+@${CAMPUS.emailDomain.replace(/\./g, '\\.')}$`, 'i')
const mailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const codeRules = { required: 'Enter the 6-digit code', pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' } }
const pwRules = {
  required: 'Create a password',
  validate: { len: (v) => v.length >= 8 || 'At least 8 characters', mix: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Use letters and numbers' },
}
// Server-side field errors: { errors: { referenceId: "…" } } map onto the matching input
const serverErrors = (e, setError) => {
  if (e.fields) Object.entries(e.fields).forEach(([k, m]) => setError(k, { message: [].concat(m)[0] }))
  else setError('root', { message: e.message })
}
const RootError = ({ error }) => error ? <p role="alert" className="rounded-lg bg-bad-soft p-3 text-sm font-medium text-bad">{error.message}</p> : null
const MockHint = ({ children }) => MOCK ? <p className="mt-3 rounded-lg bg-warn-soft p-2 text-xs font-semibold text-warn">{children}</p> : null

/* ---------------- Sign up ---------------- */
const ACCOUNT_TYPES = [
  { id: 'customer', title: 'I want to order food', text: 'Browse kitchens, pay in the app and meet the chef. You can apply to sell later from Account.' },
  { id: 'vendor', title: 'I want to sell food', text: 'Open a kitchen on STEW. We will ask about your food and hygiene right after you confirm your email.' },
  { id: 'both', title: 'Both — sell and order', text: 'Run a kitchen and order from other student chefs with the same account.' },
]

// "What do you sell" is free text: the student types their own dishes or categories.
// We keep the raw text for display and split it into a list for the kitchen profile.
const toList = (s) => String(s || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean)
const LIST_HINT = 'Type your own, separated by commas. e.g. Waakye, Jollof, Meat pie'

export function Signup() {
  const auth = useAuth()
  const nav = useNavigate()
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({ mode: 'onTouched', defaultValues: { accountType: 'customer' } })
  const accountType = watch('accountType')
  const selling = accountType === 'vendor' || accountType === 'both'
  useEffect(() => { track('signup_started') }, [])
  const onSubmit = async ({ confirm: _confirm, terms: _terms, ...data }) => {
    try {
      const email = data.email.trim().toLowerCase()
      const wantsVendor = data.accountType === 'vendor' || data.accountType === 'both'
      await auth.register({
        ...data,
        email,
        accountType: data.accountType,
        sells: toList(data.sells),
      })
      sessionStorage.setItem('stew.pending', email)
      if (wantsVendor) sessionStorage.setItem('stew.wantsVendor', '1')
      track('signup_completed')
      nav('/app/verify')
    } catch (e) { serverErrors(e, setError) }
  }
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-extrabold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-2">For {CAMPUS.short} students. We'll email you a code to confirm.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-ink-2">What do you want to do on STEW?</legend>
          <div className="space-y-2">
            {ACCOUNT_TYPES.map((t) => (
              <label key={t.id} className="block cursor-pointer">
                <input type="radio" value={t.id} className="peer sr-only" {...register('accountType', { required: 'Choose one' })} />
                <span className="block rounded-xl border border-line p-3 peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                  <span className="block text-sm font-bold">{t.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-2">{t.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Full name" error={errors.fullName}>
          <Input autoComplete="name" invalid={errors.fullName} {...register('fullName', { required: 'Enter your full name', minLength: { value: 3, message: 'Name is too short' } })} />
        </Field>
        <Field label="KNUST student email" error={errors.email} hint={`Must end with @${CAMPUS.emailDomain}`}>
          <Input type="email" autoComplete="email" placeholder={`name@${CAMPUS.emailDomain}`} invalid={errors.email}
            {...register('email', { required: 'Enter your student email', pattern: { value: emailRe, message: `Use your KNUST email (name@${CAMPUS.emailDomain})` } })} />
        </Field>
        <Field label="Student reference ID" error={errors.referenceId} hint="8 digits">
          <Input inputMode="numeric" maxLength={8} invalid={errors.referenceId}
            {...register('referenceId', {
              required: 'Enter your reference ID',
              pattern: { value: CAMPUS.refIdRe, message: 'Reference ID must be 8 digits' },
              // Checked against the KNUST student list on the server. If the check can't run (offline), the server re-checks on submit.
              validate: async (v) => { try { await api.checkReference({ referenceId: v }); return true } catch (e) { return e.status ? e.message : true } },
            })} />
        </Field>
        <Field label="Phone number" error={errors.phone} hint="e.g. 024 123 4567">
          <Input type="tel" autoComplete="tel" invalid={errors.phone}
            {...register('phone', { required: 'Enter your phone number', setValueAs: (v) => v.replace(/\s/g, ''), pattern: { value: CAMPUS.phoneRe, message: 'Enter a valid Ghana mobile number' } })} />
        </Field>
        <Field label={selling ? 'Where will you cook from?' : 'Hall / area'} error={errors.hall}>
          <Select invalid={errors.hall} defaultValue="" {...register('hall', { required: 'Choose your hall or area' })}>
            <option value="" disabled>Select…</option>
            {CAMPUS.areas.map((h) => <option key={h}>{h}</option>)}
          </Select>
        </Field>

        {selling && (
          <div className="space-y-4 rounded-xl border border-brand/40 bg-brand-soft p-3">
            <p className="text-xs font-semibold text-brand-strong">About your kitchen</p>
            <Field label="Kitchen name" error={errors.kitchenName} hint="The name students will see">
              <Input invalid={errors.kitchenName} placeholder="e.g. Auntie Ama's Waakye Hub"
                {...register('kitchenName', { required: 'Give your kitchen a name', minLength: { value: 3, message: 'Too short' } })} />
            </Field>
            <Field label="What do you sell?" error={errors.sells} hint={LIST_HINT}>
              <Input invalid={errors.sells} placeholder="Waakye, Jollof, Meat pie"
                {...register('sells', {
                  required: 'Tell us what you sell',
                  validate: (v) => toList(v).length > 0 || 'Add at least one item',
                })} />
            </Field>
            <p className="text-xs text-ink-2">You can add prices, stock and photos for each item from your kitchen dashboard.</p>
          </div>
        )}

        <Field label="Password" error={errors.password} hint="At least 8 characters, with letters and numbers">
          <Input type="password" autoComplete="new-password" invalid={errors.password} {...register('password', pwRules)} />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <Input type="password" autoComplete="new-password" invalid={errors.confirm}
            {...register('confirm', { required: 'Confirm your password', validate: (v) => v === watch('password') || 'Passwords do not match' })} />
        </Field>
        <div>
          <label className="flex items-start gap-2 text-sm text-ink-2">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[#06b6d4]" {...register('terms', { required: 'You must accept to continue' })} />
            <span>I agree to the <Link to="/app/legal/terms" className="font-semibold text-brand-strong underline">Terms</Link> and <Link to="/app/legal/privacy" className="font-semibold text-brand-strong underline">Privacy Policy</Link>.</span>
          </label>
          {errors.terms && <p role="alert" className="mt-1 text-xs font-medium text-bad">{errors.terms.message}</p>}
        </div>
        <RootError error={errors.root} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>
      <MockHint>Mock mode: reference ID 00000000 is rejected, to show the student-list check.</MockHint>
      <p className="mt-5 text-center text-sm text-ink-2">Already have an account? <Link to="/app/login" className="font-bold text-brand-strong">Log in</Link></p>
    </Card>
  )
}

/* ---------------- Verify email ---------------- */
export function Verify() {
  const email = sessionStorage.getItem('stew.pending')
  const nav = useNavigate()
  const auth = useAuth()
  const toast = useToast()
  const [left, setLeft] = useState(30)
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm()
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  if (!email) return <Navigate to="/app/signup" replace />
  const [name, host] = email.split('@')
  const onSubmit = async ({ code }) => {
    try {
      await auth.verify({ email, code })
      sessionStorage.removeItem('stew.pending')
      const wantsVendor = sessionStorage.getItem('stew.wantsVendor') === '1'
      sessionStorage.removeItem('stew.wantsVendor')
      // Verifying the code signs the new account straight in: no second login step.
      const u = await auth.loginWithCode({ email, code })
      const isSelling = u.isVendor || u.role === 'vendor' || wantsVendor
      toast(isSelling ? 'Welcome! Tell us about your kitchen next.' : 'Welcome to STEW!')
      if (isSelling) nav('/app/vendor/apply', { replace: true })
      else nav('/app', { replace: true })
    } catch (e) { setError('code', { message: e.message }) }
  }
  const resend = async () => {
    try { await auth.resend({ email }); setLeft(30); toast('New code sent') } catch (e) { toast(e.message, 'bad') }
  }
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-extrabold">Check your email</h1>
      <p className="mt-1 text-sm text-ink-2">We sent a 6-digit code to <strong className="text-ink">{name.slice(0, 2)}***@{host}</strong>. Confirming it signs you in.</p>
      <MockHint>Mock mode: use code 123456</MockHint>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <Field label="Verification code" error={errors.code}>
          <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" className="text-center text-2xl font-bold tracking-[0.5em]" invalid={errors.code} {...register('code', codeRules)} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting}>Verify and continue</Button>
      </form>
      <div className="mt-4 text-center text-sm text-ink-2">
        {left > 0 ? <>Resend code in <span className="num font-bold">{left}s</span></> : <button type="button" onClick={resend} className="font-bold text-brand-strong">Resend code</button>}
      </div>
      <p className="mt-3 text-center text-sm"><Link to="/app/signup" className="text-ink-2 underline">Wrong email? Start over</Link></p>
    </Card>
  )
}

/* ---------------- Login (password or emailed code) ---------------- */
function useGoHome() {
  const nav = useNavigate()
  const loc = useLocation()
  const newVendor = !!loc.state?.wantsVendor
  return (u) => {
    if (u.isAdmin || u.role === 'admin') return nav('/app/admin', { replace: true })
    if (u.accountType === 'vendor') {
      const needsSetup = newVendor || !u.kitchenName
      return nav(needsSetup ? '/app/vendor/apply' : '/app/vendor', { replace: true })
    }
    if (u.accountType === 'both') {
      if (loc.state?.from && !loc.state.from.startsWith('/app/login')) return nav(loc.state.from, { replace: true })
      const needsSetup = newVendor || !u.kitchenName
      return nav(needsSetup ? '/app/vendor/apply' : '/app/vendor', { replace: true })
    }
    if (u.isVendor || u.role === 'vendor') {
      const needsSetup = newVendor || !u.kitchenName
      return nav(needsSetup ? '/app/vendor/apply' : '/app/vendor', { replace: true })
    }
    return nav(loc.state?.from || '/app', { replace: true })
  }
}

function PasswordLogin() {
  const auth = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const goHome = useGoHome()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: loc.state?.email || '' } })
  const onSubmit = async (d) => {
    const email = d.email.trim().toLowerCase()
    try { goHome(await auth.login({ email, password: d.password })) } catch (e) {
      if (e.code === 'unverified') { sessionStorage.setItem('stew.pending', email); nav('/app/verify') } else setError('root', { message: e.message })
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
      <Field label="Email" error={errors.email}>
        <Input type="email" autoComplete="email" invalid={errors.email} {...register('email', { required: 'Enter your email', pattern: { value: mailRe, message: 'Enter a valid email' } })} />
      </Field>
      <Field label="Password" error={errors.password}>
        <Input type="password" autoComplete="current-password" invalid={errors.password} {...register('password', { required: 'Enter your password' })} />
      </Field>
      <div className="text-right"><Link to="/app/forgot" className="text-sm font-semibold text-brand-strong">Forgot password?</Link></div>
      <RootError error={errors.root} />
      <Button type="submit" className="w-full" loading={isSubmitting}>Log in</Button>
    </form>
  )
}

function CodeLogin() {
  const auth = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const goHome = useGoHome()
  const [email, setEmail] = useState('')
  const a = useForm()
  const b = useForm()
  const request = async (d) => {
    const e = d.email.trim().toLowerCase()
    try { await api.requestLoginCode({ email: e }); setEmail(e); toast('Code sent if the account exists') } catch (err) { a.setError('root', { message: err.message }) }
  }
  const enter = async (d) => {
    try { goHome(await auth.loginWithCode({ email, code: d.code })) } catch (err) {
      if (err.code === 'unverified') { sessionStorage.setItem('stew.pending', email); nav('/app/verify') } else b.setError('code', { message: err.message })
    }
  }
  if (!email) {
    return (
      <form onSubmit={a.handleSubmit(request)} noValidate className="mt-6 space-y-4">
        <Field label="Email" error={a.formState.errors.email}>
          <Input type="email" autoComplete="email" invalid={a.formState.errors.email} {...a.register('email', { required: 'Enter your email', pattern: { value: mailRe, message: 'Enter a valid email' } })} />
        </Field>
        <RootError error={a.formState.errors.root} />
        <Button type="submit" className="w-full" loading={a.formState.isSubmitting}>Email me a login code</Button>
      </form>
    )
  }
  return (
    <form onSubmit={b.handleSubmit(enter)} noValidate className="mt-6 space-y-4">
      <p className="text-sm text-ink-2">Enter the 6-digit code we sent to <strong className="text-ink">{email}</strong>.</p>
      <Field label="Login code" error={b.formState.errors.code}>
        <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" className="text-center text-2xl font-bold tracking-[0.5em]" invalid={b.formState.errors.code} {...b.register('code', codeRules)} />
      </Field>
      <Button type="submit" className="w-full" loading={b.formState.isSubmitting}>Log in</Button>
      <button type="button" onClick={() => setEmail('')} className="block w-full text-center text-sm text-ink-2 underline">Use a different email</button>
    </form>
  )
}

export function Login() {
  const [mode, setMode] = useState('password')
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-extrabold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-2">Log in with your KNUST email.</p>
      {mode === 'password' ? <PasswordLogin /> : <CodeLogin />}
      <button type="button" onClick={() => setMode(mode === 'password' ? 'code' : 'password')} className="mt-4 w-full rounded-lg border border-line py-2.5 text-sm font-semibold hover:bg-sunken">
        {mode === 'password' ? 'Email me a login code instead' : 'Use my password instead'}
      </button>
      <MockHint>Mock mode: try demo@ / vendor@ / admin@ / both@{CAMPUS.emailDomain} (any password), code 123456.</MockHint>
      <p className="mt-5 text-center text-sm text-ink-2">New to STEW? <Link to="/app/signup" className="font-bold text-brand-strong">Create an account</Link></p>
    </Card>
  )
}

/* ---------------- Forgot / reset password ---------------- */
export function ForgotPassword() {
  const nav = useNavigate()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm()
  const onSubmit = async ({ email }) => {
    const e = email.trim().toLowerCase()
    try { await api.forgot({ email: e }); sessionStorage.setItem('stew.reset', e); nav('/app/reset') } catch (err) { setError('root', { message: err.message }) }
  }
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-extrabold">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-2">Enter your email and we'll send you a code.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" invalid={errors.email} {...register('email', { required: 'Enter your email', pattern: { value: mailRe, message: 'Enter a valid email' } })} />
        </Field>
        <RootError error={errors.root} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Send reset code</Button>
      </form>
      <p className="mt-5 text-center text-sm"><Link to="/app/login" className="font-semibold text-brand-strong">Back to log in</Link></p>
    </Card>
  )
}

export function ResetPassword() {
  const email = sessionStorage.getItem('stew.reset')
  const nav = useNavigate()
  const toast = useToast()
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({ mode: 'onTouched' })
  if (!email) return <Navigate to="/app/forgot" replace />
  const onSubmit = async (d) => {
    try {
      await api.reset({ email, code: d.code, password: d.password })
      sessionStorage.removeItem('stew.reset')
      toast('Password updated. Please log in.')
      nav('/app/login', { state: { email } })
    } catch (e) { serverErrors(e, setError) }
  }
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-extrabold">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-2">If an account exists for <strong className="text-ink">{email}</strong>, we've sent a code.</p>
      <MockHint>Mock mode: use code 123456</MockHint>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <Field label="Code" error={errors.code}>
          <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} invalid={errors.code} {...register('code', codeRules)} />
        </Field>
        <Field label="New password" error={errors.password} hint="At least 8 characters, with letters and numbers">
          <Input type="password" autoComplete="new-password" invalid={errors.password} {...register('password', pwRules)} />
        </Field>
        <Field label="Confirm new password" error={errors.confirm}>
          <Input type="password" autoComplete="new-password" invalid={errors.confirm} {...register('confirm', { required: 'Confirm your password', validate: (v) => v === watch('password') || 'Passwords do not match' })} />
        </Field>
        <RootError error={errors.root} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Update password</Button>
      </form>
    </Card>
  )
}
