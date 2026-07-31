import { useState, useEffect } from 'react'
import { Zap, AlertCircle, RefreshCw, TrendingUp, Clock, DollarSign, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell, ReferenceLine } from 'recharts'
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

function PeakDemandAI() {
  const [activeTab, setActiveTab] = useState('peak analysis')
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
        body: JSON.stringify({ message, agent_type: 'performance_analyst', thread_id: 'peak-demand-ai' }),
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
      const res = await fetch(`${API_URL}/api/energy`)
      if (!res.ok) throw new Error('Failed to fetch energy data')
      const result = await res.json()
      setData(result.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Peak demand by line
  const peakByLine = {}
  data.forEach(r => {
    const line = r.LINE || 'Unknown'
    if (!peakByLine[line]) peakByLine[line] = { line, maxPeak: 0, avgPeak: 0, count: 0, totalPeak: 0, onPeakKwh: 0, offPeakKwh: 0, totalCost: 0 }
    const pk = parseFloat(r.PEAK_DEMAND_KW) || 0
    peakByLine[line].maxPeak = Math.max(peakByLine[line].maxPeak, pk)
    peakByLine[line].totalPeak += pk
    peakByLine[line].count++
    peakByLine[line].onPeakKwh += parseFloat(r.ON_PEAK_KWH) || 0
    peakByLine[line].offPeakKwh += parseFloat(r.OFF_PEAK_KWH) || 0
    peakByLine[line].totalCost += parseFloat(r.ENERGY_COST_GBP) || 0
  })
  const peakLineData = Object.values(peakByLine).map(l => ({
    ...l,
    avgPeak: parseFloat((l.totalPeak / l.count).toFixed(1)),
    onPeakPct: parseFloat((l.onPeakKwh / (l.onPeakKwh + l.offPeakKwh) * 100).toFixed(1)),
    shiftCost: parseFloat((l.onPeakKwh * 0.29 - l.offPeakKwh * 0.14).toFixed(0)), // premium for on-peak
  })).sort((a, b) => b.maxPeak - a.maxPeak)

  // Top peak demand days (top 20)
  const topPeakDays = [...data]
    .sort((a, b) => (parseFloat(b.PEAK_DEMAND_KW) || 0) - (parseFloat(a.PEAK_DEMAND_KW) || 0))
    .slice(0, 20)
    .map(r => ({ date: fmtShort(r.DATE), line: r.LINE, peak: parseFloat(r.PEAK_DEMAND_KW) || 0, cost: parseFloat(r.ENERGY_COST_GBP) || 0 }))

  // On-peak vs off-peak cost comparison
  const onPeakCost = data.reduce((s, r) => s + (parseFloat(r.ON_PEAK_KWH) || 0) * 0.29, 0)
  const offPeakCost = data.reduce((s, r) => s + (parseFloat(r.OFF_PEAK_KWH) || 0) * 0.14, 0)
  const potentialSaving = onPeakCost * 0.15 // 15% shift potential

  // Demand trend (daily max peak across all lines) — sorted by real date
  const dateMaxPeak = {}
  data.forEach(r => {
    const d = r.DATE || 'Unknown'
    const pk = parseFloat(r.PEAK_DEMAND_KW) || 0
    if (!dateMaxPeak[d] || pk > dateMaxPeak[d].peak) {
      dateMaxPeak[d] = { rawDate: d, peak: pk }
    }
  })
  const demandTrendRaw = Object.values(dateMaxPeak)
    .sort((a, b) => parseDate(a.rawDate) - parseDate(b.rawDate))
    .map(v => {
      const isProj = parseDate(v.rawDate) > TODAY
      return { date: fmtShort(v.rawDate), peak: v.peak, isProjected: isProj }
    })

  // Build bridged actual/projected series for the line chart
  const lastActIdx = demandTrendRaw.reduce((last, v, i) => !v.isProjected ? i : last, -1)
  const demandTrend = demandTrendRaw.map((v, i) => ({
    ...v,
    peakActual:    (!v.isProjected || i === lastActIdx) ? v.peak : null,
    peakProjected: (v.isProjected  || i === lastActIdx) ? v.peak : null,
  }))

  const projectedFrom = demandTrend.find(v => v.isProjected)?.date ?? null

  // AI Insights
  const highPeakLine = peakLineData[0]
  const highOnPeakLine = [...peakLineData].sort((a, b) => b.onPeakPct - a.onPeakPct)[0]

  const tabs = ['peak analysis', 'demand trend', 'cost optimisation', 'ai insights']

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Peak Demand AI</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Peak demand analysis, tariff optimisation and load-shifting recommendations · {data.length} daily records
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '16px 0' }}>
        {[
          { label: 'Max Site Peak Demand', value: `${Math.max(...data.map(r => parseFloat(r.PEAK_DEMAND_KW) || 0)).toFixed(0)} kW`, sub: 'single day peak', icon: Zap, color: '#1C3668' },
          { label: 'On-Peak Cost', value: `$${(onPeakCost / 1000).toFixed(1)}k`, sub: '$0.29/kWh HH tariff', icon: Clock, color: '#2E558F' },
          { label: 'Off-Peak Cost', value: `$${(offPeakCost / 1000).toFixed(1)}k`, sub: '$0.14/kWh HH tariff', icon: TrendingUp, color: '#4A7AB5' },
          { label: 'Shift Saving Potential', value: `$${(potentialSaving / 1000).toFixed(1)}k`, sub: '15% load shift estimate', icon: DollarSign, color: '#6B9ED4' },
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

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
          Loading peak demand data...
        </div>
      )}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === 'peak analysis' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Max & Avg Peak Demand by Line (kW)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={peakLineData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="line" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v} kW`} />
                    <Tooltip formatter={(v) => [`${v} kW`]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="maxPeak" name="Max kW" fill="#0A1628" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="avgPeak" name="Avg kW" fill="#6B9ED4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Top 20 Peak Demand Days</div>
                <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#EEF2FA' }}>
                      <tr>
                        {['Date', 'Line', 'Peak kW', 'Cost $'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: '600', color: '#0A1628' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topPeakDays.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                          <td style={{ padding: '5px 10px', color: '#374151' }}>{r.date}</td>
                          <td style={{ padding: '5px 10px', color: '#374151' }}>{r.line}</td>
                          <td style={{ padding: '5px 10px', fontWeight: '600', color: r.peak > 1000 ? '#1C3668' : '#374151' }}>{r.peak.toFixed(0)}</td>
                          <td style={{ padding: '5px 10px', color: '#6B7280' }}>${r.cost.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>On-Peak % by Line (higher = more expensive tariff exposure)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={peakLineData} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                    <YAxis type="category" dataKey="line" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [`${v}%`]} />
                    <ReferenceLine x={50} stroke="#2E558F" strokeDasharray="4 4" label={{ value: '50%', fontSize: 10, fill: '#2E558F' }} />
                    <Bar dataKey="onPeakPct" name="On-Peak %" radius={[0, 3, 3, 0]}>
                      {peakLineData.map((entry, i) => <Cell key={i} fill={entry.onPeakPct > 55 ? '#1C3668' : '#4A7AB5'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'demand trend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {projectedFrom && (
                <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', color: '#7B5800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={12} />
                  <span><strong>Projected data:</strong> From <strong>{projectedFrom}</strong> onwards — forecast values, not recorded actuals. Shown as dashed line.</span>
                </div>
              )}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Site Peak Demand Trend (kW · max across all lines per day)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Solid = actuals · Dashed = projected (forecast)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={demandTrend} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v} kW`} />
                    <Tooltip formatter={v => v != null ? [`${v} kW`] : ['-']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <ReferenceLine y={1000} stroke="#4A7AB5" strokeDasharray="4 4" label={{ value: '1000 kW', fontSize: 10, fill: '#4A7AB5' }} />
                    <Line type="monotone" dataKey="peakActual"    name="Actuals"   stroke="#1C3668" strokeWidth={2} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="peakProjected" name="Projected" stroke="#6B9ED4" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'cost optimisation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>On-Peak vs Off-Peak Cost Breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'On-Peak Cost ($0.29/kWh)', value: onPeakCost, color: '#1C3668' },
                      { label: 'Off-Peak Cost ($0.14/kWh)', value: offPeakCost, color: '#6B9ED4' },
                    ].map(item => {
                      const pct = Math.round(item.value / (onPeakCost + offPeakCost) * 100)
                      return (
                        <div key={item.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                            <span style={{ color: '#374151' }}>{item.label}</span>
                            <span style={{ fontWeight: '600', color: '#0A1628' }}>${(item.value / 1000).toFixed(1)}k ({pct}%)</span>
                          </div>
                          <div style={{ height: '8px', background: '#EEF2FA', borderRadius: '4px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '4px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ background: '#EEF2FA', border: '1px solid rgba(28,54,104,0.15)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1C3668', marginBottom: '10px' }}>Load-Shifting Opportunity</div>
                  <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
                    <div style={{ marginBottom: '8px' }}>
                      Shifting <strong>15% of on-peak load</strong> to off-peak periods could save approximately:
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#0A1628', marginBottom: '8px' }}>
                      ${potentialSaving.toLocaleString(undefined, { maximumFractionDigits: 0 })} / period
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>
                      Based on differential: $0.29 - $0.14 = $0.15/kWh saving on shifted units.
                      Applies primarily to cleaning-in-place (CIP) cycles and non-critical batch operations.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Cost by Line — Tariff Premium Exposure</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FA' }}>
                      {['Line', 'On-Peak %', 'Total Cost $', 'On-Peak Premium $', 'Est. Shift Saving'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {peakLineData.map((row, i) => {
                      const shiftSaving = row.onPeakKwh * 0.15 * 0.15
                      return (
                        <tr key={row.line} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0A1628' }}>{row.line}</td>
                          <td style={{ padding: '8px 12px', color: row.onPeakPct > 55 ? '#1C3668' : '#6B7280' }}>{row.onPeakPct}%</td>
                          <td style={{ padding: '8px 12px', color: '#374151' }}>${row.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px 12px', color: '#374151' }}>${(row.onPeakKwh * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td style={{ padding: '8px 12px', color: '#2E558F', fontWeight: '600' }}>${shiftSaving.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ai insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {[
                {
                  title: 'Peak Demand Concentration',
                  body: highPeakLine ? `${highPeakLine.line} has the highest peak demand at ${highPeakLine.maxPeak.toFixed(0)} kW max / ${highPeakLine.avgPeak} kW average. This line should be prioritised for demand-response scheduling — consider shifting batch changeovers and CIP cycles to off-peak windows where feasible.` : 'No data',
                  tag: 'Demand Management',
                },
                {
                  title: 'On-Peak Tariff Exposure',
                  body: highOnPeakLine ? `${highOnPeakLine.line} has the highest on-peak exposure at ${highOnPeakLine.onPeakPct}% of consumption during peak tariff hours. The on-peak / off-peak tariff differential is $0.15/kWh. Rescheduling 15% of on-peak load could save approximately $${(highOnPeakLine.onPeakKwh * 0.15 * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })} on this line alone.` : 'No data',
                  tag: 'Tariff Optimisation',
                },
                {
                  title: 'Load-Shifting Candidates',
                  body: 'CIP (Clean-In-Place) sequences are the highest-priority load-shifting candidates — they are non-production critical and typically scheduled reactively. Moving CIP cycles to 23:00–06:00 off-peak windows would capture full $0.14/kWh rate. Secondary candidates include utility pre-heating and chiller preparation ahead of production shifts.',
                  tag: 'Schedule Optimisation',
                },
                {
                  title: 'Carbon Reduction Path',
                  body: `Total site carbon footprint is ${(data.reduce((s, r) => s + (parseFloat(r.CARBON_KG) || 0), 0) / 1000).toFixed(1)} tonnes CO₂ at 0.233 kg/kWh UK grid factor. Shifting to off-peak hours does not directly reduce carbon, but a 10% overall consumption reduction through efficiency measures would save approximately ${(data.reduce((s, r) => s + (parseFloat(r.CARBON_KG) || 0), 0) * 0.10 / 1000).toFixed(1)} tonnes CO₂.`,
                  tag: 'Sustainability',
                },
              ].map((insight, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0A1628' }}>{insight.title}</span>
                    <span style={{ fontSize: '10px', background: '#EEF2FA', color: '#1C3668', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{insight.tag}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6', margin: 0 }}>{insight.body}</p>
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
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Peak Demand Analyst</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · peak kW, tariff windows, load shifting</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['When are our peak demand events happening?', 'Which lines drive the highest on-peak load?', 'What load-shifting opportunities exist?', 'How much could we save by shifting demand?'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing peak demand data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about peak demand, tariff windows, load shifting..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Peak Demand AI</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Identifies peak demand events and their cost impact under on-peak / off-peak tariff differentials. The Peak Analysis tab ranks highest-demand days. Cost Optimisation highlights opportunities to shift load from on-peak to off-peak windows. AI Insights provides a narrative summary of demand patterns and load-shifting recommendations.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Peak Analysis</strong> — Highest-demand days ranked by peak kW</li>
                  <li style={{ marginBottom: '4px' }}><strong>Demand Trend</strong> — Peak demand trend over time</li>
                  <li style={{ marginBottom: '4px' }}><strong>Cost Optimisation</strong> — Load-shifting opportunities by tariff window</li>
                  <li style={{ marginBottom: '4px' }}><strong>AI Insights</strong> — Narrative summary of demand patterns and recommendations</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>energy_consumption</strong> — Daily energy data including peak demand kW, on-peak and off-peak kWh fields</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PeakDemandAI
