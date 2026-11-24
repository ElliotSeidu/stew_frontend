/**
 * Formats how long ago a paid order was received by the kitchen.
 * Clamps negative clock skew so future timestamps never show "-1 min ago".
 */
export function formatReceivedAgo(paidAtMs, nowMs = Date.now()) {
  if (paidAtMs == null || Number.isNaN(Number(paidAtMs))) return null
  const diffMs = Math.max(0, Number(nowMs) - Number(paidAtMs))
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Received just now'
  if (mins < 60) return `Received ${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Received ${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `Received ${days} d ago`
}
