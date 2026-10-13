import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { read, write, uid } from '../lib/utils'

const ThemeCtx = createContext()
const AuthCtx = createContext()
const CartCtx = createContext()
const FavCtx = createContext()
const ToastCtx = createContext()

export const useTheme = () => useContext(ThemeCtx)
export const useAuth = () => useContext(AuthCtx)
export const useCart = () => useContext(CartCtx)
export const useFavs = () => useContext(FavCtx)
export const useToast = () => useContext(ToastCtx)

function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('stew.theme') || 'system')
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const d = mode === 'dark' || (mode === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', d)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', d ? '#000000' : '#06B6D4')
      setDark(d)
    }
    apply()
    localStorage.setItem('stew.theme', mode)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [mode])
  return <ThemeCtx.Provider value={{ mode, setMode, dark }}>{children}</ThemeCtx.Provider>
}

function ToastProvider({ children }) {
  const [list, setList] = useState([])
  const toast = useCallback((msg, tone = 'ok') => {
    const id = uid()
    setList((l) => [...l, { id, msg, tone }])
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {list.map((t) => (
          <div key={t.id} className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${t.tone === 'bad' ? 'bg-bad text-on-solid' : 'bg-ink text-canvas'}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => read('stew.me'))
  useEffect(() => {
    if (localStorage.getItem('stew.token')) api.me().then((u) => { setUser(u); write('stew.me', u) }).catch(() => {})
  }, [])
  const start = (r) => {
    localStorage.setItem('stew.token', r.access)
    write('stew.me', r.user)
    setUser(r.user)
    return r.user
  }
  const value = useMemo(() => ({
    user,
    register: api.register,
    verify: api.verify,
    resend: api.resend,
    login: async (c) => start(await api.login(c)),
    loginWithCode: async (c) => start(await api.loginWithCode(c)),
    updateUser: (u) => { write('stew.me', u); setUser(u); return u },
    // A vendor account can also order food, and a customer can apply to start selling.
    // These flags are what the route guard and the Account screen read.
    isVendor: !!(user?.isVendor || user?.role === 'vendor'),
    isAdmin: !!(user?.isAdmin || user?.role === 'admin'),
    becomeVendor: () => {
      const u = { ...read('stew.me'), isVendor: true, role: 'vendor' }
      write('stew.me', u)
      setUser(u)
      return u
    },
    saveProfile: async (patch) => {
      const u = await api.updateMe(patch)
      write('stew.me', u)
      setUser(u)
      return u
    },
    logout: () => {
      localStorage.removeItem('stew.token')
      localStorage.removeItem('stew.me')
      setUser(null)
    },
    deleteAccount: async () => {
      try { await api.deleteAccount() } catch {}
      localStorage.removeItem('stew.token')
      localStorage.removeItem('stew.me')
      localStorage.removeItem('stew.cart')
      setUser(null)
    },
  }), [user])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

const EMPTY = { vendorId: null, lines: [] }
function CartProvider({ children }) {
  const [cart, setCart] = useState(() => read('stew.cart', EMPTY))
  useEffect(() => write('stew.cart', cart), [cart])
  const value = useMemo(() => ({
    cart,
    count: cart.lines.reduce((s, l) => s + l.qty, 0),
    subtotal: cart.lines.reduce((s, l) => s + l.qty * l.meal.price, 0),
    vendorName: cart.lines[0]?.meal.vendorName,
    add: (meal, qty = 1, note = '') => {
      if (cart.vendorId && cart.vendorId !== meal.vendorId) return 'conflict'
      const cap = typeof meal.left === 'number' ? meal.left : Infinity
      if (cap <= 0) return 'sold_out'
      setCart((c) => {
        const ex = c.lines.find((l) => l.meal.id === meal.id)
        const target = ex ? Math.min(cap, ex.qty + qty) : Math.min(cap, qty)
        const lines = ex
          ? c.lines.map((l) => (l.meal.id === meal.id ? { ...l, qty: target, note: note || l.note } : l))
          : [...c.lines, { meal, qty: target, note }]
        return { vendorId: meal.vendorId, lines }
      })
      return 'ok'
    },
    replace: (meal, qty = 1, note = '') => {
      const cap = typeof meal.left === 'number' ? meal.left : Infinity
      const target = Math.min(cap, qty)
      setCart({ vendorId: meal.vendorId, lines: [{ meal, qty: target, note }] })
    },
    load: (lines) => setCart(lines.length ? { vendorId: lines[0].meal.vendorId, lines } : EMPTY),
    setQty: (id, qty) => setCart((c) => {
      const lines = c.lines.map((l) => {
        if (l.meal.id !== id) return l
        const cap = typeof l.meal.left === 'number' ? l.meal.left : Infinity
        return { ...l, qty: Math.min(cap, qty) }
      }).filter((l) => l.qty > 0)
      return { vendorId: lines.length ? c.vendorId : null, lines }
    }),
    setNote: (id, note) => setCart((c) => ({ ...c, lines: c.lines.map((l) => (l.meal.id === id ? { ...l, note } : l)) })),
    clear: () => setCart(EMPTY),
  }), [cart])
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

function FavProvider({ children }) {
  const [favs, setFavs] = useState(() => read('stew.favs', []))
  useEffect(() => write('stew.favs', favs), [favs])
  const value = useMemo(() => ({
    favs,
    isFav: (k) => favs.includes(k),
    toggle: (k) => setFavs((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k])),
  }), [favs])
  return <FavCtx.Provider value={value}>{children}</FavCtx.Provider>
}

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <FavProvider>{children}</FavProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
