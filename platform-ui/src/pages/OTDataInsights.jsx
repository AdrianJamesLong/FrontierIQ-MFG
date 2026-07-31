import { useState, useEffect } from 'react'
import { Activity, Database, Tag, Cpu, TrendingUp, Clock, RefreshCw, BarChart3, Zap, Server, Layers, ChevronRight, ChevronDown, Bot, Send, Loader2, Sparkles, X, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const COLORS = ['#0A1628', '#152B55', '#1C3668', '#4A7AB5', '#6B9ED4', '#6B6B6B', '#9B9B9B', '#C0C0C0']
// Navy spectrum dark to light
const CHART_COLORS = ['#0A1628', '#152B55', '#1C3668', '#2E558F', '#4A7AB5', '#6B9ED4', '#8FBDE0', '#B3D3EC']

const stripEmoji = t => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()

function OTDataInsights() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [otData, setOtData] = useState([])
  const [hierarchyData, setHierarchyData] = useState([])
  const [selectedUNSNode, setSelectedUNSNode] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [agentError, setAgentError] = useState(null)
  const [showPageInfo, setShowPageInfo] = useState(false)

  const callAgent = async (message) => {
    setAgentLoading(true); setAgentError(null); setAgentResponse('')
    try {
      const res = await fetch(`${API_URL}/api/agent/tier1/line_operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, agent_type: 'line_operations', thread_id: 'ot-data-insights' }),
      })
      if (!res.ok) throw new Error('Agent request failed')
      const result = await res.json()
      setAgentResponse(stripEmoji(result.response || ''))
    } catch (err) {
      setAgentError(err.message)
    } finally {
      setAgentLoading(false)
    }
  }
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  useEffect(() => {
    fetchOTData()
  }, [])

  const fetchOTData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch hierarchy (all lines/equipment/tags via GROUP BY — no record limit)
      // and raw records in parallel
      const [hierarchyRes, eventsRes] = await Promise.all([
        fetch(`${API_URL}/api/ot-hierarchy`),
        fetch(`${API_URL}/api/ot-process-events?limit=50000`)
      ])

      if (hierarchyRes.ok) {
        const hierarchyResult = await hierarchyRes.json()
        setHierarchyData(hierarchyResult.data || [])
      }

      if (!eventsRes.ok) {
        throw new Error('Failed to fetch OT event data')
      }
      const eventsResult = await eventsRes.json()
      setOtData(eventsResult.data || [])
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to safely render values (handles objects, arrays, primitives)
  const renderValue = (val) => {
    if (val === null || val === undefined) return 'N/A'
    if (typeof val === 'object') {
      return JSON.stringify(val)
    }
    if (typeof val === 'boolean') return val.toString()
    return val
  }

  // Derive the correct line name from the equipment prefix (L1/L2/L3/L4)
  // The database `line` column contains only "Line 1 - PET Bottles" for all rows
  const lineFromEquipment = (equipment) => {
    const prefix = (equipment || '').substring(0, 2).toUpperCase()
    const map = { L1: 'Line 1', L2: 'Line 2', L3: 'Line 3', L4: 'Line 4' }
    return map[prefix] || (equipment || '').substring(0, 2) || 'Unknown Line'
  }

  // Calculate metrics — use hierarchyData for true unique counts, otData for recent activity
  const calculateMetrics = () => {
    if (hierarchyData.length === 0 && otData.length === 0) {
      return {
        totalRecords: 0,
        uniqueAssets: 0,
        uniqueTags: 0,
        uniqueLines: 0,
        uniqueEquipment: 0,
        topTags: [],
        topAssets: [],
        assetsByLine: [],
        equipmentDistribution: [],
        tagsByAsset: [],
        recentActivity: [],
        environmentDistribution: [],
        streamTypeDistribution: []
      }
    }

    // Use hierarchyData for true unique counts across all lines (no record limit bias)
    const tags = new Set()
    const lines = new Set()
    const equipment = new Set()

    const tagCounts = {}
    const lineCounts = {}
    const equipmentCounts = {}

    const source = hierarchyData.length > 0 ? hierarchyData : otData
    source.forEach(record => {
      const count = hierarchyData.length > 0 ? (Number(record.record_count) || 1) : 1
      if (record.tag) {
        tags.add(record.tag)
        tagCounts[record.tag] = (tagCounts[record.tag] || 0) + count
      }
      const derivedLine = lineFromEquipment(record.equipment)
      if (derivedLine) {
        lines.add(derivedLine)
        lineCounts[derivedLine] = (lineCounts[derivedLine] || 0) + count
      }
      if (record.equipment) {
        equipment.add(record.equipment)
        equipmentCounts[record.equipment] = (equipmentCounts[record.equipment] || 0) + count
      }
    })

    // Top tags
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top equipment (replaces "assets")
    const topAssets = Object.entries(equipmentCounts)
      .map(([asset, count]) => ({ asset, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Records by line
    const assetsByLine = Object.entries(lineCounts)
      .map(([line, count]) => ({ line, count }))
      .sort((a, b) => b.count - a.count)

    // Equipment distribution
    const equipmentDistribution = Object.entries(equipmentCounts)
      .map(([equipment, count]) => ({ equipment, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Recent activity (last 20 records with timestamps)
    const recentActivity = otData
      .filter(record => record.timestamp || record.edge_arrival_timestamp)
      .slice(-20)
      .map(record => ({
        timestamp: record.timestamp || record.edge_arrival_timestamp,
        asset: record.equipment,
        tag: record.tag,
        line: record.line
      }))

    const totalRecords = hierarchyData.length > 0
      ? hierarchyData.reduce((sum, r) => sum + (Number(r.record_count) || 0), 0)
      : otData.length

    return {
      totalRecords,
      uniqueAssets: equipment.size, // Using equipment as "assets"
      uniqueTags: tags.size,
      uniqueLines: lines.size,
      uniqueEquipment: equipment.size,
      uniqueEnvironments: 0, // Not available in OT Process Events
      uniqueStreamTypes: 0, // Not available in OT Process Events
      topTags,
      topAssets,
      assetsByLine,
      equipmentDistribution,
      tagsByAsset: topTags,
      recentActivity,
      environmentDistribution: [], // Not available in OT Process Events
      streamTypeDistribution: [] // Not available in OT Process Events
    }
  }

  const metrics = calculateMetrics()

  // Build hierarchy from aggregated hierarchyData (no record-count limit bias)
  const buildUNSHierarchy = () => {
    const source = hierarchyData.length > 0 ? hierarchyData : []
    if (source.length === 0) return null

    const hierarchy = {}

    source.forEach(row => {
      const line = lineFromEquipment(row.equipment)
      const equipment = row.equipment || 'Unknown Equipment'
      const tag = row.tag || 'Unknown Tag'
      const count = Number(row.record_count) || 0

      if (!hierarchy[line]) {
        hierarchy[line] = { name: line, level: 0, children: {}, record_count: 0, fullPath: line }
      }
      hierarchy[line].record_count += count

      if (!hierarchy[line].children[equipment]) {
        hierarchy[line].children[equipment] = {
          name: equipment, level: 1, children: {}, record_count: 0,
          fullPath: `${line}/${equipment}`, lineName: line
        }
      }
      hierarchy[line].children[equipment].record_count += count

      if (!hierarchy[line].children[equipment].children[tag]) {
        hierarchy[line].children[equipment].children[tag] = {
          name: tag, level: 2, children: {}, record_count: count,
          fullPath: `${line}/${equipment}/${tag}`, equipmentName: equipment, lineName: line
        }
      }
    })

    return hierarchy
  }

  const unsHierarchy = buildUNSHierarchy()

  // Get hierarchy level name based on depth
  const getISA95LevelName = (level) => {
    const levelNames = ['Line', 'Equipment', 'Tag']
    return levelNames[level] || `Level ${level}`
  }

  // Analyze selected hierarchy node — counts from aggregated data, raw records from otData sample
  const analyzeUNSNode = (node) => {
    if (!node) return null

    // Filter raw records for the detail table (may be a sample if total > 50000)
    let records = []
    if (node.level === 0) {
      records = otData.filter(r => lineFromEquipment(r.equipment) === node.name)
    } else if (node.level === 1) {
      records = otData.filter(r => r.equipment === node.name)
    } else {
      records = otData.filter(r => r.tag === node.name && r.equipment === node.equipmentName)
    }

    // Derive unique counts from hierarchy children (accurate, not limited by raw fetch)
    const tags = new Set()
    const equipment = new Set()
    const lines = new Set()

    if (node.level === 0) {
      lines.add(node.name)
      Object.keys(node.children).forEach(eq => equipment.add(eq))
      Object.values(node.children).forEach(eqNode =>
        Object.keys(eqNode.children).forEach(tag => tags.add(tag))
      )
    } else if (node.level === 1) {
      equipment.add(node.name)
      if (node.lineName) lines.add(node.lineName)
      Object.keys(node.children).forEach(tag => tags.add(tag))
    } else {
      tags.add(node.name)
      if (node.equipmentName) equipment.add(node.equipmentName)
      if (node.lineName) lines.add(node.lineName)
    }

    // Tag frequency from raw records (for the bar chart)
    const tagCounts = {}
    records.forEach(record => {
      if (record.tag) tagCounts[record.tag] = (tagCounts[record.tag] || 0) + 1
    })

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRecords: node.record_count,
      uniqueAssets: equipment.size,
      uniqueTags: tags.size,
      uniqueEquipment: equipment.size,
      uniqueLines: lines.size,
      topTags,
      records
    }
  }

  const nodeAnalysis = selectedUNSNode ? analyzeUNSNode(selectedUNSNode) : null

  // Toggle node expansion
  const toggleNode = (path) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedNodes(newExpanded)
  }

  // Render UNS hierarchy tree
  const renderUNSTree = (nodes, parentPath = '') => {
    if (!nodes) return null

    return Object.entries(nodes).map(([key, node]) => {
      const hasChildren = Object.keys(node.children).length > 0
      const isExpanded = expandedNodes.has(node.fullPath)
      const isSelected = selectedUNSNode?.fullPath === node.fullPath

      return (
        <div key={node.fullPath} style={{ marginLeft: parentPath ? '16px' : '0' }}>
          <div
            onClick={() => {
              setSelectedUNSNode(node)
              if (hasChildren) toggleNode(node.fullPath)
            }}
            style={{
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '4px',
              marginBottom: '2px',
              backgroundColor: isSelected ? 'rgba(28,54,104,0.08)' : 'transparent',
              borderLeft: isSelected ? `3px solid ${COLORS[0]}` : '3px solid transparent',
              transition: 'all 0.2s',
              fontSize: '11px'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {hasChildren && (
              isExpanded ?
                <ChevronDown size={14} style={{ color: COLORS[1], flexShrink: 0 }} /> :
                <ChevronRight size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
            )}
            {!hasChildren && <div style={{ width: '14px', flexShrink: 0 }} />}

            <span style={{
              fontWeight: isSelected ? '600' : '500',
              color: isSelected ? COLORS[0] : '#1f2937',
              flex: 1
            }}>
              {node.name}
            </span>

            <span style={{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: isSelected ? COLORS[0] : '#e5e7eb',
              color: isSelected ? '#fff' : '#6b7280',
              fontWeight: '600'
            }}>
              {(node.record_count || 0).toLocaleString()}
            </span>

            <span style={{
              fontSize: '8px',
              padding: '2px 4px',
              borderRadius: '2px',
              backgroundColor: '#f3f4f6',
              color: '#9ca3af',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              {getISA95LevelName(node.level)}
            </span>
          </div>

          {hasChildren && isExpanded && renderUNSTree(node.children, node.fullPath)}
        </div>
      )
    })
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>OT Data Insights</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            Real-time Process Events Analytics from OT Process Events Table
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchOTData}
            disabled={loading}
            style={{
              padding: '8px 14px',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'white',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 13px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Sparkles size={13} /> AI Analysis
          </button>
          <div style={{
            padding: '8px 14px',
            background: '#E0F2E9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0F5132'
          }}>
            {metrics.totalRecords.toLocaleString()} Records
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading OT data...</p>
        </div>
      )}

      {error && (
        <div className="error-card">
          <Activity size={24} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Key Metrics Overview */}
          <div className="stats-grid" style={{ marginBottom: '8px', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            <div className="stat-card" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Database size={14} style={{ color: COLORS[1] }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>TOTAL RECORDS</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: COLORS[1], marginBottom: '2px' }}>
                {metrics.totalRecords.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Process events</div>
            </div>

            <div className="stat-card" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Activity size={14} style={{ color: COLORS[1] }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>LINES</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' }}>
                {metrics.uniqueLines}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Production lines</div>
            </div>

            <div className="stat-card" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Cpu size={14} style={{ color: COLORS[2] }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>EQUIPMENT</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' }}>
                {metrics.uniqueEquipment}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Equipment types</div>
            </div>

            <div className="stat-card" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Tag size={14} style={{ color: COLORS[3] }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>TAGS</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' }}>
                {metrics.uniqueTags}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Unique tags</div>
            </div>

            <div className="stat-card" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Server size={14} style={{ color: COLORS[2] }} />
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>DATA SOURCE</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' }}>
                OT Process Events
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Recent data</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container" style={{ marginBottom: '8px', padding: '4px', gap: '6px' }}>
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Equipment Analysis
            </button>
            <button
              className={`tab-button ${activeTab === 'tags' ? 'active' : ''}`}
              onClick={() => setActiveTab('tags')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Tags Analysis
            </button>
            <button
              className={`tab-button ${activeTab === 'uns' ? 'active' : ''}`}
              onClick={() => setActiveTab('uns')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Hierarchy View
            </button>
            <button
              className={`tab-button ${activeTab === 'raw-data' ? 'active' : ''}`}
              onClick={() => setActiveTab('raw-data')}
              style={{ padding: '8px 14px', fontSize: '11px', fontWeight: '600' }}
            >
              Raw Data
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>TOP 10 EQUIPMENT BY EVENT COUNT</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Most active equipment in the system</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={metrics.topAssets}
                      margin={{ top: 5, right: 8, left: -5, bottom: 70 }}
                      barCategoryGap="12%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="asset"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        style={{ fontSize: '9px' }}
                      />
                      <YAxis style={{ fontSize: '10px' }} width={35} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="count" fill={COLORS[1]} radius={[3, 3, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>RECORDS BY PRODUCTION LINE</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Event distribution across lines</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={metrics.assetsByLine}
                      margin={{ top: 5, right: 8, left: -5, bottom: 50 }}
                      barCategoryGap="15%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="line"
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        style={{ fontSize: '9px' }}
                      />
                      <YAxis style={{ fontSize: '10px' }} width={35} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="count" fill={COLORS[2]} radius={[3, 3, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>EQUIPMENT DISTRIBUTION</h4>
                <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Top equipment types by event count</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={metrics.equipmentDistribution}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 90, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" style={{ fontSize: '10px' }} />
                    <YAxis dataKey="equipment" type="category" style={{ fontSize: '9px' }} width={85} />
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="count" fill={COLORS[0]} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Equipment Analysis Tab */}
          {activeTab === 'assets' && (
            <div className="tab-content">
              <div className="chart-card" style={{ marginBottom: '8px', padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>EQUIPMENT PERFORMANCE METRICS</h4>
                <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 8px 0' }}>Event count by equipment</p>
                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Equipment Name</th>
                        <th>Event Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topAssets.map((asset, idx) => (
                        <tr key={idx}>
                          <td className="text-center">
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: idx < 3 ? '#EEF2FA' : '#f3f4f6',
                              color: idx < 3 ? COLORS[0] : '#6b7280'
                            }}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600', fontSize: '11px' }}>{asset.asset}</td>
                          <td className="text-right">{asset.count.toLocaleString()}</td>
                          <td className="text-right">
                            {((asset.count / metrics.totalRecords) * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>EQUIPMENT TYPE ANALYSIS</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Distribution of equipment types</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={metrics.equipmentDistribution}
                      margin={{ top: 5, right: 8, left: -5, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="equipment"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        style={{ fontSize: '9px' }}
                      />
                      <YAxis style={{ fontSize: '10px' }} width={35} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="count" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>SUMMARY STATS</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Key equipment metrics</p>
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Total Equipment Types</div>
                      <div style={{ fontSize: '26px', fontWeight: '700', color: COLORS[1] }}>{metrics.uniqueEquipment}</div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Avg Events per Equipment</div>
                      <div style={{ fontSize: '26px', fontWeight: '700', color: COLORS[2] }}>
                        {metrics.uniqueEquipment > 0 ? Math.round(metrics.totalRecords / metrics.uniqueEquipment) : 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Top Equipment</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                        {metrics.equipmentDistribution[0]?.equipment || 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {metrics.equipmentDistribution[0]?.count.toLocaleString() || 0} events
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags Analysis Tab */}
          {activeTab === 'tags' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>TOP TAGS BY FREQUENCY</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Most frequently occurring tags in the system</p>
                  <ResponsiveContainer width="100%" height={590}>
                    <BarChart
                      data={metrics.topTags}
                      margin={{ top: 5, right: 8, left: -5, bottom: 180 }}
                      barCategoryGap="8%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="tag"
                        angle={-45}
                        textAnchor="end"
                        height={180}
                        style={{ fontSize: '8px' }}
                      />
                      <YAxis style={{ fontSize: '10px' }} width={35} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="count" fill={COLORS[2]} radius={[3, 3, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>TAG ANALYSIS TABLE</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 8px 0' }}>Detailed tag statistics</p>
                  <div className="table-container" style={{ maxHeight: '590px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Tag</th>
                          <th>Event Count</th>
                          <th>Percentage of Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.topTags.map((tag, idx) => (
                          <tr key={idx}>
                            <td className="text-center">#{idx + 1}</td>
                            <td style={{ fontWeight: '600', fontFamily: 'monospace', fontSize: '10px' }}>{tag.tag}</td>
                            <td className="text-right">{tag.count.toLocaleString()}</td>
                            <td className="text-right">
                              {((tag.count / metrics.totalRecords) * 100).toFixed(2)}%
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: tag.count > 500 ? '#EEF2FA' : tag.count > 200 ? '#D4E2F4' : '#4A7AB5',
                                color: tag.count > 500 ? COLORS[0] : tag.count > 200 ? COLORS[0] : '#fff'
                              }}>
                                {tag.count > 500 ? 'HIGH' : tag.count > 200 ? 'MEDIUM' : 'LOW'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UNS Analysis Tab */}
          {activeTab === 'uns' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '38% 62%', gap: '8px' }}>
                {/* Left: Hierarchy Tree */}
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>EQUIPMENT HIERARCHY</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 8px 0' }}>
                    Line → Equipment → Tag structure
                  </p>
                  <div style={{ maxHeight: '590px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {unsHierarchy && Object.keys(unsHierarchy).length > 0 ? (
                      renderUNSTree(unsHierarchy)
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>
                        No UNS namespace data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Analysis Panel */}
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>
                    {selectedUNSNode ? `ANALYSIS: ${selectedUNSNode.name}` : 'NODE ANALYSIS'}
                  </h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 8px 0' }}>
                    {selectedUNSNode ? `${getISA95LevelName(selectedUNSNode.level)} Level` : 'Select a node from the hierarchy'}
                  </p>

                  {selectedUNSNode && nodeAnalysis ? (
                    <div>
                      {/* Metrics Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                        <div style={{
                          padding: '8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${COLORS[0]}`
                        }}>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px', fontWeight: '600' }}>RECORDS</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: COLORS[0] }}>
                            {nodeAnalysis.totalRecords.toLocaleString()}
                          </div>
                        </div>
                        <div style={{
                          padding: '8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${COLORS[1]}`
                        }}>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px', fontWeight: '600' }}>ASSETS</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                            {nodeAnalysis.uniqueAssets}
                          </div>
                        </div>
                        <div style={{
                          padding: '8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${COLORS[2]}`
                        }}>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px', fontWeight: '600' }}>TAGS</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                            {nodeAnalysis.uniqueTags}
                          </div>
                        </div>
                        <div style={{
                          padding: '8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${COLORS[3]}`
                        }}>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px', fontWeight: '600' }}>EQUIPMENT</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                            {nodeAnalysis.uniqueEquipment}
                          </div>
                        </div>
                        <div style={{
                          padding: '8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${COLORS[1]}`
                        }}>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px', fontWeight: '600' }}>LINES</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                            {nodeAnalysis.uniqueLines}
                          </div>
                        </div>
                      </div>

                      {/* Path Information */}
                      <div style={{
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        borderLeft: `3px solid ${COLORS[0]}`
                      }}>
                        <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                          UNS NAMESPACE PATH
                        </div>
                        <div style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: '#1f2937',
                          wordBreak: 'break-all'
                        }}>
                          {selectedUNSNode.fullPath}
                        </div>
                      </div>

                      {/* Top Tags Chart */}
                      {nodeAnalysis.topTags.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <h5 style={{ fontSize: '11px', margin: '0 0 6px 0', color: '#1f2937', fontWeight: '600' }}>
                            TOP TAGS AT THIS LEVEL
                          </h5>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                              data={nodeAnalysis.topTags}
                              margin={{ top: 5, right: 8, left: -5, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="tag"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                style={{ fontSize: '8px' }}
                              />
                              <YAxis style={{ fontSize: '10px' }} width={35} />
                              <Tooltip contentStyle={{ fontSize: '10px' }} />
                              <Bar dataKey="count" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Records Table */}
                      <div>
                        <h5 style={{ fontSize: '11px', margin: '0 0 6px 0', color: '#1f2937', fontWeight: '600' }}>
                          RECORDS AT THIS LEVEL ({nodeAnalysis.totalRecords} total)
                        </h5>
                        <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Equipment</th>
                                <th>Line</th>
                                <th>Tag</th>
                                <th>Value</th>
                                <th>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {nodeAnalysis.records.slice(0, 50).map((record, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontSize: '10px', fontWeight: '600' }}>{record.equipment || 'N/A'}</td>
                                  <td style={{ fontSize: '10px' }}>{record.line || 'N/A'}</td>
                                  <td style={{ fontSize: '9px', fontFamily: 'monospace' }}>{record.tag || 'N/A'}</td>
                                  <td style={{ fontSize: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={renderValue(record.val)}>
                                    {renderValue(record.val)}
                                  </td>
                                  <td style={{ fontSize: '9px' }}>
                                    {record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {nodeAnalysis.totalRecords > 50 && (
                          <div style={{ padding: '6px', textAlign: 'center', fontSize: '10px', color: '#6b7280' }}>
                            Showing first 50 of {nodeAnalysis.totalRecords} records
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '590px',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <Layers size={48} style={{ color: '#d1d5db' }} />
                      <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                        Select a node from the hierarchy tree<br />to view detailed analysis
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Distribution Tab */}
          {activeTab === 'distribution' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>STREAM TYPE DISTRIBUTION</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Events by stream type</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={metrics.streamTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {metrics.streamTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '10px' }}>
                  <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>ENVIRONMENT DISTRIBUTION</h4>
                  <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Events by environment</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={metrics.environmentDistribution}
                      margin={{ top: 5, right: 8, left: -5, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        style={{ fontSize: '9px' }}
                      />
                      <YAxis style={{ fontSize: '10px' }} width={35} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="value" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>LINE DISTRIBUTION ANALYSIS</h4>
                <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 6px 0' }}>Event count across production lines</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={metrics.assetsByLine}
                    margin={{ top: 5, right: 8, left: -5, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="line"
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      style={{ fontSize: '9px' }}
                    />
                    <YAxis style={{ fontSize: '10px' }} width={35} />
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="count" fill={COLORS[0]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Raw Data Tab */}
          {activeTab === 'raw-data' && (
            <div className="tab-content">
              <div className="chart-card" style={{ padding: '10px' }}>
                <h4 style={{ fontSize: '12px', margin: '0 0 2px 0' }}>RAW OT DATA</h4>
                <p className="chart-subtitle" style={{ fontSize: '10px', margin: '0 0 8px 0' }}>All {metrics.totalRecords.toLocaleString()} records from OT Process Events table</p>
                <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Equipment</th>
                        <th>Line</th>
                        <th>Tag</th>
                        <th>Value</th>
                        <th>Edge Arrival Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otData.slice(0, 100).map((record, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '10px' }}>
                            {record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A'}
                          </td>
                          <td style={{ fontWeight: '600', fontSize: '11px' }}>{record.equipment || 'N/A'}</td>
                          <td className="text-center">{record.line || 'N/A'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '10px' }}>{record.tag || 'N/A'}</td>
                          <td style={{ fontSize: '11px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={renderValue(record.val)}>
                            {renderValue(record.val)}
                          </td>
                          <td style={{ fontSize: '10px' }}>
                            {record.edge_arrival_timestamp || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {otData.length > 100 && (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                    Showing first 100 of {metrics.totalRecords.toLocaleString()} records
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '660px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8ECF4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#EEF2FA', borderRadius: '8px', padding: '8px' }}><Bot size={18} color="#1C3668" /></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Asset AI Agent</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Tier 1 Agent · OT tags, process events, equipment status</div>
                </div>
                <span style={{ background: '#EEF2FA', color: '#1C3668', fontSize: '10px', fontWeight: '700', borderRadius: '4px', padding: '2px 7px', marginLeft: '4px' }}>TIER 1</span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Which tags are firing most frequently?', 'Are there any anomalous OT events today?', 'Which reactors have the most downtime events?', 'Summarise process health across all lines'].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); callAgent(q) }} style={{ background: '#F0F4FA', border: '1px solid #E8ECF4', borderRadius: '20px', padding: '4px 11px', fontSize: '11px', color: '#1C3668', cursor: 'pointer', fontWeight: '500' }}>{q}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '120px' }}>
              {agentLoading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '12px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing OT data...</div>}
              {agentError && <div style={{ color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>{agentError}</div>}
              {agentResponse && <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#1F2937' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResponse}</ReactMarkdown></div>}
              {!agentLoading && !agentResponse && !agentError && <div style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>Select a quick action above or type a question below.</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECF4', display: 'flex', gap: '8px' }}>
              <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} placeholder="Ask about OT tags, process events, anomalies..." style={{ flex: 1, border: '1px solid #E8ECF4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', outline: 'none' }} />
              <button onClick={() => { if (agentInput.trim()) { callAgent(agentInput); setAgentInput('') } }} disabled={agentLoading || !agentInput.trim()} style={{ background: '#0A1628', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', opacity: (agentLoading || !agentInput.trim()) ? 0.5 : 1 }}><Send size={13} /> Send</button>
            </div>
          </div>
        </div>
      )}

      {showPageInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(2px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowPageInfo(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid #E8ECF4' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>About this section</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>OT Data Insights</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Analyses OT process event data from plant sensors and SCADA systems. Shows event frequency by tag, asset and process unit, with the Unified Namespace (UNS) hierarchy showing how tags map to equipment.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Tabs</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Overview</strong> — Event summary and frequency distribution</li>
                  <li style={{ marginBottom: '4px' }}><strong>Assets</strong> — Events grouped by asset and process unit</li>
                  <li style={{ marginBottom: '4px' }}><strong>Tags</strong> — Per-tag event counts and activity</li>
                  <li style={{ marginBottom: '4px' }}><strong>UNS</strong> — Unified Namespace hierarchy mapping tags to equipment</li>
                  <li style={{ marginBottom: '4px' }}><strong>Raw Data</strong> — Full event log table</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>ot_process_events</strong> — OT sensor and SCADA event records with tag, asset and timestamp</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OTDataInsights
