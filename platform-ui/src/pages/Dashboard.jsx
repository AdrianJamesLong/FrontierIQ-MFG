import { useState, useEffect } from 'react'
import { Activity, AlertCircle, CheckCircle, Clock, Calendar, Target, TrendingUp, Gauge, Package, Truck, Factory, Users, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import Breadcrumb from '../components/Breadcrumb'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const COLORS = ['#0A1628', '#152B55', '#1C3668', '#FF4D4F', '#FFE5E5', '#6B6B6B', '#9B9B9B', '#C0C0C0']

// Map WORK_CENTER to production lines
const getProductionLine = (workCenter) => {
  if (!workCenter) return 'Unknown'
  const mapping = {
    'CPL-R01': 'Reactor Line 1',
    'CPL-R02': 'Reactor Line 2',
    'CPL-B01': 'Batch Line 1',
    'CPL-F01': 'Filling Line 1'
  }
  return mapping[workCenter] || workCenter
}

function Dashboard() {
  const [data, setData] = useState([])
  const [runratesData, setRunratesData] = useState([])
  const [downtimeData, setDowntimeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedLine, setSelectedLine] = useState('all')
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [prodRes, rrRes, dtRes] = await Promise.all([
        fetch(`${API_URL}/api/data`),
        fetch(`${API_URL}/api/runrates`),
        fetch(`${API_URL}/api/downtime`),
      ])
      if (!prodRes.ok) {
        const errorData = await prodRes.json()
        throw new Error(errorData.detail || 'Server error')
      }
      const [prodResult, rrResult, dtResult] = await Promise.all([
        prodRes.json(), rrRes.json(), dtRes.json()
      ])
      const orders = prodResult.data || []
      setData(orders)
      setRunratesData(rrResult.data || [])
      setDowntimeData(dtResult.data || [])

      // Auto-detect date range from the actual data so static datasets always show fully
      const validDates = orders
        .map(o => parseDate(o.SCHEDULED_START_DATE))
        .filter(Boolean)
      if (validDates.length > 0) {
        const minMs = Math.min(...validDates.map(d => d.getTime()))
        const maxMs = Math.max(...validDates.map(d => d.getTime()))
        setStartDate(new Date(minMs).toISOString().split('T')[0])
        setEndDate(new Date(maxMs).toISOString().split('T')[0])
      }
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === '31/12/9999') return null
    const parts = dateStr.split('/')
    return new Date(parts[2], parts[1] - 1, parts[0])
  }

  const filteredData = data.filter(order => {
    const orderDate = parseDate(order.SCHEDULED_START_DATE)
    // Include orders even if date is null/invalid for complete data view

    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    const inDateRange = !orderDate || ((!start || orderDate >= start) && (!end || orderDate <= end))
    const inLineFilter = selectedLine === 'all' || getProductionLine(order.WORK_CENTER) === selectedLine

    return inDateRange && inLineFilter
  })

  const calculateStats = () => {
    const totalOrders = filteredData.length
    
    // Completed: DELIVERED_QUANTITY >= PLANNED_QUANTITY
    const completedOrders = filteredData.filter(
      order => order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY
    ).length
    
    // In Progress: delivered > 0 AND delivered < planned (unchanged)
    const inProgress = filteredData.filter(
      order => order.DELIVERED_QUANTITY > 0 &&
               order.DELIVERED_QUANTITY < order.PLANNED_QUANTITY
    ).length
    
    // Pending: Not completed and not in progress and has some activity
    const pending = filteredData.filter(
      order => order.DELIVERED_QUANTITY < order.PLANNED_QUANTITY &&
               order.DELIVERED_QUANTITY === 0 &&
               (order.ACTUAL_START_DATE && order.ACTUAL_START_DATE !== '31/12/9999')
    ).length
    
    // Not Started: delivered = 0 AND no actual start date
    const notStarted = filteredData.filter(
      order => order.DELIVERED_QUANTITY === 0 &&
               (!order.ACTUAL_START_DATE || order.ACTUAL_START_DATE === '31/12/9999')
    ).length

    const totalPlanned = filteredData.reduce((sum, order) => sum + (order.PLANNED_QUANTITY || 0), 0)
    const totalDelivered = filteredData.reduce((sum, order) => sum + (order.DELIVERED_QUANTITY || 0), 0)
    const totalChanges = filteredData.reduce((sum, order) =>
      sum + (order.NUMBER_OF_CHANGES_TO_ORDER_QUANTITY || 0) + (order.NUMBER_OF_CHANGES_TO_SCHEDULED_START_DATE || 0), 0)

    const avgOrderSize = totalOrders > 0 ? totalPlanned / totalOrders : 0
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    const utilizationRate = totalPlanned > 0 ? (totalDelivered / totalPlanned) * 100 : 0
    const deliveryVariance = totalPlanned - totalDelivered
    const avgChangesPerOrder = totalOrders > 0 ? totalChanges / totalOrders : 0

    return {
      totalOrders, completedOrders, inProgress, pending, notStarted,
      totalPlanned, totalDelivered, totalChanges, avgOrderSize,
      completionRate, utilizationRate, deliveryVariance, avgChangesPerOrder
    }
  }

  const calculateOEE = () => {
    if (filteredData.length === 0) return { oee: 0, availability: 0, performance: 0, quality: 0 }

    const extractLineNumber = (wc) => {
      if (!wc) return null
      const match = wc.match(/\d+$/)
      return match ? parseInt(match[0]) : null
    }

    // Build downtime map: line number → total planned downtime hours
    const downtimeMap = {}
    downtimeData.forEach(dt => {
      const lineNum = parseInt(dt.Line)
      if (!isNaN(lineNum)) {
        downtimeMap[lineNum] = (downtimeMap[lineNum] || 0) + parseFloat(dt.Duration || 0) / 60
      }
    })

    let totalActualTime = 0
    let totalDowntime = 0
    let totalPlanned = 0
    let totalDelivered = 0
    const seenLines = new Set()

    filteredData.forEach(order => {
      const lineNum = extractLineNumber(order.WORK_CENTER)
      totalPlanned += order.PLANNED_QUANTITY || 0
      totalDelivered += order.DELIVERED_QUANTITY || 0

      // Actual production time: scheduled start → actual finish (where both are valid)
      const start = parseDate(order.SCHEDULED_START_DATE)
      const finish = parseDate(order.ACTUAL_FINISH_DATE)
      if (start && finish) {
        const hours = (finish - start) / (1000 * 60 * 60)
        if (hours > 0 && hours < 168) totalActualTime += hours
      }

      // Accumulate planned downtime per unique line
      if (lineNum && !seenLines.has(lineNum) && downtimeMap[lineNum]) {
        seenLines.add(lineNum)
        totalDowntime += downtimeMap[lineNum]
      }
    })

    const totalPlannedTime = totalActualTime + totalDowntime
    const availability = totalPlannedTime > 0
      ? Math.min((totalActualTime / totalPlannedTime) * 100, 100)
      : 100

    const performance = totalPlanned > 0
      ? Math.min((totalDelivered / totalPlanned) * 100, 100)
      : 0

    const completedOrders = filteredData.filter(o => o.DELIVERED_QUANTITY >= o.PLANNED_QUANTITY).length
    const quality = filteredData.length > 0
      ? (completedOrders / filteredData.length) * 100
      : 0

    const oee = (availability * performance * quality) / 10000

    return { oee, availability, performance, quality }
  }

  const calculatePlanAdherence = () => {
    const completedOrders = filteredData.filter(
      order => order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY
    )

    if (completedOrders.length === 0) return { adherence: 0, onTime: 0, delayed: 0, early: 0, avgDelay: 0 }

    let onTime = 0
    let delayed = 0
    let early = 0
    let totalDelayDays = 0

    completedOrders.forEach(order => {
      const scheduled = parseDate(order.SCHEDULED_START_DATE)
      const actual = parseDate(order.ACTUAL_START_DATE)

      if (!scheduled || !actual) return

      const diffDays = Math.floor((actual - scheduled) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) onTime++
      else if (diffDays > 0) {
        delayed++
        totalDelayDays += diffDays
      }
      else early++
    })

    const adherence = completedOrders.length > 0 ? (onTime / completedOrders.length) * 100 : 0
    const avgDelay = delayed > 0 ? totalDelayDays / delayed : 0

    return { adherence, onTime, delayed, early, avgDelay }
  }

  const getProductionByLine = () => {
    const lineData = {}

    filteredData.forEach(order => {
      const line = getProductionLine(order.WORK_CENTER)
      const workCenter = order.WORK_CENTER || ''
      const displayName = `${line} (${workCenter})`

      if (!lineData[line]) {
        lineData[line] = {
          name: displayName,
          planned: 0,
          delivered: 0,
          orders: 0,
          completed: 0,
          inProgress: 0,
          efficiency: 0
        }
      }
      lineData[line].planned += order.PLANNED_QUANTITY
      lineData[line].delivered += order.DELIVERED_QUANTITY
      lineData[line].orders += 1

      if (order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY) {
        lineData[line].completed += 1
      } else if (order.DELIVERED_QUANTITY > 0 &&
                 order.DELIVERED_QUANTITY < order.PLANNED_QUANTITY) {
        lineData[line].inProgress += 1
      }
    })

    return Object.values(lineData).map(line => ({
      ...line,
      efficiency: line.planned > 0 ? (line.delivered / line.planned) * 100 : 0
    })).sort((a, b) => b.delivered - a.delivered)
  }

  const getOEEByLine = () => {
    const extractLineNumber = (wc) => {
      if (!wc) return null
      const match = wc.match(/\d+$/)
      return match ? parseInt(match[0]) : null
    }

    const downtimeMap = {}
    downtimeData.forEach(dt => {
      const lineNum = parseInt(dt.Line)
      if (!isNaN(lineNum)) {
        downtimeMap[lineNum] = (downtimeMap[lineNum] || 0) + parseFloat(dt.Duration || 0) / 60
      }
    })

    const lineStats = {}
    filteredData.forEach(order => {
      const line = getProductionLine(order.WORK_CENTER)
      const lineNum = extractLineNumber(order.WORK_CENTER)
      const displayName = `${line} (${order.WORK_CENTER || ''})`
      if (!lineStats[line]) {
        lineStats[line] = { name: displayName, lineNum, actualTime: 0, planned: 0, delivered: 0, completed: 0, total: 0 }
      }
      lineStats[line].total++
      lineStats[line].planned += order.PLANNED_QUANTITY || 0
      lineStats[line].delivered += order.DELIVERED_QUANTITY || 0
      if (order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY) lineStats[line].completed++
      const start = parseDate(order.SCHEDULED_START_DATE)
      const finish = parseDate(order.ACTUAL_FINISH_DATE)
      if (start && finish) {
        const hours = (finish - start) / (1000 * 60 * 60)
        if (hours > 0 && hours < 168) lineStats[line].actualTime += hours
      }
    })

    return Object.values(lineStats).map(ls => {
      const dt = ls.lineNum ? (downtimeMap[ls.lineNum] || 0) : 0
      const totalPlannedTime = ls.actualTime + dt
      const availability = totalPlannedTime > 0 ? Math.min((ls.actualTime / totalPlannedTime) * 100, 100) : 100
      const performance = ls.planned > 0 ? Math.min((ls.delivered / ls.planned) * 100, 100) : 0
      const quality = ls.total > 0 ? (ls.completed / ls.total) * 100 : 0
      const oee = (availability * performance * quality) / 10000
      return { name: ls.name, oee }
    }).sort((a, b) => b.oee - a.oee)
  }

  const getProductionTrend = () => {
    const dateMap = {}

    filteredData.forEach(order => {
      const date = order.SCHEDULED_START_DATE
      if (date && date !== '31/12/9999') {
        if (!dateMap[date]) {
          dateMap[date] = {
            date,
            planned: 0,
            delivered: 0,
            orders: 0,
            completed: 0,
            inProgress: 0,
            notStarted: 0
          }
        }
        dateMap[date].planned += order.PLANNED_QUANTITY
        dateMap[date].delivered += order.DELIVERED_QUANTITY
        dateMap[date].orders += 1
        
        // Categorize orders by status
        if (order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY) {
          dateMap[date].completed += 1
        } else if (order.DELIVERED_QUANTITY > 0 && order.DELIVERED_QUANTITY < order.PLANNED_QUANTITY) {
          dateMap[date].inProgress += 1
        } else {
          dateMap[date].notStarted += 1
        }
      }
    })

    return Object.values(dateMap).sort((a, b) => {
      const dateA = parseDate(a.date)
      const dateB = parseDate(b.date)
      return dateA - dateB
    })
  }

  const getStatusDistribution = () => {
    const stats = calculateStats()
    return [
      { name: 'Completed', value: stats.completedOrders, color: '#0A1628' },
      { name: 'In Progress', value: stats.inProgress, color: '#1C3668' },
      { name: 'Pending', value: stats.pending, color: '#9B9B9B' },
      { name: 'Not Started', value: stats.notStarted, color: '#C0C0C0' }
    ]
  }

  const getLinePerformanceRadar = () => {
    const lineData = getProductionByLine()
    return lineData.map(line => ({
      line: line.name.substring(0, 10),
      efficiency: line.efficiency,
      completion: line.completed > 0 ? (line.completed / line.orders) * 100 : 0,
      volume: (line.delivered / 10000) * 100
    }))
  }

  const stats = calculateStats()
  const oee = calculateOEE()
  const planAdherence = calculatePlanAdherence()
  const productionByLine = getProductionByLine()
  const oeeByLine = getOEEByLine()
  const productionTrend = getProductionTrend()
  const statusDistribution = getStatusDistribution()
  const linePerformanceRadar = getLinePerformanceRadar()
  const productionLines = ['all', ...new Set(data.map(order => getProductionLine(order.WORK_CENTER)).filter(Boolean))]

  const tabs = [
    { id: 'summary', name: 'Summary' },
    { id: 'oee', name: 'Overall Equipment Effectiveness' },
    { id: 'adherence', name: 'Plan Adherence' },
    { id: 'byline', name: 'Production by Line' },
    { id: 'status', name: 'Order Status Distribution' },
    { id: 'trend', name: 'Production Trend' }
  ]

  return (
    <div className="page-container">
      <Breadcrumb />
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>Production Summary Dashboard</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            Real-time production analytics and key performance indicators
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <Calendar size={16} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                color: '#374151'
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                color: '#374151'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <Activity size={16} style={{ color: '#6b7280' }} />
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              {productionLines.map((line) => (
                <option key={line} value={line}>
                  {line === 'all' ? 'All Production Lines' : line}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '8px 14px',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'white',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <div style={{
            padding: '8px 14px',
            background: '#E0F2E9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0F5132'
          }}>
            {stats.totalOrders} Orders
          </div>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: '8px', padding: '4px', gap: '6px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading production data...</p>
        </div>
      )}

      {error && (
        <div className="error-card">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === 'summary' && (
            <div className="tab-content">
              <div className="stats-grid-large">
                <div className="stat-card stat-total">
                  <div className="stat-icon"><Activity size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Total Orders</p>
                    <p className="stat-value">{stats.totalOrders}</p>
                  </div>
                </div>
                <div className="stat-card stat-completed">
                  <div className="stat-icon"><CheckCircle size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Completed</p>
                    <p className="stat-value">{stats.completedOrders}</p>
                  </div>
                </div>
                <div className="stat-card stat-progress">
                  <div className="stat-icon"><Clock size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">In Progress</p>
                    <p className="stat-value">{stats.inProgress}</p>
                  </div>
                </div>
                <div className="stat-card stat-pending">
                  <div className="stat-icon"><AlertCircle size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Pending</p>
                    <p className="stat-value">{stats.pending}</p>
                  </div>
                </div>
                <div className="stat-card stat-future">
                  <div className="stat-icon"><Calendar size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Not Started</p>
                    <p className="stat-value">{stats.notStarted}</p>
                  </div>
                </div>
                <div className="stat-card stat-total">
                  <div className="stat-icon"><Package size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Total Planned</p>
                    <p className="stat-value">{stats.totalPlanned.toLocaleString()}</p>
                  </div>
                </div>
                <div className="stat-card stat-completed">
                  <div className="stat-icon"><Truck size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Total Delivered</p>
                    <p className="stat-value">{stats.totalDelivered.toLocaleString()}</p>
                  </div>
                </div>
                <div className="stat-card stat-progress">
                  <div className="stat-icon"><Target size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Completion Rate</p>
                    <p className="stat-value">{stats.completionRate.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="stat-card stat-pending">
                  <div className="stat-icon"><Gauge size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Utilization</p>
                    <p className="stat-value">{stats.utilizationRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="charts-grid-summary">
                <div className="chart-card-summary">
                  <h3 className="chart-title">Quick Overview</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={[
                      { name: 'Planned', value: stats.totalPlanned },
                      { name: 'Delivered', value: stats.totalDelivered },
                      { name: 'Variance', value: Math.abs(stats.totalPlanned - stats.totalDelivered) }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="name" stroke="#6B6B6B" style={{ fontSize: '13px', fontWeight: 500 }} />
                      <YAxis stroke="#6B6B6B" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '8px', fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        formatter={(value) => value.toLocaleString()}
                      />
                      <Bar dataKey="value" fill="#1C3668" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card-summary">
                  <h3 className="chart-title">Order Status Split</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={85}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => value.toLocaleString()}
                        contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '8px', fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="metric-cards-grid">
                <div className="metric-summary-card">
                  <h4>Avg Order Size</h4>
                  <p className="metric-big-value">{stats.avgOrderSize.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  <p className="metric-label">units per order</p>
                </div>
                <div className="metric-summary-card">
                  <h4>Total Changes</h4>
                  <p className="metric-big-value">{stats.totalChanges.toLocaleString()}</p>
                  <p className="metric-label">schedule modifications</p>
                </div>
                <div className="metric-summary-card">
                  <h4>Production Lines</h4>
                  <p className="metric-big-value">{productionByLine.length}</p>
                  <p className="metric-label">active lines</p>
                </div>
                <div className="metric-summary-card">
                  <h4>Overall OEE</h4>
                  <p className="metric-big-value">{oee.oee.toFixed(1)}%</p>
                  <p className="metric-label">equipment effectiveness</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'oee' && (
            <div className="tab-content">
              <div className="oee-three-column-layout">
                <div className="oee-left-panel">
                  <div className="oee-main-score">
                    <div className="kpi-header">
                      <Gauge size={22} className="kpi-icon" />
                      <h3>Overall Equipment Effectiveness</h3>
                    </div>
                    <div className="oee-value-compact">{oee.oee.toFixed(1)}%</div>
                    <p className="oee-formula">OEE = (Availability × Performance × Quality) ÷ 10,000</p>
                    <p className="oee-note" style={{ marginTop: '14px', fontSize: '13px', color: '#6B6B6B' }}>
                      Based on {filteredData.length} orders ({filteredData.filter(o => o.DELIVERED_QUANTITY >= o.PLANNED_QUANTITY).length} completed)
                    </p>
                  </div>

                  <div className="oee-breakdown-grid-vertical">
                    <div className="oee-component-card">
                      <div className="oee-circle">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#F5F5F5" strokeWidth="8" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#1C3668" strokeWidth="8"
                            strokeDasharray={`${oee.availability * 2.827} 282.7`}
                            transform="rotate(-90 50 50)" />
                        </svg>
                        <div className="oee-circle-text">{oee.availability.toFixed(1)}%</div>
                      </div>
                      <div className="oee-component-card-content">
                        <h4>Availability</h4>
                        <p className="oee-component-desc">Uptime excl. planned downtime (CIP/changeover)</p>
                      </div>
                    </div>

                    <div className="oee-component-card">
                      <div className="oee-circle">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#F5F5F5" strokeWidth="8" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#1C3668" strokeWidth="8"
                            strokeDasharray={`${oee.performance * 2.827} 282.7`}
                            transform="rotate(-90 50 50)" />
                        </svg>
                        <div className="oee-circle-text">{oee.performance.toFixed(1)}%</div>
                      </div>
                      <div className="oee-component-card-content">
                        <h4>Performance</h4>
                        <p className="oee-component-desc">Output efficiency - delivered vs planned quantity</p>
                      </div>
                    </div>

                    <div className="oee-component-card">
                      <div className="oee-circle">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#F5F5F5" strokeWidth="8" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#1C3668" strokeWidth="8"
                            strokeDasharray={`${oee.quality * 2.827} 282.7`}
                            transform="rotate(-90 50 50)" />
                        </svg>
                        <div className="oee-circle-text">{oee.quality.toFixed(1)}%</div>
                      </div>
                      <div className="oee-component-card-content">
                        <h4>Quality</h4>
                        <p className="oee-component-desc">Target achievement - orders meeting planned quantity</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="oee-explanation">
                  <h4>Understanding OEE Metrics</h4>
                  <ul>
                    <li>
                      <strong>Availability ({oee.availability.toFixed(1)}%):</strong> Actual production time as a percentage of total scheduled time (including planned CIP and changeover downtime). Values close to 100% indicate low planned downtime relative to run time.
                    </li>
                    <li>
                      <strong>Performance ({oee.performance.toFixed(1)}%):</strong> Compares actual output to planned output (Total Delivered ÷ Total Planned). Values over 100% indicate overproduction, while lower values suggest underperformance.
                    </li>
                    <li>
                      <strong>Quality ({oee.quality.toFixed(1)}%):</strong> Percentage of orders that met or exceeded their planned quantity, indicating fulfilment reliability and consistency.
                    </li>
                  </ul>
                  <div style={{ marginTop: '16px', padding: '12px', background: '#FFF5F5', borderRadius: '6px', border: '1px solid #FFE5E5' }}>
                    <strong style={{ color: '#0A1628' }}>💡 Interpreting Your OEE Score:</strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6B6B6B' }}>
                      • <strong>85%+:</strong> World-class performance<br/>
                      • <strong>60-85%:</strong> Good, room for improvement<br/>
                      • <strong>40-60%:</strong> Fair, significant improvement needed<br/>
                      • <strong>&lt;40%:</strong> Poor, requires immediate attention
                    </p>
                  </div>
                </div>

                <div className="oee-chart-panel">
                  <h3 className="chart-title">OEE by Production Line & Work Centre</h3>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px', lineHeight: '1.5' }}>
                    Compare OEE performance across different production lines. Each bar represents the combined effectiveness score for that line.
                  </p>
                  <ResponsiveContainer width="100%" height={420}>
                    <BarChart data={oeeByLine}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis
                        dataKey="name"
                        stroke="#6B6B6B"
                        style={{ fontSize: '10px' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis
                        stroke="#6B6B6B"
                        style={{ fontSize: '11px' }}
                        label={{ value: 'OEE %', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                      />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '8px', fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`${value.toFixed(1)}%`, 'OEE Score']}
                      />
                      <Bar dataKey="oee" fill="#1C3668" name="OEE" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'adherence' && (
            <div className="tab-content">
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <Target size={24} className="kpi-icon" />
                    <h3>Plan Adherence</h3>
                  </div>
                  <div className="adherence-value">{planAdherence.adherence.toFixed(1)}%</div>
                  <div className="adherence-breakdown">
                    <div className="adherence-item success">
                      <CheckCircle size={16} />
                      <span>On Time: {planAdherence.onTime}</span>
                    </div>
                    <div className="adherence-item warning">
                      <Clock size={16} />
                      <span>Delayed: {planAdherence.delayed}</span>
                    </div>
                    <div className="adherence-item info">
                      <TrendingUp size={16} />
                      <span>Early: {planAdherence.early}</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <AlertCircle size={24} className="kpi-icon" />
                    <h3>Average Delay</h3>
                  </div>
                  <div className="adherence-value">{planAdherence.avgDelay.toFixed(1)}</div>
                  <p className="metric-label">days per delayed order</p>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Schedule Adherence Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'On Time', value: planAdherence.onTime, color: '#0A1628' },
                          { name: 'Delayed', value: planAdherence.delayed, color: '#1C3668' },
                          { name: 'Early', value: planAdherence.early, color: '#9B9B9B' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {[planAdherence.onTime, planAdherence.delayed, planAdherence.early].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0A1628', '#1C3668', '#9B9B9B'][index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Adherence by Production Line</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productionByLine.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="name" stroke="#6B6B6B" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#6B6B6B" style={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px' }} />
                      <Bar dataKey="orders" fill="#9B9B9B" name="Total Orders" />
                      <Bar dataKey="completed" fill="#1C3668" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'byline' && (
            <div className="tab-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Production Line</th>
                      <th>Total Orders</th>
                      <th>Completed</th>
                      <th>In Progress</th>
                      <th>Planned Qty</th>
                      <th>Delivered Qty</th>
                      <th>Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionByLine.map((line, index) => (
                      <tr key={index}>
                        <td className="font-semibold">{line.name}</td>
                        <td className="text-center">{line.orders}</td>
                        <td className="text-center">{line.completed}</td>
                        <td className="text-center">{line.inProgress}</td>
                        <td className="text-right">{line.planned.toLocaleString()}</td>
                        <td className="text-right">{line.delivered.toLocaleString()}</td>
                        <td className="text-center">
                          <span className={`efficiency-badge ${
                            line.efficiency >= 100 ? 'high' :
                            line.efficiency >= 90 ? 'medium' : 'low'
                          }`}>
                            {line.efficiency.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Production Volume by Line</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={productionByLine}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="name" stroke="#6B6B6B" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#6B6B6B" style={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px' }} />
                      <Legend />
                      <Bar dataKey="planned" fill="#9B9B9B" name="Planned" />
                      <Bar dataKey="delivered" fill="#1C3668" name="Delivered" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Line Performance Radar</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={linePerformanceRadar.slice(0, 6)}>
                      <PolarGrid stroke="#E8E8E8" />
                      <PolarAngleAxis dataKey="line" stroke="#6B6B6B" style={{ fontSize: '10px' }} />
                      <PolarRadiusAxis stroke="#6B6B6B" />
                      <Radar name="Efficiency" dataKey="efficiency" stroke="#1C3668" fill="#1C3668" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="tab-content">
              <div className="stats-grid-large">
                <div className="stat-card stat-completed">
                  <div className="stat-icon"><CheckCircle size={24} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Completed Orders</p>
                    <p className="stat-value">{stats.completedOrders}</p>
                    <p className="stat-percent">{stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
                <div className="stat-card stat-progress">
                  <div className="stat-icon"><Clock size={24} /></div>
                  <div className="stat-content">
                    <p className="stat-label">In Progress Orders</p>
                    <p className="stat-value">{stats.inProgress}</p>
                    <p className="stat-percent">{stats.totalOrders > 0 ? ((stats.inProgress / stats.totalOrders) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
                <div className="stat-card stat-pending">
                  <div className="stat-icon"><AlertCircle size={24} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Pending Orders</p>
                    <p className="stat-value">{stats.pending}</p>
                    <p className="stat-percent">{stats.totalOrders > 0 ? ((stats.pending / stats.totalOrders) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
                <div className="stat-card stat-future">
                  <div className="stat-icon"><Calendar size={24} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Not Started Orders</p>
                    <p className="stat-value">{stats.notStarted}</p>
                    <p className="stat-percent">{stats.totalOrders > 0 ? ((stats.notStarted / stats.totalOrders) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Order Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Status by Production Line</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={productionByLine.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis type="number" stroke="#6B6B6B" style={{ fontSize: '11px' }} />
                      <YAxis type="category" dataKey="name" stroke="#6B6B6B" style={{ fontSize: '10px' }} width={100} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px' }} />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="#0A1628" name="Completed" />
                      <Bar dataKey="inProgress" stackId="a" fill="#1C3668" name="In Progress" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trend' && (
            <div className="tab-content">
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Production Volume Trend</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={productionTrend}>
                      <defs>
                        <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9B9B9B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#9B9B9B" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1C3668" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1C3668" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="date" stroke="#6B6B6B" style={{ fontSize: '9px' }} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#6B6B6B" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="planned" stroke="#9B9B9B" fillOpacity={1} fill="url(#colorPlanned)" name="Planned Qty" />
                      <Area type="monotone" dataKey="delivered" stroke="#1C3668" fillOpacity={1} fill="url(#colorDelivered)" name="Delivered Qty" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Order Status Trend</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={productionTrend}>
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0A1628" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0A1628" stopOpacity={0.3}/>
                        </linearGradient>
                        <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1C3668" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1C3668" stopOpacity={0.3}/>
                        </linearGradient>
                        <linearGradient id="colorNotStarted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C0C0C0" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#C0C0C0" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="date" stroke="#6B6B6B" style={{ fontSize: '9px' }} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#6B6B6B" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="completed" stackId="1" stroke="#0A1628" fill="url(#colorCompleted)" name="Completed" />
                      <Area type="monotone" dataKey="inProgress" stackId="1" stroke="#1C3668" fill="url(#colorInProgress)" name="In Progress" />
                      <Area type="monotone" dataKey="notStarted" stackId="1" stroke="#C0C0C0" fill="url(#colorNotStarted)" name="Not Started" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Daily Order Count</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={productionTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="date" stroke="#6B6B6B" style={{ fontSize: '9px' }} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#6B6B6B" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="completed" stackId="a" fill="#0A1628" name="Completed" />
                      <Bar dataKey="inProgress" stackId="a" fill="#1C3668" name="In Progress" />
                      <Bar dataKey="notStarted" stackId="a" fill="#C0C0C0" name="Not Started" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Cumulative Delivered Quantity</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={productionTrend.map((item, index, arr) => ({
                      date: item.date,
                      cumulative: arr.slice(0, index + 1).reduce((sum, d) => sum + d.delivered, 0)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="date" stroke="#6B6B6B" style={{ fontSize: '9px' }} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#6B6B6B" style={{ fontSize: '10px' }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px', fontSize: '11px' }}
                        formatter={(value) => value.toLocaleString()}
                      />
                      <Line type="monotone" dataKey="cumulative" stroke="#1C3668" strokeWidth={2} name="Cumulative Delivered" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
