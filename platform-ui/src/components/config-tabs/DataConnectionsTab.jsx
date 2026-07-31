import '../../pages/Dashboard.css'
import '../../pages/AIStudioLab.css'

function DataConnectionsTab({ config, updateConfig, validationErrors }) {
  const toggleDatabase = (dbName) => {
    const databases = config.dataConnections.eventhouse.databases
    if (databases.includes(dbName)) {
      updateConfig(
        'dataConnections.eventhouse.databases',
        databases.filter(db => db !== dbName)
      )
    } else {
      updateConfig(
        'dataConnections.eventhouse.databases',
        [...databases, dbName]
      )
    }
  }

  const toggleKustoTable = (tableName) => {
    const tables = config.dataConnections.eventhouse.kustoTables || []
    if (tables.includes(tableName)) {
      updateConfig(
        'dataConnections.eventhouse.kustoTables',
        tables.filter(t => t !== tableName)
      )
    } else {
      updateConfig(
        'dataConnections.eventhouse.kustoTables',
        [...tables, tableName]
      )
    }
  }

  const addRestrictedTable = () => {
    const tableName = prompt('Enter table name to restrict:')
    if (tableName && tableName.trim()) {
      updateConfig(
        'dataConnections.eventhouse.restrictedTables',
        [...config.dataConnections.eventhouse.restrictedTables, tableName.trim()]
      )
    }
  }

  const removeRestrictedTable = (tableName) => {
    updateConfig(
      'dataConnections.eventhouse.restrictedTables',
      config.dataConnections.eventhouse.restrictedTables.filter(t => t !== tableName)
    )
  }

  const toggleAPI = (apiName) => {
    const isEnabled = config.dataConnections.externalAPIs.enabled.includes(apiName)

    if (isEnabled) {
      updateConfig(
        'dataConnections.externalAPIs.enabled',
        config.dataConnections.externalAPIs.enabled.filter(api => api !== apiName)
      )
      updateConfig(
        'dataConnections.externalAPIs.disabled',
        [...config.dataConnections.externalAPIs.disabled, apiName]
      )
    } else {
      updateConfig(
        'dataConnections.externalAPIs.enabled',
        [...config.dataConnections.externalAPIs.enabled, apiName]
      )
      updateConfig(
        'dataConnections.externalAPIs.disabled',
        config.dataConnections.externalAPIs.disabled.filter(api => api !== apiName)
      )
    }
  }

  const allAPIs = [
    ...config.dataConnections.externalAPIs.enabled,
    ...config.dataConnections.externalAPIs.disabled
  ]

  const availableDatabases = ['ProductionDB', 'QualityDB', 'MaintenanceDB', 'InventoryDB']
  
  // Fabric Lakehouse tables (Fabric SQL Analytics Endpoint)
  const kustoTables = [
    { name: 'sap_production_orders', description: 'SAP production orders — NovaChem Grangemouth', endpoint: '/api/data' },
    { name: 'ot_process_events', description: 'Real-time OT tag events from plant systems', endpoint: '/api/ot-process-events' },
    { name: 'run_rates', description: 'Actual run rates by line and material', endpoint: '/api/runrates' },
    { name: 'downtime', description: 'Equipment downtime and CIP event records', endpoint: '/api/downtime' },
    { name: 'unconstrained_run_rates', description: 'Theoretical maximum run rates by line and material', endpoint: '/api/unconstrained-runrates' },
    { name: 'energy_consumption', description: 'Daily energy consumption, cost and carbon per line', endpoint: '/api/energy' },
    { name: 'inventory_stock', description: 'Weekly stock snapshots with ABC classification', endpoint: '/api/inventory' },
    { name: 'batch_quality', description: 'Batch quality records — yield, purity, test results', endpoint: '/api/batch-quality' },
    { name: 'maintenance_orders', description: 'PM / CM / EM work orders with downtime and cost data', endpoint: '/api/maintenance-orders' },
  ]

  const enabledAPIsCount = config.dataConnections.externalAPIs.enabled.length
  const totalAPIsCount = allAPIs.length
  const enabledDBsCount = config.dataConnections.eventhouse.databases.length
  const totalDBsCount = availableDatabases.length
  const enabledKustoTablesCount = (config.dataConnections.eventhouse.kustoTables || []).length
  const totalKustoTablesCount = kustoTables.length

  return (
    <div>
      <div className="chart-card" style={{ padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#8B0000', margin: '0 0 4px 0' }}>
              DATA CONNECTIONS
            </h3>
            <p style={{ fontSize: '11px', color: '#B22222', margin: 0 }}>
              Configure database access and external API connections
            </p>
          </div>
          <div style={{
            padding: '6px 12px',
            background: '#E5E7EB',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#DC143C'
          }}>
            {enabledKustoTablesCount} Lakehouse Tables, {enabledAPIsCount} APIs
          </div>
        </div>
      </div>

      {/* Kusto Tables Configuration */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#8B0000', marginBottom: '8px', textTransform: 'uppercase' }}>
          Fabric Lakehouse Tables
        </h4>

        <div className="chart-card" style={{
          padding: '12px',
          background: 'white'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.dataConnections.eventhouse.enabled}
              onChange={(e) => updateConfig('dataConnections.eventhouse.enabled', e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: '#DC143C'
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B' }}>
              Enable Fabric Lakehouse Connection
            </span>
          </label>

          {config.dataConnections.eventhouse.enabled && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                  Active Lakehouse Tables
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {kustoTables.map(table => {
                    const isSelected = (config.dataConnections.eventhouse.kustoTables || []).includes(table.name)
                    return (
                      <label
                        key={table.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: isSelected ? '#F3F4F6' : '#F9FAFB',
                          border: `2px solid ${isSelected ? '#6B7280' : '#E2E8F0'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleKustoTable(table.name)}
                            style={{ cursor: 'pointer', accentColor: '#3B82F6', width: '14px', height: '14px' }}
                          />
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>
                              {table.name}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>
                              {table.description}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '9px',
                          fontWeight: '600',
                          color: '#6B7280',
                          fontFamily: 'monospace',
                          background: '#F3F4F6',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {table.endpoint}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748B' }}>
                    Restricted Tables
                  </label>
                  <button
                    onClick={addRestrictedTable}
                    style={{
                      padding: '4px 10px',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Table
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {config.dataConnections.eventhouse.restrictedTables.map(table => (
                    <span
                      key={table}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: '#FEE2E2',
                        border: '1px solid #EF4444',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#991B1B'
                      }}
                    >
                      {table}
                      <button
                        onClick={() => removeRestrictedTable(table)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#991B1B',
                          cursor: 'pointer',
                          padding: '0',
                          fontSize: '14px',
                          lineHeight: '1'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {config.dataConnections.eventhouse.restrictedTables.length === 0 && (
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>
                      No restricted tables
                    </span>
                  )}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.dataConnections.eventhouse.readOnly}
                  onChange={(e) => updateConfig('dataConnections.eventhouse.readOnly', e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#3B82F6'
                  }}
                />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B' }}>
                  Read-Only Access (Prevent data modifications)
                </span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* External APIs */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '8px', textTransform: 'uppercase' }}>
          External API Connections
        </h4>

        {allAPIs.length > 0 ? (
          <div style={{ display: 'grid', gap: '8px' }}>
            {allAPIs.map(api => {
              const isEnabled = config.dataConnections.externalAPIs.enabled.includes(api)
              return (
                <label
                  key={api}
                  className="chart-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: isEnabled ? '#F0F9FF' : 'white',
                    border: isEnabled ? '2px solid #3B82F6' : '1px solid #E8E8E8',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>
                      {api.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      {api}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleAPI(api)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: '#3B82F6'
                    }}
                  />
                </label>
              )
            })}
          </div>
        ) : (
          <div className="chart-card" style={{
            padding: '24px',
            textAlign: 'center',
            background: 'white',
            border: '2px dashed #E2E8F0'
          }}>
            <p style={{ color: '#94A3B8', fontSize: '11px', margin: 0 }}>
              No external APIs configured
            </p>
          </div>
        )}
      </div>

      {/* API Endpoints */}
      <div>
        <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '8px', textTransform: 'uppercase' }}>
          API Endpoint Access
        </h4>

        <div className="chart-card" style={{
          padding: '12px',
          background: 'white'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
              Enabled Endpoints
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {config.apiEndpoints.enabled.map(endpoint => (
                <div
                  key={endpoint}
                  style={{
                    padding: '6px 10px',
                    background: '#F0FDF4',
                    border: '1px solid #10B981',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#065F46',
                    fontFamily: 'monospace'
                  }}
                >
                  {endpoint}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
              Disabled Endpoints
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {config.apiEndpoints.disabled.map(endpoint => (
                <div
                  key={endpoint}
                  style={{
                    padding: '6px 10px',
                    background: '#FEE2E2',
                    border: '1px solid #EF4444',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#991B1B',
                    fontFamily: 'monospace'
                  }}
                >
                  {endpoint}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataConnectionsTab