import { api } from './api'

const KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
export const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const toKey = (s) => {
  const raw = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function enablePush() {
  if (!pushSupported) throw new Error('Notifications are not supported on this device')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser settings.')
  let sub = null
  if (KEY) {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) throw new Error('The app is still getting ready. Try again in a moment.')
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(KEY) })
  }
  await api.subscribePush(sub ? sub.toJSON() : { mock: true })
  localStorage.setItem('stew.push', '1')
}

export async function disablePush() {
  const reg = await navigator.serviceWorker?.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) { await api.unsubscribePush({ endpoint: sub.endpoint }); await sub.unsubscribe() }
  else await api.unsubscribePush({})
  localStorage.removeItem('stew.push')
}

// Used while the app is open in the background (the server push covers a closed app)
export async function notifyLocal(title, body, url = '/app/orders') {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || localStorage.getItem('stew.push') !== '1') return
  const reg = await navigator.serviceWorker?.getRegistration()
  reg?.showNotification(title, { body, icon: '/pwa-192x192.png', badge: '/pwa-64x64.png', data: { url } })
}
