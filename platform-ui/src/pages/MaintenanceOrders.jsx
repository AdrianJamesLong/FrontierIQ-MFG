import { useState, useEffect, useMemo } from 'react'
import { Wrench, AlertCircle, RefreshCw, Filter, Clock, DollarSign, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CHART_COLORS = ['#0A1628', '#1C3668', '#2E558F', '#4A7AB5', '#6B9ED4', '#8FBDE0']
const TYPE_COLOR = { PM: '#2E558F', CM: '#4A7AB5', EM: '#0A1628' }
const STATUS_COLOR = { Completed: '#2E558F', 'In Progress': '#F59E0B', Planned: '#6B9ED4' }

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function MaintenanceOrders() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [filterLine, setFilterLine] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [agentError, setAgentError] = useState(null)

  const callAgent = async (message) => {
    setAgentLoading(true); setAgentError(null); setAgentResponse('')
    try {
      const res = await fetch(`${API_URL}/api/agent/tier1/line_operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, agent_type: 'line_operations', thread_id: 'maintenance-orders' }),
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
  const [filterStatus, setFilterStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [showPageInfo, setShowPageInfo] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/maintenance-orders`)
      if (!res.ok) throw new Error('Failed to fetch maintenance orders')
      const result = await res.json()
      setData(result.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const lines = ['All', ...new Set(data.map(r => r.LINE).filter(Boolean)).values()].sort()
  const types = ['All', 'PM', 'CM', 'EM']
  const statuses = ['All', 'Completed', 'In Progress', 'Planned']

  const filtered = useMemo(() => data.filter(r =>
    (filterLine === 'All' || r.LINE === filterLine) &&
    (filterType === 'All' || r.ORDER_TYPE === filterType) &&
    (filterStatus === 'All' || r.STATUS === filterStatus) &&
    (search === '' || r.EQUIPMENT_ID?.toLowerCase().includes(search.toLowerCase()) || r.DESCRIPTION?.toLowerCase().includes(search.toLowerCase()) || r.MAINTENANCE_ORDER_ID?.includes(search))
  ), [data, filterLine, filterType, filterStatus, search])

  // KPIs
  const totalCost = filtered.reduce((s, r) => s + (parseFloat(r.TOTAL_COST_GBP) || 0), 0)
  const totalDowntime = filtered.reduce((s, r) => s + (parseFloat(r.DOWNTIME_HRS) || 0), 0)
  const completedCount = filtered.filter(r => r.STATUS === 'Completed').length
  const emergencyCount = filtered.filter(r => r.ORDER_TYPE === 'EM').length

  // Order type breakdown
  const typeAgg = {}
  data.forEach(r => {
    const t = r.ORDER_TYPE || 'Unknown'
    if (!typeAgg[t]) typeAgg[t] = { type: t, count: 0, cost: 0, downtime: 0 }
    typeAgg[t].count++
    typeAgg[t].cost += parseFloat(r.TOTAL_COST_GBP) || 0
    typeAgg[t].downtime += parseFloat(r.DOWNTIME_HRS) || 0
  })
  const typeData = Object.values(typeAgg)

  // Status breakdown
  const statusAgg = {}
  filtered.forEach(r => {
    const s = r.STATUS || 'Unknown'
    if (!statusAgg[s]) statusAgg[s] = { status: s, count: 0 }
    statusAgg[s].count++
  })
  const statusData = Object.values(statusAgg)

  // Cost by line
  const lineAgg = {}
  filtered.forEach(r => {
    const line = r.LINE || 'Unknown'
    if (!lineAgg[line]) lineAgg[line] = { line, cost: 0, downtime: 0, count: 0 }
    lineAgg[line].cost += parseFloat(r.TOTAL_COST_GBP) || 0
    lineAgg[line].downtime += parseFloat(r.DOWNTIME_HRS) || 0
    lineAgg[line].count++
  })
  const lineData = Object.values(lineAgg).sort((a, b) => b.cost - a.cost)

  // Failure mode frequency
  const failureAgg = {}
  filtered.forEach(r => {
    const fm = r.FAILURE_MODE || 'N/A'
    if (fm === 'None' || fm === 'N/A') return
    failureAgg[fm] = (failureAgg[fm] || 0) + 1
  })
  const failureData = Object.entries(failureAgg).map(([mode, count]) => ({ mode, count })).sort((a, b) => b.count - a.count)

  // MTBF / MTTR by equipment (top 10 by order count)
  const equipAgg = {}
  filtered.forEach(r => {
    const eq = r.EQUIPMENT_ID || 'Unknown'
    if (!equipAgg[eq]) equipAgg[eq] = { eq, orders: 0, totalDowntime: 0, totalDuration: 0 }
    equipAgg[eq].orders++
    equipAgg[eq].totalDowntime += parseFloat(r.DOWNTIME_HRS) || 0
    equipAgg[eq].totalDuration += parseFloat(r.ACTUAL_DURATION_HRS) || parseFloat(r.PLANNED_DURATION_HRS) || 0
  })
  // Simplified MTBF: total period / number of failures (assume 153 day period)
  const PERIOD_HRS = 153 * 24
  const equipMetrics = Object.values(equipAgg).map(e => ({
    eq: e.eq,
    orders: e.orders,
    mtbf: parseFloat((PERIOD_HRS / Math.max(e.orders, 1)).toFixed(1)),
    mttr: parseFloat((e.totalDowntime / Math.max(e.orders, 1)).toFixed(1)),
    totalDowntime: parseFloat(e.totalDowntime.toFixed(1)),
  })).sort((a, b) => b.orders - a.orders).slice(0, 12)

  const tabs = ['overview', 'by equipment', 'failure analysis', 'work orders']

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Maintenance Orders</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            PM / CM / EM work orders, MTBF/MTTR, failure analysis and maintenance cost · {data.length} orders
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '16px 0' }}>
        {[
          { label: 'Total Maintenance Cost', value: `$${(totalCost / 1000).toFixed(0)}k`, sub: `${filtered.length} work orders`, icon: DollarSign, color: '#1C3668' },
          { label: 'Total Downtime', value: `${totalDowntime.toFixed(0)}h`, sub: 'cumulative downtime hrs', icon: Clock, color: '#2E558F' },
          { label: 'Completed Orders', value: completedCount, sub: `${(completedCount / Math.max(filtered.length, 1) * 100).toFixed(0)}% completion rate`, icon: Wrench, color: '#4A7AB5' },
          { label: 'Emergency Orders', value: emergencyCount, sub: 'unplanned EM events', icon: AlertCircle, color: emergencyCount > 5 ? '#DC2626' : '#6B9ED4' },
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '14px 0', flexWrap: 'wrap' }}>
        <Filter size={13} color="#6B7280" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search equipment / description..."
          style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid #E8ECF4', borderRadius: '6px', width: '200px' }} />
        {lines.map(l => (
          <button key={l} onClick={() => setFilterLine(l)}
            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
              borderColor: filterLine === l ? '#2E558F' : '#E8ECF4',
              background: filterLine === l ? '#EEF2FA' : '#fff',
              color: filterLine === l ? '#1C3668' : '#6B7280' }}>
            {l}
          </button>
        ))}
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
              borderColor: filterType === t ? '#2E558F' : '#E8ECF4',
              background: filterType === t ? '#EEF2FA' : '#fff',
              color: filterType === t ? '#1C3668' : '#6B7280', fontWeight: t !== 'All' ? '600' : '400' }}>
            {t}
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

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }} />Loading maintenance data...</div>}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Order Type Breakdown</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count"
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {typeData.map((entry, i) => <Cell key={i} fill={TYPE_COLOR[entry.type] || CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} orders`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
                  {typeData.map(d => (
                    <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6B7280' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: TYPE_COLOR[d.type] || '#888' }} />
                      {d.type}: {d.count}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Maintenance Cost & Downtime by Line</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={lineData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="line" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `${v}h`} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="cost" name="Cost $" fill="#1C3668" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="right" dataKey="downtime" name="Downtime h" fill="#6B9ED4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Order Type Cost Comparison</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {typeData.sort((a, b) => b.cost - a.cost).map((t, i) => (
                    <div key={t.type} style={{ background: '#FAFBFD', borderRadius: '8px', padding: '12px', borderLeft: `4px solid ${TYPE_COLOR[t.type] || CHART_COLORS[i]}` }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628', marginBottom: '4px' }}>
                        {t.type === 'PM' ? 'Preventive' : t.type === 'CM' ? 'Corrective' : 'Emergency'} ({t.type})
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Orders: <strong style={{ color: '#0A1628' }}>{t.count}</strong></div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Total Cost: <strong style={{ color: '#0A1628' }}>${t.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Downtime: <strong style={{ color: '#0A1628' }}>{t.downtime.toFixed(0)}h</strong></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'by equipment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>MTBF & MTTR by Equipment (top 12 by order volume)</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px' }}>MTBF = Mean Time Between Failures (hrs). MTTR = Mean Time To Repair (hrs). Based on 153-day period.</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#EEF2FA' }}>
                        {['Equipment', 'Orders', 'MTBF (hrs)', 'MTTR (hrs)', 'Total Downtime (hrs)'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {equipMetrics.map((eq, i) => (
                        <tr key={eq.eq} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                          <td style={{ padding: '7px 12px', fontWeight: '600', color: '#0A1628' }}>{eq.eq}</td>
                          <td style={{ padding: '7px 12px', color: '#374151' }}>{eq.orders}</td>
                          <td style={{ padding: '7px 12px', color: eq.mtbf < 500 ? '#991B1B' : '#374151', fontWeight: eq.mtbf < 500 ? '600' : '400' }}>{eq.mtbf}</td>
                          <td style={{ padding: '7px 12px', color: eq.mttr > 8 ? '#92400E' : '#374151' }}>{eq.mttr}</td>
                          <td style={{ padding: '7px 12px', color: '#374151' }}>{eq.totalDowntime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'failure analysis' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Failure Mode Frequency</div>
                {failureData.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#6B7280', padding: '20px 0' }}>No failure modes recorded for current filter.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {failureData.slice(0, 10).map((d, i) => {
                      const total = failureData.reduce((s, r) => s + r.count, 0)
                      const pct = Math.round(d.count / total * 100)
                      return (
                        <div key={d.mode}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                            <span style={{ color: '#374151' }}>{d.mode}</span>
                            <span style={{ color: '#6B7280' }}>{d.count} ({pct}%)</span>
                          </div>
                          <div style={{ height: '6px', background: '#EEF2FA', borderRadius: '3px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: '3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Order Status Overview</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count"
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {statusData.map((entry, i) => <Cell key={i} fill={STATUS_COLOR[entry.status] || CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} orders`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'work orders' && (
            <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF4', fontSize: '11px', color: '#6B7280' }}>
                {filtered.length} work orders matching current filters
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#EEF2FA' }}>
                    <tr>
                      {['Order ID', 'Equipment', 'Line', 'Type', 'Priority', 'Description', 'Status', 'Start Date', 'Duration h', 'Cost $', 'Downtime h'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 200).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: r.ORDER_TYPE === 'EM' ? '#FEF9F9' : i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                        <td style={{ padding: '6px 10px', color: '#374151', fontFamily: 'monospace', fontSize: '10px' }}>{r.MAINTENANCE_ORDER_ID}</td>
                        <td style={{ padding: '6px 10px', color: '#374151', whiteSpace: 'nowrap' }}>{r.EQUIPMENT_ID}</td>
                        <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.LINE}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '700',
                            background: r.ORDER_TYPE === 'PM' ? '#EEF2FA' : r.ORDER_TYPE === 'EM' ? '#FEE2E2' : '#E0F2FE',
                            color: r.ORDER_TYPE === 'PM' ? '#1C3668' : r.ORDER_TYPE === 'EM' ? '#991B1B' : '#0369A1' }}>
                            {r.ORDER_TYPE}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.PRIORITY}</td>
                        <td style={{ padding: '6px 10px', color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.DESCRIPTION}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '600',
                            background: r.STATUS === 'Completed' ? '#D1FAE5' : r.STATUS === 'In Progress' ? '#FEF3C7' : '#EEF2FA',
                            color: r.STATUS === 'Completed' ? '#065F46' : r.STATUS === 'In Progress' ? '#92400E' : '#1C3668' }}>
                            {r.STATUS}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.PLANNED_START_DATE}</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{parseFloat(r.ACTUAL_DURATION_HRS || r.PLANNED_DURATION_HRS || 0).toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>${parseFloat(r.TOTAL_COST_GBP || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td style={{ padding: '6px 10px', color: (parseFloat(r.DOWNTIME_HRS) || 0) > 8 ? '#92400E' : '#374151', fontWeight: (parseFloat(r.DOWNTIME_HRS) || 0) > 8 ? '600' : '400' }}>{parseFloat(r.DOWNTIME_HRS || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > 200 && <div style={{ padding: '10px 16px', borderTop: '1px solid #E8ECF4', fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>Showing 200 of {filtered.length}</div>}
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
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Maintenance AI Agent</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · PM/CM/EM orders, MTBF/MTTR, failure patterns</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['What are the most common failure types?', 'Which equipment has the most emergency orders?', 'Show MTBF trends by equipment', 'What is the total maintenance cost this period?'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing maintenance data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about maintenance orders, failure modes, MTBF..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Maintenance Orders</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Shows all planned (PM), corrective (CM) and emergency (EM) maintenance work orders for NovaChem Grangemouth. KPIs include total maintenance cost, cumulative downtime, completion rate and emergency order count. The failure analysis tab shows recurring failure modes by equipment.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Overview</strong> — KPI summary across all work order types</li>
                  <li style={{ marginBottom: '4px' }}><strong>By Equipment</strong> — Maintenance cost and downtime per asset</li>
                  <li style={{ marginBottom: '4px' }}><strong>Failure Analysis</strong> — Recurring failure modes and frequencies</li>
                  <li style={{ marginBottom: '4px' }}><strong>Work Orders</strong> — Full filterable work order log</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>maintenance_orders</strong> — PM, CM and EM work orders with cost, duration and failure mode</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenanceOrders
