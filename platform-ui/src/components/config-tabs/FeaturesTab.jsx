import '../../pages/Dashboard.css'
import '../../pages/AIStudioLab.css'

function FeaturesTab({ config, updateConfig, validationErrors }) {
  const features = [
    { key: 'chatHistory', name: 'Chat History', description: 'Enable chat history tracking and retrieval' },
    { key: 'auditTrail', name: 'Audit Trail', description: 'Track all user actions and system changes' },
    { key: 'healthMonitoring', name: 'Health Monitoring', description: 'Monitor system health and performance' },
    { key: 'dataExport', name: 'Data Export', description: 'Allow users to export data and reports' },
    { key: 'advancedSettings', name: 'Advanced Settings', description: 'Show advanced configuration options' }
  ]

  const toggleFeature = (featureKey) => {
    updateConfig(`ui.features.${featureKey}`, !config.ui.features[featureKey])
  }

  const enabledCount = features.filter(f => config.ui.features[f.key]).length
  const totalCount = features.length

  return (
    <div>
      <div className="chart-card" style={{ padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="ai-studio-card-header" style={{ fontSize: '13px', fontWeight: '700', color: '#1F1F1F', margin: '0 0 4px 0' }}>
              FEATURE FLAGS
            </h3>
            <p className="ai-studio-text" style={{ fontSize: '11px', color: '#6B6B6B', margin: 0 }}>
              Enable or disable specific features for this product
            </p>
          </div>
          <div style={{
            padding: '6px 12px',
            background: '#E5E7EB',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#6B7280'
          }}>
            {enabledCount} of {totalCount} Enabled
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {features.map(feature => {
          const isEnabled = config.ui.features[feature.key]
          return (
            <label
              key={feature.key}
              className="chart-card"
              style={{
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'space-between',
                padding: '12px',
                background: isEnabled ? '#F3F4F6' : 'white',
                border: isEnabled ? '2px solid #6B7280' : '1px solid #E8E8E8',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px', margin: 0 }}>
                  {feature.name}
                </h4>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>
                  {feature.description}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleFeature(feature.key)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#3B82F6'
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: '600', color: isEnabled ? '#3B82F6' : '#6b7280' }}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default FeaturesTab