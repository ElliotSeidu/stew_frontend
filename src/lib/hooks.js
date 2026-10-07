import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Jump back to the top whenever the tab/route changes, so a new screen never
// opens halfway down the previous screen's scroll position.
export function useScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }, [pathname])
}

export function useAsync(fn, deps = []) {
  const [s, setS] = useState({ data: null, loading: true, error: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    setS((x) => ({ ...x, loading: true, error: null }))
    fn()
      .then((data) => setS({ data, loading: false, error: null }))
      .catch((error) => setS((x) => ({ ...x, loading: false, error })))
  }, deps)
  useEffect(() => { run() }, [run])
  return { ...s, retry: run }
}

export function useOnline() {
  const [on, setOn] = useState(navigator.onLine)
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false)
    window.addEventListener('online', a); window.addEventListener('offline', b)
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b) }
  }, [])
  return on
}

export function useInstall() {
  const [evt, setEvt] = useState(null)
  const [installed, setInstalled] = useState(false)
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setEvt(e) }
    const i = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', h)
    window.addEventListener('appinstalled', i)
    return () => { window.removeEventListener('beforeinstallprompt', h); window.removeEventListener('appinstalled', i) }
  }, [])
  const install = async () => { if (!evt) return; evt.prompt(); await evt.userChoice; setEvt(null) }
  return { canInstall: !!evt && !installed, install }
}
