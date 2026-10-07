import { api, MOCK } from './api'

export const dnt = () => navigator.doNotTrack === '1' || window.doNotTrack === '1'
export const analyticsEnabled = () => !dnt() && localStorage.getItem('stew.analytics.off') !== '1'

// Strip ids so a path never identifies an order or kitchen
const clean = (p) => p.replace(/\/(STW-\d+|v\d+|[0-9a-f-]{8,})/gi, '/:id')

// Anonymous: no cookies, no user id, no name/phone/email. Never put personal data in props.
export function track(event, props = {}) {
  if (!analyticsEnabled()) return
  const payload = { event, path: clean(location.pathname), props, ts: Date.now() }
  if (MOCK) { console.debug('[analytics]', payload); return }
  api.track(payload).catch(() => {})
}
