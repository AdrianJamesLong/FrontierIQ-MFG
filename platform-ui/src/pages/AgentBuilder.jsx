import { useState } from 'react'
import { Brain, Shield, Activity, AlertTriangle, Target, Lightbulb, FileText, MessageSquare, Settings, ChevronRight, Lock, Check, Info, Wrench, BarChart3 } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import './Dashboard.css'
import './AIStudioLab.css'

function AgentBuilder() {
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')

  const agents = [
    {
      id: 'data_agent', name: 'Data Agent', icon: MessageSquare, color: '#6366F1',
      tier: 'Tier 0', status: 'production', safetyClassification: 'Read-only', decisionType: 'Insights',
      owner: 'Platform', version: '3.0.0',
      description: 'Natural language interface to NovaChem production data, orders, and OT signals via Fabric Lakehouse.',
      capabilities: ['Query production orders', 'Browse Lakehouse tables', 'Explain KPI metrics', 'Natural language SQL'],
      knowledge: { dataDomains: ['SAP Orders', 'OT Signals', 'Downtime Reference', 'Run Rates'], scope: 'CPL-R01, R02, B01, F01', timeWindow: 'Real-time + 90 days historical' },
      guardrails: {
        allowed: ['Data queries', 'Metric explanations', 'Trend analysis', 'Table browsing'],
        disallowed: ['Production control', 'Data modification', 'System configuration'],
        confidenceThreshold: 0.7, citationRequired: true
      },
      deployment: { environment: 'Production', healthCheck: 'Passing', lastDeployed: '2026-04-01', rollbackVersion: '2.9.1' }
    },
    {
      id: 'performance_analyst', name: 'Performance Analyst', icon: BarChart3, color: '#3B82F6',
      tier: 'Tier 1', status: 'production', safetyClassification: 'Advisory', decisionType: 'Insights',
      owner: 'Operations Analytics', version: '2.1.0',
      description: 'Explains production KPIs, plan adherence, and OEE metrics for all CPL chemical production lines.',
      capabilities: ['Calculate plan adherence', 'OEE metrics', 'Variance analysis', 'Trend reporting'],
      knowledge: { dataDomains: ['Plan Adherence', 'OEE', 'Variance Analysis', 'Line Performance'], scope: 'CPL-R01, R02, B01, F01', timeWindow: 'Real-time + 30 days' },
      guardrails: {
        allowed: ['Metric calculation', 'Variance analysis', 'Trend reporting', 'Performance insights'],
        disallowed: ['Schedule changes', 'Equipment control', 'Operator ranking'],
        confidenceThreshold: 0.75, citationRequired: true
      },
      deployment: { environment: 'Production', healthCheck: 'Passing', lastDeployed: '2026-03-28', rollbackVersion: '2.0.3' }
    },
    {
      id: 'data_quality', name: 'Data Quality Guardian', icon: Shield, color: '#3B82F6',
      tier: 'Tier 1', status: 'production', safetyClassification: 'Advisory', decisionType: 'Insights',
      owner: 'Data Governance', version: '1.5.2',
      description: 'Validates Fabric Lakehouse data integrity, freshness, and completeness across all NovaChem data sources.',
      capabilities: ['Data freshness checks', 'Completeness validation', 'Anomaly detection', 'Quality scoring'],
      knowledge: { dataDomains: ['Data Freshness', 'Completeness', 'Accuracy', 'Consistency'], scope: 'All Lakehouse tables', timeWindow: 'Real-time monitoring' },
      guardrails: {
        allowed: ['Quality checks', 'Anomaly detection', 'Freshness validation', 'Completeness reporting'],
        disallowed: ['Data correction', 'Auto-fill missing data', 'Content inspection'],
        confidenceThreshold: 0.8, citationRequired: true
      },
      deployment: { environment: 'Production', healthCheck: 'Passing', lastDeployed: '2026-03-15', rollbackVersion: '1.5.1' }
    },
    {
      id: 'line_operations', name: 'Line Operations Supervisor', icon: Activity, color: '#3B82F6',
      tier: 'Tier 1', status: 'production', safetyClassification: 'Advisory', decisionType: 'Insights',
      owner: 'Operations Management', version: '1.8.0',
      description: 'Real-time digital supervisor for CPL-R01, R02, B01, F01 production lines — status, orders, and efficiency.',
      capabilities: ['Line performance', 'Multi-line comparison', 'Downtime tracking', 'Urgent order status'],
      knowledge: { dataDomains: ['Line Performance', 'Downtime Events', 'Line Comparison', 'Efficiency Metrics'], scope: 'CPL-R01, R02, B01, F01', timeWindow: 'Real-time + 30 days' },
      guardrails: {
        allowed: ['Line monitoring', 'Performance comparison', 'Status reporting', 'Issue identification'],
        disallowed: ['Line control', 'Equipment operation', 'Schedule modification'],
        confidenceThreshold: 0.7, citationRequired: true
      },
      deployment: { environment: 'Production', healthCheck: 'Passing', lastDeployed: '2026-03-20', rollbackVersion: '1.7.5' }
    },
    {
      id: 'downtime_rca', name: 'Downtime RCA Agent', icon: Wrench, color: '#F59E0B',
      tier: 'Tier 2', status: 'production', safetyClassification: 'Advisory', decisionType: 'Decisions',
      owner: 'Reliability Engineering', version: '2.0.1',
      description: 'Root cause analysis for CIP overruns, changeover failures, and downtime patterns across chemical process lines.',
      capabilities: ['Downtime pattern analysis', 'Root cause identification', 'CIP failure analysis', 'Preventive recommendations'],
      knowledge: { dataDomains: ['Downtime Events', 'CIP Records', 'Changeover History', 'Pattern Analysis'], scope: 'All production lines', timeWindow: 'Real-time + 24 months' },
      guardrails: {
        allowed: ['Pattern analysis', 'Root cause identification', 'Preventive recommendations', 'Trend reporting'],
        disallowed: ['Maintenance scheduling', 'Equipment repair authorisation', 'Blame assignment'],
        confidenceThreshold: 0.75, citationRequired: true
      },
      deployment: { environment: 'Production', healthCheck: 'Passing', lastDeployed: '2026-03-10', rollbackVersion: '1.9.8' }
    },
    {
      id: 'bottleneck_constraint', name: 'Bottleneck & Constraint Agent', icon: Target, color: '#F59E0B',
      tier: 'Tier 2', status: 'production', safetyClassification: 'Advisory', decisionType: 'Decisions',
      owner: 'Process Engineering', version: '1.6.3',
      description: 'Theory of Constraints analysis for chemical batch processes — identifies limiting steps and throughput opportunities.',
      capabilities: ['Bottleneck identification', 'Throughput analysis', 'Capacity comparison', 'Constraint relief modelling'],
      knowledge: { dataDomains: ['Throughput Analysis', 'Capacity Planning', 'Constraint Theory', 'Equipment Performance'], scope: 'All production equipment', timeWindow: 'Real-time + 6 months' },
      guardrails: {
        allowed: ['Bottleneck identification', 'Throughput analysis', 'Capacity comparison', 'Optimisation recommendations'],
        disallowed: ['Equipment modification', 'Capacity allocation', 'Resource reallocation'],
        confidenceThreshold: 0.75, citationRequired: true
      },
      deployment: { environment: 'Production', healthCheck: 'Passing', lastDeployed: '2026-03-05', rollbackVersion: '1.6.2' }
    },
    {
      id: 'operations_recommendation', name: 'Operations Recommendation', icon: Lightbulb, color: '#10B981',
      tier: 'Tier 3', status: 'production', safetyClassification: 'Advisory', decisionType: 'Actions',
      owner: 'Operations Excellence', version: '2.2.0',
      description: 'Orchestrates Tier 1/2 agents to synthesise insights into prioritised, ROI-ranked improvement actions.',
      capabilities: ['Agent orchestration', 'Multi-source synthesis', 'Priority ranking', 'Implementation guidance'],
      knowledge: { dataDomains: ['Cross-domain synthesis', 'Performance', 'Downtime', 'Throughput', 'ROI estimation'], scope: 'Entire production system', timeWindow: 'Real-time + historical context' },
      guardrails: {
        allowed: ['Agent orchestration', 'Recommendation synthesis', 'Priority ranking', 'Implementation guidance'],
        disallowed: ['Direct equipment control', 'Autonomous execution', 'Resource allocation'],
        confidenceThreshold: 0.8, citationRequired: true
      },
      deployment: { environment: 'Production', healthCheck: 'Passing', lastDeployed: '2026-04-01', rollbackVersion: '2.1.5' }
    },
    {
      id: 'executive_briefing', name: 'Executive Briefing', icon: FileText, color: '#10B981',
      tier: 'Tier 3', status: 'production', safetyClassification: 'Advisory', decisionType: 'Insights',
      owner: 'Executive Leadership', version: '1.9.0',
      description: 'Orchestrates specialists to create concise daily plant summaries and strategic risk insights for NovaChem leadership.',
      capabilities: ['Executive summaries', 'KPI highlights', 'Risk identification', 'Strategic insights'],
      knowledge: { dataDomains: ['Executive KPIs', 'Strategic metrics', 'Risk assessment', 'Business impact'], scope: 'Enterprise-wide', timeWindow: 'Configurable (daily/weekly/monthly)' },
      guardrails: {
        allowed: ['Summary generation', 'Strategic insights', 'Risk highlighting', 'Trend reporting'],
        disallowed: ['Operational decisions', 'Resource allocation', 'Strategic planning'],
        confidenceThreshold: 0.85, citationRequired: true
      },
      deployment: { environment: 'Production', healthCheck: 'Passing', lastDeployed: '2026-03-25', rollbackVersion: '1.8.7' }
    }
  ]

  const tierOrder = ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3']
  const groupedAgents = tierOrder.reduce((acc, tier) => {
    acc[tier] = agents.filter(a => a.tier === tier)
    return acc
  }, {})

  const tierColors = { 'Tier 0': '#6366F1', 'Tier 1': '#3B82F6', 'Tier 2': '#F59E0B', 'Tier 3': '#10B981' }
  const tierLabels = { 'Tier 0': 'Foundation', 'Tier 1': 'Analytical', 'Tier 2': 'Diagnostic', 'Tier 3': 'Prescriptive' }

  const sections = [
    { key: 'overview', label: 'Overview' },
    { key: 'knowledge', label: 'Knowledge' },
    { key: 'guardrails', label: 'Guardrails' },
    { key: 'deployment', label: 'Deployment' }
  ]

  return (
    <div className="page-container">
      <Breadcrumb items={[{ label: 'Platform', path: '/ai-trust-control' }, { label: 'Agent Builder' }]} />

      <div className="ai-studio-header" style={{ marginBottom: '12px' }}>
        <div className="ai-studio-icon-wrapper">
          <Brain size={28} className="ai-studio-icon" />
        </div>
        <div className="ai-studio-title-section">
          <h1>Agent Builder</h1>
          <p className="ai-studio-subtitle">Production agent configurations — capabilities, guardrails, and deployment status</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <span style={{ padding: '6px 12px', background: '#F3F4F6', color: '#374151', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            {agents.length} agents configured
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '12px' }}>
        {/* Agent List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tierOrder.map(tier => {
            const tierAgents = groupedAgents[tier]
            if (!tierAgents || tierAgents.length === 0) return null
            const tc = tierColors[tier]
            return (
              <div key={tier}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: tc, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc }} />
                  {tier} — {tierLabels[tier]}
                </div>
                {tierAgents.map(agent => {
                  const AgentIcon = agent.icon
                  const isSelected = selectedAgent?.id === agent.id
                  return (
                    <div key={agent.id} onClick={() => { setSelectedAgent(agent); setActiveSection('overview') }} style={{
                      padding: '10px', marginBottom: '4px',
                      background: isSelected ? `${agent.color}10` : 'white',
                      border: `1px solid ${isSelected ? agent.color : '#E5E7EB'}`,
                      borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', background: `${agent.color}20`, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AgentIcon size={14} style={{ color: agent.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1F1F1F', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
                          <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>{agent.decisionType}</div>
                        </div>
                        <ChevronRight size={12} style={{ color: agent.color, opacity: isSelected ? 1 : 0.3, flexShrink: 0 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Detail Panel */}
        <div>
          {selectedAgent ? (
            <div>
              {/* Agent Header */}
              <div className="chart-card" style={{ padding: '14px', marginBottom: '10px', background: `linear-gradient(135deg, ${selectedAgent.color}15 0%, ${selectedAgent.color}05 100%)`, border: `1px solid ${selectedAgent.color}40` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '52px', height: '52px', background: `linear-gradient(135deg, ${selectedAgent.color} 0%, ${selectedAgent.color}DD 100%)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${selectedAgent.color}40` }}>
                    {(() => { const Icon = selectedAgent.icon; return <Icon size={26} style={{ color: 'white' }} /> })()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1F1F1F' }}>{selectedAgent.name}</h2>
                    <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', lineHeight: '1.4' }}>{selectedAgent.description}</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 600, color: tierColors[selectedAgent.tier], background: `${tierColors[selectedAgent.tier]}15`, padding: '2px 7px', borderRadius: '4px' }}>{selectedAgent.tier}</span>
                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#374151', background: '#F3F4F6', padding: '2px 7px', borderRadius: '4px' }}>{selectedAgent.safetyClassification}</span>
                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#374151', background: '#F3F4F6', padding: '2px 7px', borderRadius: '4px' }}>{selectedAgent.decisionType}</span>
                      <span style={{ fontSize: '9px', fontWeight: 600, color: '#0F5132', background: '#E0F2E9', padding: '2px 7px', borderRadius: '4px' }}>v{selectedAgent.deployment.version}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#0F5132', background: '#E0F2E9', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                      {selectedAgent.deployment.healthCheck}
                    </div>
                    <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '4px' }}>Owner: {selectedAgent.owner}</div>
                  </div>
                </div>
              </div>

              {/* Section Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', borderBottom: '1px solid #E5E7EB' }}>
                {sections.map(sec => (
                  <button key={sec.key} onClick={() => setActiveSection(sec.key)} style={{
                    padding: '6px 14px', background: activeSection === sec.key ? '#F9FAFB' : 'transparent',
                    border: 'none', borderBottom: activeSection === sec.key ? `2px solid ${selectedAgent.color}` : '2px solid transparent',
                    cursor: 'pointer', fontSize: '11px', fontWeight: activeSection === sec.key ? 700 : 500,
                    color: activeSection === sec.key ? selectedAgent.color : '#6B7280', transition: 'all 0.15s',
                    borderRadius: '4px 4px 0 0'
                  }}>
                    {sec.label}
                  </button>
                ))}
              </div>

              {/* Overview Section */}
              {activeSection === 'overview' && (
                <div className="chart-card" style={{ padding: '14px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700 }}>Capabilities</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '14px' }}>
                    {selectedAgent.capabilities.map(cap => (
                      <div key={cap} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: `${selectedAgent.color}08`, borderRadius: '6px', border: `1px solid ${selectedAgent.color}20` }}>
                        <Check size={13} style={{ color: selectedAgent.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', color: '#374151' }}>{cap}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Info size={13} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
                      <div style={{ fontSize: '10px', color: '#92400E', lineHeight: '1.5' }}>
                        This agent is read-only advisory. All recommendations require human review before operational action.
                        Safety classification: <strong>{selectedAgent.safetyClassification}</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Knowledge Section */}
              {activeSection === 'knowledge' && (
                <div className="chart-card" style={{ padding: '14px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700 }}>Knowledge & Data Access</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Data Domains</div>
                      {selectedAgent.knowledge.dataDomains.map(d => (
                        <div key={d} style={{ fontSize: '11px', color: '#374151', padding: '4px 8px', background: '#F3F4F6', borderRadius: '4px', marginBottom: '3px' }}>{d}</div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Scope & Time Window</div>
                      <div style={{ padding: '8px', background: '#F9FAFB', borderRadius: '6px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '3px' }}>Asset Scope</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#1F1F1F' }}>{selectedAgent.knowledge.scope}</div>
                      </div>
                      <div style={{ padding: '8px', background: '#F9FAFB', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '3px' }}>Time Window</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#1F1F1F' }}>{selectedAgent.knowledge.timeWindow}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Guardrails Section */}
              {activeSection === 'guardrails' && (
                <div className="chart-card" style={{ padding: '14px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700 }}>Guardrails & Safety Boundaries</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#0F5132', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={11} style={{ color: '#10B981' }} /> Allowed Actions
                      </div>
                      {selectedAgent.guardrails.allowed.map(a => (
                        <div key={a} style={{ fontSize: '11px', color: '#374151', padding: '4px 8px', background: '#E0F2E9', borderRadius: '4px', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Check size={10} style={{ color: '#10B981', flexShrink: 0 }} /> {a}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={11} style={{ color: '#EF4444' }} /> Disallowed Actions
                      </div>
                      {selectedAgent.guardrails.disallowed.map(d => (
                        <div key={d} style={{ fontSize: '11px', color: '#374151', padding: '4px 8px', background: '#FEE2E2', borderRadius: '4px', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Lock size={10} style={{ color: '#EF4444', flexShrink: 0 }} /> {d}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>Confidence Threshold</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: selectedAgent.color }}>{(selectedAgent.guardrails.confidenceThreshold * 100).toFixed(0)}%</div>
                      <div style={{ fontSize: '9px', color: '#9ca3af' }}>Minimum for action</div>
                    </div>
                    <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>Citation Required</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: selectedAgent.guardrails.citationRequired ? '#10B981' : '#EF4444' }}>
                        {selectedAgent.guardrails.citationRequired ? 'Yes' : 'No'}
                      </div>
                      <div style={{ fontSize: '9px', color: '#9ca3af' }}>Data source linking</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Deployment Section */}
              {activeSection === 'deployment' && (
                <div className="chart-card" style={{ padding: '14px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700 }}>Deployment Status</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { label: 'Environment', value: selectedAgent.deployment.environment, icon: Settings, color: '#1C3668' },
                      { label: 'Health Check', value: selectedAgent.deployment.healthCheck, icon: Check, color: '#10B981' },
                      { label: 'Current Version', value: `v${selectedAgent.deployment.version}`, icon: Info, color: selectedAgent.color },
                      { label: 'Rollback Version', value: `v${selectedAgent.deployment.rollbackVersion}`, icon: AlertTriangle, color: '#F59E0B' },
                      { label: 'Last Deployed', value: selectedAgent.deployment.lastDeployed, icon: Settings, color: '#6B7280' },
                      { label: 'Owner', value: selectedAgent.owner, icon: Shield, color: '#6B7280' }
                    ].map(d => {
                      const DIcon = d.icon
                      return (
                        <div key={d.label} style={{ padding: '10px', background: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <DIcon size={12} style={{ color: d.color }} />
                            <span style={{ fontSize: '9px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{d.label}</span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F1F1F' }}>{d.value}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="chart-card" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
              <Brain size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>Select an agent to view configuration</p>
              <p style={{ fontSize: '11px', margin: 0, opacity: 0.7 }}>Choose any agent from the list to inspect its capabilities, guardrails, and deployment details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentBuilder
