import { NavLink } from 'react-router-dom'
import {
  Zap, Layers, BarChart3, Database, Shield, Server,
  MessageSquare, TrendingUp, AlertTriangle, Lightbulb,
  Factory, CalendarClock, Activity, Package, FlaskConical,
  LayoutDashboard, Wrench, Home
} from 'lucide-react'
import { useProductConfig } from '../contexts/ProductConfigContext'
import frontierMark from '../assets/frontier-mark-cyan.png'
import './Sidebar.css'

const sections = [
  {
    id: 'ai-agents',
    label: 'AI Agents',
    color: '#4A7AB5',
    items: [
      { path: '/data-agent', name: 'Data Agent', icon: MessageSquare },
      { path: '/tier1-analytical-agents', name: 'Performance Analysis', icon: TrendingUp },
      { path: '/tier2-diagnostic-rca-agents', name: 'Root Cause Analysis', icon: AlertTriangle },
      { path: '/tier3-predictive-prescriptive-agents', name: 'Recommendations', icon: Lightbulb },
    ]
  },
  {
    id: 'ops',
    label: 'Operations Optimisation',
    color: '#4A7AB5',
    items: [
      { path: '/production-intelligence', name: 'Production Intelligence', icon: LayoutDashboard },
      { path: '/schedule-optimisation', name: 'Schedule Optimisation', icon: CalendarClock },
    ]
  },
  {
    id: 'asset',
    label: 'Asset Optimisation',
    color: '#4A7AB5',
    items: [
      { path: '/ot-data-insights', name: 'OT Data Insights', icon: Activity },
      { path: '/ot-process-insights', name: 'OT Process Insights', icon: Layers },
      { path: '/maintenance-orders', name: 'Maintenance Orders', icon: Wrench },
    ]
  },
  {
    id: 'energy',
    label: 'Energy Optimisation',
    color: '#4A7AB5',
    items: [
      { path: '/energy-dashboard', name: 'Energy Dashboard', icon: Zap },
      { path: '/energy-consumption', name: 'Consumption Analysis', icon: BarChart3 },
      { path: '/peak-demand', name: 'Peak Demand AI', icon: TrendingUp },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory Optimisation',
    color: '#4A7AB5',
    items: [
      { path: '/stock-overview', name: 'Stock Overview', icon: Package },
      { path: '/replenishment', name: 'Material Replenishment', icon: Factory },
      { path: '/demand-forecasting', name: 'Demand Forecasting', icon: TrendingUp },
    ]
  },
  {
    id: 'quality',
    label: 'Quality Optimisation',
    color: '#4A7AB5',
    items: [
      { path: '/quality-dashboard', name: 'Quality Dashboard', icon: FlaskConical },
      { path: '/batch-analytics', name: 'Batch Analytics', icon: BarChart3 },
      { path: '/cip-yield', name: 'CIP & Yield Tracker', icon: Shield },
    ]
  },
  {
    id: 'platform',
    label: 'Platform',
    color: '#4A7AB5',
    items: [
      { path: '/data-explorer', name: 'Data Explorer', icon: Database },
      { path: '/data-quality', name: 'Data Quality', icon: Shield },
    ]
  }
]

function Sidebar() {
  const { config } = useProductConfig()

  const urlParams = new URLSearchParams(window.location.search)
  const isPreviewMode = urlParams.has('previewProduct')

  const visibleSections = isPreviewMode && config?.ui?.pages?.enabled
    ? sections.map(s => ({
        ...s,
        items: s.items.filter(i => config.ui.pages.enabled.includes(i.path))
      })).filter(s => s.items.length > 0)
    : sections

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar-header">
        <div className="sidebar-brand-row">
          <img src={frontierMark} alt="FrontierIQ-MFG" className="sidebar-brand-mark" />
          <span className="sidebar-brand-title">FrontierIQ<span className="accent">-MFG</span></span>
        </div>
        <span className="sidebar-brand-secondary">Manufacturing Intelligence &amp; Optimization</span>
        {isPreviewMode && config && (
          <div className="sidebar-preview-badge">
            <Eye size={12} />
            <span>PREVIEW: {config.productName}</span>
          </div>
        )}
      </div>

      {/* Home link */}
      <div style={{ padding: '4px 10px 0' }}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          style={{ marginBottom: '2px' }}
        >
          <Home size={13} className="nav-icon" />
          <span className="nav-text">Overview</span>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {visibleSections.map(section => (
          <div key={section.id} className="nav-section">
            <div className="section-label">{section.label}</div>
            {section.items.map(item => {
              const Icon = item.icon
              if (item.comingSoon) {
                return (
                  <div key={item.path} className="nav-item nav-item--soon">
                    <Icon size={13} className="nav-icon" />
                    <span className="nav-text">{item.name}</span>
                    <span className="soon-badge">Soon</span>
                  </div>
                )
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={13} className="nav-icon" />
                  <span className="nav-text">{item.name}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <NavLink to="/app-health" className={({ isActive }) => `footer-link${isActive ? ' active' : ''}`}>
          <Server size={12} />
          <span>App Health</span>
        </NavLink>
        <div className="footer-version">v1.0 · {import.meta.env.MODE}</div>
        <div className="powered-by-claude">
          <svg width="11" height="11" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1.5L15.5 5.25V12.75L9 16.5L2.5 12.75V5.25L9 1.5Z" fill="#C15F3C" />
            <path d="M6.5 9L8 11L11.5 7" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Powered by Claude</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
