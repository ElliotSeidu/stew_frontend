export const cx = (...a) => a.filter(Boolean).join(' ')
export const money = (n) => `GH¢\u00A0${Number(n).toFixed(2)}`
export const read = (k, d = null) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch { return d }
}
export const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))
export const timeAgo = (t) => {
  const m = Math.round((Date.now() - t) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString()
}
