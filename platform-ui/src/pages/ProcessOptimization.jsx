import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Zap, Loader2, X, AlertTriangle, CheckCircle, Minus, RefreshCw, Activity, LayoutList, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Breadcrumb from '../components/Breadcrumb'
import './ProcessOptimization.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const LINE_CONFIG = {
  'CPL-R01': { label: 'Reactor Line 1',  subtitle: 'Specialty Solvents',      color: '#0A1628', lineNum: '1' },
  'CPL-R02': { label: 'Reactor Line 2',  subtitle: 'Industrial Cleaners',     color: '#1C3668', lineNum: '2' },
  'CPL-B01': { label: 'Batch Line 1',    subtitle: 'Process Chemicals',       color: '#2E558F', lineNum: '3' },
  'CPL-F01': { label: 'Filling Line 1',  subtitle: 'Lubricants & Base Oils',  color: '#4A7AB5', lineNum: '4' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getChemicalFamily(desc = '') {
  const d = desc.toUpperCase()
  if (/IPA|ACETONE|MEK|ETHANOL|SOLVENT|HEXANE|TOLUENE|XYLENE|DICHLOROMETHANE|CYCLOHEXANE|MIBK|ETHYL ACETATE/.test(d))
    return 'Specialty Solvents'
  if (/CLEANER|CAUSTIC|DEGREASER|DESCALER|ACID/.test(d))
    return 'Industrial Cleaners'
  if (/CIP|SANITISER|BIOCIDE|NEUTRALISER|DISINFECT|SCALE INHIBIT|CORROSION|ANTIFOAM|FLOCCULANT|COAGULANT|WATER TREAT|PROCESS CHEM|PROCESS AID/.test(d))
    return 'Process Chemicals'
  if (/LUBRICANT|OIL|HYDRAULIC|GEAR|COMPRESSOR|BASE OIL|TURBINE|CUTTING|MINERAL OIL/.test(d))
    return 'Lubricants & Base Oils'
  return 'General'
}

function getChangeoverInfo(fromDesc, toDesc, lineNum, downtimeData) {
  const fromFamily = getChemicalFamily(fromDesc)
  const toFamily   = getChemicalFamily(toDesc)
  const lineStr    = lineNum.toString()

  if (fromFamily === toFamily) {
    const dt = downtimeData.find(d => d.LINE === lineStr && d.DOWNTIME_TYPE === 'Rinse-1')
    return {
      type:     'Rinse-1',
      hours:    dt ? parseFloat(dt.DURATION_HRS) : 1.0,
      severity: 'low',
      reason:   'Same chemical family — rinse only',
    }
  }
  const dt = downtimeData.find(d => d.LINE === lineStr && d.DOWNTIME_TYPE === 'Full Hot CIP Sequence')
  return {
    type:     'Full Hot CIP Sequence',
    hours:    dt ? parseFloat(dt.DURATION_HRS) : 4.0,
    severity: 'high',
    reason:   `Family change: ${fromFamily} to ${toFamily}`,
  }
}

function calcProductionHours(order, runRates, lineNum) {
  const rr = runRates.find(r =>
    String(r.MATERIAL) === String(order.MATERIAL_ID) &&
    String(r.LINE) === String(lineNum)
  )
  if (!rr || !rr.UNITS_PH || !order.PLANNED_QUANTITY) return null
  return parseFloat(order.PLANNED_QUANTITY) / parseFloat(rr.UNITS_PH)
}

function parseDate(str) {
  if (!str) return null
  if (str.includes('/')) {
    const [d, m, y] = str.split('/')
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  }
  return new Date(str)
}

function getWeekDates(anchorStr) {
  const d   = new Date(anchorStr)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })
}

function dateKey(date) {
  // Use local date components to avoid UTC offset shifting the date
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}


function fmtWeekRange(dates) {
  if (!dates.length) return ''
  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  return `${dates[0].toLocaleDateString('en-GB', opts)} — ${dates[6].toLocaleDateString('en-GB', opts)}`
}

// ── Component ─────────────────────────────────────────────────────────────────

const CHEMICAL_FAMILIES = ['Specialty Solvents', 'Industrial Cleaners', 'Process Chemicals', 'Lubricants & Base Oils']
const FAMILY_COLORS = {
  'Specialty Solvents':    '#0A1628',
  'Industrial Cleaners':   '#1C3668',
  'Process Chemicals':     '#2E558F',
  'Lubricants & Base Oils':'#4A7AB5',
}

export default function ProcessOptimization() {
  const [orders,       setOrders]       = useState([])
  const [runRates,     setRunRates]     = useState([])
  const [downtimeData, setDowntimeData] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [weekAnchor,   setWeekAnchor]   = useState(null)
  const [optimizing,   setOptimizing]   = useState(false)
  const [optResult,    setOptResult]    = useState(null)
  const [activeTab,        setActiveTab]        = useState('schedule')
  const [matrixLine,       setMatrixLine]       = useState('CPL-R01')
  const [matrixViewMode,     setMatrixViewMode]     = useState('family')  // 'family' | 'product'
  const [matrixFamilyFilter, setMatrixFamilyFilter] = useState('all')
  const [schedViewMode,      setSchedViewMode]      = useState('board')   // 'board' | 'table'
  const [selectedOrder,      setSelectedOrder]      = useState(null)      // order modal
  const [showPageInfo,       setShowPageInfo]       = useState(false)     // page info modal

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [pRes, rRes, dRes] = await Promise.all([
        fetch(`${API_URL}/api/data`),
        fetch(`${API_URL}/api/runrates`),
        fetch(`${API_URL}/api/downtime`),
      ])
      const [pData, rData, dData] = await Promise.all([
        pRes.json(), rRes.json(), dRes.json()
      ])
      const allOrders = pData.data || []
      setOrders(allOrders)
      setRunRates(rData.data || [])
      setDowntimeData(dData.data || [])

      // Default to current week
      setWeekAnchor(dateKey(new Date()))
    } catch (err) {
      setError(`Failed to load data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function shiftWeek(dir) {
    const d = new Date(weekAnchor)
    d.setDate(d.getDate() + dir * 7)
    setWeekAnchor(dateKey(d))
    setOptResult(null)
  }

  const weekDates = useMemo(() => weekAnchor ? getWeekDates(weekAnchor) : [], [weekAnchor])

  const weekOrders = useMemo(() => {
    if (!weekDates.length) return []
    const start = weekDates[0]
    const end   = weekDates[6]
    return orders.filter(o => {
      const d = parseDate(o.SCHEDULED_START_DATE)
      return d && d >= start && d <= end
    })
  }, [orders, weekDates])

  // Grouped: { workCenter: { dateStr: [orders] } }
  const ordersByLine = useMemo(() => {
    const result = {}
    for (const wc of Object.keys(LINE_CONFIG)) {
      const byDate = {}
      for (const o of weekOrders.filter(o => o.WORK_CENTER === wc)) {
        const key = dateKey(parseDate(o.SCHEDULED_START_DATE))
        if (!byDate[key]) byDate[key] = []
        byDate[key].push(o)
      }
      result[wc] = byDate
    }
    return result
  }, [weekOrders])

  // Capacity per line for the week (assumes 16h production day, 5 days)
  const capacityByLine = useMemo(() => {
    const AVAIL = 7 * 24  // 168h — continuous operation across the full week
    const result = {}
    for (const [wc, cfg] of Object.entries(LINE_CONFIG)) {
      const lineOrders = weekOrders.filter(o => o.WORK_CENTER === wc)
      let prodHours = 0
      for (const o of lineOrders) {
        const rawH = calcProductionHours(o, runRates, cfg.lineNum)
        // Cap each order at 24h to match the board's per-day view; fall back to 2h if no run rate
        const h = rawH ? Math.min(rawH, 24) : 2
        prodHours += h
      }
      result[wc] = {
        prodHours,
        pct:        Math.round((prodHours / AVAIL) * 100),
        orderCount: lineOrders.length,
      }
    }
    return result
  }, [weekOrders, runRates])



  // Changeover summary per line
  function getLineChangeovers(wc) {
    const cfg    = LINE_CONFIG[wc]
    const byDate = ordersByLine[wc] || {}
    let totalHrs = 0
    const pairs  = []
    for (const dayOrders of Object.values(byDate)) {
      for (let i = 0; i < dayOrders.length - 1; i++) {
        const co = getChangeoverInfo(
          dayOrders[i].MATERIAL_DESC, dayOrders[i + 1].MATERIAL_DESC,
          cfg.lineNum, downtimeData
        )
        totalHrs += co.hours
        pairs.push({ from: dayOrders[i].MATERIAL_DESC, to: dayOrders[i + 1].MATERIAL_DESC, ...co })
      }
    }
    return { totalHrs, highCount: pairs.filter(p => p.severity === 'high').length }
  }

  // ── AI Optimisation ────────────────────────────────────────────────────────

  async function handleOptimise() {
    setOptimizing(true)
    setOptResult(null)

    const scheduleContext = Object.entries(LINE_CONFIG).map(([wc, cfg]) => {
      const byDate = ordersByLine[wc] || {}
      const cap    = capacityByLine[wc] || {}
      const { totalHrs, highCount } = getLineChangeovers(wc)

      const days = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dayOrders]) => ({
          date,
          orders: dayOrders.map((o, idx) => {
            const hrs  = calcProductionHours(o, runRates, cfg.lineNum)
            const co   = idx > 0
              ? getChangeoverInfo(dayOrders[idx - 1].MATERIAL_DESC, o.MATERIAL_DESC, cfg.lineNum, downtimeData)
              : null
            return {
              position:          idx + 1,
              orderId:           o.ORDER_ID,
              material:          o.MATERIAL_DESC,
              chemicalFamily:    getChemicalFamily(o.MATERIAL_DESC),
              plannedQty:        o.PLANNED_QUANTITY,
              productionHours:   hrs ? hrs.toFixed(1) : null,
              changeoverFromPrev: co ? { type: co.type, hours: co.hours, severity: co.severity } : null,
            }
          }),
        }))

      return {
        workCenter:             wc,
        line:                   `${cfg.label} — ${cfg.subtitle}`,
        weekCapacityPct:        cap.pct,
        orderCount:             cap.orderCount,
        totalChangeoverHours:   totalHrs.toFixed(1),
        highSeverityChangeovers: highCount,
        schedule:               days,
      }
    })

    try {
      const res = await fetch(`${API_URL}/api/agent/schedule-optimizer`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          week:     fmtWeekRange(weekDates),
          schedule: scheduleContext,
        }),
      })
      const data = await res.json()
      setOptResult(data.response || data.detail || 'No recommendation returned.')
    } catch (err) {
      setOptResult(`Error: ${err.message}`)
    } finally {
      setOptimizing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="po-loading">
      <Loader2 size={24} className="spin" />
      <span>Loading schedule data...</span>
    </div>
  )

  if (error) return (
    <div className="po-error">
      <AlertTriangle size={20} />
      <span>{error}</span>
      <button onClick={fetchAll} className="po-retry"><RefreshCw size={14} /> Retry</button>
    </div>
  )

  const totalChangeovers = Object.keys(LINE_CONFIG).reduce((sum, wc) => {
    return sum + getLineChangeovers(wc).totalHrs
  }, 0)

  const totalHighSeverity = Object.keys(LINE_CONFIG).reduce((sum, wc) => {
    return sum + getLineChangeovers(wc).highCount
  }, 0)

  return (
    <div className="po-page">
      <Breadcrumb items={[{ label: 'Production Intelligence' }, { label: 'Schedule Optimisation' }]} />

      {/* ── Page Header ── */}
      <div className="po-header">
        <div className="po-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="po-title">Schedule Optimisation</h1>
            <button className="po-info-btn" onClick={() => setShowPageInfo(true)} title="About this page">
              <Info size={15} />
            </button>
          </div>
          <p className="po-subtitle">Production schedule and changeover analysis — NovaChem, Grangemouth</p>
        </div>
        <div className="po-header-right">
          <div className="po-week-nav">
            <button className="po-week-btn" onClick={() => shiftWeek(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="po-week-label">{fmtWeekRange(weekDates)}</span>
            <button className="po-week-btn" onClick={() => shiftWeek(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Week Summary Strip ── */}
      <div className="po-summary-strip">
        <div className="po-summary-stat">
          <span className="po-stat-value">{weekOrders.length}</span>
          <span className="po-stat-label">Orders this week</span>
        </div>
        <div className="po-summary-divider" />
        <div className="po-summary-stat">
          <span className="po-stat-value">{totalChangeovers.toFixed(1)}h</span>
          <span className="po-stat-label">Total changeover time</span>
        </div>
        <div className="po-summary-divider" />
        <div className={`po-summary-stat ${totalHighSeverity > 0 ? 'po-stat--warn' : ''}`}>
          <span className="po-stat-value">{totalHighSeverity}</span>
          <span className="po-stat-label">Full CIP transitions</span>
        </div>
        <div className="po-summary-divider" />
        {/* Capacity gauges */}
        {Object.entries(LINE_CONFIG).map(([wc, cfg]) => {
          const cap = capacityByLine[wc] || {}
          const pct = cap.pct || 0
          return (
            <div key={wc} className="po-capacity-gauge">
              <div className="po-gauge-label">{wc.replace('CPL-','')}</div>
              <div className="po-gauge-bar">
                <div
                  className={`po-gauge-fill ${pct > 85 ? 'po-gauge--over' : pct > 65 ? 'po-gauge--warn' : ''}`}
                  style={{ width: `${Math.min(pct, 100)}%`, background: pct > 85 ? undefined : cfg.color }}
                />
              </div>
              <div className={`po-gauge-pct ${pct > 85 ? 'po-gauge-pct--over' : ''}`}>{pct}%</div>
            </div>
          )
        })}
      </div>

      {/* ── Tab Bar ── */}
      <div className="po-tab-bar">
        {[
          { id: 'schedule',   label: 'Schedule' },
          { id: 'changeover', label: 'Changeover Matrix' },
          { id: 'downtime',   label: 'Downtime Events' },
          { id: 'optimise',   label: 'AI Optimiser', icon: <Zap size={13} /> },
        ].map(tab => (
          <button
            key={tab.id}
            className={`po-tab ${activeTab === tab.id ? 'po-tab--active' : ''}${tab.id === 'optimise' ? ' po-tab--zap' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && <span className="po-tab-icon">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Changeover Matrix Tab ── */}
      {activeTab === 'changeover' && (() => {
        const cfg = LINE_CONFIG[matrixLine]
        const lineRates = runRates.filter(r => String(r.LINE) === String(cfg.lineNum))
        const familiesOnLine = [...new Set(lineRates.map(r => getChemicalFamily(r.MAT_DESCRIPTION)))]
          .filter(f => f !== 'General')
        const allFamilies = familiesOnLine.length > 0 ? familiesOnLine : CHEMICAL_FAMILIES
        const lineDowntime = downtimeData.filter(d => String(d.LINE) === String(cfg.lineNum))
        const rinse1Hrs  = parseFloat(lineDowntime.find(d => d.DOWNTIME_TYPE === 'Rinse-1')?.DURATION_HRS ?? 1)
        const cipHrs     = parseFloat(lineDowntime.find(d => d.DOWNTIME_TYPE === 'Full Hot CIP Sequence')?.DURATION_HRS ?? 4)

        const getCellInfo = (fromFamily, toFamily) => {
          if (fromFamily === toFamily) return { type: 'Rinse-1', hrs: rinse1Hrs, severity: 'low' }
          return { type: 'Full Hot CIP', hrs: cipHrs, severity: 'high' }
        }

        // Product matrix data — up to 15 materials on this line, filterable by family
        const filteredMaterials = matrixFamilyFilter === 'all'
          ? lineRates
          : lineRates.filter(r => getChemicalFamily(r.MAT_DESCRIPTION) === matrixFamilyFilter)
        const matrixMaterials = filteredMaterials.slice(0, 15)

        return (
          <div className="po-tab-content">
            {/* Toolbar: line selector + view toggle */}
            <div className="po-tab-toolbar" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="po-tab-toolbar-label">Line:</span>
                <div className="po-line-selector">
                  {Object.entries(LINE_CONFIG).map(([wc, c]) => (
                    <button
                      key={wc}
                      className={`po-line-sel-btn ${matrixLine === wc ? 'active' : ''}`}
                      style={matrixLine === wc ? { borderColor: c.color, color: c.color, background: '#F5F8FC' } : {}}
                      onClick={() => { setMatrixLine(wc); setMatrixFamilyFilter('all') }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="po-sched-view-btns">
                <button className={`po-sched-mode-btn ${matrixViewMode === 'family' ? 'active' : ''}`}
                  onClick={() => setMatrixViewMode('family')}>
                  Family Matrix
                </button>
                <button className={`po-sched-mode-btn ${matrixViewMode === 'product' ? 'active' : ''}`}
                  onClick={() => setMatrixViewMode('product')}>
                  Product Matrix
                </button>
              </div>
            </div>

            {/* Summary stat cards */}
            <div className="po-co-summary">
              <div className="po-co-card po-co-card--fast">
                <div className="po-co-card-value">{rinse1Hrs}h</div>
                <div className="po-co-card-label">Rinse-1</div>
                <div className="po-co-card-sub">Same chemical family — {Math.round(rinse1Hrs * 60)} min</div>
              </div>
              <div className="po-co-card po-co-card--slow">
                <div className="po-co-card-value">{cipHrs}h</div>
                <div className="po-co-card-label">Full Hot CIP</div>
                <div className="po-co-card-sub">Cross-family — {Math.round(cipHrs * 60)} min</div>
              </div>
              <div className="po-co-card">
                <div className="po-co-card-value">{allFamilies.length}</div>
                <div className="po-co-card-label">Chemical Families</div>
                <div className="po-co-card-sub">on {cfg.label}</div>
              </div>
              <div className="po-co-card">
                <div className="po-co-card-value">{lineRates.length}</div>
                <div className="po-co-card-label">Materials (SKUs)</div>
                <div className="po-co-card-sub">in run rates for this line</div>
              </div>
            </div>

            {/* ── FAMILY MATRIX ── */}
            {matrixViewMode === 'family' && (
              <>
                <div className="po-co-matrix-wrap">
                  <h3 className="po-section-title">Family-to-Family Changeover Matrix — {cfg.label}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary,#6b7280)', marginBottom: 14 }}>
                    Shows changeover type and duration when moving between chemical families on this line.
                  </p>
                  <div className="po-co-matrix-container">
                    <table className="po-co-matrix">
                      <thead>
                        <tr>
                          <th className="po-co-corner">From → To</th>
                          {allFamilies.map(f => (
                            <th key={f} style={{ borderTop: `3px solid ${FAMILY_COLORS[f] || '#ccc'}` }}>{f}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allFamilies.map(fromF => (
                          <tr key={fromF}>
                            <td className="po-co-row-header" style={{ borderLeft: `3px solid ${FAMILY_COLORS[fromF] || '#ccc'}` }}>
                              {fromF}
                            </td>
                            {allFamilies.map(toF => {
                              const cell = getCellInfo(fromF, toF)
                              const isSame = fromF === toF
                              return (
                                <td key={toF} className={`po-co-cell ${isSame ? 'po-co-cell--same' : cell.severity === 'low' ? 'po-co-cell--fast' : 'po-co-cell--slow'}`}>
                                  {isSame ? '—' : (
                                    <>
                                      <span className="po-co-cell-type">{cell.type}</span>
                                      <span className="po-co-cell-hrs">{cell.hrs}h</span>
                                    </>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="po-co-legend">
                    <div className="po-co-legend-item po-co-cell--fast"><span>Rinse-1</span> — same family</div>
                    <div className="po-co-legend-item po-co-cell--slow"><span>Full Hot CIP</span> — cross-family</div>
                    <div className="po-co-legend-item po-co-cell--same"><span>—</span> no changeover</div>
                  </div>
                </div>

                <div className="po-co-rules">
                  <h3 className="po-section-title">Changeover Rules — {cfg.label}</h3>
                  {lineDowntime.map(d => (
                    <div key={d.DOWNTIME_TYPE} className={`po-rule-card ${d.DOWNTIME_TYPE === 'Rinse-1' ? 'po-rule--fast' : 'po-rule--slow'}`}>
                      <div className="po-rule-name">{d.DOWNTIME_TYPE}</div>
                      <div className="po-rule-duration">{d.DURATION_HRS}h</div>
                      <div className="po-rule-desc">
                        {d.DOWNTIME_TYPE === 'Rinse-1'
                          ? 'Applied when consecutive orders share the same chemical family. Minimal flushing required — line remains largely operational.'
                          : 'Applied when consecutive orders are from different chemical families. Full hot clean-in-place sequence. Line fully offline for the duration.'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── PRODUCT MATRIX ── */}
            {matrixViewMode === 'product' && (
              <>
                <div className="po-co-matrix-wrap">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 className="po-section-title" style={{ margin: 0 }}>Product-to-Product Changeover Matrix — {cfg.label}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary,#6b7280)', marginTop: 4 }}>
                        Changeover duration (hours) between individual material SKUs. Showing up to 15 materials.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="po-tab-toolbar-label">Family:</span>
                      <select
                        value={matrixFamilyFilter}
                        onChange={e => setMatrixFamilyFilter(e.target.value)}
                        style={{
                          fontSize: 12, fontWeight: 600, padding: '5px 10px',
                          border: '1px solid var(--border,#e5e7eb)', borderRadius: 6,
                          background: 'var(--bg-white,#fff)', color: 'var(--text-primary,#0f1117)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Families</option>
                        {allFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  {matrixMaterials.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary,#6b7280)', padding: '20px 0' }}>
                      No materials found for this filter.
                    </p>
                  ) : (
                    <>
                      <div className="po-co-matrix-container">
                        <table className="po-co-matrix">
                          <thead>
                            <tr>
                              <th className="po-co-corner" style={{ minWidth: 200 }}>From → To</th>
                              {matrixMaterials.map(m => (
                                <th key={m.MATERIAL} style={{ minWidth: 90, fontSize: 10, textAlign: 'center' }}>
                                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 88 }} title={m.MAT_DESCRIPTION}>
                                    {m.MATERIAL}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {matrixMaterials.map(matFrom => {
                              const familyFrom = getChemicalFamily(matFrom.MAT_DESCRIPTION)
                              return (
                                <tr key={matFrom.MATERIAL}>
                                  <td className="po-co-row-header" style={{ fontSize: 12 }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary,#0f1117)' }}>{matFrom.MATERIAL}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary,#6b7280)', fontWeight: 400, marginTop: 1 }}
                                      title={matFrom.MAT_DESCRIPTION}>
                                      {matFrom.MAT_DESCRIPTION?.length > 28 ? matFrom.MAT_DESCRIPTION.slice(0, 28) + '…' : matFrom.MAT_DESCRIPTION}
                                    </div>
                                  </td>
                                  {matrixMaterials.map(matTo => {
                                    const isSame = matFrom.MATERIAL === matTo.MATERIAL
                                    if (isSame) return (
                                      <td key={matTo.MATERIAL} className="po-co-cell po-co-cell--same" style={{ textAlign: 'center' }}>—</td>
                                    )
                                    const familyTo = getChemicalFamily(matTo.MAT_DESCRIPTION)
                                    const cell = getCellInfo(familyFrom, familyTo)
                                    return (
                                      <td key={matTo.MATERIAL}
                                        className={`po-co-cell ${cell.severity === 'low' ? 'po-co-cell--fast' : 'po-co-cell--slow'}`}
                                        title={`${matFrom.MATERIAL} → ${matTo.MATERIAL}: ${cell.type} (${cell.hrs}h)`}
                                        style={{ textAlign: 'center', cursor: 'default' }}
                                      >
                                        <span className="po-co-cell-hrs">{cell.hrs}h</span>
                                      </td>
                                    )
                                  })}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="po-co-legend" style={{ marginTop: 12 }}>
                        <div className="po-co-legend-item po-co-cell--fast"><span>Rinse-1 ({rinse1Hrs}h)</span> — same family</div>
                        <div className="po-co-legend-item po-co-cell--slow"><span>Full Hot CIP ({cipHrs}h)</span> — cross-family</div>
                        <div className="po-co-legend-item po-co-cell--same"><span>—</span> same material</div>
                      </div>
                      {filteredMaterials.length > 15 && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary,#6b7280)', marginTop: 10 }}>
                          Showing 15 of {filteredMaterials.length} materials. Use the family filter to narrow down.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* ── Downtime Events Tab ── */}
      {activeTab === 'downtime' && (() => {
        // Build cross-tab: unique types × all lines
        const allTypes = [...new Set(downtimeData.map(d => d.DOWNTIME_TYPE))].sort()
        const lineEntries = Object.entries(LINE_CONFIG)

        // Stats across all lines
        const totalEvents   = downtimeData.length
        const rinseCount    = downtimeData.filter(d => d.DOWNTIME_TYPE === 'Rinse-1').length
        const cipCount      = downtimeData.filter(d => d.DOWNTIME_TYPE !== 'Rinse-1' && (d.DOWNTIME_TYPE.toLowerCase().includes('cip') || d.DOWNTIME_TYPE.toLowerCase().includes('hot'))).length
        const maxDuration   = downtimeData.reduce((m, d) => Math.max(m, parseFloat(d.DURATION_HRS || 0)), 0)

        // This-week changeover events across ALL lines
        const weekEvents = []
        for (const [wc, cfg] of lineEntries) {
          const byDate = ordersByLine[wc] || {}
          for (const [date, dayOrders] of Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b))) {
            for (let i = 0; i < dayOrders.length - 1; i++) {
              const co = getChangeoverInfo(dayOrders[i].MATERIAL_DESC, dayOrders[i+1].MATERIAL_DESC, cfg.lineNum, downtimeData)
              weekEvents.push({ date, line: cfg.label, wc, from: dayOrders[i].MATERIAL_DESC, to: dayOrders[i+1].MATERIAL_DESC, ...co })
            }
          }
        }
        weekEvents.sort((a, b) => a.date.localeCompare(b.date) || a.line.localeCompare(b.line))
        const weekTotalHrs = weekEvents.reduce((s, e) => s + e.hours, 0)
        const weekHighCount = weekEvents.filter(e => e.severity === 'high').length

        return (
          <div className="po-tab-content">
            {/* Stats strip */}
            <div className="po-summary-strip">
              <div className="po-summary-stat">
                <span className="po-stat-value">{rinseCount}</span>
                <span className="po-stat-label">Rinse-1 Events</span>
              </div>
              <div className="po-summary-divider" />
              <div className="po-summary-stat">
                <span className="po-stat-value">{cipCount}</span>
                <span className="po-stat-label">CIP Sequences</span>
              </div>
              <div className="po-summary-divider" />
              <div className="po-summary-stat">
                <span className="po-stat-value">{totalEvents}</span>
                <span className="po-stat-label">Total Defined Types</span>
              </div>
              <div className="po-summary-divider" />
              <div className="po-summary-stat">
                <span className="po-stat-value">{maxDuration.toFixed(1)}h</span>
                <span className="po-stat-label">Max Event Duration</span>
              </div>
            </div>

            {/* ── Duration Reference Matrix ── */}
            <div className="po-co-rules">
              <h3 className="po-section-title">Downtime Duration Reference — All Lines</h3>
              <p style={{ fontSize: 12, color: '#6B6B6B', margin: '0 0 12px' }}>
                Configured durations per event type and production line, sourced from the Fabric Lakehouse <code>dbo.downtime</code> table.
              </p>
              {downtimeData.length === 0 ? (
                <p style={{ fontSize: 13, color: '#6B6B6B' }}>No downtime records found in the lakehouse.</p>
              ) : (
                <table className="po-order-table po-dt-matrix">
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>Category</th>
                      {lineEntries.map(([wc, c]) => (
                        <th key={wc} className="po-th-right">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTypes.map(type => {
                      const isCIP     = type !== 'Rinse-1' && (type.toLowerCase().includes('cip') || type.toLowerCase().includes('hot'))
                      const isRinse   = type === 'Rinse-1'
                      const category  = isRinse ? 'Standard Changeover' : isCIP ? 'CIP / Cleaning' : 'Other'
                      const severity  = isCIP ? 'high' : 'low'
                      return (
                        <tr key={type} className="po-order-row">
                          <td style={{ fontWeight: 600, color: '#0A1628' }}>{type}</td>
                          <td>
                            <span className={`po-status ${severity === 'high' ? 'po-status--progress' : 'po-status--planned'}`}>
                              {category}
                            </span>
                          </td>
                          {lineEntries.map(([wc, c]) => {
                            const rec = downtimeData.find(d => String(d.LINE) === String(c.lineNum) && d.DOWNTIME_TYPE === type)
                            return (
                              <td key={wc} className="po-td-right">
                                {rec ? (
                                  <span className="po-dt-cell-val">
                                    {parseFloat(rec.DURATION_HRS).toFixed(1)}h
                                    <span className="po-dt-cell-min"> ({Math.round(parseFloat(rec.DURATION_HRS) * 60)} min)</span>
                                  </span>
                                ) : (
                                  <span style={{ color: '#C4C4C4' }}>—</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── This Week's Changeover Events ── */}
            <div className="po-co-rules">
              <h3 className="po-section-title">Changeover Events — Selected Week (All Lines)</h3>
              {weekEvents.length === 0 ? (
                <p style={{ fontSize: 13, color: '#6B6B6B' }}>No changeovers derived from this week's schedule.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 14, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{weekEvents.length}</span>
                      <span style={{ fontSize: 12, color: '#6B6B6B', marginLeft: 6 }}>changeovers this week</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{weekTotalHrs.toFixed(1)}h</span>
                      <span style={{ fontSize: 12, color: '#6B6B6B', marginLeft: 6 }}>total changeover time</span>
                    </div>
                    {weekHighCount > 0 && (
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#92400e' }}>{weekHighCount}</span>
                        <span style={{ fontSize: 12, color: '#6B6B6B', marginLeft: 6 }}>Full CIP events</span>
                      </div>
                    )}
                  </div>
                  <table className="po-order-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Line</th>
                        <th>From Product</th>
                        <th>To Product</th>
                        <th>Type</th>
                        <th className="po-th-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekEvents.map((e, i) => (
                        <tr key={i} className="po-order-row">
                          <td style={{ color: '#6B6B6B', fontSize: 12, whiteSpace: 'nowrap' }}>{e.date}</td>
                          <td style={{ fontSize: 12, fontWeight: 600, color: LINE_CONFIG[e.wc]?.color || '#0A1628', whiteSpace: 'nowrap' }}>{e.line}</td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.from}</td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.to}</td>
                          <td>
                            <span className={`po-status ${e.severity === 'high' ? 'po-status--progress' : 'po-status--planned'}`}>
                              {e.type}
                            </span>
                          </td>
                          <td className="po-td-right">{e.hours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Schedule Tab ── */}
      {activeTab === 'schedule' && (() => {
        const TIMELINE_HOURS = 24  // full 24-hour day per cell

        const FAMILY_PALETTE = {
          'Specialty Solvents':    '#E4EBF5',
          'Industrial Cleaners':   '#DAE4F0',
          'Process Chemicals':     '#CEDBEC',
          'Lubricants & Base Oils':'#C2D3E8',
          'General':               '#F1F5F9',
        }
        const FAMILY_BORDER = {
          'Specialty Solvents':    '#1C3668',
          'Industrial Cleaners':   '#2E558F',
          'Process Chemicals':     '#4A7AB5',
          'Lubricants & Base Oils':'#6B9ED4',
          'General':               '#94A3B8',
        }

        // Build blocks for a single [line × day] cell
        function buildDayBlocks(wc, dateStr) {
          const cfg = LINE_CONFIG[wc]
          const dayOrds = orders.filter(o =>
            o.WORK_CENTER === wc &&
            parseDate(o.SCHEDULED_START_DATE) &&
            dateKey(parseDate(o.SCHEDULED_START_DATE)) === dateStr
          )
          const blocks = []
          let usedHours = 0
          dayOrds.forEach((order, idx) => {
            if (idx > 0) {
              const co = getChangeoverInfo(dayOrds[idx-1].MATERIAL_DESC, order.MATERIAL_DESC, cfg.lineNum, downtimeData)
              const coHrs = Math.min(co.hours, TIMELINE_HOURS - usedHours)
              if (coHrs > 0) {
                blocks.push({ type: 'changeover', hours: coHrs, severity: co.severity, label: co.type })
                usedHours += coHrs
              }
            }
            const prodHrs = calcProductionHours(order, runRates, cfg.lineNum) || 2
            const clampedHrs = Math.min(prodHrs, TIMELINE_HOURS - usedHours)
            if (clampedHrs > 0) {
              blocks.push({ type: 'order', hours: clampedHrs, order, family: getChemicalFamily(order.MATERIAL_DESC) })
              usedHours += clampedHrs
            }
          })
          if (usedHours < TIMELINE_HOURS)
            blocks.push({ type: 'free', hours: TIMELINE_HOURS - usedHours })
          return { blocks, usedHours, orderCount: dayOrds.length }
        }

        const todayKey = dateKey(new Date())
        const totalWeekOrders = weekOrders.length
        const totalWeekCO = weekDates.reduce((sum, d) => {
          const dk = dateKey(d)
          return sum + Object.keys(LINE_CONFIG).reduce((s, wc) => {
            const { blocks } = buildDayBlocks(wc, dk)
            return s + blocks.filter(b => b.type === 'changeover').reduce((ss, b) => ss + b.hours, 0)
          }, 0)
        }, 0)
        const activeLines = Object.keys(LINE_CONFIG).filter(wc => weekOrders.some(o => o.WORK_CENTER === wc))

        return (
          <div className="po-tab-content">
            {/* View mode toggle + summary */}
            <div className="po-sched-controls">
              <div className="po-sched-view-btns">
                <button className={`po-sched-mode-btn ${schedViewMode === 'board' ? 'active' : ''}`}
                  onClick={() => setSchedViewMode('board')}>
                  <Activity size={13} /> Weekly Board
                </button>
                <button className={`po-sched-mode-btn ${schedViewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setSchedViewMode('table')}>
                  <LayoutList size={13} /> Line Schedule
                </button>
              </div>
              <div className="po-sched-summary">
                <span><strong>{totalWeekOrders}</strong> orders this week</span>
                <span>·</span>
                <span><strong>{totalWeekCO.toFixed(1)}h</strong> changeover</span>
                <span>·</span>
                <span><strong>{activeLines.length}</strong> lines active</span>
              </div>
            </div>

            {/* ── WEEKLY PLANNING BOARD ── */}
            {schedViewMode === 'board' && (
              <div className="po-week-board">
                {/* Header: spacer + 7 day columns */}
                <div className="po-wb-header">
                  <div className="po-wb-line-spacer" />
                  {weekDates.map(d => {
                    const dk = dateKey(d)
                    const isToday = dk === todayKey
                    const dayOrders = weekOrders.filter(o =>
                      parseDate(o.SCHEDULED_START_DATE) && dateKey(parseDate(o.SCHEDULED_START_DATE)) === dk
                    )
                    return (
                      <div key={dk} className={`po-wb-day-header ${isToday ? 'po-wb-day--today' : ''}`}>
                        <span className="po-wb-day-name">{d.toLocaleDateString('en-GB',{weekday:'short'})}</span>
                        <span className="po-wb-day-date">{d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
                        <span className="po-wb-day-count">{dayOrders.length > 0 ? `${dayOrders.length} ord` : ''}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Line rows */}
                {Object.entries(LINE_CONFIG).map(([wc, cfg]) => (
                  <div key={wc} className="po-wb-line-row">
                    {/* Line label */}
                    <div className="po-wb-line-label" style={{ borderLeftColor: cfg.color }}>
                      <span className="po-wb-wc">{wc}</span>
                      <span className="po-wb-name">{cfg.label}</span>
                      <span className="po-wb-sub">{cfg.subtitle}</span>
                    </div>

                    {/* Day cells */}
                    {weekDates.map(d => {
                      const dk = dateKey(d)
                      const isToday = dk === todayKey
                      const { blocks, orderCount } = buildDayBlocks(wc, dk)
                      return (
                        <div key={dk} className={`po-wb-day-cell ${isToday ? 'po-wb-cell--today' : ''}`}>
                          {orderCount === 0
                            ? <div className="po-wb-cell-empty" />
                            : (
                              <div className="po-wb-cell-gantt">
                                {blocks.map((block, i) => {
                                  const widthPct = (block.hours / TIMELINE_HOURS) * 100
                                  if (block.type === 'order') {
                                    const bg     = FAMILY_PALETTE[block.family] || '#F1F5F9'
                                    const border = FAMILY_BORDER[block.family] || '#94A3B8'
                                    const delivPct = block.order.PLANNED_QUANTITY > 0
                                      ? Math.min(100, Math.round((parseFloat(block.order.DELIVERED_QUANTITY || 0) / parseFloat(block.order.PLANNED_QUANTITY)) * 100))
                                      : 0
                                    return (
                                      <div key={i}
                                        className="po-wb-block po-wb-order po-wb-order--clickable"
                                        style={{ width: `${widthPct}%`, background: bg, borderTopColor: border }}
                                        title={`${block.order.ORDER_ID} — ${delivPct}% delivered — click for details`}
                                        onClick={() => setSelectedOrder({ order: block.order, hours: block.hours, family: block.family, wc, cfg })}
                                      >
                                        <span className="po-wb-order-id">{block.order.ORDER_ID}</span>
                                        <span className="po-wb-order-hrs">{block.hours.toFixed(1)}h</span>
                                        <div className="po-wb-order-prog">
                                          <div className="po-wb-order-prog-fill" style={{ width: `${delivPct}%`, background: border }} />
                                        </div>
                                      </div>
                                    )
                                  }
                                  if (block.type === 'changeover') {
                                    const abbr = block.severity === 'high' ? 'CIP' : 'R1'
                                    return (
                                      <div key={i}
                                        className={`po-wb-block po-wb-co po-wb-co--${block.severity}`}
                                        style={{ width: `${widthPct}%` }}
                                        title={`${block.label} — ${block.hours}h`}
                                      >
                                        <span className="po-wb-co-label">{abbr} {block.hours}h</span>
                                      </div>
                                    )
                                  }
                                  return (
                                    <div key={i} className="po-wb-block po-wb-free" style={{ width: `${widthPct}%` }} />
                                  )
                                })}
                              </div>
                            )
                          }
                        </div>
                      )
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="po-wb-legend">
                  {Object.entries(FAMILY_PALETTE).filter(([f]) => f !== 'General').map(([family, bg]) => (
                    <div key={family} className="po-wb-legend-item">
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `2px solid ${FAMILY_BORDER[family]}` }} />
                      <span>{family}</span>
                    </div>
                  ))}
                  <div className="po-wb-legend-item">
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#EBF2F9', border: '2px solid #1C3668' }} />
                    <span>Rinse-1</span>
                  </div>
                  <div className="po-wb-legend-item">
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#FEF3C7', border: '2px solid #B45309' }} />
                    <span>Full Hot CIP</span>
                  </div>
                  <div className="po-wb-legend-item">
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#F5F5F5', border: '1px solid #E8E8E8' }} />
                    <span>Available</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── LINE SCHEDULE TABLE ── */}
            {schedViewMode === 'table' && (
              <div className="po-lines">
                {Object.entries(LINE_CONFIG).map(([wc, cfg]) => {
                  const lineOrders = weekOrders.filter(o => o.WORK_CENTER === wc)
                  const { totalHrs, highCount } = getLineChangeovers(wc)
                  const prodHrsTotal = lineOrders.reduce((s, o) => s + (calcProductionHours(o, runRates, cfg.lineNum) || 0), 0)

                  return (
                    <div key={wc} className="po-line-section">
                      <div className="po-line-header" style={{ borderLeftColor: cfg.color }}>
                        <div className="po-line-header-left">
                          <span className="po-line-wc">{wc}</span>
                          <span className="po-line-name">{cfg.label}</span>
                          <span className="po-line-sub">{cfg.subtitle}</span>
                        </div>
                        <div className="po-line-header-right">
                          {lineOrders.length > 0 && (
                            <>
                              <span className="po-line-stat">{lineOrders.length} orders</span>
                              <span className="po-line-stat po-stat-divider-inline">·</span>
                              <span className="po-line-stat">{prodHrsTotal.toFixed(1)}h production</span>
                              {totalHrs > 0 && <>
                                <span className="po-line-stat po-stat-divider-inline">·</span>
                                <span className={`po-line-stat ${highCount > 0 ? 'po-stat--warn' : ''}`}>
                                  {totalHrs.toFixed(1)}h changeover{highCount > 0 && ` (${highCount} Full CIP)`}
                                </span>
                              </>}
                            </>
                          )}
                        </div>
                      </div>
                      {lineOrders.length === 0 ? (
                        <div className="po-no-orders">No orders scheduled this week for {cfg.label}</div>
                      ) : (
                        <div className="po-line-body">
                          {/* Group by day */}
                          {weekDates.map(d => {
                            const dk = dateKey(d)
                            const dayOrds = lineOrders.filter(o =>
                              parseDate(o.SCHEDULED_START_DATE) &&
                              dateKey(parseDate(o.SCHEDULED_START_DATE)) === dk
                            )
                            if (dayOrds.length === 0) return null
                            return (
                              <div key={dk} className="po-day-block">
                                <div className="po-day-header">
                                  {d.toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'short'})}
                                  {dk === todayKey && <span style={{marginLeft:8,color:'#1C3668',fontWeight:700}}>TODAY</span>}
                                </div>
                                <table className="po-order-table">
                                  <thead>
                                    <tr>
                                      <th>Order ID</th>
                                      <th>Material</th>
                                      <th>Chemical Family</th>
                                      <th className="po-th-right">Planned Qty</th>
                                      <th className="po-th-right">Prod. Hours</th>
                                      <th className="po-th-right">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dayOrds.map((order, idx) => {
                                      const prodHrs = calcProductionHours(order, runRates, cfg.lineNum)
                                      const family  = getChemicalFamily(order.MATERIAL_DESC)
                                      const co      = idx > 0
                                        ? getChangeoverInfo(dayOrds[idx-1].MATERIAL_DESC, order.MATERIAL_DESC, cfg.lineNum, downtimeData)
                                        : null
                                      const isComplete   = order.ACTUAL_FINISH_DATE && !order.ACTUAL_FINISH_DATE.startsWith('31/12/9999')
                                      const isInProgress = order.ACTUAL_START_DATE && !order.ACTUAL_START_DATE.startsWith('31/12/9999') && !isComplete
                                      return (
                                        <>
                                          {co && (
                                            <tr key={`co-${order.ORDER_ID}`} className={`po-changeover-row po-co--${co.severity}`}>
                                              <td colSpan={6}>
                                                <div className="po-changeover-inner">
                                                  {co.severity === 'high' ? <AlertTriangle size={12}/> : <Minus size={12}/>}
                                                  <span className="po-co-type">{co.type}</span>
                                                  <span className="po-co-duration">{co.hours}h</span>
                                                  <span className="po-co-reason">{co.reason}</span>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                          <tr key={order.ORDER_ID} className="po-order-row po-order-row--clickable"
                                            onClick={() => setSelectedOrder({ order, hours: calcProductionHours(order, runRates, cfg.lineNum), family: getChemicalFamily(order.MATERIAL_DESC), wc, cfg })}>
                                            <td className="po-order-id">{order.ORDER_ID}</td>
                                            <td className="po-material">{order.MATERIAL_DESC}</td>
                                            <td><span className="po-family-tag">{family}</span></td>
                                            <td className="po-td-right">{parseInt(order.PLANNED_QUANTITY||0).toLocaleString()}</td>
                                            <td className="po-td-right">{prodHrs ? `${prodHrs.toFixed(1)}h` : '—'}</td>
                                            <td className="po-td-right">
                                              {isComplete   ? <span className="po-status po-status--complete"><CheckCircle size={11}/> Complete</span>
                                              : isInProgress ? <span className="po-status po-status--progress">In Progress</span>
                                              :                <span className="po-status po-status--planned">Planned</span>}
                                            </td>
                                          </tr>
                                        </>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── AI Optimiser Tab ── */}
      {activeTab === 'optimise' && (
        <div className="po-tab-content">
          <div className="po-opt-intro">
            <div className="po-opt-intro-text">
              <h3 className="po-section-title">AI Schedule Optimiser</h3>
              <p>Analyses this week's production schedule across all four lines — order sequencing, changeover types, CIP burden, and capacity — then recommends a resequenced plan to minimise downtime and maximise throughput.</p>
            </div>
            <button
              className="po-optimise-btn"
              onClick={handleOptimise}
              disabled={optimizing || weekOrders.length === 0}
            >
              {optimizing ? <Loader2 size={15} className="spin" /> : <Zap size={15} />}
              {optimizing ? 'Analysing...' : 'Run Optimisation'}
            </button>
          </div>

          {weekOrders.length === 0 && !optimizing && (
            <p style={{ fontSize: 13, color: '#6B6B6B', padding: '8px 0' }}>No orders found for the selected week. Use the week navigation to find a week with scheduled production.</p>
          )}

          {(optimizing || optResult) && (
            <div className="po-opt-panel po-opt-panel--tab">
              <div className="po-opt-header">
                <div className="po-opt-header-left">
                  <Zap size={16} className="po-opt-icon" />
                  <span>Schedule Optimisation Analysis</span>
                  <span className="po-opt-week">{fmtWeekRange(weekDates)}</span>
                </div>
                {optResult && (
                  <button className="po-opt-close" onClick={() => setOptResult(null)} title="Clear result">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="po-opt-body">
                {optimizing ? (
                  <div className="po-opt-loading">
                    <Loader2 size={18} className="spin" />
                    <span>Analysing production schedule and changeover sequences...</span>
                  </div>
                ) : (
                  <div className="po-opt-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{optResult}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Page Info Modal ── */}
      {showPageInfo && (
        <div className="po-modal-overlay" onClick={() => setShowPageInfo(false)}>
          <div className="po-modal po-modal--info" onClick={e => e.stopPropagation()}>
            <div className="po-modal-header" style={{ borderLeftColor: '#2E558F' }}>
              <div>
                <div className="po-modal-order-id">About this section</div>
                <div className="po-modal-title">Schedule Optimisation</div>
              </div>
              <button className="po-modal-close" onClick={() => setShowPageInfo(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="po-modal-body po-modal-info-body">
              <div className="po-info-section">
                <h4>What this page does</h4>
                <p>Gives production planners a full-week view of the NovaChem Grangemouth manufacturing schedule. You can see what is running on each line, how long each order will take, and where chemical changeovers will create downtime — all in one place. The AI optimiser analyses the schedule and recommends resequencing to cut changeover hours.</p>
              </div>

              <div className="po-info-section">
                <h4>Schedule tab</h4>
                <p>The <strong>Weekly Board</strong> shows a Gantt-style grid — four production lines (rows) across seven days (columns). Each block represents a production order sized proportionally to its production hours within a 24-hour day. Changeover blocks (navy = Rinse-1, amber = Full Hot CIP) appear automatically between consecutive orders. Click any block to see the full order detail. The <strong>Line Schedule</strong> view shows the same week as a grouped table by line and day, with changeover rows inline.</p>
              </div>

              <div className="po-info-section">
                <h4>Changeover Matrix tab</h4>
                <p>Shows the CIP rules that govern how long it takes to switch between products on each line. <strong>Family Matrix</strong> is a 4×4 grid showing changeover type and hours between chemical families. <strong>Product Matrix</strong> shows the same information at SKU level — up to 15 materials, filterable by family — so planners can see the exact cost of every possible product transition.</p>
              </div>

              <div className="po-info-section">
                <h4>Downtime Events tab</h4>
                <p>A reference view of the standard downtime event catalogue per line — the defined durations for Rinse-1 (same-family changeover) and Full Hot CIP Sequence (cross-family). Also shows the full changeover impact log for the selected week: every transition that occurs, its type, and total hours lost to changeovers.</p>
              </div>

              <div className="po-info-section">
                <h4>AI Schedule Optimiser</h4>
                <p>Clicking <strong>Model Optimised Schedule</strong> sends the full week's order sequence, changeover times, and capacity utilisation to Claude. It returns a prioritised set of recommendations — typically order resequencing to group same-family products together and reduce Full Hot CIP events. Results appear inline below the tabs.</p>
              </div>

              <div className="po-info-section">
                <h4>Data sources</h4>
                <ul>
                  <li><strong>sap_production_orders</strong> — SAP order data loaded into the Operations Lakehouse. Includes order ID, material, work centre, planned and delivered quantities, and scheduled/actual dates.</li>
                  <li><strong>run_rates</strong> — Units per hour per material per line. Used to calculate production hours for each order.</li>
                  <li><strong>downtime</strong> — Defined changeover durations (Rinse-1, Full Hot CIP) per production line. Used to calculate changeover blocks.</li>
                </ul>
              </div>

              <div className="po-info-section po-info-section--last">
                <h4>Week navigation</h4>
                <p>Use the <strong>← week label →</strong> controls in the top-right of the page to move between weeks. All tabs — Schedule, Changeover Matrix, and Downtime Events — reflect the selected week's orders.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (() => {
        const { order, hours, family, wc, cfg } = selectedOrder
        const isComplete   = order.ACTUAL_FINISH_DATE && !order.ACTUAL_FINISH_DATE.startsWith('31/12/9999')
        const isInProgress = order.ACTUAL_START_DATE  && !order.ACTUAL_START_DATE.startsWith('31/12/9999') && !isComplete
        const deliveredPct = order.PLANNED_QUANTITY > 0
          ? Math.round((parseFloat(order.DELIVERED_QUANTITY || 0) / parseFloat(order.PLANNED_QUANTITY)) * 100)
          : 0

        const rows = [
          ['Order ID',          order.ORDER_ID],
          ['Work Centre',       wc],
          ['Line',              cfg.label],
          ['Material ID',       order.MATERIAL_ID],
          ['Material',          order.MATERIAL_DESC],
          ['Chemical Family',   family],
          ['Scheduled Start',   order.SCHEDULED_START_DATE],
          ['Actual Start',      (!order.ACTUAL_START_DATE  || order.ACTUAL_START_DATE.startsWith('31/12/9999'))  ? '—' : order.ACTUAL_START_DATE],
          ['Actual Finish',     (!order.ACTUAL_FINISH_DATE || order.ACTUAL_FINISH_DATE.startsWith('31/12/9999')) ? '—' : order.ACTUAL_FINISH_DATE],
          ['Planned Qty',       parseInt(order.PLANNED_QUANTITY  || 0).toLocaleString() + ' units'],
          ['Delivered Qty',     parseInt(order.DELIVERED_QUANTITY || 0).toLocaleString() + ' units'],
          ['Confirmed Qty',     parseInt(order.CONFIRMED_QUANTITY_0_DAY_PRIOR || 0).toLocaleString() + ' units'],
          ['Production Hours',  hours ? `${hours.toFixed(1)} h` : '—'],
        ]

        return (
          <div className="po-modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="po-modal" onClick={e => e.stopPropagation()}>
              <div className="po-modal-header" style={{ borderLeftColor: cfg.color }}>
                <div>
                  <div className="po-modal-order-id">{order.ORDER_ID}</div>
                  <div className="po-modal-title">{order.MATERIAL_DESC}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span className={`po-status ${isComplete ? 'po-status--complete' : isInProgress ? 'po-status--progress' : 'po-status--planned'}`}>
                    {isComplete ? <><CheckCircle size={11}/> Complete</> : isInProgress ? 'In Progress' : 'Planned'}
                  </span>
                  <button className="po-modal-close" onClick={() => setSelectedOrder(null)}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="po-modal-body">
                {/* Progress bar */}
                {(isComplete || isInProgress) && (
                  <div className="po-modal-progress">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span className="po-modal-progress-label">Delivery Progress</span>
                      <span className="po-modal-progress-pct">{deliveredPct}%</span>
                    </div>
                    <div className="po-modal-progress-bar">
                      <div className="po-modal-progress-fill" style={{ width: `${Math.min(deliveredPct, 100)}%` }} />
                    </div>
                  </div>
                )}

                {/* Detail rows */}
                <table className="po-modal-table">
                  <tbody>
                    {rows.map(([label, value]) => (
                      <tr key={label}>
                        <td className="po-modal-row-label">{label}</td>
                        <td className="po-modal-row-value">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
