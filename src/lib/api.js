import { VENDORS, MEALS } from './mockData'
import { CAMPUS, CANCEL_WINDOW, feeFor, PAYSTACK_PUBLIC_KEY } from '../config'
import { read, write, uid } from './utils'

const BASE = import.meta.env.VITE_API_URL
export const MOCK = !BASE
const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms))

async function http(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('stew.token')
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.detail || data.message || 'Something went wrong'), { code: data.code, status: res.status, fields: data.errors })
  return data
}
const post = (path, body) => http(path, { method: 'POST', body })

const real = {
  register: (p) => post('/auth/register/', p),
  verify: (p) => post('/auth/verify-email/', p),
  resend: (p) => post('/auth/resend-code/', p),
  login: (p) => post('/auth/login/', p),
  forgot: (p) => post('/auth/forgot-password/', p),
  reset: (p) => post('/auth/reset-password/', p),
  requestLoginCode: (p) => post('/auth/login-code/request/', p),
  loginWithCode: (p) => post('/auth/login-code/verify/', p),
  checkReference: (p) => post('/auth/check-reference/', p),
  me: () => http('/auth/me/'),
  updateMe: (p) => http('/auth/me/', { method: 'PATCH', body: p }),
  deleteAccount: () => http('/auth/delete-account/', { method: 'DELETE' }),
  vendors: () => http('/vendors/'),
  vendor: (id) => http(`/vendors/${id}/`),
  meals: () => http('/meals/'),
  createOrder: (p) => post('/orders/', p),
  orders: () => http('/orders/'),
  order: (id) => http(`/orders/${id}/`),
  cancelOrder: (id) => post(`/orders/${id}/cancel/`),

  // --- payments (Paystack) -------------------------------------------------
  // Your backend must: create a Paystack transaction with the SECRET key, return the
  // access_code/reference, then verify with Paystack's /transaction/verify/:reference
  // webhook before marking the order paid. The browser only ever sees the public key.
  initPayment: (p) => post('/payments/initialize/', p),
  verifyPayment: (p) => post('/payments/verify/', p),
  // chef payout ledger: menu price gross, platform fee, net payable
  payouts: () => http('/payouts/'),
  // --- meetup agreement ----------------------------------------------------
  proposeMeetup: (id, p) => post(`/orders/${id}/meetup/propose/`, p),
  confirmMeetup: (id) => post(`/orders/${id}/meetup/confirm/`),
  declineMeetup: (id) => post(`/orders/${id}/meetup/decline/`),

  // Escrow: STEW holds the student's money until they confirm collection, then
  // releases it to the chef. Your back end implements the actual movement of funds.
  markCollected: (id) => post(`/orders/${id}/collected/`),
  nudgeCollection: (id) => post(`/orders/${id}/collection-nudge/`),

  // --- batch cooking progress + customer/chef messages ----------------------
  setPrepStage: (id, stage) => post(`/orders/${id}/prep/`, { stage }),
  sendMessage: (id, p) => post(`/orders/${id}/messages/`, p),

  // --- handoff: the fulfilment completion event (project.md §29.3, §30) ------
  completeByCode: (id, code) => post(`/orders/${id}/complete/`, { code }),

  // --- reviews: done by the back end, never by the browser -------------------
  reviews: (vendorId) => http(`/vendors/${vendorId}/reviews/`),
  moderationQueue: () => http('/admin/reviews/queue/'),
  moderateReview: (orderId, decision, reason) => post(`/admin/reviews/${orderId}/moderate/`, { decision, reason }),

  // --- vendor compliance evidence (FDA permit) ------------------------------
  saveCompliance: (p) => post('/vendor/compliance/', p),
  compliance: () => http('/vendor/compliance/'),
  allCompliance: () => http('/admin/compliance/'),

  // --- payout batches: aggregate settlements, not per-order transfers -------
  payoutBatches: () => http('/payouts/batches/'),
  createPayoutBatch: () => post('/payouts/batches/'),

  createCase: (p) => post('/support/cases/', p),
  cases: () => http('/support/cases/'),
  createReview: (p) => post('/reviews/', p),
  applyVendor: (p) => post('/vendor/apply/', p),
  markVendor: () => post('/vendor/activate/'),
  subscribePush: (p) => post('/notifications/subscribe/', p),
  unsubscribePush: (p) => post('/notifications/unsubscribe/', p),
  // anonymous analytics: no auth header, no cookies
  track: (p) => fetch(BASE + '/analytics/events/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p), keepalive: true, credentials: 'omit' }),
}

// ---------- MOCK (runs when VITE_API_URL is empty). Never ship passwords in localStorage in production. ----------
// Batch cooking means the order's state is whatever the chef's last progress tap said.
// Nothing is inferred from elapsed time: a pot of soup takes a week, not 45 seconds.
const ACTIVE_STAGES = ['accepted', 'shopping', 'cooking', 'packing']
const withStatus = (o) => {
  if (o.cancelledAt) return { ...o, status: 'cancelled' }
  const stage = o.prepStage || 'accepted'
  if (stage === 'collected') return { ...o, status: 'delivered' }
  return { ...o, status: ACTIVE_STAGES.includes(stage) ? 'preparing' : 'ready' }}
const withMeetup = (o) => ({ ...o, meetup: o.meetup || null })
const withBatch = (o) => ({ ...o, prepStage: o.prepStage || 'accepted', messages: o.messages || [] })
const full = (o) => withBatch(withMeetup(withStatus(o)))
const roleFor = (e) => (e.startsWith('admin') ? 'admin' : (e.startsWith('vendor') || e.startsWith('both')) ? 'vendor' : 'customer')
const accountFor = (email) => {
  const u = read('stew.users', []).find((x) => x.email === email)
  if (u) return { isVendor: u.role === 'vendor', isAdmin: u.role === 'admin', ...u }
  if (/^(demo|vendor|admin|both)@/.test(email)) {
    const role = roleFor(email)
    const isBoth = email.startsWith('both')
    const accountType = isBoth ? 'both' : role
    return {
      id: email, fullName: email.split('@')[0], email, role,
      accountType, // 'vendor', 'both', 'admin', 'customer'
      isVendor: role === 'vendor', isAdmin: role === 'admin',
      kitchenName: role === 'vendor' ? "Auntie Ama's Soup Pot" : undefined,
      area: CAMPUS.areas[0], phone: '0240000000', referenceId: '20000000',
    }
  }
  throw new Error('No account found for this email')
}
const session = (u) => {
  // eslint-disable-next-line no-unused-vars
  const { password, ...user } = u
  return { access: 'mock-token', user }
}
const unverified = () => Object.assign(new Error('Please verify your email first'), { code: 'unverified' })
const SAMPLE_ORDERS = [
  {
    id: 'STW-4821',
    vendorId: 'v1',
    vendorName: "Auntie Ama's Soup Pot",
    customer: 'Kofi A.',
    email: 'kofi@st.knust.edu.gh',
    phone: '0240000001',
    area: 'Unity Hall (Conti)',
    lines: [
      { mealId: 'm1', name: 'Palm nut soup (abenkwan)', price: 45, qty: 1, note: 'Extra pepper please' },
      { mealId: 'm11', name: 'Fufu (2 balls)', price: 12, qty: 1, note: '' },
    ],
    subtotal: 57,
    fee: 2.85,
    total: 59.85,
    handoffCode: '482190',
    pickupDay: '2026-10-14',
    pickupSlot: 'afternoon',
    payment: { status: 'paid', provider: 'paystack', reference: 'PSK-48210001', paidAt: Date.now() - 3600_000 * 5 },
    prepStage: 'accepted',
    prepAt: { accepted: Date.now() - 3600_000 * 5 },
    createdAt: Date.now() - 3600_000 * 5,
    meetup: { place: 'Unity Hall main entrance', proposedBy: 'vendor', proposedAt: Date.now() - 3600_000 * 4, confirmedBy: ['vendor'], agreed: false },
    messages: [{ from: 'student', text: 'Please make it small pepper.', at: Date.now() - 3600_000 * 3 }],
  },
  {
    id: 'STW-4822',
    vendorId: 'v2',
    vendorName: "Mama Efua's Kitchen",
    customer: 'Abena M.',
    email: 'abena@st.knust.edu.gh',
    phone: '0240000002',
    area: 'Queen Elizabeth II Hall (Queens)',
    lines: [
      { mealId: 'm3', name: 'Light soup with goat', price: 48, qty: 1, note: '' },
    ],
    subtotal: 48,
    fee: 2.40,
    total: 50.40,
    handoffCode: '482219',
    pickupDay: '2026-10-13',
    pickupSlot: 'evening',
    payment: { status: 'paid', provider: 'paystack', reference: 'PSK-48220002', paidAt: Date.now() - 86400_000 },
    prepStage: 'cooking',
    prepAt: { accepted: Date.now() - 86400_000, shopping: Date.now() - 43200_000, cooking: Date.now() - 7200_000 },
    createdAt: Date.now() - 86400_000,
    meetup: { place: 'Queen Elizabeth II Hall entrance', proposedBy: 'student', proposedAt: Date.now() - 7200_000, confirmedBy: ['student', 'vendor'], agreed: true, agreedAt: Date.now() - 7000_000 },
    messages: [],
  },
  {
    id: 'STW-4820',
    vendorId: 'v1',
    vendorName: "Auntie Ama's Soup Pot",
    customer: 'Kofi A.',
    email: 'kofi@st.knust.edu.gh',
    phone: '0240000001',
    area: 'Unity Hall (Conti)',
    lines: [
      { mealId: 'm2', name: 'Groundnut soup', price: 42, qty: 1, note: '' },
    ],
    subtotal: 42,
    fee: 2.10,
    total: 44.10,
    handoffCode: '482001',
    pickupDay: '2026-10-07',
    pickupSlot: 'morning',
    payment: { status: 'released', provider: 'paystack', reference: 'PSK-48200003', paidAt: Date.now() - 86400_000 * 2, releasedAt: Date.now() - 86400_000 },
    prepStage: 'collected',
    prepAt: { accepted: Date.now() - 86400_000 * 3, shopping: Date.now() - 86400_000 * 2, cooking: Date.now() - 86400_000 * 2, packing: Date.now() - 86400_000, ready: Date.now() - 86400_000, collected: Date.now() - 86400_000 },
    collectedAt: Date.now() - 86400_000,
    settlement: { status: 'released', releasedAt: Date.now() - 86400_000, net: 42 },
    createdAt: Date.now() - 86400_000 * 3,
    meetup: { place: 'Unity Hall main entrance', proposedBy: 'vendor', confirmedBy: ['student', 'vendor'], agreed: true },
    messages: [],
  },
]

const SAMPLE_REVIEWS = [
  { orderId: 'STW-1001', vendorId: 'v1', vendorName: "Auntie Ama's Soup Pot", rating: 5, tags: ['Tasty', 'Good portion', 'Fresh'], text: 'The abenkwan was incredible. Smoked fish and wele were fresh and tender.', createdAt: Date.now() - 86400_000 * 3, moderationStatus: 'visible' },
  { orderId: 'STW-1002', vendorId: 'v1', vendorName: "Auntie Ama's Soup Pot", rating: 5, tags: ['Hot', 'Tasty'], text: 'Groundnut soup was well spiced and delivered hot at Unity hall.', createdAt: Date.now() - 86400_000 * 2, moderationStatus: 'visible' },
  { orderId: 'STW-1003', vendorId: 'v2', vendorName: "Mama Efua's Kitchen", rating: 5, tags: ['Tasty', 'Fast'], text: 'Light soup goat meat is very soft and spicy!', createdAt: Date.now() - 86400_000 * 4, moderationStatus: 'visible' },
  { orderId: 'STW-1004', vendorId: 'v3', vendorName: "Chef Kojo's Stews", rating: 4, tags: ['Good value'], text: 'Very generous chicken portion. Highly recommended for students.', createdAt: Date.now() - 86400_000 * 1, moderationStatus: 'pending' },
]

const getOrders = () => {
  const saved = read('stew.orders', null)
  if (saved === null) {
    write('stew.orders', SAMPLE_ORDERS)
    return SAMPLE_ORDERS
  }
  return saved
}

const getReviews = () => {
  const saved = read('stew.reviews', null)
  if (saved === null) {
    write('stew.reviews', SAMPLE_REVIEWS)
    return SAMPLE_REVIEWS
  }
  return saved
}

const patch = (id, next) => {
  const all = getOrders()
  const o = all.find((x) => x.id === id)
  if (!o) throw new Error('Order not found')
  const merged = { ...o, ...next }
  write('stew.orders', all.map((x) => (x.id === id ? merged : x)))
  return merged
}

// ---------------------------------------------------------------------------
// Audit log
//
// project.md §42 and §21.8 require every privileged and financial action to leave an
// append-only trail. In mock mode it is a capped array in localStorage; on a real back
// end this is an append-only table with a database rule preventing updates or deletes.
// ---------------------------------------------------------------------------
const AUDIT_KEY = 'stew.audit'
export const audit = (actor, action, entityType, entityId, extra = {}) => {
  try {
    const log = read(AUDIT_KEY, [])
    const entry = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor: actor || 'system',
      action,
      entityType,
      entityId,
      at: Date.now(),
      ...extra,
    }
    write(AUDIT_KEY, [entry, ...log].slice(0, 500))
    return entry
  } catch {
    return null
  }
}
export const auditLog = () => read(AUDIT_KEY, [])

// A short code the student shows and the chef enters to prove the handover happened.
// project.md §36 says not to store a plaintext code where a hash will do; a real back end
// should store a hash and compare against it. This is a mock.
const handoffCode = () => String(Math.floor(100000 + Math.random() * 900000))

const mock = {
  async register(p) {
    await wait()
    const users = read('stew.users', [])
    if (users.some((u) => u.email === p.email)) throw Object.assign(new Error('An account with this email already exists'), { fields: { email: 'An account with this email already exists' } })
    // accountType is chosen on the signup form: 'customer', 'vendor', or 'both'
    const wantsVendor = p.accountType === 'vendor' || p.accountType === 'both'
    const kitchen = (p.kitchenName || '').trim()
    write('stew.users', [...users, {
      ...p,
      id: uid(),
      role: wantsVendor ? 'vendor' : 'customer',
      accountType: p.accountType,
      isVendor: wantsVendor,
      isAdmin: false,
      kitchenName: kitchen || undefined,
      sells: p.sells || undefined,
      verified: false,
    }])
    return { email: p.email }
  },
  async verify({ email, code }) {
    await wait()
    if (code !== '123456') throw new Error('Invalid or expired code')
    write('stew.users', read('stew.users', []).map((u) => (u.email === email ? { ...u, verified: true } : u)))
    return { ok: true }
  },
  async resend() { await wait(); return { ok: true } },
  async checkReference({ referenceId }) {
    await wait(250)
    if (referenceId === '00000000') throw Object.assign(new Error('We could not find this reference ID in the KNUST student list'), { status: 404 })
    return { ok: true }
  },
  async login({ email, password }) {
    await wait()
    const u = accountFor(email.toLowerCase())
    if (u.password !== undefined && u.password !== password) throw new Error('Incorrect email or password')
    if (u.verified === false) throw unverified()
    return session(u)
  },
  async requestLoginCode() { await wait(); return { ok: true } },
  async loginWithCode({ email, code }) {
    await wait()
    if (code !== '123456') throw new Error('Invalid or expired code')
    const u = accountFor(email.toLowerCase())
    if (u.verified === false) throw unverified()
    return session(u)
  },
  async forgot() { await wait(); return { ok: true } }, // never reveal whether an account exists
  async reset({ email, code, password }) {
    await wait()
    if (code !== '123456') throw new Error('Invalid or expired code')
    write('stew.users', read('stew.users', []).map((u) => (u.email === email.toLowerCase() ? { ...u, password } : u)))
    return { ok: true }
  },
  async me() {
    const u = read('stew.me')
    if (!u) throw new Error('Unauthorized')
    return u
  },
  async updateMe(p) {
    await wait(300)
    const u = read('stew.me')
    if (!u) throw new Error('Unauthorized')
    const next = { ...u, ...p, area: p.area ?? p.hall ?? u.area }
    write('stew.me', next)
    write('stew.users', read('stew.users', []).map((x) => (x.email === u.email ? { ...x, ...p } : x)))
    return next
  },
  async vendors() { await wait(250); return VENDORS },
  async vendor(id) {
    await wait(200)
    const v = VENDORS.find((x) => x.id === id)
    if (!v) throw new Error('Kitchen not found')
    return v
  },
  async meals() { await wait(300); return MEALS },

  async createOrder(p) {
    await wait(600)
    const subtotal = Number(p.subtotal) || 0
    const fee = feeFor(subtotal)
    const o = {
      ...p,
      id: 'STW-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: Date.now(),
      subtotal,
      fee,
      total: subtotal + fee,
      // The student presents this code at handover; the chef enters it to complete the order.
      // That is the fulfilment completion event required by the spec (§37 invariant 2).
      handoffCode: handoffCode(),
      // money moves in the app: the chef is never handed cash at the meetup
      payment: { status: 'pending', provider: 'paystack', reference: null, paidAt: null },
      meetup: null,
      // batch cooking: the chef taps through these so the student can follow progress
      prepStage: 'accepted',
      prepAt: { accepted: Date.now() },
      messages: [],
    }
    write('stew.orders', [o, ...getOrders()])
    audit(p.email || 'customer', 'order_created', 'order', o.id, { after: { total: o.total, vendor: o.vendorName } })
    return full(o)
  },
  async orders() { await wait(250); return getOrders().map(full) },
  async order(id) {
    await wait(150)
    const o = getOrders().find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    return full(o)
  },
  async cancelOrder(id) {
    await wait(300)
    const all = getOrders()
    const o = all.find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    // Cancellable only before the chef starts cooking, and only for a short window.
    if (o.prepStage && o.prepStage !== 'accepted') throw new Error('The kitchen has already started on this order')
    if (Date.now() - o.createdAt > CANCEL_WINDOW * 1000) throw new Error('This order can no longer be cancelled')
    const wasPaid = o.payment?.status === 'paid' || o.payment?.status === 'released'
    const next = {
      ...o,
      cancelledAt: Date.now(),
      // Money we are still holding can go straight back; money already released to the
      // chef has to be clawed back, so it becomes a refund we have to action.
      payment: { ...(o.payment || {}), status: wasPaid && o.settlement?.status === 'released' ? 'refund_pending' : wasPaid ? 'refunded' : 'cancelled', refundedAt: wasPaid && o.settlement?.status !== 'released' ? Date.now() : undefined },
    }
    write('stew.orders', all.map((x) => (x.id === id ? next : x)))
    audit('system', 'order_cancelled', 'order', id, { after: { status: 'cancelled' } })
    return full(next)
  },

  // Paystack: the browser opens the popup with the PUBLIC key; the backend creates and
  // verifies the transaction with the SECRET key. In mock mode we simulate the round trip
  // so the whole flow is testable without keys. Nothing here is a real charge.
  async initPayment({ orderId }) {
    await wait(500)
    const o = read('stew.orders', []).find((x) => x.id === orderId)
    if (!o) throw new Error('Order not found')
    if ((o.payment?.status) === 'paid') throw new Error('This order is already paid')
    const reference = 'PSK-' + Math.random().toString(36).slice(2, 10).toUpperCase()
    patch(orderId, { payment: { ...(o.payment || {}), status: 'pending', provider: 'paystack', reference, publicKey: PAYSTACK_PUBLIC_KEY, amount: Math.round((Number(o.total) || 0) * 100), currency: 'GHS', email: o.email } })
    return { reference, amount: Math.round((Number(o.total) || 0) * 100), currency: 'GHS', publicKey: PAYSTACK_PUBLIC_KEY, mock: true }
  },
  async verifyPayment({ orderId, reference }) {
    await wait(700)
    const o = read('stew.orders', []).find((x) => x.id === orderId)
    if (!o) throw new Error('Order not found')
    if (o.payment?.reference !== reference) throw new Error('That payment reference does not match this order')
    const next = patch(orderId, { payment: { ...(o.payment || {}), status: 'paid', paidAt: Date.now() } })
    return full(next)
  },
  async proposeMeetup(id, p) {
    await wait(400)
    const o = read('stew.orders', []).find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    const next = patch(id, { meetup: { place: p.place, note: p.note || '', proposedBy: p.proposedBy, proposedAt: Date.now(), confirmedBy: [], agreed: false } })
    return full(next)
  },
  async confirmMeetup(id) {
    await wait(350)
    const o = read('stew.orders', []).find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    if (!o.meetup?.place) throw new Error('Nobody has proposed a meeting point yet')
    const who = read('stew.me')?.role || 'student'
    const confirmedBy = Array.from(new Set([...(o.meetup.confirmedBy || []), who]))
    const both = confirmedBy.includes('student') && confirmedBy.includes('vendor')
    const next = patch(id, { meetup: { ...o.meetup, confirmedBy, agreed: both, agreedAt: both ? Date.now() : null } })
    return full(next)
  },
  async declineMeetup(id) {
    await wait(350)
    const next = patch(id, { meetup: null })
    return full(next)
  },

  // ---- escrow: STEW holds the money until the student confirms collection ------
  // The student confirming is what releases the chef's payout. Until then the money
  // is held, which is the whole point: nobody is paid for food that was never handed over.
  async markCollected(id) {
    await wait(600)
    const o = read('stew.orders', []).find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    if (o.cancelledAt) throw new Error('This order was cancelled')
    if (o.payment?.status !== 'paid') throw new Error('This order was never paid for')
    if (o.collectedAt) return full(o)
    const now = Date.now()
    const next = patch(id, {
      collectedAt: now,
      // Marking collection is also the chef's last progress step.
      prepStage: 'collected',
      prepAt: { ...(o.prepAt || {}), collected: now },
      // Settlement is what actually moves the chef's money. In mock mode it is instant;
      // a real provider settles on its own schedule.
      settlement: { status: 'released', releasedAt: now, net: Number(o.subtotal) || 0 },
      payment: { ...(o.payment || {}), status: 'released', releasedAt: now },
    })
    audit('customer', 'collection_confirmed', 'order', id, { before: { payment: 'held' }, after: { payment: 'released' } })
    return full(next)
  },

  // The chef entering the student's handoff code is the authoritative completion event.
  async completeByCode(id, code) {
    await wait(500)
    const o = read('stew.orders', []).find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    if (o.cancelledAt) throw new Error('This order was cancelled')
    if (!o.handoffCode) throw new Error('This order has no handoff code')
    if (String(code || '').trim() !== String(o.handoffCode)) throw new Error('That code does not match this order')
    if (o.collectedAt) return full(o)
    const now = Date.now()
    const next = patch(id, {
      collectedAt: now,
      collectedVia: 'handoff_code',
      prepStage: 'collected',
      prepAt: { ...(o.prepAt || {}), collected: now },
      settlement: { status: 'released', releasedAt: now, net: Number(o.subtotal) || 0 },
      payment: { ...(o.payment || {}), status: 'released', releasedAt: now },
    })
    audit('vendor', 'handoff_code_verified', 'order', id, { after: { collectedVia: 'handoff_code' } })
    return full(next)
  },
  // A chef asking us to chase a student who never confirmed.
  async nudgeCollection(id) {
    await wait(300)
    const o = read('stew.orders', []).find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    const next = patch(id, { collectionNudgedAt: Date.now() })
    return full(next)
  },
  // What the chef is owed: held while cooking, released once collected.
  async payouts() {
    await wait(250)
    const mine = read('stew.orders', []).filter((o) => !o.cancelledAt)
    const paidOrders = mine.filter((o) => o.payment?.status && o.payment.status !== 'pending')
    const sum = (list) => list.reduce((s, o) => s + (Number(o.subtotal) || 0), 0)
    const released = paidOrders.filter((o) => o.settlement?.status === 'released')
    const held = paidOrders.filter((o) => o.payment?.status === 'paid' && o.settlement?.status !== 'released')
    return {
      held: sum(held),
      released: sum(released),
      heldCount: held.length,
      releasedCount: released.length,
      collected: sum(paidOrders),
      fees: paidOrders.reduce((s, o) => s + (Number(o.fee) || 0), 0),
      note: 'STEW holds each payment until the student confirms collection, then releases it to you. You keep the full menu price; the 5% fee is added to the student\'s total.',
    }
  },

  // ---- batch cooking: the chef's progress taps -----------------------------
  async setPrepStage(id, stage) {
    await wait(300)
    const o = read('stew.orders', []).find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    if (o.cancelledAt) throw new Error('This order was cancelled')
    const next = patch(id, { prepStage: stage, prepAt: { ...(o.prepAt || {}), [stage]: Date.now() } })
    return full(next)
  },

  // ---- messages between the student and the chef ---------------------------
  async sendMessage(id, { text, from }) {
    await wait(250)
    const o = read('stew.orders', []).find((x) => x.id === id)
    if (!o) throw new Error('Order not found')
    const clean = String(text || '').trim().slice(0, 500)
    if (!clean) throw new Error('Type a message first')
    const messages = [...(o.messages || []), { from, text: clean, at: Date.now() }]
    const next = patch(id, { messages })
    return full(next)
  },

  async createCase(p) {
    await wait(500)
    const c = { ...p, code: 'CASE-' + Math.floor(1000 + Math.random() * 9000), createdAt: Date.now() }
    write('stew.cases', [c, ...read('stew.cases', [])])
    return c
  },
  async cases() { await wait(200); return read('stew.cases', []) },
  async applyVendor(p) { await wait(600); write('stew.vendorApp', p); return { status: 'pending' } },
  // Called once the student finishes the "become a vendor" application: from then on the
  // account can open the kitchen dashboard as well as ordering.
  async markVendor() {
    await wait(400)
    const u = read('stew.me')
    if (u) {
      const accountType = u.accountType === 'customer' ? 'both' : (u.accountType || 'vendor')
      const next = { ...u, isVendor: true, role: u.role === 'admin' ? 'admin' : 'vendor', accountType }
      write('stew.me', next)
      write('stew.users', read('stew.users', []).map((x) => (x.email === u.email ? { ...x, isVendor: true, role: next.role, accountType } : x)))
      return next
    }
    return { isVendor: true, role: 'vendor', accountType: 'vendor' }
  },
  async deleteAccount() {
    await wait(400)
    const u = read('stew.me')
    if (u?.isAdmin || u?.role === 'admin' || (u?.email || '').toLowerCase().startsWith('admin')) {
      throw new Error('Admin accounts cannot be deleted.')
    }
    if (u) {
      write('stew.users', read('stew.users', []).filter((x) => x.email !== u.email))
      localStorage.removeItem('stew.me')
      localStorage.removeItem('stew.token')
      localStorage.removeItem('stew.cart')
    }
    return { ok: true }
  },
  async subscribePush(p) { await wait(200); write('stew.pushSub', p); return { ok: true } },
  async unsubscribePush() { await wait(200); localStorage.removeItem('stew.pushSub'); return { ok: true } },

  // ---- reviews: only a completed order may be reviewed, and moderation gates display ----
  // project.md §21.4 (verified completed orders only) and ADM-005 (moderator hides or keeps).
  async createReview(p) {
    await wait(400)
    const order = getOrders().find((o) => o.id === p.orderId)
    if (!order) throw new Error('Order not found')
    if (!order.collectedAt && order.prepStage !== 'collected') throw new Error('You can only review an order you have collected')
    const existing = getReviews().find((r) => r.orderId === p.orderId)
    if (existing) throw new Error('You have already reviewed this order')
    const review = { ...p, vendorId: order.vendorId, createdAt: Date.now(), moderationStatus: 'pending' }
    write('stew.reviews', [review, ...getReviews()])
    audit('customer', 'review_submitted', 'review', p.orderId, { after: { rating: p.rating } })
    return review
  },
  async reviews({ vendorId, includeHidden } = {}) {
    await wait(200)
    const all = getReviews()
    // Public reads only see moderated-visible reviews.
    const mine = all.filter((r) => (vendorId ? r.vendorId === vendorId : true))
    return includeHidden ? mine : mine.filter((r) => (r.moderationStatus || 'pending') === 'visible')
  },
  async moderationQueue() {
    await wait(200)
    return getReviews().filter((r) => (r.moderationStatus || 'pending') === 'pending')
  },
  async moderateReview(orderId, decision, reason) {
    await wait(300)
    const all = getReviews()
    const r = all.find((x) => x.orderId === orderId)
    if (!r) throw new Error('Review not found')
    const next = { ...r, moderationStatus: decision, moderationReason: reason || '', moderatedAt: Date.now() }
    write('stew.reviews', all.map((x) => (x.orderId === orderId ? next : x)))
    audit('moderator', decision === 'visible' ? 'review_kept' : 'review_hidden', 'review', orderId, { after: { moderationStatus: decision } })
    return next
  },

  // ---- vendor compliance evidence (FDA food hygiene permit, project.md §14.6 / ADM-007) ----
  async saveCompliance(p) {
    await wait(400)
    const me = read('stew.me') || {}
    const record = { ...p, vendorId: me.email || 'me', updatedAt: Date.now() }
    write('stew.compliance', record)
    audit('vendor', 'compliance_submitted', 'vendor_compliance', record.vendorId, { after: { type: p.type, number: p.number } })
    return record
  },
  async compliance() { await wait(200); return read('stew.compliance', null) },
  async allCompliance() {
    await wait(200)
    const one = read('stew.compliance', null)
    // Sample rows so the admin screen has something to show before vendors exist.
    const sample = [
      { vendorId: 'esi@st.knust.edu.gh', vendorName: "Esi's Swallow Kitchen", type: 'FDA food hygiene permit', number: 'FDA/KN/2026/8841', issuedAt: '2026-02-01', expiresAt: '2027-02-01', reviewedBy: 'admin@st.knust.edu.gh' },
      { vendorId: 'yaw@st.knust.edu.gh', vendorName: "Yaw's Palm Nut", type: 'FDA food hygiene permit', number: 'FDA/KN/2025/1190', issuedAt: '2025-01-15', expiresAt: '2026-01-15', reviewedBy: '' },
      { vendorId: 'kojo@st.knust.edu.gh', vendorName: "Chef Kojo's Stews", type: 'FDA food hygiene permit', number: '', issuedAt: '', expiresAt: '', reviewedBy: '' },
    ]
    return one ? [one, ...sample] : sample
  },

  // ---- payout batches: aggregate, do not transfer per order (project.md §16.5) ----
  async payoutBatches() { await wait(150); return read('stew.payoutBatches', []) },
  async createPayoutBatch() {
    await wait(700)
    const orders = read('stew.orders', [])
    const releasable = orders.filter((o) => o.settlement?.status === 'released' && !o.payoutBatchId && !o.cancelledAt)
    if (!releasable.length) throw new Error('Nothing to settle yet — no released orders waiting')
    const amount = releasable.reduce((s, o) => s + (Number(o.subtotal) || 0), 0)
    const batch = {
      id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
      amount,
      currency: 'GHS',
      status: 'paid',
      orderCount: releasable.length,
      periodStart: Math.min(...releasable.map((o) => o.collectedAt || o.createdAt)),
      periodEnd: Math.max(...releasable.map((o) => o.collectedAt || o.createdAt)),
      createdAt: Date.now(),
      paidAt: Date.now(),
      provider: 'paystack',
      providerReference: 'TRF-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    }
    write('stew.payoutBatches', [batch, ...read('stew.payoutBatches', [])])
    write('stew.orders', orders.map((o) => (releasable.some((r) => r.id === o.id) ? { ...o, payoutBatchId: batch.id } : o)))
    audit('finance', 'payout_batch_created', 'payout_batch', batch.id, { after: { amount, orders: releasable.length } })
    return batch
  },

  async track() {},
}
export const api = MOCK ? mock : real
