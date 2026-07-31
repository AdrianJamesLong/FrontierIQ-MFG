import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, TrendingUp, AlertTriangle, Lightbulb,
  LayoutDashboard, CalendarClock, Calendar,
  Activity, Layers, Users, Wrench,
  Zap, BarChart3, Package, Factory, FlaskConical, Shield, Database,
} from 'lucide-react'

const SECTIONS = [
  {
    label: 'AI Agents',
    desc: 'Ask questions in plain English, or explore the tiered agent reasoning directly.',
    cards: [
      { path: '/data-agent', icon: MessageSquare, title: 'Data Agent', desc: 'Ask anything about NovaChem’s operations.' },
      { path: '/tier1-analytical-agents', icon: TrendingUp, title: 'Performance Analysis', desc: 'What is happening, and why.' },
      { path: '/tier2-diagnostic-rca-agents', icon: AlertTriangle, title: 'Root Cause Analysis', desc: 'Structured diagnosis, not just symptoms.' },
      { path: '/tier3-predictive-prescriptive-agents', icon: Lightbulb, title: 'Recommendations', desc: 'Ranked, executive-ready briefings.' },
    ],
  },
  {
    label: 'Operations Optimisation',
    desc: 'Production scheduling and plant performance.',
    cards: [
      { path: '/production-intelligence', icon: LayoutDashboard, title: 'Production Intelligence', desc: 'Production scheduling and performance overview.' },
      { path: '/schedule-optimisation', icon: CalendarClock, title: 'Schedule Optimisation', desc: 'AI-assisted schedule improvements.' },
      { path: '/production-schedule', icon: Calendar, title: 'Production Schedule', desc: 'Work orders and line schedules.' },
    ],
  },
  {
    label: 'Asset Optimisation',
    desc: 'OT data, process insights, and maintenance.',
    cards: [
      { path: '/ot-data-insights', icon: Activity, title: 'OT Data Insights', desc: 'Sensor and process data, anomaly detection.' },
      { path: '/ot-process-insights', icon: Layers, title: 'OT Process Insights', desc: 'Process-level operational insight.' },
      { path: '/ot-mvp-solutions', icon: Users, title: 'AI Assisted Connected Worker', desc: 'Frontline worker AI assistance.' },
      { path: '/maintenance-orders', icon: Wrench, title: 'Maintenance Orders', desc: 'Work order tracking and status.' },
    ],
  },
  {
    label: 'Energy Optimisation',
    desc: 'Consumption, demand, and energy per batch.',
    cards: [
      { path: '/energy-dashboard', icon: Zap, title: 'Energy Dashboard', desc: 'Plant-wide energy overview.' },
      { path: '/energy-consumption', icon: BarChart3, title: 'Consumption Analysis', desc: 'Usage trends and breakdowns.' },
      { path: '/peak-demand', icon: TrendingUp, title: 'Peak Demand AI', desc: 'Forecast and manage demand peaks.' },
    ],
  },
  {
    label: 'Inventory Optimisation',
    desc: 'Stock levels, replenishment, and demand forecasting.',
    cards: [
      { path: '/stock-overview', icon: Package, title: 'Stock Overview', desc: 'Current inventory position.' },
      { path: '/replenishment', icon: Factory, title: 'Material Replenishment', desc: 'Reorder recommendations.' },
      { path: '/demand-forecasting', icon: TrendingUp, title: 'Demand Forecasting', desc: 'Projected material demand.' },
    ],
  },
  {
    label: 'Quality Optimisation',
    desc: 'Batch quality, CIP efficiency, and yield.',
    cards: [
      { path: '/quality-dashboard', icon: FlaskConical, title: 'Quality Dashboard', desc: 'Batch quality overview.' },
      { path: '/batch-analytics', icon: BarChart3, title: 'Batch Analytics', desc: 'Yield and quality trends.' },
      { path: '/cip-yield', icon: Shield, title: 'CIP & Yield Tracker', desc: 'Cleaning cycle and yield tracking.' },
    ],
  },
  {
    label: 'Platform',
    desc: 'Underlying data explorer and data quality tools.',
    cards: [
      { path: '/data-explorer', icon: Database, title: 'Data Explorer', desc: 'Browse the underlying data model.' },
      { path: '/data-quality', icon: Shield, title: 'Data Quality', desc: 'Completeness and trust checks.' },
    ],
  },
]

function CardGrid({ cards, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {cards.map(c => (
        <button
          key={c.path}
          type="button"
          onClick={() => onNavigate(c.path)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            flex: '1 1 240px', minWidth: '240px', textAlign: 'left',
            background: '#fff', border: '1px solid #E5E9F0', borderRadius: '10px',
            padding: '14px 16px', cursor: 'pointer', font: 'inherit',
          }}
        >
          <c.icon size={16} color="#4A7AB5" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', marginBottom: '2px' }}>{c.title}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.5' }}>{c.desc}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', padding: '32px 32px 48px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: '#0A1628' }}>FrontierIQ-MFG</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', maxWidth: '640px', lineHeight: '1.6' }}>
            Manufacturing intelligence and optimization for NovaChem, Grangemouth — AI agents grounded in
            live Fabric Lakehouse data, covering production, assets, energy, inventory, and quality.
          </p>
        </div>

        {SECTIONS.map(section => (
          <div key={section.label} style={{
            background: '#fff', borderRadius: '12px', padding: '20px 20px 22px',
            border: '1px solid #E5E9F0', marginBottom: '16px',
          }}>
            <h3 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: '700', color: '#0A1628' }}>{section.label}</h3>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#6B7280' }}>{section.desc}</p>
            <CardGrid cards={section.cards} onNavigate={navigate} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
