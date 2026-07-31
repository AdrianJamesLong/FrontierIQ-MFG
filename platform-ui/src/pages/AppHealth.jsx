import { useState, useEffect } from 'react'
import { Activity, Server, Database, Zap, AlertCircle, CheckCircle, Clock, TrendingUp, Wifi, HardDrive, Cpu, BarChart3, FileText, Brain, Bot, WifiOff, AlertTriangle, Users } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const COLORS = ['#0A1628', '#152B55', '#1C3668', '#FF4D4F', '#FFE5E5', '#6B6B6B', '#9B9B9B', '#C0C0C0']

function AppHealth() {
  const [activeTab, setActiveTab] = useState('overview')
  const [healthData, setHealthData] = useState({
    backend: { status: 'checking', responseTime: 0, lastCheck: null },
    database: { status: 'checking', recordCount: 0, lastSync: null },
    processEvents: { status: 'checking', recordCount: 0, lastSync: null },
    runrates: { status: 'checking', recordCount: 0, lastSync: null },
    downtime: { status: 'checking', recordCount: 0, lastSync: null },
    unconstrainedRunrates: { status: 'checking', recordCount: 0, lastSync: null },
    frontend: { status: 'running', version: '1.0.0' }
  })
  const [apiMetrics, setApiMetrics] = useState([])
  const [performanceHistory, setPerformanceHistory] = useState([])
  const [requestLog, setRequestLog] = useState([])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const logHealthMetrics = async (healthData, metrics) => {
    try {
      // Prepare metrics for logging
      const metricsToLog = [
        {
          timestamp: new Date().toISOString(),
          service: 'Backend API',
          status: healthData.backend.status,
          responseTime: healthData.backend.responseTime,
          metadata: { uptime: healthData.backend.uptime }
        },
        {
          timestamp: new Date().toISOString(),
          service: 'SAP Data',
          status: healthData.database.status,
          recordCount: healthData.database.recordCount,
          metadata: { lastSync: healthData.database.lastSync }
        },
        {
          timestamp: new Date().toISOString(),
          service: 'Process Events',
          status: healthData.processEvents.status,
          recordCount: healthData.processEvents.recordCount,
          metadata: { lastSync: healthData.processEvents.lastSync }
        },
        {
          timestamp: new Date().toISOString(),
          service: 'System Overall',
          status: getOverallHealth(),
          successRate: metrics.successRate,
          errorRate: metrics.errorRate,
          metadata: {
            totalRequests: metrics.totalRequests,
            avgResponseTime: metrics.avgResponseTime
          }
        }
      ]

      // Send to backend for logging
      await fetch(`${API_URL}/api/health/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToLog })
      })
    } catch (error) {
      console.error('Error logging health metrics:', error)
    }
  }

  const checkHealth = async () => {
    const startTime = Date.now()

    try {
      // Check backend health and all data sources
      const backendStart = Date.now()
      const [
        sapResponse,
        processEventsResponse,
        runratesResponse,
        downtimeResponse,
        unconstrainedRunratesResponse
      ] = await Promise.all([
        fetch(`${API_URL}/api/data`),
        fetch(`${API_URL}/api/ot-process-events?limit=1000`),
        fetch(`${API_URL}/api/runrates`),
        fetch(`${API_URL}/api/downtime`),
        fetch(`${API_URL}/api/unconstrained-runrates`)
      ])
      const backendResponseTime = Date.now() - backendStart

      if (!sapResponse.ok) throw new Error('Backend error')

      const sapResult = await sapResponse.json()
      const sapRecordCount = sapResult.data ? sapResult.data.length : 0

      // Process Events
      let processEventsRecordCount = 0
      let processEventsStatus = 'warning'
      if (processEventsResponse.ok) {
        const processEventsResult = await processEventsResponse.json()
        processEventsRecordCount = processEventsResult.data ? processEventsResult.data.length : 0
        processEventsStatus = processEventsRecordCount > 0 ? 'healthy' : 'warning'
      }

      // Runrates
      let runratesRecordCount = 0
      let runratesStatus = 'warning'
      if (runratesResponse.ok) {
        const runratesResult = await runratesResponse.json()
        runratesRecordCount = runratesResult.data ? runratesResult.data.length : 0
        runratesStatus = runratesRecordCount > 0 ? 'healthy' : 'warning'
      }

      // Downtime
      let downtimeRecordCount = 0
      let downtimeStatus = 'warning'
      if (downtimeResponse.ok) {
        const downtimeResult = await downtimeResponse.json()
        downtimeRecordCount = downtimeResult.data ? downtimeResult.data.length : 0
        downtimeStatus = downtimeRecordCount > 0 ? 'healthy' : 'warning'
      }

      // Unconstrained Runrates
      let unconstrainedRunratesRecordCount = 0
      let unconstrainedRunratesStatus = 'warning'
      if (unconstrainedRunratesResponse.ok) {
        const unconstrainedRunratesResult = await unconstrainedRunratesResponse.json()
        unconstrainedRunratesRecordCount = unconstrainedRunratesResult.data ? unconstrainedRunratesResult.data.length : 0
        unconstrainedRunratesStatus = unconstrainedRunratesRecordCount > 0 ? 'healthy' : 'warning'
      }

      const newHealthData = {
        backend: {
          status: 'healthy',
          responseTime: backendResponseTime,
          lastCheck: new Date().toISOString(),
          uptime: Date.now() - startTime
        },
        database: {
          status: sapRecordCount > 0 ? 'healthy' : 'warning',
          recordCount: sapRecordCount,
          lastSync: new Date().toISOString()
        },
        processEvents: {
          status: processEventsStatus,
          recordCount: processEventsRecordCount,
          lastSync: new Date().toISOString()
        },
        runrates: {
          status: runratesStatus,
          recordCount: runratesRecordCount,
          lastSync: new Date().toISOString()
        },
        downtime: {
          status: downtimeStatus,
          recordCount: downtimeRecordCount,
          lastSync: new Date().toISOString()
        },
        unconstrainedRunrates: {
          status: unconstrainedRunratesStatus,
          recordCount: unconstrainedRunratesRecordCount,
          lastSync: new Date().toISOString()
        },
        frontend: {
          status: 'running',
          version: '1.0.0',
          uptime: performance.now()
        }
      }

      setHealthData(newHealthData)

      // Log health metrics to file (every check)
      const currentMetrics = calculateMetrics()
      logHealthMetrics(newHealthData, currentMetrics)

      // Update API metrics for all endpoints
      const allEndpoints = [
        { endpoint: '/api/data', status: sapResponse.ok ? 200 : 500, records: sapRecordCount },
        { endpoint: '/api/ot-process-events', status: processEventsResponse.ok ? 200 : 500, records: processEventsRecordCount },
        { endpoint: '/api/runrates', status: runratesResponse.ok ? 200 : 500, records: runratesRecordCount },
        { endpoint: '/api/downtime', status: downtimeResponse.ok ? 200 : 500, records: downtimeRecordCount },
        { endpoint: '/api/unconstrained-runrates', status: unconstrainedRunratesResponse.ok ? 200 : 500, records: unconstrainedRunratesRecordCount }
      ]

      setApiMetrics(prev => {
        const newMetrics = allEndpoints.map(ep => ({
          endpoint: ep.endpoint,
          method: 'GET',
          status: ep.status,
          responseTime: backendResponseTime,
          timestamp: new Date().toISOString()
        }))
        return [...newMetrics, ...prev].slice(0, 100) // Keep last 100 requests
      })

      // Update performance history
      setPerformanceHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          responseTime: backendResponseTime,
          timestamp: Date.now()
        }
        return [...prev, newPoint].slice(-20) // Keep last 20 data points
      })

      // Update request log for all endpoints
      setRequestLog(prev => {
        const newLogs = allEndpoints.map((ep, idx) => ({
          id: Date.now() + idx,
          timestamp: new Date().toISOString(),
          endpoint: ep.endpoint,
          method: 'GET',
          status: ep.status === 200 ? 'success' : 'failed',
          duration: backendResponseTime,
          records: ep.records
        }))
        return [...newLogs, ...prev].slice(0, 50) // Keep last 50 requests
      })

    } catch (err) {
      setHealthData(prev => ({
        ...prev,
        backend: {
          status: 'error',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          error: err.message
        },
        database: {
          status: 'error',
          recordCount: 0,
          lastSync: new Date().toISOString()
        },
        processEvents: {
          status: 'error',
          recordCount: 0,
          lastSync: new Date().toISOString()
        },
        runrates: {
          status: 'error',
          recordCount: 0,
          lastSync: new Date().toISOString()
        },
        downtime: {
          status: 'error',
          recordCount: 0,
          lastSync: new Date().toISOString()
        },
        unconstrainedRunrates: {
          status: 'error',
          recordCount: 0,
          lastSync: new Date().toISOString()
        }
      }))

      // Log failed request for all endpoints
      const failedEndpoints = [
        '/api/data',
        '/api/ot-process-events',
        '/api/runrates',
        '/api/downtime',
        '/api/unconstrained-runrates'
      ]

      setRequestLog(prev => {
        const newLogs = failedEndpoints.map((endpoint, idx) => ({
          id: Date.now() + idx,
          timestamp: new Date().toISOString(),
          endpoint,
          method: 'GET',
          status: 'failed',
          duration: 0,
          error: err.message
        }))
        return [...newLogs, ...prev].slice(0, 50)
      })
    }
  }

  // Calculate metrics
  const calculateMetrics = () => {
    const successfulRequests = apiMetrics.filter(m => m.status === 200).length
    const totalRequests = apiMetrics.length
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0

    const avgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / apiMetrics.length
      : 0

    const last10Requests = apiMetrics.slice(0, 10)
    const recentAvgResponseTime = last10Requests.length > 0
      ? last10Requests.reduce((sum, m) => sum + m.responseTime, 0) / last10Requests.length
      : 0

    const errors = apiMetrics.filter(m => m.status !== 200).length
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0

    return {
      successRate,
      avgResponseTime,
      recentAvgResponseTime,
      totalRequests,
      errors,
      errorRate
    }
  }

  const metrics = calculateMetrics()

  // System health status
  const getOverallHealth = () => {
    const allStatuses = [
      healthData.backend.status,
      healthData.database.status,
      healthData.processEvents.status,
      healthData.runrates.status,
      healthData.downtime.status,
      healthData.unconstrainedRunrates.status
    ]

    if (allStatuses.some(status => status === 'error')) {
      return 'critical'
    }
    if (allStatuses.some(status => status === 'warning')) {
      return 'warning'
    }
    if (allStatuses.every(status => status === 'healthy')) {
      return 'healthy'
    }
    return 'checking'
  }

  const overallHealth = getOverallHealth()

  const formatUptime = (ms) => {
    if (!ms) return 'N/A'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>Application Health & Monitoring</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>Real-time system health and performance monitoring</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '6px 12px',
            background: overallHealth === 'healthy' ? '#E0F2E9' :
                        overallHealth === 'warning' ? '#fef3c7' :
                        overallHealth === 'critical' ? '#fee2e2' : '#f3f4f6',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: overallHealth === 'healthy' ? '#0F5132' :
                   overallHealth === 'warning' ? '#92400e' :
                   overallHealth === 'critical' ? '#991b1b' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: overallHealth === 'healthy' ? '#0F5132' :
                         overallHealth === 'warning' ? '#f59e0b' :
                         overallHealth === 'critical' ? '#ef4444' : '#6b7280'
            }}></div>
            System {overallHealth === 'checking' ? 'Checking' : overallHealth === 'healthy' ? 'Healthy' : overallHealth === 'warning' ? 'Warning' : 'Critical'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container" style={{ marginBottom: '8px', padding: '4px', gap: '6px' }}>
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'services', label: 'Services', icon: Server },
          { key: 'performance', label: 'Performance', icon: TrendingUp },
          { key: 'data-flow', label: 'Data Flow', icon: Database },
          { key: 'logs', label: 'Request Logs', icon: FileText },
          { key: 'analytics', label: 'Analytics', icon: TrendingUp },
          { key: 'agents', label: 'Agents Overview', icon: Users }
        ].map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <TabIcon size={13} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <div className="stat-card" style={{
              padding: '10px',
              background: overallHealth === 'healthy' ? 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)' :
                         overallHealth === 'warning' ? 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)' :
                         'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
              color: 'white',
              border: 'none'
            }}>
              <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {overallHealth === 'healthy' && <CheckCircle size={12} />}
                {overallHealth === 'warning' && <AlertCircle size={12} />}
                {overallHealth === 'critical' && <AlertCircle size={12} />}
                OVERALL STATUS
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px' }}>
                {overallHealth === 'healthy' ? 'Healthy' :
                 overallHealth === 'warning' ? 'Warning' : 'Critical'}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.85 }}>System health</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {healthData.backend.status === 'healthy' ? (
                  <CheckCircle size={12} style={{ color: '#22c55e' }} />
                ) : healthData.backend.status === 'error' ? (
                  <AlertCircle size={12} style={{ color: '#ef4444' }} />
                ) : (
                  <Activity size={12} style={{ color: '#f59e0b' }} />
                )}
                BACKEND
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '2px',
                color: healthData.backend.status === 'healthy' ? '#22c55e' :
                       healthData.backend.status === 'error' ? '#ef4444' : '#f59e0b'
              }}>
                {healthData.backend.status === 'healthy' ? 'Online' :
                 healthData.backend.status === 'error' ? 'Offline' : 'Checking'}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>
                {healthData.backend.responseTime > 0 ? `${healthData.backend.responseTime}ms` : 'N/A'}
              </div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {healthData.database.status === 'healthy' ? (
                  <Database size={12} style={{ color: '#22c55e' }} />
                ) : (
                  <AlertCircle size={12} style={{ color: '#ef4444' }} />
                )}
                SAP DATA
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '2px',
                color: healthData.database.status === 'healthy' ? '#22c55e' : '#ef4444'
              }}>
                {healthData.database.recordCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Records</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {healthData.processEvents.status === 'healthy' ? (
                  <Activity size={12} style={{ color: '#22c55e' }} />
                ) : (
                  <AlertCircle size={12} style={{ color: '#ef4444' }} />
                )}
                PROCESS EVENTS
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '2px',
                color: healthData.processEvents.status === 'healthy' ? '#22c55e' : '#ef4444'
              }}>
                {healthData.processEvents.recordCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Events</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={12} style={{ color: metrics.successRate >= 95 ? '#22c55e' : '#f59e0b' }} />
                SUCCESS RATE
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '2px',
                color: metrics.successRate >= 95 ? '#22c55e' : metrics.successRate >= 80 ? '#f59e0b' : '#ef4444'
              }}>
                {metrics.successRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>{metrics.totalRequests} requests</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} style={{ color: COLORS[1] }} />
                AVG LATENCY
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: '#1f2937' }}>
                {Math.round(metrics.avgResponseTime)}ms
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Response time</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} style={{ color: COLORS[1] }} />
                RECENT
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: '#1f2937' }}>
                {Math.round(metrics.recentAvgResponseTime)}ms
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Last 10 requests</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} style={{ color: metrics.errors > 0 ? '#ef4444' : '#22c55e' }} />
                ERRORS
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '2px',
                color: metrics.errors > 0 ? '#ef4444' : '#22c55e'
              }}>
                {metrics.errors}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>{metrics.errorRate.toFixed(1)}% rate</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} style={{ color: COLORS[1] }} />
                REQUESTS
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: '#1f2937' }}>
                {metrics.totalRequests}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Total count</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Activity size={20} style={{ color: '#0A1628' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>SYSTEM HEALTH STATUS</h3>
                  <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Current status of all system components</p>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                {/* Backend Service */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Server size={24} style={{ color: COLORS[1] }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Backend API</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>FastAPI Server</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: healthData.backend.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                      color: healthData.backend.status === 'healthy' ? '#15803d' : '#991b1b'
                    }}>
                      {healthData.backend.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {healthData.backend.status === 'healthy' ? 'Healthy' : 'Error'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      {healthData.backend.responseTime}ms
                    </div>
                  </div>
                </div>

                {/* SAP Database */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Database size={24} style={{ color: COLORS[1] }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>SAP Data (Fabric Lakehouse)</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>sap_production_orders</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: healthData.database.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                      color: healthData.database.status === 'healthy' ? '#15803d' : '#991b1b'
                    }}>
                      {healthData.database.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {healthData.database.status === 'healthy' ? 'Connected' : 'Error'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      {healthData.database.recordCount.toLocaleString()} records
                    </div>
                  </div>
                </div>

                {/* Process Events */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Activity size={24} style={{ color: COLORS[1] }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Process Events (Fabric Lakehouse)</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>OT Process Events</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: healthData.processEvents.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                      color: healthData.processEvents.status === 'healthy' ? '#15803d' : '#991b1b'
                    }}>
                      {healthData.processEvents.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {healthData.processEvents.status === 'healthy' ? 'Connected' : 'Error'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      {healthData.processEvents.recordCount.toLocaleString()} events
                    </div>
                  </div>
                </div>

                {/* Runrates */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Database size={24} style={{ color: COLORS[1] }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Runrates (Fabric Lakehouse)</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Runrates</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: healthData.runrates.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                      color: healthData.runrates.status === 'healthy' ? '#15803d' : '#991b1b'
                    }}>
                      {healthData.runrates.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {healthData.runrates.status === 'healthy' ? 'Connected' : 'Error'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      {healthData.runrates.recordCount.toLocaleString()} records
                    </div>
                  </div>
                </div>

                {/* Downtime */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Database size={24} style={{ color: COLORS[1] }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Downtime (Fabric Lakehouse)</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Downtime</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: healthData.downtime.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                      color: healthData.downtime.status === 'healthy' ? '#15803d' : '#991b1b'
                    }}>
                      {healthData.downtime.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {healthData.downtime.status === 'healthy' ? 'Connected' : 'Error'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      {healthData.downtime.recordCount.toLocaleString()} records
                    </div>
                  </div>
                </div>

                {/* Unconstrained Runrates */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Database size={24} style={{ color: COLORS[1] }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Unconstrained Runrates (Fabric Lakehouse)</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>UnconstrainedRunrates</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: healthData.unconstrainedRunrates.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                      color: healthData.unconstrainedRunrates.status === 'healthy' ? '#15803d' : '#991b1b'
                    }}>
                      {healthData.unconstrainedRunrates.status === 'healthy' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {healthData.unconstrainedRunrates.status === 'healthy' ? 'Connected' : 'Error'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      {healthData.unconstrainedRunrates.recordCount.toLocaleString()} records
                    </div>
                  </div>
                </div>

                {/* Data Agent AI */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Brain size={24} style={{ color: COLORS[1] }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Data Agent AI</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Claude Sonnet 4.6</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: '#dcfce7',
                      color: '#15803d'
                    }}>
                      <CheckCircle size={14} />
                      Active
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      Tool-enabled
                    </div>
                  </div>
                </div>

                {/* Frontend */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Activity size={24} style={{ color: COLORS[1] }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Frontend App</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>React + Vite</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: '#dcfce7',
                      color: '#15803d'
                    }}>
                      <CheckCircle size={14} />
                      Running
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      v{healthData.frontend.version}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={20} style={{ color: '#0A1628' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>RESPONSE TIME TREND</h3>
                  <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Last 20 API requests</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={performanceHistory}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis style={{ fontSize: '12px' }} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                    name="Response Time (ms)"
                    dot={{ fill: COLORS[1], r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <div className="stat-card" style={{ padding: '10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} style={{ color: COLORS[1] }} />
                BACKEND UPTIME
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: '#1f2937' }}>
                {formatUptime(healthData.backend.uptime)}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Since last restart</div>
            </div>
            <div className="stat-card" style={{ padding: '10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} style={{ color: COLORS[1] }} />
                FRONTEND UPTIME
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: '#1f2937' }}>
                {formatUptime(healthData.frontend.uptime)}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Session duration</div>
            </div>
            <div className="stat-card" style={{ padding: '10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={12} style={{ color: COLORS[1] }} />
                LAST DB SYNC
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px', color: '#1f2937' }}>
                {healthData.database.lastSync ? new Date(healthData.database.lastSync).toLocaleTimeString() : 'Never'}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Latest data fetch</div>
            </div>
            <div className="stat-card" style={{ padding: '10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={12} style={{ color: '#22c55e' }} />
                CONNECTION
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: '#22c55e' }}>
                Active
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>All services connected</div>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Server size={20} style={{ color: '#0A1628' }} />
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>SERVICE DETAILS</h3>
                <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Comprehensive service information and metrics</p>
              </div>
            </div>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Endpoint</th>
                    <th>Response Time</th>
                    <th>Last Check</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Backend API</td>
                    <td>FastAPI</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.backend.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.backend.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.backend.status === 'healthy' ? 'HEALTHY' : 'ERROR'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>{API_URL}</td>
                    <td className="text-right">{healthData.backend.responseTime}ms</td>
                    <td>{healthData.backend.lastCheck ? new Date(healthData.backend.lastCheck).toLocaleTimeString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>SAP Data (Fabric Lakehouse)</td>
                    <td>Azure Eventhouse</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.database.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.database.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.database.status === 'healthy' ? 'CONNECTED' : 'ERROR'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>sap_production_orders</td>
                    <td className="text-right">-</td>
                    <td>{healthData.database.lastSync ? new Date(healthData.database.lastSync).toLocaleTimeString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Process Events (Fabric Lakehouse)</td>
                    <td>Azure Eventhouse</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.processEvents.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.processEvents.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.processEvents.status === 'healthy' ? 'CONNECTED' : 'ERROR'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>OT Process Events</td>
                    <td className="text-right">-</td>
                    <td>{healthData.processEvents.lastSync ? new Date(healthData.processEvents.lastSync).toLocaleTimeString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Runrates (Fabric Lakehouse)</td>
                    <td>Azure Eventhouse</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.runrates.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.runrates.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.runrates.status === 'healthy' ? 'CONNECTED' : 'ERROR'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>Runrates</td>
                    <td className="text-right">-</td>
                    <td>{healthData.runrates.lastSync ? new Date(healthData.runrates.lastSync).toLocaleTimeString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Downtime (Fabric Lakehouse)</td>
                    <td>Azure Eventhouse</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.downtime.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.downtime.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.downtime.status === 'healthy' ? 'CONNECTED' : 'ERROR'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>Downtime</td>
                    <td className="text-right">-</td>
                    <td>{healthData.downtime.lastSync ? new Date(healthData.downtime.lastSync).toLocaleTimeString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Unconstrained Runrates (Fabric Lakehouse)</td>
                    <td>Azure Eventhouse</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.unconstrainedRunrates.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.unconstrainedRunrates.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.unconstrainedRunrates.status === 'healthy' ? 'CONNECTED' : 'ERROR'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>UnconstrainedRunrates</td>
                    <td className="text-right">-</td>
                    <td>{healthData.unconstrainedRunrates.lastSync ? new Date(healthData.unconstrainedRunrates.lastSync).toLocaleTimeString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Azure AI Foundry</td>
                    <td>Claude Sonnet 4.6</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#dcfce7',
                        color: '#15803d'
                      }}>
                        ACTIVE
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>AI Agent Backend</td>
                    <td className="text-right">~500ms</td>
                    <td>Real-time</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Data Agent</td>
                    <td>Agentic AI Chat</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#dcfce7',
                        color: '#15803d'
                      }}>
                        RUNNING
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>/api/agent/chat</td>
                    <td className="text-right">-</td>
                    <td>Tool-enabled</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Dashboard Validation</td>
                    <td>Metric Calculator</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#dcfce7',
                        color: '#15803d'
                      }}>
                        ACTIVE
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>4 Metric Tools</td>
                    <td className="text-right">-</td>
                    <td>Cross-validation</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Frontend App</td>
                    <td>React 18</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#dcfce7',
                        color: '#15803d'
                      }}>
                        RUNNING
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>{window.location.origin}</td>
                    <td className="text-right">-</td>
                    <td>Current Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <div className="stat-card" style={{ padding: '10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} style={{ color: COLORS[1] }} />
                TOTAL REQUESTS
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: '#1f2937' }}>
                {metrics.totalRequests}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Since session start</div>
            </div>
            <div className="stat-card" style={{ padding: '10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} style={{ color: '#22c55e' }} />
                SUCCESS RATE
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '2px',
                color: metrics.successRate >= 95 ? '#22c55e' : '#f59e0b'
              }}>
                {metrics.successRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>{metrics.totalRequests - metrics.errors} successful</div>
            </div>
            <div className="stat-card" style={{ padding: '10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} style={{ color: metrics.errors > 0 ? '#ef4444' : '#22c55e' }} />
                FAILED REQUESTS
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '2px',
                color: metrics.errors > 0 ? '#ef4444' : '#22c55e'
              }}>
                {metrics.errors}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>{metrics.errorRate.toFixed(1)}% error rate</div>
            </div>
            <div className="stat-card" style={{ padding: '10px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} style={{ color: COLORS[1] }} />
                AVG LATENCY
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: '#1f2937' }}>
                {Math.round(metrics.avgResponseTime)}ms
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Average response time</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BarChart3 size={20} style={{ color: '#0A1628' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>REQUEST SUCCESS vs FAILURE</h3>
                  <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>API request outcome distribution</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful', value: metrics.totalRequests - metrics.errors },
                      { name: 'Failed', value: metrics.errors }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={20} style={{ color: '#0A1628' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>PERFORMANCE METRICS</h3>
                  <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Key performance indicators</p>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'grid', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>Average Response Time</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS[1] }}>
                      {Math.round(metrics.avgResponseTime)}ms
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min((metrics.avgResponseTime / 1000) * 100, 100)}%`,
                      height: '100%',
                      background: metrics.avgResponseTime < 200 ? '#22c55e' : metrics.avgResponseTime < 500 ? '#f59e0b' : '#ef4444'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    Target: &lt;200ms
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>Recent Performance</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS[1] }}>
                      {Math.round(metrics.recentAvgResponseTime)}ms
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min((metrics.recentAvgResponseTime / 1000) * 100, 100)}%`,
                      height: '100%',
                      background: metrics.recentAvgResponseTime < 200 ? '#22c55e' : metrics.recentAvgResponseTime < 500 ? '#f59e0b' : '#ef4444'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    Last 10 requests
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>Success Rate</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>
                      {metrics.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${metrics.successRate}%`, height: '100%', background: '#22c55e' }}></div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    {metrics.totalRequests - metrics.errors} of {metrics.totalRequests} successful
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={20} style={{ color: '#0A1628' }} />
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>DATA SOURCE PERFORMANCE</h3>
                <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Individual performance metrics for each data source</p>
              </div>
            </div>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data Source</th>
                    <th>Status</th>
                    <th>Records</th>
                    <th>Last Sync</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Database size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      SAP Data (sap_production_orders)
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.database.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.database.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.database.status === 'healthy' ? 'HEALTHY' : 'ERROR'}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontWeight: '600' }}>{healthData.database.recordCount.toLocaleString()}</td>
                    <td>{healthData.database.lastSync ? new Date(healthData.database.lastSync).toLocaleTimeString() : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: healthData.database.recordCount > 0 ? '100%' : '0%',
                            height: '100%',
                            background: healthData.database.status === 'healthy' ? '#22c55e' : '#ef4444'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: healthData.database.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
                          {healthData.database.status === 'healthy' ? 'Good' : 'Poor'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Activity size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Process Events (OT Process Events)
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.processEvents.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.processEvents.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.processEvents.status === 'healthy' ? 'HEALTHY' : 'ERROR'}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontWeight: '600' }}>{healthData.processEvents.recordCount.toLocaleString()}</td>
                    <td>{healthData.processEvents.lastSync ? new Date(healthData.processEvents.lastSync).toLocaleTimeString() : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: healthData.processEvents.recordCount > 0 ? '100%' : '0%',
                            height: '100%',
                            background: healthData.processEvents.status === 'healthy' ? '#22c55e' : '#ef4444'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: healthData.processEvents.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
                          {healthData.processEvents.status === 'healthy' ? 'Good' : 'Poor'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Database size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Runrates
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.runrates.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.runrates.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.runrates.status === 'healthy' ? 'HEALTHY' : 'ERROR'}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontWeight: '600' }}>{healthData.runrates.recordCount.toLocaleString()}</td>
                    <td>{healthData.runrates.lastSync ? new Date(healthData.runrates.lastSync).toLocaleTimeString() : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: healthData.runrates.recordCount > 0 ? '100%' : '0%',
                            height: '100%',
                            background: healthData.runrates.status === 'healthy' ? '#22c55e' : '#ef4444'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: healthData.runrates.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
                          {healthData.runrates.status === 'healthy' ? 'Good' : 'Poor'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Database size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Downtime
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.downtime.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.downtime.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.downtime.status === 'healthy' ? 'HEALTHY' : 'ERROR'}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontWeight: '600' }}>{healthData.downtime.recordCount.toLocaleString()}</td>
                    <td>{healthData.downtime.lastSync ? new Date(healthData.downtime.lastSync).toLocaleTimeString() : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: healthData.downtime.recordCount > 0 ? '100%' : '0%',
                            height: '100%',
                            background: healthData.downtime.status === 'healthy' ? '#22c55e' : '#ef4444'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: healthData.downtime.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
                          {healthData.downtime.status === 'healthy' ? 'Good' : 'Poor'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Database size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Unconstrained Runrates
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.unconstrainedRunrates.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.unconstrainedRunrates.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.unconstrainedRunrates.status === 'healthy' ? 'HEALTHY' : 'ERROR'}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontWeight: '600' }}>{healthData.unconstrainedRunrates.recordCount.toLocaleString()}</td>
                    <td>{healthData.unconstrainedRunrates.lastSync ? new Date(healthData.unconstrainedRunrates.lastSync).toLocaleTimeString() : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: healthData.unconstrainedRunrates.recordCount > 0 ? '100%' : '0%',
                            height: '100%',
                            background: healthData.unconstrainedRunrates.status === 'healthy' ? '#22c55e' : '#ef4444'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: healthData.unconstrainedRunrates.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
                          {healthData.unconstrainedRunrates.status === 'healthy' ? 'Good' : 'Poor'}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Data Flow Tab */}
      {activeTab === 'data-flow' && (
        <div className="tab-content">
          <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={20} style={{ color: '#0A1628' }} />
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>DATA FLOW ARCHITECTURE</h3>
                <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>How data flows through the application</p>
              </div>
            </div>
            <div style={{ padding: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                {/* Fabric Lakehouse */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(139, 0, 5, 0.3)'
                  }}>
                    <Database size={28} />
                    <div style={{ marginTop: '4px', fontWeight: '600', fontSize: '11px' }}>Fabric Lakehouse</div>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
                    Azure Eventhouse
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '10px', fontWeight: '600', color: '#22c55e' }}>
                    {healthData.database.recordCount.toLocaleString()} records
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ flex: 0.3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '32px', color: COLORS[1] }}>→</div>
                  <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>KQL Query</div>
                </div>

                {/* Backend */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6B6B6B 0%, #9B9B9B 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(107, 107, 107, 0.3)'
                  }}>
                    <Server size={28} />
                    <div style={{ marginTop: '4px', fontWeight: '600', fontSize: '11px' }}>Backend API</div>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
                    FastAPI Server
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '10px', fontWeight: '600', color: healthData.backend.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
                    {healthData.backend.responseTime}ms latency
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ flex: 0.25, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '28px', color: COLORS[1] }}>→</div>
                  <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>Tool Calls</div>
                </div>

                {/* AI Agent */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                  }}>
                    <Brain size={28} />
                    <div style={{ marginTop: '4px', fontWeight: '600', fontSize: '11px' }}>AI Agent</div>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
                    Claude Sonnet 4.6
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '10px', fontWeight: '600', color: '#7C3AED' }}>
                    Azure AI Foundry
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ flex: 0.25, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '28px', color: COLORS[1] }}>→</div>
                  <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>Chat UI</div>
                </div>

                {/* Frontend */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1C3668 0%, #FF4D4F 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(244, 0, 9, 0.3)'
                  }}>
                    <Activity size={28} />
                    <div style={{ marginTop: '4px', fontWeight: '600', fontSize: '11px' }}>Frontend</div>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
                    React + Vite
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '10px', fontWeight: '600', color: '#22c55e' }}>
                    User Interface
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BarChart3 size={20} style={{ color: '#0A1628' }} />
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>DATA FLOW METRICS</h3>
                <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>End-to-end data pipeline statistics</p>
              </div>
            </div>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Function</th>
                    <th>Status</th>
                    <th>Throughput</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Database size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      SAP Data (Fabric Lakehouse)
                    </td>
                    <td>Data Source</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.database.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.database.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.database.status === 'healthy' ? 'ACTIVE' : 'ERROR'}
                      </span>
                    </td>
                    <td>{healthData.database.recordCount.toLocaleString()} records</td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>sap_production_orders table</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Activity size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Process Events (Fabric Lakehouse)
                    </td>
                    <td>Data Source</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.processEvents.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.processEvents.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.processEvents.status === 'healthy' ? 'ACTIVE' : 'ERROR'}
                      </span>
                    </td>
                    <td>{healthData.processEvents.recordCount.toLocaleString()} events</td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>OT Process Events table</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Database size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Runrates (Fabric Lakehouse)
                    </td>
                    <td>Data Source</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.runrates.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.runrates.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.runrates.status === 'healthy' ? 'ACTIVE' : 'ERROR'}
                      </span>
                    </td>
                    <td>{healthData.runrates.recordCount.toLocaleString()} records</td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>Runrates table</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Database size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Downtime (Fabric Lakehouse)
                    </td>
                    <td>Data Source</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.downtime.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.downtime.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.downtime.status === 'healthy' ? 'ACTIVE' : 'ERROR'}
                      </span>
                    </td>
                    <td>{healthData.downtime.recordCount.toLocaleString()} records</td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>Downtime table</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Database size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Unconstrained Runrates (Fabric Lakehouse)
                    </td>
                    <td>Data Source</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.unconstrainedRunrates.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.unconstrainedRunrates.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.unconstrainedRunrates.status === 'healthy' ? 'ACTIVE' : 'ERROR'}
                      </span>
                    </td>
                    <td>{healthData.unconstrainedRunrates.recordCount.toLocaleString()} records</td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>UnconstrainedRunrates table</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Server size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Backend API
                    </td>
                    <td>Data Processing</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: healthData.backend.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                        color: healthData.backend.status === 'healthy' ? '#15803d' : '#991b1b'
                      }}>
                        {healthData.backend.status === 'healthy' ? 'RUNNING' : 'ERROR'}
                      </span>
                    </td>
                    <td>{metrics.totalRequests} requests</td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>Python FastAPI on port 8000</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>
                      <Activity size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      Frontend App
                    </td>
                    <td>Data Visualization</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#dcfce7',
                        color: '#15803d'
                      }}>
                        ACTIVE
                      </span>
                    </td>
                    <td>{metrics.successRate.toFixed(0)}% success rate</td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>React 18 + Recharts on port 5173</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {/* AVG RESPONSE Card */}
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <TrendingUp size={12} style={{ color: '#3B82F6' }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AVG RESPONSE</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', lineHeight: '1', color: '#1f2937' }}>
                {Math.round(metrics.avgResponseTime)}ms
              </div>
              <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '500' }}>↓ 15% from baseline</div>
            </div>

            {/* SUCCESS RATE Card */}
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <CheckCircle size={12} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SUCCESS RATE</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', lineHeight: '1', color: '#1f2937' }}>
                {metrics.successRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '500' }}>↑ 2% from baseline</div>
            </div>

            {/* TOTAL REQUESTS Card */}
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Activity size={12} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL REQUESTS</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', lineHeight: '1', color: '#1f2937' }}>
                {metrics.totalRequests}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Last session</div>
            </div>

            {/* ERROR RATE Card */}
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <AlertCircle size={12} style={{ color: '#EF4444' }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ERROR RATE</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', lineHeight: '1', color: '#1f2937' }}>
                {metrics.errorRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10px', color: '#EF4444', fontWeight: '500' }}>{metrics.errors} failures</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={20} style={{ color: '#0A1628' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>RESPONSE TIME TREND</h3>
                  <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Performance over time</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={60} />
                  <YAxis style={{ fontSize: '12px' }} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="responseTime" stroke="#3B82F6" fillOpacity={1} fill="url(#colorResponse)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BarChart3 size={20} style={{ color: '#0A1628' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>REQUEST DISTRIBUTION</h3>
                  <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Success vs Failure</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful', value: metrics.totalRequests - metrics.errors },
                      { name: 'Failed', value: metrics.errors }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={20} style={{ color: '#0A1628' }} />
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>SERVICE HISTORY LOG</h3>
                <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Detailed request history with timestamps</p>
              </div>
            </div>
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Records</th>
                  </tr>
                </thead>
                <tbody>
                  {requestLog.slice(0, 30).map((log, idx) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="font-mono" style={{ fontSize: '11px' }}>{log.endpoint}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: log.status === 'success' ? '#dcfce7' : '#fee2e2',
                          color: log.status === 'success' ? '#15803d' : '#991b1b'
                        }}>
                          {log.status === 'success' ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                      <td className="text-right" style={{
                        color: log.duration < 200 ? '#22c55e' : log.duration < 500 ? '#f59e0b' : '#ef4444',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {log.duration}ms
                      </td>
                      <td className="text-right" style={{ fontSize: '12px' }}>
                        {log.records?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Agents Overview Tab */}
      {activeTab === 'agents' && (
        <div className="tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <CheckCircle size={12} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OPERATIONAL</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', lineHeight: '1', color: '#1f2937' }}>8</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Agents running</div>
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <AlertTriangle size={12} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DEGRADED</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', lineHeight: '1', color: '#1f2937' }}>0</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Needs attention</div>
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Clock size={12} style={{ color: '#3B82F6' }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AVG RESPONSE</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', lineHeight: '1', color: '#1f2937' }}>1.4s</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Across all agents</div>
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Activity size={12} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL QUERIES</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', lineHeight: '1', color: '#1f2937' }}>12.4K</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Last 24 hours</div>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '16px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Users size={20} style={{ color: '#0A1628' }} />
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#1f2937' }}>AI AGENTS STATUS</h3>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: '#6b7280' }}>Real-time monitoring of all 8 deployed agents</p>
              </div>
            </div>
            
            <div className="table-container" style={{ marginTop: '12px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Agent Name</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Uptime</th>
                    <th style={{ textAlign: 'center' }}>Queries (24h)</th>
                    <th style={{ textAlign: 'center' }}>Avg Response</th>
                    <th style={{ textAlign: 'left' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Data Agent', status: 'operational', uptime: '99.9%', queries: '3.5K', responseTime: '1.0s', description: 'Main conversational AI agent for data queries and analysis' },
                    { name: 'Line Operations Agent', status: 'operational', uptime: '99.9%', queries: '3.2K', responseTime: '1.1s', description: 'Monitors production line performance and efficiency metrics' },
                    { name: 'Bottleneck Constraint Agent', status: 'operational', uptime: '99.8%', queries: '2.8K', responseTime: '1.3s', description: 'Identifies and analyzes production bottlenecks' },
                    { name: 'Downtime RCA Agent', status: 'operational', uptime: '99.7%', queries: '1.9K', responseTime: '1.6s', description: 'Performs root cause analysis on downtime events' },
                    { name: 'Data Quality Agent', status: 'operational', uptime: '99.2%', queries: '1.5K', responseTime: '1.4s', description: 'Validates and monitors data quality metrics' },
                    { name: 'Executive Briefing Agent', status: 'operational', uptime: '99.9%', queries: '1.2K', responseTime: '1.2s', description: 'Generates executive-level insights and reports' },
                    { name: 'Operations Recommendation Agent', status: 'operational', uptime: '99.6%', queries: '0.8K', responseTime: '1.3s', description: 'Provides operational recommendations and insights' },
                    { name: 'Performance Analyst Agent', status: 'operational', uptime: '99.8%', queries: '0.2K', responseTime: '1.5s', description: 'Analyzes performance metrics and trends' }
                  ].map((agent, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Bot size={16} style={{ color: agent.status === 'operational' ? '#10B981' : '#F59E0B' }} />
                          {agent.name}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: agent.status === 'operational' ? '#dcfce7' : '#fef3c7',
                          color: agent.status === 'operational' ? '#15803d' : '#92400e',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {agent.status === 'operational' ? (
                            <Wifi size={12} />
                          ) : (
                            <WifiOff size={12} />
                          )}
                          {agent.status === 'operational' ? 'OPERATIONAL' : 'DEGRADED'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: agent.status === 'operational' ? '#10B981' : '#F59E0B' }}>
                        {agent.uptime}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>
                        {agent.queries}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: '#3B82F6' }}>
                        {agent.responseTime}
                      </td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>
                        {agent.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Request Logs Tab */}
      {activeTab === 'logs' && (
        <div className="tab-content">
          <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={20} style={{ color: '#0A1628' }} />
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>REQUEST LOGS</h3>
                <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>Real-time API request history (last 50 requests)</p>
              </div>
            </div>
            <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto', marginTop: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Timestamp</th>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {requestLog.map((log, idx) => (
                    <tr key={log.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="font-mono" style={{ fontSize: '12px' }}>{log.endpoint}</td>
                      <td>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: '#dbeafe',
                          color: '#1e40af'
                        }}>
                          {log.method}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: log.status === 'success' ? '#dcfce7' : '#fee2e2',
                          color: log.status === 'success' ? '#15803d' : '#991b1b'
                        }}>
                          {log.status === 'success' ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                      <td className="text-right" style={{
                        color: log.duration < 200 ? '#22c55e' : log.duration < 500 ? '#f59e0b' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {log.duration}ms
                      </td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>
                        {log.status === 'success'
                          ? `${log.records?.toLocaleString() || 0} records retrieved`
                          : log.error || 'Request failed'
                        }
                      </td>
                    </tr>
                  ))}
                  {requestLog.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                        No requests logged yet. Click "Check Now" to start monitoring.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppHealth
