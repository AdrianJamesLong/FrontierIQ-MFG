import { useState, useEffect, useMemo } from 'react'
import { Zap, Filter, RefreshCw, AlertCircle, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CHART_COLORS = ['#0A1628', '#1C3668', '#2E558F', '#4A7AB5', '#6B9ED4', '#8FBDE0']
const LINE_COLORS = { 'CPL-R01': '#0A1628', 'CPL-R02': '#2E558F', 'CPL-F01': '#4A7AB5', 'CPL-B01': '#6B9ED4' }

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

// Get Monday of the week as a Date
const weekMonday = str => {
  const d = parseDate(str)
  if (!d) return new Date(0)
  const day = d.getDay() || 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - day + 1)
  return mon
}

// Get week label "1 Apr" from a date string
const weekKey = str => {
  const mon = weekMonday(str)
  return mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function EnergyConsumption() {
  const [activeTab, setActiveTab] = useState('daily')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [selectedLine, setSelectedLine] = useState('All')
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
        body: JSON.stringify({ message, agent_type: 'performance_analyst', thread_id: 'energy-consumption' }),
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
  const [sortCol, setSortCol] = useState('DATE')
  const [sortDir, setSortDir] = useState('desc')

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

  const lines = ['All', ...new Set(data.map(r => r.LINE).filter(Boolean)).values()].sort()

  const filtered = useMemo(() =>
    selectedLine === 'All' ? data : data.filter(r => r.LINE === selectedLine),
    [data, selectedLine]
  )

  // ── Daily grouped ────────────────────────────────────────────────────────────
  const allDates = [...new Set(data.map(r => r.DATE))].sort((a, b) => parseDate(a) - parseDate(b))
  const dailyData = allDates.map(date => {
    const rows = filtered.filter(r => r.DATE === date)
    if (rows.length === 0) return null
    const d = parseDate(date)
    const isProj = d ? d > TODAY : false
    return {
      date: fmtShort(date),
      rawDate: date,
      kwh:  Math.round(rows.reduce((s, r) => s + (parseFloat(r.ENERGY_KWH) || 0), 0)),
      cost: Math.round(rows.reduce((s, r) => s + (parseFloat(r.ENERGY_COST_GBP) || 0), 0)),
      isProjected: isProj,
    }
  }).filter(Boolean)

  // ── Weekly rollup ─────────────────────────────────────────────────────────────
  const weeklyMap = {}
  filtered.forEach(r => {
    if (!r.DATE) return
    const wk = weekKey(r.DATE)
    const mon = weekMonday(r.DATE)
    if (!weeklyMap[wk]) weeklyMap[wk] = { week: wk, weekDate: mon, kwh: 0, cost: 0, count: 0 }
    weeklyMap[wk].kwh  += parseFloat(r.ENERGY_KWH) || 0
    weeklyMap[wk].cost += parseFloat(r.ENERGY_COST_GBP) || 0
    weeklyMap[wk].count++
  })
  const weeklyData = Object.values(weeklyMap)
    .sort((a, b) => a.weekDate - b.weekDate)
    .map(w => ({
      ...w,
      kwh:  Math.round(w.kwh),
      cost: Math.round(w.cost),
      isProjected: w.weekDate > TODAY,
    }))

  const projectedFromWeek = weeklyData.find(w => w.isProjected)?.week ?? null
  const projectedFromDay  = dailyData.find(d => d.isProjected)?.date ?? null

  // ── Intensity by line (weighted: sum kWh ÷ sum units) ────────────────────────
  const intensityByLine = {}
  data.forEach(r => {
    const line = r.LINE || 'Unknown'
    if (!intensityByLine[line]) intensityByLine[line] = { line, kwh: 0, units: 0 }
    intensityByLine[line].kwh   += parseFloat(r.ENERGY_KWH) || 0
    intensityByLine[line].units += parseFloat(r.PRODUCTION_UNITS) || 0
  })
  const intensityData = Object.values(intensityByLine)
    .map(v => ({
      line: v.line,
      avg_intensity: v.units > 0 ? parseFloat((v.kwh / v.units).toFixed(2)) : 0
    }))
    .sort((a, b) => b.avg_intensity - a.avg_intensity)

  // ── Table sort ───────────────────────────────────────────────────────────────
  const sortedTable = [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? ''
    const vb = b[sortCol] ?? ''
    const comp = String(va).localeCompare(String(vb), undefined, { numeric: true })
    return sortDir === 'asc' ? comp : -comp
  })

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const TABLE_COLS = [
    { key: 'DATE',                        label: 'Date'        },
    { key: 'LINE',                        label: 'Line'        },
    { key: 'ENERGY_KWH',                  label: 'Energy kWh'  },
    { key: 'PEAK_DEMAND_KW',              label: 'Peak kW'     },
    { key: 'ON_PEAK_KWH',                 label: 'On-Peak kWh' },
    { key: 'OFF_PEAK_KWH',                label: 'Off-Peak kWh'},
    { key: 'ENERGY_COST_GBP',             label: 'Cost $'      },
    { key: 'CARBON_KG',                   label: 'Carbon kg'   },
    { key: 'ENERGY_INTENSITY_KWH_PER_UNIT', label: 'Intensity' },
    { key: 'TARIFF_TYPE',                 label: 'Tariff'      },
  ]

  const tabs = ['daily', 'weekly', 'intensity', 'raw data']

  const ProjectedBanner = ({ from }) => from ? (
    <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', color: '#7B5800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Zap size={12} />
      <span><strong>Projected data:</strong> From <strong>{from}</strong> onwards — forecast values, not recorded actuals. Shown as lighter bars.</span>
    </div>
  ) : null

  return (
    <div className="page-container">
      <div className="page-header" style={{ borderBottom: '2px solid #E8E8E8', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Consumption Analysis</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>
            Detailed energy consumption breakdown by line, day and week · {data.length} records
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} /> AI Analysis
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '14px 0', flexWrap: 'wrap' }}>
        <Filter size={13} color="#6B7280" />
        <span style={{ fontSize: '11px', color: '#6B7280' }}>Line:</span>
        {lines.map(l => (
          <button key={l} onClick={() => setSelectedLine(l)}
            style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
              borderColor: selectedLine === l ? '#2E558F' : '#E8ECF4',
              background: selectedLine === l ? '#EEF2FA' : '#fff',
              color: selectedLine === l ? '#1C3668' : '#6B7280', fontWeight: selectedLine === l ? '600' : '400' }}>
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

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
          Loading consumption data...
        </div>
      )}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── DAILY ── */}
          {activeTab === 'daily' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <ProjectedBanner from={projectedFromDay} />

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Daily Energy Consumption (kWh)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Lighter bars = projected (forecast). Tip: use the line filter above to isolate a single reactor or filling line.</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dailyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`${v.toLocaleString()} kWh`]} />
                    <Bar dataKey="kwh" name="kWh" radius={[2, 2, 0, 0]}>
                      {dailyData.map((entry, i) => (
                        <Cell key={i} fill="#2E558F" opacity={entry.isProjected ? 0.35 : 0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Daily Energy Cost ($)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Lighter bars = projected</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v.toLocaleString()}`} />
                    <Tooltip formatter={v => [`$${v.toLocaleString()}`]} />
                    <Bar dataKey="cost" name="Cost $" radius={[2, 2, 0, 0]}>
                      {dailyData.map((entry, i) => (
                        <Cell key={i} fill="#4A7AB5" opacity={entry.isProjected ? 0.35 : 0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── WEEKLY ── */}
          {activeTab === 'weekly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <ProjectedBanner from={projectedFromWeek} />

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Weekly Energy Total (kWh)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Each label is the Monday of that week. Lighter bars = projected.</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weeklyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k kWh`} />
                    <Tooltip formatter={v => [`${v.toLocaleString()} kWh`]} />
                    <Bar dataKey="kwh" name="kWh" radius={[3, 3, 0, 0]}>
                      {weeklyData.map((entry, i) => (
                        <Cell key={i} fill="#2E558F" opacity={entry.isProjected ? 0.35 : 0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Weekly Energy Cost ($)</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Lighter bars = projected</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`$${v.toLocaleString()}`]} />
                    <Bar dataKey="cost" name="Cost $" radius={[3, 3, 0, 0]}>
                      {weeklyData.map((entry, i) => (
                        <Cell key={i} fill="#4A7AB5" opacity={entry.isProjected ? 0.35 : 0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF4', fontSize: '12px', fontWeight: '600', color: '#0A1628' }}>Weekly Summary</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FA' }}>
                      {['Week (Mon)', 'Total kWh', 'Total Cost $', 'Records', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.map((w, i) => (
                      <tr key={w.week} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD', opacity: w.isProjected ? 0.7 : 1 }}>
                        <td style={{ padding: '7px 12px', color: '#374151' }}>{w.week}</td>
                        <td style={{ padding: '7px 12px', color: '#374151' }}>{w.kwh.toLocaleString()}</td>
                        <td style={{ padding: '7px 12px', color: '#374151' }}>${w.cost.toLocaleString()}</td>
                        <td style={{ padding: '7px 12px', color: '#6B7280' }}>{w.count}</td>
                        <td style={{ padding: '7px 12px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                            background: w.isProjected ? '#FFF8E1' : '#E8F5E9',
                            color:      w.isProjected ? '#7B5800' : '#2E7D32',
                            fontWeight: '600' }}>
                            {w.isProjected ? 'Projected' : 'Actuals'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── INTENSITY ── */}
          {activeTab === 'intensity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '4px' }}>Energy Intensity by Line (kWh / unit produced)</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '12px' }}>
                  Weighted average — total kWh ÷ total units produced across all dates. Lower = more efficient. Reactors typically consume more than filling/blending lines.
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={intensityData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v} kWh/u`} />
                    <YAxis type="category" dataKey="line" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={v => [`${v} kWh/unit`]} />
                    <Bar dataKey="avg_intensity" name="kWh/unit" radius={[0, 3, 3, 0]}>
                      {intensityData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#EEF2FA', border: '1px solid rgba(28,54,104,0.15)', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1C3668', marginBottom: '6px' }}>Interpretation</div>
                <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.6' }}>
                  Energy intensity is calculated as <strong>total site energy (kWh) ÷ total units produced</strong> per line.
                  This weighted approach avoids the distortion of flat-averaging daily intensity values across different production volumes.
                  For NovaChem, reactor lines (CPL-R01, CPL-R02) are expected to have higher intensity than filling/blending lines (CPL-F01, CPL-B01)
                  due to the thermal energy required for chemical synthesis.
                </div>
              </div>

              {/* Intensity summary table */}
              <div style={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF4', fontSize: '12px', fontWeight: '600', color: '#0A1628' }}>Line Intensity Detail</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#EEF2FA' }}>
                      {['Line', 'Total kWh', 'Total Units', 'kWh / Unit', 'vs Site Avg'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const siteAvg = intensityData.length > 0
                        ? intensityData.reduce((s, d) => s + d.avg_intensity, 0) / intensityData.length
                        : 0
                      return intensityData.map((row, i) => {
                        const lineRaw = Object.values(intensityByLine).find(l => l.line === row.line)
                        const vsAvg = siteAvg > 0 ? ((row.avg_intensity - siteAvg) / siteAvg * 100) : 0
                        return (
                          <tr key={row.line} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                            <td style={{ padding: '8px 12px', fontWeight: '600', color: LINE_COLORS[row.line] || '#0A1628' }}>{row.line}</td>
                            <td style={{ padding: '8px 12px', color: '#374151' }}>{lineRaw ? Math.round(lineRaw.kwh).toLocaleString() : '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#374151' }}>{lineRaw ? Math.round(lineRaw.units).toLocaleString() : '—'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0A1628' }}>{row.avg_intensity} kWh/unit</td>
                            <td style={{ padding: '8px 12px', color: vsAvg > 0 ? '#991B1B' : '#166534', fontWeight: '600' }}>
                              {vsAvg > 0 ? '+' : ''}{vsAvg.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── RAW DATA ── */}
          {activeTab === 'raw data' && (
            <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #E8ECF4', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF4', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#6B7280' }}>
                <Zap size={12} />
                Showing {Math.min(filtered.length, 200)} of {filtered.length} records {selectedLine !== 'All' ? `for ${selectedLine}` : '(all lines)'}
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '480px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ background: '#EEF2FA' }}>
                      {TABLE_COLS.map(col => (
                        <th key={col.key} onClick={() => handleSort(col.key)}
                          style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#0A1628', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTable.slice(0, 200).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                        {TABLE_COLS.map(col => (
                          <td key={col.key} style={{ padding: '6px 12px', color: '#374151', whiteSpace: 'nowrap' }}>
                            {typeof row[col.key] === 'number' ? row[col.key].toLocaleString() : (row[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > 200 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #E8ECF4', fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>
                  Showing first 200 of {filtered.length} records
                </div>
              )}
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
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Consumption Analyst</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · kWh by line, intensity, weekly trends</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Which line has the highest energy intensity?', 'Compare weekly kWh across all lines', 'Are there outlier days in consumption?', 'How does intensity track against production units?'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing consumption data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about kWh, intensity, line comparisons..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Consumption Analysis</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Detailed energy consumption breakdown by production line. Daily tab shows per-line kWh day-by-day. Weekly tab shows aggregated kWh and cost per week per line. The Intensity tab shows kWh per production unit — a weighted calculation (sum kWh ÷ sum units) — with comparison against site average.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Daily</strong> — Per-line kWh consumption day-by-day</li>
                  <li style={{ marginBottom: '4px' }}><strong>Weekly</strong> — Aggregated kWh and cost per week per line</li>
                  <li style={{ marginBottom: '4px' }}><strong>Intensity</strong> — kWh per production unit vs site average</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>energy_consumption</strong> — Daily energy readings with kWh, cost and production units per line</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnergyConsumption
