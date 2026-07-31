import { useEffect, useState } from 'react'
import { useSessionUnlock } from '../utils/sessionUnlock'
import './AdminPermissions.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const SESSION_KEY = 'frontieriq-mfg-admin-unlocked'
const PIN_KEY = 'frontieriq-mfg-admin-pin'

// Admin-only view of everyone who's asked for access via SplashGate's
// "Request access" form — reachable only by navigating to /?admin (not
// linked from the sidebar), and gated by its own admin PIN (mfg_core's
// POST /auth/verify-admin-pin), separate from the general splash PIN
// handed out to every approved demo user. Built against GxP's version of
// this page specifically (backlog #17) — it additionally has the Access
// Log section below, which Energy's simpler version is missing.
export default function AdminPermissions() {
  const { unlocked, unlock } = useSessionUnlock(SESSION_KEY)
  const [adminPin, setAdminPin] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(false)

  const [requests, setRequests] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const [accessLog, setAccessLog] = useState(null)
  const [logError, setLogError] = useState(false)

  const load = (pin) => {
    setLoadError(false)
    fetch(`${API_URL}/access-requests?admin_pin=${encodeURIComponent(pin)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setRequests(d.requests))
      .catch(() => setLoadError(true))
  }

  const loadLog = (pin) => {
    setLogError(false)
    fetch(`${API_URL}/access-log?admin_pin=${encodeURIComponent(pin)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setAccessLog(d.entries))
      .catch(() => setLogError(true))
  }

  useEffect(() => {
    if (unlocked) {
      const pin = sessionStorage.getItem(PIN_KEY) || ''
      load(pin)
      loadLog(pin)
    } else {
      sessionStorage.removeItem(PIN_KEY)
    }
  }, [unlocked])

  const submitPin = async (e) => {
    e.preventDefault()
    if (!adminPin || checking) return
    setChecking(true)
    setError(false)
    try {
      const r = await fetch(`${API_URL}/auth/verify-admin-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin }),
      })
      const d = await r.json()
      if (d.ok) {
        sessionStorage.setItem(PIN_KEY, adminPin)
        unlock()
      } else {
        setError(true)
        setAdminPin('')
      }
    } catch {
      setError(true)
    } finally {
      setChecking(false)
    }
  }

  const decide = async (id, action) => {
    setBusyId(id)
    try {
      const pin = sessionStorage.getItem(PIN_KEY) || ''
      await fetch(`${API_URL}/access-requests/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_pin: pin }),
      })
      load(pin)
    } finally {
      setBusyId(null)
    }
  }

  if (!unlocked) {
    return (
      <div className="admin-page" style={{ maxWidth: 360 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#0A1628' }}>Admin Permissions</h2>
        <form onSubmit={submitPin} className="admin-card">
          <p style={{ margin: '0 0 12px', color: '#4B5563', fontSize: 13 }}>Enter the admin PIN to review access requests.</p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={adminPin}
            onChange={e => { setAdminPin(e.target.value); setError(false) }}
            placeholder="Admin PIN"
            style={{
              width: '100%', textAlign: 'center', letterSpacing: '0.3em', fontSize: 18,
              padding: '10px 12px', borderRadius: 8,
              border: `1px solid ${error ? '#ef4444' : '#E5E9F0'}`, marginBottom: 12,
            }}
          />
          {error && <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 12 }}>Incorrect admin PIN.</div>}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={checking || !adminPin} style={{ width: '100%' }}>
            {checking ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    )
  }

  const pending = requests?.filter(r => r.status === 'pending') ?? []
  const decided = requests?.filter(r => r.status !== 'pending') ?? []

  return (
    <div className="admin-page">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#0A1628' }}>Admin Permissions</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Requests from SplashGate's "Request access" form.</p>
      </div>

      {loadError && <div className="admin-card"><div className="admin-empty">Could not reach mfg_core, or the admin PIN was rejected — try again in a few seconds.</div></div>}
      {!requests && !loadError && <div className="admin-loading">Loading…</div>}

      {requests && (
        <>
          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Pending ({pending.length})</h3>
          {pending.length === 0 && <div className="admin-card"><div className="admin-empty">No pending requests.</div></div>}
          {pending.length > 0 && (
            <div className="admin-table-wrap" style={{ marginBottom: 24 }}>
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Reason</th><th>Requested</th><th></th></tr></thead>
                <tbody>
                  {pending.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.email}</td>
                      <td>{r.company || '—'}</td>
                      <td style={{ color: '#6B7280' }}>{r.reason || '—'}</td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="admin-btn admin-btn-primary" disabled={busyId === r.id} onClick={() => decide(r.id, 'approve')}>Approve</button>
                        <button className="admin-btn admin-btn-secondary" disabled={busyId === r.id} onClick={() => decide(r.id, 'deny')}>Deny</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Decided</h3>
          {decided.length === 0 && <div className="admin-card"><div className="admin-empty">No decided requests yet.</div></div>}
          {decided.length > 0 && (
            <div className="admin-table-wrap" style={{ marginBottom: 24 }}>
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Decided</th></tr></thead>
                <tbody>
                  {decided.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.email}</td>
                      <td><span className={`admin-badge ${r.status === 'approved' ? 'admin-badge-green' : 'admin-badge-gray'}`}>{r.status}</span></td>
                      <td>{r.decided_at ? new Date(r.decided_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Access Log</h3>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6B7280' }}>
            Every successful splash-PIN unlock — no identity is captured by the PIN itself, just IP/browser/time.
          </p>
          {logError && <div className="admin-card"><div className="admin-empty">Could not load the access log.</div></div>}
          {!accessLog && !logError && <div className="admin-loading">Loading…</div>}
          {accessLog && accessLog.length === 0 && <div className="admin-card"><div className="admin-empty">No unlocks recorded yet.</div></div>}
          {accessLog && accessLog.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>When</th><th>IP</th><th>Browser</th></tr></thead>
                <tbody>
                  {accessLog.map((e, i) => (
                    <tr key={i}>
                      <td>{new Date(e.created_at).toLocaleString()}</td>
                      <td>{e.ip || '—'}</td>
                      <td style={{ color: '#6B7280', fontSize: 12 }}>{e.user_agent || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
