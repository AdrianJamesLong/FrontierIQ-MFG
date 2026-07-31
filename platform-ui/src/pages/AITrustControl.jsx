import { useState, useEffect } from 'react'
import { FileSearch, Sliders, Eye, Clock, CheckSquare, Settings, Shield, Lock, Database, Brain, AlertCircle, CheckCircle, Users, Activity, ChevronDown, ChevronRight, Save, Info, Sparkles, GitBranch, TrendingUp, Target, AlertTriangle } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import './Dashboard.css'
import './AIStudioLab.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AITrustControl() {
  const [activeTab, setActiveTab] = useState('overview')
  const [chatThreads, setChatThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [expandedSteps, setExpandedSteps] = useState({})
  const [loading, setLoading] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [configChanges, setConfigChanges] = useState({})

  const [agentConfigs, setAgentConfigs] = useState({
    data_agent: { name: 'Data Agent', tier: 'Tier 0', temperature: 0.7, maxTokens: 4096, confidenceThreshold: 0.7, status: 'Active', safetyClassification: 'Read-only' },
    performance_analyst: { name: 'Performance Analyst', tier: 'Tier 1', temperature: 0.7, maxTokens: 4096, confidenceThreshold: 0.75, status: 'Active', safetyClassification: 'Advisory' },
    data_quality: { name: 'Data Quality Guardian', tier: 'Tier 1', temperature: 0.5, maxTokens: 4096, confidenceThreshold: 0.8, status: 'Active', safetyClassification: 'Advisory' },
    line_operations: { name: 'Line Operations Supervisor', tier: 'Tier 1', temperature: 0.7, maxTokens: 4096, confidenceThreshold: 0.7, status: 'Active', safetyClassification: 'Advisory' },
    downtime_rca: { name: 'Downtime RCA Agent', tier: 'Tier 2', temperature: 0.7, maxTokens: 4096, confidenceThreshold: 0.75, status: 'Active', safetyClassification: 'Advisory' },
    bottleneck_constraint: { name: 'Bottleneck / Constraint Agent', tier: 'Tier 2', temperature: 0.7, maxTokens: 4096, confidenceThreshold: 0.75, status: 'Active', safetyClassification: 'Advisory' },
    operations_recommendation: { name: 'Operations Recommendation', tier: 'Tier 3', temperature: 0.7, maxTokens: 6144, confidenceThreshold: 0.8, status: 'Active', safetyClassification: 'Advisory' },
    executive_briefing: { name: 'Executive Briefing', tier: 'Tier 3', temperature: 0.6, maxTokens: 6144, confidenceThreshold: 0.75, status: 'Active', safetyClassification: 'Advisory' }
  })

  const tabs = [
    { key: 'overview', title: 'Overview', icon: Info },
    { key: 'traces', title: 'Traces & Audit', icon: FileSearch },
    { key: 'tuning', title: 'Tuning & Guardrails', icon: Sliders },
    { key: 'council', title: 'Agent Council', icon: Users }
  ]

  useEffect(() => {
    if (activeTab === 'traces') fetchChatThreads()
  }, [activeTab])

  const fetchChatThreads = async () => {
    setLoading(true)
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API_URL}/api/agent/chat-threads/tier1`).then(r => r.json()).catch(() => ({ threads: [] })),
        fetch(`${API_URL}/api/agent/chat-threads/tier2`).then(r => r.json()).catch(() => ({ threads: [] })),
        fetch(`${API_URL}/api/agent/chat-threads/tier3`).then(r => r.json()).catch(() => ({ threads: [] }))
      ])
      const all = [
        ...(r1.threads || []).map(t => ({ ...t, tier: 'Tier 1' })),
        ...(r2.threads || []).map(t => ({ ...t, tier: 'Tier 2' })),
        ...(r3.threads || []).map(t => ({ ...t, tier: 'Tier 3' }))
      ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      setChatThreads(all)
    } catch (err) {
      console.error('Error fetching threads:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadThreadDetails = async (threadId) => {
    try {
      const r = await fetch(`${API_URL}/api/agent/chat-thread/${threadId}`)
      const data = await r.json()
      setSelectedThread(data)
      setExpandedSteps({})
    } catch (err) {
      console.error('Error loading thread:', err)
    }
  }

  const toggleStep = (idx) => setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }))

  const handleConfigEdit = (key) => { setEditingConfig(key); setConfigChanges({ ...agentConfigs[key] }) }
  const handleConfigSave = () => {
    if (editingConfig) {
      setAgentConfigs(prev => ({ ...prev, [editingConfig]: configChanges }))
      setEditingConfig(null)
      setConfigChanges({})
      alert(`Configuration saved for ${configChanges.name}`)
    }
  }
  const handleConfigCancel = () => { setEditingConfig(null); setConfigChanges({}) }
  const handleConfigChange = (field, value) => setConfigChanges(prev => ({ ...prev, [field]: value }))

  const tabStyle = (key) => ({
    padding: '8px 14px',
    background: activeTab === key ? '#f8f9fa' : 'transparent',
    border: activeTab === key ? '1px solid #6B7280' : '1px solid transparent',
    borderBottom: activeTab === key ? '3px solid #1C3668' : '1px solid transparent',
    borderRadius: '6px 6px 0 0', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '10px', color: activeTab === key ? '#1C3668' : '#6b7280', transition: 'all 0.2s'
  })

  const tierColors = { 'Tier 0': '#6366F1', 'Tier 1': '#3B82F6', 'Tier 2': '#F59E0B', 'Tier 3': '#10B981' }

  return (
    <div className="page-container">
      <Breadcrumb items={[{ label: 'Platform', path: '/agent-fleet' }, { label: 'AI Trust & Control' }]} />

      <div className="ai-studio-header" style={{ marginBottom: '12px' }}>
        <div className="ai-studio-icon-wrapper">
          <Shield size={28} className="ai-studio-icon" />
        </div>
        <div className="ai-studio-title-section">
          <h1>AI Trust & Control</h1>
          <p className="ai-studio-subtitle">Transparency, auditability and safe operation of all AI agents</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ padding: '6px 12px', background: '#E0F2E9', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#0F5132', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            Trust & Control Active
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
        {tabs.map(tab => {
          const TabIcon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabStyle(tab.key)}>
              <TabIcon size={14} />
              <span>{tab.title}</span>
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Trust Tools', value: '3', sub: 'Active capabilities', color: '#1C3668', icon: Shield },
              { label: 'Traces', value: 'Full', sub: 'Audit trails enabled', color: '#6B7280', icon: FileSearch },
              { label: 'Agent Tiers', value: '3', sub: 'Under tuning control', color: '#6B7280', icon: Sliders },
              { label: 'Guardrails', value: 'Active', sub: 'Operational boundaries', color: '#6B7280', icon: Lock },
              { label: 'Agent Council', value: 'Enabled', sub: 'Avg agreement: 87%', color: '#6B7280', icon: Users }
            ].map(s => {
              const SIcon = s.icon
              return (
                <div key={s.label} className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <SIcon size={12} style={{ color: s.color }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{s.sub}</div>
                </div>
              )
            })}
          </div>

          <div className="chart-card" style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #1C366810 0%, #1C366805 100%)', marginBottom: '12px', border: '1px solid #D1D5DB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #1C3668 0%, #2E558F 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(28,54,104,0.2)' }}>
                <Sparkles size={18} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 2px 0', fontSize: '14px', color: '#1F1F1F', fontWeight: 700 }}>Trust & Control Framework</h2>
                <p style={{ margin: 0, color: '#4B4B4B', lineHeight: '1.3', fontSize: '11px' }}>
                  Governance tools for AI transparency, auditability, and safe chemical plant operations with configurable guardrails.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              {
                title: 'Traces & Audit', subtitle: 'Complete transparency', icon: FileSearch,
                purpose: 'Track and audit all AI agent interactions, decisions, and data access for complete accountability across NovaChem operations.',
                capabilities: [
                  { icon: Activity, text: 'Real-time monitoring' },
                  { icon: Database, text: 'Query logging' },
                  { icon: Clock, text: 'Session history' },
                  { icon: CheckSquare, text: 'Compliance ready' }
                ]
              },
              {
                title: 'Tuning & Guardrails', subtitle: 'Safe operation', icon: Sliders,
                purpose: 'Configure agent behaviour through system prompts, temperature settings, and operational boundaries for all production agents.',
                capabilities: [
                  { icon: Settings, text: 'Agent configuration' },
                  { icon: Shield, text: 'Safety guardrails' },
                  { icon: Sliders, text: 'Parameter tuning' },
                  { icon: Lock, text: 'Access control' }
                ]
              },
              {
                title: 'Agent Council', subtitle: 'Decision assurance', icon: Users,
                purpose: 'Validate agent decisions through multi-model divergence, structured critique, and controlled synthesis before production use.',
                capabilities: [
                  { icon: GitBranch, text: 'Cross-model evaluation' },
                  { icon: AlertTriangle, text: 'Hallucination detection' },
                  { icon: Target, text: 'Deterministic synthesis' },
                  { icon: TrendingUp, text: 'Confidence scoring' }
                ]
              }
            ].map(card => {
              const CardIcon = card.icon
              return (
                <div key={card.title} className="chart-card" style={{ padding: '12px', border: '1px solid #E5E7EB', borderTop: '3px solid #1C3668' }}>
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #1C3668 0%, #2E558F 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', boxShadow: '0 2px 8px rgba(28,54,104,0.15)' }}>
                      <CardIcon size={20} style={{ color: 'white' }} />
                    </div>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: 700, color: '#1F1F1F' }}>{card.title}</h3>
                    <p style={{ margin: 0, fontSize: '10px', color: '#6B6B6B', fontStyle: 'italic', fontWeight: 600 }}>{card.subtitle}</p>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '10px', color: '#4B4B4B', lineHeight: '1.4' }}>{card.purpose}</p>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 700, color: '#1F1F1F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Capabilities</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {card.capabilities.map(cap => {
                      const CapIcon = cap.icon
                      return (
                        <div key={cap.text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CapIcon size={10} style={{ color: '#6B7280', flexShrink: 0 }} />
                          <span style={{ fontSize: '10px', color: '#4B4B4B' }}>{cap.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Traces Tab */}
      {activeTab === 'traces' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Sessions', value: chatThreads.length, sub: 'Tracked conversations', icon: Activity },
              { label: 'Threads Tier 1', value: chatThreads.filter(t => t.tier === 'Tier 1').length, sub: 'Analytical agents', icon: FileSearch },
              { label: 'Threads Tier 2', value: chatThreads.filter(t => t.tier === 'Tier 2').length, sub: 'Diagnostic agents', icon: FileSearch },
              { label: 'Threads Tier 3', value: chatThreads.filter(t => t.tier === 'Tier 3').length, sub: 'Prescriptive agents', icon: FileSearch }
            ].map(s => {
              const SIcon = s.icon
              return (
                <div key={s.label} className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <SIcon size={12} style={{ color: '#1C3668' }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#1C3668' }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{s.sub}</div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '12px' }}>
            {/* Thread List */}
            <div className="chart-card" style={{ padding: '10px', overflowY: 'auto', maxHeight: 'calc(100vh - 360px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 700 }}>Conversation Threads</h3>
                <button onClick={fetchChatThreads} style={{ fontSize: '9px', color: '#1C3668', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Refresh</button>
              </div>
              {loading && <p style={{ fontSize: '10px', color: '#6B7280', textAlign: 'center', padding: '20px 0' }}>Loading threads...</p>}
              {!loading && chatThreads.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <FileSearch size={28} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
                  <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>No threads found. Chat with an agent to generate audit trails.</p>
                </div>
              )}
              {chatThreads.map(thread => (
                <div key={thread.thread_id} onClick={() => loadThreadDetails(thread.thread_id)} style={{
                  padding: '8px', marginBottom: '4px', background: selectedThread?.thread_id === thread.thread_id ? '#EFF6FF' : '#F9FAFB',
                  border: `1px solid ${selectedThread?.thread_id === thread.thread_id ? '#93C5FD' : '#E5E7EB'}`,
                  borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#1F1F1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {thread.thread_id}
                    </span>
                    <span style={{ fontSize: '8px', fontWeight: 600, color: tierColors[thread.tier] || '#6B7280', background: `${tierColors[thread.tier] || '#6B7280'}15`, padding: '1px 5px', borderRadius: '3px', flexShrink: 0 }}>
                      {thread.tier}
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#6B7280' }}>
                    {thread.message_count || 0} messages &bull; {thread.updated_at ? new Date(thread.updated_at).toLocaleString() : 'Unknown time'}
                  </div>
                </div>
              ))}
            </div>

            {/* Thread Detail */}
            <div className="chart-card" style={{ padding: '12px', overflowY: 'auto', maxHeight: 'calc(100vh - 360px)' }}>
              {selectedThread ? (
                <div>
                  <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 700 }}>{selectedThread.thread_id}</h3>
                    <div style={{ fontSize: '10px', color: '#6B7280' }}>
                      {selectedThread.messages?.length || 0} messages &bull; Created: {selectedThread.created_at ? new Date(selectedThread.created_at).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                  {(selectedThread.messages || []).map((msg, msgIdx) => (
                    <div key={msgIdx} style={{ marginBottom: '12px', padding: '10px', background: msg.role === 'user' ? '#F0F7FF' : '#F9FAFB', borderRadius: '6px', border: `1px solid ${msg.role === 'user' ? '#BFDBFE' : '#E5E7EB'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: msg.role === 'user' ? '#1D4ED8' : '#374151' }}>{msg.role}</span>
                        {msg.timestamp && <span style={{ fontSize: '9px', color: '#6B7280' }}>{new Date(msg.timestamp).toLocaleString()}</span>}
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#1F1F1F', lineHeight: '1.5' }}>{msg.content}</p>
                      {msg.audit_trail && msg.audit_trail.length > 0 && (
                        <div>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Audit Trail ({msg.audit_trail.length} steps)</div>
                          {msg.audit_trail.map((step, stepIdx) => {
                            const isExpanded = expandedSteps[`${msgIdx}-${stepIdx}`]
                            const stepColor = step.step === 'llm_call' ? '#3B82F6' : step.step === 'tool_call' ? '#F59E0B' : '#10B981'
                            return (
                              <div key={stepIdx} style={{ marginBottom: '4px', border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                                <div onClick={() => toggleStep(`${msgIdx}-${stepIdx}`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: '#F9FAFB', cursor: 'pointer' }}>
                                  {isExpanded ? <ChevronDown size={12} style={{ color: stepColor }} /> : <ChevronRight size={12} style={{ color: stepColor }} />}
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: stepColor, textTransform: 'uppercase' }}>{step.step}</span>
                                  {step.duration_seconds && <span style={{ fontSize: '9px', color: '#6B7280', marginLeft: 'auto' }}>{step.duration_seconds.toFixed(2)}s</span>}
                                  {step.status && <span style={{ fontSize: '8px', fontWeight: 700, color: step.status === 'success' ? '#10B981' : '#EF4444', background: step.status === 'success' ? '#E0F2E9' : '#FEE2E2', padding: '1px 5px', borderRadius: '3px' }}>{step.status}</span>}
                                </div>
                                {isExpanded && (
                                  <div style={{ padding: '8px', fontSize: '10px', color: '#374151', background: 'white' }}>
                                    {step.step === 'llm_call' && step.usage && (
                                      <div style={{ display: 'flex', gap: '12px', marginBottom: '6px' }}>
                                        <span>Input: <strong>{step.usage.input_tokens}</strong> tokens</span>
                                        <span>Output: <strong>{step.usage.output_tokens}</strong> tokens</span>
                                      </div>
                                    )}
                                    {step.step === 'tool_call' && (
                                      <div style={{ marginBottom: '4px' }}>Tool: <strong>{step.tool_name}</strong></div>
                                    )}
                                    {step.result_summary && (
                                      <pre style={{ fontSize: '9px', background: '#F3F4F6', padding: '6px', borderRadius: '4px', overflow: 'auto', margin: 0 }}>
                                        {JSON.stringify(step.result_summary, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#6B7280' }}>
                  <Eye size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 4px 0' }}>Select a thread to view audit trail</p>
                  <p style={{ fontSize: '10px', margin: 0, opacity: 0.7 }}>Click any conversation on the left</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tuning Tab */}
      {activeTab === 'tuning' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {Object.entries(
              Object.values(agentConfigs).reduce((acc, cfg) => {
                acc[cfg.tier] = (acc[cfg.tier] || 0) + 1; return acc
              }, {})
            ).map(([tier, count]) => (
              <div key={tier} className="stat-card" style={{ padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Settings size={12} style={{ color: tierColors[tier] }} />
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{tier}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: tierColors[tier] }}>{count}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Agent{count > 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(agentConfigs).map(([key, cfg]) => {
              const isEditing = editingConfig === key
              const displayCfg = isEditing ? configChanges : cfg
              const tierColor = tierColors[cfg.tier] || '#6B7280'
              return (
                <div key={key} className="chart-card" style={{ padding: '12px', border: isEditing ? `1px solid ${tierColor}` : '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditing ? '12px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', background: `${tierColor}20`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={16} style={{ color: tierColor }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F1F1F' }}>{cfg.name}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: tierColor, background: `${tierColor}15`, padding: '1px 6px', borderRadius: '3px' }}>{cfg.tier}</span>
                          <span style={{ fontSize: '9px', color: '#6B7280', background: '#F3F4F6', padding: '1px 6px', borderRadius: '3px' }}>{cfg.safetyClassification}</span>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#0F5132', background: '#E0F2E9', padding: '1px 6px', borderRadius: '3px' }}>{cfg.status}</span>
                        </div>
                      </div>
                    </div>
                    {!isEditing ? (
                      <button onClick={() => handleConfigEdit(key)} style={{ padding: '6px 12px', background: '#1C3668', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                        Edit
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={handleConfigSave} style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Save size={12} /> Save
                        </button>
                        <button onClick={handleConfigCancel} style={{ padding: '6px 12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F3F4F6' }}>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>Temperature: <strong style={{ color: '#1F1F1F' }}>{cfg.temperature}</strong></div>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>Max Tokens: <strong style={{ color: '#1F1F1F' }}>{cfg.maxTokens.toLocaleString()}</strong></div>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>Confidence: <strong style={{ color: '#1F1F1F' }}>{(cfg.confidenceThreshold * 100).toFixed(0)}%</strong></div>
                    </div>
                  )}

                  {isEditing && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Temperature</label>
                        <input type="number" min="0" max="1" step="0.1" value={displayCfg.temperature}
                          onChange={e => handleConfigChange('temperature', parseFloat(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }} />
                        <input type="range" min="0" max="1" step="0.1" value={displayCfg.temperature}
                          onChange={e => handleConfigChange('temperature', parseFloat(e.target.value))}
                          style={{ width: '100%', marginTop: '4px', accentColor: tierColor }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Max Tokens</label>
                        <input type="number" min="512" max="8192" step="512" value={displayCfg.maxTokens}
                          onChange={e => handleConfigChange('maxTokens', parseInt(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }} />
                        <input type="range" min="512" max="8192" step="512" value={displayCfg.maxTokens}
                          onChange={e => handleConfigChange('maxTokens', parseInt(e.target.value))}
                          style={{ width: '100%', marginTop: '4px', accentColor: tierColor }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Confidence Threshold</label>
                        <input type="number" min="0" max="1" step="0.05" value={displayCfg.confidenceThreshold}
                          onChange={e => handleConfigChange('confidenceThreshold', parseFloat(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }} />
                        <input type="range" min="0" max="1" step="0.05" value={displayCfg.confidenceThreshold}
                          onChange={e => handleConfigChange('confidenceThreshold', parseFloat(e.target.value))}
                          style={{ width: '100%', marginTop: '4px', accentColor: tierColor }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Agent Council Tab */}
      {activeTab === 'council' && (
        <div>
          <div className="chart-card" style={{ padding: '14px', background: 'linear-gradient(135deg, #1C366810 0%, #1C366805 100%)', border: '1px solid #1C366830', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #1C3668 0%, #2E558F 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1F1F1F' }}>Agent Council</h2>
                <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', lineHeight: '1.4' }}>
                  Multi-model decision validation and assurance for high-stakes production decisions at NovaChem.
                </p>
              </div>
              <span style={{ marginLeft: 'auto', padding: '6px 12px', background: '#E0F2E9', color: '#0F5132', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                Enabled
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Multi-model Divergence', value: '2', sub: 'Models cross-validate', color: '#3B82F6', icon: GitBranch, desc: 'Decisions pass through Claude Sonnet and Opus independently. Divergence triggers structured review.' },
              { label: 'Structured Critique', value: 'Active', sub: 'Adversarial review', color: '#F59E0B', icon: AlertTriangle, desc: 'A critic model reviews recommendations specifically for chemical safety, CIP compliance, and data integrity.' },
              { label: 'Deterministic Synthesis', value: '87%', sub: 'Avg agreement rate', color: '#10B981', icon: Target, desc: 'A synthesis model reconciles perspectives and produces a confidence-scored final recommendation.' }
            ].map(c => {
              const CIcon = c.icon
              return (
                <div key={c.label} className="chart-card" style={{ padding: '12px', border: '1px solid #E5E7EB', borderTop: `3px solid ${c.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', background: `${c.color}20`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CIcon size={16} style={{ color: c.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1F1F1F' }}>{c.label}</div>
                      <div style={{ fontSize: '9px', color: '#6B7280' }}>{c.sub}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '18px', fontWeight: 700, color: c.color }}>{c.value}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#4B4B4B', lineHeight: '1.4' }}>{c.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Example Council Decision */}
          <div className="chart-card" style={{ padding: '12px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#1F1F1F' }}>Example Council Evaluation — Changeover Recommendation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              {[
                { model: 'Primary: Claude Sonnet 4.6', verdict: 'Approve', color: '#10B981', confidence: '91%', text: 'Switch CPL-R01 from Product A to B now. Full Hot CIP required (4h). Schedule Monday 06:00 start to minimise production impact.' },
                { model: 'Critic: Claude Opus 4.6', verdict: 'Approve with conditions', color: '#F59E0B', confidence: '84%', text: 'Approve switch but verify CIP solution concentration and rinse validation before line restart. Quality check required post-CIP.' }
              ].map(v => (
                <div key={v.model} style={{ padding: '10px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>{v.model}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#374151', background: '#E5E7EB', padding: '2px 6px', borderRadius: '3px' }}>{v.confidence}</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: v.color, background: `${v.color}15`, padding: '2px 6px', borderRadius: '3px' }}>{v.verdict}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#4B4B4B', lineHeight: '1.4' }}>{v.text}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px', background: 'linear-gradient(135deg, #1C366810 0%, #1C366805 100%)', borderRadius: '8px', border: '1px solid #1C366830' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Target size={14} style={{ color: '#1C3668' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#1C3668' }}>Council Synthesis — Final Recommendation</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, color: '#0F5132', background: '#E0F2E9', padding: '2px 8px', borderRadius: '3px' }}>87% Confidence</span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#1F1F1F', lineHeight: '1.5' }}>
                Proceed with changeover on CPL-R01 Monday 06:00. Full Hot CIP mandatory (4h). Pre-flight checklist: verify CIP concentration, document rinse validation, quality sign-off before restart. Production impact: ~4.2h downtime within weekly schedule.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AITrustControl
