import { useState, useEffect } from 'react'
import { BarChart3, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ProductionMetrics() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const getProductionLine = (workCentre) => {
    if (!workCentre) return 'Unknown'
    const mapping = {
      'CPL-R01': 'Reactor Line 1',
      'CPL-R02': 'Reactor Line 2',
      'CPL-B01': 'Batch Line 1',
      'CPL-F01': 'Filling Line 1'
    }
    return mapping[workCentre] || workCentre
  }

  useEffect(() => {
    fetchData()
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

  const calculateMetrics = () => {
    const totalPlanned = data.reduce((sum, order) => sum + order.PLANNED_QUANTITY, 0)
    const totalDelivered = data.reduce((sum, order) => sum + order.DELIVERED_QUANTITY, 0)
    const completionRate = totalPlanned > 0 ? (totalDelivered / totalPlanned) * 100 : 0

    const lineMetrics = {}
    data.forEach(order => {
      const line = getProductionLine(order.WORK_CENTER)
      if (!lineMetrics[line]) {
        lineMetrics[line] = {
          planned: 0,
          delivered: 0,
          orders: 0,
          changes: 0
        }
      }
      lineMetrics[line].planned += order.PLANNED_QUANTITY
      lineMetrics[line].delivered += order.DELIVERED_QUANTITY
      lineMetrics[line].orders += 1
      lineMetrics[line].changes += order.NUMBER_OF_CHANGES_TO_ORDER_QUANTITY + order.NUMBER_OF_CHANGES_TO_SCHEDULED_START_DATE
    })

    const avgChanges = data.length > 0
      ? data.reduce((sum, order) =>
          sum + order.NUMBER_OF_CHANGES_TO_ORDER_QUANTITY + order.NUMBER_OF_CHANGES_TO_SCHEDULED_START_DATE, 0
        ) / data.length
      : 0

    return { totalPlanned, totalDelivered, completionRate, lineMetrics, avgChanges }
  }

  const metrics = calculateMetrics()

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Production Metrics</h1>
          <p className="page-subtitle">Performance analytics and KPIs</p>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading metrics data...</p>
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
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <h3>Total Planned Quantity</h3>
                <BarChart3 size={24} className="metric-icon" />
              </div>
              <p className="metric-value">{metrics.totalPlanned.toLocaleString()}</p>
              <p className="metric-label">Units</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Total Delivered Quantity</h3>
                <TrendingUp size={24} className="metric-icon" />
              </div>
              <p className="metric-value">{metrics.totalDelivered.toLocaleString()}</p>
              <p className="metric-label">Units</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Completion Rate</h3>
                <BarChart3 size={24} className="metric-icon" />
              </div>
              <p className="metric-value">{metrics.completionRate.toFixed(1)}%</p>
              <p className="metric-label">Overall Performance</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Avg. Schedule Changes</h3>
                {metrics.avgChanges > 2 ? (
                  <TrendingDown size={24} className="metric-icon warn" />
                ) : (
                  <TrendingUp size={24} className="metric-icon" />
                )}
              </div>
              <p className="metric-value">{metrics.avgChanges.toFixed(1)}</p>
              <p className="metric-label">Per Order</p>
            </div>
          </div>

          <div className="section-header">
            <h2>Production Line Performance</h2>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Production Line</th>
                  <th>Total Orders</th>
                  <th>Planned Quantity</th>
                  <th>Delivered Quantity</th>
                  <th>Efficiency</th>
                  <th>Total Changes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.lineMetrics)
                  .sort((a, b) => b[1].delivered - a[1].delivered)
                  .map(([line, stats]) => {
                    const efficiency = stats.planned > 0
                      ? (stats.delivered / stats.planned) * 100
                      : 0

                    return (
                      <tr key={line}>
                        <td className="font-semibold">{line}</td>
                        <td className="text-center">{stats.orders}</td>
                        <td className="text-right">{stats.planned.toLocaleString()}</td>
                        <td className="text-right">{stats.delivered.toLocaleString()}</td>
                        <td className="text-center">
                          <span className={`efficiency-badge ${
                            efficiency >= 100 ? 'high' :
                            efficiency >= 90 ? 'medium' : 'low'
                          }`}>
                            {efficiency.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge-neutral">{stats.changes}</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default ProductionMetrics
