import { api, MOCK } from './api'
import { PAYSTACK_PUBLIC_KEY } from '../config'

// Paystack integration, with STEW holding the money (escrow).
//
// HOW THE MONEY MOVES
// -------------------
//   1. Student pays STEW in the app. The money lands in STEW's Paystack settlement
//      account. The chef is NOT paid at this point.
//   2. STEW holds it while the chef cooks. The order shows "Held by STEW".
//   3. The chef taps their preparation stages; the student watches.
//   4. The chef marks the order ready for pickup.
//   5. The student collects the food and confirms in the app. THAT confirmation is what
//      releases the chef's share.
//   6. If the order is cancelled before cooking, or never handed over, the held money is
//      refunded to the student from the same account.
//
// WHAT YOUR BACK END MUST IMPLEMENT
// ---------------------------------
//   POST /payments/initialize/      create a Paystack transaction, return access_code
//                                   or checkout_url, plus reference and amount
//   POST /payments/verify/          verify with Paystack (/transaction/verify/:ref) AND
//                                   via webhook, then mark the order paid and HELD.
//                                   Never trust the browser to say a payment succeeded.
//   POST /orders/:id/collected/     the student confirms collection. Only on this call do
//                                   you transfer the chef's share. Record who confirmed
//                                   and when, and make it idempotent.
//   POST /orders/:id/collection-nudge/  chef chases an unconfirmed collection
//   GET  /payouts/                  held vs released totals for the chef's ledger
//
// ON PAYSTACK specifically: either (a) collect the full amount into your settlement
// account and issue a Transfer to the chef's MoMo on confirmation, or (b) use a
// subaccount/split so the chef's share only settles when you trigger it. Option (a) is
// simpler but means you are holding other people's money, which in Ghana is a regulated
// activity — get advice before launch and keep the escrow balance in a separate account.
//
// The browser can only ever hold the PUBLIC key. Creating a transaction and verifying it
// needs the SECRET key, so both happen on your backend:
//
// Two ways to open the payment UI, depending on what your backend returns:
//   * access_code  -> inline popup (Paystack's own script does the MoMo charge prompt)
//   * checkout_url -> redirect to Paystack's hosted page (redirect-first, survives popup blockers)
//
// In mock mode (no VITE_API_URL) this simulates both calls so the whole flow is walkable
// without keys. It never moves real money.

const SDK = 'https://js.paystack.co/v1/inline.js'

function loadSdk() {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK}"]`)
    if (existing) { existing.addEventListener('load', () => resolve(window.PaystackPop)); return }
    const s = document.createElement('script')
    s.src = SDK
    s.async = true
    s.onload = () => resolve(window.PaystackPop)
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'))
    document.head.appendChild(s)
  })
}

export const paymentReady = () => MOCK || !!PAYSTACK_PUBLIC_KEY

/**
 * Start a payment for an order and resolve once it is paid.
 * Throws with a readable message on any failure; the caller shows it to the student.
 */
export async function payForOrder(order, { onStatus } = {}) {
  const say = (s) => onStatus?.(s)

  say('contacting-paystack')
  const init = await api.initPayment({ orderId: order.id, amount: Math.round(Number(order.total) * 100), currency: 'GHS' })
  const reference = init.reference || init.data?.reference
  if (!reference) throw new Error('The payment could not be started. Please try again.')

  // Backend handed us a hosted page: send the student there and verify when they return.
  const checkoutUrl = init.checkout_url || init.data?.authorization_url
  if (checkoutUrl) {
    sessionStorage.setItem('stew.pendingPayment', JSON.stringify({ orderId: order.id, reference }))
    window.location.assign(checkoutUrl)
    return { pending: true, reference }
  }

  const accessCode = init.access_code || init.data?.access_code
  if (!accessCode) throw new Error('The payment could not be started. Please try again.')

  const key = init.publicKey || init.data?.public_key || PAYSTACK_PUBLIC_KEY
  if (!key) throw new Error('Payments are not configured yet. Please contact support.')

  say('awaiting-approval')
  const Pop = await loadSdk()
  await new Promise((resolve, reject) => {
    const handler = Pop.setup({
      key,
      email: init.email || order.email || 'student@st.knust.edu.gh',
      amount: init.amount,
      currency: init.currency || 'GHS',
      ref: reference,
      channels: ['mobile_money', 'card'],
      metadata: { orderId: order.id, vendor: order.vendorName },
      callback: (res) => resolve(res),
      onClose: () => reject(Object.assign(new Error('Payment was closed before it finished.'), { code: 'closed' })),
    })
    handler.openIframe()
  })

  say('verifying')
  return api.verifyPayment({ orderId: order.id, reference })
}

// When the student comes back from a hosted Paystack page, finish the verification.
export async function settlePendingPayment() {
  const raw = sessionStorage.getItem('stew.pendingPayment')
  if (!raw) return null
  let saved
  try { saved = JSON.parse(raw) } catch { sessionStorage.removeItem('stew.pendingPayment'); return null }
  try {
    const order = await api.verifyPayment({ orderId: saved.orderId, reference: saved.reference })
    sessionStorage.removeItem('stew.pendingPayment')
    return order
  } catch {
    sessionStorage.removeItem('stew.pendingPayment')
    return null
  }
}
