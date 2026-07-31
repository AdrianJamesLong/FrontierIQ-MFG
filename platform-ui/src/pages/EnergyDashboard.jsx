import { useState, useEffect } from 'react'
import { Zap, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Leaf, DollarSign, BarChart3, Factory, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const LINE_COLORS = { 'CPL-R01': '#0A1628', 'CPL-R02': '#2E558F', 'CPL-B01': '#4A7AB5', 'CPL-F01': '#6B9ED4' }
const CHART_COLORS = ['#0A1628', '#2E558F', '#4A7AB5', '#6B9ED4']

// Today at midnight for actuals/projected split
const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

// Parse DD/MM/YYYY → Date
const parseDate = str => {
  if (!str) return null
  const [d, m, y] = str.split('/')
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
}

// Format date as "1 Apr"
const fmtShort = str => {
  const d = parseDate(str)
  if (!d) return str
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Get Monday of the week as a Date object (for sorting)
const weekMonday = str => {
  const d = parseDate(str)
  if (!d) return new Date(0)
  const day = d.getDay() || 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - day + 1)
  return mon
}

// Get ISO week label "1 Apr" from a date string
const weekKey = str => {
  const mon = weekMonday(str)
  return mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function EnergyDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
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
        body: JSON.stringify({ message, agent_type: 'performance_analyst', thread_id: 'energy-dashboard' }),
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

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalKwh    = data.reduce((s, r) => s + (parseFloat(r.ENERGY_KWH) || 0), 0)
  const totalCost   = data.reduce((s, r) => s + (parseFloat(r.ENERGY_COST_GBP) || 0), 0)
  const totalCarbon = data.reduce((s, r) => s + (parseFloat(r.CARBON_KG) || 0), 0)
  const totalUnits  = data.reduce((s, r) => s + (parseFloat(r.PRODUCTION_UNITS) || 0), 0)
  const avgIntensity = totalUnits > 0 ? totalKwh / totalUnits : 0

  // Date range label
  const allDates = [...new Set(data.map(r => r.DATE))].sort((a, b) => parseDate(a) - parseDate(b))
  const dateRange = allDates.length > 0
    ? `${fmtShort(allDates[0])} – ${fmtShort(allDates[allDates.length - 1])}`
    : ''

  // ── By Line ─────────────────────────────────────────────────────────────────
  const byLine = {}
  data.forEach(r => {
    const l = r.LINE || 'Unknown'
    if (!byLine[l]) byLine[l] = { LINE: l, kwh: 0, cost: 0, carbon: 0, units: 0 }
    byLine[l].kwh    += parseFloat(r.ENERGY_KWH) || 0
    byLine[l].cost   += parseFloat(r.ENERGY_COST_GBP) || 0
    byLine[l].carbon += parseFloat(r.CARBON_KG) || 0
    byLine[l].units  += parseFloat(r.PRODUCTION_UNITS) || 0
  })
  const lineData = Object.values(byLine)
    .map(l => ({ ...l, intensity: l.units > 0 ? parseFloat((l.kwh / l.units).toFixed(1)) : 0 }))
    .sort((a, b) => b.kwh - a.kwh)

  // ── Weekly aggregation ───────────────────────────────────────────────────────
  const weeklyMap = {}
  data.forEach(r => {
    const wk = weekKey(r.DATE)
    if (!weeklyMap[wk]) {
      weeklyMap[wk] = {
        week: wk,
        weekDate: weekMonday(r.DATE),
        kwh: 0, cost: 0, carbon: 0, units: 0, peakKwh: 0, offPeakKwh: 0
      }
    }
    weeklyMap[wk].kwh        += parseFloat(r.ENERGY_KWH) || 0
    weeklyMap[wk].cost       += parseFloat(r.ENERGY_COST_GBP) || 0
    weeklyMap[wk].carbon     += parseFloat(r.CARBON_KG) || 0
    weeklyMap[wk].units      += parseFloat(r.PRODUCTION_UNITS) || 0
    weeklyMap[wk].peakKwh    += parseFloat(r.ON_PEAK_KWH) || 0
    weeklyMap[wk].offPeakKwh += parseFloat(r.OFF_PEAK_KWH) || 0
  })

  // Sort chronologically, add isProjected flag
  const weeklyDataRaw = Object.values(weeklyMap)
    .sort((a, b) => a.weekDate - b.weekDate)
    .map(w => ({
      ...w,
      kwh:        Math.round(w.kwh),
      mwh:        parseFloat((w.kwh / 1000).toFixed(1)),
      cost:       Math.round(w.cost),
      carbon:     Math.round(w.carbon),
      units:      Math.round(w.units),
      intensity:  w.units > 0 ? parseFloat((w.kwh / w.units).toFixed(1)) : 0,
      peakMwh:    parseFloat((w.peakKwh / 1000).toFixed(1)),
      offPeakMwh: parseFloat((w.offPeakKwh / 1000).toFixed(1)),
      isProjected: w.weekDate > TODAY,
    }))

  // Build bridged actual/projected pairs for continuous line/area charts
  const lastActualIdx = weeklyDataRaw.reduce((last, w, i) => !w.isProjected ? i : last, -1)
  const weeklyData = weeklyDataRaw.map((w, i) => ({
    ...w,
    mwhActual:    (!w.isProjected || i === lastActualIdx) ? w.mwh       : null,
    mwhProjected: (w.isProjected  || i === lastActualIdx) ? w.mwh       : null,
    costActual:      (!w.isProjected || i === lastActualIdx) ? w.cost      : null,
    costProjected:   (w.isProjected  || i === lastActualIdx) ? w.cost      : null,
    carbonActual:    (!w.isProjected || i === lastActualIdx) ? w.carbon    : null,
    carbonProjected: (w.isProjected  || i === lastActualIdx) ? w.carbon    : null,
    intActual:       (!w.isProjected || i === lastActualIdx) ? w.intensity : null,
    intProjected:    (w.isProjected  || i === lastActualIdx) ? w.intensity : null,
    unitsActual:     (!w.isProjected || i === lastActualIdx) ? w.units     : null,
    unitsProjected:  (w.isProjected  || i === lastActualIdx) ? w.units     : null,
  }))

  const hasProjected = weeklyData.some(w => w.isProjected)
  const projectedFrom = hasProjected
    ? weeklyData.find(w => w.isProjected)?.week
    : null

  // ── Peak/off-peak split ──────────────────────────────────────────────────────
  const totalPeak    = data.reduce((s, r) => s + (parseFloat(r.ON_PEAK_KWH) || 0), 0)
  const totalOffPeak = data.reduce((s, r) => s + (parseFloat(r.OFF_PEAK_KWH) || 0), 0)
  const splitData = [
    { name: 'On-Peak',  value: Math.round(totalPeak),    color: '#0A1628' },
    { name: 'Off-Peak', value: Math.round(totalOffPeak), color: '#6B9ED4' },
  ]

  const kpis = [
    { label: 'Total Consumption',  value: `${(totalKwh / 1000).toFixed(0)} MWh`,   sub: dateRange,                             icon: Zap,         color: '#1C3668' },
    { label: 'Energy Cost',        value: `$${(totalCost / 1000).toFixed(1)}k`,    sub: `$${(totalCost / totalKwh).toFixed(4)}/kWh avg`,        icon: DollarSign,  color: '#2E558F' },
    { label: 'Carbon Footprint',   value: `${(totalCarbon / 1000).toFixed(1)}t CO₂`, sub: '0.233 kg / kWh factor',             icon: Leaf,        color: '#4A7AB5' },
    { label: 'Energy Intensity',   value: `${avgIntensity.toFixed(1)} kWh / unit`, sub: `${totalUnits.toLocaleString()} units produced`, icon: BarChart3, color: '#6B9ED4' },
  ]

  const tabs = ['Overview', 'By Line', 'Weekly Trends', 'vs Production', 'Tariff Analysis']

  // Projected notice banner
  const ProjectedBanner = () => projectedFrom ? (
    <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', color: '#7B5800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Zap size={12} />
      <span><strong>Projected data:</strong> Weeks from <strong>{projectedFrom}</strong> onwards are forecast values, not recorded actuals. Shown as dashed lines / lighter bars.</span>
    </div>
  ) : null

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Energy Dashboard</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Site energy consumption, cost and carbon — NovaChem Grangemouth · {dateRange} · {allDates.length} days
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '16px 0' }}>
        {kpis.map(k => {
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

      {/* Tabs */}
      <div className="tabs-container">
        {tabs.map(t => (
          <button key={t} className={`tab-button ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
        <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #E8ECF4', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280' }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><div className="loading-spinner" style={{ margin: '0 auto 12px' }} />Loading energy data from Fabric Lakehouse...</div>}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}

      {!loading && !error && (
        <>
          {/* ── OVERVIEW ── */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>

              {/* Peak vs off-peak donut */}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Peak vs Off-Peak Split</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Total consumption by tariff period across {dateRange}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={splitData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {splitData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={v => [`${(v / 1000).toFixed(0)} MWh`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px' }}>
                  {splitData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6B7280' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                      {d.name}: {(d.value / 1000).toFixed(0)} MWh
                    </div>
                  ))}
                </div>
              </div>

              {/* Energy by line */}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Total Consumption by Line (MWh)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Aggregate across full period — higher consumption expected on reactor lines</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={lineData.map(l => ({ ...l, mwh: Math.round(l.kwh / 1000) }))} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="LINE" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toLocaleString()}`} label={{ value: 'MWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip formatter={v => [`${v.toLocaleString()} MWh`]} />
                    <Bar dataKey="mwh" name="MWh" radius={[3, 3, 0, 0]}>
                      {lineData.map((entry, i) => <Cell key={i} fill={LINE_COLORS[entry.LINE] || CHART_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Energy intensity by line */}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Energy Intensity by Line (kWh / unit)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Lower is better — normalises consumption by units produced, enabling fair line comparison</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={lineData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="LINE" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'kWh/unit', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip formatter={v => [`${v} kWh/unit`]} />
                    <Bar dataKey="intensity" name="kWh / unit" radius={[3, 3, 0, 0]}>
                      {lineData.map((entry, i) => <Cell key={i} fill={LINE_COLORS[entry.LINE] || CHART_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cost by line */}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Energy Cost by Line ($)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Total energy spend per line across the full period</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={lineData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="LINE" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`]} />
                    <Bar dataKey="cost" name="Cost $" radius={[3, 3, 0, 0]}>
                      {lineData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── BY LINE ── */}
          {activeTab === 'By Line' && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {lineData.map((line, i) => (
                  <div key={line.LINE} style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '14px 16px', borderLeft: `4px solid ${LINE_COLORS[line.LINE] || CHART_COLORS[i]}` }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', marginBottom: '10px' }}>{line.LINE}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[
                        ['Consumption', `${(line.kwh / 1000).toFixed(0)} MWh`],
                        ['Cost',        `$${line.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
                        ['Carbon',      `${(line.carbon / 1000).toFixed(1)}t CO₂`],
                        ['Units out',   `${line.units.toLocaleString()}`],
                        ['Intensity',   `${line.intensity} kWh/unit`],
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#6B7280' }}>{label}</span>
                          <span style={{ color: '#0A1628', fontWeight: '600' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Line Comparison — MWh · Cost · Intensity</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Intensity (kWh/unit) is the key efficiency metric — it normalises for different output volumes between lines</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lineData.map(l => ({ ...l, mwh: Math.round(l.kwh / 1000) }))} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="LINE" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'MWh / Intensity', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left"  dataKey="mwh"       name="MWh"      fill="#0A1628" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="right" dataKey="cost"      name="Cost $"   fill="#4A7AB5" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="left"  dataKey="intensity" name="kWh/unit" fill="#6B9ED4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── WEEKLY TRENDS ── */}
          {activeTab === 'Weekly Trends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <ProjectedBanner />

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Weekly Energy Consumption (MWh)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Aggregated by week — each label is the Monday of that week. Solid = actuals · Dashed = projected.</div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={weeklyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toLocaleString()}`} label={{ value: 'MWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip formatter={v => v != null ? [`${v.toLocaleString()} MWh`] : ['-']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="mwhActual"    name="Actuals"   stroke="#2E558F" fill="#EEF2FA" strokeWidth={2} connectNulls={false} />
                    <Area type="monotone" dataKey="mwhProjected" name="Projected" stroke="#6B9ED4" fill="#EEF2FA" strokeWidth={2} strokeDasharray="5 3" fillOpacity={0.3} connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Weekly Energy Cost ($)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Cost driven by consumption volume and tariff mix — on-peak periods attract higher rates</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weeklyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => v != null ? [`$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`] : ['-']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="costActual"    name="Actuals"   stroke="#1C3668" strokeWidth={2} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="costProjected" name="Projected" stroke="#6B9ED4" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Weekly Carbon Emissions (t CO₂)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Carbon tracks directly with consumption — 0.233 kg CO₂ per kWh (grid factor)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weeklyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(1)}t`} />
                    <Tooltip formatter={v => v != null ? [`${(v / 1000).toFixed(1)}t CO₂`] : ['-']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="carbonActual"    name="Actuals"   stroke="#4A7AB5" fill="#EEF2FA" strokeWidth={2} connectNulls={false} />
                    <Area type="monotone" dataKey="carbonProjected" name="Projected" stroke="#6B9ED4" fill="#EEF2FA" strokeWidth={2} strokeDasharray="5 3" fillOpacity={0.3} connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── VS PRODUCTION ── */}
          {activeTab === 'vs Production' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <ProjectedBanner />

              <div style={{ background: '#EEF9EE', border: '1px solid #BBE0BB', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#1A5C1A', lineHeight: '1.6' }}>
                <strong>Why this matters:</strong> Absolute energy consumption rises and falls with production volume — that is expected.
                The key question is whether energy intensity (kWh per unit produced) is stable, improving, or drifting upward.
                A rising intensity trend means more energy is being consumed to produce each unit — a sign of inefficiency, longer CIP cycles, or changeover overhead.
              </div>

              {/* Dual axis: MWh vs Units — with projected bars */}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Weekly Energy Consumption vs Units Produced</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Energy (bars) and production output (line) should track together — divergence signals inefficiency. Lighter bars = projected.</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={weeklyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis yAxisId="left"  tick={{ fontSize: 10 }} label={{ value: 'MWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'Units', angle: 90, position: 'insideRight', fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="mwh" name="Energy MWh" radius={[3, 3, 0, 0]}>
                      {weeklyData.map((entry, i) => (
                        <Cell key={i} fill="#2E558F" opacity={entry.isProjected ? 0.35 : 0.85} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="unitsActual"    name="Units (actual)"    stroke="#C15F3C" strokeWidth={2} dot={false} connectNulls={false} />
                    <Line yAxisId="right" type="monotone" dataKey="unitsProjected" name="Units (projected)" stroke="#C15F3C" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Intensity trend */}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Weekly Energy Intensity Trend (kWh / unit)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>The primary efficiency metric — a flat or declining trend is good. Rising intensity needs investigation.</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={weeklyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'kWh/unit', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip formatter={v => v != null ? [`${v} kWh/unit`] : ['-']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="intActual"    name="Actuals"   stroke="#1C3668" fill="#EEF2FA" strokeWidth={2} connectNulls={false} />
                    <Area type="monotone" dataKey="intProjected" name="Projected" stroke="#6B9ED4" fill="#EEF2FA" strokeWidth={2} strokeDasharray="5 3" fillOpacity={0.3} connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Line intensity comparison table */}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Energy Efficiency by Line — Full Period</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FA' }}>
                      {['Line', 'Total MWh', 'Units Produced', 'kWh / Unit', 'Cost / Unit ($)', 'Carbon / Unit (kg)'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineData.map((line, i) => (
                      <tr key={line.LINE} style={{ borderBottom: '1px solid #F0F4FA' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: LINE_COLORS[line.LINE] || '#0A1628' }}>{line.LINE}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{(line.kwh / 1000).toFixed(0)} MWh</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{line.units.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0A1628' }}>{line.intensity} kWh</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>${line.units > 0 ? (line.cost / line.units).toFixed(2) : '-'}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{line.units > 0 ? (line.carbon / line.units).toFixed(2) : '-'} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TARIFF ANALYSIS ── */}
          {activeTab === 'Tariff Analysis' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>

              <div style={{ gridColumn: '1 / -1' }}><ProjectedBanner /></div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Weekly On-Peak vs Off-Peak (MWh)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Stacked by tariff period — off-peak consumption attracts lower rates. Lighter bars = projected weeks.</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weeklyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toLocaleString()}`} label={{ value: 'MWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip formatter={v => [`${v.toLocaleString()} MWh`]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="peakMwh"    name="On-Peak MWh"  stackId="a" radius={[0, 0, 0, 0]}>
                      {weeklyData.map((entry, i) => <Cell key={i} fill="#0A1628" opacity={entry.isProjected ? 0.35 : 0.9} />)}
                    </Bar>
                    <Bar dataKey="offPeakMwh" name="Off-Peak MWh" stackId="a" radius={[3, 3, 0, 0]}>
                      {weeklyData.map((entry, i) => <Cell key={i} fill="#6B9ED4" opacity={entry.isProjected ? 0.35 : 0.9} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Tariff Split Summary</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '16px' }}>Overall on-peak vs off-peak share across all lines and dates</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {splitData.map(d => {
                    const total = totalPeak + totalOffPeak
                    const pct = total > 0 ? Math.round(d.value / total * 100) : 0
                    return (
                      <div key={d.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '600', color: '#374151' }}>{d.name}</span>
                          <span style={{ color: '#6B7280' }}>{(d.value / 1000).toFixed(0)} MWh ({pct}%)</span>
                        </div>
                        <div style={{ height: '8px', background: '#EEF2FA', borderRadius: '4px' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: d.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ marginTop: '16px', padding: '12px', background: '#F8FAFC', borderRadius: '6px', fontSize: '11px', color: '#6B7280', lineHeight: '1.6' }}>
                    <strong style={{ color: '#374151' }}>Optimisation opportunity:</strong> Shifting discretionary load (e.g. CIP sequences, non-time-critical processing) from on-peak to off-peak periods reduces cost without affecting output.
                    Weekend tariffs are typically off-peak across the full 24-hour period.
                  </div>
                </div>
              </div>

              {/* Cost summary by tariff */}
              <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '12px' }}>Cost Summary by Tariff Type</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FA' }}>
                      {['Tariff Type', 'Day Records', 'Total MWh', 'Total Cost $', '% of Total Cost', 'Avg $/MWh'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      data.reduce((acc, r) => {
                        const t = r.TARIFF_TYPE || 'Unknown'
                        if (!acc[t]) acc[t] = { days: 0, kwh: 0, cost: 0 }
                        acc[t].days++
                        acc[t].kwh  += parseFloat(r.ENERGY_KWH) || 0
                        acc[t].cost += parseFloat(r.ENERGY_COST_GBP) || 0
                        return acc
                      }, {})
                    ).sort((a, b) => b[1].cost - a[1].cost).map(([tariff, d]) => (
                      <tr key={tariff} style={{ borderBottom: '1px solid #F0F4FA' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0A1628' }}>{tariff.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{d.days}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{(d.kwh / 1000).toFixed(0)} MWh</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>${d.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{totalCost > 0 ? (d.cost / totalCost * 100).toFixed(1) : 0}%</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>${d.kwh > 0 ? (d.cost / d.kwh * 1000).toFixed(2) : '-'}</td>
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
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Energy Performance Analyst</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · consumption, cost, carbon</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Summarise this week\'s energy vs plan', 'Which line is consuming the most?', 'What is driving our carbon intensity?', 'Show cost trends over the last month'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing energy data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about energy consumption, cost, carbon..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Energy Dashboard</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Site-level energy overview for NovaChem Grangemouth. Shows total kWh consumed, cost, carbon intensity and production-normalised energy intensity. Weekly trend charts split actuals (solid) from projected values (dashed). The vs Production tab overlays energy against production units to show intensity shifts.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Overview</strong> — KPI summary with site totals</li>
                  <li style={{ marginBottom: '4px' }}><strong>Trends</strong> — Weekly energy trend chart (actuals vs projected)</li>
                  <li style={{ marginBottom: '4px' }}><strong>vs Production</strong> — Energy overlaid against production output</li>
                  <li style={{ marginBottom: '4px' }}><strong>by Line</strong> — Per-production-line energy breakdown</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>energy_consumption</strong> — Daily energy readings with kWh, cost and carbon per line</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnergyDashboard
