// Campus and named zones.
//
// Per the STEW specs (project.md §9, §36; STEW-MVP.md §9) the MVP models location as a
// controlled campus vocabulary rather than GPS: a campus, and named zones inside it.
// Students pick a zone; vendors operate from one. Free text is a fallback only.
export const CAMPUS = {
  id: 'knust',
  short: 'KNUST',
  name: 'Kwame Nkrumah University of Science and Technology',
  university: 'Kwame Nkrumah University of Science and Technology',
  country: 'Ghana',
  timezone: 'Africa/Accra',
  currency: 'GHS',
  emailDomain: 'st.knust.edu.gh',
  refIdRe: /^\d{8}$/,
  phoneRe: /^(?:\+233|0)[25]\d{8}$/,
}

// Named zones replace the old flat "areas" list. `kind` distinguishes halls from
// off-campus areas so we can label them honestly.
export const ZONES = [
  { id: 'conti', name: 'Unity Hall (Conti)', kind: 'hall' },
  { id: 'queens', name: 'Queen Elizabeth II Hall (Queens)', kind: 'hall' },
  { id: 'africa', name: 'Africa Hall', kind: 'hall' },
  { id: 'indece', name: 'Independence Hall (Indece)', kind: 'hall' },
  { id: 'republic', name: 'Republic Hall', kind: 'hall' },
  { id: 'katanga', name: 'University Hall (Katanga)', kind: 'hall' },
  { id: 'brunei', name: 'Brunei', kind: 'off-campus' },
  { id: 'ayeduase', name: 'Ayeduase', kind: 'off-campus' },
  { id: 'bomso', name: 'Bomso', kind: 'off-campus' },
  { id: 'kotei', name: 'Kotei', kind: 'off-campus' },
  { id: 'ayigya', name: 'Ayigya', kind: 'off-campus' },
  { id: 'commercial', name: 'Commercial Area', kind: 'landmark' },
]

export const zoneName = (id) => ZONES.find((z) => z.id === id)?.name || id || ''
export const zoneByName = (name) => ZONES.find((z) => z.name === name)

// Backwards-compatible aliases: several screens still read areas/halls.
export const AREAS = ZONES.map((z) => z.name)
CAMPUS.areas = AREAS
CAMPUS.halls = AREAS


export const MOMO = [
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'telecel', label: 'Telecel Cash' },
  { id: 'at', label: 'AT Money' },
]

// STEW takes a platform fee on every order. It is ADDED ON TOP of the menu price,
// so the student pays it and the chef still receives the full menu price.
export const FEE_RATE = 0.05
export const feeFor = (subtotal) => Math.round(Number(subtotal) * FEE_RATE * 100) / 100

export const CANCEL_WINDOW = 120 // seconds a student can cancel after ordering

// STEW cooks in weekly batches. A student picks a cook day at checkout, the chef cooks
// over the days before it, and the food is collected on that day.
export const BATCH_LEAD_DAYS = 7 // how far ahead a pickup day can be offered
export const MIN_LEAD_DAYS = 2 // soonest a chef can realistically cook a pot
export const PICKUP_SLOTS = [
  { id: 'morning', label: 'Morning (10:00–12:00)' },
  { id: 'afternoon', label: 'Afternoon (14:00–16:00)' },
  { id: 'evening', label: 'Evening (17:00–19:00)' },
]

/** The days a student may choose for collection. */
export const cookDays = (from = new Date()) => {
  const out = []
  for (let i = MIN_LEAD_DAYS; i <= BATCH_LEAD_DAYS; i++) {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    out.push({
      id: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString('en-GB', { weekday: 'long' }),
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    })
  }
  return out
}

export const niceDay = (id) => {
  if (!id) return 'not chosen yet'
  const d = new Date(id + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return id
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ---------------------------------------------------------------------------
// Escrow
//
// The student pays STEW, not the chef. STEW holds the money while the pot is
// cooking, and only releases it to the chef once the student confirms they
// collected the food. That confirmation is the trigger — the chef cannot release
// it themselves, and neither can the student before the order is ready.
//
// Where the money physically sits is a finance and licensing decision, not a
// front-end one: holding customer funds on behalf of sellers is regulated in
// Ghana. On Paystack this is normally done with a settlement account plus
// transfers on release, or with split payments configured so the chef's share
// settles only when you trigger it. See src/lib/payments.js for the endpoints
// your back end must implement.
export const ESCROW = {
  held: 'Held by STEW',
  released: 'Released to the chef',
  refunded: 'Refunded to you',
}

// How long after a missed pickup day before we check in on an unconfirmed order.
export const COLLECTION_NAG_HOURS = 12


// Paystack is used to collect Mobile Money payments in the app. The public key is safe
// to ship in the browser; the SECRET key must live only on your backend, which is also
// what verifies each transaction before an order is marked paid.
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

// Suggested public, well-lit meeting points. Students and chefs pick from these or type
// their own; they must both confirm the same place before it counts as agreed.
export const MEET_SPOTS = [
  'Commercial Area (busy, open)',
  'KNUST Main Gate',
  'Ayeduase Gate',
  'Kotei Junction',
  'Bomso Market',
  'College of Engineering junction',
  'Commercial Area pharmacy row',
  'Africa Hall main entrance',
  'Unity Hall main entrance',
  'Queen Elizabeth II Hall entrance',
]

export const SAFETY_POINTS = [
  'Meet in a busy, public, well-lit place — never a private room, a hostel room, or a secluded spot.',
  'Meet in daylight where you can. If it is dark, choose somewhere with people and lighting around.',
  'The place you agree on STEW must be the actual place you meet. Do not move the meetup elsewhere.',
  'Tell a friend or roommate where you are going and when you expect to be back.',
  'Never send Mobile Money to the other person directly, and never pay cash at the meetup. Pay in the app.',
  'If anything feels wrong, do not go. Report the order in the app instead.',
]

export const CONTACT = { email: '', phone: '0257059777' } // add the email when you have one
export const contactText = () => [CONTACT.email, CONTACT.phone].filter(Boolean).join(' or ')
export const LEGAL_UPDATED = 'October 2026'
