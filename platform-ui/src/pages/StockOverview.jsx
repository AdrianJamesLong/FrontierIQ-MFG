import { useState, useEffect, useMemo } from 'react'
import { Package, AlertCircle, RefreshCw, Filter, TrendingDown, TrendingUp, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CHART_COLORS = ['#0A1628', '#1C3668', '#2E558F', '#4A7AB5', '#6B9ED4', '#8FBDE0']
const STATUS_COLOR = { OK: '#2E558F', Low: '#F59E0B', Critical: '#DC2626', Overstock: '#6B9ED4' }

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function StockOverview() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [filterABC, setFilterABC] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterLine, setFilterLine] = useState('All')
  const [search, setSearch] = useState('')
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
        body: JSON.stringify({ message, agent_type: 'performance_analyst', thread_id: 'stock-overview' }),
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

  const abcClasses = ['All', ...new Set(latestByMaterial.map(r => r.ABC_CLASS).filter(Boolean)).values()].sort()
  const statuses = ['All', ...new Set(latestByMaterial.map(r => r.STOCK_STATUS).filter(Boolean)).values()].sort()
  const lines = ['All', ...new Set(latestByMaterial.map(r => r.WORK_CENTER).filter(Boolean)).values()].sort()

  const filtered = useMemo(() =>
    latestByMaterial.filter(r =>
      (filterABC === 'All' || r.ABC_CLASS === filterABC) &&
      (filterStatus === 'All' || r.STOCK_STATUS === filterStatus) &&
      (filterLine === 'All' || r.WORK_CENTER === filterLine) &&
      (search === '' || r.MATERIAL_DESC?.toLowerCase().includes(search.toLowerCase()) || String(r.MATERIAL_ID).includes(search))
    ), [latestByMaterial, filterABC, filterStatus, filterLine, search])

  // KPIs
  const totalValue = filtered.reduce((s, r) => s + (parseFloat(r.STOCK_VALUE_GBP) || 0), 0)
  const lowStockCount = filtered.filter(r => r.STOCK_STATUS === 'Low').length
  const criticalCount = filtered.filter(r => r.STOCK_STATUS === 'Critical').length
  const overstockCount = filtered.filter(r => r.STOCK_STATUS === 'Overstock').length

  // ABC breakdown
  const abcAgg = {}
  latestByMaterial.forEach(r => {
    const cls = r.ABC_CLASS || 'Unknown'
    if (!abcAgg[cls]) abcAgg[cls] = { cls, count: 0, value: 0 }
    abcAgg[cls].count++
    abcAgg[cls].value += parseFloat(r.STOCK_VALUE_GBP) || 0
  })
  const abcData = Object.values(abcAgg).sort((a, b) => a.cls.localeCompare(b.cls))

  // Status breakdown
  const statusAgg = {}
  latestByMaterial.forEach(r => {
    const s = r.STOCK_STATUS || 'Unknown'
    if (!statusAgg[s]) statusAgg[s] = { status: s, count: 0 }
    statusAgg[s].count++
  })
  const statusData = Object.values(statusAgg)

  // Stock value by line
  const lineAgg = {}
  latestByMaterial.forEach(r => {
    const line = r.WORK_CENTER || 'Unknown'
    if (!lineAgg[line]) lineAgg[line] = { line, value: 0, count: 0 }
    lineAgg[line].value += parseFloat(r.STOCK_VALUE_GBP) || 0
    lineAgg[line].count++
  })
  const lineData = Object.values(lineAgg).sort((a, b) => b.value - a.value)

  const tabs = ['overview', 'abc analysis', 'stock table', 'alerts']

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Stock Overview</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Inventory stock levels, ABC classification and status — {latestByMaterial.length} materials · latest snapshot
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '16px 0' }}>
        {[
          { label: 'Total Stock Value', value: `$${(totalValue / 1000).toFixed(0)}k`, sub: `${filtered.length} materials`, icon: Package, color: '#1C3668' },
          { label: 'Critical Stock', value: criticalCount, sub: 'below safety stock', icon: AlertCircle, color: '#DC2626' },
          { label: 'Low Stock', value: lowStockCount, sub: 'near reorder point', icon: TrendingDown, color: '#F59E0B' },
          { label: 'Overstock', value: overstockCount, sub: 'above max stock level', icon: TrendingUp, color: '#4A7AB5' },
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

      <div className="tabs-container">
        {tabs.map(t => (
          <button key={t} className={`tab-button ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)} style={{ textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
        <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #E8ECF4', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280' }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }} />Loading inventory data...</div>}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Stock Status Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count"
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {statusData.map((entry, i) => <Cell key={i} fill={STATUS_COLOR[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} materials`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Stock Value by Production Line ($)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={lineData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="line" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`]} />
                    <Bar dataKey="value" name="Stock Value $" radius={[3, 3, 0, 0]}>
                      {lineData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>ABC Classification — Count & Value</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={abcData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="cls" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="count" name="Materials" fill="#2E558F" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="right" dataKey="value" name="Value $" fill="#6B9ED4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'abc analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {abcData.map((cls, i) => {
                const materials = latestByMaterial.filter(r => r.ABC_CLASS === cls.cls)
                const pct = (cls.value / latestByMaterial.reduce((s, r) => s + (parseFloat(r.STOCK_VALUE_GBP) || 0), 0) * 100).toFixed(1)
                return (
                  <div key={cls.cls} style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px', borderLeft: `4px solid ${CHART_COLORS[i]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Class {cls.cls}</span>
                        <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '10px' }}>{cls.count} materials · ${(cls.value / 1000).toFixed(0)}k stock value · {pct}% of total</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {materials.slice(0, 8).map(m => (
                        <div key={m.MATERIAL_ID} style={{ fontSize: '10px', background: '#EEF2FA', color: '#1C3668', padding: '3px 8px', borderRadius: '10px', fontWeight: '500' }}>
                          {m.MATERIAL_ID} · {m.STOCK_STATUS}
                        </div>
                      ))}
                      {materials.length > 8 && <div style={{ fontSize: '10px', color: '#9CA3AF', padding: '3px 8px' }}>+{materials.length - 8} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'stock table' && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                <Filter size={13} color="#6B7280" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search material..."
                  style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid #E8ECF4', borderRadius: '6px', width: '180px' }} />
                {abcClasses.map(c => (
                  <button key={c} onClick={() => setFilterABC(c)}
                    style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
                      borderColor: filterABC === c ? '#2E558F' : '#E8ECF4',
                      background: filterABC === c ? '#EEF2FA' : '#fff',
                      color: filterABC === c ? '#1C3668' : '#6B7280' }}>
                    {c === 'All' ? 'All Classes' : `Class ${c}`}
                  </button>
                ))}
                {statuses.map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
                      borderColor: filterStatus === s ? '#2E558F' : '#E8ECF4',
                      background: filterStatus === s ? '#EEF2FA' : '#fff',
                      color: filterStatus === s ? '#1C3668' : '#6B7280' }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr style={{ background: '#EEF2FA' }}>
                        {['Material ID', 'Description', 'Line', 'ABC', 'Stock Units', 'Reorder Pt', 'Safety Stock', 'Days Cover', 'Status', 'Value $'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 200).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                          <td style={{ padding: '6px 10px', color: '#374151', fontFamily: 'monospace' }}>{row.MATERIAL_ID}</td>
                          <td style={{ padding: '6px 10px', color: '#374151', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.MATERIAL_DESC}</td>
                          <td style={{ padding: '6px 10px', color: '#6B7280' }}>{row.WORK_CENTER}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ background: '#EEF2FA', color: '#1C3668', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', fontSize: '10px' }}>{row.ABC_CLASS}</span>
                          </td>
                          <td style={{ padding: '6px 10px', color: '#374151' }}>{parseFloat(row.STOCK_LEVEL_UNITS || 0).toLocaleString()}</td>
                          <td style={{ padding: '6px 10px', color: '#6B7280' }}>{row.REORDER_POINT_UNITS}</td>
                          <td style={{ padding: '6px 10px', color: '#6B7280' }}>{row.SAFETY_STOCK_UNITS}</td>
                          <td style={{ padding: '6px 10px', color: '#374151' }}>{row.DAYS_OF_COVER}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '600',
                              background: row.STOCK_STATUS === 'Critical' ? '#FEE2E2' : row.STOCK_STATUS === 'Low' ? '#FEF3C7' : row.STOCK_STATUS === 'Overstock' ? '#EEF2FA' : '#D1FAE5',
                              color: row.STOCK_STATUS === 'Critical' ? '#991B1B' : row.STOCK_STATUS === 'Low' ? '#92400E' : row.STOCK_STATUS === 'Overstock' ? '#1C3668' : '#065F46' }}>
                              {row.STOCK_STATUS}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px', color: '#374151' }}>${parseFloat(row.STOCK_VALUE_GBP || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 200 && <div style={{ padding: '10px 16px', borderTop: '1px solid #E8ECF4', fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>Showing 200 of {filtered.length}</div>}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {criticalCount === 0 && lowStockCount === 0 && (
                <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '16px', color: '#065F46', fontSize: '12px' }}>
                  No critical or low-stock alerts. All materials are within acceptable stock levels.
                </div>
              )}
              {[...latestByMaterial.filter(r => r.STOCK_STATUS === 'Critical'), ...latestByMaterial.filter(r => r.STOCK_STATUS === 'Low')]
                .slice(0, 30).map((r, i) => (
                  <div key={i} style={{ background: '#fff', border: `1px solid ${r.STOCK_STATUS === 'Critical' ? '#FECACA' : '#FDE68A'}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '2px' }}>{r.MATERIAL_DESC}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>ID: {r.MATERIAL_ID} · Line: {r.WORK_CENTER} · Class: {r.ABC_CLASS}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '8px', fontWeight: '600',
                        background: r.STOCK_STATUS === 'Critical' ? '#FEE2E2' : '#FEF3C7',
                        color: r.STOCK_STATUS === 'Critical' ? '#991B1B' : '#92400E' }}>
                        {r.STOCK_STATUS}
                      </span>
                      <div style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
                        {parseFloat(r.STOCK_LEVEL_UNITS || 0).toLocaleString()} units · {r.DAYS_OF_COVER} days cover
                      </div>
                    </div>
                  </div>
                ))}
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
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Inventory Performance Analyst</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · stock levels, ABC classification, alerts</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Which materials are at critical stock levels?', 'Summarise A-class items at risk', 'Which lines have the highest stock value?', 'Are there any overstock situations?'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing inventory data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about stock levels, ABC classification, alerts..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Stock Overview</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Inventory stock snapshot for NovaChem Grangemouth raw materials and finished goods. ABC classification (A = high value, B = medium, C = low) is used to prioritise attention. The Alerts tab flags Critical (below reorder point) and Low stock items. All KPIs reflect the latest available stock snapshot.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Overview</strong> — KPI summary with stock value and status counts</li>
                  <li style={{ marginBottom: '4px' }}><strong>ABC Analysis</strong> — Stock value and count breakdown by ABC class</li>
                  <li style={{ marginBottom: '4px' }}><strong>Stock Table</strong> — Full material list with current stock levels</li>
                  <li style={{ marginBottom: '4px' }}><strong>Alerts</strong> — Critical and Low stock items requiring attention</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>inventory_stock</strong> — Stock snapshot with material, quantity, ABC class, reorder point and status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockOverview
