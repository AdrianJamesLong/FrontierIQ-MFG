import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import './Breadcrumb.css'

function Breadcrumb() {
  const location = useLocation()

  // Map routes to display names and groups
  const routeMap = {
    '/': { name: 'Production Summary', group: 'Live Operations' },
    '/data-agent': { name: 'Data Agent', group: 'Smart Assistant' },
    '/tier1-analytical-agents': { name: 'Performance Analysis', group: 'AI Insights & Analysis' },
    '/tier2-diagnostic-rca-agents': { name: 'Root Cause Analysis', group: 'AI Insights & Analysis' },
    '/tier3-predictive-prescriptive-agents': { name: 'Recommendations', group: 'AI Insights & Analysis' },
    '/production-ops': { name: 'Real-time Operations', group: 'Live Operations' },
    '/production-schedule': { name: 'Production Schedule', group: 'Live Operations' },
    '/plant-performance': { name: 'Plant Performance', group: 'Plant & Equipment' },
    '/ot-data-insights': { name: 'OT Data Insights', group: 'Plant & Equipment' },
    '/ot-process-insights': { name: 'OT Process Insights', group: 'Plant & Equipment' },
    '/ot-mvp-solutions': { name: 'AI Assisted Connected Worker', group: 'Plant & Equipment' },
    '/data-explorer': { name: 'Data Explorer', group: 'Data & Quality' },
    '/data-quality': { name: 'Data Quality', group: 'Data & Quality' },
    '/app-health': { name: 'Application Health', group: 'Data & Quality' },
    '/settings': { name: 'Settings', group: null },
    '/help-centre': { name: 'Help Centre', group: null }
  }

  const currentRoute = routeMap[location.pathname]

  if (!currentRoute) return null

  return (
    <div className="breadcrumb">
      <NavLink to="/" className="breadcrumb-item breadcrumb-home">
        <Home size={14} />
      </NavLink>

      {currentRoute.group && (
        <>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-item breadcrumb-group">{currentRoute.group}</span>
        </>
      )}

      <ChevronRight size={14} className="breadcrumb-separator" />
      <span className="breadcrumb-item breadcrumb-current">{currentRoute.name}</span>
    </div>
  )
}

export default Breadcrumb
