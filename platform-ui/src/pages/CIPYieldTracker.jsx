import { useState, useEffect, useMemo } from 'react'
import { Shield, AlertCircle, RefreshCw, Filter, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CHART_COLORS = ['#0A1628', '#1C3668', '#2E558F', '#4A7AB5', '#6B9ED4', '#8FBDE0']

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

const parseDate = str => {
  if (!str) return null
  const [d, m, y] = str.split('/')
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
}

const fmtShort = str => {
  const d = parseDate(str)
  if (!d) return str
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function CIPYieldTracker() {
  const [activeTab, setActiveTab] = useState('cip analysis')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [filterLine, setFilterLine] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [agentError, setAgentError] = useState(null)
  const [showPageInfo, setShowPageInfo] = useState(false)

  const callAgent = async (message) => {
    setAgentLoading(true); setAgentError(null); setAgentResponse('')
    try {
      const res = await fetch(`${API_URL}/api/agent/tier1/performance_analyst`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, agent_type: 'performance_analyst', thread_id: 'cip-yield-tracker' }),
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

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/batch-quality`)
      if (!res.ok) throw new Error('Failed to fetch batch quality data')
      const result = await res.json()
      setData(result.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const lines = ['All', ...new Set(data.map(r => r.WORK_CENTER).filter(Boolean)).values()].sort()

  // Tag rows with isProjected
  const taggedData = useMemo(() => data.map(r => ({
    ...r,
    isProjected: (parseDate(r.PRODUCTION_DATE) || new Date(0)) > TODAY,
  })), [data])

  const filtered = useMemo(() =>
    filterLine === 'All' ? taggedData : taggedData.filter(r => r.WORK_CENTER === filterLine),
    [taggedData, filterLine]
  )

  // CIP analysis — completed batches only
  const completedFiltered = useMemo(() => filtered.filter(r => !r.isProjected), [filtered])

  const cipAgg = {}
  completedFiltered.forEach(r => {
    const cip = r.CIP_SEQUENCE_USED || 'Unknown'
    if (!cipAgg[cip]) cipAgg[cip] = { cip, count: 0, yieldSum: 0, scoreSum: 0, pass: 0 }
    cipAgg[cip].count++
    cipAgg[cip].yieldSum += parseFloat(r.YIELD_PCT) || 0
    cipAgg[cip].scoreSum += parseFloat(r.QUALITY_SCORE) || 0
    if (r.TEST_RESULT === 'Pass') cipAgg[cip].pass++
  })
  const cipData = Object.values(cipAgg).map(c => ({
    ...c,
    avgYield: parseFloat((c.yieldSum / c.count).toFixed(1)),
    avgScore: parseFloat((c.scoreSum / c.count).toFixed(1)),
    passRate: parseFloat((c.pass / c.count * 100).toFixed(1)),
  })).sort((a, b) => b.count - a.count)

  // Yield by line over time — last 20 production dates, sorted properly
  // Show all completed dates + next 15 planned — avoids slicing into the future
  const allUniqueDates = [...new Set(filtered.map(r => r.PRODUCTION_DATE).filter(Boolean))]
    .sort((a, b) => (parseDate(a) || 0) - (parseDate(b) || 0))

  const sortedDates = [
    ...allUniqueDates.filter(d => (parseDate(d) || new Date(0)) <= TODAY),
    ...allUniqueDates.filter(d => (parseDate(d) || new Date(0)) > TODAY).slice(0, 15),
  ]

  const trendDataRaw = sortedDates.map(d => {
    const dayRows = filtered.filter(r => r.PRODUCTION_DATE === d)
    const isProj  = (parseDate(d) || new Date(0)) > TODAY
    const entry = { date: fmtShort(d), rawDate: d, isProjected: isProj }
    lines.filter(l => l !== 'All').forEach(line => {
      const lineRows = dayRows.filter(r => r.WORK_CENTER === line)
      entry[line] = lineRows.length > 0
        ? parseFloat((lineRows.reduce((s, r) => s + (parseFloat(r.YIELD_PCT) || 0), 0) / lineRows.length).toFixed(1))
        : null
    })
    return entry
  })

  // Build actual/projected pairs per line
  const lineNames = lines.filter(l => l !== 'All')
  const lastActIdxByLine = {}
  lineNames.forEach(line => {
    lastActIdxByLine[line] = trendDataRaw.reduce((last, v, i) => (!v.isProjected && v[line] != null) ? i : last, -1)
  })
  const trendData = trendDataRaw.map((v, i) => {
    const entry = { ...v }
    lineNames.forEach(line => {
      const bridge = i === lastActIdxByLine[line]
      entry[`${line}_actual`]    = (!v.isProjected || bridge) ? v[line] : null
      entry[`${line}_projected`] = (v.isProjected  || bridge) ? v[line] : null
    })
    return entry
  })

  const trendProjectedFrom = trendDataRaw.find(v => v.isProjected)?.date ?? null

  // CIP usage donut
  const cipPieData = cipData.map((c, i) => ({ name: c.cip, value: c.count, color: CHART_COLORS[i % CHART_COLORS.length] }))

  // Analyst performance — completed batches only
  const analystAgg = {}
  completedFiltered.forEach(r => {
    const analyst = r.ANALYST_ID || 'Unknown'
    if (!analystAgg[analyst]) analystAgg[analyst] = { analyst, count: 0, pass: 0, yieldSum: 0 }
    analystAgg[analyst].count++
    if (r.TEST_RESULT === 'Pass') analystAgg[analyst].pass++
    analystAgg[analyst].yieldSum += parseFloat(r.YIELD_PCT) || 0
  })
  const analystData = Object.values(analystAgg).map(a => ({
    ...a,
    passRate: parseFloat((a.pass / a.count * 100).toFixed(1)),
    avgYield: parseFloat((a.yieldSum / a.count).toFixed(1)),
  })).sort((a, b) => b.count - a.count)

  // KPIs — completed only
  const topCIP        = cipData[0]
  const bestCIPYield  = cipData.reduce((best, c) => !best || c.avgYield > best.avgYield ? c : best, null)
  const avgYield      = completedFiltered.length > 0 ? completedFiltered.reduce((s, r) => s + (parseFloat(r.YIELD_PCT) || 0), 0) / completedFiltered.length : 0
  const plannedCount  = filtered.filter(r => r.isProjected).length

  const tabs = ['cip analysis', 'yield by line', 'analyst performance', 'shelf life']

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>CIP &amp; Yield Tracker</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Clean-in-place effectiveness, batch yield and analyst performance · {completedFiltered.length} completed + {plannedCount} planned batches
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* KPI row — completed batches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '16px 0' }}>
        {[
          { label: 'Avg Batch Yield',    value: `${avgYield.toFixed(1)}%`,              sub: `${completedFiltered.length} completed batches`,   icon: Shield, color: '#1C3668' },
          { label: 'CIP Sequences',      value: cipData.length,                          sub: 'distinct sequences — completed batches',          icon: Shield, color: '#2E558F' },
          { label: 'Top CIP Sequence',   value: topCIP?.cip || '—',                      sub: `${topCIP?.count || 0} completed batches`,         icon: Shield, color: '#4A7AB5' },
          { label: 'Best Yield CIP',     value: bestCIPYield ? `${bestCIPYield.avgYield}%` : '—', sub: bestCIPYield?.cip || '',                  icon: Shield, color: '#6B9ED4' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#0A1628', lineHeight: 1 }}>{k.value}</div>
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
        <Filter size={13} color="#6B7280" />
        {lines.map(l => (
          <button key={l} onClick={() => setFilterLine(l)}
            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
              borderColor: filterLine === l ? '#2E558F' : '#E8ECF4',
              background: filterLine === l ? '#EEF2FA' : '#fff',
              color: filterLine === l ? '#1C3668' : '#6B7280' }}>
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

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }} />Loading CIP & yield data...</div>}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <>
          {activeTab === 'cip analysis' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>CIP Sequence Usage</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches only</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={cipPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {cipPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={v => [`${v} batches`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Avg Yield by CIP Sequence</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches — which CIP protocol delivers best yield?</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cipData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="cip" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[85, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                    <Bar dataKey="avgYield" name="Avg Yield %" radius={[3, 3, 0, 0]}>
                      {cipData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>CIP Sequence Performance Summary</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FA' }}>
                      {['CIP Sequence', 'Completed Batches', 'Avg Yield %', 'Avg Quality Score', 'Pass Rate %'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cipData.map((c, i) => (
                      <tr key={c.cip} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0A1628' }}>{c.cip}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{c.count}</td>
                        <td style={{ padding: '8px 12px', color: c.avgYield >= 95 ? '#065F46' : '#374151', fontWeight: '600' }}>{c.avgYield}%</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{c.avgScore}</td>
                        <td style={{ padding: '8px 12px', color: c.passRate >= 95 ? '#065F46' : '#374151', fontWeight: '600' }}>{c.passRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'yield by line' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {trendProjectedFrom && (
                <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', color: '#7B5800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={12} />
                  <span><strong>Planned batches from {trendProjectedFrom}:</strong> not yet produced — yield shown is forecast. Solid = completed · Dashed = planned.</span>
                </div>
              )}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Yield % by Line — All Completed + Next 15 Planned Dates</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Each line shown separately — solid = completed batches · dashed = planned (forecast)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} domain={[85, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => v != null ? [`${v}%`] : ['No data']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {lineNames.map((line, i) => [
                      <Line key={`${line}_a`} type="monotone" dataKey={`${line}_actual`}    name={`${line}`}         stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} connectNulls={false} />,
                      <Line key={`${line}_p`} type="monotone" dataKey={`${line}_projected`} name={`${line} (plan)`}  stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls={false} legendType="none" />,
                    ])}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'analyst performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Pass Rate by Analyst</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches only</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analystData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="analyst" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[85, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="passRate" name="Pass Rate %" fill="#2E558F" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="avgYield" name="Avg Yield %" fill="#6B9ED4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Analyst Summary</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FA' }}>
                      {['Analyst', 'Batches Tested', 'Pass Rate', 'Avg Yield'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analystData.map((a, i) => (
                      <tr key={a.analyst} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0A1628' }}>{a.analyst}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{a.count}</td>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: a.passRate >= 95 ? '#065F46' : '#374151' }}>{a.passRate}%</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{a.avgYield}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'shelf life' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Shelf Life Distribution (days)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches only</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(() => {
                    const buckets = {}
                    completedFiltered.forEach(r => {
                      const sl = String(r.SHELF_LIFE_DAYS || 'Unknown')
                      buckets[sl] = (buckets[sl] || 0) + 1
                    })
                    return Object.entries(buckets).sort((a, b) => Number(a[0]) - Number(b[0])).map(([days, count]) => ({ days: `${days}d`, count }))
                  })()} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="days" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`${v} batches`]} />
                    <Bar dataKey="count" name="Batches" fill="#2E558F" radius={[3, 3, 0, 0]}>
                      {[0, 1, 2, 3, 4, 5].map(i => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#EEF2FA', border: '1px solid rgba(28,54,104,0.15)', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1C3668', marginBottom: '6px' }}>Shelf Life by Product Family</div>
                <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
                  IPA Solvents and similar industrial solvents: typically 365 days sealed.
                  Caustic cleaners and pH-sensitive products: 180 days from production date.
                  Specialty coatings and polymer additives: 90 days, temperature-controlled storage required.
                  Batch release tracking ensures no out-of-shelf product ships to customers.
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* AI Analysis Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '660px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8ECF4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#EEF2FA', borderRadius: '8px', padding: '8px' }}><Bot size={18} color="#1C3668" /></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>CIP & Yield Performance Analyst</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · CIP effectiveness, yield by line</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                'Which CIP sequence gives the best yield?',
                'Compare yield performance across lines',
                'Are there shelf life concerns in recent batches?',
                'Which analyst has the best pass rate?',
              ].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }}
                  style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>
                  {q}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing CIP and yield data...
                </div>
              )}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && (
                <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown>
                </div>
              )}
              {!agentLoading && !agentResponse && !agentError && (
                <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input
                value={agentInput}
                onChange={e => setAgentInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }}
                placeholder="Ask about CIP effectiveness, yield trends, analyst performance..."
                style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }}
              />
              <button onClick={() => { if (agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }}
                disabled={agentLoading || !agentInput.trim()}
                style={{ background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', opacity: (agentLoading || !agentInput.trim()) ? 0.5 : 1 }}>
                <Send size={13} /> Send
              </button>
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>CIP &amp; Yield Tracker</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Tracks the relationship between CIP (Clean-In-Place) sequences and batch yield outcomes. Shows average yield and quality score per CIP sequence type, multi-line yield trends (solid = completed, dashed = planned), analyst pass-rate rankings, and shelf-life distribution across completed batches.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>CIP Analysis</strong> — Average yield and quality by CIP sequence type</li>
                  <li style={{ marginBottom: '4px' }}><strong>Yield by Line</strong> — Multi-line yield trends (actuals solid, planned dashed)</li>
                  <li style={{ marginBottom: '4px' }}><strong>Analyst Performance</strong> — Pass-rate rankings by QC analyst</li>
                  <li style={{ marginBottom: '4px' }}><strong>Shelf Life</strong> — Shelf-life distribution across completed batches</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>batch_quality</strong> — Batch records including CIP sequence, yield, quality score, analyst and shelf life</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CIPYieldTracker
