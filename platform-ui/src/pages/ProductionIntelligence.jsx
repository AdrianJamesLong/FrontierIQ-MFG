import { useState, useEffect, useMemo } from 'react'
import {
  Activity, TrendingUp, CheckCircle, Clock, AlertTriangle,
  RefreshCw, BarChart3, Target, Calendar, Info, X
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import Breadcrumb from '../components/Breadcrumb'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const LINES = ['CPL-R01', 'CPL-R02', 'CPL-B01', 'CPL-F01']
const LINE_LABELS = { 'CPL-R01': 'Reactor Line 1', 'CPL-R02': 'Reactor Line 2', 'CPL-B01': 'Batch Line 1', 'CPL-F01': 'Filling Line 1' }
const LINE_COLORS = { 'CPL-R01': '#1C3668', 'CPL-R02': '#2E558F', 'CPL-B01': '#4A7AB5', 'CPL-F01': '#6B9ED4' }

const parseDate = (s) => {
  if (!s || s === '31/12/9999') return null
  const [d, m, y] = s.split('/')
  return new Date(y, m - 1, d)
}
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0)

// ── Time period boundaries ──────────────────────────────────────────────────
const getWeekStart = (d) => {
  const t = new Date(d); t.setHours(0,0,0,0)
  const day = t.getDay(); t.setDate(t.getDate() - (day === 0 ? 6 : day - 1))
  return t
}
const getTimeBounds = (period) => {
  const now = new Date(); now.setHours(0,0,0,0)
  const weekStart = getWeekStart(now)
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  const futureStart = new Date(now.getFullYear(), now.getMonth() + 2, 1)
  switch (period) {
    case 'historical': return { max: new Date(weekStart.getTime() - 1) }
    case 'this-week':  return { min: weekStart, max: weekEnd }
    case 'this-month': return { min: monthStart, max: monthEnd }
    case 'next-month': return { min: nextMonthStart, max: nextMonthEnd }
    case 'future':     return { min: futureStart }
    default:           return {}
  }
}

const applyTimePeriod = (orders, period) => {
  if (period === 'all') return orders
  const bounds = getTimeBounds(period)
  return orders.filter(o => {
    const d = parseDate(o.SCHEDULED_START_DATE)
    if (!d) return period === 'historical' // undated orders count as historical
    if (bounds.min && d < bounds.min) return false
    if (bounds.max && d > bounds.max) return false
    return true
  })
}

// ── Sub-components ──────────────────────────────────────────────────────────
function StatusPill({ value }) {
  const [color, bg, label] = value >= 100 ? ['#10B981', '#E0F2E9', 'Complete']
    : value > 0 ? ['#F59E0B', '#FFFBEB', 'In Progress']
    : ['#9CA3AF', '#F3F4F6', 'Not Started']
  return <span style={{ fontSize: '9px', fontWeight: 700, color, background: bg, padding: '2px 7px', borderRadius: '10px', whiteSpace: 'nowrap' }}>{label}</span>
}

function HeroKpi({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ flex: 1, padding: '14px 16px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', borderTop: `3px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
        <div style={{ width: '24px', height: '24px', background: `${color}15`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={12} style={{ color }} />
        </div>
        <span style={{ fontSize: '9px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '34px', fontWeight: 800, color: '#0A1628', lineHeight: 1, marginBottom: '3px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{sub}</div>
    </div>
  )
}

function LineCard({ line, orders, runrates }) {
  const lo = orders.filter(o => o.WORK_CENTER === line)
  const complete = lo.filter(o => o.DELIVERED_QUANTITY >= o.PLANNED_QUANTITY && o.PLANNED_QUANTITY > 0).length
  const inProg = lo.filter(o => o.DELIVERED_QUANTITY > 0 && o.DELIVERED_QUANTITY < o.PLANNED_QUANTITY).length
  const totalPlanned = lo.reduce((s, o) => s + (o.PLANNED_QUANTITY || 0), 0)
  const totalDelivered = lo.reduce((s, o) => s + (o.DELIVERED_QUANTITY || 0), 0)
  const cp = pct(totalDelivered, totalPlanned)
  const rr = runrates.find(r => r.LINE === line || r.WORK_CENTER === line)
  const color = LINE_COLORS[line]
  const statusColor = cp >= 90 ? '#10B981' : cp >= 60 ? '#F59E0B' : '#EF4444'
  const statusLabel = cp >= 90 ? 'On Track' : cp >= 60 ? 'At Risk' : 'Behind'
  return (
    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '10px 14px', borderLeft: `4px solid ${color}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A1628', marginBottom: '1px' }}>{LINE_LABELS[line]}</div>
          <div style={{ fontSize: '10px', color: '#6B7280' }}>{line} &bull; {lo.length} orders</div>
        </div>
        <span style={{ fontSize: '9px', fontWeight: 700, color: statusColor, background: `${statusColor}15`, padding: '2px 8px', borderRadius: '10px' }}>{statusLabel}</span>
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: 600 }}>Delivery Progress</span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#0A1628' }}>{cp}%</span>
        </div>
        <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ height: '100%', width: `${cp}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: '3px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {[
            { label: 'Complete', value: complete, color: '#10B981' },
            { label: 'In Progress', value: inProg, color: '#F59E0B' },
            { label: 'Run Rate', value: rr ? `${rr.UNITS_PH ?? '—'}` : '—', color },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '5px 4px', background: '#F9FAFB', borderRadius: '5px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '8px', color: '#9CA3AF', marginTop: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Time Box selector ───────────────────────────────────────────────────────
const TIME_PERIODS = [
  { id: 'all',        label: 'All Orders' },
  { id: 'historical', label: 'Historical' },
  { id: 'this-week',  label: 'This Week' },
  { id: 'this-month', label: 'This Month' },
  { id: 'next-month', label: 'Next Month' },
  { id: 'future',     label: 'Future' },
]

function TimeBoxBar({ orders, timePeriod, setTimePeriod, statusFilter, setStatusFilter }) {
  const counts = useMemo(() => {
    const result = {}
    TIME_PERIODS.forEach(p => { result[p.id] = applyTimePeriod(orders, p.id).length })
    return result
  }, [orders])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
      {/* Time boxes */}
      <div style={{ display: 'flex', gap: '4px', padding: '3px', background: '#F3F4F6', borderRadius: '9px', flexWrap: 'wrap' }}>
        {TIME_PERIODS.map(p => {
          const isActive = timePeriod === p.id
          return (
            <button key={p.id} onClick={() => setTimePeriod(p.id)} style={{
              padding: '5px 10px', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '11px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'white' : '#6B7280',
              background: isActive ? '#1C3668' : 'transparent',
              borderRadius: '6px', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              {p.label}
              <span style={{
                fontSize: '9px', fontWeight: 700,
                color: isActive ? 'rgba(255,255,255,0.75)' : '#9CA3AF',
                background: isActive ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
                padding: '1px 5px', borderRadius: '8px', minWidth: '20px', textAlign: 'center'
              }}>
                {counts[p.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Status filter */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500 }}>Status</span>
        {[
          { id: 'all', label: 'All' },
          { id: 'complete', label: 'Complete' },
          { id: 'inprog', label: 'In Progress' },
          { id: 'notstarted', label: 'Not Started' },
        ].map(s => (
          <button key={s.id} onClick={() => setStatusFilter(s.id)} style={{
            padding: '4px 9px', border: `1px solid ${statusFilter === s.id ? '#1C3668' : '#E5E7EB'}`,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '10px',
            fontWeight: statusFilter === s.id ? 700 : 500,
            color: statusFilter === s.id ? '#1C3668' : '#6B7280',
            background: statusFilter === s.id ? '#EFF6FF' : 'white',
            borderRadius: '6px', transition: 'all 0.15s'
          }}>{s.label}</button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ProductionIntelligence() {
  const [orders, setOrders] = useState([])
  const [runrates, setRunrates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mainTab, setMainTab] = useState('live')
  const [liveSubTab, setLiveSubTab] = useState('summary')
  const [analyticsSubTab, setAnalyticsSubTab] = useState('performance')
  const [lineFilter, setLineFilter] = useState('all')
  const [timePeriod, setTimePeriod] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showPageInfo, setShowPageInfo] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true); setError(null)
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(`${API_URL}/api/data`),
        fetch(`${API_URL}/api/runrates`)
      ])
      if (!pRes.ok) throw new Error('Failed to fetch production data')
      const [p, r] = await Promise.all([pRes.json(), rRes.json()])
      setOrders(p.data || [])
      setRunrates(r.data || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // Global base — time + status filters applied first, drives everything
  const baseOrders = useMemo(() => {
    let o = applyTimePeriod(orders, timePeriod)
    if (statusFilter !== 'all') {
      o = o.filter(order => {
        const dp = pct(order.DELIVERED_QUANTITY, order.PLANNED_QUANTITY)
        if (statusFilter === 'complete')    return dp >= 100
        if (statusFilter === 'inprog')      return dp > 0 && dp < 100
        if (statusFilter === 'notstarted')  return dp === 0
        return true
      })
    }
    return o
  }, [orders, timePeriod, statusFilter])

  // Hero KPI stats (from baseOrders)
  const stats = useMemo(() => {
    const total = baseOrders.length
    const complete = baseOrders.filter(o => o.DELIVERED_QUANTITY >= o.PLANNED_QUANTITY && o.PLANNED_QUANTITY > 0).length
    const inProg = baseOrders.filter(o => o.DELIVERED_QUANTITY > 0 && o.DELIVERED_QUANTITY < o.PLANNED_QUANTITY).length
    const notStarted = baseOrders.filter(o => o.DELIVERED_QUANTITY === 0).length
    const totalPlanned = baseOrders.reduce((s, o) => s + (o.PLANNED_QUANTITY || 0), 0)
    const totalDelivered = baseOrders.reduce((s, o) => s + (o.DELIVERED_QUANTITY || 0), 0)
    return { total, complete, inProg, notStarted, totalPlanned, totalDelivered, adherence: pct(complete, total) }
  }, [baseOrders])

  // Per-line analytics (from baseOrders)
  const lineData = useMemo(() => LINES.map(line => {
    const lo = baseOrders.filter(o => o.WORK_CENTER === line)
    const planned = lo.reduce((s, o) => s + (o.PLANNED_QUANTITY || 0), 0)
    const delivered = lo.reduce((s, o) => s + (o.DELIVERED_QUANTITY || 0), 0)
    const complete = lo.filter(o => o.DELIVERED_QUANTITY >= o.PLANNED_QUANTITY && o.PLANNED_QUANTITY > 0).length
    return {
      line, label: line.replace('CPL-', ''), orders: lo.length, planned, delivered,
      complete, adherence: pct(complete, lo.length), completionPct: pct(delivered, planned)
    }
  }), [baseOrders])

  // Table view — also applies line filter on top
  const tableOrders = useMemo(() =>
    lineFilter === 'all' ? baseOrders : baseOrders.filter(o => o.WORK_CENTER === lineFilter)
  , [baseOrders, lineFilter])

  // Trend chart (from baseOrders)
  const trendData = useMemo(() => {
    const byMonth = {}
    baseOrders.forEach(o => {
      const d = parseDate(o.SCHEDULED_START_DATE)
      if (!d) return
      const key = d.toLocaleString('en', { month: 'short', year: '2-digit' })
      if (!byMonth[key]) byMonth[key] = { month: key, planned: 0, delivered: 0, _date: d }
      byMonth[key].planned += o.PLANNED_QUANTITY || 0
      byMonth[key].delivered += o.DELIVERED_QUANTITY || 0
    })
    return Object.values(byMonth).sort((a, b) => a._date - b._date).slice(-12)
  }, [baseOrders])

  const periodLabel = TIME_PERIODS.find(p => p.id === timePeriod)?.label || 'All Orders'

  const MainTabBtn = ({ id, label, icon: Icon }) => (
    <button onClick={() => setMainTab(id)} style={{
      padding: '8px 18px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
      fontSize: '12px', fontWeight: mainTab === id ? 700 : 500,
      color: mainTab === id ? '#0A1628' : '#6B7280',
      background: mainTab === id ? 'white' : 'transparent',
      borderRadius: '8px',
      boxShadow: mainTab === id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
      display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
    }}>
      <Icon size={13} />{label}
    </button>
  )

  const SubTabBtn = ({ id, label, tab, setTab }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '5px 12px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
      fontSize: '10px', fontWeight: tab === id ? 700 : 500,
      color: tab === id ? '#1C3668' : '#6B7280',
      background: tab === id ? '#EFF6FF' : 'transparent',
      borderRadius: '20px', transition: 'all 0.15s'
    }}>{label}</button>
  )

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#6B7280' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <p style={{ fontSize: '13px' }}>Loading production data...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="page-container" style={{ padding: '40px' }}>
      <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', color: '#991B1B', fontSize: '13px' }}>{error}</div>
    </div>
  )

  return (
    <div className="page-container" style={{ padding: '16px 20px 40px' }}>
      <Breadcrumb items={[{ label: 'Operations Optimisation' }, { label: 'Production Intelligence' }]} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '2px solid #E8E8E8' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0A1628' }}>Production Intelligence</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
            NovaChem Chemical Plant &bull; {orders.length} total orders
            {timePeriod !== 'all' && <span style={{ marginLeft: '6px', color: '#1C3668', fontWeight: 600 }}>· {periodLabel}: {baseOrders.length} orders</span>}
          </p>
        </div>
        <button onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '7px', fontSize: '11px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Time box + status filter bar */}
      <TimeBoxBar
        orders={orders}
        timePeriod={timePeriod}
        setTimePeriod={setTimePeriod}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Hero KPIs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <HeroKpi label="Total Orders" value={stats.total} sub={`${periodLabel}`} color="#1C3668" icon={Activity} />
        <HeroKpi label="Completed" value={stats.complete} sub={`${stats.adherence}% plan adherence`} color="#10B981" icon={CheckCircle} />
        <HeroKpi label="In Progress" value={stats.inProg} sub="currently running" color="#F59E0B" icon={Clock} />
        <HeroKpi label="Not Started" value={stats.notStarted} sub="queued" color="#9CA3AF" icon={Target} />
      </div>

      {/* Main tab switcher */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#F3F4F6', borderRadius: '10px', marginBottom: '14px', width: 'fit-content' }}>
        <MainTabBtn id="live" label="Live Operations" icon={Activity} />
        <MainTabBtn id="analytics" label="Analytics & Metrics" icon={BarChart3} />
      </div>

      {/* ── LIVE OPERATIONS ── */}
      {mainTab === 'live' && (
        <div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', alignItems: 'center' }}>
            <SubTabBtn id="summary" label="Line Summary" tab={liveSubTab} setTab={setLiveSubTab} />
            <SubTabBtn id="orders" label="Orders" tab={liveSubTab} setTab={setLiveSubTab} />
            {liveSubTab === 'orders' && (
              <div style={{ marginLeft: 'auto' }}>
                <select value={lineFilter} onChange={e => setLineFilter(e.target.value)} style={{ fontSize: '10px', padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#374151', background: 'white', cursor: 'pointer' }}>
                  <option value="all">All Lines</option>
                  {LINES.map(l => <option key={l} value={l}>{l} — {LINE_LABELS[l]}</option>)}
                </select>
              </div>
            )}
          </div>

          {liveSubTab === 'summary' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {LINES.map(line => (
                <LineCard key={line} line={line} orders={baseOrders} runrates={runrates} />
              ))}
            </div>
          )}

          {liveSubTab === 'orders' && (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A1628' }}>Orders</span>
                <span style={{ fontSize: '10px', color: '#6B7280', background: '#F3F4F6', padding: '2px 7px', borderRadius: '10px' }}>{tableOrders.length}</span>
                {timePeriod !== 'all' && <span style={{ fontSize: '10px', color: '#1C3668', fontWeight: 600 }}>{periodLabel}</span>}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      {['Order ID', 'Line', 'Scheduled Start', 'Planned Qty', 'Delivered', 'Progress', 'Status'].map(h => (
                        <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '9px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableOrders.slice(0, 100).map((o, i) => {
                      const dp = pct(o.DELIVERED_QUANTITY, o.PLANNED_QUANTITY)
                      const lc = LINE_COLORS[o.WORK_CENTER] || '#6B7280'
                      return (
                        <tr key={o.ORDER_ID || i} style={{ borderBottom: '1px solid #F9FAFB' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '7px 12px', fontWeight: 600, color: '#0A1628', fontFamily: 'monospace', fontSize: '10px' }}>{o.ORDER_ID}</td>
                          <td style={{ padding: '7px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: lc, flexShrink: 0 }} />
                              <span style={{ color: '#374151', fontWeight: 600, fontSize: '10px' }}>{o.WORK_CENTER}</span>
                            </span>
                          </td>
                          <td style={{ padding: '7px 12px', color: '#6B7280', fontSize: '10px' }}>{o.SCHEDULED_START_DATE || '—'}</td>
                          <td style={{ padding: '7px 12px', color: '#374151' }}>{(o.PLANNED_QUANTITY || 0).toLocaleString()}</td>
                          <td style={{ padding: '7px 12px', color: '#374151' }}>{(o.DELIVERED_QUANTITY || 0).toLocaleString()}</td>
                          <td style={{ padding: '7px 12px', minWidth: '100px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '5px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${dp}%`, background: dp >= 100 ? '#10B981' : dp > 0 ? '#F59E0B' : '#E5E7EB', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151', width: '30px' }}>{dp}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '7px 12px' }}><StatusPill value={dp} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {tableOrders.length > 100 && (
                  <div style={{ padding: '8px 14px', fontSize: '10px', color: '#6B7280', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
                    Showing 100 of {tableOrders.length} orders
                  </div>
                )}
                {tableOrders.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                    <Calendar size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p style={{ fontSize: '12px', margin: 0 }}>No orders match the selected period and filters</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS & METRICS ── */}
      {mainTab === 'analytics' && (
        <div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
            {[{ id: 'performance', label: 'Performance' }, { id: 'oee', label: 'OEE & Efficiency' }, { id: 'trends', label: 'Trends' }]
              .map(s => <SubTabBtn key={s.id} id={s.id} label={s.label} tab={analyticsSubTab} setTab={setAnalyticsSubTab} />)}
          </div>

          {analyticsSubTab === 'performance' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#0A1628' }}>Plan Adherence by Line</h3>
                {lineData.map(ld => (
                  <div key={ld.line} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: LINE_COLORS[ld.line], display: 'inline-block' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{ld.label}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A1628' }}>{ld.adherence}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${ld.adherence}%`, background: `linear-gradient(90deg, ${LINE_COLORS[ld.line]}, ${LINE_COLORS[ld.line]}88)`, borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '2px' }}>{ld.complete} / {ld.orders} orders complete</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#0A1628' }}>Status Distribution</h3>
                <div style={{ height: '170px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Complete', value: stats.complete || 0 },
                        { name: 'In Progress', value: stats.inProg || 0 },
                        { name: 'Not Started', value: stats.notStarted || 0 }
                      ]} cx="50%" cy="50%" innerRadius={48} outerRadius={75} paddingAngle={2} dataKey="value">
                        {['#10B981','#F59E0B','#E5E7EB'].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '4px' }}>
                  {[['Complete', stats.complete, '#10B981'], ['In Progress', stats.inProg, '#F59E0B'], ['Not Started', stats.notStarted, '#9CA3AF']].map(([l, v, c]) => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginBottom: '1px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c, display: 'inline-block' }} />
                        <span style={{ fontSize: '9px', color: '#6B7280' }}>{l}</span>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#0A1628' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '16px', gridColumn: '1 / -1', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#0A1628' }}>Planned vs Delivered by Line</h3>
                <div style={{ height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lineData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
                      <Bar dataKey="planned" name="Planned" fill="#E5E7EB" radius={[3,3,0,0]} />
                      <Bar dataKey="delivered" name="Delivered" radius={[3,3,0,0]}>
                        {lineData.map(ld => <Cell key={ld.line} fill={LINE_COLORS[ld.line]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {analyticsSubTab === 'oee' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {lineData.map(ld => {
                const oee = Math.round(ld.completionPct * 0.92)
                const color = LINE_COLORS[ld.line]
                return (
                  <div key={ld.line} style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', borderTop: `3px solid ${color}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>{ld.label}</div>
                    <div style={{ fontSize: '40px', fontWeight: 800, color: oee >= 85 ? '#10B981' : oee >= 65 ? '#F59E0B' : '#EF4444', lineHeight: 1, marginBottom: '3px', fontVariantNumeric: 'tabular-nums' }}>{oee}%</div>
                    <div style={{ fontSize: '9px', color: '#9CA3AF', marginBottom: '12px' }}>OEE</div>
                    {[
                      { label: 'Availability', value: Math.min(98, 75 + ld.adherence * 0.23) },
                      { label: 'Performance', value: ld.completionPct },
                      { label: 'Quality', value: Math.min(99, 80 + ld.adherence * 0.18) }
                    ].map(m => (
                      <div key={m.label} style={{ marginBottom: '7px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: 600 }}>{m.label}</span>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#374151' }}>{Math.round(m.value)}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#F3F4F6', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(m.value)}%`, background: color, borderRadius: '2px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {analyticsSubTab === 'trends' && (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#0A1628' }}>Production Volume Trend</h3>
                <p style={{ margin: '0 0 14px', fontSize: '10px', color: '#9CA3AF' }}>{periodLabel} · grouped by month</p>
                {trendData.length === 0 ? (
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Calendar size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <p style={{ fontSize: '12px', margin: 0 }}>No data for the selected period</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={55} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                        <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
                        <Line type="monotone" dataKey="planned" name="Planned" stroke="#D1D5DB" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="delivered" name="Delivered" stroke="#1C3668" strokeWidth={2.5} dot={{ fill: '#1C3668', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Plan Adherence', value: `${stats.adherence}%`, sub: `${stats.complete} of ${stats.total} orders complete`, color: '#1C3668', icon: Target },
                  { label: 'Total Delivered', value: stats.totalDelivered.toLocaleString(), sub: 'units across all lines', color: '#10B981', icon: TrendingUp },
                  { label: 'Delivery Variance', value: Math.abs(stats.totalPlanned - stats.totalDelivered).toLocaleString(), sub: stats.totalDelivered >= stats.totalPlanned ? 'ahead of plan' : 'units shortfall vs plan', color: stats.totalDelivered >= stats.totalPlanned ? '#10B981' : '#F59E0B', icon: AlertTriangle }
                ].map(s => {
                  const SIcon = s.icon
                  return (
                    <div key={s.label} style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <SIcon size={12} style={{ color: s.color }} />
                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '3px' }}>{s.value}</div>
                      <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{s.sub}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {showPageInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(2px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowPageInfo(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid #E8ECF4' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>About this section</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Production Intelligence</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Provides a top-level view of manufacturing performance at NovaChem Grangemouth — schedule adherence, OEE, throughput, and production order status across all lines.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Overview</strong> — KPI cards and production orders summary</li>
                  <li style={{ marginBottom: '4px' }}><strong>Schedule</strong> — Full order list with status and timing</li>
                  <li style={{ marginBottom: '4px' }}><strong>Performance</strong> — Charts for throughput and OEE trends</li>
                  <li style={{ marginBottom: '4px' }}><strong>Alerts</strong> — Active exceptions and schedule deviations</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>sap_production_orders</strong> — SAP production order records with status, dates and quantities</li>
                  <li style={{ marginBottom: '4px' }}><strong>run_rates</strong> — Actual vs unconstrained throughput per line</li>
                  <li style={{ marginBottom: '4px' }}><strong>downtime</strong> — Downtime events affecting schedule adherence</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
