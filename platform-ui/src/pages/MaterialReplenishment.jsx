import { useState, useEffect, useMemo } from 'react'
import { Factory, AlertCircle, RefreshCw, Clock, Package, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CHART_COLORS = ['#0A1628', '#1C3668', '#2E558F', '#4A7AB5', '#6B9ED4', '#8FBDE0']

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function MaterialReplenishment() {
  const [activeTab, setActiveTab] = useState('replenishment')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [filterLine, setFilterLine] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [agentError, setAgentError] = useState(null)

  const callAgent = async (message) => {
    setAgentLoading(true); setAgentError(null); setAgentResponse('')
    try {
      const res = await fetch(`${API_URL}/api/agent/tier1/performance_analyst`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, agent_type: 'performance_analyst', thread_id: 'material-replenishment' }),
      })
      if (!res.ok) throw new Error('Agent request failed')
      const result = await res.json()
      setAgentResponse(stripEmoji(result.response || ''))
    } catch (err) {
      setAgentError(err.message)
    } finally {
      setAgentLoading(false)
    }
  }

  const [showPageInfo, setShowPageInfo] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/inventory`)
      if (!res.ok) throw new Error('Failed to fetch inventory data')
      const result = await res.json()
      setData(result.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Latest snapshot per material
  const latestByMaterial = useMemo(() => {
    const latest = {}
    data.forEach(r => {
      const mat = r.MATERIAL_ID
      if (!latest[mat] || r.SNAPSHOT_DATE > latest[mat].SNAPSHOT_DATE) latest[mat] = r
    })
    return Object.values(latest)
  }, [data])

  const lines = ['All', ...new Set(latestByMaterial.map(r => r.WORK_CENTER).filter(Boolean)).values()].sort()
  const filtered = useMemo(() =>
    filterLine === 'All' ? latestByMaterial : latestByMaterial.filter(r => r.WORK_CENTER === filterLine),
    [latestByMaterial, filterLine]
  )

  // Materials needing replenishment (stock <= reorder point)
  const needsReplenishment = filtered.filter(r =>
    (parseFloat(r.STOCK_LEVEL_UNITS) || 0) <= (parseFloat(r.REORDER_POINT_UNITS) || 0)
  ).sort((a, b) => {
    const daysA = parseFloat(a.DAYS_OF_COVER) || 0
    const daysB = parseFloat(b.DAYS_OF_COVER) || 0
    return daysA - daysB
  })

  // Materials with pending orders
  const withPendingOrders = filtered.filter(r => (parseFloat(r.PENDING_ORDERS_UNITS) || 0) > 0)

  // Lead time distribution
  const leadTimeAgg = {}
  filtered.forEach(r => {
    const lt = String(r.LEAD_TIME_DAYS || 'Unknown')
    leadTimeAgg[lt] = (leadTimeAgg[lt] || 0) + 1
  })
  const leadTimeData = Object.entries(leadTimeAgg).sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([days, count]) => ({ days: `${days}d`, count }))

  // Days of cover distribution
  const coverBuckets = { '0-7d': 0, '8-14d': 0, '15-30d': 0, '31-60d': 0, '60+d': 0 }
  filtered.forEach(r => {
    const d = parseFloat(r.DAYS_OF_COVER) || 0
    if (d <= 7) coverBuckets['0-7d']++
    else if (d <= 14) coverBuckets['8-14d']++
    else if (d <= 30) coverBuckets['15-30d']++
    else if (d <= 60) coverBuckets['31-60d']++
    else coverBuckets['60+d']++
  })
  const coverData = Object.entries(coverBuckets).map(([range, count]) => ({ range, count }))

  // Replenishment value needed
  const replenishValue = needsReplenishment.reduce((s, r) => {
    const needed = Math.max(0, (parseFloat(r.REORDER_POINT_UNITS) || 0) * 2 - (parseFloat(r.STOCK_LEVEL_UNITS) || 0))
    return s + needed * (parseFloat(r.UNIT_COST_GBP) || 0)
  }, 0)

  const tabs = ['replenishment', 'lead times', 'pending orders', 'all materials']

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Material Replenishment</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Reorder triggers, lead times and replenishment planning · {latestByMaterial.length} materials
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '16px 0' }}>
        {[
          { label: 'Needs Replenishment', value: needsReplenishment.length, sub: 'at or below reorder point', icon: Factory, color: '#1C3668' },
          { label: 'Replenishment Value', value: `$${(replenishValue / 1000).toFixed(0)}k`, sub: 'estimated order value', icon: Package, color: '#2E558F' },
          { label: 'Pending Orders', value: withPendingOrders.length, sub: 'materials with open POs', icon: Clock, color: '#4A7AB5' },
          { label: 'Avg Lead Time', value: `${(filtered.reduce((s, r) => s + (parseFloat(r.LEAD_TIME_DAYS) || 0), 0) / Math.max(filtered.length, 1)).toFixed(0)}d`, sub: 'across filtered materials', icon: AlertCircle, color: '#6B9ED4' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#0A1628', lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>{k.sub}</div>
                </div>
                <div style={{ background: '#EEF2FA', borderRadius: '6px', padding: '8px' }}>
                  <Icon size={16} color={k.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        {lines.map(l => (
          <button key={l} onClick={() => setFilterLine(l)}
            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
              borderColor: filterLine === l ? '#2E558F' : '#E8ECF4',
              background: filterLine === l ? '#EEF2FA' : '#fff',
              color: filterLine === l ? '#1C3668' : '#6B7280', fontWeight: filterLine === l ? '600' : '400' }}>
            {l}
          </button>
        ))}
        <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #E8ECF4', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280' }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      <div className="tabs-container">
        {tabs.map(t => (
          <button key={t} className={`tab-button ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)} style={{ textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }} />Loading replenishment data...</div>}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <>
          {activeTab === 'replenishment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Days of Cover Distribution</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={coverData} margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [`${v} materials`]} />
                      <Bar dataKey="count" name="Materials" radius={[3, 3, 0, 0]}>
                        {coverData.map((entry, i) => (
                          <Cell key={i} fill={i === 0 ? '#991B1B' : i === 1 ? '#F59E0B' : CHART_COLORS[Math.min(i, CHART_COLORS.length - 1)]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: '#EEF2FA', border: '1px solid rgba(28,54,104,0.15)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1C3668', marginBottom: '10px' }}>Replenishment Priority</div>
                  <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '6px' }}>Materials sorted by days of cover remaining. Class A items should be replenished first to avoid production stoppages.</div>
                    <div style={{ fontWeight: '600', color: '#0A1628' }}>{needsReplenishment.filter(r => r.ABC_CLASS === 'A').length} Class A materials</div>
                    <div style={{ color: '#6B7280' }}>at or below reorder point</div>
                    <div style={{ fontWeight: '600', color: '#0A1628', marginTop: '4px' }}>{needsReplenishment.filter(r => r.ABC_CLASS === 'B').length} Class B materials</div>
                    <div style={{ color: '#6B7280' }}>at or below reorder point</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF4', fontSize: '11px', color: '#6B7280' }}>
                  {needsReplenishment.length} materials requiring replenishment — sorted by urgency
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#EEF2FA' }}>
                      <tr>
                        {['Material', 'Description', 'Line', 'ABC', 'Stock', 'Reorder Pt', 'Days Cover', 'Lead Time', 'Unit Cost'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {needsReplenishment.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: (parseFloat(r.DAYS_OF_COVER) || 0) <= 7 ? '#FEF9F9' : i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                          <td style={{ padding: '6px 10px', color: '#374151', fontFamily: 'monospace' }}>{r.MATERIAL_ID}</td>
                          <td style={{ padding: '6px 10px', color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.MATERIAL_DESC}</td>
                          <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.WORK_CENTER}</td>
                          <td style={{ padding: '6px 10px' }}><span style={{ background: '#EEF2FA', color: '#1C3668', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', fontSize: '10px' }}>{r.ABC_CLASS}</span></td>
                          <td style={{ padding: '6px 10px', color: '#374151', fontWeight: '600' }}>{parseFloat(r.STOCK_LEVEL_UNITS || 0).toLocaleString()}</td>
                          <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.REORDER_POINT_UNITS}</td>
                          <td style={{ padding: '6px 10px', fontWeight: '600', color: (parseFloat(r.DAYS_OF_COVER) || 0) <= 7 ? '#991B1B' : '#374151' }}>{r.DAYS_OF_COVER}d</td>
                          <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.LEAD_TIME_DAYS}d</td>
                          <td style={{ padding: '6px 10px', color: '#374151' }}>${parseFloat(r.UNIT_COST_GBP || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lead times' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Lead Time Distribution (days)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={leadTimeData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="days" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} materials`]} />
                    <Bar dataKey="count" name="Materials" fill="#2E558F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Lead Time by ABC Class</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['A', 'B', 'C'].map(cls => {
                    const mats = filtered.filter(r => r.ABC_CLASS === cls)
                    const avg = mats.length > 0 ? mats.reduce((s, r) => s + (parseFloat(r.LEAD_TIME_DAYS) || 0), 0) / mats.length : 0
                    const max = Math.max(...mats.map(r => parseFloat(r.LEAD_TIME_DAYS) || 0))
                    return (
                      <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#FAFBFD', borderRadius: '6px' }}>
                        <div style={{ width: '28px', height: '28px', background: CHART_COLORS[['A', 'B', 'C'].indexOf(cls)], borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{cls}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#374151' }}>{mats.length} materials · Avg: <strong>{avg.toFixed(0)} days</strong> · Max: <strong>{max} days</strong></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pending orders' && (
            <div style={{ marginTop: '16px' }}>
              {withPendingOrders.length === 0 ? (
                <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '16px', color: '#065F46', fontSize: '12px' }}>No pending purchase orders found for the selected filter.</div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#EEF2FA' }}>
                        <tr>
                          {['Material ID', 'Description', 'Line', 'ABC', 'Current Stock', 'Pending Order Units', 'Post-Delivery Stock', 'Days Cover'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {withPendingOrders.map((r, i) => {
                          const postDelivery = (parseFloat(r.STOCK_LEVEL_UNITS) || 0) + (parseFloat(r.PENDING_ORDERS_UNITS) || 0)
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                              <td style={{ padding: '6px 10px', color: '#374151', fontFamily: 'monospace' }}>{r.MATERIAL_ID}</td>
                              <td style={{ padding: '6px 10px', color: '#374151', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.MATERIAL_DESC}</td>
                              <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.WORK_CENTER}</td>
                              <td style={{ padding: '6px 10px' }}><span style={{ background: '#EEF2FA', color: '#1C3668', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', fontSize: '10px' }}>{r.ABC_CLASS}</span></td>
                              <td style={{ padding: '6px 10px', color: '#374151' }}>{parseFloat(r.STOCK_LEVEL_UNITS || 0).toLocaleString()}</td>
                              <td style={{ padding: '6px 10px', color: '#2E558F', fontWeight: '600' }}>{parseFloat(r.PENDING_ORDERS_UNITS || 0).toLocaleString()}</td>
                              <td style={{ padding: '6px 10px', color: '#374151' }}>{postDelivery.toLocaleString()}</td>
                              <td style={{ padding: '6px 10px', color: '#374151' }}>{r.DAYS_OF_COVER}d</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'all materials' && (
            <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF4', fontSize: '11px', color: '#6B7280' }}>{filtered.length} materials · {filterLine !== 'All' ? filterLine : 'all lines'}</div>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#EEF2FA' }}>
                    <tr>
                      {['Material', 'Description', 'ABC', 'Stock', 'Reorder Pt', 'Max Stock', 'Days Cover', 'Lead Time', 'Pending PO', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 200).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                        <td style={{ padding: '6px 10px', color: '#374151', fontFamily: 'monospace' }}>{r.MATERIAL_ID}</td>
                        <td style={{ padding: '6px 10px', color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.MATERIAL_DESC}</td>
                        <td style={{ padding: '6px 10px' }}><span style={{ background: '#EEF2FA', color: '#1C3668', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', fontSize: '10px' }}>{r.ABC_CLASS}</span></td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{parseFloat(r.STOCK_LEVEL_UNITS || 0).toLocaleString()}</td>
                        <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.REORDER_POINT_UNITS}</td>
                        <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.MAX_STOCK_UNITS}</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.DAYS_OF_COVER}d</td>
                        <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.LEAD_TIME_DAYS}d</td>
                        <td style={{ padding: '6px 10px', color: '#2E558F' }}>{parseFloat(r.PENDING_ORDERS_UNITS || 0) > 0 ? parseFloat(r.PENDING_ORDERS_UNITS || 0).toLocaleString() : '—'}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '600',
                            background: r.STOCK_STATUS === 'Critical' ? '#FEE2E2' : r.STOCK_STATUS === 'Low' ? '#FEF3C7' : r.STOCK_STATUS === 'Overstock' ? '#EEF2FA' : '#D1FAE5',
                            color: r.STOCK_STATUS === 'Critical' ? '#991B1B' : r.STOCK_STATUS === 'Low' ? '#92400E' : r.STOCK_STATUS === 'Overstock' ? '#1C3668' : '#065F46' }}>
                            {r.STOCK_STATUS}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '660px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8ECF4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#EEF2FA', borderRadius: '8px', padding: '8px' }}><Bot size={18} color="#1C3668" /></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Replenishment Analyst</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · reorder triggers, lead times, pending orders</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Which materials need urgent replenishment?', 'What is the total replenishment value needed?', 'Show materials with the longest lead times', 'Are there any lines at risk of stockout?'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing replenishment data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about reorder points, lead times, stockout risk..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
              <button onClick={() => { if (agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} disabled={agentLoading || !agentInput.trim()} style={{ background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', opacity: (agentLoading || !agentInput.trim()) ? 0.5 : 1 }}><Send size={13} /> Send</button>
            </div>
          </div>
        </div>
      )}

      {showPageInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(2px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowPageInfo(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid #E8ECF4' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>About this section</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Material Replenishment</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Replenishment planning view showing which materials need ordering based on current stock vs reorder points. The Lead Times tab ranks materials by supplier lead time. Pending Orders shows materials already on order. Replenishment value is calculated as the estimated cost to bring stock up to 2× reorder point.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Replenishment</strong> — Materials at or below reorder point needing ordering</li>
                  <li style={{ marginBottom: '4px' }}><strong>Lead Times</strong> — Materials ranked by supplier lead time</li>
                  <li style={{ marginBottom: '4px' }}><strong>Pending Orders</strong> — Materials already on order</li>
                  <li style={{ marginBottom: '4px' }}><strong>All Materials</strong> — Full material list with stock and reorder status</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>inventory_stock</strong> — Stock snapshot with reorder points, lead times, on-order quantities and unit cost</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaterialReplenishment
