import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, AlertCircle, RefreshCw, BarChart3, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ReferenceLine } from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CHART_COLORS = ['#0A1628', '#1C3668', '#2E558F', '#4A7AB5', '#6B9ED4', '#8FBDE0']

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function DemandForecasting() {
  const [activeTab, setActiveTab] = useState('demand vs forecast')
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
        body: JSON.stringify({ message, agent_type: 'performance_analyst', thread_id: 'demand-forecasting' }),
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

  const lines = ['All', ...new Set(data.map(r => r.WORK_CENTER).filter(Boolean)).values()].sort()
  const filtered = useMemo(() =>
    filterLine === 'All' ? data : data.filter(r => r.WORK_CENTER === filterLine),
    [data, filterLine]
  )

  // Weekly demand trend (aggregate)
  const snapshots = [...new Set(filtered.map(r => r.SNAPSHOT_DATE))].sort()
  const weeklyDemand = snapshots.map(snap => {
    const rows = filtered.filter(r => r.SNAPSHOT_DATE === snap)
    const actual = rows.reduce((s, r) => s + (parseFloat(r.ACTUAL_DEMAND_UNITS) || 0), 0)
    const forecast = rows.reduce((s, r) => s + (parseFloat(r.FORECAST_DEMAND_UNITS) || 0), 0)
    return {
      date: snap?.substring(0, 5) || snap,
      actual: Math.round(actual),
      forecast: Math.round(forecast),
      accuracy: forecast > 0 ? parseFloat((100 - Math.abs(actual - forecast) / forecast * 100).toFixed(1)) : 0,
    }
  })

  // Forecast accuracy by material
  const latestByMaterial = useMemo(() => {
    const latest = {}
    filtered.forEach(r => {
      const mat = r.MATERIAL_ID
      if (!latest[mat] || r.SNAPSHOT_DATE > latest[mat].SNAPSHOT_DATE) latest[mat] = r
    })
    return Object.values(latest)
  }, [filtered])

  const accuracyData = latestByMaterial.map(r => {
    const actual = parseFloat(r.ACTUAL_DEMAND_UNITS) || 0
    const forecast = parseFloat(r.FORECAST_DEMAND_UNITS) || 0
    const accuracy = forecast > 0 ? 100 - Math.abs(actual - forecast) / forecast * 100 : 0
    return { mat: r.MATERIAL_ID, desc: r.MATERIAL_DESC, accuracy: parseFloat(accuracy.toFixed(1)), actual, forecast, abc: r.ABC_CLASS }
  }).sort((a, b) => a.accuracy - b.accuracy)

  // Avg accuracy overall
  const avgAccuracy = accuracyData.length > 0
    ? accuracyData.reduce((s, r) => s + r.accuracy, 0) / accuracyData.length
    : 0

  // Top under/over forecast
  const underForecast = latestByMaterial
    .map(r => ({ ...r, diff: (parseFloat(r.ACTUAL_DEMAND_UNITS) || 0) - (parseFloat(r.FORECAST_DEMAND_UNITS) || 0) }))
    .sort((a, b) => b.diff - a.diff).slice(0, 10)
  const overForecast = latestByMaterial
    .map(r => ({ ...r, diff: (parseFloat(r.ACTUAL_DEMAND_UNITS) || 0) - (parseFloat(r.FORECAST_DEMAND_UNITS) || 0) }))
    .sort((a, b) => a.diff - b.diff).slice(0, 10)

  const tabs = ['demand vs forecast', 'forecast accuracy', 'variance analysis', 'raw data']

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Demand Forecasting</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Actual vs forecast demand analysis and forecast accuracy tracking · {latestByMaterial.length} materials
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '16px 0' }}>
        {[
          { label: 'Avg Forecast Accuracy', value: `${avgAccuracy.toFixed(1)}%`, sub: 'across all materials', icon: BarChart3, color: '#1C3668' },
          { label: 'Total Actual Demand', value: (filtered.reduce((s, r) => s + (parseFloat(r.ACTUAL_DEMAND_UNITS) || 0), 0) / 1000).toFixed(0) + 'k', sub: 'units across snapshots', icon: TrendingUp, color: '#2E558F' },
          { label: 'Total Forecast Demand', value: (filtered.reduce((s, r) => s + (parseFloat(r.FORECAST_DEMAND_UNITS) || 0), 0) / 1000).toFixed(0) + 'k', sub: 'units across snapshots', icon: TrendingUp, color: '#4A7AB5' },
          { label: 'Snapshots', value: snapshots.length, sub: 'weekly data points', icon: AlertCircle, color: '#6B9ED4' },
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

      {/* Line filter */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
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

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }} />Loading demand data...</div>}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <>
          {activeTab === 'demand vs forecast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Weekly Actual vs Forecast Demand (units)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={weeklyDemand} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v, n) => [`${v.toLocaleString()} units`, n]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="actual" name="Actual Demand" stroke="#0A1628" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="forecast" name="Forecast Demand" stroke="#4A7AB5" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Weekly Forecast Accuracy (%)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyDemand} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v) => [`${v}%`]} />
                    <ReferenceLine y={85} stroke="#2E558F" strokeDasharray="4 4" label={{ value: '85% target', fontSize: 10, fill: '#2E558F' }} />
                    <Bar dataKey="accuracy" name="Accuracy %" radius={[3, 3, 0, 0]}>
                      {weeklyDemand.map((entry, i) => <Cell key={i} fill={entry.accuracy >= 85 ? '#2E558F' : entry.accuracy >= 70 ? '#6B9ED4' : '#F59E0B'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'forecast accuracy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {['A', 'B', 'C'].map((cls, i) => {
                  const mats = accuracyData.filter(r => r.abc === cls)
                  const avg = mats.length > 0 ? mats.reduce((s, r) => s + r.accuracy, 0) / mats.length : 0
                  return (
                    <div key={cls} style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '14px', borderLeft: `4px solid ${CHART_COLORS[i]}` }}>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Class {cls} Accuracy</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#0A1628' }}>{avg.toFixed(1)}%</div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{mats.length} materials</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '8px' }}>Bottom 15 Materials by Forecast Accuracy</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FA' }}>
                      {['Material ID', 'Description', 'ABC', 'Actual', 'Forecast', 'Accuracy'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accuracyData.slice(0, 15).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#374151' }}>{r.mat}</td>
                        <td style={{ padding: '6px 10px', color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</td>
                        <td style={{ padding: '6px 10px' }}><span style={{ background: '#EEF2FA', color: '#1C3668', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', fontSize: '10px' }}>{r.abc}</span></td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.actual}</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.forecast}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontWeight: '600', color: r.accuracy >= 85 ? '#065F46' : r.accuracy >= 70 ? '#92400E' : '#991B1B' }}>{r.accuracy.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'variance analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '8px' }}>Top 10 Under-Forecast (Actual > Forecast)</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px' }}>Demand was higher than predicted — risk of stockout</div>
                  {underForecast.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F3F4F6', fontSize: '11px' }}>
                      <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{r.MATERIAL_DESC}</span>
                      <span style={{ color: '#1C3668', fontWeight: '600', flexShrink: 0, marginLeft: '8px' }}>+{r.diff} units</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '8px' }}>Top 10 Over-Forecast (Forecast > Actual)</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px' }}>Demand was lower than predicted — risk of overstock</div>
                  {overForecast.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F3F4F6', fontSize: '11px' }}>
                      <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{r.MATERIAL_DESC}</span>
                      <span style={{ color: '#6B9ED4', fontWeight: '600', flexShrink: 0, marginLeft: '8px' }}>{r.diff} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raw data' && (
            <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF4', fontSize: '11px', color: '#6B7280' }}>{filtered.length} inventory snapshot records</div>
              <div style={{ overflowX: 'auto', maxHeight: '480px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#EEF2FA' }}>
                    <tr>
                      {['Snapshot Date', 'Material ID', 'Description', 'Line', 'ABC', 'Actual Demand', 'Forecast Demand', 'Days Cover'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 200).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.SNAPSHOT_DATE}</td>
                        <td style={{ padding: '6px 10px', color: '#374151', fontFamily: 'monospace' }}>{r.MATERIAL_ID}</td>
                        <td style={{ padding: '6px 10px', color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.MATERIAL_DESC}</td>
                        <td style={{ padding: '6px 10px', color: '#6B7280' }}>{r.WORK_CENTER}</td>
                        <td style={{ padding: '6px 10px' }}><span style={{ background: '#EEF2FA', color: '#1C3668', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', fontSize: '10px' }}>{r.ABC_CLASS}</span></td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.ACTUAL_DEMAND_UNITS}</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.FORECAST_DEMAND_UNITS}</td>
                        <td style={{ padding: '6px 10px', color: '#374151' }}>{r.DAYS_OF_COVER}d</td>
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
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Demand Forecast Analyst</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · actual vs forecast, accuracy, variance</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Which materials have the worst forecast accuracy?', 'Where is actual demand exceeding forecast?', 'Identify materials consistently under-forecast', 'What is the overall MAPE across all materials?'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing demand forecast data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about forecast accuracy, demand variance, MAPE..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Demand Forecasting</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Compares actual demand against forecast demand at material level. Forecast Accuracy tab shows MAPE (mean absolute percentage error) per material. Variance Analysis ranks materials by over- and under-forecast gap. All analysis uses the latest available snapshot per material.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Demand vs Forecast</strong> — Actual vs forecast units per material</li>
                  <li style={{ marginBottom: '4px' }}><strong>Forecast Accuracy</strong> — MAPE per material</li>
                  <li style={{ marginBottom: '4px' }}><strong>Variance Analysis</strong> — Materials ranked by over- and under-forecast gap</li>
                  <li style={{ marginBottom: '4px' }}><strong>Raw Data</strong> — Full demand snapshot table</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>inventory_stock</strong> — ACTUAL_DEMAND_UNITS and FORECAST_DEMAND_UNITS fields from the latest snapshot per material</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DemandForecasting
