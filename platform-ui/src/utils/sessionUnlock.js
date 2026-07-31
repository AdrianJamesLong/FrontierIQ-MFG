import { useEffect, useRef, useState } from 'react'

const ONE_HOUR_MS = 60 * 60 * 1000

// Shared by SplashGate and AdminPermissions: an "unlocked" flag backed by
// sessionStorage, but time-boxed to 1 hour from the PIN entry — re-locks
// automatically (both on next load and, via the timer below, mid-session
// without needing a page refresh) so a PIN doesn't grant indefinite access
// once entered. Ported from FrontierIQ-GxP's utils/sessionUnlock.ts.
export function useSessionUnlock(sessionKey) {
  const timeKey = `${sessionKey}-at`

  const readValid = () => {
    const flag = sessionStorage.getItem(sessionKey) === 'true'
    const at = Number(sessionStorage.getItem(timeKey) || 0)
    if (flag && at && Date.now() - at < ONE_HOUR_MS) return at
    sessionStorage.removeItem(sessionKey)
    sessionStorage.removeItem(timeKey)
    return null
  }

  const [unlocked, setUnlockedState] = useState(() => readValid() !== null)
  const timerRef = useRef(null)

  const lock = () => {
    sessionStorage.removeItem(sessionKey)
    sessionStorage.removeItem(timeKey)
    setUnlockedState(false)
  }

  const unlock = () => {
    const now = Date.now()
    sessionStorage.setItem(sessionKey, 'true')
    sessionStorage.setItem(timeKey, String(now))
    setUnlockedState(true)
  }

  useEffect(() => {
    if (!unlocked) return
    const at = readValid()
    if (at === null) { setUnlockedState(false); return }
    const remaining = ONE_HOUR_MS - (Date.now() - at)
    timerRef.current = setTimeout(lock, Math.max(remaining, 0))
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked])

  return { unlocked, unlock, lock }
}
