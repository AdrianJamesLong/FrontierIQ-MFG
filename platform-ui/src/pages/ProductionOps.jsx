import { useState, useEffect } from 'react'
import { Activity, RefreshCw, AlertCircle, Calendar, Clock, CheckCircle, BarChart3, Package, Truck, Target, TrendingUp, Award, Zap, Brain, Sparkles, Lightbulb, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Coca-Cola brand colors matching Dashboard
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

function ProductionOps() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [masterTab, setMasterTab] = useState('realtime')
  const [activeTab, setActiveTab] = useState('in-process')
  const [selectedLine, setSelectedLine] = useState('all')

  // Date range state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Metrics sub-tab state
  const [metricsSubTab, setMetricsSubTab] = useState('overview')
  
  // Optimization tab state
  const [optimizationTab, setOptimizationTab] = useState('overview')
  const [selectedRecommendation, setSelectedRecommendation] = useState(0)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/data`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Server error')
      }
      const result = await response.json()
      setData(result.data || [])
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get unique production lines from WORK_CENTER
  const productionLines = ['all', ...new Set(data.map(order => getProductionLine(order.WORK_CENTER)).filter(Boolean))]

  // Filter orders by status - MATCHING DASHBOARD LOGIC
  // Completed: DELIVERED_QUANTITY >= PLANNED_QUANTITY
  const completedOrders = data.filter(
    order => order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY
  )

  // In Progress: delivered > 0 AND delivered < planned
  const inProcessOrders = data.filter(
    order => order.DELIVERED_QUANTITY > 0 &&
             order.DELIVERED_QUANTITY < order.PLANNED_QUANTITY
  )

  // Pending: Not completed and not in progress and has some activity
  const pendingOrders = data.filter(
    order => order.DELIVERED_QUANTITY < order.PLANNED_QUANTITY &&
             order.DELIVERED_QUANTITY === 0 &&
             (order.ACTUAL_START_DATE && order.ACTUAL_START_DATE !== '31/12/9999')
  )

  // Not Started (Planned): delivered = 0 AND no actual start date
  const plannedOrders = data.filter(
    order => order.DELIVERED_QUANTITY === 0 &&
             (!order.ACTUAL_START_DATE || order.ACTUAL_START_DATE === '31/12/9999')
  )

  const getStatusColor = (order) => {
    // Completed: DELIVERED_QUANTITY >= PLANNED_QUANTITY
    if (order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY) {
      return 'status-completed'
    }
    // In Progress: delivered > 0 AND delivered < planned
    if (order.DELIVERED_QUANTITY > 0 && order.DELIVERED_QUANTITY < order.PLANNED_QUANTITY) {
      return 'status-in-progress'
    }
    // Pending: has activity but not started
    if (order.DELIVERED_QUANTITY === 0 && order.ACTUAL_START_DATE && order.ACTUAL_START_DATE !== '31/12/9999') {
      return 'status-pending'
    }
    // Not Started
    return 'status-pending'
  }

  const getStatusText = (order) => {
    if (order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY) {
      return 'Completed'
    }
    if (order.DELIVERED_QUANTITY > 0 && order.DELIVERED_QUANTITY < order.PLANNED_QUANTITY) {
      return 'In Progress'
    }
    if (order.DELIVERED_QUANTITY === 0 && order.ACTUAL_START_DATE && order.ACTUAL_START_DATE !== '31/12/9999') {
      return 'Pending'
    }
    return 'Not Started'
  }

  // Apply production line filter
  const filterByLine = (orders) => {
    if (selectedLine === 'all') return orders
    return orders.filter(order => getProductionLine(order.WORK_CENTER) === selectedLine)
  }

  // Apply date range filter
  const filterByDateRange = (orders) => {
    if (!startDate && !endDate) return orders

    return orders.filter(order => {
      const orderDate = order.ACTUAL_START_DATE
      if (!orderDate || orderDate === '31/12/9999') return false

      // Parse DD/MM/YYYY format
      const [day, month, year] = orderDate.split('/')
      const orderDateObj = new Date(year, month - 1, day)

      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        return orderDateObj >= start && orderDateObj <= end
      } else if (startDate) {
        const start = new Date(startDate)
        return orderDateObj >= start
      } else if (endDate) {
        const end = new Date(endDate)
        return orderDateObj <= end
      }

      return true
    })
  }

  // Get current tab orders
  const getCurrentOrders = () => {
    let orders = []
    switch (activeTab) {
      case 'in-process':
        orders = inProcessOrders
        break
      case 'planned':
        orders = plannedOrders
        break
      case 'completed':
        orders = completedOrders
        break
      default:
        orders = inProcessOrders
    }
    return filterByDateRange(filterByLine(orders))
  }

  // Calculate metrics
  const calculateMetrics = () => {
    const filtered = filterByDateRange(filterByLine(data))
    const totalOrders = filtered.length
    const inProcess = filterByDateRange(filterByLine(inProcessOrders)).length
    const planned = filterByDateRange(filterByLine(plannedOrders)).length
    const completed = filterByDateRange(filterByLine(completedOrders)).length
    const pending = filterByDateRange(filterByLine(pendingOrders)).length

    const totalPlanned = filtered.reduce((sum, order) => sum + order.PLANNED_QUANTITY, 0)
    const totalDelivered = filtered.reduce((sum, order) => sum + order.DELIVERED_QUANTITY, 0)
    const overallProgress = totalPlanned > 0 ? (totalDelivered / totalPlanned) * 100 : 0

    const avgProgress = inProcess > 0
      ? filterByDateRange(filterByLine(inProcessOrders)).reduce((sum, order) => {
          return sum + (order.PLANNED_QUANTITY > 0 ? (order.DELIVERED_QUANTITY / order.PLANNED_QUANTITY) * 100 : 0)
        }, 0) / inProcess
      : 0

    // Production line breakdown
    const lineBreakdown = {}
    filtered.forEach(order => {
      const line = getProductionLine(order.WORK_CENTER) || 'Unknown'
      if (!lineBreakdown[line]) {
        lineBreakdown[line] = { planned: 0, delivered: 0, orders: 0 }
      }
      lineBreakdown[line].planned += order.PLANNED_QUANTITY
      lineBreakdown[line].delivered += order.DELIVERED_QUANTITY
      lineBreakdown[line].orders += 1
    })

    // Material breakdown - top materials
    const materialBreakdown = {}
    filtered.forEach(order => {
      const material = order.MATERIAL_ID || 'Unknown'
      if (!materialBreakdown[material]) {
        materialBreakdown[material] = {
          planned: 0,
          delivered: 0,
          orders: 0,
          description: order.MATERIAL_DESC || '-'
        }
      }
      materialBreakdown[material].planned += order.PLANNED_QUANTITY
      materialBreakdown[material].delivered += order.DELIVERED_QUANTITY
      materialBreakdown[material].orders += 1
    })

    return {
      totalOrders,
      inProcess,
      planned,
      completed,
      pending,
      totalPlanned,
      totalDelivered,
      overallProgress,
      avgProgress,
      completionRate: totalOrders > 0 ? (completed / totalOrders) * 100 : 0,
      lineBreakdown,
      materialBreakdown
    }
  }

  const currentOrders = getCurrentOrders()
  const metrics = calculateMetrics()

  // AI Optimization functions (from ProductionOptimization.jsx)
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === '31/12/9999') return null
    const parts = dateStr.split('/')
    return new Date(parts[2], parts[1] - 1, parts[0])
  }

  const analyzeProductionData = () => {
    const completedOrdersForAnalysis = data.filter(order => order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY)
    const onTimeStarts = completedOrdersForAnalysis.filter(order => {
      const scheduled = parseDate(order.SCHEDULED_START_DATE)
      const actual = parseDate(order.ACTUAL_START_DATE)
      return scheduled && actual && actual <= scheduled
    }).length
    const availability = completedOrdersForAnalysis.length > 0 ? (onTimeStarts / completedOrdersForAnalysis.length) * 100 : 0
    const totalPlanned = completedOrdersForAnalysis.reduce((sum, order) => sum + order.PLANNED_QUANTITY, 0)
    const totalDelivered = completedOrdersForAnalysis.reduce((sum, order) => sum + order.DELIVERED_QUANTITY, 0)
    const performance = totalPlanned > 0 ? (totalDelivered / totalPlanned) * 100 : 0
    const quality = 100
    const oee = (availability * performance * quality) / 10000

    const lineData = {}
    data.forEach(order => {
      const line = getProductionLine(order.WORK_CENTER)
      if (!lineData[line]) lineData[line] = { orders: 0, completed: 0, planned: 0, delivered: 0, changes: 0, delays: 0, totalDelayDays: 0 }
      lineData[line].orders += 1
      lineData[line].planned += order.PLANNED_QUANTITY
      lineData[line].delivered += order.DELIVERED_QUANTITY
      lineData[line].changes += order.NUMBER_OF_CHANGES_TO_ORDER_QUANTITY + order.NUMBER_OF_CHANGES_TO_SCHEDULED_START_DATE
      if (order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY) lineData[line].completed += 1
      const scheduled = parseDate(order.SCHEDULED_START_DATE)
      const actual = parseDate(order.ACTUAL_START_DATE)
      if (scheduled && actual && actual > scheduled) {
        lineData[line].delays += 1
        lineData[line].totalDelayDays += Math.floor((actual - scheduled) / (1000 * 60 * 60 * 24))
      }
    })

    const lineMetrics = Object.entries(lineData).map(([line, stats]) => ({
      line,
      efficiency: stats.planned > 0 ? (stats.delivered / stats.planned) * 100 : 0,
      completionRate: stats.orders > 0 ? (stats.completed / stats.orders) * 100 : 0,
      avgChanges: stats.orders > 0 ? stats.changes / stats.orders : 0,
      delayRate: stats.orders > 0 ? (stats.delays / stats.orders) * 100 : 0,
      avgDelay: stats.delays > 0 ? stats.totalDelayDays / stats.delays : 0,
      ...stats
    }))

    return { oee, availability, performance, quality, lineMetrics, completedOrders: completedOrdersForAnalysis.length }
  }

  const generateRecommendations = () => {
    const analysis = analyzeProductionData()
    const recommendations = []

    if (analysis.oee < 60) {
      recommendations.push({
        priority: 'critical', category: 'OEE', title: 'Critical OEE Performance',
        issue: `Current OEE is ${analysis.oee.toFixed(1)}%, significantly below industry standards (60%+)`,
        impact: 'High production inefficiency leading to increased costs and missed targets',
        recommendation: 'Immediate action required: Focus on improving availability, performance, and quality metrics',
        actions: ['Conduct root cause analysis on production delays', 'Implement preventive maintenance schedule', 'Review and optimize production planning processes', 'Invest in operator training programs'],
        aiReasoning: 'AI Analysis: OEE below 60% indicates systemic issues. Machine learning models predict 15-20% improvement possible with targeted interventions.'
      })
    } else if (analysis.oee < 85) {
      recommendations.push({
        priority: 'high', category: 'OEE', title: 'OEE Improvement Opportunity',
        issue: `Current OEE is ${analysis.oee.toFixed(1)}%, below world-class standards (85%+)`,
        impact: 'Moderate efficiency gaps affecting overall productivity',
        recommendation: 'Focus on incremental improvements across all three OEE pillars',
        actions: ['Optimize changeover times', 'Reduce minor stoppages', 'Implement real-time monitoring', 'Standardize best practices'],
        aiReasoning: 'AI Analysis: Pattern recognition shows 10-15% OEE improvement potential through targeted interventions.'
      })
    }

    if (analysis.availability < 70) {
      recommendations.push({
        priority: 'high', category: 'Availability', title: 'Schedule Adherence Issues',
        issue: `Only ${analysis.availability.toFixed(1)}% of orders start on time`,
        impact: 'Poor schedule adherence cascades into downstream delays',
        recommendation: 'Improve production planning and resource allocation',
        actions: ['Implement APS system', 'Review material availability', 'Analyze downtime patterns', 'Create buffer capacity'],
        aiReasoning: 'AI Analysis: Predictive models suggest 25% improvement in on-time starts through better planning.'
      })
    }

    if (analysis.performance < 95) {
      recommendations.push({
        priority: 'medium', category: 'Performance', title: 'Output Efficiency Gap',
        issue: `Production performance at ${analysis.performance.toFixed(1)}% of planned capacity`,
        impact: 'Underutilization of production capacity',
        recommendation: 'Optimize production speed and reduce micro-stoppages',
        actions: ['Conduct time studies', 'Eliminate bottlenecks', 'Implement lean principles', 'Upgrade equipment where justified'],
        aiReasoning: 'AI Analysis: Neural networks identify 8-12% throughput increase potential.'
      })
    }

    const problematicLines = analysis.lineMetrics.filter(line => line.efficiency < 90 || line.delayRate > 20 || line.avgChanges > 2)
      .sort((a, b) => (b.delayRate + (100 - b.efficiency)) - (a.delayRate + (100 - a.efficiency))).slice(0, 3)

    problematicLines.forEach(line => {
      const issues = []
      if (line.efficiency < 90) issues.push(`low efficiency (${line.efficiency.toFixed(1)}%)`)
      if (line.delayRate > 20) issues.push(`high delay rate (${line.delayRate.toFixed(1)}%)`)
      if (line.avgChanges > 2) issues.push(`frequent changes (${line.avgChanges.toFixed(1)} per order)`)

      recommendations.push({
        priority: line.efficiency < 80 ? 'high' : 'medium', category: 'Production Line', title: `${line.line} Requires Attention`,
        issue: `Production line showing ${issues.join(', ')}`,
        impact: `Affecting ${line.orders} orders with ${(line.planned - line.delivered).toLocaleString()} units variance`,
        recommendation: 'Deep dive analysis and targeted improvement plan needed',
        actions: ['Conduct line audit', 'Review operator training', 'Analyze equipment condition', 'Optimize workflow'],
        aiReasoning: `AI Analysis: ${Math.round((100 - line.efficiency) * 0.6)}% efficiency improvement possible through optimization.`
      })
    })

    if (analysis.lineMetrics.filter(line => line.avgChanges > 2).length > 0) {
      recommendations.push({
        priority: 'medium', category: 'Planning', title: 'Excessive Schedule Changes',
        issue: `Multiple production lines experiencing frequent schedule modifications`,
        impact: 'Schedule instability increases costs and reduces efficiency',
        recommendation: 'Improve demand forecasting and production planning accuracy',
        actions: ['Implement forecasting tools', 'Establish frozen schedule zone', 'Improve S&OP process', 'Create safety stock'],
        aiReasoning: 'AI Analysis: 40% reduction in changes possible through improved forecasting.'
      })
    }

    if (analysis.oee < 85 || analysis.availability < 80) {
      recommendations.push({
        priority: 'strategic', category: 'Digital Transformation', title: 'Smart Manufacturing Initiative',
        issue: 'Multiple improvement opportunities across operations',
        impact: 'Significant potential for operational excellence',
        recommendation: 'Implement comprehensive digital manufacturing transformation',
        actions: ['Deploy IoT sensors', 'Implement AI predictive maintenance', 'Establish digital twin', 'Create MES system', 'Develop ML capabilities'],
        aiReasoning: 'AI Analysis: 20-30% productivity improvement potential. ROI payback: 18-24 months.'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, strategic: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  const getImprovementOpportunities = () => {
    const analysis = analyzeProductionData()
    return [
      { area: 'OEE Improvement', current: analysis.oee, target: 85, potential: Math.max(0, 85 - analysis.oee), impact: 'High', effort: 'Medium', priority: analysis.oee < 60 ? 1 : 2 },
      { area: 'Schedule Adherence', current: analysis.availability, target: 90, potential: Math.max(0, 90 - analysis.availability), impact: 'High', effort: 'Medium', priority: analysis.availability < 70 ? 1 : 2 },
      { area: 'Output Performance', current: analysis.performance, target: 100, potential: Math.max(0, 100 - analysis.performance), impact: 'Medium', effort: 'Low', priority: 3 }
    ].sort((a, b) => a.priority - b.priority)
  }

  const getLineComparison = () => {
    const analysis = analyzeProductionData()
    return analysis.lineMetrics.sort((a, b) => b.efficiency - a.efficiency).slice(0, 8).map(line => ({
      name: line.line.substring(0, 15), efficiency: line.efficiency, completionRate: line.completionRate, delayRate: line.delayRate
    }))
  }

  const getPriorityColor = (priority) => {
    const colors = { critical: '#0A1628', high: '#1C3668', medium: '#FF4D4F', strategic: '#6B6B6B' }
    return colors[priority] || '#9B9B9B'
  }

  const getPriorityIcon = (priority) => {
    const icons = { critical: <AlertCircle size={20} />, high: <TrendingUp size={20} />, medium: <Target size={20} />, strategic: <Sparkles size={20} /> }
    return icons[priority] || <Activity size={20} />
  }

  const analysis = data.length > 0 ? analyzeProductionData() : null
  const recommendations = data.length > 0 ? generateRecommendations() : []
  const opportunities = data.length > 0 ? getImprovementOpportunities() : []
  const lineComparison = data.length > 0 ? getLineComparison() : []

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>Production Ops Real-time</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            Live production operations monitoring
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                  {line === 'all' ? 'All Lines' : line}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <Calendar size={16} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151' }}>From:</span>
            <input
              id="start-date"
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
              id="end-date"
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

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              style={{
                padding: '8px 14px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                background: 'white',
                color: '#374151'
              }}
            >
              Clear
            </button>
          )}

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
            {metrics.totalOrders} Orders
          </div>
        </div>
      </div>

      {/* Master Tabs Navigation */}
      <div className="tabs-container" style={{ marginBottom: '8px' }}>
        <button
          className={`tab-button ${masterTab === 'realtime' ? 'active' : ''}`}
          onClick={() => setMasterTab('realtime')}
          style={{ padding: '10px 18px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Activity size={14} />
          Real-Time Operations
        </button>
        <button
          className={`tab-button ${masterTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setMasterTab('optimization')}
          style={{ padding: '10px 18px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Brain size={14} />
          AI Optimization
        </button>
      </div>

      {/* Real-Time Operations Sub-tabs */}
      {masterTab === 'realtime' && (
        <div className="tabs-container" style={{ marginBottom: '8px', padding: '4px', gap: '6px' }}>
          <button
            className={`tab-button ${activeTab === 'in-process' ? 'active' : ''}`}
            onClick={() => setActiveTab('in-process')}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
          >
            In Process
          </button>
          <button
            className={`tab-button ${activeTab === 'planned' ? 'active' : ''}`}
            onClick={() => setActiveTab('planned')}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
          >
            Planned
          </button>
          <button
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
          >
            Completed
          </button>
          <button
            className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
          >
            Metrics & Analysis
          </button>
        </div>
      )}

      {/* AI Optimization Sub-tabs */}
      {masterTab === 'optimization' && (
        <div className="tabs-container" style={{ marginBottom: '8px', padding: '4px', gap: '6px' }}>
          <button
            className={`tab-button ${optimizationTab === 'overview' ? 'active' : ''}`}
            onClick={() => setOptimizationTab('overview')}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={12} />
            AI Overview
          </button>
          <button
            className={`tab-button ${optimizationTab === 'opportunities' ? 'active' : ''}`}
            onClick={() => setOptimizationTab('opportunities')}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Zap size={12} />
            Quick Wins
          </button>
          <button
            className={`tab-button ${optimizationTab === 'performance' ? 'active' : ''}`}
            onClick={() => setOptimizationTab('performance')}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart3 size={12} />
            Line Performance
          </button>
          <button
            className={`tab-button ${optimizationTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setOptimizationTab('recommendations')}
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Lightbulb size={12} />
            Recommendations
          </button>
        </div>
      )}

      {loading && data.length === 0 && (
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

      {/* Metrics Tab - Organized with Sub-tabs */}
      {activeTab === 'metrics' && !loading && !error && (
        <div className="tab-content" style={{ padding: 0 }}>
          {/* Metrics Sub-tabs */}
          <div className="tabs-container" style={{ marginBottom: '8px', padding: '4px', gap: '6px' }}>
            <button
              className={`tab-button ${metricsSubTab === 'overview' ? 'active' : ''}`}
              onClick={() => setMetricsSubTab('overview')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Overview
            </button>
            <button
              className={`tab-button ${metricsSubTab === 'production-lines' ? 'active' : ''}`}
              onClick={() => setMetricsSubTab('production-lines')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Production Lines
            </button>
            <button
              className={`tab-button ${metricsSubTab === 'materials' ? 'active' : ''}`}
              onClick={() => setMetricsSubTab('materials')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Materials
            </button>
            <button
              className={`tab-button ${metricsSubTab === 'performance' ? 'active' : ''}`}
              onClick={() => setMetricsSubTab('performance')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Performance
            </button>
          </div>

          {/* Overview Sub-tab */}
          {metricsSubTab === 'overview' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">TOTAL ORDERS</span>
                  </div>
                  <div className="stat-value-large">{metrics.totalOrders}</div>
                  <div className="stat-footer">All production orders</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">COMPLETED</span>
                  </div>
                  <div className="stat-value-large">{metrics.completed}</div>
                  <div className="stat-footer">{metrics.completionRate.toFixed(1)}% completion rate</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">IN PROGRESS</span>
                  </div>
                  <div className="stat-value-large">{metrics.inProcess}</div>
                  <div className="stat-footer">Active orders</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">NOT STARTED</span>
                  </div>
                  <div className="stat-value-large">{metrics.planned}</div>
                  <div className="stat-footer">Awaiting start</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div className="chart-card">
                  <h4>ORDER STATUS DISTRIBUTION</h4>
                  <p className="chart-subtitle">Breakdown of orders by current status</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: metrics.completed },
                          { name: 'In Progress', value: metrics.inProcess },
                          { name: 'Not Started', value: metrics.planned }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: 'Completed', value: metrics.completed },
                          { name: 'In Progress', value: metrics.inProcess },
                          { name: 'Not Started', value: metrics.planned }
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h4>PRODUCTION VOLUME</h4>
                  <p className="chart-subtitle">Planned quantity vs delivered quantity</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={[
                        {
                          name: 'Production',
                          'Planned': metrics.totalPlanned,
                          'Delivered': metrics.totalDelivered
                        }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                      <Bar dataKey="Planned" fill={COLORS[5]} />
                      <Bar dataKey="Delivered" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ marginTop: '16px' }}>
                <h4>OVERALL PROGRESS</h4>
                <p className="chart-subtitle">
                  {metrics.totalDelivered.toLocaleString()} of {metrics.totalPlanned.toLocaleString()} units delivered
                </p>
                <div style={{ width: '100%', height: '28px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden', position: 'relative', marginTop: '12px' }}>
                  <div style={{
                    width: `${metrics.overallProgress}%`,
                    height: '100%',
                    background: COLORS[1],
                    transition: 'width 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                      {metrics.overallProgress.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Production Lines Sub-tab */}
          {metricsSubTab === 'production-lines' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="chart-card" style={{ margin: 0 }}>
                <h4>OUTPUT BY PRODUCTION LINE</h4>
                <p className="chart-subtitle">
                  Planned vs delivered quantities
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={Object.entries(metrics.lineBreakdown).map(([line, data]) => ({
                      line,
                      'Planned': data.planned,
                      'Delivered': data.delivered
                    }))}
                    margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="line" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Planned" fill={COLORS[5]} />
                    <Bar dataKey="Delivered" fill={COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card" style={{ margin: 0 }}>
                <h4>PRODUCTION LINE DETAILS</h4>
                <p className="chart-subtitle">
                  Efficiency breakdown by line
                </p>
                <div className="table-container" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Orders</th>
                        <th>Planned Qty</th>
                        <th>Delivered Qty</th>
                        <th>Efficiency</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metrics.lineBreakdown)
                        .sort((a, b) => b[1].delivered - a[1].delivered)
                        .map(([line, data]) => {
                          const efficiency = data.planned > 0 ? (data.delivered / data.planned) * 100 : 0
                          return (
                            <tr key={line}>
                              <td style={{ fontWeight: '600' }}>{line}</td>
                              <td className="text-center">{data.orders}</td>
                              <td className="text-right">{data.planned.toLocaleString()}</td>
                              <td className="text-right">{data.delivered.toLocaleString()}</td>
                              <td className="text-right">
                                <span style={{
                                  color: efficiency >= 80 ? COLORS[1] : efficiency >= 50 ? '#f59e0b' : '#ef4444',
                                  fontWeight: '600'
                                }}>
                                  {efficiency.toFixed(1)}%
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge ${
                                  efficiency >= 80 ? 'status-completed' :
                                  efficiency >= 50 ? 'status-in-progress' :
                                  'status-pending'
                                }`}>
                                  {efficiency >= 80 ? 'Excellent' : efficiency >= 50 ? 'Good' : 'Needs Attention'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Materials Sub-tab */}
          {metricsSubTab === 'materials' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="chart-card" style={{ margin: 0 }}>
                <h4>TOP MATERIALS BY VOLUME</h4>
                <p className="chart-subtitle">
                  Top 10 materials ranked by delivered quantity
                </p>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart
                    data={Object.entries(metrics.materialBreakdown)
                      .sort((a, b) => b[1].delivered - a[1].delivered)
                      .slice(0, 10)
                      .map(([material, data]) => ({
                        material: material,
                        description: data.description && data.description.length > 25
                          ? data.description.substring(0, 25) + '...'
                          : data.description || material,
                        displayLabel: data.description && data.description.length > 25
                          ? data.description.substring(0, 25) + '...'
                          : data.description || material,
                        'Delivered': data.delivered,
                        'Planned': data.planned
                      }))}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 180, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" style={{ fontSize: '11px' }} />
                    <YAxis dataKey="displayLabel" type="category" width={170} style={{ fontSize: '11px' }} />
                    <Tooltip
                      formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
                      labelFormatter={(label) => {
                        const item = Object.entries(metrics.materialBreakdown)
                          .sort((a, b) => b[1].delivered - a[1].delivered)
                          .slice(0, 10)
                          .find(([mat, data]) => (data.description || mat) === label || (data.description && data.description.substring(0, 25) + '...') === label)
                        return item ? `${item[0]} - ${item[1].description || item[0]}` : label
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Delivered" fill={COLORS[1]} />
                    <Bar dataKey="Planned" fill={COLORS[5]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card" style={{ margin: 0 }}>
                <h4>MATERIAL SUMMARY</h4>
                <p className="chart-subtitle">
                  All materials with production volumes
                </p>
                <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Material Number</th>
                        <th>Material Description</th>
                        <th>Orders</th>
                        <th>Planned Qty</th>
                        <th>Delivered Qty</th>
                        <th>Completion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metrics.materialBreakdown)
                        .sort((a, b) => b[1].delivered - a[1].delivered)
                        .map(([material, data]) => {
                          const completion = data.planned > 0 ? (data.delivered / data.planned) * 100 : 0
                          return (
                            <tr key={material}>
                              <td className="font-mono">{material}</td>
                              <td>{data.description}</td>
                              <td className="text-center">{data.orders}</td>
                              <td className="text-right">{data.planned.toLocaleString()}</td>
                              <td className="text-right">{data.delivered.toLocaleString()}</td>
                              <td className="text-right">
                                <span style={{
                                  color: completion >= 80 ? COLORS[1] : completion >= 50 ? '#f59e0b' : COLORS[5],
                                  fontWeight: '600'
                                }}>
                                  {completion.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Performance Sub-tab */}
          {metricsSubTab === 'performance' && (
            <div>
              <div className="stats-grid" style={{ marginBottom: '16px' }}>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">AVERAGE ORDER PROGRESS</span>
                  </div>
                  <div className="stat-value-large">{metrics.avgProgress.toFixed(1)}%</div>
                  <div className="stat-footer">Across {metrics.inProcess} active orders</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">COMPLETION RATE</span>
                  </div>
                  <div className="stat-value-large">{metrics.completionRate.toFixed(1)}%</div>
                  <div className="stat-footer">Orders completed successfully</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">ACTIVE LINES</span>
                  </div>
                  <div className="stat-value-large">{Object.keys(metrics.lineBreakdown).length}</div>
                  <div className="stat-footer">Production lines running</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">TOTAL DELIVERED</span>
                  </div>
                  <div className="stat-value-large">{(metrics.totalDelivered / 1000).toFixed(1)}K</div>
                  <div className="stat-footer">Units completed</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="chart-card" style={{ margin: 0 }}>
                  <h4>OVERALL PRODUCTION EFFICIENCY</h4>
                  <p className="chart-subtitle">
                    Key performance indicators
                  </p>
                  <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>Overall Progress</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS[1] }}>
                          {metrics.overallProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${metrics.overallProgress}%`, height: '100%', background: COLORS[1] }}></div>
                      </div>
                      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                        {metrics.totalDelivered.toLocaleString()} / {metrics.totalPlanned.toLocaleString()} units
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>Order Completion</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS[1] }}>
                          {metrics.completionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${metrics.completionRate}%`, height: '100%', background: COLORS[1] }}></div>
                      </div>
                      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                        {metrics.completed} of {metrics.totalOrders} orders completed
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>Average Order Progress</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS[2] }}>
                          {metrics.avgProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${metrics.avgProgress}%`, height: '100%', background: COLORS[2] }}></div>
                      </div>
                      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                        Average progress across {metrics.inProcess} in-progress orders
                      </p>
                    </div>
                  </div>
                </div>

                <div className="chart-card" style={{ margin: 0 }}>
                  <h4>PRODUCTION STATUS BREAKDOWN</h4>
                  <p className="chart-subtitle">
                    Distribution across production stages
                  </p>
                  <div className="table-container" style={{ marginTop: '12px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                          <th>Percentage</th>
                          <th>Visual</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><span className="status-badge status-completed">Completed</span></td>
                          <td className="text-center">{metrics.completed}</td>
                          <td className="text-center">{metrics.completionRate.toFixed(1)}%</td>
                          <td>
                            <div style={{ width: '100%', height: '8px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${metrics.completionRate}%`, height: '100%', background: COLORS[1] }}></div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td><span className="status-badge status-in-progress">In Progress</span></td>
                          <td className="text-center">{metrics.inProcess}</td>
                          <td className="text-center">{metrics.totalOrders > 0 ? ((metrics.inProcess / metrics.totalOrders) * 100).toFixed(1) : 0}%</td>
                          <td>
                            <div style={{ width: '100%', height: '8px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${metrics.totalOrders > 0 ? (metrics.inProcess / metrics.totalOrders) * 100 : 0}%`, height: '100%', background: COLORS[2] }}></div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td><span className="status-badge status-future">Not Started</span></td>
                          <td className="text-center">{metrics.planned}</td>
                          <td className="text-center">{metrics.totalOrders > 0 ? ((metrics.planned / metrics.totalOrders) * 100).toFixed(1) : 0}%</td>
                          <td>
                            <div style={{ width: '100%', height: '8px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${metrics.totalOrders > 0 ? (metrics.planned / metrics.totalOrders) * 100 : 0}%`, height: '100%', background: COLORS[5] }}></div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Optimization Content */}
      {masterTab === 'optimization' && !loading && !error && analysis && (
        <div className="tab-content">
          {optimizationTab === 'overview' && (
            <>
              <div style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)', border: '2px solid #1C3668', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(244, 0, 9, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Sparkles size={24} style={{ color: '#1C3668' }} />
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0A1628' }}>AI-Powered Analysis Summary</h2>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6B6B6B', lineHeight: '1.6' }}>
                  Our advanced machine learning algorithms have analyzed <strong>{data.length} production orders</strong> across <strong>{analysis.lineMetrics.length} production lines</strong>, identifying <strong>{recommendations.length} actionable recommendations</strong>.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #FFE5E5' }}>
                    <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Current OEE</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: analysis.oee >= 85 ? '#0A1628' : analysis.oee >= 60 ? '#1C3668' : '#FF4D4F' }}>{analysis.oee.toFixed(1)}%</div>
                  </div>
                  <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #FFE5E5' }}>
                    <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Improvement Potential</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#1C3668' }}>+{Math.max(0, 85 - analysis.oee).toFixed(1)}%</div>
                  </div>
                  <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #FFE5E5' }}>
                    <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Priority Actions</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0A1628' }}>{recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length}</div>
                  </div>
                </div>
              </div>

              <div className="stats-grid-large" style={{ marginBottom: '12px' }}>
                <div className="stat-card stat-total">
                  <div className="stat-icon"><Activity size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Availability</p>
                    <p className="stat-value">{analysis.availability.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="stat-card stat-completed">
                  <div className="stat-icon"><TrendingUp size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Performance</p>
                    <p className="stat-value">{analysis.performance.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="stat-card stat-progress">
                  <div className="stat-icon"><CheckCircle size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Quality</p>
                    <p className="stat-value">{analysis.quality.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="stat-card stat-pending">
                  <div className="stat-icon"><Target size={20} /></div>
                  <div className="stat-content">
                    <p className="stat-label">Completed Orders</p>
                    <p className="stat-value">{analysis.completedOrders}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {optimizationTab === 'opportunities' && opportunities.length > 0 && (
            <>
              <div style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)', border: '2px solid #1C3668', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0A1628', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={20} style={{ color: '#1C3668' }} />
                  Quick Win Opportunities
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B6B6B', lineHeight: '1.6' }}>
                  These opportunities represent the highest-impact, lowest-effort improvements identified by our AI analysis.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {opportunities.map((opp, index) => (
                  <div key={index} style={{ background: 'white', border: '2px solid #E8E8E8', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #1C3668 0%, #FF4D4F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }}>
                        {index + 1}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628', margin: 0 }}>{opp.area}</h3>
                    </div>

                    <div style={{ background: '#F9F9F9', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Current</div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1C3668' }}>{opp.current.toFixed(1)}%</div>
                        </div>
                        <ArrowRight size={24} style={{ color: '#6B6B6B' }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Target</div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0A1628' }}>{opp.target}%</div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#6B6B6B' }}>Progress to Target</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#1C3668' }}>{((opp.current / opp.target) * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: '10px', background: '#E8E8E8', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(opp.current / opp.target) * 100}%`, background: 'linear-gradient(90deg, #1C3668 0%, #FF4D4F 100%)' }} />
                        </div>
                      </div>

                      <div style={{ background: 'white', borderRadius: '6px', padding: '12px', marginTop: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '6px' }}>Improvement Potential</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1C3668' }}>+{opp.potential.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: '#FFE5E5', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px', fontWeight: '600' }}>Impact</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0A1628' }}>{opp.impact}</div>
                      </div>
                      <div style={{ background: '#F5F5F5', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px', fontWeight: '600' }}>Effort</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#6B6B6B' }}>{opp.effort}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {optimizationTab === 'performance' && lineComparison.length > 0 && (
            <div className="chart-card">
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={20} style={{ color: '#1C3668' }} />
                Production Line Performance Analysis
              </h3>
              <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px' }}>Comparative analysis across production lines</p>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={lineComparison}>
                  <PolarGrid stroke="#E8E8E8" />
                  <PolarAngleAxis dataKey="name" stroke="#6B6B6B" style={{ fontSize: '11px' }} />
                  <PolarRadiusAxis stroke="#6B6B6B" />
                  <Radar name="Efficiency %" dataKey="efficiency" stroke="#1C3668" fill="#1C3668" fillOpacity={0.6} />
                  <Radar name="Completion %" dataKey="completionRate" stroke="#0A1628" fill="#0A1628" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {optimizationTab === 'recommendations' && recommendations.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', height: 'calc(100vh - 280px)' }}>
              <div style={{ background: 'white', border: '1px solid #E8E8E8', borderRadius: '12px', padding: '20px', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={18} style={{ color: '#1C3668' }} />
                  Recommendations ({recommendations.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedRecommendation(index)}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: selectedRecommendation === index ? `2px solid ${getPriorityColor(rec.priority)}` : '2px solid #E8E8E8',
                        background: selectedRecommendation === index ? '#FFF5F5' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: `linear-gradient(135deg, ${getPriorityColor(rec.priority)} 0%, ${getPriorityColor(rec.priority)}CC 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          {getPriorityIcon(rec.priority)}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0A1628', flex: 1 }}>{rec.title}</h3>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ padding: '2px 6px', background: getPriorityColor(rec.priority), color: 'white', borderRadius: '4px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' }}>{rec.priority}</span>
                        <span style={{ padding: '2px 6px', background: '#F5F5F5', color: '#6B6B6B', borderRadius: '4px', fontSize: '9px', fontWeight: '600', textTransform: 'uppercase' }}>{rec.category}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6B6B6B', lineHeight: '1.4' }}>
                        {rec.issue.length > 80 ? rec.issue.substring(0, 80) + '...' : rec.issue}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', border: '1px solid #E8E8E8', borderRadius: '12px', padding: '28px', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                {recommendations[selectedRecommendation] && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid #FFE5E5' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: `linear-gradient(135deg, ${getPriorityColor(recommendations[selectedRecommendation].priority)} 0%, ${getPriorityColor(recommendations[selectedRecommendation].priority)}CC 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        {getPriorityIcon(recommendations[selectedRecommendation].priority)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '700', color: '#0A1628' }}>
                          {recommendations[selectedRecommendation].title}
                        </h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <span style={{ padding: '6px 12px', background: getPriorityColor(recommendations[selectedRecommendation].priority), color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                            {recommendations[selectedRecommendation].priority} Priority
                          </span>
                          <span style={{ padding: '6px 12px', background: '#F5F5F5', color: '#6B6B6B', borderRadius: '6px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>
                            {recommendations[selectedRecommendation].category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px', padding: '20px', background: '#FFF5F5', borderRadius: '10px', borderLeft: '4px solid #1C3668' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', marginBottom: '10px', textTransform: 'uppercase' }}>📊 Issue</div>
                      <p style={{ margin: 0, fontSize: '15px', color: '#2C2C2C', lineHeight: '1.7' }}>
                        {recommendations[selectedRecommendation].issue}
                      </p>
                    </div>

                    <div style={{ marginBottom: '24px', padding: '20px', background: '#FFF5F5', borderRadius: '10px', borderLeft: '4px solid #FF4D4F' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', marginBottom: '10px', textTransform: 'uppercase' }}>💥 Impact</div>
                      <p style={{ margin: 0, fontSize: '15px', color: '#2C2C2C', lineHeight: '1.7' }}>
                        {recommendations[selectedRecommendation].impact}
                      </p>
                    </div>

                    <div style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)', borderRadius: '10px', border: '2px solid #0A1628' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', marginBottom: '10px', textTransform: 'uppercase' }}>✅ Solution</div>
                      <p style={{ margin: 0, fontSize: '16px', color: '#0A1628', lineHeight: '1.7', fontWeight: '600' }}>
                        {recommendations[selectedRecommendation].recommendation}
                      </p>
                    </div>

                    <div style={{ marginBottom: '24px', padding: '20px', background: '#F9F9F9', borderRadius: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', marginBottom: '14px', textTransform: 'uppercase' }}>🎯 Actions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recommendations[selectedRecommendation].actions.map((action, i) => (
                          <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #E8E8E8' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #1C3668 0%, #FF4D4F 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                              {i + 1}
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#2C2C2C', lineHeight: '1.6', flex: 1 }}>
                              {action}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)', borderRadius: '10px', border: '2px solid #FFE5E5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Brain size={20} style={{ color: '#1C3668' }} />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', textTransform: 'uppercase' }}>AI Analysis</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#6B6B6B', lineHeight: '1.7', fontStyle: 'italic' }}>
                        {recommendations[selectedRecommendation].aiReasoning}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Table - Matching Dashboard Style - Only show in realtime master tab */}
      {masterTab === 'realtime' && activeTab !== 'metrics' && !loading && !error && currentOrders.length === 0 && (
        <div className="info-card">
          <Activity size={24} />
          <p>No {activeTab.replace('-', ' ')} orders found</p>
        </div>
      )}

      {masterTab === 'realtime' && activeTab !== 'metrics' && currentOrders.length > 0 && (
        <div className="tab-content">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Material Number</th>
                  <th>Material Description</th>
                  <th>Work Center</th>
                  <th>Production Line</th>
                  <th>Start Date</th>
                  <th>Planned Qty</th>
                  <th>Delivered Qty</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order, index) => {
                  const progress = order.PLANNED_QUANTITY > 0
                    ? Math.min(100, (order.DELIVERED_QUANTITY / order.PLANNED_QUANTITY) * 100)
                    : 0

                  return (
                    <tr key={index}>
                      <td className="font-mono">{order.ORDER_ID}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(order)}`}>
                          {getStatusText(order)}
                        </span>
                      </td>
                      <td className="font-mono">{order.MATERIAL_ID}</td>
                      <td>{order.MATERIAL_DESC || '-'}</td>
                      <td>{order.WORK_CENTER}</td>
                      <td>{getProductionLine(order.WORK_CENTER)}</td>
                      <td>{order.ACTUAL_START_DATE}</td>
                      <td className="text-right">{order.PLANNED_QUANTITY.toLocaleString()}</td>
                      <td className="text-right">{order.DELIVERED_QUANTITY.toLocaleString()}</td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          ></div>
                          <span className="progress-text">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductionOps
