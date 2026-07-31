import { useState } from 'react'
import { Monitor, Award, Calculator, Timer, GitBranch, AlertTriangle, BarChart3, Clock, CheckCircle2 } from 'lucide-react'
import './Dashboard.css'

function OTAdditionalMVP() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const useCases = {
    dashboard: {
      title: 'Real-Time Line Dashboard',
      description: 'KQL-powered live view showing equipment status across the line, current product running, throughput rate, and active alarms/faults',
      icon: Monitor,
      color: '#0A1628',
      details: 'Comprehensive real-time monitoring dashboard that provides instant visibility into line performance. Monitor equipment status, track production throughput, and receive immediate alerts for any faults or anomalies.',
      features: [
        { name: 'Equipment Status', desc: 'Live status of all line equipment' },
        { name: 'Current Product', desc: 'Real-time product tracking' },
        { name: 'Throughput Rate', desc: 'Instant production metrics' },
        { name: 'Active Alarms', desc: 'Immediate fault notifications' }
      ]
    },
    quality: {
      title: 'Quality Analytics (Pressco Data)',
      description: 'Inspection data with defect breakdowns, Pareto charts, trend analysis, and threshold alerting',
      icon: Award,
      color: '#3B82F6',
      details: 'Advanced quality analytics leveraging Pressco inspection data to analyze defects by type including Cap Height, Tamperband, and Cap Color. Generate Pareto charts, perform trend analysis over time, compare quality across products, and trigger alerts when defect thresholds are exceeded.',
      features: [
        { name: 'Defect Pareto Charts', desc: 'Visual breakdown by defect type' },
        { name: 'Trend Analysis', desc: 'Quality trends over time' },
        { name: 'Product Comparison', desc: 'Quality metrics by product' },
        { name: 'Threshold Alerting', desc: 'Automated defect limit warnings' }
      ]
    },
    oee: {
      title: 'OEE Calculator',
      description: 'Calculate Overall Equipment Effectiveness: Availability × Performance × Quality',
      icon: Calculator,
      color: '#10B981',
      details: 'Comprehensive OEE calculation engine that combines machine states (running/stopped), fault events, and production counts to calculate true equipment effectiveness. Provides detailed breakdowns of Availability, Performance, and Quality metrics.',
      features: [
        { name: 'Availability', desc: 'Uptime vs planned production time' },
        { name: 'Performance', desc: 'Actual vs ideal cycle time' },
        { name: 'Quality', desc: 'Good units vs total units produced' },
        { name: 'OEE Score', desc: 'Overall effectiveness metric' }
      ]
    },
    downtime: {
      title: 'Downtime/Stoppage Analysis',
      description: 'Parse timer objects and states to detect and categorize stoppages: planned vs unplanned, by equipment, with duration histograms',
      icon: Timer,
      color: '#F59E0B',
      details: 'Intelligent downtime analysis that parses timer objects and boolean states to detect, categorize, and analyze production stoppages. Distinguish between planned and unplanned downtime, track by equipment, and visualize duration patterns.',
      features: [
        { name: 'Stoppage Detection', desc: 'Automatic identification of stops' },
        { name: 'Planned vs Unplanned', desc: 'Categorize downtime types' },
        { name: 'Equipment Breakdown', desc: 'Analysis by specific equipment' },
        { name: 'Duration Histograms', desc: 'Visualize stoppage patterns' }
      ]
    },
    conveyor: {
      title: 'Conveyor/Flow Visualization',
      description: 'Use Airveyor blower statuses and accumulator data to show product flow through the line, identifying bottlenecks',
      icon: GitBranch,
      color: '#8B4513',
      details: 'Visual representation of product flow through the production line using Airveyor blower statuses and accumulator data. Identify bottlenecks, monitor flow rates, and optimize material handling across the line.',
      features: [
        { name: 'Flow Visualization', desc: 'Real-time product movement' },
        { name: 'Blower Status', desc: 'Airveyor system monitoring' },
        { name: 'Accumulator Data', desc: 'Buffer zone tracking' },
        { name: 'Bottleneck Detection', desc: 'Identify flow constraints' }
      ]
    },
    anomaly: {
      title: 'Anomaly Detection',
      description: 'Flag unusual patterns: speed deviations, timer accumulator overruns, unexpected state combinations',
      icon: AlertTriangle,
      color: '#9333EA',
      details: 'Advanced anomaly detection system that identifies unusual operational patterns including speed deviations, timer accumulator overruns, and unexpected equipment state combinations. Provides early warnings to prevent quality issues and equipment failures.',
      features: [
        { name: 'Speed Deviations', desc: 'Detect abnormal speed patterns' },
        { name: 'Timer Overruns', desc: 'Accumulator threshold monitoring' },
        { name: 'State Combinations', desc: 'Unexpected equipment states' },
        { name: 'Predictive Alerts', desc: 'Early warning system' }
      ]
    }
  }

  const currentUseCase = useCases[activeTab]
  const Icon = currentUseCase.icon

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>OT Additional MVP Use Cases</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            Advanced operational technology solutions for production monitoring and analytics
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '6px 12px',
            background: '#E0F2E9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0F5132'
          }}>
            {Object.keys(useCases).length} Use Cases
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: '8px' }}>
        {Object.entries(useCases).map(([key, useCase]) => {
          const TabIcon = useCase.icon
          return (
            <button
              key={key}
              className={`tab-button ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <TabIcon size={12} /> {useCase.title}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        <div className="chart-card" style={{ padding: '24px', background: `linear-gradient(135deg, ${currentUseCase.color}15 0%, ${currentUseCase.color}05 100%)` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${currentUseCase.color} 0%, ${currentUseCase.color}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon size={40} style={{ color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                  {currentUseCase.title}
                </h2>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: '#FFF5E5',
                  color: '#856404'
                }}>
                  Coming Soon
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.6' }}>
                {currentUseCase.description}
              </p>
              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
                {currentUseCase.details}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
          <div className="chart-card" style={{ padding: '16px', textAlign: 'center' }}>
            <BarChart3 size={32} style={{ color: currentUseCase.color, margin: '0 auto 8px' }} />
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Data Sources</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: currentUseCase.color }}>Connected</div>
          </div>

          <div className="chart-card" style={{ padding: '16px', textAlign: 'center' }}>
            <Clock size={32} style={{ color: currentUseCase.color, margin: '0 auto 8px' }} />
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Development</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: currentUseCase.color }}>Planning</div>
          </div>

          <div className="chart-card" style={{ padding: '16px', textAlign: 'center' }}>
            <CheckCircle2 size={32} style={{ color: currentUseCase.color, margin: '0 auto 8px' }} />
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Priority</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: currentUseCase.color }}>High</div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="chart-card" style={{ padding: '16px', marginTop: '8px' }}>
          <h4 style={{ fontSize: '12px', margin: '0 0 8px 0', fontWeight: '700' }}>KEY FEATURES & CAPABILITIES</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {currentUseCase.features.map((feature, index) => (
              <div key={index} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: `3px solid ${currentUseCase.color}` }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{feature.name}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Integration Section */}
        <div className="chart-card" style={{ padding: '16px', marginTop: '8px' }}>
          <h4 style={{ fontSize: '12px', margin: '0 0 8px 0', fontWeight: '700' }}>DATA SOURCES & INTEGRATION</h4>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 12px', background: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#1f2937', border: '1px solid #e5e7eb' }}>
                OT Process Events Table
              </div>
              <div style={{ padding: '8px 12px', background: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#1f2937', border: '1px solid #e5e7eb' }}>
                Fabric Lakehouse
              </div>
              <div style={{ padding: '8px 12px', background: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#1f2937', border: '1px solid #e5e7eb' }}>
                Real-time Streaming
              </div>
              <div style={{ padding: '8px 12px', background: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#1f2937', border: '1px solid #e5e7eb' }}>
                Historical Analysis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OTAdditionalMVP
