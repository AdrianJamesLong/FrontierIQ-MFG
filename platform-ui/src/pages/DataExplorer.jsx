import { useState, useEffect } from 'react'
import { Database, RefreshCw, AlertCircle, Download, Search, Filter, Package, Activity, TrendingUp, Clock, Zap, Info, X } from 'lucide-react'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Table configuration
const TABLES = [
  { id: 'sap-orders', name: 'sap_production_orders', label: 'SAP Production Orders', icon: Package, endpoint: '/api/data', description: 'SAP production orders — NovaChem Grangemouth' },
  { id: 'ot-process-events', name: 'ot_process_events', label: 'OT Process Events', icon: Activity, endpoint: '/api/ot-process-events', description: 'Real-time OT tag events from manufacturing lines' },
  { id: 'energy', name: 'energy_consumption', label: 'Energy Consumption', icon: Zap, endpoint: '/api/energy', description: 'Daily energy consumption, cost and carbon per line' },
  { id: 'inventory', name: 'inventory_stock', label: 'Inventory Stock', icon: Package, endpoint: '/api/inventory', description: 'Weekly stock snapshots, ABC classification and demand data' },
  { id: 'batch-quality', name: 'batch_quality', label: 'Batch Quality', icon: TrendingUp, endpoint: '/api/batch-quality', description: 'Batch quality records — yield, purity, test results' },
  { id: 'maintenance-orders', name: 'maintenance_orders', label: 'Maintenance Orders', icon: Clock, endpoint: '/api/maintenance-orders', description: 'PM / CM / EM work orders with MTBF/MTTR data' },
  { id: 'runrates', name: 'run_rates', label: 'Run Rates', icon: TrendingUp, endpoint: '/api/runrates', description: 'Production run rates by line and material' },
  { id: 'downtime', name: 'downtime', label: 'Downtime', icon: Clock, endpoint: '/api/downtime', description: 'Equipment downtime and CIP event data' },
]

