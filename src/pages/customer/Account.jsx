import { useNavigate } from 'react-router-dom'
import { ChevronRight, Download, Heart, LifeBuoy, LogOut, MapPin, Pencil, ShieldCheck, Store, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Button, Card, Chip, ConfirmDialog, EmptyState, Select, Switch } from '../../components/ui'
import { MealCard, MealCardSkeleton, VendorCard, VendorCardSkeleton, useTray } from '../../components/cards'
import { CAMPUS } from '../../config'
import { useAuth, useFavs, useTheme, useToast } from '../../context/Providers'
import { api } from '../../lib/api'
import { analyticsEnabled, dnt } from '../../lib/analytics'
import { useAsync, useInstall } from '../../lib/hooks'
import { disablePush, enablePush, pushSupported } from '../../lib/push'
import { NAV_DOCS } from '../legal/content'

function Prefs() {
  const toast = useToast()
  const [push, setPush] = useState(localStorage.getItem('stew.push') === '1')
  const [stats, setStats] = useState(analyticsEnabled())
  const togglePush = async (v) => {
    try {
      if (v) await enablePush()
      else await disablePush()
      setPush(v)
    } catch (e) {
      toast(e.message, 'bad')
    }
  }
  const toggleStats = (v) => {
    if (v) localStorage.removeItem('stew.analytics.off')
    else localStorage.setItem('stew.analytics.off', '1')
    setStats(v)
  }
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Order notifications</p>
          <p className="text-xs text-ink-3">{pushSupported ? 'Get told as your pot moves from shopping to ready for pickup.' : 'Not supported on this device or browser.'}</p>
        </div>
        {pushSupported && <Switch checked={push} onChange={togglePush} label="Order notifications" />}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Anonymous usage stats</p>
          <p className="text-xs text-ink-3">{dnt() ? "Your browser's Do Not Track setting is on, so we don't collect any." : 'Helps us improve STEW. No name, phone or ID attached.'}</p>
        </div>
        {!dnt() && <Switch checked={stats} onChange={toggleStats} label="Anonymous usage stats" />}
      </div>
    </Card>
  )
}

/* Your area is not a delivery address - it is where you are coming from, so the chef
   can suggest a meeting point that suits you both. */
function LocationCard() {
  const { user, saveProfile } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [area, setArea] = useState(user?.area || user?.hall || CAMPUS.areas[0])
  const [busy, setBusy] = useState(false)
  const current = user?.area || user?.hall

  const save = async () => {
    setBusy(true)
    try { await saveProfile({ area }); toast('Location updated'); setEditing(false) } catch (e) { toast(e.message, 'bad') } finally { setBusy(false) }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Your hall / area</p>
          <p className="text-xs text-ink-3">Where you are coming from. Used to suggest a meeting point.</p>
        </div>
        {!editing && <Button size="sm" variant="outline" onClick={() => { setArea(current || CAMPUS.areas[0]); setEditing(true) }}><Pencil className="h-3.5 w-3.5" />Change</Button>}
      </div>
      {editing ? (
        <div className="space-y-3">
          <Select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Your hall or area">
            {CAMPUS.areas.map((a) => <option key={a}>{a}</option>)}
          </Select>
          <div className="flex gap-2">
            <Button size="sm" loading={busy} onClick={save}>Save location</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 font-semibold"><MapPin className="h-4 w-4 text-brand-strong" />{current || 'Not set'}</p>
      )}
    </Card>
  )
}

export function Favorites() {
  const { favs } = useFavs()
  const [tab, setTab] = useState('meals')
  const { add, modal } = useTray()
  const meals = useAsync(() => api.meals(), [])
  const vendors = useAsync(() => api.vendors(), [])
  const m = (meals.data || []).filter((x) => favs.includes('m:' + x.id))
  const v = (vendors.data || []).filter((x) => favs.includes('v:' + x.id))
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Favorites</h1>
      <div className="flex gap-2"><Chip active={tab === 'meals'} onClick={() => setTab('meals')}>Meals</Chip><Chip active={tab === 'kitchens'} onClick={() => setTab('kitchens')}>Kitchens</Chip></div>
      {tab === 'meals' ? (
        meals.loading && !meals.data ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <MealCardSkeleton key={i} />
            ))}
          </div>
        ) : m.length ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{m.map((x) => <MealCard key={x.id} meal={x} onAdd={add} />)}</div>
        ) : (
          <EmptyState icon={Heart} title="No favorite meals yet" text="Tap the heart on a meal to save it." action={<Button to="/app/discover">Browse food</Button>} />
        )
      ) : (
        vendors.loading && !vendors.data ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <VendorCardSkeleton key={i} />
            ))}
          </div>
        ) : v.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{v.map((x) => <VendorCard key={x.id} vendor={x} />)}</div>
        ) : (
          <EmptyState icon={Heart} title="No favorite kitchens yet" action={<Button to="/app/discover">Find kitchens</Button>} />
        )
      )}
      {modal}
    </div>
  )
}

export function Account() {
  const { user, logout, deleteAccount } = useAuth()
  const { mode, setMode } = useTheme()
  const { canInstall, install } = useInstall()
  const nav = useNavigate()
  const toast = useToast()
  const [askLogout, setAskLogout] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const initials = (user?.fullName || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()
  const row = 'flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-bold hover:bg-sunken transition'

  const isAdmin = user?.isAdmin || user?.role === 'admin'

  const handleDelete = async () => {
    if (isAdmin) {
      toast('Admin accounts cannot be deleted', 'bad')
      setAskDelete(false)
      return
    }
    setAskDelete(false)
    try {
      await deleteAccount()
      toast('Your account has been deleted')
      nav('/app/signup')
    } catch (e) {
      toast(e.message, 'bad')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-extrabold">Account</h1>
      <Card className="flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-lg font-extrabold text-on-brand">{initials}</span>
        <div className="min-w-0"><p className="font-bold">{user?.fullName}</p><p className="truncate text-sm text-ink-2">{user?.email}</p></div>
      </Card>
      <Card>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-ink-3">Reference ID</dt><dd className="num font-semibold">{user?.referenceId}</dd></div>
          <div><dt className="text-xs text-ink-3">Phone</dt><dd className="num font-semibold">{user?.phone}</dd></div>
        </dl>
      </Card>

      <LocationCard />

      <Card className="space-y-3">
        <label className="block text-xs font-semibold text-ink-2">Appearance
          <Select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1.5"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark (pure black)</option></Select>
        </label>
        {canInstall && <Button variant="soft" className="w-full" onClick={install}><Download className="h-4 w-4" />Install STEW on this device</Button>}
      </Card>

      <Prefs />

      <Card className="p-2">
        <Link to="/app/support" className={row}><span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" />Help & support</span><ChevronRight className="h-4 w-4" /></Link>
        {!isAdmin && (user?.isVendor || user?.role === 'vendor')
          ? <Link to="/app/vendor" className={row}><span className="flex items-center gap-2"><Store className="h-4 w-4" />Your kitchen dashboard</span><ChevronRight className="h-4 w-4" /></Link>
          : !isAdmin
            ? <Link to="/app/vendor/apply" className={row}><span className="flex items-center gap-2"><Store className="h-4 w-4" />Start selling on STEW</span><ChevronRight className="h-4 w-4" /></Link>
            : null}
        {(user?.isAdmin || user?.role === 'admin') && <Link to="/app/admin" className={row}><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Admin console</span><ChevronRight className="h-4 w-4" /></Link>}
      </Card>
      <Card className="p-2">
        {NAV_DOCS.map((d) => <Link key={d.slug} to={`/app/legal/${d.slug}`} className={row}>{d.title}<ChevronRight className="h-4 w-4" /></Link>)}
      </Card>

      <div className="space-y-3 pt-2">
        <Button variant="outline" className="w-full" onClick={() => setAskLogout(true)}><LogOut className="h-4 w-4" />Log out</Button>
        {!isAdmin && (
          <Card className="border-bad/30 bg-bad-soft/20 p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-bad">Danger zone</p>
            <p className="text-xs text-ink-2">Permanently delete your STEW account, profile and stored data.</p>
            <Button variant="danger" size="sm" className="mt-1" onClick={() => setAskDelete(true)}>
              <Trash2 className="h-4 w-4" />Delete account
            </Button>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={askLogout}
        onClose={() => setAskLogout(false)}
        onConfirm={() => { setAskLogout(false); logout(); nav('/app/login') }}
        title="Log out of STEW?"
        confirmLabel="Yes, log out"
      >
        <p className="text-sm text-ink-2">You will need your email and password to get back in. Anything in your tray stays on this device.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={askDelete}
        onClose={() => setAskDelete(false)}
        onConfirm={handleDelete}
        title="Delete your account permanently?"
        confirmLabel="Yes, delete my account"
      >
        <p className="text-sm text-ink-2">
          This will permanently delete your account, saved preferences, and order history on STEW. This action cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  )
}
