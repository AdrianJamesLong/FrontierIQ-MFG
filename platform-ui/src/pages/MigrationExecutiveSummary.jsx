import { useState } from 'react'
import Breadcrumb from '../components/Breadcrumb'
import { FileText, CheckCircle, TrendingUp, DollarSign, Calendar, Users, ArrowRight, Download, Target, Zap, Shield } from 'lucide-react'
import './Dashboard.css'

function MigrationExecutiveSummary() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'benefits', name: 'Key Benefits', icon: Zap },
    { id: 'cost', name: 'Cost Analysis', icon: DollarSign },
    { id: 'timeline', name: 'Timeline', icon: Calendar },
    { id: 'agents', name: 'Agent Mapping', icon: Target },
    { id: 'actions', name: 'Next Steps', icon: CheckCircle },
    { id: 'resources', name: 'Resources', icon: Users }
  ]

  const getSectionContent = () => {
    const sectionData = {
      overview: {
        title: 'Migration Overview',
        description: 'Transform your current local agent-based application into a production-grade enterprise solution using Microsoft Agent Framework.',
        highlights: [
          'Enterprise scalability with 1000+ req/s and 10K+ users',
          'Advanced orchestration with multi-agent workflows',
          'Security & compliance with SSO, MFA, and audit trails',
          'Operational excellence with full observability'
        ]
      },
      benefits: {
        title: 'Key Benefits',
        description: 'Strategic advantages of migrating to Microsoft Agent Framework for enterprise-grade operations.',
        highlights: [
          'Enterprise Scalability: 1000+ req/s, 10K+ users, 99.9% uptime',
          'Advanced Orchestration: Multi-agent workflows, event-driven architecture',
          'Security & Compliance: SSO, MFA, encryption, comprehensive audit trails',
          'Operational Excellence: Full observability, CI/CD, zero-downtime deployments'
        ]
      },
      cost: {
        title: 'Cost Analysis',
        description: 'Detailed cost breakdown with optimization strategies achieving 30-40% savings through reserved instances and intelligent resource management.',
        highlights: [
          'Optimized Monthly Cost: $6K - $12K with reserved instances',
          'Full-Featured Cost: $10K - $20K for complete enterprise features',
          'Reserved instances provide 30-40% savings',
          'Auto-scaling policies optimize resource utilization',
          'Token optimization and multi-tenancy reduce overhead'
        ]
      },
      timeline: {
        title: 'Migration Timeline - 20 Weeks',
        description: 'Structured 5-phase approach ensuring systematic migration with minimal risk and maximum value delivery.',
        highlights: [
          'Phase 1 (Weeks 1-4): Foundation - Infrastructure, security, monitoring',
          'Phase 2 (Weeks 5-8): Agent Migration - Tier 1 agents, parallel run',
          'Phase 3 (Weeks 9-12): Advanced Features - Tier 2 & 3, workflows',
          'Phase 4 (Weeks 13-16): Hardening - Testing, security, disaster recovery',
          'Phase 5 (Weeks 17+): Cutover - Blue-green deployment, stabilization'
        ]
      },
      agents: {
        title: 'Agent Migration Mapping',
        description: 'Comprehensive mapping of all 7 current agents to Microsoft Agent Framework patterns with enhanced capabilities.',
        highlights: [
          'Performance Analyst → Analytical Agent with memory and multi-turn conversations',
          'Data Quality → Monitoring Agent with proactive monitoring and auto-remediation',
          'Line Operations → Real-time Agent with event-driven streaming',
          'Downtime RCA → Diagnostic Agent with multi-step investigation',
          'Bottleneck/Constraint → Optimization Agent with constraint solvers',
          'Operations Recommendation → Decision Agent with human-in-the-loop workflows',
          'Executive Briefing → Reporting Agent with templating and distribution'
        ]
      },
      actions: {
        title: 'Immediate Actions',
        description: 'Critical first steps to initiate the migration process and establish the foundation for success.',
        highlights: [
          'Approve migration plan and allocate resources',
          'Set up Azure environment (subscriptions, resource groups)',
          'Provision core services (API Management, Cosmos DB)',
          'Establish CI/CD pipeline (GitHub Actions)',
          'Begin agent conversion to Semantic Kernel'
        ]
      },
      resources: {
        title: 'Required Resources',
        description: 'Team composition and resource allocation needed for successful migration execution.',
        highlights: [
          'Development Team: 2-3 developers for agent migration',
          'DevOps Engineer: 1 engineer for infrastructure and CI/CD',
          'Architect: 1 architect for design and oversight',
          'QA & PM: 1 QA engineer + 1 project manager'
        ]
      }
    }

    return sectionData[activeSection] || sectionData.overview
  }

  const content = getSectionContent()
  const Icon = sections.find(s => s.id === activeSection)?.icon || FileText

  return (
    <div className="page-container">
      <Breadcrumb 
        items={[
          { label: 'Migration Planning', path: '/migration-executive-summary' },
          { label: 'Executive Summary' }
        ]} 
      />
      
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
            <FileText size={28} />
          </div>
          <div>
            <h1>Executive Summary</h1>
            <p className="page-subtitle">Production-Grade Transformation Overview</p>
          </div>
        </div>
        <a 
          href="/plans/executive-summary.md" 
          download
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#1e3a8a',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1e40af'}
          onMouseOut={(e) => e.currentTarget.style.background = '#1e3a8a'}
        >
          <Download size={18} />
          Download Summary
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Navigation Sidebar */}
        <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sections
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    background: activeSection === section.id ? '#eff6ff' : 'transparent',
                    color: activeSection === section.id ? '#1e3a8a' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: activeSection === section.id ? '600' : '400',
                    transition: 'all 0.2s',
                    borderLeft: activeSection === section.id ? '3px solid #3b82f6' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = '#f8fafc'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <section.icon size={16} />
                  {section.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div>
          <div className="card">
            <div className="card-content" style={{ padding: '2.5rem' }}>
              <div style={{ maxWidth: '900px' }}>
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '12px' }}>
                    <Icon size={32} color="#1e3a8a" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                      {content.title}
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>
                      {content.description}
                    </p>
                  </div>
                </div>

                {/* Current vs Target State (only for overview) */}
                {activeSection === 'overview' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Current State
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', lineHeight: '1.8', fontSize: '0.9375rem' }}>
                        <li>Single-tenant, local deployment</li>
                        <li>Manual scaling and deployment</li>
                        <li>Limited security controls</li>
                        <li>Basic error handling</li>
                      </ul>
                    </div>
                    
                    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Target State
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e3a8a', lineHeight: '1.8', fontSize: '0.9375rem' }}>
                        <li>Multi-tenant, cloud-native</li>
                        <li>Auto-scaling & high availability</li>
                        <li>Enterprise security (Entra ID, RBAC)</li>
                        <li>Full observability & monitoring</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Timeline Visual (only for timeline section) */}
                {activeSection === 'timeline' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                      { phase: 1, weeks: '1-4', title: 'Foundation', desc: 'Infrastructure, security, monitoring' },
                      { phase: 2, weeks: '5-8', title: 'Agent Migration', desc: 'Tier 1 agents, parallel run' },
                      { phase: 3, weeks: '9-12', title: 'Advanced Features', desc: 'Tier 2 & 3, workflows' },
                      { phase: 4, weeks: '13-16', title: 'Hardening', desc: 'Testing, security, DR' },
                      { phase: 5, weeks: '17+', title: 'Cutover', desc: 'Blue-green deployment' }
                    ].map((phase) => (
                      <div key={phase.phase} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                          {phase.phase}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Weeks {phase.weeks}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                          {phase.title}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: '1.5' }}>
                          {phase.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agent Mapping Table (only for agents section) */}
                {activeSection === 'agents' && (
                  <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e3a8a' }}>Current Agent</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e3a8a' }}>Target Pattern</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e3a8a' }}>Key Enhancements</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Performance Analyst', 'Analytical Agent', 'Memory, multi-turn, tool plugins'],
                          ['Data Quality', 'Monitoring Agent', 'Proactive monitoring, auto-remediation'],
                          ['Line Operations', 'Real-time Agent', 'Event-driven, streaming data'],
                          ['Downtime RCA', 'Diagnostic Agent', 'Multi-step investigation, evidence collection'],
                          ['Bottleneck/Constraint', 'Optimization Agent', 'Constraint solver, optimization algorithms'],
                          ['Operations Recommendation', 'Decision Agent', 'Human-in-the-loop, approval workflows'],
                          ['Executive Briefing', 'Reporting Agent', 'Templating, multi-format, distribution']
                        ].map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '1rem', color: '#1e3a8a', fontWeight: '500' }}>{row[0]}</td>
                            <td style={{ padding: '1rem', color: '#475569' }}>{row[1]}</td>
                            <td style={{ padding: '1rem', color: '#64748b' }}>{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Key Highlights */}
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '1.5rem' }}>
                    📋 Key Highlights
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {content.highlights.map((highlight, idx) => (
                      <li key={idx} style={{ fontSize: '0.9375rem', color: '#475569', lineHeight: '1.7' }}>
                        <strong style={{ color: '#1e3a8a' }}>{highlight.split(':')[0]}</strong>
                        {highlight.includes(':') ? ':' + highlight.split(':').slice(1).join(':') : ''}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Documentation Links */}
                <div style={{ 
                  padding: '2rem', 
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
                  borderRadius: '12px',
                  border: '1px solid #bfdbfe'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '1rem' }}>
                    📚 Supporting Documentation
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    Access comprehensive migration documentation and implementation guides:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <a 
                      href="/migration-detailed-plan"
                      style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        border: '1px solid #bfdbfe',
                        transition: 'all 0.2s',
                        display: 'block'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6'
                        e.currentTarget.style.background = '#f8fafc'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#bfdbfe'
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      <FileText size={24} color="#3b82f6" style={{ marginBottom: '0.75rem' }} />
                      <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                        Detailed Migration Plan
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
                        Complete architecture & roadmap
                      </div>
                      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontSize: '0.875rem', fontWeight: '500' }}>
                        View Details <ArrowRight size={16} />
                      </div>
                    </a>
                    <a 
                      href="/migration-implementation"
                      style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        border: '1px solid #bfdbfe',
                        transition: 'all 0.2s',
                        display: 'block'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6'
                        e.currentTarget.style.background = '#f8fafc'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#bfdbfe'
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      <FileText size={24} color="#3b82f6" style={{ marginBottom: '0.75rem' }} />
                      <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                        Implementation Guide
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
                        Code examples & templates
                      </div>
                      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontSize: '0.875rem', fontWeight: '500' }}>
                        View Details <ArrowRight size={16} />
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MigrationExecutiveSummary