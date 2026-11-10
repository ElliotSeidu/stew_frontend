// STEW catalogue constants: Ghanaian stews, soups and swallows.
//
// STEW is a batch-cooking marketplace, not a fast-food one. A chef cooks a pot over
// roughly a week and students collect on the cook day they chose at checkout. So items
// are sold by the bowl/portion and carry a batch notice instead of a "ready in 20 min"
// promise.

export const KINDS = ['Soups', 'Stews', 'Swallows', 'Rice & sides', 'Drinks']

export const BATCH_NOTICE = 'Cooked to order in weekly batches. Choose your pickup day at checkout.'

// Portion hints, shown on the item so students know what they are getting.
export const PORTIONS = ['Single portion', 'Two portions', 'Family pot (4 portions)']

export const VENDORS = []
export const MEALS = []

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

export const INCOMING = []
export const PENDING_VENDORS = []
export const DISPUTES = []
export const USERS = []
export const SALES = []

// Categories kept as an alias so older screens that import WINDOWS/CATEGORIES keep working.
export const CATEGORIES = KINDS
export const WINDOWS = [{ id: 'batch', label: 'Weekly batch' }]
