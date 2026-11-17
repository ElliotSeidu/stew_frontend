import { useCallback, useEffect, useRef, useState } from 'react'
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
  const run = useCallback((silent = false) => {
    if (!silent) {
      setS((x) => (x.data ? { ...x, error: null } : { ...x, loading: true, error: null }))
    }
    return fn()
      .then((data) => {
        setS({ data, loading: false, error: null })
        return data
      })
      .catch((error) => {
        setS((x) => ({ ...x, loading: false, error }))
        throw error
      })
  }, deps)
  useEffect(() => { run() }, [run])
  return { ...s, retry: (silent = true) => run(silent) }
}

export function usePagedList(fetcher, getKey = (item) => item?.id) {
  const fetcherRef = useRef(fetcher)
  const keyRef = useRef(getKey)
  fetcherRef.current = fetcher
  keyRef.current = getKey
  const [s, setS] = useState({ data: null, loading: true, loadingMore: false, error: null })
  const stateRef = useRef(s)
  stateRef.current = s

  const retry = useCallback((silent = false) => {
    const prev = stateRef.current.data
    const prevCount = Array.isArray(prev) ? prev.length : 0
    if (!silent) {
      setS((x) => (x.data ? { ...x, error: null } : { ...x, loading: true, error: null }))
    }
    const req = prevCount > 200 ? { limit: Math.min(500, prevCount), offset: 0 } : { offset: 0 }
    return fetcherRef.current(req)
      .then((data) => {
        setS({ data, loading: false, loadingMore: false, error: null })
        return data
      })
      .catch((error) => {
        setS((x) => ({ ...x, loading: false, loadingMore: false, error }))
        throw error
      })
  }, [])

  useEffect(() => { retry() }, [retry])

  const loadMore = useCallback(() => {
    const current = stateRef.current.data || []
    const pag = current._pagination
    if (!pag?.truncated || stateRef.current.loadingMore) return Promise.resolve()
    setS((x) => ({ ...x, loadingMore: true }))
    return fetcherRef.current({ limit: pag.limit, offset: current.length })
      .then((nextPage) => {
        setS((cur) => {
          const prev = cur.data || []
          const kf = keyRef.current
          const seen = new Set(prev.map(kf))
          const merged = [...prev, ...(nextPage || []).filter((item) => !seen.has(kf(item)))]
          if (nextPage?._pagination) {
            Object.defineProperty(merged, '_pagination', {
              value: nextPage._pagination,
              enumerable: false,
              configurable: true,
            })
          }
          return { ...cur, data: merged, loadingMore: false }
        })
      })
      .catch((error) => {
        setS((cur) => ({ ...cur, loadingMore: false, error }))
      })
  }, [])

  return {
    ...s,
    pagination: s.data?._pagination || null,
    retry: (silent = true) => retry(silent),
    loadMore,
  }
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
