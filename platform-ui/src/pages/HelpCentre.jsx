import { useState } from 'react'
import { BookOpen, HelpCircle, GraduationCap, MessageCircle, Wrench, FileText, Mail, Search, Clock, Activity, Database, Zap, Server, Shield, AlertCircle, AlertTriangle, CheckCircle, Lightbulb, Calendar } from 'lucide-react'
import './Dashboard.css'

function HelpCentre() {
  const [activeTab, setActiveTab] = useState('documentation')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDocTab, setActiveDocTab] = useState('getting-started')
  const [activeFaqTab, setActiveFaqTab] = useState('general')
  const [activeTrainingTab, setActiveTrainingTab] = useState('getting-started')
  const [activeTroubleshootingTab, setActiveTroubleshootingTab] = useState('data-connectivity')

  const tabs = [
    { id: 'documentation', name: 'Documentation', icon: BookOpen },
    { id: 'faq', name: 'FAQ', icon: HelpCircle },
    { id: 'training', name: 'Training', icon: GraduationCap },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: Wrench },
    { id: 'support', name: 'Support', icon: Mail }
  ]

  const docTabs = [
    { id: 'getting-started', name: 'Getting Started', icon: BookOpen },
    { id: 'plant-performance', name: 'Plant Performance', icon: Activity },
    { id: 'ot-data', name: 'OT Data & UNS', icon: Database },
    { id: 'integration', name: 'Integration & API', icon: Zap },
    { id: 'system', name: 'System Requirements', icon: Server }
  ]

  const documentationContent = {
    'getting-started': {
      title: 'Getting Started Guide',
      description: 'Learn the basics of Manufacturing Intelligence and Optimization',
      sections: [
        { title: 'Platform Overview', items: ['Real-time production monitoring', 'Plant performance insights', 'OT data analytics', 'UNS hierarchy visualization'] },
        { title: 'Navigation', items: ['Dashboard overview', 'Production Schedule', 'Plant Performance', 'OT Data Insights'] },
        { title: 'First Steps', items: ['Log in with credentials', 'Review Dashboard', 'Navigate to Plant Performance', 'Explore OT Data Insights'] }
      ]
    },
    'plant-performance': {
      title: 'Plant Performance Analytics',
      description: 'Understanding plant metrics, KPIs, and performance analysis',
      sections: [
        { title: 'Key Metrics', items: ['OEE measurement', 'Production Volume', 'Quality Rate', 'Downtime tracking'] },
        { title: 'Features', items: ['Multi-plant comparison', 'Time-based filtering', 'Performance trends', 'Equipment utilization'] }
      ]
    },
    'ot-data': {
      title: 'OT Data Insights & UNS',
      description: 'Exploring operational technology data and Unified Namespace',
      sections: [
        { title: 'Data Overview', items: ['8,500+ process events', 'Real-time metrics', 'Tag analysis', 'Raw data exploration'] },
        { title: 'UNS Analysis', items: ['ISA 95 hierarchy', 'Interactive tree navigation', 'Detailed node analysis', 'Top tags visualization'] }
      ]
    },
    'integration': {
      title: 'Data Integration & API',
      description: 'Connecting external systems and using the API',
      sections: [
        { title: 'Data Sources', items: ['Microsoft Fabric Lakehouse', 'Real-time OT streams', 'SAP integration', 'Quality systems'] },
        { title: 'API Endpoints', items: ['GET /api/plants', 'GET /api/plant-performance', 'GET /api/ot-data', 'Authentication required'] }
      ]
    },
    'system': {
      title: 'System Requirements',
      description: 'Technical requirements and compatibility',
      sections: [
        { title: 'Browsers', items: ['Chrome 120+', 'Edge 120+', 'Firefox 121+', 'Safari 17+'] },
        { title: 'System', items: ['8GB RAM minimum', '1366x768 resolution', '5 Mbps connection', 'Modern GPU'] }
      ]
    }
  }

  const faqContent = {
    general: [
      { q: 'What is this platform?', a: 'A comprehensive manufacturing operations platform for monitoring and optimizing production.' },
      { q: 'How do I navigate?', a: 'Use the sidebar menu to access Dashboard, Production Schedule, Plant Performance, and OT Data Insights.' },
      { q: 'How often is data updated?', a: 'Real-time data updates every 30 seconds. Historical data syncs hourly.' },
      { q: 'Who can access?', a: 'Authorized personnel with valid Azure AD credentials.' }
    ],
    technical: [
      { q: 'Supported browsers?', a: 'Chrome 120+, Edge 120+, Firefox 121+, Safari 17+ (macOS).' },
      { q: 'System requirements?', a: '8GB RAM, 1366x768 resolution, 5 Mbps connection, modern GPU.' },
      { q: 'API access?', a: 'Contact technical team for API credentials and documentation.' },
      { q: 'Rate limits?', a: '1,000 requests per hour per user. Tokens expire after 24 hours.' }
    ],
    troubleshooting: [
      { q: 'Data not loading?', a: 'Check internet connection, refresh page (F5), clear cache, verify VPN connection.' },
      { q: 'Authentication errors?', a: 'Verify credentials, check Caps Lock, try logging out and back in.' },
      { q: 'Charts loading slowly?', a: 'Select shorter time range, close unnecessary tabs, ensure stable connection.' },
      { q: 'Report a bug?', a: 'Use Support tab to submit a ticket with detailed information and screenshots.' }
    ]
  }

  const trainingCourses = {
    'getting-started': [
      { title: 'Platform Introduction', duration: '15 min', level: 'Beginner', type: 'Course' },
      { title: 'First Steps', duration: '25 min', level: 'Beginner', type: 'Tutorial' },
      { title: 'Understanding Production Data', duration: '30 min', level: 'Beginner', type: 'Course' }
    ],
    'plant-performance': [
      { title: 'OEE Fundamentals', duration: '40 min', level: 'Intermediate', type: 'Course' },
      { title: 'Multi-Plant Analysis', duration: '45 min', level: 'Intermediate', type: 'Workshop' },
      { title: 'Downtime Analysis', duration: '35 min', level: 'Intermediate', type: 'Course' }
    ],
    'ot-analytics': [
      { title: 'OT Data Basics', duration: '30 min', level: 'Beginner', type: 'Course' },
      { title: 'Understanding UNS', duration: '45 min', level: 'Intermediate', type: 'Course' },
      { title: 'Asset Intelligence', duration: '60 min', level: 'Advanced', type: 'Workshop' }
    ]
  }

  const troubleshootingIssues = {
    'data-connectivity': [
      {
        issue: 'Data not loading',
        severity: 'High',
        solutions: ['Check internet connection', 'Refresh page (Ctrl+F5)', 'Clear browser cache', 'Verify backend service running']
      },
      {
        issue: 'Connection timeout',
        severity: 'High',
        solutions: ['Restart backend service', 'Check firewall settings', 'Verify Azure service health', 'Check VPN connection']
      }
    ],
    'performance': [
      {
        issue: 'Slow page loads',
        severity: 'Medium',
        solutions: ['Close unnecessary tabs', 'Clear cache', 'Use filters to reduce data', 'Check network speed']
      },
      {
        issue: 'Charts freezing',
        severity: 'Medium',
        solutions: ['Reduce date range', 'Use filters', 'Refresh page', 'Try different browser']
      }
    ],
    'authentication': [
      {
        issue: 'Cannot connect to Eventhouse',
        severity: 'Critical',
        solutions: ['Verify .env credentials', 'Check service principal', 'Ensure proper permissions', 'Contact Azure admin']
      }
    ]
  }

  return (
    <div className="page-container">
      {/* Compact Header */}
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>Help Centre</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            Access documentation, training materials, and support resources
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9B9B9B' }} />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                border: '1px solid #E8E8E8',
                borderRadius: '6px',
                fontSize: '11px'
              }}
            />
          </div>
          <div style={{
            padding: '6px 12px',
            background: '#E0F2E9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0F5132'
          }}>
            {tabs.length} Sections
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: '8px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Icon size={12} /> {tab.name}
            </button>
          )
        })}
      </div>

      <div className="tab-content">
        {/* DOCUMENTATION TAB */}
        {activeTab === 'documentation' && (
          <div>
            {/* Sub-tabs */}
            <div className="tabs-container" style={{ marginBottom: '8px' }}>
              {docTabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`tab-button ${activeDocTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveDocTab(tab.id)}
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                  >
                    <Icon size={12} style={{ marginRight: '4px' }} />
                    {tab.name}
                  </button>
                )
              })}
            </div>

            {/* Documentation Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '8px' }}>
              {documentationContent[activeDocTab]?.sections.map((section, idx) => (
                <div key={idx} className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <BookOpen size={16} style={{ color: '#0A1628' }} />
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                      {section.title}
                    </h3>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px', lineHeight: '1.8', color: '#3D3D3D' }}>
                    {section.items.map((item, iIdx) => (
                      <li key={iIdx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Summary Card */}
            <div style={{ marginTop: '8px', padding: '12px', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)', borderRadius: '8px', border: '1px solid #FFE5E5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={20} style={{ color: '#F59E0B' }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 4px 0', color: '#1f2937' }}>
                    {documentationContent[activeDocTab]?.title}
                  </h3>
                  <p style={{ fontSize: '11px', margin: 0, color: '#6b7280' }}>
                    {documentationContent[activeDocTab]?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <div>
            {/* Sub-tabs */}
            <div className="tabs-container" style={{ marginBottom: '8px' }}>
              {['general', 'technical', 'troubleshooting'].map(tab => (
                <button
                  key={tab}
                  className={`tab-button ${activeFaqTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveFaqTab(tab)}
                  style={{ fontSize: '11px', padding: '6px 12px', textTransform: 'capitalize' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* FAQ Cards */}
            <div style={{ display: 'grid', gap: '8px' }}>
              {faqContent[activeFaqTab]?.map((item, idx) => (
                <div key={idx} className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <HelpCircle size={16} style={{ color: '#0A1628', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: '#1f2937' }}>
                        {item.q}
                      </h3>
                      <p style={{ margin: '0', color: '#3D3D3D', fontSize: '11px', lineHeight: '1.6' }}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRAINING TAB */}
        {activeTab === 'training' && (
          <div>
            {/* Sub-tabs */}
            <div className="tabs-container" style={{ marginBottom: '8px' }}>
              {Object.keys(trainingCourses).map(tab => (
                <button
                  key={tab}
                  className={`tab-button ${activeTrainingTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTrainingTab(tab)}
                  style={{ fontSize: '11px', padding: '6px 12px', textTransform: 'capitalize' }}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Training Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
              {trainingCourses[activeTrainingTab]?.map((course, idx) => (
                <div key={idx} className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)',
                      color: '#0A1628',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {course.type}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#6B6B6B', fontWeight: '600' }}>
                      <Clock size={11} />
                      {course.duration}
                    </div>
                  </div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: '#1f2937' }}>
                    {course.title}
                  </h3>
                  <span style={{
                    padding: '2px 6px',
                    background: course.level === 'Beginner' ? '#E0F2FE' : course.level === 'Intermediate' ? '#FEF3C7' : '#FECACA',
                    color: course.level === 'Beginner' ? '#0369A1' : course.level === 'Intermediate' ? '#CA8A04' : '#DC2626',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: '600'
                  }}>
                    {course.level}
                  </span>
                  <button className="btn-save" style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    <GraduationCap size={13} />
                    Start Course
                  </button>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div style={{ marginTop: '8px', padding: '12px', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)', borderRadius: '8px', border: '1px solid #FFE5E5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#0A1628', marginBottom: '2px' }}>
                    {trainingCourses[activeTrainingTab]?.length || 0}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6B6B6B', fontWeight: '600', textTransform: 'uppercase' }}>
                    Available Courses
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    0
                  </div>
                  <div style={{ fontSize: '10px', color: '#6B6B6B', fontWeight: '600', textTransform: 'uppercase' }}>
                    Completed
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6', marginBottom: '2px' }}>
                    {Object.values(trainingCourses).flat().length}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6B6B6B', fontWeight: '600', textTransform: 'uppercase' }}>
                    Total Courses
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TROUBLESHOOTING TAB */}
        {activeTab === 'troubleshooting' && (
          <div>
            {/* Sub-tabs */}
            <div className="tabs-container" style={{ marginBottom: '8px' }}>
              {Object.keys(troubleshootingIssues).map(tab => (
                <button
                  key={tab}
                  className={`tab-button ${activeTroubleshootingTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTroubleshootingTab(tab)}
                  style={{ fontSize: '11px', padding: '6px 12px', textTransform: 'capitalize' }}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Troubleshooting Cards */}
            <div style={{ display: 'grid', gap: '8px' }}>
              {troubleshootingIssues[activeTroubleshootingTab]?.map((item, idx) => (
                <div key={idx} className="chart-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{
                    padding: '10px 12px',
                    background: item.severity === 'Critical' ? 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)' :
                               item.severity === 'High' ? 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)' :
                               'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>
                      {item.issue}
                    </h3>
                    <span style={{
                      padding: '3px 8px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {item.severity}
                    </span>
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <CheckCircle size={14} style={{ color: '#10B981' }} />
                      <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#1f2937', textTransform: 'uppercase' }}>
                        Solutions
                      </h4>
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', lineHeight: '1.7', color: '#3D3D3D' }}>
                      {item.solutions.map((solution, sIdx) => (
                        <li key={sIdx}>{solution}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Tips */}
            <div style={{
              marginTop: '8px',
              padding: '12px',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              borderRadius: '8px',
              border: '1px solid #FCD34D'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                <AlertCircle size={20} style={{ color: '#D97706', flexShrink: 0 }} />
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: '#92400E' }}>
                    General Troubleshooting Tips
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', lineHeight: '1.7', color: '#92400E' }}>
                    <li>Check browser console (F12) for error messages</li>
                    <li>Try hard refresh (Ctrl+F5)</li>
                    <li>Clear cache and cookies regularly</li>
                    <li>Verify network connection and backend service status</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              <div className="chart-card" style={{ padding: '14px', textAlign: 'center' }}>
                <Mail size={24} style={{ color: '#0A1628', margin: '0 auto 8px' }} />
                <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700' }}>Email Support</h3>
                <p style={{ margin: '0 0 10px 0', color: '#6B6B6B', fontSize: '11px' }}>
                  Response within 24 hours
                </p>
                <button className="btn-save" style={{ width: '100%', padding: '8px', fontSize: '11px' }}>Send Email</button>
              </div>
              <div className="chart-card" style={{ padding: '14px', textAlign: 'center' }}>
                <MessageCircle size={24} style={{ color: '#0A1628', margin: '0 auto 8px' }} />
                <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700' }}>Live Chat</h3>
                <p style={{ margin: '0 0 10px 0', color: '#6B6B6B', fontSize: '11px' }}>
                  Mon-Fri, 9AM-5PM EST
                </p>
                <button className="btn-save" style={{ width: '100%', padding: '8px', fontSize: '11px' }}>Start Chat</button>
              </div>
              <div className="chart-card" style={{ padding: '14px', textAlign: 'center' }}>
                <Mail size={24} style={{ color: '#0A1628', margin: '0 auto 8px' }} />
                <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700' }}>Phone Support</h3>
                <p style={{ margin: '0 0 10px 0', color: '#6B6B6B', fontSize: '11px' }}>
                  +1 (800) 123-4567
                </p>
                <button className="btn-save" style={{ width: '100%', padding: '8px', fontSize: '11px' }}>Call Now</button>
              </div>
            </div>

            <div className="chart-card" style={{ padding: '14px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700' }}>Submit a Support Ticket</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Subject</label>
                  <input type="text" className="form-input" placeholder="Brief description" style={{ fontSize: '11px', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Category</label>
                  <select className="form-select" style={{ fontSize: '11px', padding: '8px' }}>
                    <option>Technical Issue</option>
                    <option>Feature Request</option>
                    <option>Account Question</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Detailed information..."
                    style={{ resize: 'vertical', fontSize: '11px', padding: '8px' }}
                  ></textarea>
                </div>
                <button className="btn-save" style={{ padding: '8px 16px', fontSize: '11px' }}>
                  <Mail size={14} />
                  Submit Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HelpCentre