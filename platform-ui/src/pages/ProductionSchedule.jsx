import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Package, Factory, AlertCircle, RefreshCw, Search, Grid3x3, List, BarChart3, Layers, ChevronRight as CloseIcon, TrendingUp } from 'lucide-react'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ProductionSchedule() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('daily')
  const [displayMode, setDisplayMode] = useState('timeline')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedLine, setSelectedLine] = useState('all')
  const [selectedWorkCenter, setSelectedWorkCenter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

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
      setOrders(result.data || [])
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

  const getOrderStatus = (order) => {
    if (order.DELIVERED_QUANTITY >= order.PLANNED_QUANTITY) return 'COMPLETE'
    if (order.DELIVERED_QUANTITY > 0) return 'IN_PROGRESS'
    if (order.ACTUAL_START_DATE && order.ACTUAL_START_DATE !== '31/12/9999') return 'IN_PROGRESS'
    return 'NOT_STARTED'
  }

  const filteredOrders = orders.filter(order => {
    const matchesLine = selectedLine === 'all' || getProductionLine(order.WORK_CENTER) === selectedLine
    const matchesWorkCenter = selectedWorkCenter === 'all' || order.WORK_CENTER === selectedWorkCenter
    const matchesSearch = !searchTerm ||
      order.ORDER_ID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.MATERIAL_ID?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesLine && matchesWorkCenter && matchesSearch
  })

  const stats = {
    totalOrders: filteredOrders.length,
    inProgress: filteredOrders.filter(o => getOrderStatus(o) === 'IN_PROGRESS').length,
    notStarted: filteredOrders.filter(o => getOrderStatus(o) === 'NOT_STARTED').length,
    completed: filteredOrders.filter(o => getOrderStatus(o) === 'COMPLETE').length,
    totalPlanned: filteredOrders.reduce((sum, o) => sum + (o.PLANNED_QUANTITY || 0), 0),
    uniqueLines: new Set(filteredOrders.map(o => getProductionLine(o.WORK_CENTER))).size
  }

  const productionLines = ['all', ...Array.from(new Set(orders.map(o => getProductionLine(o.WORK_CENTER)))).sort()]
  const workCenters = ['all', ...Array.from(new Set(orders.map(o => o.WORK_CENTER).filter(Boolean))).sort()]

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)
    if (viewMode === 'daily') newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    else if (viewMode === 'weekly') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    else newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const getDateRange = () => {
    const ranges = []
    const start = new Date(currentDate)
    start.setHours(0, 0, 0, 0)

    // Start from 1 week in the past
    if (viewMode === 'daily') {
      start.setDate(start.getDate() - 7)
    } else if (viewMode === 'weekly') {
      start.setDate(start.getDate() - 7)
    } else {
      start.setMonth(start.getMonth() - 1)
    }

    const count = viewMode === 'daily' ? 14 : viewMode === 'weekly' ? 8 : 12
    const increment = viewMode === 'daily' ? 1 : viewMode === 'weekly' ? 7 : 30

    for (let i = 0; i < count; i++) {
      const date = new Date(start)
      if (viewMode === 'monthly') date.setMonth(start.getMonth() + i)
      else date.setDate(start.getDate() + (i * increment))
      ranges.push(date)
    }
    return ranges
  }

  const orderInDateRange = (order, rangeStart) => {
    const orderDate = parseDate(order.SCHEDULED_START_DATE)
    if (!orderDate) return false
    const rangeEnd = new Date(rangeStart)
    if (viewMode === 'daily') rangeEnd.setDate(rangeEnd.getDate() + 1)
    else if (viewMode === 'weekly') rangeEnd.setDate(rangeEnd.getDate() + 7)
    else rangeEnd.setMonth(rangeEnd.getMonth() + 1)
    return orderDate >= rangeStart && orderDate < rangeEnd
  }

  const ordersByLine = filteredOrders.reduce((acc, order) => {
    const line = getProductionLine(order.WORK_CENTER)
    if (!acc[line]) acc[line] = []
    acc[line].push(order)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading production schedule...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-card">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const dateRange = getDateRange()

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>Production Planning Board</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            All orders - Including past week history
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <Search size={16} style={{ color: '#6b7280' }} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                color: '#374151',
                width: '160px'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <Factory size={16} style={{ color: '#6b7280' }} />
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
              {productionLines.map(line => <option key={line} value={line}>{line === 'all' ? 'All Lines' : line}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <BarChart3 size={16} style={{ color: '#6b7280' }} />
            <select
              value={selectedWorkCenter}
              onChange={(e) => setSelectedWorkCenter(e.target.value)}
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
              {workCenters.map(wc => <option key={wc} value={wc}>{wc === 'all' ? 'All Work Centers' : wc}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['daily', 'weekly', 'monthly'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === mode ? '#0A1628' : '#f3f4f6',
                  color: viewMode === mode ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setDisplayMode('timeline')}
              style={{
                padding: '8px 14px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: displayMode === 'timeline' ? '#0A1628' : '#f3f4f6',
                color: displayMode === 'timeline' ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Grid3x3 size={12} /> Timeline
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              style={{
                padding: '8px 14px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: displayMode === 'table' ? '#0A1628' : '#f3f4f6',
                color: displayMode === 'table' ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <List size={12} /> Table
            </button>
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

      <div className="stats-grid-large" style={{ marginBottom: '12px' }}>
        <div className="stat-card stat-total">
          <div className="stat-icon"><Layers size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{stats.totalOrders}</p>
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
          <div className="stat-icon"><Calendar size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">Not Started</p>
            <p className="stat-value">{stats.notStarted}</p>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon"><Package size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">Completed</p>
            <p className="stat-value">{stats.completed}</p>
          </div>
        </div>
        <div className="stat-card stat-total">
          <div className="stat-icon"><Factory size={20} /></div>
          <div className="stat-content">
            <p className="stat-label">Production Lines</p>
            <p className="stat-value">{stats.uniqueLines}</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(to right, #FFF5F5, #F5F5F5)', border: '1px solid #E8E8E8', borderRadius: '8px', padding: '12px 18px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigateDate('prev')} style={{ padding: '6px', background: 'white', border: '1px solid #E0E0E0', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}>
            <ChevronLeft size={18} style={{ color: '#0A1628' }} />
          </button>
          <div style={{ textAlign: 'center', minWidth: '200px', fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>
            {viewMode === 'daily' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {viewMode === 'weekly' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            {viewMode === 'monthly' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => navigateDate('next')} style={{ padding: '6px', background: 'white', border: '1px solid #E0E0E0', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}>
            <ChevronRight size={18} style={{ color: '#0A1628' }} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 12px', background: 'white', border: '1px solid #E0E0E0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#0A1628' }}>
            Today
          </button>
        </div>
        <div style={{ fontSize: '13px', color: '#6B6B6B' }}>
          Viewing: <strong>{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</strong>
        </div>
      </div>

      {displayMode === 'timeline' ? (
        <div className="table-container">
          <div style={{ background: 'linear-gradient(180deg, #0A1628 0%, #152B55 100%)', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: '200px', padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700', fontSize: '12px' }}>Production Line</div>
              <div style={{ flex: 1, display: 'flex' }}>
                {dateRange.map((date, idx) => (
                  <div key={idx} style={{ flex: 1, padding: '12px 8px', borderRight: idx < dateRange.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700' }}>
                      {viewMode === 'daily' && date.toLocaleDateString('en-US', { weekday: 'short' })}
                      {viewMode === 'weekly' && `Week ${Math.ceil(date.getDate() / 7)}`}
                      {viewMode === 'monthly' && date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.9 }}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {Object.keys(ordersByLine).length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B6B6B' }}>
                <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>No active orders found</p>
              </div>
            ) : (
              Object.entries(ordersByLine).map(([line, lineOrders]) => (
                <div key={line} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ display: 'flex', background: '#FAFAFA' }}>
                    <div style={{ width: '200px', padding: '12px 16px', borderRight: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Factory size={16} style={{ color: '#1C3668' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>{line}</div>
                        <div style={{ fontSize: '11px', color: '#6B6B6B' }}>{lineOrders.length} orders</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex' }}>
                      {dateRange.map((date, idx) => {
                        const ordersInRange = lineOrders.filter(order => orderInDateRange(order, date))
                        return (
                          <div key={idx} style={{ flex: 1, padding: '8px 4px', borderRight: idx < dateRange.length - 1 ? '1px solid #E8E8E8' : 'none', minHeight: '80px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {ordersInRange.slice(0, 3).map(order => {
                                const status = getOrderStatus(order)
                                const bgColor = status === 'COMPLETE' ? 'linear-gradient(135deg, #28A745, #218838)' : status === 'IN_PROGRESS' ? 'linear-gradient(135deg, #1C3668, #152B55)' : 'linear-gradient(135deg, #9B9B9B, #6B6B6B)'
                                return (
                                  <div key={order.ORDER_ID} onClick={() => setSelectedOrder(order)} style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', color: 'white', fontSize: '11px', background: bgColor, border: selectedOrder?.ORDER_ID === order.ORDER_ID ? '2px solid #0A1628' : 'none' }} title={`${order.ORDER_ID} - ${order.MATERIAL_ID}`}>
                                    <div style={{ fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.MATERIAL_ID}</div>
                                    <div style={{ fontSize: '10px', opacity: 0.9 }}>{(order.PLANNED_QUANTITY / 1000).toFixed(0)}K units</div>
                                  </div>
                                )
                              })}
                              {ordersInRange.length > 3 && (
                                <div style={{ padding: '4px', textAlign: 'center', fontSize: '10px', color: '#6B6B6B', background: '#F5F5F5', borderRadius: '4px', fontWeight: '600' }}>
                                  +{ordersInRange.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Material</th>
                <th>Production Line</th>
                <th>Work Center</th>
                <th className="text-center">Planned Qty</th>
                <th className="text-center">Delivered Qty</th>
                <th className="text-center">Progress</th>
                <th>Scheduled Start</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#6B6B6B' }}>No active orders found</td></tr>
              ) : (
                filteredOrders.map(order => {
                  const status = getOrderStatus(order)
                  const progress = order.PLANNED_QUANTITY > 0 ? (order.DELIVERED_QUANTITY / order.PLANNED_QUANTITY) * 100 : 0
                  return (
                    <tr key={order.ORDER_ID} onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer', background: selectedOrder?.ORDER_ID === order.ORDER_ID ? '#FFF5F5' : 'transparent' }}>
                      <td className="font-semibold" style={{ color: '#0A1628' }}>{order.ORDER_ID}</td>
                      <td>{order.MATERIAL_ID}</td>
                      <td>{getProductionLine(order.WORK_CENTER)}</td>
                      <td>{order.WORK_CENTER || '-'}</td>
                      <td className="text-center font-semibold">{order.PLANNED_QUANTITY?.toLocaleString()}</td>
                      <td className="text-center font-semibold">{order.DELIVERED_QUANTITY?.toLocaleString()}</td>
                      <td className="text-center">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                          <div className="progress-text">{progress.toFixed(0)}%</div>
                        </div>
                      </td>
                      <td>{order.SCHEDULED_START_DATE && order.SCHEDULED_START_DATE !== '31/12/9999' ? order.SCHEDULED_START_DATE : '-'}</td>
                      <td className="text-center">
                        <span className={`status-badge ${status === 'COMPLETE' ? 'status-completed' : status === 'IN_PROGRESS' ? 'status-in-progress' : 'status-pending'}`}>
                          {status === 'COMPLETE' ? <><Package size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Complete</> : status === 'IN_PROGRESS' ? <><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> In Progress</> : <><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Not Started</>}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div style={{ position: 'fixed', right: '20px', top: '100px', width: '360px', background: 'white', borderRadius: '8px', border: '2px solid #1C3668', boxShadow: '0 8px 24px rgba(244, 0, 9, 0.2)', zIndex: 50, maxHeight: 'calc(100vh - 120px)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1C3668 100%)', padding: '16px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>Order Details</h3>
              <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>{selectedOrder.ORDER_ID}</p>
            </div>
            <button onClick={() => setSelectedOrder(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}>
              <CloseIcon size={18} />
            </button>
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)', padding: '14px', borderRadius: '8px', border: '1px solid #FFE5E5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Package size={14} style={{ color: '#1C3668' }} />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase' }}>Quantity</span>
                </div>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#0A1628', margin: 0 }}>{selectedOrder.PLANNED_QUANTITY?.toLocaleString()}</p>
                <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '4px 0 0 0' }}>Planned</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)', padding: '14px', borderRadius: '8px', border: '1px solid #FFE5E5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <TrendingUp size={14} style={{ color: '#1C3668' }} />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase' }}>Delivered</span>
                </div>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#0A1628', margin: 0 }}>{selectedOrder.DELIVERED_QUANTITY?.toLocaleString()}</p>
                <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '4px 0 0 0' }}>{selectedOrder.PLANNED_QUANTITY > 0 ? ((selectedOrder.DELIVERED_QUANTITY / selectedOrder.PLANNED_QUANTITY) * 100).toFixed(0) : 0}% Complete</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Material ID</label>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2C2C', margin: 0 }}>{selectedOrder.MATERIAL_ID}</p>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Production Line</label>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2C2C', margin: 0 }}>{getProductionLine(selectedOrder.WORK_CENTER)}</p>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Work Center</label>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2C2C', margin: 0 }}>{selectedOrder.WORK_CENTER || 'Not assigned'}</p>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Scheduled Start</label>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2C2C', margin: 0 }}>{selectedOrder.SCHEDULED_START_DATE && selectedOrder.SCHEDULED_START_DATE !== '31/12/9999' ? selectedOrder.SCHEDULED_START_DATE : 'Not scheduled'}</p>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Actual Start</label>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2C2C', margin: 0 }}>{selectedOrder.ACTUAL_START_DATE && selectedOrder.ACTUAL_START_DATE !== '31/12/9999' ? selectedOrder.ACTUAL_START_DATE : 'Not started'}</p>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Status</label>
                <span className={`status-badge ${getOrderStatus(selectedOrder) === 'COMPLETE' ? 'status-completed' : getOrderStatus(selectedOrder) === 'IN_PROGRESS' ? 'status-in-progress' : 'status-pending'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                  {getOrderStatus(selectedOrder) === 'COMPLETE' ? <><Package size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Complete</> : getOrderStatus(selectedOrder) === 'IN_PROGRESS' ? <><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> In Progress</> : <><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Not Started</>}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductionSchedule