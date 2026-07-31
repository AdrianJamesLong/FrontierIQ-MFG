import { useState } from 'react'
import { useSessionUnlock } from '../utils/sessionUnlock'
import frontierMark from '../assets/frontier-mark-navy.png'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const SESSION_KEY = 'frontieriq-mfg-unlocked'

// Same deterrent-only PIN pattern as FrontierIQ-Energy/FrontierIQ-GxP's
// SplashGate (backlog #17, parity pass) — a full-screen lock shown before
// the app's routes render. The PIN check happens server-side (mfg_core's
// POST /auth/verify-pin) so the real PIN never ships in this bundle, but
// there's still no session token, no rate limiting, no lockout. Not real
// auth — see FrontierPlatform Epic 10. Also embeds a "Request Access" form
// (mfg_core's POST /access-requests) so someone without the PIN can ask for
// one instead of being stuck at a dead end. Unlock expires after 1 hour
// (useSessionUnlock) rather than lasting the whole tab session.
export default function SplashGate({ children }) {
  const { unlocked, unlock } = useSessionUnlock(SESSION_KEY)
  const [mode, setMode] = useState('pin') // 'pin' | 'request' | 'requested'

  const [pin, setPin] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requestError, setRequestError] = useState(false)

  if (unlocked) return children

  const submitPin = async (e) => {
    e.preventDefault()
    if (!pin || checking) return
    setChecking(true)
    setError(false)
    try {
      const r = await fetch(`${API_URL}/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const d = await r.json()
      if (d.ok) {
        unlock()
      } else {
        setError(true)
        setPin('')
      }
    } catch {
      setError(true)
    } finally {
      setChecking(false)
    }
  }

  const submitRequest = async (e) => {
    e.preventDefault()
    if (!name || !email || submitting) return
    setSubmitting(true)
    setRequestError(false)
    try {
      const r = await fetch(`${API_URL}/access-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, reason }),
      })
      if (!r.ok) throw new Error()
      setMode('requested')
    } catch {
      setRequestError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0A1628',
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '36px 32px', width: 320,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)', textAlign: 'center',
      }}>
        <img src={frontierMark} alt="" style={{ width: 40, height: 40, borderRadius: 9, margin: '0 auto 14px' }} />
        <div style={{ fontWeight: 800, fontSize: 15, color: '#0A1628', marginBottom: 2 }}>FrontierIQ-MFG</div>

        {mode === 'pin' && (
          <>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Enter the access PIN to continue</div>
            <form onSubmit={submitPin}>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={e => { setPin(e.target.value); setError(false) }}
                placeholder="PIN"
                style={{
                  width: '100%', textAlign: 'center', letterSpacing: '0.3em', fontSize: 18,
                  padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${error ? '#ef4444' : '#E5E9F0'}`, marginBottom: 12,
                }}
              />
              {error && <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 12 }}>Incorrect PIN — try again.</div>}
              <button
                type="submit" disabled={checking || !pin}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: checking || !pin ? '#9CA3AF' : '#C15F3C', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600,
                  cursor: checking || !pin ? 'default' : 'pointer',
                }}
              >
                {checking ? 'Checking…' : 'Unlock'}
              </button>
            </form>
            <button
              type="button" onClick={() => setMode('request')}
              style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, marginTop: 14, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Don't have a PIN? Request access
            </button>
          </>
        )}

        {mode === 'request' && (
          <form onSubmit={submitRequest} style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, textAlign: 'center' }}>Request access to this demo</div>
            <input
              value={name} onChange={e => setName(e.target.value)} placeholder="Name" autoFocus
              style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #E5E9F0', marginBottom: 8, fontSize: 13 }}
            />
            <input
              value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
              style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #E5E9F0', marginBottom: 8, fontSize: 13 }}
            />
            <input
              value={company} onChange={e => setCompany(e.target.value)} placeholder="Company (optional)"
              style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #E5E9F0', marginBottom: 8, fontSize: 13 }}
            />
            <textarea
              value={reason} onChange={e => setReason(e.target.value)} placeholder="What would you like to see? (optional)" rows={2}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #E5E9F0', marginBottom: 12, fontSize: 13, resize: 'vertical' }}
            />
            {requestError && <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 12 }}>Couldn't send your request — try again.</div>}
            <button
              type="submit" disabled={submitting || !name || !email}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: submitting || !name || !email ? '#9CA3AF' : '#C15F3C', color: '#fff', border: 'none',
                borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600,
                cursor: submitting || !name || !email ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Sending…' : 'Send request'}
            </button>
            <button
              type="button" onClick={() => setMode('pin')}
              style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, marginTop: 10, cursor: 'pointer', textDecoration: 'underline', display: 'block', margin: '10px auto 0' }}
            >
              Have a PIN already? Back to unlock
            </button>
          </form>
        )}

        {mode === 'requested' && (
          <>
            <div style={{ fontSize: 13, color: '#4B5563', margin: '8px 0 18px' }}>
              Request sent. You'll receive the access PIN once it's approved.
            </div>
            <button
              type="button" onClick={() => setMode('pin')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10,22,40,0.06)', color: '#0A1628', border: '1px solid #E5E9F0',
                borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Back to unlock
            </button>
          </>
        )}
      </div>
    </div>
  )
}
