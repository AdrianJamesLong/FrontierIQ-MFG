import { TrendingUp, BarChart3, PieChart, LineChart } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'
import './AIStudioPages.css'

function AnalyticsStudio() {
  return (
    <div className="page-container">
      <Breadcrumb
        items={[
          { label: 'AI Studio', path: '/ai-studio/overview' },
          { label: 'Analysis' },
          { label: 'Analytics Studio' }
        ]}
      />

      <div className="ai-studio-header">
        <div className="ai-studio-icon-wrapper">
          <TrendingUp size={32} className="ai-studio-icon" />
        </div>
        <div className="ai-studio-title-section">
          <h1>Analytics Studio</h1>
          <p className="ai-studio-subtitle">Deep dive into production patterns and performance trends</p>
        </div>
      </div>

      <div className="ai-studio-content">
        <div className="info-card">
          <TrendingUp size={24} className="card-icon" />
          <h2>What Happened?</h2>
          <p>
            Analytics Studio provides comprehensive tools for investigating historical production data,
            identifying patterns, and understanding operational performance over time.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <BarChart3 size={20} className="feature-icon" />
            <h3>Performance Metrics</h3>
            <p>Track KPIs, OEE, throughput, and quality metrics across all production lines</p>
          </div>

          <div className="feature-card">
            <LineChart size={20} className="feature-icon" />
            <h3>Trend Analysis</h3>
            <p>Identify long-term patterns and seasonal variations in production data</p>
          </div>

          <div className="feature-card">
            <PieChart size={20} className="feature-icon" />
            <h3>Comparative Analysis</h3>
            <p>Compare performance across lines, shifts, products, and time periods</p>
          </div>
        </div>

        <div className="section-card">
          <h2>Key Features</h2>
          <ul className="feature-list">
            <li>Interactive dashboards with real-time data visualization</li>
            <li>Custom report generation with flexible filtering</li>
            <li>Automated anomaly detection and alerting</li>
            <li>Export capabilities for further analysis</li>
            <li>Integration with AI agents for contextual insights</li>
          </ul>
        </div>

        <div className="placeholder-notice">
          <p><strong>Coming Soon:</strong> Advanced analytics tools and custom query builder</p>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsStudio
