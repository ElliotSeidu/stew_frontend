// STEW sample catalogue: Ghanaian stews, soups and swallows.
//
// STEW is a batch-cooking marketplace, not a fast-food one. A chef cooks a pot over
// roughly a week and students collect on the cook day they chose at checkout. So items
// are sold by the bowl/portion and carry a batch notice instead of a "ready in 20 min"
// promise.
//
// SAMPLE DATA - replace with your API.

export const KINDS = ['Soups', 'Stews', 'Swallows', 'Rice & sides', 'Drinks']

export const BATCH_NOTICE = 'Cooked to order in weekly batches. Choose your pickup day at checkout.'

// Portion hints, shown on the item so students know what they are getting.
export const PORTIONS = ['Single portion', 'Two portions', 'Family pot (4 portions)']

// Old sample dishes (jollof, waakye, fried rice, pastries) were removed on purpose.
export const VENDORS = [
  { id: 'v1', name: "Auntie Ama's Soup Pot", hall: 'Unity Hall (Conti)', rating: 4.8, reviews: 112, open: true, prep: 6, bio: 'One pot of soup a week. Palm nut, groundnut and light soup, cooked slow and portioned the same day.' },
  { id: 'v2', name: "Mama Efua's Kitchen", hall: 'Queen Elizabeth II Hall (Queens)', rating: 4.7, reviews: 86, open: true, prep: 7, bio: 'Fufu and light soup with goat, plus kontomire on weekends.' },
  { id: 'v3', name: "Chef Kojo's Stews", hall: 'Africa Hall', rating: 4.6, reviews: 64, open: true, prep: 5, bio: 'Chicken and beef stews, cooked down properly. Rice and yam on the side.' },
  { id: 'v4', name: "Nana's Groundnut Pot", hall: 'University Hall (Katanga)', rating: 4.5, reviews: 51, open: true, prep: 6, bio: 'Groundnut soup, nkatenkwan style, with or without goat.' },
  { id: 'v5', name: "Esi's Swallow Kitchen", hall: 'Independence Hall (Indece)', rating: 4.9, reviews: 143, open: true, prep: 8, bio: 'Fresh banku, fufu and kenkey made the morning of your pickup day.' },
  { id: 'v6', name: "Yaw's Palm Nut", hall: 'Ayeduase', rating: 4.4, reviews: 38, open: false, prep: 7, bio: 'Abenkwan with fish and wele. Orders close when the pot is full.' },
  { id: 'v7', name: 'Maame Fresh Drinks', hall: 'Republic Hall', rating: 4.7, reviews: 77, open: true, prep: 2, bio: 'Sobolo and ginger drinks to go with your soup.' },
]

const m = (id, vendorId, name, desc, price, cat, left, kinds, image, portion) =>
  ({ id, vendorId, name, desc, price, cat, left, kinds, image, portion })

const RAW = [
  // Soups
  m('m1', 'v1', 'Palm nut soup (abenkwan)', 'Palm nut soup with smoked fish and wele, cooked down for hours.', 45, 'Soups', 20, ['soup'], '/foods/palm-nut-soup.jpg', 'Two portions'),
  m('m2', 'v1', 'Groundnut soup', 'Nkatenkwan with chicken and a little ginger heat.', 42, 'Soups', 16, ['soup'], '/foods/groundnut-soup.jpg', 'Two portions'),
  m('m3', 'v2', 'Light soup with goat', 'Peppery light soup with tender goat, no thickener.', 48, 'Soups', 12, ['soup'], '/foods/light-soup.jpg', 'Two portions'),
  m('m4', 'v2', 'Kontomire with egg', 'Cocoyam leaf stew with egg and smoked fish.', 35, 'Stews', 14, ['stew'], '/foods/kontomire-stew.jpg', 'Single portion'),
  m('m5', 'v4', 'Groundnut soup with goat', 'Rich groundnut base, goat on the bone.', 52, 'Soups', 10, ['soup'], '/foods/groundnut-soup.jpg', 'Two portions'),
  m('m6', 'v6', 'Palm nut soup with tilapia', 'Abenkwan with whole tilapia. Pot is limited.', 55, 'Soups', 8, ['soup'], '/foods/palm-nut-soup.jpg', 'Two portions'),

  // Stews
  m('m7', 'v3', 'Chicken stew', 'Slow-cooked chicken stew in tomato and pepper, plenty of gravy.', 40, 'Stews', 18, ['stew'], '/foods/chicken-stew.jpg', 'Two portions'),
  m('m8', 'v3', 'Beef stew', 'Beef simmered until soft, with a thick pepper base.', 45, 'Stews', 15, ['stew'], '/foods/beef-stew.jpg', 'Two portions'),
  m('m9', 'v3', 'Fish stew', 'Fried fish simmered in pepper and tomato.', 42, 'Stews', 12, ['stew'], '/foods/fish-stew.jpg', 'Single portion'),
  m('m10', 'v1', 'Egg stew', 'Boiled eggs in a light tomato stew, good with rice or yam.', 25, 'Stews', 22, ['stew'], '/foods/egg-stew.jpg', 'Single portion'),

  // Swallows
  m('m11', 'v5', 'Fufu (2 balls)', 'Fresh pounded fufu, made the morning of your pickup day.', 12, 'Swallows', 30, ['swallow'], '/foods/fufu.jpg', 'Single portion'),
  m('m12', 'v5', 'Banku (2 balls)', 'Soft banku, fermented properly.', 10, 'Swallows', 28, ['swallow'], '/foods/banku.jpg', 'Single portion'),
  m('m13', 'v5', 'Kenkey (2 balls)', 'Ga kenkey with a little shito on the side.', 10, 'Swallows', 26, ['swallow'], '/foods/kenkey.jpg', 'Single portion'),
  m('m14', 'v2', 'Rice balls (2)', 'Moulded rice to go with your soup.', 10, 'Rice & sides', 20, ['side'], '/foods/rice-balls.jpg', 'Single portion'),

  // Drinks
  m('m15', 'v7', 'Sobolo (500 ml)', 'Chilled hibiscus drink with ginger and cloves.', 8, 'Drinks', 40, ['drink'], '/foods/sobolo.jpg', 'Single portion'),
  m('m16', 'v7', 'Pineapple-ginger juice', 'Fresh-pressed, no added sugar.', 12, 'Drinks', 24, ['drink'], '/foods/pineapple-juice.jpg', 'Single portion'),
]

export const MEALS = RAW.map((x) => {
  const v = VENDORS.find((v) => v.id === x.vendorId)
  return { ...x, vendorName: v.name, hall: v.hall, rating: v.rating, open: v.open, batch: true }
})

// Customer-side stages, mirrored by the chef's taps on the dashboard.
export const PREP_STAGES = [
  { id: 'accepted', label: 'Order accepted', note: 'The kitchen has your order.', tone: 'brand' },
  { id: 'shopping', label: 'Buying ingredients', note: 'Your ingredients are being bought.', tone: 'brand' },
  { id: 'cooking', label: 'Cooking', note: 'Your pot is on the fire.', tone: 'warn' },
  { id: 'packing', label: 'Portioning & packing', note: 'Being portioned and packed.', tone: 'warn' },
  { id: 'ready', label: 'Ready for pickup', note: 'Ready — head to your meeting point.', tone: 'ok' },
  { id: 'collected', label: 'Collected', note: 'Handed over. Enjoy!', tone: 'mute' },
]
export const STAGE_IDS = PREP_STAGES.map((s) => s.id)
export const stageIndex = (id) => Math.max(0, STAGE_IDS.indexOf(id))

export const INCOMING = [
  { id: 'o1', code: 'STW-4821', customer: 'Kofi A.', phone: '0240000001', area: 'Unity Hall (Conti)', items: '1× Palm nut soup (abenkwan), 1× Fufu (2 balls)', total: 59.85, stage: 'accepted', pickupDay: '2026-10-14', paid: true, note: 'Extra pepper please', messages: [{ from: 'student', text: 'Please make it small pepper.', at: Date.now() - 3600_000 }] },
  { id: 'o2', code: 'STW-4822', customer: 'Abena M.', phone: '0240000002', area: 'Queen Elizabeth II Hall (Queens)', items: '1× Light soup with goat', total: 50.40, stage: 'cooking', pickupDay: '2026-10-13', paid: true, note: '', messages: [] },
  { id: 'o3', code: 'STW-4823', customer: 'Yaw D.', phone: '0240000003', area: 'Brunei', items: '2× Groundnut soup, 2× Banku (2 balls)', total: 108.20, stage: 'shopping', pickupDay: '2026-10-15', paid: true, note: 'No okro in mine', messages: [{ from: 'student', text: 'I am allergic to okro, please leave it out.', at: Date.now() - 7200_000 }] },
]

export const PENDING_VENDORS = [
  { id: 'a1', name: 'Nana Yaa Soups', hall: 'Brunei', cat: 'Soups', submitted: '2 days ago' },
  { id: 'a2', name: 'Fiifi Stew Pot', hall: 'Ayeduase', cat: 'Stews', submitted: '1 day ago' },
  { id: 'a3', name: 'Adwoa Swallow Kitchen', hall: 'Africa Hall', cat: 'Swallows', submitted: '5 h ago' },
]
export const DISPUTES = [
  { id: 'c1', code: 'CASE-1021', type: 'Food safety concern', order: 'STW-3320', vendor: "Chef Kojo's Stews", priority: 'high' },
  { id: 'c2', code: 'CASE-1022', type: 'Missing item', order: 'STW-3412', vendor: "Auntie Ama's Soup Pot", priority: 'normal' },
  { id: 'c3', code: 'CASE-1023', type: 'Order not ready on pickup day', order: 'STW-3498', vendor: "Mama Efua's Kitchen", priority: 'normal' },
]
export const USERS = [
  { id: 'u1', name: 'Kofi Asante', email: 'kofi@st.knust.edu.gh', role: 'customer', active: true },
  { id: 'u2', name: 'Abena Mensah', email: 'abena@st.knust.edu.gh', role: 'customer', active: true },
  { id: 'u3', name: 'Esi Owusu', email: 'esi@st.knust.edu.gh', role: 'vendor', active: true },
]
export const SALES = [
  { d: 'Mon', v: 220 }, { d: 'Tue', v: 340 }, { d: 'Wed', v: 280 }, { d: 'Thu', v: 410 },
  { d: 'Fri', v: 520 }, { d: 'Sat', v: 380 }, { d: 'Sun', v: 190 },
]

// Categories kept as an alias so older screens that import WINDOWS/CATEGORIES keep working.
export const CATEGORIES = KINDS
export const WINDOWS = [{ id: 'batch', label: 'Weekly batch' }]