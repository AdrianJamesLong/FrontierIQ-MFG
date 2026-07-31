import { useState, useRef, useEffect } from 'react'
import { Brain, AlertTriangle, Anchor, Activity, Target, Gauge, BarChart3, CheckCircle2, Clock, Zap, Send, Bot, User, Loader2, Sparkles, History, Plus, Trash2, X, MessageSquare, Database, Server, CheckCircle, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Dashboard.css'

const stripEmoji = (str) => str.replace(/\p{Extended_Pictographic}/gu, '').replace(/  +/g, ' ')

function Tier2DiagnosticRCAAgents() {
  const [activeTab, setActiveTab] = useState('downtime-rca')
  const [messages, setMessages] = useState({
    'downtime-rca': [{
      role: 'assistant',
      content: 'I am the Downtime RCA Agent for NovaChem Grangemouth. I provide structured root cause analysis for downtime events in chemical manufacturing — mechanical failures, CIP overruns, changeover delays, and utility faults. Ask me about recurring issues, root causes behind specific downtime types, or pre-event OT signal patterns.',
      timestamp: new Date(),
      auditTrail: []
    }],
    'bottleneck-constraint': [{
      role: 'assistant',
      content: 'I am the Bottleneck / Constraint Agent for NovaChem Grangemouth. I identify the true throughput constraint using Theory of Constraints (TOC) principles — comparing actual vs unconstrained run rates across reactors, detecting shifting bottlenecks, and quantifying the impact. Ask me about the current constraint, where to focus improvement effort, or whether the bottleneck is stable.',
      timestamp: new Date(),
      auditTrail: []
    }]
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState(null)
  const [chatThreads, setChatThreads] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [viewMode, setViewMode] = useState('chat') // 'chat' or 'thread'
  const [expandedThreadSteps, setExpandedThreadSteps] = useState({})
  const [showPageInfo, setShowPageInfo] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeTab])

  useEffect(() => {
    loadChatThreads()
  }, [])

  const loadChatThreads = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE}/api/agent/chat-threads/tier2`)
      if (response.ok) {
        const data = await response.json()
        setChatThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Error loading chat threads:', error)
    }
  }

  const loadChatThread = async (threadId) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE}/api/agent/chat-thread/${threadId}`)
      if (response.ok) {
        const data = await response.json()
        const rawType = data.agent_type || `tier2_${activeTab}`
        const agentType = rawType.replace('tier2_', '')
        const validTab = ['downtime-rca', 'bottleneck-constraint'].includes(agentType) ? agentType : activeTab
        setMessages(prev => ({
          ...prev,
          [validTab]: data.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
            auditTrail: m.audit_trail || []
          }))
        }))
        setActiveTab(validTab)
        setCurrentThreadId(threadId)
        setShowHistory(false)
      }
    } catch (error) {
      console.error('Error loading chat thread:', error)
    }
  }

  const startNewChat = () => {
    setMessages({
      'downtime-rca': [{
        role: 'assistant',
        content: 'Hello! I\'m the Downtime RCA Agent. I provide structured root cause analysis by clustering downtime causes, correlating OT signals with downtime events, and explaining recurrence patterns. Ask me about recurring issues, root causes, or pattern analysis.',
        timestamp: new Date(),
        auditTrail: []
      }],
      'bottleneck-constraint': [{
        role: 'assistant',
        content: 'Hello! I\'m the Bottleneck / Constraint Agent. I identify the true constraint using Theory of Constraints (TOC) principles by comparing theoretical vs actual performance, identifying flow constraints, and detecting shifting bottlenecks. Ask me about today\'s constraint, optimization priorities, or constraint stability.',
        timestamp: new Date(),
        auditTrail: []
      }]
    })
    setCurrentThreadId(null)
    setShowHistory(false)
  }

  const deleteChatThread = async (threadId, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this chat?')) return

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      await fetch(`${API_BASE}/api/agent/chat-thread/${threadId}`, {
        method: 'DELETE'
      })

      await loadChatThreads()

      if (threadId === currentThreadId) {
        startNewChat()
      }
    } catch (error) {
      console.error('Error deleting chat thread:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      auditTrail: []
    }

    setMessages(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], userMessage]
    }))

    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      let threadId = currentThreadId
      if (!threadId) {
        threadId = `tier2-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`
        setCurrentThreadId(threadId)
      }

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      const agentTypeMap = {
        'downtime-rca': 'downtime_rca',
        'bottleneck-constraint': 'bottleneck_constraint'
      }

      const response = await fetch(`${API_BASE}/api/agent/tier2/${agentTypeMap[activeTab]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          agent_type: agentTypeMap[activeTab],
          thread_id: threadId
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage = {
        role: 'assistant',
        content: stripEmoji(data.response),
        timestamp: new Date(),
        auditTrail: data.audit_trail || []
      }

      setMessages(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], assistantMessage]
      }))

      const currentMessages = messages[activeTab] || []
      const finalMessages = [...currentMessages, userMessage, assistantMessage]
      setTimeout(() => {
        if (threadId && finalMessages.length > 1) {
          const firstUserMsg = finalMessages.find(m => m.role === 'user')
          const title = firstUserMsg
            ? firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
            : 'New Chat'

          fetch(`${API_BASE}/api/agent/save-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              thread_id: threadId,
              title: title,
              agent_type: `tier2_${activeTab}`,
              messages: finalMessages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
                audit_trail: m.auditTrail || null
              }))
            })
          }).then(() => loadChatThreads())
        }
      }, 500)
    } catch (error) {
      console.error('Error calling agent API:', error)
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure the backend server is running and configured correctly.`,
        timestamp: new Date()
      }
      setMessages(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], errorMessage]
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (prompt) => {
    setInput(prompt)
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }
    }, 100)
  }

  const tabs = [
    { id: 'downtime-rca', name: 'Downtime RCA', icon: AlertTriangle, color: '#1C3668' },
    { id: 'bottleneck-constraint', name: 'Bottleneck & Constraint', icon: Anchor, color: '#2E558F' }
  ]

  const currentMessages = messages[activeTab] || []

  // Quick action prompts for each agent
  const quickActions = {
    'downtime-rca': [
      { label: 'Changeover Analysis', prompt: 'Why do we keep losing Line 1 during changeovers?', icon: AlertTriangle },
      { label: 'Root Cause Type', prompt: 'Is this mechanical or operational?', icon: Target },
      { label: 'Pattern Analysis', prompt: 'What usually happens before this downtime?', icon: Activity }
    ],
    'bottleneck-constraint': [
      { label: 'Current Constraint', prompt: 'What is today\'s constraint?', icon: Anchor },
      { label: 'Priority Fix', prompt: 'If I fixed one thing, what should it be?', icon: Target },
      { label: 'Constraint Stability', prompt: 'Is the constraint stable or moving?', icon: BarChart3 }
    ]
  }

  const currentTab = tabs.find(t => t.id === activeTab)

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Root Cause Analysis</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            AI agents for downtime root cause analysis and constraint identification
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '6px 12px',
              background: showHistory ? 'rgba(28,54,104,0.08)' : '#f3f4f6',
              border: showHistory ? '1px solid #2E558F' : '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: showHistory ? '#0A1628' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <History size={14} />
            History ({chatThreads.length})
          </button>
          <button
            onClick={startNewChat}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={14} />
            New Chat
          </button>
          <div style={{
            padding: '6px 12px',
            background: '#E0F2E9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0F5132',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#0F5132'
            }}></div>
            2 Agents Active
          </div>
          <div style={{
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#6b7280'
          }}>
            Claude Sonnet 4.6
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: '12px', padding: '4px', gap: '6px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                fontSize: '11px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icon size={14} />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '320px',
          background: 'white',
          borderLeft: '1px solid #E8E8E8',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #E8E8E8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Chat History
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px'
          }}>
            {chatThreads.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: '12px'
              }}>
                No saved chats yet
              </div>
            ) : (
              chatThreads.map((thread) => (
                <div
                  key={thread.thread_id}
                  onClick={() => loadChatThread(thread.thread_id)}
                  style={{
                    padding: '12px',
                    margin: '4px 0',
                    background: thread.thread_id === currentThreadId ? 'rgba(28,54,104,0.08)' : '#F9FAFB',
                    border: thread.thread_id === currentThreadId ? '1px solid #2E558F' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (thread.thread_id !== currentThreadId) {
                      e.currentTarget.style.borderColor = '#4A7AB5'
                      e.currentTarget.style.background = '#f0f4fa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (thread.thread_id !== currentThreadId) {
                      e.currentTarget.style.borderColor = '#E5E7EB'
                      e.currentTarget.style.background = '#F9FAFB'
                    }
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '4px',
                    paddingRight: '24px'
                  }}>
                    {thread.title}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#9CA3AF'
                  }}>
                    {new Date(thread.updated_at).toLocaleDateString()} • {thread.message_count} messages
                  </div>
                  <button
                    onClick={(e) => deleteChatThread(thread.thread_id, e)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#0A1628'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content Area with Sidebar and Chat */}
      <div style={{ display: 'flex', gap: '12px', height: 'calc(100vh - 200px)' }}>

        {/* Quick Actions Sidebar */}
        <div style={{
          width: '280px',
          background: 'white',
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          padding: '16px',
          overflowY: 'auto',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <Zap size={16} color={currentTab.color} />
            Quick Actions
          </h3>

          <p style={{
            fontSize: '11px',
            color: '#6B7280',
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            Click any prompt to start a conversation with this agent
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quickActions[activeTab].map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
                style={{
                  padding: '12px',
                  background: '#ffffff',
                  border: '1px solid #E8E8E8',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = currentTab.color
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = '#E8E8E8'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '6px'
                }}>
                  <action.icon size={16} color={currentTab.color} />
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {action.label}
                  </span>
                </div>
                <p style={{
                  fontSize: '10px',
                  color: '#6B7280',
                  margin: 0,
                  paddingLeft: '26px',
                  lineHeight: '1.4',
                  fontStyle: 'italic'
                }}>
                  "{action.prompt}"
                </p>
              </button>
            ))}
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#EEF2FA',
            border: '1px solid rgba(74,122,181,0.2)',
            borderRadius: '8px'
          }}>
            <p style={{
              fontSize: '10px',
              color: currentTab.color,
              margin: 0,
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              About This Agent
            </p>
            <p style={{
              fontSize: '10px',
              color: '#6B7280',
              margin: 0,
              lineHeight: '1.5'
            }}>
              {activeTab === 'downtime-rca' && 'Provides structured root cause analysis by clustering downtime causes, correlating OT signals with downtime, and explaining recurrence patterns. Moves your organization from reactive to learning mode.'}
              {activeTab === 'bottleneck-constraint' && 'Identifies the true constraint using Theory of Constraints (TOC) principles. Compares theoretical vs actual performance, identifies flow constraints, and detects shifting bottlenecks to focus effort where it matters most.'}
            </p>
          </div>

          {/* Key Value Section */}
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#EEF2FA',
            border: '1px solid rgba(74,122,181,0.2)',
            borderRadius: '8px'
          }}>
            <p style={{
              fontSize: '10px',
              color: '#1C3668',
              margin: 0,
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              Key Value
            </p>
            <p style={{
              fontSize: '10px',
              color: '#6B7280',
              margin: 0,
              lineHeight: '1.5'
            }}>
              {activeTab === 'downtime-rca' && 'Moves org from reactive → learning'}
              {activeTab === 'bottleneck-constraint' && 'Focuses effort where it matters'}
            </p>
          </div>

          {/* Data Sources Section */}
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#EEF2FA',
            border: '1px solid rgba(74,122,181,0.2)',
            borderRadius: '8px'
          }}>
            <p style={{
              fontSize: '10px',
              color: '#1C3668',
              margin: 0,
              fontWeight: '600',
              marginBottom: '6px'
            }}>
              Consumes
            </p>
            <ul style={{
              fontSize: '10px',
              color: '#6B7280',
              margin: 0,
              paddingLeft: '16px',
              lineHeight: '1.6'
            }}>
              {activeTab === 'downtime-rca' && (
                <>
                  <li>Downtime events</li>
                  <li>OT events</li>
                  <li>Order context</li>
                </>
              )}
              {activeTab === 'bottleneck-constraint' && (
                <>
                  <li>Runrates</li>
                  <li>Unconstrained runrates</li>
                  <li>Production flow data</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Chat Container */}
        <div style={{
          flex: 1,
          background: 'white',
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #E8E8E8',
            background: '#FAFAFA'
          }}>
            <button
              onClick={() => setViewMode('chat')}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                background: viewMode === 'chat' ? 'white' : 'transparent',
                borderBottom: viewMode === 'chat' ? '2px solid #0A1628' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: viewMode === 'chat' ? '600' : '500',
                color: viewMode === 'chat' ? '#0A1628' : '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <MessageSquare size={16} />
              Chat View
            </button>
            <button
              onClick={() => setViewMode('thread')}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                background: viewMode === 'thread' ? 'white' : 'transparent',
                borderBottom: viewMode === 'thread' ? '2px solid #0A1628' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: viewMode === 'thread' ? '600' : '500',
                color: viewMode === 'thread' ? '#0A1628' : '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Activity size={16} />
              Process Thread
            </button>
          </div>

          {/* Chat View - Messages Area */}
          {viewMode === 'chat' && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {currentMessages.map((message, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: message.role === 'assistant'
                    ? `linear-gradient(135deg, ${currentTab.color} 0%, ${currentTab.color}dd 100%)`
                    : 'linear-gradient(135deg, #6B6B6B 0%, #9B9B9B 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'white'
                }}>
                  {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>

                {/* Message Content */}
                <div style={{
                  flex: 1,
                  maxWidth: '75%'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {message.role === 'assistant' ? currentTab.name.split(' ').slice(1).join(' ') : 'You'}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: '#9CA3AF'
                    }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    background: message.role === 'assistant' ? '#F9FAFB' : 'rgba(28,54,104,0.07)',
                    border: message.role === 'assistant' ? '1px solid #E5E7EB' : `1px solid ${currentTab.color}33`,
                    color: '#1f2937',
                    textAlign: message.role === 'user' ? 'right' : 'left'
                  }}>
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 style={{fontSize: '18px', fontWeight: '700', marginTop: '16px', marginBottom: '8px', color: '#1f2937'}} {...props} />,
                          h2: ({node, ...props}) => <h2 style={{fontSize: '16px', fontWeight: '600', marginTop: '14px', marginBottom: '7px', color: '#1f2937'}} {...props} />,
                          h3: ({node, ...props}) => <h3 style={{fontSize: '14px', fontWeight: '600', marginTop: '12px', marginBottom: '6px', color: '#1f2937'}} {...props} />,
                          p: ({node, ...props}) => <p style={{marginBottom: '8px', lineHeight: '1.6'}} {...props} />,
                          ul: ({node, ...props}) => <ul style={{marginLeft: '20px', marginBottom: '8px', listStyleType: 'disc'}} {...props} />,
                          ol: ({node, ...props}) => <ol style={{marginLeft: '20px', marginBottom: '8px', listStyleType: 'decimal'}} {...props} />,
                          li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />,
                          code: ({node, inline, ...props}) => inline
                            ? <code style={{background: '#EEF2FA', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace'}} {...props} />
                            : <code style={{display: 'block', background: '#EEF2FA', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto', marginBottom: '8px'}} {...props} />,
                          strong: ({node, ...props}) => <strong style={{fontWeight: '600', color: '#1f2937'}} {...props} />,
                          em: ({node, ...props}) => <em style={{fontStyle: 'italic'}} {...props} />,
                          blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '3px solid #0A1628', paddingLeft: '12px', marginLeft: '0', marginBottom: '8px', color: '#6b7280', fontStyle: 'italic'}} {...props} />,
                          table: ({node, ...props}) => <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '12px'}} {...props} />,
                          thead: ({node, ...props}) => <thead style={{background: '#EEF2FA', fontWeight: '600'}} {...props} />,
                          th: ({node, ...props}) => <th style={{border: '1px solid #E5E7EB', padding: '8px', textAlign: 'left'}} {...props} />,
                          td: ({node, ...props}) => <td style={{border: '1px solid #E5E7EB', padding: '8px'}} {...props} />,
                          a: ({node, ...props}) => <a style={{color: '#0A1628', textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div style={{whiteSpace: 'pre-wrap'}}>{message.content}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${currentTab.color} 0%, ${currentTab.color}dd 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'white'
                }}>
                  <Bot size={18} />
                </div>
                <div style={{
                  flex: 1,
                  maxWidth: '75%'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {currentTab.name.split(' ').slice(1).join(' ')}
                    </span>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Loader2 size={14} className="spinning" />
                    Analyzing...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
          )}

          {/* Process Thread View - Shows detailed execution timeline */}
          {viewMode === 'thread' && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#FAFAFA'
          }}>
            {currentMessages.length === 1 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6B7280',
                fontSize: '13px'
              }}>
                <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>No process thread yet. Ask a question to see the complete execution flow!</p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxWidth: '900px',
                margin: '0 auto'
              }}>
                {currentMessages.map((message, msgIndex) => {
                  if (message.role === 'user') {
                    return (
                      <div key={msgIndex} style={{
                        padding: '16px',
                        background: 'white',
                        border: '2px solid #0A1628',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: '#0A1628',
                          fontSize: '13px'
                        }}>
                          <User size={16} />
                          User Query
                          <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#1f2937',
                          lineHeight: '1.6',
                          padding: '8px 0'
                        }}>
                          {message.content}
                        </div>
                      </div>
                    )
                  }

                  if (message.role === 'assistant' && message.auditTrail && message.auditTrail.length > 0) {
                    return (
                      <div key={msgIndex} style={{
                        padding: '16px',
                        background: 'white',
                        border: '2px solid #10B981',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '12px',
                          fontWeight: '600',
                          color: '#10B981',
                          fontSize: '13px'
                        }}>
                          <Bot size={16} />
                          Agent Process Thread
                          <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>
                            {message.auditTrail.length} steps
                          </span>
                        </div>

                        {/* Timeline of steps */}
                        <div style={{
                          position: 'relative',
                          paddingLeft: '32px'
                        }}>
                          {/* Vertical timeline line */}
                          <div style={{
                            position: 'absolute',
                            left: '12px',
                            top: '8px',
                            bottom: '8px',
                            width: '2px',
                            background: 'linear-gradient(to bottom, #10B981, #059669)',
                            opacity: 0.3
                          }} />

                          {message.auditTrail.map((step, stepIndex) => {
                            const isExpanded = expandedThreadSteps[`${msgIndex}-${stepIndex}`]

                            return (
                              <div key={stepIndex} style={{
                                position: 'relative',
                                marginBottom: stepIndex < message.auditTrail.length - 1 ? '12px' : '0'
                              }}>
                                {/* Timeline dot */}
                                <div style={{
                                  position: 'absolute',
                                  left: '-26px',
                                  top: '6px',
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  background:
                                    step.step === 'user_query' ? '#0A1628' :
                                    step.step === 'llm_call' ? '#8B5CF6' :
                                    step.step === 'tool_call' ? '#F59E0B' :
                                    step.step === 'data_fetch' ? '#3B82F6' :
                                    step.step === 'final_response' ? '#10B981' :
                                    '#EF4444',
                                  border: '2px solid white',
                                  boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.1)',
                                  zIndex: 1
                                }} />

                                {/* Step card */}
                                <div style={{
                                  background: '#F9FAFB',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  transition: 'all 0.2s'
                                }}>
                                  <div
                                    onClick={() => {
                                      setExpandedThreadSteps(prev => ({
                                        ...prev,
                                        [`${msgIndex}-${stepIndex}`]: !prev[`${msgIndex}-${stepIndex}`]
                                      }))
                                    }}
                                    style={{
                                      padding: '12px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      background: isExpanded ? 'white' : 'transparent'
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      flex: 1
                                    }}>
                                      {step.step === 'user_query' && <MessageSquare size={14} color="#0A1628" />}
                                      {step.step === 'llm_call' && <Sparkles size={14} color="#8B5CF6" />}
                                      {step.step === 'tool_call' && <Database size={14} color="#F59E0B" />}
                                      {step.step === 'data_fetch' && <Server size={14} color="#3B82F6" />}
                                      {step.step === 'final_response' && <CheckCircle size={14} color="#10B981" />}
                                      {step.step === 'error' && <X size={14} color="#EF4444" />}
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#374151',
                                        textTransform: 'capitalize'
                                      }}>
                                        {step.step.replace('_', ' ')}
                                        {step.iteration && ` #${step.iteration}`}
                                      </span>
                                    </div>

                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      fontSize: '10px',
                                      color: '#6B7280'
                                    }}>
                                      {step.duration && (
                                        <span style={{
                                          background: '#FEF3C7',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontWeight: '600',
                                          color: '#92400E'
                                        }}>
                                          ⚡ {step.duration.toFixed(2)}s
                                        </span>
                                      )}
                                      <Clock size={10} />
                                      {new Date(step.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                      })}
                                      <span style={{ fontSize: '12px' }}>
                                        {isExpanded ? '▼' : '▶'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Expanded details */}
                                  {isExpanded && (
                                    <div style={{
                                      padding: '12px',
                                      borderTop: '1px solid #E5E7EB',
                                      fontSize: '11px',
                                      background: 'white'
                                    }}>
                                      {step.step === 'user_query' && (
                                        <div>
                                          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#6B7280' }}>
                                            Query:
                                          </div>
                                          <div style={{ color: '#374151', lineHeight: '1.5' }}>
                                            {step.query}
                                          </div>
                                        </div>
                                      )}

                                      {step.step === 'llm_call' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          <div>
                                            <span style={{ fontWeight: '600', color: '#6B7280' }}>Model: </span>
                                            <span style={{ color: '#374151' }}>{step.model}</span>
                                          </div>
                                          {step.stop_reason && (
                                            <div>
                                              <span style={{ fontWeight: '600', color: '#6B7280' }}>Stop Reason: </span>
                                              <span style={{
                                                background: step.stop_reason === 'end_turn' ? '#D1FAE5' : '#FEF3C7',
                                                color: step.stop_reason === 'end_turn' ? '#065F46' : '#92400E',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: '600'
                                              }}>
                                                {step.stop_reason}
                                              </span>
                                            </div>
                                          )}
                                          {step.usage && (
                                            <div>
                                              <span style={{ fontWeight: '600', color: '#6B7280' }}>Tokens: </span>
                                              <span style={{ color: '#374151' }}>
                                                Input: {step.usage.input_tokens} | Output: {step.usage.output_tokens}
                                              </span>
                                            </div>
                                          )}
                                          {step.status && (
                                            <div>
                                              <span style={{ fontWeight: '600', color: '#6B7280' }}>Status: </span>
                                              <span style={{
                                                color: step.status === 'completed' ? '#10B981' : '#F59E0B',
                                                fontWeight: '600'
                                              }}>
                                                {step.status}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {step.step === 'tool_call' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          <div>
                                            <span style={{ fontWeight: '600', color: '#6B7280' }}>Tool: </span>
                                            <span style={{
                                              background: '#DBEAFE',
                                              color: '#1E40AF',
                                              padding: '2px 8px',
                                              borderRadius: '4px',
                                              fontWeight: '600',
                                              fontFamily: 'monospace',
                                              fontSize: '10px'
                                            }}>
                                              {step.tool_name}
                                            </span>
                                          </div>
                                          {step.tool_input && Object.keys(step.tool_input).length > 0 && (
                                            <div>
                                              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#6B7280' }}>
                                                Input Parameters:
                                              </div>
                                              <pre style={{
                                                background: '#F3F4F6',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                overflow: 'auto',
                                                margin: 0,
                                                fontFamily: 'monospace',
                                                color: '#374151'
                                              }}>
                                                {JSON.stringify(step.tool_input, null, 2)}
                                              </pre>
                                            </div>
                                          )}
                                          {step.result_summary && (
                                            <div>
                                              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#6B7280' }}>
                                                Result Summary:
                                              </div>
                                              <div style={{ color: '#374151' }}>
                                                {step.result_summary.has_data && '✓ Data returned'}
                                                {step.result_summary.has_error && '✗ Error occurred'}
                                                {step.result_summary.result_length && ` (${step.result_summary.result_length} chars)`}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {step.step === 'data_fetch' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          <div>
                                            <span style={{ fontWeight: '600', color: '#6B7280' }}>Source: </span>
                                            <span style={{ color: '#374151' }}>{step.source}</span>
                                          </div>
                                          <div>
                                            <span style={{ fontWeight: '600', color: '#6B7280' }}>Table: </span>
                                            <span style={{
                                              background: '#FEF3C7',
                                              color: '#92400E',
                                              padding: '2px 8px',
                                              borderRadius: '4px',
                                              fontWeight: '600',
                                              fontFamily: 'monospace',
                                              fontSize: '10px'
                                            }}>
                                              {step.table}
                                            </span>
                                          </div>
                                          <div>
                                            <span style={{ fontWeight: '600', color: '#6B7280' }}>Records: </span>
                                            <span style={{
                                              background: '#D1FAE5',
                                              color: '#065F46',
                                              padding: '2px 8px',
                                              borderRadius: '4px',
                                              fontWeight: '600'
                                            }}>
                                              {step.record_count}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {step.step === 'final_response' && (
                                        <div>
                                          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#6B7280' }}>
                                            Response:
                                          </div>
                                          <div style={{
                                            color: '#374151',
                                            lineHeight: '1.5',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            padding: '8px',
                                            background: '#F9FAFB',
                                            borderRadius: '4px'
                                          }}>
                                            {step.response}
                                          </div>
                                        </div>
                                      )}

                                      {step.step === 'error' && (
                                        <div>
                                          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#EF4444' }}>
                                            Error:
                                          </div>
                                          <div style={{
                                            color: '#991B1B',
                                            background: '#FEE2E2',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            lineHeight: '1.5'
                                          }}>
                                            {step.error || step.message}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Final response preview */}
                        <div style={{
                          marginTop: '16px',
                          padding: '12px',
                          background: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: '6px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#166534',
                            fontSize: '12px'
                          }}>
                            <CheckCircle size={14} />
                            Final Response to User
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#374151',
                            lineHeight: '1.6',
                            maxHeight: '150px',
                            overflowY: 'auto'
                          }}>
                            {message.content.substring(0, 300)}
                            {message.content.length > 300 && '...'}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>
          )}

          {/* Input Area */}
          <div style={{
            borderTop: '1px solid #E8E8E8',
            padding: '16px',
            background: '#FAFAFA'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask the ${currentTab.name.split(' ').slice(1).join(' ')}...`}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '13px',
                  border: '1px solid #E8E8E8',
                  borderRadius: '8px',
                  outline: 'none',
                  background: 'white',
                  color: '#1f2937'
                }}
                onFocus={(e) => e.target.style.borderColor = currentTab.color}
                onBlur={(e) => e.target.style.borderColor = '#E8E8E8'}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  padding: '12px 24px',
                  background: input.trim() && !isLoading
                    ? `linear-gradient(135deg, ${currentTab.color} 0%, ${currentTab.color}dd 100%)`
                    : '#E5E7EB',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {showPageInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(2px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowPageInfo(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid #E8ECF4' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>About this section</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Root Cause Analysis</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Hosts Tier 2 Diagnostic &amp; RCA agents. The Downtime RCA agent provides structured root cause analysis for downtime events. The Bottleneck/Constraint agent identifies true production constraints using Theory of Constraints principles.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Agents</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Downtime RCA</strong> — Structured root cause analysis for mechanical failures, CIP overruns and utility faults</li>
                  <li style={{ marginBottom: '4px' }}><strong>Bottleneck / Constraint</strong> — Identifies the true throughput constraint using Theory of Constraints</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>downtime</strong> — Downtime events by type, duration and equipment</li>
                  <li style={{ marginBottom: '4px' }}><strong>ot_process_events</strong> — OT sensor and SCADA events pre/post downtime</li>
                  <li style={{ marginBottom: '4px' }}><strong>sap_production_orders</strong> — Production order schedule impact</li>
                  <li style={{ marginBottom: '4px' }}><strong>maintenance_orders</strong> — Related maintenance work orders</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tier2DiagnosticRCAAgents
