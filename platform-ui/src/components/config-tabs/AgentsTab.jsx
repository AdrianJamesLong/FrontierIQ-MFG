import '../../pages/Dashboard.css'
import '../../pages/AIStudioLab.css'

function AgentsTab({ config, updateConfig, validationErrors }) {
  const allAgents = [
    { id: 'data_agent', name: 'Data Agent', tools: ['execute_kql_query', 'get_table_schema'] },
    { id: 'performance_analyst', name: 'Performance Analyst', tools: ['calculate_plan_adherence', 'get_oee_metrics', 'analyze_variance'] },
    { id: 'line_operations', name: 'Line Operations', tools: ['get_line_performance', 'compare_lines', 'get_downtime_events'] },
    { id: 'data_quality', name: 'Data Quality', tools: ['validate_data', 'check_completeness'] },
    { id: 'downtime_rca', name: 'Downtime RCA', tools: ['analyze_downtime', 'identify_patterns'] },
    { id: 'bottleneck_constraint', name: 'Bottleneck Constraint', tools: ['identify_bottlenecks', 'suggest_improvements'] },
    { id: 'operations_recommendation', name: 'Operations Recommendation', tools: ['generate_recommendations'] },
    { id: 'executive_briefing', name: 'Executive Briefing', tools: ['create_summary', 'generate_insights'] }
  ]

  const toggleAgent = (agentId) => {
    const isEnabled = config.agents.enabled.includes(agentId)

    if (isEnabled) {
      updateConfig('agents.enabled', config.agents.enabled.filter(id => id !== agentId))
      updateConfig('agents.disabled', [...config.agents.disabled, agentId])

      const newConfigs = { ...config.agents.configurations }
      delete newConfigs[agentId]
      updateConfig('agents.configurations', newConfigs)
    } else {
      updateConfig('agents.enabled', [...config.agents.enabled, agentId])
      updateConfig('agents.disabled', config.agents.disabled.filter(id => id !== agentId))

      const agent = allAgents.find(a => a.id === agentId)
      updateConfig(`agents.configurations.${agentId}`, {
        enabled: true,
        tools: agent.tools,
        disabledTools: [],
        systemPromptOverride: null,
        maxTokens: 4096,
        temperature: 0.7
      })
    }
  }

  const toggleAgentTool = (agentId, tool) => {
    const agentConfig = config.agents.configurations[agentId]
    const isEnabled = agentConfig.tools.includes(tool)

    if (isEnabled) {
      updateConfig(
        `agents.configurations.${agentId}.tools`,
        agentConfig.tools.filter(t => t !== tool)
      )
      updateConfig(
        `agents.configurations.${agentId}.disabledTools`,
        [...agentConfig.disabledTools, tool]
      )
    } else {
      updateConfig(
        `agents.configurations.${agentId}.tools`,
        [...agentConfig.tools, tool]
      )
      updateConfig(
        `agents.configurations.${agentId}.disabledTools`,
        agentConfig.disabledTools.filter(t => t !== tool)
      )
    }
  }

  const enabledCount = config.agents.enabled.length
  const totalCount = allAgents.length

  return (
    <div>
      <div className="chart-card" style={{ padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#8B0000', margin: '0 0 4px 0' }}>
              AGENT CONFIGURATION
            </h3>
            <p style={{ fontSize: '11px', color: '#B22222', margin: 0 }}>
              Enable or disable agents and configure their available tools
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
        {allAgents.map(agent => {
          const isEnabled = config.agents.enabled.includes(agent.id)
          const agentConfig = config.agents.configurations[agent.id]

          return (
            <div
              key={agent.id}
              className="chart-card"
              style={{
                padding: '12px',
                border: isEnabled ? '2px solid #6B7280' : '1px solid #E8E8E8',
                background: isEnabled ? '#F3F4F6' : 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: isEnabled ? '10px' : 0 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px', margin: 0 }}>
                    {agent.name}
                  </h4>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>
                    ID: {agent.id}
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleAgent(agent.id)}
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
                </label>
              </div>

              {isEnabled && agentConfig && (
                <div style={{
                  padding: '10px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  marginTop: '10px'
                }}>
                  <h5 style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Available Tools
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {agent.tools.map(tool => {
                      const isToolEnabled = agentConfig.tools.includes(tool)
                      return (
                        <label
                          key={tool}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: isToolEnabled ? '#DBEAFE' : '#F9FAFB',
                            border: `1px solid ${isToolEnabled ? '#3B82F6' : '#E5E7EB'}`,
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            color: isToolEnabled ? '#1E40AF' : '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isToolEnabled}
                            onChange={() => toggleAgentTool(agent.id, tool)}
                            style={{ cursor: 'pointer', accentColor: '#3B82F6', width: '12px', height: '12px' }}
                          />
                          {tool}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AgentsTab
