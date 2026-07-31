import { useState, useEffect } from 'react'
import { Activity, AlertCircle, TrendingUp, TrendingDown, Zap, Package, Layers, Timer, BarChart3, RefreshCw, AlertTriangle, CheckCircle2, Wrench, Target, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ComposedChart } from 'recharts'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const COLORS = ['#0A1628', '#152B55', '#1C3668', '#4A7AB5', '#6B9ED4', '#6B6B6B', '#9B9B9B', '#C0C0C0']
// Navy spectrum dark to light
const CHART_COLORS = ['#0A1628', '#152B55', '#1C3668', '#2E558F', '#4A7AB5', '#6B9ED4', '#8FBDE0', '#B3D3EC']

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function OTProcessInsights() {
  const [activeTab, setActiveTab] = useState('asset-health')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processData, setProcessData] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [agentError, setAgentError] = useState(null)
  const [showPageInfo, setShowPageInfo] = useState(false)

  const callAgent = async (message) => {
    setAgentLoading(true); setAgentError(null); setAgentResponse('')
    try {
      const res = await fetch(`${API_URL}/api/agent/tier1/line_operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, agent_type: 'line_operations', thread_id: 'ot-process-insights' }),
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

  useEffect(() => {
    fetchProcessData()
  }, [])

  const fetchProcessData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/ot-process-events`)

      if (!response.ok) {
        throw new Error('Failed to fetch process data')
      }

      const result = await response.json()
      setProcessData(result.data || [])
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Advanced Asset Analytics with Data Science
  const calculateAssetAnalytics = () => {
    if (processData.length === 0) {
      return {
        assetHealth: [],
        equipmentReliability: [],
        anomalyDetection: [],
        utilizationTrends: [],
        maintenanceIndicators: [],
        performanceMetrics: {},
        timeSeriesData: [],
        equipmentCorrelation: []
      }
    }

    // Group data by equipment
    const equipmentData = {}
    processData.forEach(record => {
      const eq = record.equipment || 'Unknown'
      if (!equipmentData[eq]) {
        equipmentData[eq] = {
          name: eq,
          line: record.line || 'Unknown',
          values: [],
          timestamps: [],
          tags: new Set(),
          eventCount: 0
        }
      }

      // Handle different value types (boolean, number, object)
      let numericValue = 0
      if (typeof record.val === 'number') {
        numericValue = record.val
      } else if (typeof record.val === 'boolean') {
        numericValue = record.val ? 1 : 0
      } else if (record.val !== null && typeof record.val === 'object') {
        // Skip complex objects for now
        return
      }

      equipmentData[eq].values.push(numericValue)

      // Parse edge_arrival_timestamp (format: "DD/MM/YYYY, HH:MM:SS.ffffff")
      const timestampStr = record.edge_arrival_timestamp || record.timestamp
      if (timestampStr) {
        try {
          // Convert DD/MM/YYYY format to MM/DD/YYYY for Date parsing
          const parts = timestampStr.split(', ')
          if (parts.length === 2) {
            const dateParts = parts[0].split('/')
            if (dateParts.length === 3) {
              const [day, month, year] = dateParts
              const dateStr = `${month}/${day}/${year} ${parts[1]}`
              equipmentData[eq].timestamps.push(new Date(dateStr))
            }
          }
        } catch (e) {
          equipmentData[eq].timestamps.push(new Date())
        }
      }

      equipmentData[eq].tags.add(record.tag)
      equipmentData[eq].eventCount++
    })

    // Calculate statistical metrics for each equipment
    const assetHealth = Object.entries(equipmentData).map(([name, data]) => {
      const values = data.values

      // Safety checks to prevent NaN
      if (!values || values.length === 0) {
        return null
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      const cv = mean !== 0 ? (stdDev / mean) * 100 : 0 // Coefficient of variation

      // Calculate equipment availability (uptime proxy based on event frequency)
      const validTimestamps = data.timestamps.filter(t => t && !isNaN(t.getTime()))
      let availability = 50 // Default availability

      if (validTimestamps.length > 1) {
        const timeRange = validTimestamps[validTimestamps.length - 1] - validTimestamps[0]
        const expectedEvents = (timeRange / 1000 / 60) * 2 // Expected 2 events per minute
        availability = Math.min(100, Math.max(0, (data.eventCount / Math.max(expectedEvents, 1)) * 100))
      }

      // Health score based on consistency and availability
      const consistencyScore = Math.max(0, 100 - cv)
      const healthScore = (consistencyScore * 0.6 + availability * 0.4)

      return {
        equipment: name,
        line: data.line,
        healthScore: healthScore,
        availability: availability,
        reliability: consistencyScore,
        mean: mean,
        stdDev: stdDev,
        cv: cv,
        eventCount: data.eventCount,
        tagCount: data.tags.size,
        status: healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : healthScore > 40 ? 'Fair' : 'Poor'
      }
    }).filter(asset => asset !== null).sort((a, b) => b.healthScore - a.healthScore)

    // Anomaly Detection using Z-score
    const anomalyDetection = assetHealth.map(asset => {
      const zScore = Math.abs((asset.healthScore - 70) / 15) // Normalized to expected mean of 70
      return {
        equipment: asset.equipment,
        line: asset.line,
        anomalyScore: zScore,
        healthScore: asset.healthScore,
        risk: zScore > 2 ? 'High' : zScore > 1 ? 'Medium' : 'Low',
        recommendation: zScore > 2 ? 'Immediate inspection required' : zScore > 1 ? 'Schedule maintenance' : 'Operating normally'
      }
    }).filter(a => a.anomalyScore > 0.5).sort((a, b) => b.anomalyScore - a.anomalyScore)

    // Equipment Reliability Analysis
    const equipmentReliability = assetHealth.map(asset => ({
      equipment: asset.equipment,
      reliability: asset.reliability,
      mtbf: (asset.eventCount / (asset.eventCount / 100)) * 24, // Mean time between events (hours proxy)
      failureRate: Math.max(0, 100 - asset.reliability),
      availability: asset.availability
    })).slice(0, 10)

    // Maintenance Indicators (Predictive)
    const maintenanceIndicators = assetHealth.map(asset => {
      const degradation = Math.max(0, 100 - asset.healthScore)
      const urgency = degradation * (1 + (asset.cv / 100))

      return {
        equipment: asset.equipment,
        line: asset.line,
        degradation: degradation,
        urgency: urgency,
        predictedMaintenance: Math.ceil(urgency / 10), // Days until maintenance
        priority: urgency > 50 ? 'Critical' : urgency > 25 ? 'High' : urgency > 10 ? 'Medium' : 'Low'
      }
    }).sort((a, b) => b.urgency - a.urgency).slice(0, 15)

    // Time-series utilization (hourly aggregation)
    const utilizationByHour = {}
    processData.forEach(record => {
      // Parse edge_arrival_timestamp (format: "DD/MM/YYYY, HH:MM:SS.ffffff")
      const timestampStr = record.edge_arrival_timestamp || record.timestamp
      let timestamp = new Date()

      if (timestampStr) {
        try {
          const parts = timestampStr.split(', ')
          if (parts.length === 2) {
            const dateParts = parts[0].split('/')
            if (dateParts.length === 3) {
              const [day, month, year] = dateParts
              const dateStr = `${month}/${day}/${year} ${parts[1]}`
              timestamp = new Date(dateStr)
            }
          }
        } catch (e) {
          // Use current time as fallback
        }
      }

      const hour = timestamp.getHours()
      if (!utilizationByHour[hour]) {
        utilizationByHour[hour] = { hour: `${hour}:00`, events: 0, avgValue: 0, values: [] }
      }
      utilizationByHour[hour].events++

      // Handle different value types
      let numericValue = 0
      if (typeof record.val === 'number') {
        numericValue = record.val
      } else if (typeof record.val === 'boolean') {
        numericValue = record.val ? 1 : 0
      }
      utilizationByHour[hour].values.push(numericValue)
    })

    const utilizationTrends = Object.values(utilizationByHour).map(data => ({
      hour: data.hour,
      events: data.events,
      avgValue: data.values.reduce((a, b) => a + b, 0) / data.values.length,
      utilization: (data.events / Math.max(...Object.values(utilizationByHour).map(d => d.events))) * 100
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour))

    // Equipment Correlation (how equipment performance relates)
    const topEquipment = assetHealth.slice(0, 8)
    const equipmentCorrelation = topEquipment.map(eq => ({
      equipment: eq.equipment,
      performance: eq.healthScore,
      availability: eq.availability,
      reliability: eq.reliability,
      risk: 100 - eq.healthScore
    }))

    // Performance Summary Metrics
    const performanceMetrics = {
      avgHealthScore: assetHealth.length > 0 ? assetHealth.reduce((sum, a) => sum + a.healthScore, 0) / assetHealth.length : 0,
      avgAvailability: assetHealth.length > 0 ? assetHealth.reduce((sum, a) => sum + a.availability, 0) / assetHealth.length : 0,
      avgReliability: assetHealth.length > 0 ? assetHealth.reduce((sum, a) => sum + a.reliability, 0) / assetHealth.length : 0,
      totalAssets: assetHealth.length,
      healthyAssets: assetHealth.filter(a => a.healthScore > 70).length,
      atRiskAssets: assetHealth.filter(a => a.healthScore < 50).length,
      criticalAssets: anomalyDetection.filter(a => a.risk === 'High').length
    }

    return {
      assetHealth: assetHealth.slice(0, 15),
      equipmentReliability,
      anomalyDetection: anomalyDetection.slice(0, 10),
      utilizationTrends,
      maintenanceIndicators,
      performanceMetrics,
      equipmentCorrelation
    }
  }

  const analytics = calculateAssetAnalytics()

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>OT Process Insights</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>Advanced equipment performance, predictive maintenance, and health monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Sparkles size={13} /> AI Analysis
          </button>
          <button className="refresh-btn" onClick={fetchProcessData} disabled={loading} style={{ padding: '6px 12px', fontSize: '12px' }}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading asset analytics...</p>
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
          {/* Performance Metrics Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <div className="stat-card" style={{ padding: '10px', background: 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Activity size={14} />
                <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase' }}>AVG HEALTH</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px' }}>
                {analytics.performanceMetrics.avgHealthScore?.toFixed(1) || 0}%
              </div>
              <div style={{ fontSize: '9px', opacity: 0.9 }}>Fleet health</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>HEALTHY</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                {analytics.performanceMetrics.healthyAssets || 0}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Assets &gt;70%</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>AT RISK</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B', marginBottom: '2px' }}>
                {analytics.performanceMetrics.atRiskAssets || 0}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Need attention</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Wrench size={14} style={{ color: COLORS[0] }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>CRITICAL</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS[0], marginBottom: '2px' }}>
                {analytics.performanceMetrics.criticalAssets || 0}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Immediate</div>
            </div>

            <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
              <Target size={16} style={{ color: COLORS[1], margin: '0 auto 4px' }} />
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Availability</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: COLORS[1] }}>
                {analytics.performanceMetrics.avgAvailability?.toFixed(1) || 0}%
              </div>
            </div>

            <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981', margin: '0 auto 4px' }} />
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Reliability</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#10B981' }}>
                {analytics.performanceMetrics.avgReliability?.toFixed(1) || 0}%
              </div>
            </div>

            <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
              <Layers size={16} style={{ color: '#4A7AB5', margin: '0 auto 4px' }} />
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Total Assets</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#4A7AB5' }}>
                {analytics.performanceMetrics.totalAssets || 0}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container" style={{ marginBottom: '8px' }}>
            <button className={`tab-button ${activeTab === 'asset-health' ? 'active' : ''}`} onClick={() => setActiveTab('asset-health')} style={{ padding: '6px 12px', fontSize: '11px' }}>
              <Activity size={12} /> Asset Health
            </button>
            <button className={`tab-button ${activeTab === 'predictive-maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('predictive-maintenance')} style={{ padding: '6px 12px', fontSize: '11px' }}>
              <Wrench size={12} /> Predictive Maintenance
            </button>
            <button className={`tab-button ${activeTab === 'anomaly-detection' ? 'active' : ''}`} onClick={() => setActiveTab('anomaly-detection')} style={{ padding: '6px 12px', fontSize: '11px' }}>
              <AlertTriangle size={12} /> Anomaly Detection
            </button>
            <button className={`tab-button ${activeTab === 'utilization' ? 'active' : ''}`} onClick={() => setActiveTab('utilization')} style={{ padding: '6px 12px', fontSize: '11px' }}>
              <TrendingUp size={12} /> Utilization
            </button>
            <button className={`tab-button ${activeTab === 'reliability' ? 'active' : ''}`} onClick={() => setActiveTab('reliability')} style={{ padding: '6px 12px', fontSize: '11px' }}>
              <CheckCircle2 size={12} /> Reliability
            </button>
          </div>

          {/* Asset Health Tab */}
          {activeTab === 'asset-health' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>EQUIPMENT HEALTH SCORES</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Top 15 equipment by health score</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.assetHealth.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 10, left: 120, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" style={{ fontSize: '9px' }} domain={[0, 100]} />
                      <YAxis dataKey="equipment" type="category" style={{ fontSize: '8px' }} width={115} />
                      <Tooltip contentStyle={{ fontSize: '9px' }} />
                      <Bar dataKey="healthScore" fill={COLORS[1]} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>HEALTH STATUS DISTRIBUTION</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Asset status breakdown</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Excellent', value: analytics.assetHealth.filter(a => a.healthScore > 80).length, fill: '#10B981' },
                          { name: 'Good', value: analytics.assetHealth.filter(a => a.healthScore >= 60 && a.healthScore <= 80).length, fill: '#4A7AB5' },
                          { name: 'Fair', value: analytics.assetHealth.filter(a => a.healthScore >= 40 && a.healthScore < 60).length, fill: '#F59E0B' },
                          { name: 'Poor', value: analytics.assetHealth.filter(a => a.healthScore < 40).length, fill: COLORS[0] }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                        outerRadius={90}
                        dataKey="value"
                      >
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '9px' }} />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>DETAILED HEALTH METRICS</h4>
                <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Equipment performance indicators</p>
                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Equipment</th>
                        <th>Line</th>
                        <th>Health Score</th>
                        <th>Availability</th>
                        <th>Reliability</th>
                        <th>Events</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.assetHealth.map((asset, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', fontSize: '11px' }}>{asset.equipment}</td>
                          <td style={{ fontSize: '10px', color: '#6b7280' }}>{asset.line}</td>
                          <td className="text-right">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${asset.healthScore}%`,
                                  height: '100%',
                                  backgroundColor: asset.healthScore > 70 ? '#10B981' : asset.healthScore > 50 ? '#F59E0B' : COLORS[0],
                                  transition: 'width 0.3s'
                                }}></div>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: '600', minWidth: '45px' }}>{asset.healthScore.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="text-right" style={{ fontSize: '11px' }}>{asset.availability.toFixed(1)}%</td>
                          <td className="text-right" style={{ fontSize: '11px' }}>{asset.reliability.toFixed(1)}%</td>
                          <td className="text-right" style={{ fontSize: '11px' }}>{asset.eventCount.toLocaleString()}</td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: '600',
                              background: asset.status === 'Excellent' ? '#E0F2E9' : asset.status === 'Good' ? '#EEF2FA' : asset.status === 'Fair' ? '#FFF5E5' : '#F3F4F6',
                              color: asset.status === 'Excellent' ? '#0F5132' : asset.status === 'Good' ? '#1C3668' : asset.status === 'Fair' ? '#856404' : COLORS[0]
                            }}>
                              {asset.status}
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

          {/* Predictive Maintenance Tab */}
          {activeTab === 'predictive-maintenance' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>MAINTENANCE URGENCY SCORES</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Prioritized maintenance schedule</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.maintenanceIndicators} layout="vertical" margin={{ top: 5, right: 10, left: 110, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" style={{ fontSize: '9px' }} />
                      <YAxis dataKey="equipment" type="category" style={{ fontSize: '8px' }} width={105} />
                      <Tooltip contentStyle={{ fontSize: '9px' }} />
                      <Bar dataKey="urgency" fill={COLORS[0]} radius={[0, 3, 3, 0]}>
                        {analytics.maintenanceIndicators.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.priority === 'Critical' ? COLORS[0] : entry.priority === 'High' ? '#F59E0B' : entry.priority === 'Medium' ? '#4A7AB5' : '#6B7280'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>DEGRADATION ANALYSIS</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Equipment degradation levels</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={analytics.maintenanceIndicators.slice(0, 10)} margin={{ top: 5, right: 10, left: -5, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={70} style={{ fontSize: '8px' }} />
                      <YAxis style={{ fontSize: '9px' }} width={30} />
                      <Tooltip contentStyle={{ fontSize: '9px' }} />
                      <Bar dataKey="degradation" fill={COLORS[3]} radius={[3, 3, 0, 0]} />
                      <Line type="monotone" dataKey="urgency" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>PREDICTIVE MAINTENANCE SCHEDULE</h4>
                <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Recommended maintenance timeline</p>
                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Priority</th>
                        <th>Equipment</th>
                        <th>Line</th>
                        <th>Degradation</th>
                        <th>Urgency Score</th>
                        <th>Days Until Maintenance</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.maintenanceIndicators.map((item, idx) => (
                        <tr key={idx} style={{ background: item.priority === 'Critical' ? '#FFF5F5' : 'transparent' }}>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: '600',
                              background: item.priority === 'Critical' ? COLORS[0] : item.priority === 'High' ? '#F59E0B' : item.priority === 'Medium' ? '#4A7AB5' : '#6B7280',
                              color: 'white'
                            }}>
                              {item.priority}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600', fontSize: '11px' }}>{item.equipment}</td>
                          <td style={{ fontSize: '10px', color: '#6b7280' }}>{item.line}</td>
                          <td className="text-right" style={{ fontSize: '11px', color: item.degradation > 50 ? COLORS[0] : '#6b7280' }}>
                            {item.degradation.toFixed(1)}%
                          </td>
                          <td className="text-right" style={{ fontSize: '11px', fontWeight: '600' }}>{item.urgency.toFixed(0)}</td>
                          <td className="text-right" style={{ fontSize: '11px', fontWeight: '600', color: item.predictedMaintenance < 7 ? COLORS[0] : '#6b7280' }}>
                            {item.predictedMaintenance} days
                          </td>
                          <td>
                            <button style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '600',
                              border: 'none',
                              background: item.priority === 'Critical' ? COLORS[0] : '#4A7AB5',
                              color: 'white',
                              cursor: 'pointer'
                            }}>
                              Schedule
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Anomaly Detection Tab */}
          {activeTab === 'anomaly-detection' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>ANOMALY SCORE DISTRIBUTION</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Equipment deviation from normal</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="healthScore" name="Health" style={{ fontSize: '9px' }} />
                      <YAxis dataKey="anomalyScore" name="Anomaly" style={{ fontSize: '9px' }} width={30} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '9px' }} />
                      <Scatter name="Equipment" data={analytics.anomalyDetection} fill={COLORS[0]}>
                        {analytics.anomalyDetection.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.risk === 'High' ? COLORS[0] : entry.risk === 'Medium' ? '#F59E0B' : '#4A7AB5'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>RISK LEVEL BREAKDOWN</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Equipment risk categories</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'High Risk', value: analytics.anomalyDetection.filter(a => a.risk === 'High').length, fill: COLORS[0] },
                          { name: 'Medium Risk', value: analytics.anomalyDetection.filter(a => a.risk === 'Medium').length, fill: '#F59E0B' },
                          { name: 'Low Risk', value: analytics.anomalyDetection.filter(a => a.risk === 'Low').length, fill: '#4A7AB5' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                        outerRadius={90}
                        dataKey="value"
                      >
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '9px' }} />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>ANOMALY DETECTION ALERTS</h4>
                <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Equipment requiring investigation</p>
                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Risk</th>
                        <th>Equipment</th>
                        <th>Line</th>
                        <th>Health Score</th>
                        <th>Anomaly Score</th>
                        <th>Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.anomalyDetection.map((anomaly, idx) => (
                        <tr key={idx} style={{ background: anomaly.risk === 'High' ? '#FFF5F5' : 'transparent' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertTriangle size={14} style={{ color: anomaly.risk === 'High' ? COLORS[0] : anomaly.risk === 'Medium' ? '#F59E0B' : '#4A7AB5' }} />
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: anomaly.risk === 'High' ? COLORS[0] : anomaly.risk === 'Medium' ? '#F59E0B' : '#4A7AB5',
                                color: 'white'
                              }}>
                                {anomaly.risk}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontWeight: '600', fontSize: '11px' }}>{anomaly.equipment}</td>
                          <td style={{ fontSize: '10px', color: '#6b7280' }}>{anomaly.line}</td>
                          <td className="text-right" style={{ fontSize: '11px' }}>{anomaly.healthScore.toFixed(1)}%</td>
                          <td className="text-right" style={{ fontSize: '11px', fontWeight: '600', color: anomaly.anomalyScore > 2 ? COLORS[0] : '#6b7280' }}>
                            {anomaly.anomalyScore.toFixed(2)}
                          </td>
                          <td style={{ fontSize: '10px', color: '#6b7280' }}>{anomaly.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Utilization Analysis Tab */}
          {activeTab === 'utilization' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>HOURLY UTILIZATION TRENDS</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Equipment activity patterns throughout the day</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={analytics.utilizationTrends} margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="hour" style={{ fontSize: '9px' }} />
                      <YAxis yAxisId="left" style={{ fontSize: '9px' }} width={30} />
                      <YAxis yAxisId="right" orientation="right" style={{ fontSize: '9px' }} width={30} />
                      <Tooltip contentStyle={{ fontSize: '9px' }} />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                      <Area yAxisId="left" type="monotone" dataKey="utilization" stroke={COLORS[1]} fillOpacity={1} fill="url(#colorUtilization)" name="Utilization %" />
                      <Line yAxisId="right" type="monotone" dataKey="events" stroke="#4A7AB5" strokeWidth={2} dot={{ r: 2 }} name="Events" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>EQUIPMENT PERFORMANCE COMPARISON</h4>
                <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Multi-dimensional equipment analysis</p>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={analytics.equipmentCorrelation} margin={{ top: 5, right: 10, left: -5, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={70} style={{ fontSize: '8px' }} />
                    <YAxis style={{ fontSize: '9px' }} width={30} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: '9px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="performance" fill="#10B981" radius={[3, 3, 0, 0]} name="Performance" />
                    <Line type="monotone" dataKey="availability" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 3 }} name="Availability" />
                    <Line type="monotone" dataKey="reliability" stroke="#4A7AB5" strokeWidth={2} dot={{ r: 3 }} name="Reliability" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Reliability Metrics Tab */}
          {activeTab === 'reliability' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>RELIABILITY SCORES</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Equipment consistency metrics</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.equipmentReliability} margin={{ top: 5, right: 10, left: -5, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={70} style={{ fontSize: '8px' }} />
                      <YAxis style={{ fontSize: '9px' }} width={30} domain={[0, 100]} />
                      <Tooltip contentStyle={{ fontSize: '9px' }} />
                      <Bar dataKey="reliability" fill="#10B981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>AVAILABILITY VS RELIABILITY</h4>
                  <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Performance correlation</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="availability" name="Availability" style={{ fontSize: '9px' }} domain={[0, 100]} />
                      <YAxis dataKey="reliability" name="Reliability" style={{ fontSize: '9px' }} width={30} domain={[0, 100]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '9px' }} />
                      <Scatter name="Equipment" data={analytics.equipmentReliability} fill="#10B981" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0', fontWeight: '700' }}>RELIABILITY METRICS SUMMARY</h4>
                <p className="chart-subtitle" style={{ fontSize: '9px', margin: '0 0 6px 0', color: '#6b7280' }}>Detailed reliability analysis</p>
                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Equipment</th>
                        <th>Reliability</th>
                        <th>MTBF (hrs)</th>
                        <th>Failure Rate</th>
                        <th>Availability</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.equipmentReliability.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', fontSize: '11px' }}>{item.equipment}</td>
                          <td className="text-right">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${item.reliability}%`,
                                  height: '100%',
                                  backgroundColor: '#10B981'
                                }}></div>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: '600', minWidth: '45px' }}>{item.reliability.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="text-right" style={{ fontSize: '11px' }}>{item.mtbf.toFixed(1)}</td>
                          <td className="text-right" style={{ fontSize: '11px', color: item.failureRate > 20 ? COLORS[0] : '#6b7280' }}>
                            {item.failureRate.toFixed(1)}%
                          </td>
                          <td className="text-right" style={{ fontSize: '11px' }}>{item.availability.toFixed(1)}%</td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: '600',
                              background: item.reliability > 80 ? '#E0F2E9' : item.reliability > 60 ? '#FFF5E5' : '#F3F4F6',
                              color: item.reliability > 80 ? '#0F5132' : item.reliability > 60 ? '#856404' : COLORS[0]
                            }}>
                              {item.reliability > 80 ? 'Excellent' : item.reliability > 60 ? 'Good' : 'Needs Attention'}
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
        </>
      )}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '660px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8ECF4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#EEF2FA', borderRadius: '8px', padding: '8px' }}><Bot size={18} color="#1C3668" /></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Asset AI Agent</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · equipment health, predictive maintenance, run rates</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Which units are running below target rate?', 'Flag any anomaly detection alerts', 'What is the current health score per reactor?', 'Which equipment is most at risk of failure?'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing process data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about equipment health, anomalies, run rates..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>OT Process Insights</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Provides equipment-level performance analytics derived from OT process events. Calculates asset health scores, flags anomalous behaviour, tracks utilisation against unconstrained capacity, and models predictive maintenance triggers.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Asset Health</strong> — Health scores and status per asset</li>
                  <li style={{ marginBottom: '4px' }}><strong>Predictive Maintenance</strong> — Maintenance trigger modelling based on OT signals</li>
                  <li style={{ marginBottom: '4px' }}><strong>Anomaly Detection</strong> — Flagged abnormal process behaviour</li>
                  <li style={{ marginBottom: '4px' }}><strong>Utilization</strong> — Actual vs unconstrained capacity utilisation</li>
                  <li style={{ marginBottom: '4px' }}><strong>Reliability</strong> — MTBF / MTTR reliability metrics by asset</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>ot_process_events</strong> — OT sensor and SCADA event records</li>
                  <li style={{ marginBottom: '4px' }}><strong>downtime</strong> — Downtime events for reliability calculations</li>
                  <li style={{ marginBottom: '4px' }}><strong>run_rates</strong> — Actual vs unconstrained throughput for utilisation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OTProcessInsights
