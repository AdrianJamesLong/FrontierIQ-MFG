import { AlertTriangle, Search, Microscope, GitBranch } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import './AIStudioPages.css'

function RCAWorkbench() {
  return (
    <div className="page-container">
      <Breadcrumb
        items={[
          { label: 'AI Studio', path: '/ai-studio/overview' },
          { label: 'Analysis' },
          { label: 'RCA Workbench' }
        ]}
      />

      <div className="ai-studio-header">
        <div className="ai-studio-icon-wrapper">
          <AlertTriangle size={32} className="ai-studio-icon" />
        </div>
        <div className="ai-studio-title-section">
          <h1>RCA Workbench</h1>
          <p className="ai-studio-subtitle">Root Cause Analysis powered by AI diagnostics</p>
        </div>
      </div>

      <div className="ai-studio-content">
        <div className="info-card">
          <AlertTriangle size={24} className="card-icon" />
          <h2>Why Did It Happen?</h2>
          <p>
            The RCA Workbench uses AI-powered diagnostic agents to investigate production issues,
            identify root causes, and provide detailed analysis of failure patterns and anomalies.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <Search size={20} className="feature-icon" />
            <h3>Issue Investigation</h3>
            <p>Deep dive into specific incidents with comprehensive data analysis</p>
          </div>

          <div className="feature-card">
            <Microscope size={20} className="feature-icon" />
            <h3>Pattern Recognition</h3>
            <p>AI identifies recurring issues and common failure modes</p>
          </div>

          <div className="feature-card">
            <GitBranch size={20} className="feature-icon" />
            <h3>Causal Analysis</h3>
            <p>Trace issues back through the causal chain to find true root causes</p>
          </div>
        </div>

        <div className="section-card">
          <h2>Analysis Workflow</h2>
          <ul className="feature-list">
            <li><strong>Step 1:</strong> Select an incident or issue to investigate</li>
            <li><strong>Step 2:</strong> AI agents gather relevant contextual data</li>
            <li><strong>Step 3:</strong> Automated analysis identifies potential causes</li>
            <li><strong>Step 4:</strong> Review findings and validate hypotheses</li>
            <li><strong>Step 5:</strong> Document root cause and recommended actions</li>
          </ul>
        </div>

        <div className="placeholder-notice">
          <p><strong>Coming Soon:</strong> Interactive RCA canvas and collaboration tools</p>
        </div>
      </div>
    </div>
  )
}

export default RCAWorkbench
