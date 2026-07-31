import { useState } from 'react'
import Breadcrumb from '../components/Breadcrumb'
import { Rocket, FileText, Download, ExternalLink, CheckCircle, Shield, TrendingUp, Eye, DollarSign, GitBranch, Calendar, Zap } from 'lucide-react'
import './Dashboard.css'

function MigrationDetailedPlan() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'architecture', name: 'Architecture', icon: Rocket },
    { id: 'agents', name: 'Agent Migration', icon: GitBranch },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'scalability', name: 'Scalability', icon: TrendingUp },
    { id: 'observability', name: 'Observability', icon: Eye },
    { id: 'cost', name: 'Cost Analysis', icon: DollarSign },
    { id: 'deployment', name: 'Deployment', icon: Zap },
    { id: 'roadmap', name: 'Roadmap', icon: Calendar }
  ]

  const getSectionContent = () => {
    const sectionData = {
      overview: {
        title: 'Executive Summary',
        description: 'Comprehensive strategy to transform your local agent-based application into a production-grade enterprise solution.',
        highlights: [
          'Business value proposition with clear ROI',
          'Investment overview: 20 weeks, $6K-$12K/month optimized',
          'Success criteria with measurable targets',
          'Current limitations vs. post-migration benefits'
        ]
      },
      architecture: {
        title: 'Production-Grade Architecture',
        description: 'Enterprise-grade architecture with 5 key layers for scalability, security, and reliability.',
        highlights: [
          'API Gateway Layer with Azure API Management',
          'Agent Framework Layer with orchestration',
          'AI Services Layer with Semantic Kernel',
          'Data Layer with Cosmos DB and Eventhouse',
          'Platform Services for security and monitoring'
        ]
      },
      agents: {
        title: 'Agent Migration Strategy',
        description: 'Detailed mapping of all 7 agents to Microsoft Agent Framework patterns with tier-based priorities.',
        highlights: [
          'Tier 1 (High Priority): Performance Analyst, Data Quality, Line Operations',
          'Tier 2 (Medium Priority): Downtime RCA, Bottleneck/Constraint',
          'Tier 3 (Low Priority): Operations Recommendation, Executive Briefing',
          '"Crawl, Walk, Run" migration philosophy'
        ]
      },
      security: {
        title: 'Security & Compliance',
        description: 'Enterprise-grade security with advanced identity management, encryption, and compliance automation.',
        highlights: [
          'Microsoft Entra ID with MFA and conditional access',
          'Customer-Managed Keys (CMK) with Python implementation',
          'Data classification & DLP with automated policies',
          'SOC 2, ISO 27001, GDPR compliance ready',
          'Production-ready code examples included'
        ]
      },
      scalability: {
        title: 'Scalability & Performance',
        description: 'Auto-scaling strategies and performance optimization to handle 10,000+ concurrent users.',
        highlights: [
          'Performance targets: <2s response time, 1000+ req/s',
          'Auto-scaling configuration (2-50 replicas)',
          'Caching strategies with Redis',
          'Eventhouse query optimization with materialized views',
          'Load balancing and geographic routing'
        ]
      },
      observability: {
        title: 'Observability & Monitoring',
        description: 'Comprehensive monitoring with distributed tracing, custom metrics, and real-time dashboards.',
        highlights: [
          'OpenTelemetry integration with Python code',
          'Custom metrics for performance, cost, and satisfaction',
          '6 production-ready KQL queries for dashboards',
          'Automated alerting for errors, performance, and cost',
          'Real-time monitoring and incident response'
        ]
      },
      cost: {
        title: 'Cost Analysis & Optimization',
        description: 'Detailed cost breakdown with optimization strategies achieving 30-40% savings.',
        highlights: [
          'Monthly cost: $6K-$12K (optimized) vs $10K-$20K (full)',
          'Reserved instances for 30-40% savings',
          'Token optimization with intelligent caching',
          'Automated cost monitoring and anomaly detection',
          'Python code for cost management included'
        ]
      },
      deployment: {
        title: 'Deployment & DevOps',
        description: 'Automated CI/CD pipelines with blue-green and canary deployment for zero-downtime releases.',
        highlights: [
          'GitHub Actions workflows with security scanning',
          'Blue-green deployment for instant rollback',
          'Canary deployment with gradual traffic shift',
          'Automated health monitoring and rollback',
          'Infrastructure as Code with Bicep/Terraform'
        ]
      },
      roadmap: {
        title: '20-Week Implementation Roadmap',
        description: 'Detailed week-by-week execution plan across 5 phases with deliverables.',
        highlights: [
          'Phase 1 (Weeks 1-4): Foundation & Infrastructure',
          'Phase 2 (Weeks 5-8): Agent Migration & Core Features',
          'Phase 3 (Weeks 9-12): Advanced Features & Tier 2/3 Agents',
          'Phase 4 (Weeks 13-16): Production Hardening & Validation',
          'Phase 5 (Weeks 17-20): Cutover & Stabilization'
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
          { label: 'Detailed Migration Plan' }
        ]} 
      />
      
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
            <Rocket size={28} />
          </div>
          <div>
            <h1>Detailed Migration Plan</h1>
            <p className="page-subtitle">Complete Architecture & Implementation Roadmap</p>
          </div>
        </div>
        <a 
          href="/plans/microsoft-agent-framework-migration.md" 
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
          Download Full Plan
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

                {/* Download CTA */}
                <div style={{ 
                  padding: '2rem', 
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
                  borderRadius: '12px',
                  border: '1px solid #bfdbfe'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '1rem' }}>
                    📥 Access Complete {content.title} Documentation
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    The full migration plan includes comprehensive details for this section with:
                  </p>
                  <ul style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', paddingLeft: '1.5rem', lineHeight: '1.7' }}>
                    <li><strong>Production-ready code examples</strong> in Python, YAML, and KQL</li>
                    <li><strong>Detailed implementation guides</strong> with step-by-step instructions</li>
                    <li><strong>Architecture diagrams</strong> and technical specifications</li>
                    <li><strong>Best practices</strong> and optimization strategies</li>
                  </ul>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <a 
                      href="/plans/microsoft-agent-framework-migration.md" 
                      download
                      style={{
                        display: 'inline-flex',
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
                      <Download size={16} />
                      Download Complete Migration Plan
                    </a>
                    <a 
                      href="https://learn.microsoft.com/en-us/azure/ai-services/agents/overview" 
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'white',
                        color: '#1e3a8a',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#eff6ff'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.borderColor = '#bfdbfe'
                      }}
                    >
                      Microsoft Docs <ExternalLink size={16} />
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

export default MigrationDetailedPlan