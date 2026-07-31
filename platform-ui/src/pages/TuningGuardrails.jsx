import { Sliders, Shield, Settings, Lock } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import './AIStudioLab.css'

function TuningGuardrails() {
  return (
    <div className="page-container">
      <Breadcrumb
        items={[
          { label: 'AI Studio', path: '/ai-studio/overview' },
          { label: 'Trust & Control' },
          { label: 'Tuning & Guardrails' }
        ]}
      />

      <div className="ai-studio-header">
        <div className="ai-studio-icon-wrapper">
          <Sliders size={32} className="ai-studio-icon" />
        </div>
        <div className="ai-studio-title-section">
          <h1>Tuning & Guardrails</h1>
          <p className="ai-studio-subtitle">Fine-tune AI behavior and set operational boundaries</p>
        </div>
      </div>

      <div className="ai-studio-content">
        <div className="info-card">
          <Sliders size={24} className="card-icon" />
          <h2>Control AI Behavior</h2>
          <p>
            Configure how AI agents operate, set confidence thresholds, define acceptable ranges,
            and establish guardrails to ensure AI recommendations align with your operational policies.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <Settings size={20} className="feature-icon" />
            <h3>Agent Tuning</h3>
            <p>Adjust sensitivity, thresholds, and parameters for each AI agent</p>
          </div>

          <div className="feature-card">
            <Shield size={20} className="feature-icon" />
            <h3>Safety Guardrails</h3>
            <p>Set boundaries to prevent unsafe or inappropriate recommendations</p>
          </div>

          <div className="feature-card">
            <Lock size={20} className="feature-icon" />
            <h3>Access Controls</h3>
            <p>Define who can modify AI settings and approve changes</p>
          </div>
        </div>

        <div className="section-card">
          <h2>Configuration Options</h2>
          <ul className="feature-list">
            <li><strong>Confidence Thresholds:</strong> Minimum certainty required for recommendations</li>
            <li><strong>Alert Sensitivity:</strong> How aggressive or conservative anomaly detection should be</li>
            <li><strong>Operational Limits:</strong> Acceptable ranges for production parameters</li>
            <li><strong>Approval Workflows:</strong> Require human review for critical decisions</li>
            <li><strong>Data Scope:</strong> Which data sources and time ranges agents can access</li>
          </ul>
        </div>

        <div className="section-card">
          <h2>Best Practices</h2>
          <p>
            Start with conservative settings and gradually adjust based on observed performance.
            Always test changes in a non-production environment before deploying to live operations.
            Document all configuration changes for audit purposes.
          </p>
        </div>

        <div className="placeholder-notice">
          <p><strong>Coming Soon:</strong> Visual configuration builder and A/B testing framework</p>
        </div>
      </div>
    </div>
  )
}

export default TuningGuardrails
