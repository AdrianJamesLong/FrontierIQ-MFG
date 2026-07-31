import { useState, useEffect } from 'react'
import { Brain, MessageSquare, TrendingUp, Activity, Shield, AlertTriangle, Lightbulb, Clock, CheckCircle, Zap, Target, BarChart3, Info, ChevronRight, ArrowUpRight, ArrowDownRight, Server, AlertCircle, XCircle, Wrench, FileText } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import './Dashboard.css'
import './AIStudioLab.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AgentFleet() {
  const [activeTab, setActiveTab] = useState('overview')
  const [healthSubTab, setHealthSubTab] = useState('status')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [performanceData, setPerformanceData] = useState(null)
  const [loadingPerformance, setLoadingPerformance] = useState(false)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoadingPerformance(true)
      try {
        const response = await fetch(`${API_URL}/api/agent-performance/metrics`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) setPerformanceData(result.data)
        }
      } catch (error) {
        console.log('Using static performance data:', error.message)
      } finally {
        setLoadingPerformance(false)
      }
    }
    fetchPerformanceData()
    const interval = setInterval(fetchPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [])

  const agentFleet = {
    tier0: {
      id: 'tier0', name: 'Foundation Layer', tierName: 'Tier 0', icon: Brain, color: '#6B7280',
      agents: [{
        id: 'smart_assistant', name: 'Data Agent', icon: MessageSquare, color: '#6366F1',
        status: 'Active', queries: 140, successRate: 97.2, avgResponseTime: 1.2,
        description: 'Natural language interface to NovaChem production data and Fabric Lakehouse',
        tier: 'Tier 0', lastExecution: '2026-04-05T14:30:15',
        performance: { totalExecutions: 140, successfulExecutions: 136, failedExecutions: 4, avgTokensIn: 1250, avgTokensOut: 450, avgDuration: 1.2, peakDuration: 3.8, minDuration: 0.4, last24h: 23, last7d: 140, toolCallsAvg: 2.3, cacheHitRate: 78.5 },
        recentTrends: { executionChange: 12, responseTimeChange: -8, successRateChange: 2 }
      }]
    },
    tier1: {
      id: 'tier1', name: 'Analytical Layer', tierName: 'Tier 1', icon: TrendingUp, color: '#3B82F6',
      agents: [
        {
          id: 'performance_analyst', name: 'Performance Analyst', icon: BarChart3, color: '#3B82F6',
          status: 'Active', queries: 78, successRate: 95.8, avgResponseTime: 1.5,
          description: 'Explains production KPIs, plan adherence and OEE for CPL lines',
          tier: 'Tier 1', lastExecution: '2026-04-05T10:07:57',
          performance: { totalExecutions: 78, successfulExecutions: 75, failedExecutions: 3, avgTokensIn: 945, avgTokensOut: 1850, avgDuration: 1.5, peakDuration: 4.2, minDuration: 0.8, last24h: 12, last7d: 78, toolCallsAvg: 3.1, cacheHitRate: 82.3 },
          recentTrends: { executionChange: 15, responseTimeChange: -5, successRateChange: 1 }
        },
        {
          id: 'data_quality', name: 'Data Quality Agent', icon: Shield, color: '#3B82F6',
          status: 'Active', queries: 37, successRate: 98.1, avgResponseTime: 0.9,
          description: 'Validates Fabric Lakehouse data integrity and freshness',
          tier: 'Tier 1', lastExecution: '2026-04-05T10:22:41',
          performance: { totalExecutions: 37, successfulExecutions: 36, failedExecutions: 1, avgTokensIn: 720, avgTokensOut: 980, avgDuration: 0.9, peakDuration: 2.1, minDuration: 0.5, last24h: 8, last7d: 37, toolCallsAvg: 2.8, cacheHitRate: 85.1 },
          recentTrends: { executionChange: 8, responseTimeChange: -12, successRateChange: 0 }
        },
        {
          id: 'line_operations', name: 'Line Operations Supervisor', icon: Activity, color: '#3B82F6',
          status: 'Active', queries: 56, successRate: 94.6, avgResponseTime: 1.3,
          description: 'Real-time monitoring of CPL-R01, R02, B01, F01 production lines',
          tier: 'Tier 1', lastExecution: '2026-04-04T16:45:12',
          performance: { totalExecutions: 56, successfulExecutions: 53, failedExecutions: 3, avgTokensIn: 890, avgTokensOut: 1420, avgDuration: 1.3, peakDuration: 3.5, minDuration: 0.7, last24h: 9, last7d: 56, toolCallsAvg: 2.5, cacheHitRate: 79.2 },
          recentTrends: { executionChange: 5, responseTimeChange: 3, successRateChange: -2 }
        }
      ]
    },
    tier2: {
      id: 'tier2', name: 'Diagnostic Layer', tierName: 'Tier 2', icon: AlertTriangle, color: '#F59E0B',
      agents: [
        {
          id: 'bottleneck_constraint', name: 'Bottleneck Agent', icon: Target, color: '#F59E0B',
          status: 'Active', queries: 28, successRate: 96.4, avgResponseTime: 2.1,
          description: 'Identifies throughput constraints across chemical process lines',
          tier: 'Tier 2', lastExecution: '2026-04-04T11:30:22',
          performance: { totalExecutions: 28, successfulExecutions: 27, failedExecutions: 1, avgTokensIn: 1100, avgTokensOut: 2200, avgDuration: 2.1, peakDuration: 5.8, minDuration: 1.2, last24h: 4, last7d: 28, toolCallsAvg: 3.8, cacheHitRate: 71.4 },
          recentTrends: { executionChange: 3, responseTimeChange: -10, successRateChange: 1 }
        },
        {
          id: 'downtime_rca', name: 'Downtime RCA Agent', icon: Wrench, color: '#F59E0B',
          status: 'Active', queries: 42, successRate: 92.9, avgResponseTime: 2.8,
          description: 'Root cause analysis for CIP failures and changeover overruns',
          tier: 'Tier 2', lastExecution: '2026-04-04T09:15:44',
          performance: { totalExecutions: 42, successfulExecutions: 39, failedExecutions: 3, avgTokensIn: 1450, avgTokensOut: 2800, avgDuration: 2.8, peakDuration: 7.2, minDuration: 1.5, last24h: 6, last7d: 42, toolCallsAvg: 4.2, cacheHitRate: 68.9 },
          recentTrends: { executionChange: 18, responseTimeChange: 5, successRateChange: -3 }
        }
      ]
    },
    tier3: {
      id: 'tier3', name: 'Prescriptive Layer', tierName: 'Tier 3', icon: Lightbulb, color: '#10B981',
      agents: [
        {
          id: 'operations_recommendation', name: 'Operations Recommendation', icon: Lightbulb, color: '#10B981',
          status: 'Active', queries: 31, successRate: 93.5, avgResponseTime: 3.4,
          description: 'Synthesises Tier 1/2 insights into prioritised improvement actions',
          tier: 'Tier 3', lastExecution: '2026-04-05T08:45:33',
          performance: { totalExecutions: 31, successfulExecutions: 29, failedExecutions: 2, avgTokensIn: 1850, avgTokensOut: 3200, avgDuration: 3.4, peakDuration: 9.1, minDuration: 2.0, last24h: 5, last7d: 31, toolCallsAvg: 5.1, cacheHitRate: 65.2 },
          recentTrends: { executionChange: 20, responseTimeChange: -8, successRateChange: 2 }
        },
        {
          id: 'executive_briefing', name: 'Executive Briefing', icon: FileText, color: '#10B981',
          status: 'Active', queries: 18, successRate: 100, avgResponseTime: 4.1,
          description: 'Daily plant summaries and strategic insights for leadership',
          tier: 'Tier 3', lastExecution: '2026-04-05T07:00:00',
          performance: { totalExecutions: 18, successfulExecutions: 18, failedExecutions: 0, avgTokensIn: 2200, avgTokensOut: 3800, avgDuration: 4.1, peakDuration: 8.3, minDuration: 2.8, last24h: 3, last7d: 18, toolCallsAvg: 5.8, cacheHitRate: 72.3 },
          recentTrends: { executionChange: 10, responseTimeChange: -3, successRateChange: 0 }
        }
      ]
    }
  }

  const allAgents = Object.values(agentFleet).flatMap(tier => tier.agents)
  const totalQueries = allAgents.reduce((sum, a) => sum + a.queries, 0)
  const avgSuccess = (allAgents.reduce((sum, a) => sum + a.successRate, 0) / allAgents.length).toFixed(1)
  const avgResponse = (allAgents.reduce((sum, a) => sum + a.avgResponseTime, 0) / allAgents.length).toFixed(1)

  const tabStyle = (key) => ({
    padding: '8px 16px',
    background: activeTab === key ? '#F9FAFB' : 'transparent',
    border: 'none',
    borderBottom: activeTab === key ? '2px solid #1C3668' : '2px solid transparent',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: activeTab === key ? 700 : 500,
    color: activeTab === key ? '#1C3668' : '#6B7280',
    transition: 'all 0.2s', borderRadius: '4px 4px 0 0'
  })

  return (
    <div className="page-container">
      <Breadcrumb items={[{ label: 'Platform', path: '/ai-trust-control' }, { label: 'Agent Fleet' }]} />

      <div className="ai-studio-header" style={{ marginBottom: '12px' }}>
        <div className="ai-studio-icon-wrapper">
          <Activity size={28} className="ai-studio-icon" />
        </div>
        <div className="ai-studio-title-section">
          <h1>Agent Fleet</h1>
          <p className="ai-studio-subtitle">Monitor all AI agents — performance, health and runtime telemetry</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
        {[
          { label: 'Total Agents', value: allAgents.length, color: '#1C3668', icon: Brain },
          { label: 'Total Queries (7d)', value: totalQueries, color: '#3B82F6', icon: Activity },
          { label: 'Avg Success Rate', value: `${avgSuccess}%`, color: '#10B981', icon: CheckCircle },
          { label: 'Avg Response Time', value: `${avgResponse}s`, color: '#F59E0B', icon: Clock }
        ].map(kpi => {
          const KpiIcon = kpi.icon
          return (
            <div key={kpi.label} className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <KpiIcon size={13} style={{ color: kpi.color }} />
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{kpi.label}</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </div>
          )
        })}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #E5E7EB', marginBottom: '12px' }}>
        {[
          { key: 'overview', label: 'Fleet Overview', icon: Brain },
          { key: 'performance', label: 'Performance', icon: BarChart3 },
          { key: 'health', label: 'Health', icon: CheckCircle }
        ].map(tab => {
          const TabIcon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabStyle(tab.key)}>
              <TabIcon size={13} />
              <span>{tab.label}</span>
            </button>
          )
        })}
        {loadingPerformance && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#6B7280', alignSelf: 'center', padding: '0 8px' }}>
            Refreshing metrics...
          </span>
        )}
      </div>

      {/* Fleet Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.values(agentFleet).map(tier => {
            const TierIcon = tier.icon
            return (
              <div key={tier.id} className="chart-card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', background: tier.color, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TierIcon size={14} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F1F1F' }}>{tier.tierName}: {tier.name}</span>
                    <span style={{ marginLeft: '8px', fontSize: '9px', color: '#6B7280' }}>{tier.agents.length} agent{tier.agents.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tier.agents.length}, 1fr)`, gap: '8px' }}>
                  {tier.agents.map(agent => {
                    const AgentIcon = agent.icon
                    return (
                      <div key={agent.id} style={{ padding: '10px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ width: '32px', height: '32px', background: `${agent.color}20`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AgentIcon size={16} style={{ color: agent.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1F1F1F' }}>{agent.name}</div>
                            <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '1px' }}>{agent.description}</div>
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#0F5132', background: '#E0F2E9', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                            {agent.status}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div style={{ textAlign: 'center', padding: '4px', background: 'white', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: agent.color }}>{agent.queries}</div>
                            <div style={{ fontSize: '8px', color: '#6B7280' }}>Queries</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '4px', background: 'white', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>{agent.successRate}%</div>
                            <div style={{ fontSize: '8px', color: '#6B7280' }}>Success</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '4px', background: 'white', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>{agent.avgResponseTime}s</div>
                            <div style={{ fontSize: '8px', color: '#6B7280' }}>Avg Time</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div style={{ display: 'flex', gap: '12px', height: 'calc(100vh - 280px)', minHeight: '400px' }}>
          {/* Agent List */}
          <div style={{ width: '220px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {allAgents.map(agent => {
              const AgentIcon = agent.icon
              const isSelected = selectedAgent?.id === agent.id
              const liveData = performanceData?.[agent.id]
              const displaySuccess = liveData ? liveData.successRate : agent.successRate
              const displayTime = liveData ? liveData.avgDuration : agent.avgResponseTime
              const displayQueries = liveData ? liveData.totalExecutions : agent.queries
              return (
                <div key={agent.id} onClick={() => setSelectedAgent(agent)} style={{
                  padding: '10px', background: isSelected ? `${agent.color}15` : 'white',
                  border: `1px solid ${isSelected ? agent.color : '#E5E7EB'}`, borderRadius: '8px',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '28px', height: '28px', background: `${agent.color}20`, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AgentIcon size={14} style={{ color: agent.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#1F1F1F', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</h3>
                      <p style={{ margin: '1px 0 0 0', fontSize: '8px', color: '#6B7280' }}>{agent.tier}</p>
                    </div>
                    <ChevronRight size={12} style={{ color: agent.color, opacity: isSelected ? 1 : 0.3 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    <div style={{ textAlign: 'center', padding: '4px 2px', background: '#F9FAFB', borderRadius: '3px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: agent.color }}>{displayQueries}</div>
                      <div style={{ fontSize: '7px', color: '#6B7280', marginTop: '1px' }}>Queries</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '4px 2px', background: '#F9FAFB', borderRadius: '3px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{displaySuccess}%</div>
                      <div style={{ fontSize: '7px', color: '#6B7280', marginTop: '1px' }}>Success</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '4px 2px', background: '#F9FAFB', borderRadius: '3px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>{displayTime}s</div>
                      <div style={{ fontSize: '7px', color: '#6B7280', marginTop: '1px' }}>Time</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail Panel */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {selectedAgent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Agent Header */}
                <div className="chart-card" style={{ padding: '14px', background: `linear-gradient(135deg, ${selectedAgent.color}15 0%, ${selectedAgent.color}05 100%)`, border: `1px solid ${selectedAgent.color}40` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${selectedAgent.color} 0%, ${selectedAgent.color}DD 100%)`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${selectedAgent.color}40` }}>
                      {(() => { const Icon = selectedAgent.icon; return <Icon size={24} style={{ color: 'white' }} /> })()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1F1F1F' }}>{selectedAgent.name}</h2>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', lineHeight: '1.4' }}>{selectedAgent.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: 600 }}>{selectedAgent.tier}</span>
                        <span style={{ fontSize: '9px', color: '#6B7280' }}>•</span>
                        <span style={{ fontSize: '9px', color: '#6B7280' }}>Last: {new Date(selectedAgent.lastExecution).toLocaleString()}</span>
                      </div>
                    </div>
                    <span style={{ padding: '6px 12px', background: '#E0F2E9', color: '#0F5132', borderRadius: '6px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                      {selectedAgent.status}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'Total Executions', value: selectedAgent.performance.totalExecutions, color: selectedAgent.color, sub: 'Last 7 days', icon: Activity },
                    { label: 'Success Rate', value: `${selectedAgent.successRate}%`, color: '#10B981', sub: `${selectedAgent.performance.successfulExecutions} / ${selectedAgent.performance.totalExecutions}`, icon: CheckCircle },
                    { label: 'Avg Response', value: `${selectedAgent.avgResponseTime}s`, color: '#F59E0B', sub: `Peak: ${selectedAgent.performance.peakDuration}s`, icon: Clock },
                    { label: 'Cache Hit Rate', value: `${selectedAgent.performance.cacheHitRate}%`, color: '#8B5CF6', sub: 'Efficiency', icon: Zap }
                  ].map(m => {
                    const MIcon = m.icon
                    return (
                      <div key={m.label} className="chart-card" style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <MIcon size={12} style={{ color: m.color }} />
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{m.label}</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>{m.sub}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Execution Performance */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#1F1F1F' }}>Execution Performance</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>Response Range</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ padding: '4px 8px', background: '#E0F2E9', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#0F5132' }}>Min: {selectedAgent.performance.minDuration}s</span>
                        <span style={{ padding: '4px 8px', background: '#FEE2E2', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#991B1B' }}>Max: {selectedAgent.performance.peakDuration}s</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>Volume</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ padding: '4px 8px', background: '#F3F4F6', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#1F1F1F' }}>24h: {selectedAgent.performance.last24h}</span>
                        <span style={{ padding: '4px 8px', background: '#F3F4F6', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#1F1F1F' }}>7d: {selectedAgent.performance.last7d}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>Tool Calls / Execution</div>
                      <span style={{ padding: '4px 8px', background: `${selectedAgent.color}15`, borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: selectedAgent.color }}>
                        {selectedAgent.performance.toolCallsAvg} tools/exec
                      </span>
                    </div>
                  </div>
                </div>

                {/* Token Usage */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#1F1F1F' }}>Token Usage</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '6px', fontWeight: 600 }}>Avg Input Tokens</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#3B82F6' }}>{selectedAgent.performance.avgTokensIn.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#6B7280', marginBottom: '6px', fontWeight: 600 }}>Avg Output Tokens</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>{selectedAgent.performance.avgTokensOut.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', padding: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={12} style={{ color: '#D97706', flexShrink: 0 }} />
                      <span style={{ fontSize: '9px', color: '#92400E', lineHeight: '1.4' }}>
                        <strong>Total per execution:</strong> ~{(selectedAgent.performance.avgTokensIn + selectedAgent.performance.avgTokensOut).toLocaleString()} tokens
                        &nbsp;({selectedAgent.performance.cacheHitRate}% cache efficiency)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trends */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#1F1F1F' }}>Week-over-Week Trends</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { label: 'Executions', change: selectedAgent.recentTrends.executionChange, positiveIsGood: true },
                      { label: 'Response Time', change: selectedAgent.recentTrends.responseTimeChange, positiveIsGood: false },
                      { label: 'Success Rate', change: selectedAgent.recentTrends.successRateChange, positiveIsGood: true }
                    ].map(t => {
                      const isPositive = t.change > 0
                      const isGood = t.positiveIsGood ? isPositive : !isPositive
                      return (
                        <div key={t.label} style={{ flex: 1, padding: '8px', background: isGood ? '#E0F2E9' : '#FEE2E2', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isPositive ? <ArrowUpRight size={14} style={{ color: isGood ? '#10B981' : '#EF4444' }} /> : <ArrowDownRight size={14} style={{ color: isGood ? '#10B981' : '#EF4444' }} />}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: isGood ? '#0F5132' : '#991B1B' }}>{Math.abs(t.change)}%</div>
                            <div style={{ fontSize: '8px', color: isGood ? '#0F5132' : '#991B1B' }}>{t.label}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280' }}>
                <TrendingUp size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>Select an agent to view performance details</p>
                <p style={{ fontSize: '11px', margin: 0, opacity: 0.7 }}>Click any agent card on the left</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Tab */}
      {activeTab === 'health' && (
        <div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', borderBottom: '1px solid #E5E7EB' }}>
            {[
              { key: 'status', label: 'Status Overview', icon: CheckCircle },
              { key: 'agents', label: 'Agent Health', icon: Activity },
              { key: 'infrastructure', label: 'Infrastructure', icon: Server }
            ].map(sub => {
              const SubIcon = sub.icon
              const isActive = healthSubTab === sub.key
              return (
                <button key={sub.key} onClick={() => setHealthSubTab(sub.key)} style={{
                  padding: '6px 12px', background: isActive ? '#F9FAFB' : 'transparent', border: 'none',
                  borderBottom: isActive ? '2px solid #10B981' : '2px solid transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px',
                  fontWeight: isActive ? 600 : 500, color: isActive ? '#10B981' : '#6B7280',
                  transition: 'all 0.2s', borderRadius: '4px 4px 0 0'
                }}>
                  <SubIcon size={12} />
                  <span>{sub.label}</span>
                </button>
              )
            })}
          </div>

          {healthSubTab === 'status' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'System Status', value: 'Healthy', sub: 'All agents operational', color: '#10B981', bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', icon: CheckCircle, white: true },
                  { label: 'Uptime', value: '99.8%', sub: 'Last 30 days', color: '#10B981', icon: Activity },
                  { label: 'Active Incidents', value: '0', sub: 'Last 7 days', color: '#F59E0B', icon: AlertCircle },
                  { label: 'Error Rate', value: '0.2%', sub: 'Fleet average', color: '#EF4444', icon: XCircle }
                ].map(s => {
                  const SIcon = s.icon
                  return (
                    <div key={s.label} className="stat-card" style={{ padding: '10px', background: s.bg, color: s.white ? 'white' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <SIcon size={12} style={{ color: s.white ? 'white' : s.color }} />
                        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: s.white ? 'white' : '#6B7280' }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: s.white ? 'white' : s.color }}>{s.value}</div>
                      <div style={{ fontSize: '10px', color: s.white ? 'rgba(255,255,255,0.85)' : '#9ca3af' }}>{s.sub}</div>
                    </div>
                  )
                })}
              </div>
              <div className="chart-card" style={{ padding: '12px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700 }}>Tier Health</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {Object.values(agentFleet).map(tier => {
                    const TierIcon = tier.icon
                    const tierSuccess = (tier.agents.reduce((sum, a) => sum + a.successRate, 0) / tier.agents.length).toFixed(1)
                    return (
                      <div key={tier.id} style={{ padding: '10px', background: '#E0F2E9', borderRadius: '6px', border: '1px solid #10B981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <div style={{ width: '28px', height: '28px', background: tier.color, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TierIcon size={14} style={{ color: 'white' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#0F5132' }}>{tier.tierName}</div>
                            <div style={{ fontSize: '8px', color: '#0F5132', opacity: 0.8 }}>{tier.name}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '9px', color: '#0F5132' }}><strong>{tier.agents.length}</strong> agents operational</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F5132', marginTop: '4px' }}>{tierSuccess}%</div>
                        <div style={{ fontSize: '8px', color: '#0F5132', opacity: 0.8 }}>avg success rate</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {healthSubTab === 'agents' && (
            <div className="chart-card" style={{ padding: '12px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700 }}>Individual Agent Health</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {allAgents.map(agent => {
                  const AgentIcon = agent.icon
                  const healthPct = agent.successRate
                  const healthColor = healthPct >= 95 ? '#10B981' : healthPct >= 90 ? '#F59E0B' : '#EF4444'
                  return (
                    <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#F9FAFB', borderRadius: '6px' }}>
                      <div style={{ width: '32px', height: '32px', background: `${agent.color}20`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AgentIcon size={16} style={{ color: agent.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1F1F1F' }}>{agent.name}</div>
                        <div style={{ fontSize: '9px', color: '#6B7280' }}>{agent.tier}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '120px', height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${healthPct}%`, height: '100%', background: healthColor, borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: healthColor, width: '42px', textAlign: 'right' }}>{healthPct}%</span>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#0F5132', background: '#E0F2E9', padding: '2px 6px', borderRadius: '4px' }}>
                        {agent.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {healthSubTab === 'infrastructure' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { label: 'Anthropic API', sub: 'Claude Sonnet 4.6', status: 'Operational', latency: '124ms', icon: Brain, color: '#C15F3C' },
                { label: 'Fabric SQL Endpoint', sub: 'Operations Lakehouse', status: 'Operational', latency: '38ms', icon: Server, color: '#0078D4' },
                { label: 'FastAPI Backend', sub: 'localhost:8000', status: 'Operational', latency: '2ms', icon: Zap, color: '#10B981' },
                { label: 'Chat Log Storage', sub: 'chat_logs/*.json', status: 'Operational', latency: '<1ms', icon: AlertCircle, color: '#6B7280' }
              ].map(infra => {
                const InfraIcon = infra.icon
                return (
                  <div key={infra.label} className="chart-card" style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', background: `${infra.color}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <InfraIcon size={20} style={{ color: infra.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F1F1F' }}>{infra.label}</div>
                        <div style={{ fontSize: '10px', color: '#6B7280' }}>{infra.sub}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#0F5132', background: '#E0F2E9', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px' }}>{infra.status}</div>
                        <div style={{ fontSize: '9px', color: '#6B7280' }}>Latency: {infra.latency}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AgentFleet
