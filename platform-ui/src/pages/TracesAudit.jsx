import { FileSearch, Eye, Clock, CheckSquare } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import './AIStudioLab.css'

function TracesAudit() {
  return (
    <div className="page-container">
      <Breadcrumb
        items={[
          { label: 'AI Studio', path: '/ai-studio/overview' },
          { label: 'Trust & Control' },
          { label: 'Traces & Audit' }
        ]}
      />

      <div className="ai-studio-header">
        <div className="ai-studio-icon-wrapper">
          <FileSearch size={32} className="ai-studio-icon" />
        </div>
        <div className="ai-studio-title-section">
          <h1>Traces & Audit</h1>
          <p className="ai-studio-subtitle">Complete transparency into AI decision-making</p>
        </div>
      </div>

      <div className="ai-studio-content">
        <div className="info-card">
          <FileSearch size={24} className="card-icon" />
          <h2>AI Transparency & Accountability</h2>
          <p>
            Every AI recommendation and analysis is fully traceable. Review the complete audit trail
            to understand what data was used, how decisions were made, and why specific recommendations
            were generated.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <Eye size={20} className="feature-icon" />
            <h3>Decision Traces</h3>
            <p>Step-by-step breakdown of AI reasoning and logic chains</p>
          </div>

          <div className="feature-card">
            <Clock size={20} className="feature-icon" />
            <h3>Historical Audit</h3>
            <p>Complete history of all AI interactions and outputs</p>
          </div>

          <div className="feature-card">
            <CheckSquare size={20} className="feature-icon" />
            <h3>Compliance Reports</h3>
            <p>Generate audit reports for regulatory and internal review</p>
          </div>
        </div>

        <div className="section-card">
          <h2>What You Can Trace</h2>
          <ul className="feature-list">
            <li><strong>Data Sources:</strong> Which databases and tables were queried</li>
            <li><strong>Agent Actions:</strong> Which AI agents were invoked and in what sequence</li>
            <li><strong>Reasoning Steps:</strong> The logical flow from data to conclusion</li>
            <li><strong>Confidence Scores:</strong> How certain the AI is about its outputs</li>
            <li><strong>User Interactions:</strong> Who requested what and when</li>
          </ul>
        </div>

        <div className="placeholder-notice">
          <p><strong>Coming Soon:</strong> Interactive trace visualization and export capabilities</p>
        </div>
      </div>
    </div>
  )
}

export default TracesAudit
