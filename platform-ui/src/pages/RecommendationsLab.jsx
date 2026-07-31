import { Lightbulb, Target, Zap, CheckCircle } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import './AIStudioPages.css'

function RecommendationsLab() {
  return (
    <div className="page-container">
      <Breadcrumb
        items={[
          { label: 'AI Studio', path: '/ai-studio/overview' },
          { label: 'Actions' },
          { label: 'Recommendations Lab' }
        ]}
      />

      <div className="ai-studio-header">
        <div className="ai-studio-icon-wrapper">
          <Lightbulb size={32} className="ai-studio-icon" />
        </div>
        <div className="ai-studio-title-section">
          <h1>Recommendations Lab</h1>
          <p className="ai-studio-subtitle">AI-driven insights and actionable prescriptions</p>
        </div>
      </div>

      <div className="ai-studio-content">
        <div className="info-card">
          <Lightbulb size={24} className="card-icon" />
          <h2>What Should We Do?</h2>
          <p>
            The Recommendations Lab provides AI-generated prescriptive guidance, optimization suggestions,
            and predictive insights to help you make informed operational decisions.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <Target size={20} className="feature-icon" />
            <h3>Optimization Opportunities</h3>
            <p>Identify ways to improve efficiency, quality, and throughput</p>
          </div>

          <div className="feature-card">
            <Zap size={20} className="feature-icon" />
            <h3>Predictive Insights</h3>
            <p>Forecast potential issues before they impact production</p>
          </div>

          <div className="feature-card">
            <CheckCircle size={20} className="feature-icon" />
            <h3>Action Plans</h3>
            <p>Detailed implementation steps for recommended changes</p>
          </div>
        </div>

        <div className="section-card">
          <h2>Recommendation Types</h2>
          <ul className="feature-list">
            <li><strong>Process Optimization:</strong> Adjustments to improve operational efficiency</li>
            <li><strong>Predictive Maintenance:</strong> Proactive equipment servicing recommendations</li>
            <li><strong>Quality Improvements:</strong> Actions to reduce defects and variations</li>
            <li><strong>Resource Allocation:</strong> Optimal scheduling and capacity planning</li>
            <li><strong>Cost Reduction:</strong> Opportunities to minimize waste and expenses</li>
          </ul>
        </div>

        <div className="placeholder-notice">
          <p><strong>Coming Soon:</strong> Recommendation tracking and impact measurement</p>
        </div>
      </div>
    </div>
  )
}

export default RecommendationsLab
