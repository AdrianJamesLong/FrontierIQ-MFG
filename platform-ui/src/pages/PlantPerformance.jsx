import { useState, useEffect } from 'react'
import { Target, TrendingUp, Clock, AlertCircle, CheckCircle, RefreshCw, Gauge, Award, BarChart3, Factory, Database } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const COLORS = ['#0A1628', '#152B55', '#1C3668', '#FF4D4F', '#FFE5E5', '#6B6B6B', '#9B9B9B', '#C0C0C0']

// Line mapping configuration
const LINE_MAPPING = {
  'CPL-R01': 'Reactor Line 1',
  'CPL-R02': 'Reactor Line 2',
  'CPL-B01': 'Batch Line 1',
  'CPL-F01': 'Filling Line 1'
}

// Helper function to get display label for a line
const getLineLabel = (workCenter) => {
  if (!workCenter) return workCenter
  return LINE_MAPPING[workCenter] || workCenter
}

// Helper function to get sort order for lines
const getLineSortOrder = (lineLabel) => {
  const order = {
    'LINE 01': 1,
    'LINE 02': 2,
    'LINE 03': 3,
    'LINE 04': 4
  }
  return order[lineLabel] || 999
}

// Sort function for line data
const sortByLineOrder = (a, b) => {
  return getLineSortOrder(a.lineLabel) - getLineSortOrder(b.lineLabel)
}

function PlantPerformance() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [productionData, setProductionData] = useState([])
  const [runratesData, setRunratesData] = useState([])
  const [downtimeData, setDowntimeData] = useState([])
  const [unconstrainedRunratesData, setUnconstrainedRunratesData] = useState([])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [productionRes, runratesRes, downtimeRes, unconstrainedRes] = await Promise.all([
        fetch(`${API_URL}/api/data`),
        fetch(`${API_URL}/api/runrates`),
        fetch(`${API_URL}/api/downtime`),
        fetch(`${API_URL}/api/unconstrained-runrates`)
      ])

      if (!productionRes.ok || !runratesRes.ok || !downtimeRes.ok || !unconstrainedRes.ok) {
        throw new Error('Failed to fetch data from one or more endpoints')
      }

      const [production, runrates, downtime, unconstrained] = await Promise.all([
        productionRes.json(),
        runratesRes.json(),
        downtimeRes.json(),
        unconstrainedRes.json()
      ])

      setProductionData(production.data || [])
      setRunratesData(runrates.data || [])
      setDowntimeData(downtime.data || [])
      setUnconstrainedRunratesData(unconstrained.data || [])
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate OEE and performance metrics
  const calculateMetrics = () => {
    if (productionData.length === 0) {
      return {
        overallOEE: 0,
        availability: 0,
        performance: 0,
        quality: 0,
        linePerformance: [],
        materialPerformance: [],
        adherenceMetrics: {},
        downtimeAnalysis: [],
        targetComparison: []
      }
    }

    // Helper function to extract line number from WORK_CENTER (e.g., "CPL-B01" -> 3)
    const extractLineNumber = (workCenter) => {
      if (!workCenter) return null
      const match = workCenter.match(/\d+$/)
      return match ? parseInt(match[0]) : null
    }

    // Create lookup maps - Runrates uses LINE (number) and MATERIAL (number)
    const runrateMap = {}
    runratesData.forEach(rr => {
      const lineNum = rr.LINE
      const materialNum = rr.MATERIAL
      const key = `${materialNum}_${lineNum}`
      runrateMap[key] = rr.CASES_PH || 0
    })

    // UnconstrainedRunrates uses Line (number) and "Unconstrained Run Rate"
    const unconstrainedMap = {}
    unconstrainedRunratesData.forEach(ur => {
      const lineNum = ur.Line
      unconstrainedMap[lineNum] = ur['Unconstrained Run Rate'] || 0
    })

    // Downtime uses Line (number)
    const downtimeMap = {}
    downtimeData.forEach(dt => {
      const lineNum = dt.Line
      if (!downtimeMap[lineNum]) {
        downtimeMap[lineNum] = []
      }
      downtimeMap[lineNum].push({
        reason: dt.CIP || 'Unknown',
        duration: dt.Duration || 0
      })
    })

    // Calculate line-level performance
    const lineStats = {}
    productionData.forEach(order => {
      const workCenter = order.WORK_CENTER
      if (!workCenter) return

      const lineNum = extractLineNumber(workCenter)
      if (!lineNum) return

      if (!lineStats[workCenter]) {
        lineStats[workCenter] = {
          line: workCenter,
          lineLabel: getLineLabel(workCenter),
          lineNumber: lineNum,
          totalOrders: 0,
          completedOrders: 0,
          plannedQuantity: 0,
          deliveredQuantity: 0,
          plannedTime: 0,
          actualTime: 0,
          targetRunrate: 0,
          actualRunrate: 0,
          maxRunrate: unconstrainedMap[lineNum] || 0,
          downtimeTotal: 0
        }
      }

      lineStats[workCenter].totalOrders++
      if (order.DELIVERED_QUANTITY > 0) {
        lineStats[workCenter].completedOrders++
      }
      // Use PLANNED_QUANTITY not PLANNED_ORDER_QUANTITY
      lineStats[workCenter].plannedQuantity += order.PLANNED_QUANTITY || 0
      lineStats[workCenter].deliveredQuantity += order.DELIVERED_QUANTITY || 0

      // Calculate time - dates are in DD/MM/YYYY format
      if (order.SCHEDULED_START_DATE && order.ACTUAL_FINISH_DATE) {
        try {
          const parseDate = (dateStr) => {
            const parts = dateStr.split('/')
            if (parts.length === 3) {
              return new Date(parts[2], parts[1] - 1, parts[0])
            }
            return new Date(dateStr)
          }

          const scheduledStart = parseDate(order.SCHEDULED_START_DATE)
          const actualFinish = parseDate(order.ACTUAL_FINISH_DATE)
          const actualHours = (actualFinish - scheduledStart) / (1000 * 60 * 60)
          if (actualHours > 0 && actualHours < 168) { // Less than a week
            lineStats[workCenter].actualTime += actualHours
          }
        } catch (e) {
          console.error('Date parsing error:', e)
        }
      }

      // Get target runrate - need to match MATERIAL (number) from runrates with MATERIAL_ID (string) from production
      const materialNum = parseInt(order.MATERIAL_ID)
      const runrateKey = `${materialNum}_${lineNum}`
      const targetRunrate = runrateMap[runrateKey] || 0
      if (targetRunrate > 0) {
        lineStats[workCenter].targetRunrate = Math.max(lineStats[workCenter].targetRunrate, targetRunrate)
      }

      // Calculate downtime for this line
      if (downtimeMap[lineNum]) {
        lineStats[workCenter].downtimeTotal = downtimeMap[lineNum].reduce((sum, dt) => sum + dt.duration, 0) / 60 // Convert to hours
      }
    })

    // Calculate OEE components for each line
    // NOTE: Downtime represents STANDARD planned downtime (CIP cleaning, changeovers) between orders
    // Runrates represent POTENTIAL run rates per hour for materials
    // UnconstrainedRunrates represent THEORETICAL maximum line speeds
    const linePerformance = Object.values(lineStats).map(line => {
      // AVAILABILITY = Uptime after accounting for standard planned downtime (CIP, changeovers)
      // Planned Time includes both production time and standard downtime between orders
      const totalPlannedTime = line.actualTime + line.downtimeTotal
      const availability = totalPlannedTime > 0 ? ((totalPlannedTime - line.downtimeTotal) / totalPlannedTime) * 100 : 0

      // PERFORMANCE = Actual Output vs Target (using potential runrates from Runrates table)
      // Target output is based on potential runrate × actual production time
      const targetOutput = line.targetRunrate > 0 && line.actualTime > 0
        ? line.targetRunrate * line.actualTime
        : line.plannedQuantity
      const performance = targetOutput > 0 ? (line.deliveredQuantity / targetOutput) * 100 : 0

      // QUALITY = Good Units / Total Units produced
      // Assumes delivered quantity represents good/acceptable units
      const quality = line.plannedQuantity > 0 ? (line.deliveredQuantity / line.plannedQuantity) * 100 : 0

      // OEE = Availability × Performance × Quality (World Class OEE = 85%+)
      const oee = (availability * performance * quality) / 10000

      // SCHEDULE ADHERENCE = Percentage of orders completed
      const adherence = line.totalOrders > 0 ? (line.completedOrders / line.totalOrders) * 100 : 0

      // UTILIZATION = Actual runrate vs theoretical maximum capacity
      // Compares actual achieved rate against unconstrained (theoretical max) runrate
      const actualRunrate = line.actualTime > 0 ? line.deliveredQuantity / line.actualTime : 0
      const utilization = line.maxRunrate > 0 ? (actualRunrate / line.maxRunrate) * 100 : 0

      return {
        line: line.line,
        lineLabel: line.lineLabel,
        oee: Math.min(oee, 100),
        availability: Math.min(availability, 100),
        performance: Math.min(performance, 100),
        quality: Math.min(quality, 100),
        adherence: Math.min(adherence, 100),
        utilization: Math.min(utilization, 100),
        targetRunrate: line.targetRunrate,  // Potential runrate from Runrates table
        actualRunrate: actualRunrate,        // Actual achieved runrate
        maxRunrate: line.maxRunrate,         // Theoretical maximum from UnconstrainedRunrates
        downtimeHours: line.downtimeTotal,   // Standard planned downtime (CIP, changeovers)
        completedOrders: line.completedOrders,
        totalOrders: line.totalOrders
      }
    })

    // Calculate overall OEE
    const avgOEE = linePerformance.length > 0
      ? linePerformance.reduce((sum, l) => sum + l.oee, 0) / linePerformance.length
      : 0

    const avgAvailability = linePerformance.length > 0
      ? linePerformance.reduce((sum, l) => sum + l.availability, 0) / linePerformance.length
      : 0

    const avgPerformance = linePerformance.length > 0
      ? linePerformance.reduce((sum, l) => sum + l.performance, 0) / linePerformance.length
      : 0

    const avgQuality = linePerformance.length > 0
      ? linePerformance.reduce((sum, l) => sum + l.quality, 0) / linePerformance.length
      : 0

    // Material performance
    const materialStats = {}
    productionData.forEach(order => {
      const material = order.MATERIAL_ID
      if (!material) return

      if (!materialStats[material]) {
        materialStats[material] = {
          material: material,
          description: order.MATERIAL_DESC || 'Unknown',
          plannedQuantity: 0,
          deliveredQuantity: 0,
          orders: 0
        }
      }

      materialStats[material].orders++
      materialStats[material].plannedQuantity += order.PLANNED_QUANTITY || 0
      materialStats[material].deliveredQuantity += order.DELIVERED_QUANTITY || 0
    })

    const materialPerformance = Object.values(materialStats)
      .map(mat => ({
        ...mat,
        fulfillment: mat.plannedQuantity > 0 ? (mat.deliveredQuantity / mat.plannedQuantity) * 100 : 0
      }))
      .sort((a, b) => b.deliveredQuantity - a.deliveredQuantity)
      .slice(0, 10)

    // Downtime analysis by line - downtimeMap keys are line numbers, we need to show work centers
    const downtimeAnalysis = Object.entries(downtimeMap).map(([lineNum, incidents]) => {
      // Find a work center that matches this line number
      const workCenter = Object.values(lineStats).find(ls => ls.lineNumber === parseInt(lineNum))
      return {
        line: workCenter ? workCenter.line : `Line ${lineNum}`,
        lineLabel: workCenter ? workCenter.lineLabel : `Line ${lineNum}`,
        totalDowntime: incidents.reduce((sum, dt) => sum + dt.duration, 0),
        incidents: incidents.length,
        avgIncidentDuration: incidents.length > 0 ? incidents.reduce((sum, dt) => sum + dt.duration, 0) / incidents.length : 0,
        topReason: incidents.length > 0 ? incidents.sort((a, b) => b.duration - a.duration)[0].reason : 'N/A'
      }
    }).sort((a, b) => b.totalDowntime - a.totalDowntime)

    // Target vs Actual comparison
    const targetComparison = linePerformance.map(line => ({
      line: line.line,
      lineLabel: line.lineLabel,
      target: line.targetRunrate,
      actual: line.actualRunrate,
      max: line.maxRunrate,
      gap: line.targetRunrate - line.actualRunrate,
      gapPercent: line.targetRunrate > 0 ? ((line.targetRunrate - line.actualRunrate) / line.targetRunrate) * 100 : 0
    }))

    return {
      overallOEE: avgOEE,
      availability: avgAvailability,
      performance: avgPerformance,
      quality: avgQuality,
      linePerformance: linePerformance.sort(sortByLineOrder),
      materialPerformance,
      downtimeAnalysis: downtimeAnalysis.sort(sortByLineOrder),
      targetComparison: targetComparison.sort(sortByLineOrder),
      totalLines: linePerformance.length,
      totalMaterials: Object.keys(materialStats).length
    }
  }

  const metrics = calculateMetrics()

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>Plant Performance Insights</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            OEE, Targets, Adherence & Standards Analysis
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchAllData}
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
            OEE: {metrics.overallOEE.toFixed(1)}%
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading performance data...</p>
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
          {/* Overall OEE Score - Compact */}
          <div className="chart-card" style={{ marginBottom: '12px', padding: '12px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Overall OEE</div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: metrics.overallOEE >= 85 ? '#22c55e' : metrics.overallOEE >= 70 ? COLORS[1] : metrics.overallOEE >= 50 ? '#f59e0b' : '#ef4444'
                  }}>
                    {metrics.overallOEE.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
                    {metrics.overallOEE >= 85 ? 'World Class' : metrics.overallOEE >= 70 ? 'Good' : 'Fair'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Availability</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: COLORS[1] }}>{metrics.availability.toFixed(1)}%</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>Excl. Std Downtime</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Performance</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: COLORS[1] }}>{metrics.performance.toFixed(1)}%</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>vs Potential Rate</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Quality</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: COLORS[1] }}>{metrics.quality.toFixed(1)}%</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>Fulfillment</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container" style={{ marginBottom: '8px', padding: '4px', gap: '6px' }}>
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'line-performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('line-performance')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Line Performance
            </button>
            <button
              className={`tab-button ${activeTab === 'targets' ? 'active' : ''}`}
              onClick={() => setActiveTab('targets')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Targets & Adherence
            </button>
            <button
              className={`tab-button ${activeTab === 'downtime' ? 'active' : ''}`}
              onClick={() => setActiveTab('downtime')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Downtime Analysis
            </button>
            <button
              className={`tab-button ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Material Performance
            </button>
            <button
              className={`tab-button ${activeTab === 'data-sources' ? 'active' : ''}`}
              onClick={() => setActiveTab('data-sources')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Database size={12} /> Data Sources
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="stats-grid" style={{ marginBottom: '8px', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Factory size={16} style={{ color: COLORS[1] }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>PRODUCTION LINES</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{metrics.totalLines}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Active lines</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <BarChart3 size={16} style={{ color: COLORS[1] }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>MATERIALS</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{metrics.totalMaterials}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Unique types</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Gauge size={16} style={{ color: COLORS[1] }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>AVG LINE OEE</span>
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    marginBottom: '4px',
                    color: metrics.overallOEE >= 85 ? '#22c55e' : metrics.overallOEE >= 70 ? COLORS[1] : '#f59e0b'
                  }}>
                    {metrics.overallOEE.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>All lines</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Clock size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>STD DOWNTIME</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                    {metrics.downtimeAnalysis.reduce((sum, dt) => sum + dt.totalDowntime, 0).toFixed(0)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Planned (CIP/CO)</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>OEE BY LINE</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Equipment effectiveness per line</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={metrics.linePerformance}
                      margin={{ top: 5, right: 8, left: -5, bottom: 35 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="lineLabel"
                        angle={-45}
                        textAnchor="end"
                        height={40}
                        style={{ fontSize: '9px' }}
                      />
                      <YAxis domain={[0, 100]} style={{ fontSize: '10px' }} width={30} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="oee" fill={COLORS[1]} name="OEE %" maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>OEE COMPONENTS</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Availability, Performance, Quality</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={metrics.linePerformance.slice(0, 6)}
                      margin={{ top: 5, right: 8, left: -5, bottom: 35 }}
                      barGap={1}
                      barCategoryGap="10%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="lineLabel"
                        angle={-45}
                        textAnchor="end"
                        height={40}
                        style={{ fontSize: '9px' }}
                      />
                      <YAxis domain={[0, 100]} style={{ fontSize: '10px' }} width={30} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} contentStyle={{ fontSize: '10px' }} />
                      <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }} iconSize={7} />
                      <Bar dataKey="availability" fill="#22c55e" name="Availability" radius={[2, 2, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="performance" fill={COLORS[1]} name="Performance" radius={[2, 2, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="quality" fill="#f59e0b" name="Quality" radius={[2, 2, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Line Performance Tab */}
          {activeTab === 'line-performance' && (
            <div className="tab-content">
              <div className="chart-card" style={{ marginBottom: '12px' }}>
                <h4>PRODUCTION LINE PERFORMANCE SCORECARD</h4>
                <p className="chart-subtitle">Comprehensive metrics for all production lines</p>
                <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '16px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>OEE</th>
                        <th>Availability</th>
                        <th>Performance</th>
                        <th>Quality</th>
                        <th>Utilization</th>
                        <th>Adherence</th>
                        <th>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.linePerformance.map((line, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{line.lineLabel}</td>
                          <td className="text-center">
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: line.oee >= 85 ? '#dcfce7' : line.oee >= 70 ? '#fef3c7' : '#fee2e2',
                              color: line.oee >= 85 ? '#15803d' : line.oee >= 70 ? '#92400e' : '#991b1b'
                            }}>
                              {line.oee.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-right">{line.availability.toFixed(1)}%</td>
                          <td className="text-right">{line.performance.toFixed(1)}%</td>
                          <td className="text-right">{line.quality.toFixed(1)}%</td>
                          <td className="text-right">{line.utilization.toFixed(1)}%</td>
                          <td className="text-right">{line.adherence.toFixed(1)}%</td>
                          <td className="text-center">{line.completedOrders}/{line.totalOrders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="chart-card">
                  <h4>LINE UTILIZATION VS THEORETICAL MAX</h4>
                  <p className="chart-subtitle">Actual runrate vs unconstrained capacity</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={metrics.linePerformance}
                      margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="lineLabel"
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis domain={[0, 100]} style={{ fontSize: '11px' }} width={35} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="utilization" fill={COLORS[1]} name="Utilization %" maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h4>SCHEDULE ADHERENCE BY LINE</h4>
                  <p className="chart-subtitle">Percentage of orders completed on schedule</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={metrics.linePerformance}
                      margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="lineLabel"
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis domain={[0, 100]} style={{ fontSize: '11px' }} width={35} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="adherence" fill="#22c55e" name="Adherence %" maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Targets & Adherence Tab */}
          {activeTab === 'targets' && (
            <div className="tab-content">
              <div className="chart-card" style={{ marginBottom: '12px' }}>
                <h4>RUNRATE COMPARISON: ACTUAL VS POTENTIAL VS MAX</h4>
                <p className="chart-subtitle">Actual achieved vs potential target vs theoretical maximum (unconstrained)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={metrics.targetComparison}
                    margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                    barGap={2}
                    barCategoryGap="12%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="lineLabel"
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      style={{ fontSize: '10px' }}
                    />
                    <YAxis style={{ fontSize: '11px' }} width={40} />
                    <Tooltip
                      formatter={(value) => value.toLocaleString()}
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                    <Bar dataKey="max" fill="#e5e7eb" name="Theoretical Max" radius={[3, 3, 0, 0]} maxBarSize={35} />
                    <Bar dataKey="target" fill={COLORS[1]} name="Potential Target" radius={[3, 3, 0, 0]} maxBarSize={35} />
                    <Bar dataKey="actual" fill="#22c55e" name="Actual Achieved" radius={[3, 3, 0, 0]} maxBarSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h4>PERFORMANCE GAP ANALYSIS</h4>
                <p className="chart-subtitle">Gap between potential target and actual achieved performance</p>
                <div className="table-container" style={{ marginTop: '16px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Potential Target</th>
                        <th>Actual Achieved</th>
                        <th>Theoretical Max</th>
                        <th>Gap</th>
                        <th>Gap %</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.targetComparison.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{item.lineLabel}</td>
                          <td className="text-right">{item.target.toFixed(0)}</td>
                          <td className="text-right">{item.actual.toFixed(0)}</td>
                          <td className="text-right">{item.max.toFixed(0)}</td>
                          <td className="text-right" style={{
                            color: item.gap > 0 ? '#ef4444' : '#22c55e',
                            fontWeight: '600'
                          }}>
                            {item.gap.toFixed(0)}
                          </td>
                          <td className="text-right" style={{
                            color: item.gapPercent > 10 ? '#ef4444' : item.gapPercent > 5 ? '#f59e0b' : '#22c55e',
                            fontWeight: '600'
                          }}>
                            {item.gapPercent.toFixed(1)}%
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: item.gapPercent <= 5 ? '#dcfce7' : item.gapPercent <= 10 ? '#fef3c7' : '#fee2e2',
                              color: item.gapPercent <= 5 ? '#15803d' : item.gapPercent <= 10 ? '#92400e' : '#991b1b'
                            }}>
                              {item.gapPercent <= 5 ? 'ON TARGET' : item.gapPercent <= 10 ? 'CLOSE' : 'BELOW TARGET'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Downtime Analysis Tab */}
          {activeTab === 'downtime' && (
            <div className="tab-content">
              <div className="stats-grid" style={{ marginBottom: '12px', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Clock size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>STANDARD DOWNTIME</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', marginBottom: '4px' }}>
                    {metrics.downtimeAnalysis.reduce((sum, dt) => sum + dt.totalDowntime, 0).toFixed(0)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Minutes (CIP, Changeover)</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <AlertCircle size={16} style={{ color: COLORS[1] }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                    {metrics.downtimeAnalysis.reduce((sum, dt) => sum + dt.incidents, 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Planned operations</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Clock size={16} style={{ color: COLORS[1] }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>AVG DURATION</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                    {metrics.downtimeAnalysis.length > 0
                      ? (metrics.downtimeAnalysis.reduce((sum, dt) => sum + dt.avgIncidentDuration, 0) / metrics.downtimeAnalysis.length).toFixed(0)
                      : 0
                    }
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Minutes per event</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Factory size={16} style={{ color: COLORS[1] }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>LINES WITH STD DT</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{metrics.downtimeAnalysis.length}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Production lines</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="chart-card">
                  <h4>STANDARD DOWNTIME BY LINE</h4>
                  <p className="chart-subtitle">Planned downtime (CIP, changeovers) per line</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={metrics.downtimeAnalysis}
                      margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="lineLabel"
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis style={{ fontSize: '11px' }} width={35} />
                      <Tooltip />
                      <Bar dataKey="totalDowntime" fill="#f59e0b" name="Std Downtime (min)" maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h4>STANDARD DOWNTIME EVENTS BY LINE</h4>
                  <p className="chart-subtitle">Number of planned operations</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={metrics.downtimeAnalysis}
                      margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="lineLabel"
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis style={{ fontSize: '11px' }} width={30} />
                      <Tooltip />
                      <Bar dataKey="incidents" fill={COLORS[1]} name="Events" maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <h4>STANDARD DOWNTIME DETAILS</h4>
                <p className="chart-subtitle">Planned downtime breakdown by line (CIP, changeovers)</p>
                <div className="table-container" style={{ marginTop: '16px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Std Downtime (min)</th>
                        <th>Events</th>
                        <th>Avg Duration (min)</th>
                        <th>Primary Type</th>
                        <th>Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.downtimeAnalysis.map((dt, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{dt.lineLabel}</td>
                          <td className="text-right" style={{ color: '#f59e0b', fontWeight: '600' }}>
                            {dt.totalDowntime.toFixed(0)}
                          </td>
                          <td className="text-center">{dt.incidents}</td>
                          <td className="text-right">{dt.avgIncidentDuration.toFixed(0)}</td>
                          <td style={{ fontSize: '12px' }}>{dt.topReason}</td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: dt.totalDowntime > 120 ? '#fef3c7' : dt.totalDowntime > 60 ? '#e0e7ff' : '#dcfce7',
                              color: dt.totalDowntime > 120 ? '#92400e' : dt.totalDowntime > 60 ? '#3730a3' : '#15803d'
                            }}>
                              {dt.totalDowntime > 120 ? 'HIGH' : dt.totalDowntime > 60 ? 'MEDIUM' : 'LOW'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Material Performance Tab */}
          {activeTab === 'materials' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '12px' }}>
                <div className="chart-card">
                  <h4>TOP MATERIALS BY VOLUME</h4>
                  <p className="chart-subtitle">Planned vs Delivered quantities</p>
                  <ResponsiveContainer width="100%" height={420}>
                    <BarChart
                      data={metrics.materialPerformance.slice(0, 8)}
                      margin={{ top: 5, right: 15, left: 5, bottom: 70 }}
                      barGap={3}
                      barCategoryGap="15%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="material"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        style={{ fontSize: '11px', fontWeight: '500' }}
                        interval={0}
                      />
                      <YAxis
                        style={{ fontSize: '11px' }}
                        tickFormatter={(value) => (value / 1000).toFixed(0) + 'k'}
                        width={42}
                        domain={[0, 'auto']}
                        allowDataOverflow={false}
                      />
                      <Tooltip
                        formatter={(value, name) => [value.toLocaleString() + ' units', name]}
                        contentStyle={{ fontSize: '11px', padding: '6px' }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                        iconSize={9}
                      />
                      <Bar dataKey="plannedQuantity" fill="#9B9B9B" name="Planned" radius={[3, 3, 0, 0]} maxBarSize={48} />
                      <Bar dataKey="deliveredQuantity" fill={COLORS[1]} name="Delivered" radius={[3, 3, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h4>MATERIAL FULFILLMENT RATES</h4>
                  <p className="chart-subtitle">Delivered vs planned quantity by material</p>
                  <div className="table-container" style={{ marginTop: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Material ID</th>
                        <th>Description</th>
                        <th>Orders</th>
                        <th>Planned</th>
                        <th>Delivered</th>
                        <th>Fulfillment %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.materialPerformance.map((mat, idx) => (
                        <tr key={idx}>
                          <td className="font-mono" style={{ fontSize: '12px' }}>{mat.material}</td>
                          <td style={{ fontSize: '12px' }}>{mat.description}</td>
                          <td className="text-center">{mat.orders}</td>
                          <td className="text-right">{mat.plannedQuantity.toLocaleString()}</td>
                          <td className="text-right">{mat.deliveredQuantity.toLocaleString()}</td>
                          <td className="text-right">
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: mat.fulfillment >= 95 ? '#dcfce7' : mat.fulfillment >= 80 ? '#fef3c7' : '#fee2e2',
                              color: mat.fulfillment >= 95 ? '#15803d' : mat.fulfillment >= 80 ? '#92400e' : '#991b1b'
                            }}>
                              {mat.fulfillment.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Data Sources Tab */}
          {activeTab === 'data-sources' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="chart-card">
                  <h4>FABRIC LAKEHOUSE DATA SOURCES</h4>
                  <p className="chart-subtitle">This section uses data from multiple tables in the Fabric Lakehouse</p>

                  <div style={{ marginTop: '20px', display: 'grid', gap: '16px' }}>
                    {/* Production Schedule Data */}
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Factory size={20} style={{ color: COLORS[1] }} />
                        <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>sap_production_orders Table</h5>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.6' }}>
                        <strong>Source:</strong> SAP Production Orders<br />
                        <strong>Purpose:</strong> Core production order data used for OEE calculations and performance metrics
                      </p>
                      <div style={{ background: 'white', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                        <strong>Key Fields Used:</strong>
                        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                          <li><code>ORDER_ID</code> - Production order identifier</li>
                          <li><code>WORK_CENTER</code> - Line assignment (CPL-R01, CPL-R02, CPL-B01, CPL-F01)</li>
                          <li><code>MATERIAL_ID</code> - Product/SKU identifier</li>
                          <li><code>PLANNED_QUANTITY</code> - Target production quantity</li>
                          <li><code>DELIVERED_QUANTITY</code> - Actual production quantity</li>
                          <li><code>SCHEDULED_START_DATE</code> - Planned start date/time</li>
                          <li><code>ACTUAL_START_DATE</code> - Actual start date/time</li>
                        </ul>
                      </div>
                    </div>

                    {/* Runrates Data */}
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Gauge size={20} style={{ color: COLORS[1] }} />
                        <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Runrates Table</h5>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.6' }}>
                        <strong>Source:</strong> Production standards database<br />
                        <strong>Purpose:</strong> Standard run rates for each material on each line (cases per hour)
                      </p>
                      <div style={{ background: 'white', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                        <strong>Key Fields Used:</strong>
                        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                          <li><code>LINE</code> - Production line number (1, 2, 3, 4)</li>
                          <li><code>MATERIAL</code> - Product/SKU identifier</li>
                          <li><code>CASES_PH</code> - Standard rate in cases per hour</li>
                        </ul>
                      </div>
                      <div style={{ marginTop: '12px', padding: '10px', background: '#fff7ed', borderLeft: '3px solid #f59e0b', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
                          <strong>Performance Calculation:</strong> Compares actual production speed against these standard rates
                        </p>
                      </div>
                    </div>

                    {/* Unconstrained Runrates Data */}
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <TrendingUp size={20} style={{ color: COLORS[1] }} />
                        <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>UnconstrainedRunrates Table</h5>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.6' }}>
                        <strong>Source:</strong> Engineering specifications<br />
                        <strong>Purpose:</strong> Maximum theoretical capacity for each line (unconstrained by material)
                      </p>
                      <div style={{ background: 'white', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                        <strong>Key Fields Used:</strong>
                        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                          <li><code>Line</code> - Production line number (1, 2, 3, 4)</li>
                          <li><code>Unconstrained Run Rate</code> - Maximum theoretical rate</li>
                        </ul>
                      </div>
                      <div style={{ marginTop: '12px', padding: '10px', background: '#ecfdf5', borderLeft: '3px solid #10b981', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#065f46' }}>
                          <strong>Target Comparison:</strong> Used to benchmark potential vs actual performance
                        </p>
                      </div>
                    </div>

                    {/* Downtime Data */}
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Clock size={20} style={{ color: COLORS[1] }} />
                        <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Downtime Table</h5>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.6' }}>
                        <strong>Source:</strong> Maintenance and operations logs<br />
                        <strong>Purpose:</strong> Tracks standard downtime events (CIP, changeovers, scheduled maintenance)
                      </p>
                      <div style={{ background: 'white', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                        <strong>Key Fields Used:</strong>
                        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                          <li><code>Line</code> - Production line number (1, 2, 3, 4)</li>
                          <li><code>CIP</code> - Clean-in-Place or downtime reason</li>
                          <li><code>Duration</code> - Downtime duration in minutes</li>
                        </ul>
                      </div>
                      <div style={{ marginTop: '12px', padding: '10px', background: '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#991b1b' }}>
                          <strong>Availability Calculation:</strong> Standard downtime is excluded from availability calculations per OEE best practices
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)', border: '2px solid #1C3668', borderRadius: '8px' }}>
                    <h5 style={{ margin: 0, marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#0A1628' }}>How It Works</h5>
                    <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: '1.8' }}>
                      <p style={{ margin: 0, marginBottom: '8px' }}>
                        <strong>1. OEE Calculation:</strong> Combines SAP order data with standard rates and downtime to calculate Availability × Performance × Quality
                      </p>
                      <p style={{ margin: 0, marginBottom: '8px' }}>
                        <strong>2. Availability:</strong> (Actual Start Time vs Scheduled Start Time) minus standard downtime events
                      </p>
                      <p style={{ margin: 0, marginBottom: '8px' }}>
                        <strong>3. Performance:</strong> (Actual Production Rate / Standard Run Rate) from Runrates table
                      </p>
                      <p style={{ margin: 0, marginBottom: '8px' }}>
                        <strong>4. Target Adherence:</strong> Compares delivered quantities against planned quantities from production orders
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>5. Line Comparison:</strong> Uses unconstrained rates to benchmark each line against its theoretical maximum capacity
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PlantPerformance
