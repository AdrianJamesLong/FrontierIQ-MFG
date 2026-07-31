import { useState, useEffect, useMemo } from 'react'
import { BarChart3, AlertCircle, RefreshCw, Filter, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from 'recharts'
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

function BatchAnalytics() {
  const [activeTab, setActiveTab] = useState('batch performance')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [filterLine, setFilterLine] = useState('All')
  const [filterResult, setFilterResult] = useState('All')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [agentError, setAgentError] = useState(null)
  const [showPageInfo, setShowPageInfo] = useState(false)

  const callAgent = async (message) => {
    setAgentLoading(true); setAgentError(null); setAgentResponse('')
    try {
      const res = await fetch(`${API_URL}/api/agent/tier2/downtime_rca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, agent_type: 'downtime_rca', thread_id: 'batch-analytics' }),
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

  const lines   = ['All', ...new Set(data.map(r => r.WORK_CENTER).filter(Boolean)).values()].sort()
  const results = ['All', 'Pass', 'Fail']

  // Tag each row with isProjected
  const taggedData = useMemo(() => data.map(r => ({
    ...r,
    isProjected: (parseDate(r.PRODUCTION_DATE) || new Date(0)) > TODAY,
  })), [data])

  const filtered = useMemo(() => taggedData.filter(r =>
    (filterLine   === 'All' || r.WORK_CENTER  === filterLine) &&
    (filterResult === 'All' || r.TEST_RESULT  === filterResult) &&
    (search === '' || r.MATERIAL_DESC?.toLowerCase().includes(search.toLowerCase()) ||
      r.BATCH_ID?.includes(search) || r.ORDER_ID?.includes(search))
  ), [taggedData, filterLine, filterResult, search])

  // Yield by material — completed batches only (top 12 by count)
  const actualData = useMemo(() => taggedData.filter(r => !r.isProjected), [taggedData])

  const yieldByMat = {}
  actualData.forEach(r => {
    const mat = r.MATERIAL_ID
    if (!yieldByMat[mat]) yieldByMat[mat] = { mat, desc: r.MATERIAL_DESC?.substring(0, 25), yieldSum: 0, count: 0, pass: 0 }
    yieldByMat[mat].yieldSum += parseFloat(r.YIELD_PCT) || 0
    yieldByMat[mat].count++
    if (r.TEST_RESULT === 'Pass') yieldByMat[mat].pass++
  })
  const materialYieldData = Object.values(yieldByMat)
    .sort((a, b) => b.count - a.count).slice(0, 12)
    .map(m => ({ ...m, avgYield: parseFloat((m.yieldSum / m.count).toFixed(1)), passRate: parseFloat((m.pass / m.count * 100).toFixed(1)) }))

  // Yield trend — all completed batches + next 30 planned, centred on today
  const allTrendSorted = [...taggedData]
    .sort((a, b) => (parseDate(a.PRODUCTION_DATE) || 0) - (parseDate(b.PRODUCTION_DATE) || 0))

  const yieldTrendRaw = [
    ...allTrendSorted.filter(r => !r.isProjected),
    ...allTrendSorted.filter(r => r.isProjected).slice(0, 30),
  ].map(r => ({
      date:       fmtShort(r.PRODUCTION_DATE),
      yield:      parseFloat(r.YIELD_PCT) || 0,
      score:      parseFloat(r.QUALITY_SCORE) || 0,
      result:     r.TEST_RESULT,
      isProjected: r.isProjected,
    }))

  const lastActIdx2 = yieldTrendRaw.reduce((last, v, i) => !v.isProjected ? i : last, -1)
  const yieldTrend = yieldTrendRaw.map((v, i) => ({
    ...v,
    yieldActual:    (!v.isProjected || i === lastActIdx2) ? v.yield : null,
    yieldProjected: (v.isProjected  || i === lastActIdx2) ? v.yield : null,
  }))

  const trendProjectedFrom = yieldTrend.find(v => v.isProjected)?.date ?? null

  // Purity analysis — completed batches only
  const purityData = actualData
    .filter(r => r.PURITY_PCT && parseFloat(r.PURITY_PCT) > 0)
    .map(r => ({ purity: parseFloat(r.PURITY_PCT), yield: parseFloat(r.YIELD_PCT) || 0, result: r.TEST_RESULT, line: r.WORK_CENTER }))
    .slice(0, 100)

  const tabs = ['batch performance', 'yield analysis', 'test results table', 'failed batches']

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Batch Analytics</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Batch-level quality metrics, yield analysis and test result breakdown · {actualData.length} completed + {data.length - actualData.length} planned batches
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '14px 0', flexWrap: 'wrap' }}>
        <Filter size={13} color="#6B7280" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batch / material..."
          style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid #E8ECF4', borderRadius: '6px', width: '180px' }} />
        {lines.map(l => (
          <button key={l} onClick={() => setFilterLine(l)}
            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
              borderColor: filterLine === l ? '#2E558F' : '#E8ECF4',
              background: filterLine === l ? '#EEF2FA' : '#fff',
              color: filterLine === l ? '#1C3668' : '#6B7280' }}>
            {l}
          </button>
        ))}
        {results.map(r => (
          <button key={r} onClick={() => setFilterResult(r)}
            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
              borderColor: filterResult === r ? '#2E558F' : '#E8ECF4',
              background: filterResult === r ? '#EEF2FA' : '#fff',
              color: filterResult === r ? '#1C3668' : '#6B7280' }}>
            {r}
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

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }} />Loading batch data...</div>}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <>
          {activeTab === 'batch performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Avg Yield by Material (top 12 by volume)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches only — planned batches excluded from yield analysis</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={materialYieldData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="mat" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} domain={[85, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="avgYield" name="Avg Yield %" fill="#2E558F" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="passRate" name="Pass Rate %" fill="#6B9ED4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                {trendProjectedFrom && (
                  <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: '6px', padding: '7px 12px', fontSize: '11px', color: '#7B5800', marginBottom: '10px', display: 'flex', gap: '6px' }}>
                    <BarChart3 size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span><strong>Planned batches from {trendProjectedFrom}:</strong> not yet produced — yield shown is forecast. Solid = completed · Dashed = planned.</span>
                  </div>
                )}
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Batch Yield Trend (last 60 batches by production date)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={yieldTrend} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={8} angle={-35} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 10 }} domain={[85, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => v != null ? [`${v}%`] : ['-']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="yieldActual"    name="Yield (completed)" stroke="#1C3668" strokeWidth={1.5} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="yieldProjected" name="Yield (planned)"   stroke="#6B9ED4" strokeWidth={1.5} dot={false} strokeDasharray="5 3" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'yield analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {['CPL-R01', 'CPL-R02', 'CPL-F01', 'CPL-B01'].filter(l => actualData.some(r => r.WORK_CENTER === l)).map((line, i) => {
                  const lineBatches = actualData.filter(r => r.WORK_CENTER === line)
                  const avgY = lineBatches.length > 0 ? lineBatches.reduce((s, r) => s + (parseFloat(r.YIELD_PCT) || 0), 0) / lineBatches.length : 0
                  const minY = Math.min(...lineBatches.map(r => parseFloat(r.YIELD_PCT) || 100))
                  const maxY = Math.max(...lineBatches.map(r => parseFloat(r.YIELD_PCT) || 0))
                  return (
                    <div key={line} style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '14px', borderLeft: `4px solid ${CHART_COLORS[i]}` }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0A1628', marginBottom: '6px' }}>{line}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Avg: <strong style={{ color: '#0A1628' }}>{avgY.toFixed(1)}%</strong></div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Range: <strong style={{ color: '#0A1628' }}>{minY.toFixed(1)}% – {maxY.toFixed(1)}%</strong></div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>{lineBatches.length} completed batches</div>
                    </div>
                  )
                })}
              </div>

              {purityData.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Purity vs Yield Correlation</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px' }}>Completed batches — up to 100 with purity data</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                      <XAxis type="number" dataKey="purity" name="Purity %" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[90, 100]} />
                      <YAxis type="number" dataKey="yield"  name="Yield %"  tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[85, 100]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [`${v}%`, n]} />
                      <Scatter data={purityData} fill="#2E558F" opacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {activeTab === 'test results table' && (
            <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF4', fontSize: '11px', color: '#6B7280' }}>
                {filtered.length} batches matching current filters
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#EEF2FA' }}>
                    <tr>
                      {['Batch ID', 'Order ID', 'Material', 'Line', 'Date', 'Yield %', 'Score', 'Purity', 'Result', 'Release', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 200).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: r.TEST_RESULT === 'Fail' ? '#FEF9F9' : i % 2 === 0 ? '#fff' : '#FAFBFD', opacity: r.isProjected ? 0.8 : 1 }}>
                        <td style={{ padding: '6px 10px', color: '#374151', fontFamily: 'monospace', fontSize: '10px' }}>{r.BATCH_ID}</td>
                        <td style={{ padding: '6px 10px', color: '#6B7280', fontSize: '10px' }}>{r.ORDER_ID}</td>
                        <td style={{ padding: '6px 10px', color: '#374151', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.MATERIAL_DESC}</td>
                        <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.WORK_CENTER}</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{fmtShort(r.PRODUCTION_DATE)}</td>
                        <td style={{ padding: '6px 10px', color: '#374151', fontWeight: '600' }}>{parseFloat(r.YIELD_PCT || 0).toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{parseFloat(r.QUALITY_SCORE || 0).toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.PURITY_PCT ? `${parseFloat(r.PURITY_PCT).toFixed(1)}%` : '—'}</td>
                        <td style={{ padding: '6px 10px' }}>
                          {r.isProjected ? (
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', background: '#EEF2FA', color: '#6B7280' }}>—</span>
                          ) : (
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '600',
                              background: r.TEST_RESULT === 'Pass' ? '#D1FAE5' : r.TEST_RESULT === 'Fail' ? '#FEE2E2' : '#EEF2FA',
                              color:      r.TEST_RESULT === 'Pass' ? '#065F46' : r.TEST_RESULT === 'Fail' ? '#991B1B' : '#1C3668' }}>
                              {r.TEST_RESULT || '—'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '6px 10px', color: r.RELEASE_STATUS === 'Released' ? '#065F46' : r.RELEASE_STATUS === 'On Hold' ? '#92400E' : '#374151', fontSize: '10px' }}>
                          {r.isProjected ? '—' : (r.RELEASE_STATUS || '—')}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '600',
                            background: r.isProjected ? '#FFF8E1' : '#D1FAE5',
                            color:      r.isProjected ? '#7B5800'  : '#065F46' }}>
                            {r.isProjected ? 'Planned' : 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > 200 && <div style={{ padding: '10px 16px', borderTop: '1px solid #E8ECF4', fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>Showing 200 of {filtered.length}</div>}
            </div>
          )}

          {activeTab === 'failed batches' && (
            <div style={{ marginTop: '16px' }}>
              {filtered.filter(r => r.TEST_RESULT === 'Fail' && !r.isProjected).length === 0 ? (
                <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '16px', color: '#065F46', fontSize: '12px' }}>No failed batches in completed production matching current filters.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filtered.filter(r => r.TEST_RESULT === 'Fail' && !r.isProjected).map((r, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #FECACA', borderRadius: '8px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '2px' }}>{r.BATCH_ID} — {r.MATERIAL_DESC}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            Order: {r.ORDER_ID} · Line: {r.WORK_CENTER} · Date: {fmtShort(r.PRODUCTION_DATE)}
                          </div>
                          {r.DEFECT_CATEGORY && r.DEFECT_CATEGORY !== 'None' && (
                            <div style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
                              Defect: <strong>{r.DEFECT_CATEGORY}</strong> · Count: {r.DEFECT_COUNT}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0A1628' }}>{parseFloat(r.YIELD_PCT || 0).toFixed(1)}% yield</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>Score: {parseFloat(r.QUALITY_SCORE || 0).toFixed(1)}</div>
                          <div style={{ fontSize: '10px', color: r.RELEASE_STATUS === 'On Hold' ? '#92400E' : '#6B7280', marginTop: '2px' }}>{r.RELEASE_STATUS}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Batch Diagnostic & RCA Agent</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 2 Agent · root cause analysis, failure patterns</div>
                </div>
                <span style={{ background: '#FFF3E0', color: '#E65100', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 2</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                'What is causing the most batch failures?',
                'Which lines have the worst yield?',
                'Show me root causes for recent failures',
                'Are there patterns in failed batch timing?',
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
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing batch data...
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
                placeholder="Ask about batch failures, yield trends, root causes..."
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Batch Analytics</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Batch-level quality analytics with filtering by line and test result. The Batch Performance tab shows material yield distributions. Yield Analysis correlates yield against quality scores. Test Results shows the full batch log with a Status column (Completed / Planned). Failed Batches lists only completed batches that failed QC.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Batch Performance</strong> — Material yield distribution across batches</li>
                  <li style={{ marginBottom: '4px' }}><strong>Yield Analysis</strong> — Yield vs quality score scatter</li>
                  <li style={{ marginBottom: '4px' }}><strong>Test Results</strong> — Full batch log with Completed / Planned status</li>
                  <li style={{ marginBottom: '4px' }}><strong>Failed Batches</strong> — Completed batches that did not pass QC</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>batch_quality</strong> — Batch records with quality score, yield, test result and line</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchAnalytics
