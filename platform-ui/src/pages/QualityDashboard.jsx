import { useState, useEffect } from 'react'
import { FlaskConical, AlertCircle, RefreshCw, CheckCircle, TrendingUp, Calendar, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

function QualityDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
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
        body: JSON.stringify({ message, agent_type: 'performance_analyst', thread_id: 'quality-dashboard' }),
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

  // Split into actuals (produced) vs planned (future)
  const actualBatches  = data.filter(r => { const d = parseDate(r.PRODUCTION_DATE); return d && d <= TODAY })
  const plannedBatches = data.filter(r => { const d = parseDate(r.PRODUCTION_DATE); return d && d > TODAY })

  // KPIs — based on actuals only where meaningful
  const totalBatches    = data.length
  const passedBatches   = actualBatches.filter(r => r.TEST_RESULT === 'Pass').length
  const failedBatches   = actualBatches.filter(r => r.TEST_RESULT === 'Fail').length
  const actualTotal     = actualBatches.length
  const passRate        = actualTotal > 0 ? (passedBatches / actualTotal * 100) : 0
  const avgYield        = actualBatches.length > 0 ? actualBatches.reduce((s, r) => s + (parseFloat(r.YIELD_PCT) || 0), 0) / actualBatches.length : 0
  const avgQualityScore = actualBatches.length > 0 ? actualBatches.reduce((s, r) => s + (parseFloat(r.QUALITY_SCORE) || 0), 0) / actualBatches.length : 0
  const releasedCount   = actualBatches.filter(r => r.RELEASE_STATUS === 'Released').length

  // Pass/fail by line — actuals only
  const byLine = {}
  actualBatches.forEach(r => {
    const line = r.WORK_CENTER || 'Unknown'
    if (!byLine[line]) byLine[line] = { line, pass: 0, fail: 0, hold: 0, total: 0, yieldSum: 0, scoreSum: 0 }
    byLine[line].total++
    if (r.TEST_RESULT === 'Pass') byLine[line].pass++
    else if (r.TEST_RESULT === 'Fail') byLine[line].fail++
    else byLine[line].hold++
    byLine[line].yieldSum += parseFloat(r.YIELD_PCT) || 0
    byLine[line].scoreSum += parseFloat(r.QUALITY_SCORE) || 0
  })
  const lineData = Object.values(byLine).map(l => ({
    ...l,
    passRate: parseFloat((l.pass / l.total * 100).toFixed(1)),
    avgYield: parseFloat((l.yieldSum / l.total).toFixed(1)),
    avgScore: parseFloat((l.scoreSum / l.total).toFixed(1)),
  })).sort((a, b) => a.line.localeCompare(b.line))

  // Defect categories — actuals only
  const defectAgg = {}
  actualBatches.forEach(r => {
    const dc = r.DEFECT_CATEGORY || 'None'
    if (!defectAgg[dc]) defectAgg[dc] = { category: dc, count: 0 }
    defectAgg[dc].count += parseInt(r.DEFECT_COUNT) || 0
  })
  const defectData = Object.values(defectAgg).filter(d => d.category !== 'None' && d.count > 0)
    .sort((a, b) => b.count - a.count)

  // Release status — actuals only
  const releaseAgg = {}
  actualBatches.forEach(r => {
    const s = r.RELEASE_STATUS || 'Unknown'
    if (!releaseAgg[s]) releaseAgg[s] = { status: s, count: 0 }
    releaseAgg[s].count++
  })
  const releaseData = Object.values(releaseAgg)

  // Quality score / yield trend — last 30 dates, with actuals/planned split
  const dateAgg = {}
  data.forEach(r => {
    const d = r.PRODUCTION_DATE
    if (!d) return
    if (!dateAgg[d]) dateAgg[d] = { date: d, scoreSum: 0, yieldSum: 0, count: 0, isProjected: (parseDate(d) || new Date(0)) > TODAY }
    dateAgg[d].scoreSum += parseFloat(r.QUALITY_SCORE) || 0
    dateAgg[d].yieldSum += parseFloat(r.YIELD_PCT) || 0
    dateAgg[d].count++
  })
  const allDatesSorted = Object.values(dateAgg)
    .sort((a, b) => (parseDate(a.date) || 0) - (parseDate(b.date) || 0))

  // Show all completed dates + next 20 planned — keeps actuals visible rather than slicing into the future
  const trendDataRaw = [
    ...allDatesSorted.filter(d => !d.isProjected),
    ...allDatesSorted.filter(d => d.isProjected).slice(0, 20),
  ].map(d => ({
    date: fmtShort(d.date),
    avgScore: parseFloat((d.scoreSum / d.count).toFixed(1)),
    avgYield: parseFloat((d.yieldSum / d.count).toFixed(1)),
    isProjected: d.isProjected,
  }))

  const lastActIdx = trendDataRaw.reduce((last, v, i) => !v.isProjected ? i : last, -1)
  const trendData = trendDataRaw.map((v, i) => ({
    ...v,
    scoreActual:    (!v.isProjected || i === lastActIdx) ? v.avgScore : null,
    scoreProjected: (v.isProjected  || i === lastActIdx) ? v.avgScore : null,
    yieldActual:    (!v.isProjected || i === lastActIdx) ? v.avgYield : null,
    yieldProjected: (v.isProjected  || i === lastActIdx) ? v.avgYield : null,
  }))

  const projectedFrom = trendData.find(v => v.isProjected)?.date ?? null

  const tabs = ['overview', 'by line', 'defects', 'trends']

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Quality Dashboard</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Batch quality overview — pass rates, yield and defect tracking · {actualTotal} actuals + {plannedBatches.length} planned batches
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* KPI row — actuals only */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '16px 0' }}>
        {[
          { label: 'First-Pass Yield',    value: `${passRate.toFixed(1)}%`,        sub: `${passedBatches} of ${actualTotal} completed batches`, icon: CheckCircle,  color: '#065F46' },
          { label: 'Avg Quality Score',   value: avgQualityScore.toFixed(1),        sub: 'out of 100 — completed batches',                       icon: TrendingUp,   color: '#1C3668' },
          { label: 'Avg Batch Yield',     value: `${avgYield.toFixed(1)}%`,         sub: 'actual yield — completed batches',                      icon: FlaskConical, color: '#2E558F' },
          { label: 'Batches Released',    value: releasedCount,                     sub: `${(releasedCount / Math.max(actualTotal, 1) * 100).toFixed(0)}% release rate · ${plannedBatches.length} planned ahead`, icon: Calendar, color: '#4A7AB5' },
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

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }} />Loading quality data...</div>}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Test Result Distribution</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed (produced) batches only</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Pass',    value: passedBatches,                              color: '#2E558F' },
                      { name: 'Fail',    value: failedBatches,                              color: '#0A1628' },
                      { name: 'Pending', value: actualTotal - passedBatches - failedBatches, color: '#8FBDE0' },
                    ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {[{ color: '#2E558F' }, { color: '#0A1628' }, { color: '#8FBDE0' }].map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => [`${v} batches`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Release Status</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches only</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={releaseData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count"
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {releaseData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [`${v} batches`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Quality Score Distribution</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches — distribution across score bands</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={(() => {
                    const buckets = { '50-60': 0, '60-70': 0, '70-80': 0, '80-90': 0, '90-100': 0 }
                    actualBatches.forEach(r => {
                      const s = parseFloat(r.QUALITY_SCORE) || 0
                      if (s < 60) buckets['50-60']++
                      else if (s < 70) buckets['60-70']++
                      else if (s < 80) buckets['70-80']++
                      else if (s < 90) buckets['80-90']++
                      else buckets['90-100']++
                    })
                    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
                  })()} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`${v} batches`]} />
                    <Bar dataKey="count" name="Batches" radius={[3, 3, 0, 0]}>
                      {[0, 1, 2, 3, 4].map(i => <Cell key={i} fill={CHART_COLORS[Math.min(i + 1, CHART_COLORS.length - 1)]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'by line' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {lineData.map((line, i) => (
                  <div key={line.line} style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '14px', borderLeft: `4px solid ${CHART_COLORS[i % CHART_COLORS.length]}` }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>{line.line}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Pass Rate: <strong style={{ color: '#0A1628' }}>{line.passRate}%</strong></div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Avg Yield: <strong style={{ color: '#0A1628' }}>{line.avgYield}%</strong></div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Avg Score: <strong style={{ color: '#0A1628' }}>{line.avgScore}</strong></div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>{line.total} completed · {line.fail} failures</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Pass Rate & Avg Yield by Line (%)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches only</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={lineData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="line" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[80, 100]} />
                    <Tooltip formatter={v => [`${v}%`]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="passRate" name="Pass Rate %" fill="#0A1628" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="avgYield" name="Avg Yield %" fill="#4A7AB5" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'defects' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Defects by Category</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches only</div>
                {defectData.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#6B7280', padding: '20px 0' }}>No defects recorded in completed batches.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {defectData.map((d, i) => {
                      const total = defectData.reduce((s, r) => s + r.count, 0)
                      const pct = Math.round(d.count / total * 100)
                      return (
                        <div key={d.category}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                            <span style={{ color: '#374151' }}>{d.category}</span>
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
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Failed Batches by Line</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Completed batches only</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={lineData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="line" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`${v} batches`]} />
                    <Bar dataKey="fail" name="Failed Batches" fill="#1C3668" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {projectedFrom && (
                <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', color: '#7B5800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FlaskConical size={12} />
                  <span><strong>Planned batches:</strong> From <strong>{projectedFrom}</strong> onwards — batches not yet produced. Quality scores shown are forecast values. Solid = completed · Dashed = planned.</span>
                </div>
              )}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Daily Avg Quality Score (last 30 dates)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Solid = completed batches · Dashed = planned (forecast)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} domain={[70, 100]} />
                    <Tooltip formatter={v => v != null ? [`${v}`] : ['-']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="scoreActual"    name="Score (actual)"  stroke="#0A1628" strokeWidth={2} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="scoreProjected" name="Score (planned)"  stroke="#6B9ED4" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Daily Avg Yield % (last 30 dates)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Solid = completed batches · Dashed = planned (forecast)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} domain={[85, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => v != null ? [`${v}%`] : ['-']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="yieldActual"    name="Yield (actual)"  stroke="#2E558F" strokeWidth={2} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="yieldProjected" name="Yield (planned)"  stroke="#6B9ED4" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
      {/* AI Analysis Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '660px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8ECF4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#EEF2FA', borderRadius: '8px', padding: '8px' }}><Bot size={18} color="#1C3668" /></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Quality Performance Analyst</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · pass rates, yield, defects</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>

            {/* Quick action pills */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                'Summarise current pass rates by line',
                'Which batch has the highest defect count?',
                'What is driving yield variation?',
                'Flag any lines below target',
              ].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }}
                  style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Response area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing quality data...
                </div>
              )}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && (
                <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown>
                </div>
              )}
              {!agentLoading && !agentResponse && !agentError && (
                <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>
                  Select a quick action above or type a question below.
                </div>
              )}
            </div>

            {/* Input row */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input
                value={agentInput}
                onChange={e => setAgentInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }}
                placeholder="Ask about quality trends, defects, yield..."
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Quality Dashboard</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Batch quality overview for all production lines at NovaChem Grangemouth. KPIs (pass rate, average quality score, average yield, release rate) are computed from completed batches only. Planned future batches are shown as forecast values in the Trends tab with a dashed line. The Defects tab shows defect category breakdown from completed batches.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Overview</strong> — Pass rate, quality score, yield and release rate KPIs</li>
                  <li style={{ marginBottom: '4px' }}><strong>By Line</strong> — Quality KPIs broken down per production line</li>
                  <li style={{ marginBottom: '4px' }}><strong>Defects</strong> — Defect category breakdown from completed batches</li>
                  <li style={{ marginBottom: '4px' }}><strong>Trends</strong> — Quality score over time with planned batch forecast (dashed)</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>batch_quality</strong> — Batch records with quality score, yield, test result and defect category</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QualityDashboard