function DataExplorer() {
  const [activeTab, setActiveTab] = useState('sap-orders')
  const [data, setData] = useState([])
  const [showPageInfo, setShowPageInfo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    setSearchTerm('')
    setCurrentPage(1)

    try {
      const table = TABLES.find(t => t.id === activeTab)
      if (!table) {
        throw new Error('Invalid table selection')
      }

      const response = await fetch(`${API_URL}${table.endpoint}`)
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

  const exportToCSV = () => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          // Handle different value types
          if (value === null || value === undefined) {
            return ''
          }
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const table = TABLES.find(t => t.id === activeTab)
    const filename = table ? table.id.replace(/-/g, '_') : 'data'
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    if (data.length === 0) return

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const table = TABLES.find(t => t.id === activeTab)
    const filename = table ? table.id.replace(/-/g, '_') : 'data'
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter data based on search term
  const filteredData = data.filter(row => {
    if (!searchTerm) return true
    return Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Get column headers
  const columns = data.length > 0 ? Object.keys(data[0]) : []

  // Get column width based on column name
  const getColumnWidth = (columnName) => {
    // SAP Orders columns (sap_production_orders)
    const shortColumns = [
      'CONFIRMED_QUANTITY_0_DAY_PRIOR',
      'NUMBER_OF_CHANGES_TO_ORDER_QUANTITY',
      'NUMBER_OF_CHANGES_TO_SCHEDULED_START_DATE',
      'SCHEDULED_START_DATE',
      'ACTUAL_START_DATE',
      'ACTUAL_FINISH_DATE'
    ]

    // OT Process Events columns (OT Process Events) - All 16 columns
    if (columnName === 'area') return '150px'
    if (columnName === 'assetName') return '180px'
    if (columnName === 'edge_arrival_timestamp') return '200px'
    if (columnName === 'enterprise') return '150px'
    if (columnName === 'environment') return '150px'
    if (columnName === 'equipment') return '180px'
    if (columnName === 'line') return '180px'
    if (columnName === 'partition') return '120px'
    if (columnName === 'processingPath') return '150px'
    if (columnName === 'site') return '120px'
    if (columnName === 'streamType') return '150px'
    if (columnName === 'sub_equipment') return '180px'
    if (columnName === 'tag') return '220px'
    if (columnName === 'timestamp') return '180px'
    if (columnName === 'uns_namespace') return '180px'
    if (columnName === 'val') return '200px'

    // SAP Orders specific columns
    if (columnName === 'ORDER_ID') return '95px'
    if (columnName === 'WORK_CENTER') return '90px'
    if (columnName === 'MATERIAL_ID') return '80px'
    if (columnName === 'MATERIAL_DESC') return '250px'

    if (shortColumns.includes(columnName)) {
      return '100px'
    }

    return '150px' // Default width
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Data Explorer</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle">
            {TABLES.find(t => t.id === activeTab)?.description || 'Browse raw data from Fabric Lakehouse'}
            {' - '}
            <span style={{ fontWeight: 600 }}>{TABLES.find(t => t.id === activeTab)?.name}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="refresh-btn" onClick={exportToCSV} disabled={loading || data.length === 0}>
            <Download size={18} />
            Export CSV
          </button>
          <button className="refresh-btn" onClick={exportToJSON} disabled={loading || data.length === 0}>
            <Download size={18} />
            Export JSON
          </button>
          <button className="refresh-btn" onClick={fetchData} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TABLES.map((table) => {
          const Icon = table.icon
          return (
            <button
              key={table.id}
              className={`tab-button ${activeTab === table.id ? 'active' : ''}`}
              onClick={() => setActiveTab(table.id)}
              style={{ padding: '8px 14px', fontSize: '11px' }}
              title={table.description}
            >
              <Icon size={14} /> {table.label}
            </button>
          )
        })}
      </div>

      {/* Search and Filters */}
      <div className="filters-section" style={{ marginBottom: '16px' }}>
        <div className="filter-group" style={{ flex: 1, maxWidth: '400px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search across all columns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-select"
            style={{ width: '100%' }}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="filter-select"
          >
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={250}>250 rows</option>
            <option value={500}>500 rows</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="stats-grid" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">TOTAL RECORDS</span>
            </div>
            <div className="stat-value-large">{data.length.toLocaleString()}</div>
            <div className="stat-footer">All records in table</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">FILTERED RECORDS</span>
            </div>
            <div className="stat-value-large">{filteredData.length.toLocaleString()}</div>
            <div className="stat-footer">Matching search criteria</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">COLUMNS</span>
            </div>
            <div className="stat-value-large">{columns.length}</div>
            <div className="stat-footer">Data fields available</div>
          </div>
        </div>
      )}

      {loading && data.length === 0 && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading data from Fabric Lakehouse...</p>
        </div>
      )}

      {error && (
        <div className="error-card">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="info-card">
          <Database size={24} />
          <p>No data available</p>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="tab-content">
          {/* Data Table */}
          <div className="table-container" style={{
            maxHeight: 'calc(100vh - 400px)',
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <table className="data-table" style={{ minWidth: 'max-content', width: 'auto' }}>
              <thead>
                <tr>
                  <th style={{
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    background: '#fff',
                    zIndex: 20,
                    minWidth: '45px',
                    width: '45px',
                    borderRight: '2px solid #e5e7eb'
                  }}>#</th>
                  {columns.map((column) => (
                    <th key={column} style={{
                      position: 'sticky',
                      top: 0,
                      background: '#fff',
                      zIndex: 10,
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      minWidth: getColumnWidth(column),
                      maxWidth: getColumnWidth(column),
                      padding: '8px 12px',
                      fontSize: '12px',
                      lineHeight: '1.3'
                    }}>
                      {column}
                    </th>
                  ))}
                  <th style={{
                    position: 'sticky',
                    top: 0,
                    background: '#fff',
                    zIndex: 10,
                    minWidth: '20px',
                    width: '20px',
                    padding: 0,
                    border: 'none'
                  }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr key={index}>
                    <td className="font-mono" style={{
                      color: '#6b7280',
                      position: 'sticky',
                      left: 0,
                      background: '#fff',
                      zIndex: 5,
                      fontWeight: '500',
                      borderRight: '2px solid #e5e7eb',
                      minWidth: '45px',
                      width: '45px',
                      padding: '8px 6px'
                    }}>{startIndex + index + 1}</td>
                    {columns.map((column) => {
                      const value = row[column]
                      let displayValue = '-'

                      if (value !== null && value !== undefined) {
                        if (typeof value === 'object') {
                          // Display JSON for complex objects
                          displayValue = JSON.stringify(value)
                        } else if (typeof value === 'boolean') {
                          displayValue = value ? 'true' : 'false'
                        } else {
                          displayValue = String(value)
                        }
                      }

                      return (
                        <td key={column}
                          className={typeof value === 'number' ? 'text-right' : ''}
                          style={{
                            whiteSpace: 'nowrap',
                            padding: '8px 12px',
                            minWidth: getColumnWidth(column),
                            maxWidth: getColumnWidth(column),
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={displayValue} // Show full value on hover
                        >
                          {displayValue}
                        </td>
                      )
                    })}
                    <td style={{
                      minWidth: '20px',
                      width: '20px',
                      padding: 0,
                      border: 'none'
                    }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="refresh-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{ minWidth: 'auto', padding: '6px 12px' }}
                >
                  First
                </button>
                <button
                  className="refresh-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{ minWidth: 'auto', padding: '6px 12px' }}
                >
                  Previous
                </button>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 12px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  className="refresh-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{ minWidth: 'auto', padding: '6px 12px' }}
                >
                  Next
                </button>
                <button
                  className="refresh-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{ minWidth: 'auto', padding: '6px 12px' }}
                >
                  Last
                </button>
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Data Explorer</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Provides direct read access to every table in the NovaChem Grangemouth Fabric Lakehouse. Use it to inspect raw records, validate data loading, check field values, and export snapshots for offline analysis. Each tab corresponds to one Lakehouse table with full column visibility and row-level search.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tables</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>SAP Production Orders</strong> — Order IDs, materials, quantities, scheduled and actual dates</li>
                  <li style={{ marginBottom: '4px' }}><strong>OT Process Events</strong> — Real-time tag events from plant SCADA and sensors</li>
                  <li style={{ marginBottom: '4px' }}><strong>Energy Consumption</strong> — Daily kWh, cost and carbon per production line</li>
                  <li style={{ marginBottom: '4px' }}><strong>Inventory Stock</strong> — Weekly stock snapshots with ABC classification and demand fields</li>
                  <li style={{ marginBottom: '4px' }}><strong>Batch Quality</strong> — Yield, purity, test results and CIP sequences per batch</li>
                  <li style={{ marginBottom: '4px' }}><strong>Maintenance Orders</strong> — PM / CM / EM work orders with downtime and cost data</li>
                  <li style={{ marginBottom: '4px' }}><strong>Run Rates</strong> — Actual and unconstrained run rates by line and material</li>
                  <li style={{ marginBottom: '4px' }}><strong>Downtime</strong> — Equipment downtime and CIP event catalogue</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Export</div>
                <p style={{ margin: 0 }}>Use the <strong>Export CSV</strong> and <strong>Export JSON</strong> buttons in the header to download the currently loaded table. Data reflects the live Fabric SQL Analytics Endpoint query at the time of the last refresh.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataExplorer
