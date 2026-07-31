import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search, Download, Loader, AlertCircle, Database, Cpu, Network,
  Code2, Boxes, Rocket, Activity, Command
} from 'lucide-react'
import './Dashboard.css'
import './DesignLibrary.css'

function DesignLibrary() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [currentDoc, setCurrentDoc] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Document metadata
  const docMetadata = {
    '00-calgary-operations-summary': {
      title: 'NovaChem Operations Summary',
      description: 'NovaChem Grangemouth Chemical Plant Operations',
      icon: Command,
      color: '#1C3668'
    },
    'README': {
      title: 'Design Library Index',
      description: 'Overview and navigation guide',
      icon: Database,
      color: '#6b7280'
    },
    '01-overview': {
      title: 'Platform Overview',
      description: 'Introduction and value proposition',
      icon: Boxes,
      color: '#6b7280'
    },
    '02-architecture': {
      title: 'System Architecture',
      description: 'Technical architecture and design',
      icon: Network,
      color: '#6b7280'
    },
    '03-configuration-schema': {
      title: 'Configuration Schema',
      description: 'Complete configuration reference',
      icon: Code2,
      color: '#6b7280'
    },
    '04-agent-framework': {
      title: 'AI Agent Framework',
      description: 'Agent system documentation',
      icon: Cpu,
      color: '#6b7280'
    },
    '07-application-health': {
      title: 'Application Health & Monitoring',
      description: 'System health and performance monitoring',
      icon: Activity,
      color: '#6b7280'
    },
    '05-deployment-guide': {
      title: 'Deployment Guide',
      description: 'Deployment and operations',
      icon: Rocket,
      color: '#6b7280'
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    if (docId) {
      loadDocument(docId)
    } else {
      loadDocument('README')
    }
  }, [docId])

  const loadDocuments = async () => {
    try {
      const docs = Object.keys(docMetadata).map(id => ({
        id,
        ...docMetadata[id]
      }))
      setDocuments(docs)
    } catch (err) {
      console.error('Error loading documents:', err)
    }
  }

  const loadDocument = async (id) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/docs/design-library/${id}.md`)
      
      if (!response.ok) {
        throw new Error(`Document not found: ${response.status}`)
      }
      
      const text = await response.text()
      setContent(text)
      setCurrentDoc(id)
    } catch (err) {
      console.error('Error loading document:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentClick = (id) => {
    navigate(`/design-library/${id}`)
  }

  const renderMarkdown = (markdown) => {
    const lines = markdown.split('\n')
    const elements = []
    let inCodeBlock = false
    let codeContent = []
    let codeLanguage = ''
    let inList = false
    let listItems = []

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{
            marginLeft: '24px',
            marginBottom: '16px',
            listStyleType: 'disc'
          }}>
            {listItems}
          </ul>
        )
        listItems = []
      }
    }

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        flushList()
        if (!inCodeBlock) {
          inCodeBlock = true
          codeLanguage = line.slice(3).trim()
          codeContent = []
        } else {
          inCodeBlock = false
          elements.push(
            <pre key={index} style={{
              background: '#f6f8fa',
              color: '#24292f',
              padding: '16px',
              borderRadius: '6px',
              overflow: 'auto',
              marginBottom: '16px',
              border: '1px solid #d0d7de',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <code>{codeContent.join('\n')}</code>
            </pre>
          )
          codeContent = []
        }
        return
      }

      if (inCodeBlock) {
        codeContent.push(line)
        return
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList()
        elements.push(
          <h1 key={index} style={{
            fontSize: '28px',
            fontWeight: '700',
            marginTop: '24px',
            marginBottom: '12px',
            color: '#1a1a1a',
            borderBottom: '2px solid #1C3668',
            paddingBottom: '6px'
          }}>
            {line.slice(2)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        flushList()
        elements.push(
          <h2 key={index} style={{
            fontSize: '16px',
            fontWeight: '600',
            marginTop: '12px',
            marginBottom: '6px',
            color: '#1a1a1a'
          }}>
            {line.slice(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        flushList()
        elements.push(
          <h3 key={index} style={{
            fontSize: '20px',
            fontWeight: '600',
            marginTop: '20px',
            marginBottom: '10px',
            color: '#333'
          }}>
            {line.slice(4)}
          </h3>
        )
      } else if (line.startsWith('#### ')) {
        flushList()
        elements.push(
          <h4 key={index} style={{
            fontSize: '18px',
            fontWeight: '600',
            marginTop: '16px',
            marginBottom: '8px',
            color: '#444'
          }}>
            {line.slice(5)}
          </h4>
        )
      }
      // Horizontal rule
      else if (line.trim() === '---') {
        flushList()
        elements.push(
          <hr key={index} style={{
            margin: '24px 0',
            border: 'none',
            borderTop: '1px solid #d0d7de',
            opacity: 0.8
          }} />
        )
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        inList = true
        listItems.push(
          <li key={index} style={{
            marginBottom: '4px',
            color: '#444'
          }}>
            {line.slice(2)}
          </li>
        )
      }
      // Bold text
      else if (line.includes('**')) {
        flushList()
        const parts = line.split('**')
        elements.push(
          <p key={index} style={{
            marginBottom: '12px',
            lineHeight: '1.7',
            color: '#444'
          }}>
            {parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#1a1a1a' }}>{part}</strong> : part)}
          </p>
        )
      }
      // Regular paragraph
      else if (line.trim()) {
        flushList()
        elements.push(
          <p key={index} style={{
            marginBottom: '12px',
            lineHeight: '1.7',
            color: '#444'
          }}>
            {line}
          </p>
        )
      }
      // Empty line
      else {
        flushList()
        elements.push(<div key={index} style={{ height: '8px' }} />)
      }
    })

    flushList()
    return elements
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentDocMeta = currentDoc ? docMetadata[currentDoc] : null

  return (
    <div className="dashboard-container design-library-page">
      {/* Header */}
      <div className="dashboard-header" style={{
        background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div className="header-content">
          <div className="header-title-section">
            <div>
              <h1>Design Artifact Library</h1>
              <p className="header-subtitle">
                Comprehensive platform documentation and design reference
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '0',
        height: 'calc(100vh - 180px)',
        background: '#f8f9fa'
      }}>
        {/* Navigation Sidebar */}
        <div style={{
          width: '320px',
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Search */}
          <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  background: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  color: '#333',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1C3668'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          </div>

          {/* Document List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px'
          }}>
            {filteredDocuments.map(doc => {
              const Icon = doc.icon
              const isActive = currentDoc === doc.id
              return (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc.id)}
                  style={{
                    padding: '14px 16px',
                    marginBottom: '6px',
                    background: isActive ? '#f8f9fa' : 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: `1px solid ${isActive ? doc.color : 'transparent'}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#f8f9fa'
                      e.currentTarget.style.borderColor = '#e0e0e0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'transparent'
                    }
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: doc.color
                    }} />
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '6px'
                  }}>
                    <Icon size={20} style={{ color: doc.color, flexShrink: 0 }} />
                    <span style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: isActive ? '#1a1a1a' : '#333'
                    }}>
                      {doc.title}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginLeft: '32px'
                  }}>
                    {doc.description}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Document Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#fff'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <Loader className="spinner" size={40} style={{ color: '#1C3668' }} />
              <span style={{ color: '#666' }}>Loading document...</span>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <AlertCircle size={48} color="#1C3668" />
              <p style={{ color: '#666' }}>Error loading document: {error}</p>
            </div>
          ) : (
            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
              padding: '40px',
              lineHeight: '1.7'
            }}>
              {/* Document Header */}
              {currentDocMeta && (
                <div style={{
                  marginBottom: '32px',
                  paddingBottom: '24px',
                  borderBottom: '2px solid #e0e0e0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    {(() => {
                      const Icon = currentDocMeta.icon
                      return <Icon size={28} style={{ color: currentDocMeta.color }} />
                    })()}
                    <h1 style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: '#1a1a1a',
                      margin: 0
                    }}>
                      {currentDocMeta.title}
                    </h1>
                  </div>
                  <p style={{
                    fontSize: '16px',
                    color: '#666',
                    margin: 0
                  }}>
                    {currentDocMeta.description}
                  </p>
                </div>
              )}

              {/* Document Content */}
              <div style={{ fontSize: '15px' }}>
                {renderMarkdown(content)}
              </div>
              
              {/* Document Footer */}
              <div style={{
                marginTop: '48px',
                paddingTop: '24px',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                color: '#666'
              }}>
                <div>
                  Last updated: December 19, 2025
                </div>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1C3668'
                    e.currentTarget.style.borderColor = '#1C3668'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = '#e0e0e0'
                    e.currentTarget.style.color = '#333'
                  }}
                >
                  <Download size={16} />
                  Print / Export
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DesignLibrary
