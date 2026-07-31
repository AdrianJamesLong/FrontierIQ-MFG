import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Database, TrendingUp, Loader2, MessageSquare, History, Plus, Trash2, X, Target, Gauge, BarChart3, PieChart, CheckCircle2, Zap, Eye, EyeOff, Clock, Activity, Server, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Breadcrumb from '../components/Breadcrumb'
import './Dashboard.css'

function DataAgent() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I am the Data Agent for NovaChem Grangemouth, powered by Claude Sonnet 4.6. I query live data from the Microsoft Fabric Lakehouse and reason over the results to answer questions about chemical production operations — batch yield, CIP efficiency, changeover performance, energy consumption, inventory, maintenance, and quality. Ask me anything about the plant.',
      timestamp: new Date(),
      auditTrail: []
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState(null)
  const [chatThreads, setChatThreads] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [expandedAuditTrails, setExpandedAuditTrails] = useState({})
  const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'thread'
  const [expandedThreadSteps, setExpandedThreadSteps] = useState({})
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load chat threads on mount
    loadChatThreads()
  }, [])

  const loadChatThreads = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE}/api/agent/chat-threads`)
      if (response.ok) {
        const data = await response.json()
        setChatThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Error loading chat threads:', error)
    }
  }

  const saveCurrentChat = async () => {
    if (messages.length <= 1 || !currentThreadId) return // Don't save if only welcome message

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      // Generate title from first user message
      const firstUserMsg = messages.find(m => m.role === 'user')
      const title = firstUserMsg
        ? firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
        : 'New Chat'

      await fetch(`${API_BASE}/api/agent/save-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: currentThreadId,
          title: title,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
          }))
        })
      })

      // Reload threads list
      await loadChatThreads()
    } catch (error) {
      console.error('Error saving chat:', error)
    }
  }

  const loadChatThread = async (threadId) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE}/api/agent/chat-thread/${threadId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
          auditTrail: m.audit_trail || []
        })))
        setCurrentThreadId(threadId)
        setShowHistory(false)
      }
    } catch (error) {
      console.error('Error loading chat thread:', error)
    }
  }

  const startNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your Data Agent powered by Claude. I can help you analyze production data, generate insights, and answer questions about your manufacturing operations. How can I assist you today?',
        timestamp: new Date()
      }
    ])
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

      // Reload threads list
      await loadChatThreads()

      // If deleted current thread, start new chat
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
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      // Generate thread_id if this is a new chat
      let threadId = currentThreadId
      if (!threadId) {
        threadId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
        setCurrentThreadId(threadId)
      }

      // Call the backend API (using localhost for development, change to Azure URL for production)
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      // const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      const response = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          thread_id: threadId
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Debug logging
      console.log('=== Data Agent Response ===')
      console.log('Response keys:', Object.keys(data))
      console.log('Has audit_trail:', 'audit_trail' in data)
      console.log('Audit trail length:', data.audit_trail?.length || 0)
      console.log('Audit trail data:', data.audit_trail)
      console.log('========================')

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        auditTrail: data.audit_trail || []
      }
      
      console.log('Assistant message created:', {
        role: assistantMessage.role,
        hasAuditTrail: assistantMessage.auditTrail.length > 0,
        auditTrailSteps: assistantMessage.auditTrail.length
      })
      
      setMessages(prev => [...prev, assistantMessage])

      // Auto-save after assistant response with the updated messages
      const finalMessages = [...messages, userMessage, assistantMessage]
      setTimeout(() => {
        if (threadId && finalMessages.length > 1) {
          // Generate title from first user message
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
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Dashboard validation quick actions
  const dashboardValidations = [
    {
      icon: CheckCircle2,
      label: 'Batch Yield Summary',
      prompt: 'Summarise current batch yield performance across all reactors — actual vs target, any lines below threshold?',
      color: '#0A1628',
      description: 'Yield by reactor and product'
    },
    {
      icon: Target,
      label: 'CIP Performance',
      prompt: 'How are CIP cycle times performing this week? Which lines have had the longest CIP sequences and why?',
      color: '#1C3668',
      description: 'CIP duration and efficiency'
    },
    {
      icon: Gauge,
      label: 'Changeover Impact',
      prompt: 'What is the impact of changeovers on production throughput? Which changeover types are causing the most lost time?',
      color: '#152B55',
      description: 'Changeover time and schedule impact'
    },
    {
      icon: BarChart3,
      label: 'Top Downtime Causes',
      prompt: 'What are the top 3 causes of downtime across the plant this week? Break down by reactor line.',
      color: '#0A1628',
      description: 'Downtime analysis by cause and line'
    },
    {
      icon: PieChart,
      label: 'Energy per Batch',
      prompt: 'Show energy consumption per batch by product. Which products are consuming the most energy relative to output?',
      color: '#1C3668',
      description: 'Energy efficiency by product'
    },
    {
      icon: Zap,
      label: 'Plant Status Report',
      prompt: 'Give me a full plant status report — production order progress, batch quality, active downtime, and any immediate concerns.',
      color: '#152B55',
      description: 'Complete plant overview'
    }
  ]

  const handleQuickAction = (prompt) => {
    setInput(prompt)
    // Trigger form submission
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }
    }, 100)
  }

  return (
    <div className="page-container">
      <Breadcrumb />
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>Data Agent</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            AI-powered production intelligence assistant
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            style={{
              padding: '6px 12px',
              background: showAuditTrail ? '#E0F2E9' : '#f3f4f6',
              border: showAuditTrail ? '1px solid #10B981' : '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: showAuditTrail ? '#10B981' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            {showAuditTrail ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAuditTrail ? 'Hide' : 'Show'} Audit Trail
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '6px 12px',
              background: showHistory ? '#FFE5E5' : '#f3f4f6',
              border: showHistory ? '1px solid #0A1628' : '1px solid #E5E7EB',
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
            Online
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
          {/* Sidebar Header */}
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

          {/* Thread List */}
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
                    background: thread.thread_id === currentThreadId ? '#FFE5E5' : '#F9FAFB',
                    border: thread.thread_id === currentThreadId ? '1px solid #0A1628' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (thread.thread_id !== currentThreadId) {
                      e.currentTarget.style.borderColor = '#0A1628'
                      e.currentTarget.style.background = '#FFF5F5'
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
                    onMouseEnter={(e) => e.currentTarget.style.color = '#DC2626'}
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
        {showQuickActions && (
          <div style={{
            width: '280px',
            background: 'white',
            border: '1px solid #E8E8E8',
            borderRadius: '8px',
            padding: '16px',
            overflowY: 'auto',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Zap size={16} color="#0A1628" />
                Dashboard Checks
              </h3>
              <button
                onClick={() => setShowQuickActions(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>

            <p style={{
              fontSize: '11px',
              color: '#6B7280',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              Quick validation checks for Dashboard metrics
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dashboardValidations.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 100%)',
                    border: '1px solid #E8E8E8',
                    borderRadius: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.borderColor = action.color
                      e.currentTarget.style.background = '#FFF5F5'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.borderColor = '#E8E8E8'
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 100%)'
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
                    <action.icon size={16} color={action.color} />
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
                    lineHeight: '1.4'
                  }}>
                    {action.description}
                  </p>
                </button>
              ))}
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#FFF5F5',
              border: '1px solid #FFE5E5',
              borderRadius: '8px'
            }}>
              <p style={{
                fontSize: '10px',
                color: '#0A1628',
                margin: 0,
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                💡 Tip
              </p>
              <p style={{
                fontSize: '10px',
                color: '#6B7280',
                margin: 0,
                lineHeight: '1.5'
              }}>
                Click any button to run a pre-configured validation check against your Dashboard data.
              </p>
            </div>
          </div>
        )}

        {/* Toggle button when sidebar is hidden */}
        {!showQuickActions && (
          <button
            onClick={() => setShowQuickActions(true)}
            style={{
              position: 'fixed',
              left: '80px',
              top: '120px',
              padding: '8px',
              background: 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)',
              border: 'none',
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer',
              color: 'white',
              boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.1)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            <Zap size={14} />
            Quick Actions
          </button>
        )}

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
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '14px 20px',
              border: 'none',
              background: activeTab === 'chat' ? 'white' : 'transparent',
              borderBottom: activeTab === 'chat' ? '2px solid #0A1628' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === 'chat' ? '600' : '500',
              color: activeTab === 'chat' ? '#0A1628' : '#6B7280',
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
            onClick={() => setActiveTab('thread')}
            style={{
              flex: 1,
              padding: '14px 20px',
              border: 'none',
              background: activeTab === 'thread' ? 'white' : 'transparent',
              borderBottom: activeTab === 'thread' ? '2px solid #0A1628' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === 'thread' ? '600' : '500',
              color: activeTab === 'thread' ? '#0A1628' : '#6B7280',
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
        {activeTab === 'chat' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((message, index) => (
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
                  ? 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)'
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
                    {message.role === 'assistant' ? 'Data Agent' : 'You'}
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
                  background: message.role === 'assistant' ? '#F9FAFB' : '#FFE5E5',
                  border: message.role === 'assistant' ? '1px solid #E5E7EB' : '1px solid #FF4D4F',
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
                          ? <code style={{background: '#FFE5E5', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace'}} {...props} />
                          : <code style={{display: 'block', background: '#FFE5E5', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto', marginBottom: '8px'}} {...props} />,
                        strong: ({node, ...props}) => <strong style={{fontWeight: '600', color: '#1f2937'}} {...props} />,
                        em: ({node, ...props}) => <em style={{fontStyle: 'italic'}} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '3px solid #0A1628', paddingLeft: '12px', marginLeft: '0', marginBottom: '8px', color: '#6b7280', fontStyle: 'italic'}} {...props} />,
                        table: ({node, ...props}) => <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '12px'}} {...props} />,
                        thead: ({node, ...props}) => <thead style={{background: '#FFE5E5', fontWeight: '600'}} {...props} />,
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
                
                {/* Audit Trail Display */}
                {showAuditTrail && message.role === 'assistant' && message.auditTrail && message.auditTrail.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setExpandedAuditTrails(prev => ({
                        ...prev,
                        [index]: !prev[index]
                      }))
                    }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        color: '#166534'
                      }}>
                        <Activity size={14} />
                        Audit Trail ({message.auditTrail.length} steps)
                      </div>
                      <span style={{ color: '#166534' }}>
                        {expandedAuditTrails[index] ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    {expandedAuditTrails[index] && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        {message.auditTrail.map((step, stepIndex) => (
                          <div key={stepIndex} style={{
                            padding: '8px',
                            background: 'white',
                            border: '1px solid #D1FAE5',
                            borderRadius: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '600',
                              color: '#065F46'
                            }}>
                              {step.step === 'user_query' && <MessageSquare size={12} />}
                              {step.step === 'llm_call' && <Sparkles size={12} />}
                              {step.step === 'tool_call' && <Database size={12} />}
                              {step.step === 'data_fetch' && <Server size={12} />}
                              {step.step === 'final_response' && <CheckCircle size={12} />}
                              {step.step === 'error' && <X size={12} />}
                              <span style={{ textTransform: 'capitalize' }}>
                                {step.step.replace('_', ' ')}
                              </span>
                              {step.iteration && <span style={{ color: '#9CA3AF' }}>#{step.iteration}</span>}
                            </div>
                            
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock size={10} />
                              {new Date(step.timestamp).toLocaleTimeString()}
                              {step.duration_seconds && (
                                <span style={{ marginLeft: '8px', color: '#10B981' }}>
                                  ⚡ {step.duration_seconds}s
                                </span>
                              )}
                            </div>
                            
                            {step.tool_name && (
                              <div style={{
                                fontSize: '10px',
                                color: '#065F46',
                                background: '#ECFDF5',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                              }}>
                                🔧 {step.tool_name}
                                {step.tool_input && Object.keys(step.tool_input).length > 0 && (
                                  <span style={{ color: '#6B7280', marginLeft: '4px' }}>
                                    ({JSON.stringify(step.tool_input)})
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {step.source && (
                              <div style={{
                                fontSize: '10px',
                                color: '#065F46',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Database size={10} />
                                Source: {step.source}
                                {step.table && ` → ${step.table}`}
                                {step.records_count && ` (${step.records_count} records)`}
                              </div>
                            )}
                            
                            {step.model && (
                              <div style={{
                                fontSize: '10px',
                                color: '#065F46',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Sparkles size={10} />
                                Model: {step.model}
                                {step.stop_reason && ` → ${step.stop_reason}`}
                              </div>
                            )}
                            
                            {step.status && (
                              <div style={{
                                fontSize: '10px',
                                color: step.status === 'completed' ? '#10B981' : step.status === 'started' ? '#F59E0B' : '#EF4444',
                                fontWeight: '600'
                              }}>
                                Status: {step.status}
                              </div>
                            )}
                            
                            {step.error && (
                              <div style={{
                                fontSize: '10px',
                                color: '#DC2626',
                                background: '#FEE2E2',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}>
                                ⚠️ {step.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                background: 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)',
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
                    Data Agent
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
                  Thinking...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Process Thread View - Shows detailed execution timeline */}
        {activeTab === 'thread' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: '#FAFAFA'
        }}>
          {messages.length === 1 ? (
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
              {messages.map((message, msgIndex) => {
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

        {/* Quick Actions - Show only when no user messages in Chat view */}
        {activeTab === 'chat' && messages.length === 1 && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #E8E8E8',
            background: '#FAFAFA'
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              Quick Actions
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              {dashboardValidations.slice(0, 3).map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0A1628'
                      e.currentTarget.style.background = '#FFE5E5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB'
                      e.currentTarget.style.background = 'white'
                    }}
                  >
                    <Icon size={14} />
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #E8E8E8',
          background: 'white'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your production data..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1f2937',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0A1628'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                padding: '10px 20px',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)'
                  : '#E5E7EB',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                opacity: input.trim() && !isLoading ? 1 : 0.6
              }}
            >
              <Send size={14} />
              Send
            </button>
          </form>
          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: '#9CA3AF',
            textAlign: 'center'
          }}>
            Powered by Claude Sonnet 4.6 via Azure AI Foundry
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default DataAgent
