import '../../pages/Dashboard.css'
import '../../pages/AIStudioLab.css'

function PermissionsTab({ config, updateConfig, validationErrors }) {
  const capabilities = [
    { key: 'canCreateAgents', name: 'Create Agents', description: 'Allow users to create new AI agents' },
    { key: 'canModifyConfig', name: 'Modify Configuration', description: 'Allow users to modify product configuration' },
    { key: 'canAccessRawData', name: 'Access Raw Data', description: 'Allow direct access to raw database data' },
    { key: 'canExportData', name: 'Export Data', description: 'Allow users to export data and reports' },
    { key: 'canViewAuditTrail', name: 'View Audit Trail', description: 'Allow viewing of audit logs and history' },
    { key: 'canManageUsers', name: 'Manage Users', description: 'Allow user management and role assignment' }
  ]

  const toggleCapability = (capabilityKey) => {
    updateConfig(`permissions.capabilities.${capabilityKey}`, !config.permissions.capabilities[capabilityKey])
  }

  const allowedCount = capabilities.filter(c => config.permissions.capabilities[c.key]).length
  const totalCount = capabilities.length

  return (
    <div>
      <div className="chart-card" style={{ padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="ai-studio-card-header" style={{ fontSize: '13px', fontWeight: '700', color: '#1F1F1F', margin: '0 0 4px 0' }}>
              PERMISSIONS & CAPABILITIES
            </h3>
            <p className="ai-studio-text" style={{ fontSize: '11px', color: '#6B6B6B', margin: 0 }}>
              Configure what users can do in this product
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
            {allowedCount} of {totalCount} Allowed
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#8B0000', marginBottom: '8px', textTransform: 'uppercase' }}>
          Assigned Roles
        </h4>
        <div className="chart-card" style={{
          padding: '12px',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {config.permissions.roles.map(role => (
              <span
                key={role}
                style={{
                  padding: '6px 12px',
                  background: '#DC143C',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'capitalize'
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Capabilities Section */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '8px', textTransform: 'uppercase' }}>
          User Capabilities
        </h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          {capabilities.map(capability => {
            const isEnabled = config.permissions.capabilities[capability.key]
            return (
              <label
                key={capability.key}
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
                  <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px', margin: 0 }}>
                    {capability.name}
                  </h5>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>
                    {capability.description}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleCapability(capability.key)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: '#DC143C'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: isEnabled ? '#DC143C' : '#6b7280' }}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Limits Section */}
      <div>
        <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '8px', textTransform: 'uppercase' }}>
          Usage Limits
        </h4>
        <div className="chart-card" style={{
          padding: '12px',
          background: 'white'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Max Concurrent Chats
              </label>
              <input
                type="number"
                value={config.limits.maxConcurrentChats}
                onChange={(e) => updateConfig('limits.maxConcurrentChats', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Chat History Days
              </label>
              <input
                type="number"
                value={config.limits.maxChatHistoryDays}
                onChange={(e) => updateConfig('limits.maxChatHistoryDays', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Max Agent Calls Per Request
              </label>
              <input
                type="number"
                value={config.limits.maxAgentCallsPerRequest}
                onChange={(e) => updateConfig('limits.maxAgentCallsPerRequest', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Rate Limit Per Minute
              </label>
              <input
                type="number"
                value={config.limits.rateLimitPerMinute}
                onChange={(e) => updateConfig('limits.rateLimitPerMinute', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionsTab