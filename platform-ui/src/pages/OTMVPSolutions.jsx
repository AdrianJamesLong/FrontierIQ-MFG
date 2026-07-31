import { useState, useEffect } from 'react'
import { RefreshCw, Droplet, TrendingUp, Package, Gauge, Bot, BarChart3, Clock, AlertCircle, Activity, Zap, TrendingDown, Layers, Calendar, AlertTriangle, Lightbulb, Users, Tag, Beaker, CheckCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const COLORS = ['#0A1628', '#152B55', '#1C3668', '#FF4D4F', '#FFE5E5', '#6B6B6B', '#9B9B9B', '#C0C0C0']

function OTMVPSolutions() {
  const [activeTab, setActiveTab] = useState('connectedworker')
  const [processData, setProcessData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState(0)
  const [selectedPersona, setSelectedPersona] = useState(0)

  const timeRangeOptions = [
    { label: '24 Hours', value: 1 },
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: 'All Data', value: 0 }
  ]

  useEffect(() => {
    if (activeTab === 'changeover' || activeTab === 'foaming' || activeTab === 'vcurve' || activeTab === 'speedoflight' || activeTab === 'lineefficiency' || activeTab === 'connectedworker') {
      fetchProcessData()
    }
  }, [activeTab, timeRange])

  const fetchProcessData = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `${API_URL}/api/ot-process-events?days=${timeRange}`

      console.log('Fetching data from:', url, `(${timeRange} days)`)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch process data')
      }
      const result = await response.json()
      console.log('Received data:', result.data?.length || 0, 'records for', timeRange, 'days')
      setProcessData(result.data || [])
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const useCases = {
    changeover: {
      title: 'Changeover Optimization',
      description: 'Optimize production line changeovers to minimize downtime and maximize efficiency',
      icon: RefreshCw,
      color: '#0A1628',
      details: 'Minimize changeover time between product runs to increase overall equipment effectiveness (OEE). This solution analyzes historical changeover data to identify bottlenecks and optimization opportunities.'
    },
    foaming: {
      title: 'Foaming Minimization',
      description: 'Reduce foaming issues during production to improve product quality and reduce waste',
      icon: Droplet,
      color: '#3B82F6',
      details: 'Detect and prevent foaming issues in real-time using advanced sensors and predictive algorithms. Reduce product waste and improve quality by maintaining optimal foam levels throughout production.'
    },
    vcurve: {
      title: 'V-curve Optimization',
      description: 'Optimize V-curve parameters for improved production performance',
      icon: TrendingUp,
      color: '#10B981',
      details: 'Optimize production speed curves to balance throughput and quality. Analyze V-curve patterns to identify the sweet spot that maximizes efficiency while maintaining product specifications.'
    },
    speedoflight: {
      title: 'Speed of Light Products',
      description: 'Accelerate production cycles for priority products with optimized workflows',
      icon: Package,
      color: '#F59E0B',
      details: 'Fast-track priority products through the production line with optimized scheduling and resource allocation. Reduce lead times for high-demand products without compromising quality.'
    },
    lineefficiency: {
      title: 'Line Efficiency Agent',
      description: 'AI-powered agent to monitor and optimize overall line efficiency in real-time',
      icon: Gauge,
      color: '#8B4513',
      details: 'Continuously monitor line performance metrics and provide real-time recommendations to operators. Uses machine learning to identify efficiency opportunities and predict potential issues before they occur.'
    },
    connectedworker: {
      title: 'Connected Worker/AI Operator',
      description: 'AI-assisted operator guidance system for improved decision-making and productivity',
      icon: Bot,
      color: '#9333EA',
      details: 'Empower operators with AI-driven insights and recommendations. Provide contextual guidance, predictive alerts, and automated workflows to enhance operator effectiveness and reduce errors.'
    }
  }

  const currentUseCase = useCases[activeTab]
  const Icon = currentUseCase.icon

  // Calculate Changeover Analytics with Optimization Recommendations
  const calculateChangeoverAnalytics = () => {
    if (processData.length === 0) {
      return {
        equipmentActivity: [],
        linePerformance: [],
        eventsByEquipment: [],
        tagDistribution: [],
        timeSeriesData: [],
        topEquipment: [],
        changeoverRecommendations: [],
        summary: { totalEvents: 0, uniqueEquipment: 0, uniqueLines: 0, avgEventsPerEquipment: 0 }
      }
    }

    // Group by equipment
    const equipmentGroups = {}
    const lineGroups = {}
    const tagCounts = {}

    processData.forEach(event => {
      const eq = event.equipment || 'Unknown'
      const line = event.line || 'Unknown'
      const tag = event.tag || 'Unknown'

      if (!equipmentGroups[eq]) {
        equipmentGroups[eq] = { equipment: eq, line, events: 0, tags: new Set(), values: [], timestamps: [] }
      }
      equipmentGroups[eq].events++
      equipmentGroups[eq].tags.add(tag)
      if (event.val !== null && event.val !== undefined) {
        equipmentGroups[eq].values.push(parseFloat(event.val) || 0)
      }
      if (event.timestamp) {
        equipmentGroups[eq].timestamps.push(new Date(event.timestamp))
      }

      lineGroups[line] = (lineGroups[line] || 0) + 1
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })

    // Equipment Activity
    const equipmentActivity = Object.values(equipmentGroups)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        tagCount: g.tags.size,
        avgValue: g.values.length > 0 ? g.values.reduce((a, b) => a + b, 0) / g.values.length : 0
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 15)

    // Line Performance
    const linePerformance = Object.entries(lineGroups)
      .map(([line, count]) => ({ line, events: count }))
      .sort((a, b) => b.events - a.events)

    // Top 10 Tags
    const tagDistribution = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // CHANGEOVER OPTIMIZATION RECOMMENDATIONS
    const changeoverRecommendations = []

    Object.values(equipmentGroups).forEach(eq => {
      let optimizationScore = 0
      let issues = []
      let recommendations = []

      // Issue 1: High event frequency (indicates frequent state changes)
      if (eq.events > 1000) {
        optimizationScore += 40
        issues.push('Excessive state changes detected')
        recommendations.push('Standardize changeover procedures to reduce unnecessary equipment adjustments')
      } else if (eq.events > 500) {
        optimizationScore += 20
        issues.push('Elevated changeover activity')
        recommendations.push('Review changeover sequence for optimization opportunities')
      }

      // Issue 2: High tag diversity (many different parameters changing)
      if (eq.tags.size > 15) {
        optimizationScore += 30
        issues.push('Complex changeover process')
        recommendations.push('Simplify changeover by pre-configuring common parameter sets')
      } else if (eq.tags.size > 10) {
        optimizationScore += 15
        issues.push('Multiple parameters involved')
      }

      // Issue 3: Value variability (inconsistent settings)
      if (eq.values.length > 0) {
        const avg = eq.values.reduce((a, b) => a + b, 0) / eq.values.length
        const variance = eq.values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / eq.values.length
        const stdDev = Math.sqrt(variance)
        const cv = avg !== 0 ? (stdDev / Math.abs(avg)) : 0

        if (cv > 0.3) {
          optimizationScore += 30
          issues.push('High parameter variability')
          recommendations.push('Create changeover templates with predefined optimal settings')
        } else if (cv > 0.15) {
          optimizationScore += 15
          issues.push('Moderate parameter inconsistency')
        }
      }

      // Determine priority level
      let priority = 'Low'
      let priorityColor = '#10B981'
      if (optimizationScore >= 60) {
        priority = 'High'
        priorityColor = '#EF4444'
        if (recommendations.length === 0) {
          recommendations.push('Immediate changeover optimization required - conduct time study')
        }
      } else if (optimizationScore >= 30) {
        priority = 'Medium'
        priorityColor = '#F59E0B'
        if (recommendations.length === 0) {
          recommendations.push('Optimize changeover procedures to improve efficiency')
        }
      } else {
        if (recommendations.length === 0) {
          recommendations.push('Changeover process is efficient - maintain current procedures')
        }
      }

      // Add equipment-specific recommendations
      const eqLower = eq.equipment.toLowerCase()
      if (eqLower.includes('filler')) {
        recommendations.push('Filler changeover: Pre-stage product containers and verify valve settings')
      } else if (eqLower.includes('blender')) {
        recommendations.push('Blender changeover: Implement CIP (Clean-in-Place) automation')
      } else if (eqLower.includes('conveyor')) {
        recommendations.push('Conveyor changeover: Use quick-change guide rails and adjustable speeds')
      } else if (eqLower.includes('labeler') || eqLower.includes('label')) {
        recommendations.push('Labeler changeover: Pre-load label rolls and verify alignment sensors')
      }

      // Calculate estimated time savings
      let estimatedSavings = 0
      if (optimizationScore >= 60) {
        estimatedSavings = Math.round(eq.events * 0.15) // 15% reduction potential
      } else if (optimizationScore >= 30) {
        estimatedSavings = Math.round(eq.events * 0.08) // 8% reduction potential
      }

      if (eq.events > 100) {
        changeoverRecommendations.push({
          equipment: eq.equipment,
          priority,
          priorityColor,
          optimizationScore,
          events: eq.events,
          tagCount: eq.tags.size,
          issues,
          recommendations: recommendations.slice(0, 3),
          estimatedSavings
        })
      }
    })

    // Sort by optimization score (highest priority first)
    changeoverRecommendations.sort((a, b) => b.optimizationScore - a.optimizationScore)

    // Summary stats
    const summary = {
      totalEvents: processData.length,
      uniqueEquipment: Object.keys(equipmentGroups).length,
      uniqueLines: Object.keys(lineGroups).length,
      avgEventsPerEquipment: Math.round(processData.length / Object.keys(equipmentGroups).length),
      topEquipment: equipmentActivity[0]?.equipment || 'N/A',
      topLine: linePerformance[0]?.line || 'N/A',
      highPriorityCount: changeoverRecommendations.filter(r => r.priority === 'High').length,
      totalPotentialSavings: changeoverRecommendations.reduce((sum, r) => sum + r.estimatedSavings, 0)
    }

    return {
      equipmentActivity,
      linePerformance,
      tagDistribution,
      topEquipment: equipmentActivity.slice(0, 10),
      changeoverRecommendations: changeoverRecommendations.slice(0, 10),
      summary
    }
  }

  // Calculate Foaming Analytics
  const calculateFoamingAnalytics = () => {
    if (processData.length === 0) {
      return {
        pressureEvents: [],
        levelEvents: [],
        flowEvents: [],
        fillerMetrics: [],
        foamingIndicators: [],
        summary: { totalEvents: 0, pressureAlerts: 0, levelAlerts: 0, fillerEquipment: 0 }
      }
    }

    // Filter foaming-related tags
    const pressureTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('pressure') || e.tag.toLowerCase().includes('filler'))
    )
    const levelTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('level') || e.tag.toLowerCase().includes('tank'))
    )
    const flowTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('flow') || e.tag.toLowerCase().includes('speed'))
    )

    // Group pressure data by equipment
    const pressureByEquipment = {}
    pressureTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!pressureByEquipment[eq]) {
        pressureByEquipment[eq] = { equipment: eq, events: 0, values: [] }
      }
      pressureByEquipment[eq].events++
      if (event.val !== null && typeof event.val === 'number') {
        pressureByEquipment[eq].values.push(event.val)
      }
    })

    // Group level data by tag
    const levelByTag = {}
    levelTags.forEach(event => {
      const tag = event.tag || 'Unknown'
      if (!levelByTag[tag]) {
        levelByTag[tag] = { tag, count: 0, equipment: event.equipment }
      }
      levelByTag[tag].count++
    })

    // Filler equipment analysis
    const fillerEquipment = {}
    processData.filter(e => e.equipment && e.equipment.toLowerCase().includes('filler')).forEach(event => {
      const eq = event.equipment
      if (!fillerEquipment[eq]) {
        fillerEquipment[eq] = { equipment: eq, events: 0, tags: new Set() }
      }
      fillerEquipment[eq].events++
      fillerEquipment[eq].tags.add(event.tag)
    })

    // Format data for charts
    const pressureEvents = Object.values(pressureByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        avgPressure: g.values.length > 0 ? (g.values.reduce((a, b) => a + b, 0) / g.values.length).toFixed(2) : 0
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    const levelEvents = Object.values(levelByTag)
      .map(g => ({ tag: g.tag.substring(0, 25), count: g.count, equipment: g.equipment }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const fillerMetrics = Object.values(fillerEquipment)
      .map(f => ({ equipment: f.equipment, events: f.events, uniqueTags: f.tags.size }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 8)

    // Summary stats
    const summary = {
      totalEvents: processData.length,
      pressureAlerts: pressureTags.length,
      levelAlerts: levelTags.length,
      fillerEquipment: Object.keys(fillerEquipment).length,
      flowEvents: flowTags.length,
      topFiller: fillerMetrics[0]?.equipment || 'N/A'
    }

    // FOAMING RISK ANALYSIS & RECOMMENDATIONS
    const riskAnalysis = []

    // Analyze each equipment for foaming risk
    Object.values(pressureByEquipment).forEach(eq => {
      let riskScore = 0
      let riskFactors = []
      let recommendations = []

      // Risk Factor 1: High event frequency (indicates instability)
      if (eq.events > 500) {
        riskScore += 40
        riskFactors.push('High event frequency detected')
        recommendations.push('Monitor pressure stability - frequent events indicate process instability')
      } else if (eq.events > 200) {
        riskScore += 20
        riskFactors.push('Elevated event frequency')
      }

      // Risk Factor 2: Pressure variance (high variance = instability = foaming risk)
      if (eq.values.length > 0) {
        const avg = eq.values.reduce((a, b) => a + b, 0) / eq.values.length
        const variance = eq.values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / eq.values.length
        const stdDev = Math.sqrt(variance)

        if (stdDev > avg * 0.2) { // High variance (>20% of average)
          riskScore += 40
          riskFactors.push('High pressure variability detected')
          recommendations.push('Reduce process variability - adjust control parameters to stabilize pressure')
        } else if (stdDev > avg * 0.1) {
          riskScore += 20
          riskFactors.push('Moderate pressure variability')
        }
      }

      // Risk Factor 3: Filler-specific risks
      if (eq.equipment.toLowerCase().includes('filler')) {
        const fillerData = fillerEquipment[eq.equipment]
        if (fillerData && fillerData.events > 300) {
          riskScore += 20
          riskFactors.push('High filler activity')
          recommendations.push('Reduce filler speed by 5-10% to minimize foam generation')
        }
      }

      // Determine risk level
      let riskLevel = 'Low'
      let riskColor = '#10B981' // Green
      if (riskScore >= 60) {
        riskLevel = 'High'
        riskColor = '#EF4444' // Red
        if (recommendations.length === 0) {
          recommendations.push('Immediate attention required - investigate pressure control settings')
        }
      } else if (riskScore >= 30) {
        riskLevel = 'Medium'
        riskColor = '#F59E0B' // Orange
        if (recommendations.length === 0) {
          recommendations.push('Monitor closely - optimize process parameters to prevent escalation')
        }
      } else {
        if (recommendations.length === 0) {
          recommendations.push('Continue current operating parameters')
        }
      }

      // Add general foaming minimization recommendations based on equipment type
      if (eq.equipment.toLowerCase().includes('blender')) {
        recommendations.push('Blender optimization: Ensure proper mixing speed and avoid overfilling')
      } else if (eq.equipment.toLowerCase().includes('tank')) {
        recommendations.push('Tank management: Maintain optimal liquid levels to reduce agitation')
      } else if (eq.equipment.toLowerCase().includes('filler')) {
        recommendations.push('Filler control: Monitor fill valve opening speed and back pressure')
      }

      // Only add to risk analysis if there's meaningful data
      if (eq.events > 50) {
        riskAnalysis.push({
          equipment: eq.equipment,
          riskLevel,
          riskScore,
          riskColor,
          events: eq.events,
          riskFactors,
          recommendations: recommendations.slice(0, 3) // Limit to top 3 recommendations
        })
      }
    })

    // Sort by risk score (highest first)
    riskAnalysis.sort((a, b) => b.riskScore - a.riskScore)

    return {
      pressureEvents,
      levelEvents,
      flowEvents: flowTags.slice(0, 100),
      fillerMetrics,
      summary,
      riskAnalysis: riskAnalysis.slice(0, 10) // Top 10 risk items
    }
  }

  // Calculate V-curve Analytics
  const calculateVCurveAnalytics = () => {
    if (processData.length === 0) {
      return {
        speedEvents: [],
        flowEvents: [],
        pressureEvents: [],
        performanceMetrics: [],
        optimizationRecommendations: [],
        summary: { totalEvents: 0, speedTags: 0, flowTags: 0, pressureTags: 0 }
      }
    }

    // Filter V-curve related tags
    const speedTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('speed') || e.tag.toLowerCase().includes('rate') ||
                e.tag.toLowerCase().includes('rpm') || e.tag.toLowerCase().includes('bpm') ||
                e.tag.toLowerCase().includes('cpm') || e.tag.toLowerCase().includes('ppm'))
    )
    const flowTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('flow') || e.tag.toLowerCase().includes('throughput'))
    )
    const pressureTags = processData.filter(e =>
      e.tag && e.tag.toLowerCase().includes('pressure')
    )
    const setpointTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('setpoint') || e.tag.toLowerCase().includes('_sp'))
    )

    // Group speed data by equipment
    const speedByEquipment = {}
    speedTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!speedByEquipment[eq]) {
        speedByEquipment[eq] = { equipment: eq, events: 0, values: [], tags: new Set() }
      }
      speedByEquipment[eq].events++
      speedByEquipment[eq].tags.add(event.tag)
      if (event.val !== null && typeof event.val === 'number') {
        speedByEquipment[eq].values.push(event.val)
      }
    })

    // Group flow data by equipment
    const flowByEquipment = {}
    flowTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!flowByEquipment[eq]) {
        flowByEquipment[eq] = { equipment: eq, events: 0, values: [] }
      }
      flowByEquipment[eq].events++
      if (event.val !== null && typeof event.val === 'number') {
        flowByEquipment[eq].values.push(event.val)
      }
    })

    // Group pressure data by equipment
    const pressureByEquipment = {}
    pressureTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!pressureByEquipment[eq]) {
        pressureByEquipment[eq] = { equipment: eq, events: 0, values: [] }
      }
      pressureByEquipment[eq].events++
      if (event.val !== null && typeof event.val === 'number') {
        pressureByEquipment[eq].values.push(event.val)
      }
    })

    // Format speed events for charts
    const speedEvents = Object.values(speedByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        tagCount: g.tags.size,
        avgSpeed: g.values.length > 0 ? (g.values.reduce((a, b) => a + b, 0) / g.values.length).toFixed(2) : 0
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // Format flow events for charts
    const flowEvents = Object.values(flowByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        avgFlow: g.values.length > 0 ? (g.values.reduce((a, b) => a + b, 0) / g.values.length).toFixed(2) : 0
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // Format pressure events for charts
    const pressureEvents = Object.values(pressureByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        avgPressure: g.values.length > 0 ? (g.values.reduce((a, b) => a + b, 0) / g.values.length).toFixed(2) : 0
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // V-CURVE OPTIMIZATION RECOMMENDATIONS
    const optimizationRecommendations = []

    Object.values(speedByEquipment).forEach(eq => {
      let optimizationScore = 0
      let issues = []
      let recommendations = []

      // Issue 1: High speed variability (indicates unstable operation)
      if (eq.values.length > 0) {
        const avg = eq.values.reduce((a, b) => a + b, 0) / eq.values.length
        const variance = eq.values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / eq.values.length
        const stdDev = Math.sqrt(variance)
        const cv = avg !== 0 ? (stdDev / Math.abs(avg)) : 0

        if (cv > 0.25) {
          optimizationScore += 40
          issues.push('High speed variability detected')
          recommendations.push('Stabilize speed settings - implement closed-loop speed control')
        } else if (cv > 0.15) {
          optimizationScore += 20
          issues.push('Moderate speed inconsistency')
          recommendations.push('Review speed control parameters for optimization')
        }
      }

      // Issue 2: High event frequency (indicates frequent adjustments)
      if (eq.events > 1000) {
        optimizationScore += 30
        issues.push('Excessive speed adjustments')
        recommendations.push('Optimize V-curve profile to reduce frequent speed changes')
      } else if (eq.events > 500) {
        optimizationScore += 15
        issues.push('Frequent speed changes')
      }

      // Issue 3: Multiple speed parameters (complex control)
      if (eq.tags.size > 5) {
        optimizationScore += 30
        issues.push('Complex speed control system')
        recommendations.push('Consolidate speed control - create master V-curve profile')
      } else if (eq.tags.size > 3) {
        optimizationScore += 15
        issues.push('Multiple speed parameters')
      }

      // Determine priority level
      let priority = 'Low'
      let priorityColor = '#10B981'
      if (optimizationScore >= 60) {
        priority = 'High'
        priorityColor = '#EF4444'
        if (recommendations.length === 0) {
          recommendations.push('Critical V-curve optimization required - conduct speed analysis')
        }
      } else if (optimizationScore >= 30) {
        priority = 'Medium'
        priorityColor = '#F59E0B'
        if (recommendations.length === 0) {
          recommendations.push('V-curve tuning recommended to improve throughput')
        }
      } else {
        if (recommendations.length === 0) {
          recommendations.push('V-curve operating efficiently - maintain current profile')
        }
      }

      // Add equipment-specific recommendations
      const eqLower = eq.equipment.toLowerCase()
      if (eqLower.includes('filler')) {
        recommendations.push('Filler V-curve: Optimize fill speed vs quality trade-off')
      } else if (eqLower.includes('labeler') || eqLower.includes('labeller')) {
        recommendations.push('Labeler V-curve: Balance label application speed with accuracy')
      } else if (eqLower.includes('packer') || eqLower.includes('palletizer')) {
        recommendations.push('Packer V-curve: Maximize throughput while ensuring safe handling')
      } else if (eqLower.includes('conveyor') || eqLower.includes('airveyor')) {
        recommendations.push('Conveyor V-curve: Synchronize speeds across line sections')
      }

      // Calculate estimated throughput improvement
      let estimatedImprovement = 0
      if (optimizationScore >= 60) {
        estimatedImprovement = 12 // 12% improvement potential
      } else if (optimizationScore >= 30) {
        estimatedImprovement = 6 // 6% improvement potential
      }

      if (eq.events > 100) {
        optimizationRecommendations.push({
          equipment: eq.equipment,
          priority,
          priorityColor,
          optimizationScore,
          events: eq.events,
          tagCount: eq.tags.size,
          issues,
          recommendations: recommendations.slice(0, 3),
          estimatedImprovement
        })
      }
    })

    // Sort by optimization score (highest priority first)
    optimizationRecommendations.sort((a, b) => b.optimizationScore - a.optimizationScore)

    // Summary stats
    const summary = {
      totalEvents: processData.length,
      speedTags: speedTags.length,
      flowTags: flowTags.length,
      pressureTags: pressureTags.length,
      setpointTags: setpointTags.length,
      uniqueEquipment: Object.keys(speedByEquipment).length,
      topEquipment: speedEvents[0]?.equipment || 'N/A',
      highPriorityCount: optimizationRecommendations.filter(r => r.priority === 'High').length,
      totalImprovement: optimizationRecommendations.reduce((sum, r) => sum + r.estimatedImprovement, 0)
    }

    return {
      speedEvents,
      flowEvents,
      pressureEvents,
      optimizationRecommendations: optimizationRecommendations.slice(0, 10),
      summary
    }
  }

  // Calculate Speed of Light Analytics
  const calculateSpeedOfLightAnalytics = () => {
    if (processData.length === 0) {
      return {
        speedMetrics: [],
        throughputMetrics: [],
        bottleneckAnalysis: [],
        optimizationRecommendations: [],
        summary: { totalEvents: 0, speedTags: 0, throughputTags: 0, bottleneckTags: 0 }
      }
    }

    // Filter Speed of Light related tags
    const speedTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('speed') || e.tag.toLowerCase().includes('rate') ||
                e.tag.toLowerCase().includes('rpm') || e.tag.toLowerCase().includes('bpm') ||
                e.tag.toLowerCase().includes('cpm') || e.tag.toLowerCase().includes('ppm') ||
                e.tag.toLowerCase().includes('actual'))
    )
    const throughputTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('output') || e.tag.toLowerCase().includes('production') ||
                e.tag.toLowerCase().includes('count') || e.tag.toLowerCase().includes('throughput'))
    )
    const bottleneckTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('jam') || e.tag.toLowerCase().includes('stop') ||
                e.tag.toLowerCase().includes('fault') || e.tag.toLowerCase().includes('permit'))
    )
    const efficiencyTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('running') || e.tag.toLowerCase().includes('efficiency'))
    )

    // Group speed data by equipment
    const speedByEquipment = {}
    speedTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!speedByEquipment[eq]) {
        speedByEquipment[eq] = { equipment: eq, events: 0, values: [], tags: new Set() }
      }
      speedByEquipment[eq].events++
      speedByEquipment[eq].tags.add(event.tag)
      if (event.val !== null && typeof event.val === 'number') {
        speedByEquipment[eq].values.push(event.val)
      }
    })

    // Group throughput data by equipment
    const throughputByEquipment = {}
    throughputTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!throughputByEquipment[eq]) {
        throughputByEquipment[eq] = { equipment: eq, events: 0, values: [] }
      }
      throughputByEquipment[eq].events++
      if (event.val !== null && typeof event.val === 'number') {
        throughputByEquipment[eq].values.push(event.val)
      }
    })

    // Group bottleneck data by equipment
    const bottleneckByEquipment = {}
    bottleneckTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!bottleneckByEquipment[eq]) {
        bottleneckByEquipment[eq] = { equipment: eq, events: 0, tags: new Set() }
      }
      bottleneckByEquipment[eq].events++
      bottleneckByEquipment[eq].tags.add(event.tag)
    })

    // Format speed metrics for charts
    const speedMetrics = Object.values(speedByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        tagCount: g.tags.size,
        avgSpeed: g.values.length > 0 ? (g.values.reduce((a, b) => a + b, 0) / g.values.length).toFixed(2) : 0
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // Format throughput metrics for charts
    const throughputMetrics = Object.values(throughputByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        avgThroughput: g.values.length > 0 ? (g.values.reduce((a, b) => a + b, 0) / g.values.length).toFixed(2) : 0
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // Format bottleneck analysis for charts
    const bottleneckAnalysis = Object.values(bottleneckByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        issueCount: g.tags.size
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // SPEED OF LIGHT OPTIMIZATION RECOMMENDATIONS
    const optimizationRecommendations = []

    Object.values(speedByEquipment).forEach(eq => {
      let optimizationScore = 0
      let issues = []
      let recommendations = []

      // Get bottleneck info for this equipment
      const bottleneckInfo = bottleneckByEquipment[eq.equipment]
      const bottleneckEvents = bottleneckInfo?.events || 0

      // Issue 1: High bottleneck events (jams, stops, faults)
      if (bottleneckEvents > 500) {
        optimizationScore += 40
        issues.push('High bottleneck frequency detected')
        recommendations.push('Eliminate bottlenecks - investigate root causes of jams and stops')
      } else if (bottleneckEvents > 200) {
        optimizationScore += 20
        issues.push('Elevated bottleneck activity')
        recommendations.push('Reduce downtime events to increase throughput')
      }

      // Issue 2: Speed consistency (priority products need consistent speed)
      if (eq.values.length > 0) {
        const avg = eq.values.reduce((a, b) => a + b, 0) / eq.values.length
        const variance = eq.values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / eq.values.length
        const stdDev = Math.sqrt(variance)
        const cv = avg !== 0 ? (stdDev / Math.abs(avg)) : 0

        if (cv > 0.2) {
          optimizationScore += 30
          issues.push('Inconsistent speed detected')
          recommendations.push('Stabilize speed for priority products - implement fast-track profile')
        } else if (cv > 0.1) {
          optimizationScore += 15
          issues.push('Moderate speed variation')
        }
      }

      // Issue 3: Complex speed control (multiple parameters)
      if (eq.tags.size > 4) {
        optimizationScore += 30
        issues.push('Complex speed configuration')
        recommendations.push('Simplify speed control - create dedicated fast-track mode')
      } else if (eq.tags.size > 2) {
        optimizationScore += 15
        issues.push('Multiple speed controls')
      }

      // Determine priority level
      let priority = 'Low'
      let priorityColor = '#10B981'
      if (optimizationScore >= 60) {
        priority = 'High'
        priorityColor = '#EF4444'
        if (recommendations.length === 0) {
          recommendations.push('Critical speed optimization required - implement fast-track workflow')
        }
      } else if (optimizationScore >= 30) {
        priority = 'Medium'
        priorityColor = '#F59E0B'
        if (recommendations.length === 0) {
          recommendations.push('Speed optimization recommended for priority products')
        }
      } else {
        if (recommendations.length === 0) {
          recommendations.push('Speed profile optimized - maintain for priority products')
        }
      }

      // Add equipment-specific recommendations
      const eqLower = eq.equipment.toLowerCase()
      if (eqLower.includes('filler')) {
        recommendations.push('Filler fast-track: Pre-configure settings for priority products')
      } else if (eqLower.includes('labeler') || eqLower.includes('labeller')) {
        recommendations.push('Labeler fast-track: Pre-load labels for high-demand products')
      } else if (eqLower.includes('packer') || eqLower.includes('palletizer')) {
        recommendations.push('Packer fast-track: Optimize case handling for priority orders')
      } else if (eqLower.includes('conveyor') || eqLower.includes('airveyor')) {
        recommendations.push('Conveyor fast-track: Increase buffer capacity for priority flow')
      }

      // Calculate estimated cycle time reduction
      let estimatedReduction = 0
      if (optimizationScore >= 60) {
        estimatedReduction = 25 // 25% cycle time reduction potential
      } else if (optimizationScore >= 30) {
        estimatedReduction = 15 // 15% cycle time reduction potential
      }

      if (eq.events > 100) {
        optimizationRecommendations.push({
          equipment: eq.equipment,
          priority,
          priorityColor,
          optimizationScore,
          events: eq.events,
          bottleneckEvents,
          tagCount: eq.tags.size,
          issues,
          recommendations: recommendations.slice(0, 3),
          estimatedReduction
        })
      }
    })

    // Sort by optimization score (highest priority first)
    optimizationRecommendations.sort((a, b) => b.optimizationScore - a.optimizationScore)

    // Summary stats
    const summary = {
      totalEvents: processData.length,
      speedTags: speedTags.length,
      throughputTags: throughputTags.length,
      bottleneckTags: bottleneckTags.length,
      efficiencyTags: efficiencyTags.length,
      uniqueEquipment: Object.keys(speedByEquipment).length,
      topEquipment: speedMetrics[0]?.equipment || 'N/A',
      highPriorityCount: optimizationRecommendations.filter(r => r.priority === 'High').length,
      totalReduction: optimizationRecommendations.reduce((sum, r) => sum + r.estimatedReduction, 0)
    }

    return {
      speedMetrics,
      throughputMetrics,
      bottleneckAnalysis,
      optimizationRecommendations: optimizationRecommendations.slice(0, 10),
      summary
    }
  }

  // Calculate Line Efficiency Analytics
  const calculateLineEfficiencyAnalytics = () => {
    if (processData.length === 0) {
      return {
        efficiencyMetrics: [],
        downtimeAnalysis: [],
        productionOutput: [],
        recommendations: [],
        summary: { totalEvents: 0, runningTags: 0, faultTags: 0, productionTags: 0 }
      }
    }

    // Filter Line Efficiency related tags
    const runningTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('running') || e.tag.toLowerCase().includes('actual'))
    )
    const faultTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('fault') || e.tag.toLowerCase().includes('alarm') ||
                e.tag.toLowerCase().includes('error') || e.tag.toLowerCase().includes('jam') ||
                e.tag.toLowerCase().includes('stop'))
    )
    const productionTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('production') || e.tag.toLowerCase().includes('output') ||
                e.tag.toLowerCase().includes('count') || e.tag.toLowerCase().includes('rate'))
    )
    const permitTags = processData.filter(e =>
      e.tag && e.tag.toLowerCase().includes('permit')
    )

    // Group running/efficiency data by equipment
    const efficiencyByEquipment = {}
    runningTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!efficiencyByEquipment[eq]) {
        efficiencyByEquipment[eq] = { equipment: eq, events: 0, tags: new Set() }
      }
      efficiencyByEquipment[eq].events++
      efficiencyByEquipment[eq].tags.add(event.tag)
    })

    // Group fault/downtime data by equipment
    const downtimeByEquipment = {}
    faultTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!downtimeByEquipment[eq]) {
        downtimeByEquipment[eq] = { equipment: eq, events: 0, tags: new Set() }
      }
      downtimeByEquipment[eq].events++
      downtimeByEquipment[eq].tags.add(event.tag)
    })

    // Group production data by equipment
    const productionByEquipment = {}
    productionTags.forEach(event => {
      const eq = event.equipment || 'Unknown'
      if (!productionByEquipment[eq]) {
        productionByEquipment[eq] = { equipment: eq, events: 0, values: [] }
      }
      productionByEquipment[eq].events++
      if (event.val !== null && typeof event.val === 'number') {
        productionByEquipment[eq].values.push(event.val)
      }
    })

    // Format efficiency metrics for charts
    const efficiencyMetrics = Object.values(efficiencyByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        indicators: g.tags.size
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // Format downtime analysis for charts
    const downtimeAnalysis = Object.values(downtimeByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        issueTypes: g.tags.size
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // Format production output for charts
    const productionOutput = Object.values(productionByEquipment)
      .map(g => ({
        equipment: g.equipment,
        events: g.events,
        avgOutput: g.values.length > 0 ? (g.values.reduce((a, b) => a + b, 0) / g.values.length).toFixed(2) : 0
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)

    // LINE EFFICIENCY RECOMMENDATIONS
    const recommendations = []

    Object.values(efficiencyByEquipment).forEach(eq => {
      let efficiencyScore = 0
      let issues = []
      let actions = []

      // Get related metrics
      const downtimeInfo = downtimeByEquipment[eq.equipment]
      const downtimeEvents = downtimeInfo?.events || 0
      const productionInfo = productionByEquipment[eq.equipment]
      const productionEvents = productionInfo?.events || 0

      // Issue 1: High downtime/fault frequency
      if (downtimeEvents > 300) {
        efficiencyScore += 40
        issues.push('High downtime frequency')
        actions.push('Reduce downtime - implement predictive maintenance schedule')
      } else if (downtimeEvents > 150) {
        efficiencyScore += 20
        issues.push('Elevated fault events')
        actions.push('Investigate fault patterns to prevent recurrence')
      }

      // Issue 2: Low production activity (inefficiency indicator)
      if (productionEvents < 50 && eq.events > 200) {
        efficiencyScore += 30
        issues.push('Low production output detected')
        actions.push('Increase line throughput - optimize production settings')
      } else if (productionEvents < 100 && eq.events > 500) {
        efficiencyScore += 15
        issues.push('Suboptimal production rate')
      }

      // Issue 3: High running indicator variability
      if (eq.tags.size > 5) {
        efficiencyScore += 30
        issues.push('Complex efficiency monitoring')
        actions.push('Consolidate efficiency metrics - create unified OEE dashboard')
      } else if (eq.tags.size > 3) {
        efficiencyScore += 15
        issues.push('Multiple efficiency indicators')
      }

      // Determine priority level
      let priority = 'Low'
      let priorityColor = '#10B981'
      if (efficiencyScore >= 60) {
        priority = 'High'
        priorityColor = '#EF4444'
        if (actions.length === 0) {
          actions.push('Critical efficiency improvement required - conduct root cause analysis')
        }
      } else if (efficiencyScore >= 30) {
        priority = 'Medium'
        priorityColor = '#F59E0B'
        if (actions.length === 0) {
          actions.push('Line efficiency optimization recommended')
        }
      } else {
        if (actions.length === 0) {
          actions.push('Line operating efficiently - maintain current performance')
        }
      }

      // Add equipment-specific recommendations
      const eqLower = eq.equipment.toLowerCase()
      if (eqLower.includes('filler')) {
        actions.push('Filler efficiency: Monitor fill accuracy and reduce spillage')
      } else if (eqLower.includes('labeler') || eqLower.includes('labeller')) {
        actions.push('Labeler efficiency: Reduce label waste and application errors')
      } else if (eqLower.includes('packer') || eqLower.includes('palletizer')) {
        actions.push('Packer efficiency: Optimize case formation and palletizing speed')
      } else if (eqLower.includes('conveyor') || eqLower.includes('airveyor')) {
        actions.push('Conveyor efficiency: Minimize jams and maintain optimal flow')
      } else if (eqLower.includes('blender')) {
        actions.push('Blender efficiency: Optimize batch times and reduce changeover duration')
      } else if (eqLower.includes('warmer')) {
        actions.push('Warmer efficiency: Maintain target temperatures and reduce energy consumption')
      }

      // Calculate estimated OEE improvement
      let estimatedOEE = 0
      if (efficiencyScore >= 60) {
        estimatedOEE = 18 // 18% OEE improvement potential
      } else if (efficiencyScore >= 30) {
        estimatedOEE = 10 // 10% OEE improvement potential
      }

      if (eq.events > 100) {
        recommendations.push({
          equipment: eq.equipment,
          priority,
          priorityColor,
          efficiencyScore,
          events: eq.events,
          downtimeEvents,
          productionEvents,
          issues,
          actions: actions.slice(0, 3),
          estimatedOEE
        })
      }
    })

    // Sort by efficiency score (highest priority first)
    recommendations.sort((a, b) => b.efficiencyScore - a.efficiencyScore)

    // Summary stats
    const summary = {
      totalEvents: processData.length,
      runningTags: runningTags.length,
      faultTags: faultTags.length,
      productionTags: productionTags.length,
      permitTags: permitTags.length,
      uniqueEquipment: Object.keys(efficiencyByEquipment).length,
      topEquipment: efficiencyMetrics[0]?.equipment || 'N/A',
      highPriorityCount: recommendations.filter(r => r.priority === 'High').length,
      totalOEEImprovement: recommendations.reduce((sum, r) => sum + r.estimatedOEE, 0)
    }

    return {
      efficiencyMetrics,
      downtimeAnalysis,
      productionOutput,
      recommendations: recommendations.slice(0, 10),
      summary
    }
  }

  // Calculate Connected Worker Analytics
  const calculateConnectedWorkerAnalytics = () => {
    if (processData.length === 0) {
      return {
        personas: [],
        workflows: [],
        alerts: [],
        summary: { totalEvents: 0, alertCount: 0, equipmentCount: 0 }
      }
    }

    // Filter operational data
    const alertTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('alarm') || e.tag.toLowerCase().includes('alert') ||
                e.tag.toLowerCase().includes('fault'))
    )
    const manualTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('manual') || e.tag.toLowerCase().includes('man_') ||
                e.tag.toLowerCase().includes('hmi'))
    )
    const statusTags = processData.filter(e =>
      e.tag && (e.tag.toLowerCase().includes('status') || e.tag.toLowerCase().includes('running'))
    )

    // Group equipment by category for persona assignment
    const equipmentByCategory = {}
    processData.forEach(event => {
      const eq = event.equipment || 'Unknown'
      const eqLower = eq.toLowerCase()

      let category = 'General'
      if (eqLower.includes('filler')) category = 'Filler'
      else if (eqLower.includes('label')) category = 'Labeler'
      else if (eqLower.includes('pack') || eqLower.includes('palletiz')) category = 'Packer'
      else if (eqLower.includes('blend') || eqLower.includes('warmer')) category = 'Blender'
      else if (eqLower.includes('inspect') || eqLower.includes('pressco')) category = 'Quality'

      if (!equipmentByCategory[category]) {
        equipmentByCategory[category] = { equipment: new Set(), alerts: 0, manualActions: 0, statusChecks: 0 }
      }
      equipmentByCategory[category].equipment.add(eq)
    })

    // Count alerts and actions per category
    alertTags.forEach(e => {
      const eq = e.equipment || 'Unknown'
      const eqLower = eq.toLowerCase()
      let category = 'General'
      if (eqLower.includes('filler')) category = 'Filler'
      else if (eqLower.includes('label')) category = 'Labeler'
      else if (eqLower.includes('pack') || eqLower.includes('palletiz')) category = 'Packer'
      else if (eqLower.includes('blend') || eqLower.includes('warmer')) category = 'Blender'
      else if (eqLower.includes('inspect') || eqLower.includes('pressco')) category = 'Quality'

      if (equipmentByCategory[category]) {
        equipmentByCategory[category].alerts++
      }
    })

    manualTags.forEach(e => {
      const eq = e.equipment || 'Unknown'
      const eqLower = eq.toLowerCase()
      let category = 'General'
      if (eqLower.includes('filler')) category = 'Filler'
      else if (eqLower.includes('label')) category = 'Labeler'
      else if (eqLower.includes('pack') || eqLower.includes('palletiz')) category = 'Packer'
      else if (eqLower.includes('blend') || eqLower.includes('warmer')) category = 'Blender'

      if (equipmentByCategory[category]) {
        equipmentByCategory[category].manualActions++
      }
    })

    // Define persona workflows based on operational data
    const personas = [
      {
        id: 'filler-operator',
        name: 'Filler Operator',
        icon: 'Droplet',
        color: '#3B82F6',
        description: 'Filling line operations',
        equipmentCount: equipmentByCategory['Filler']?.equipment.size || 0,
        equipmentList: Array.from(equipmentByCategory['Filler']?.equipment || []),
        alerts: equipmentByCategory['Filler']?.alerts || 0,
        tasks: [
          { id: 1, title: 'Pre-Shift Inspection', status: 'pending', priority: 'high', action: 'Check filler valve status and pressure' },
          { id: 2, title: 'Monitor Fill Levels', status: 'in_progress', priority: 'high', action: 'Verify fill accuracy within tolerance' },
          { id: 3, title: 'CIP Verification', status: 'completed', priority: 'medium', action: 'Confirm cleaning cycle completion' },
          { id: 4, title: 'Speed Adjustment', status: 'pending', priority: 'medium', action: 'Optimize fill speed for current product' }
        ],
        kpis: [
          { label: 'Fill Accuracy', value: '99.2%', status: 'good' },
          { label: 'Equipment Uptime', value: '94.5%', status: 'warning' },
          { label: 'Alerts', value: equipmentByCategory['Filler']?.alerts || 0, status: equipmentByCategory['Filler']?.alerts > 50 ? 'danger' : 'good' }
        ]
      },
      {
        id: 'labeler-operator',
        name: 'Labeler Operator',
        icon: 'Tag',
        color: '#10B981',
        description: 'Label application operations',
        equipmentCount: equipmentByCategory['Labeler']?.equipment.size || 0,
        equipmentList: Array.from(equipmentByCategory['Labeler']?.equipment || []),
        alerts: equipmentByCategory['Labeler']?.alerts || 0,
        tasks: [
          { id: 1, title: 'Label Roll Check', status: 'completed', priority: 'high', action: 'Verify label inventory and quality' },
          { id: 2, title: 'Application Inspection', status: 'in_progress', priority: 'high', action: 'Check label placement accuracy' },
          { id: 3, title: 'Glue Temperature', status: 'pending', priority: 'medium', action: 'Monitor adhesive temperature' },
          { id: 4, title: 'Reject Handling', status: 'pending', priority: 'low', action: 'Clear rejected bottles from diverter' }
        ],
        kpis: [
          { label: 'Label Accuracy', value: '98.8%', status: 'good' },
          { label: 'Waste Rate', value: '1.2%', status: 'good' },
          { label: 'Alerts', value: equipmentByCategory['Labeler']?.alerts || 0, status: equipmentByCategory['Labeler']?.alerts > 30 ? 'warning' : 'good' }
        ]
      },
      {
        id: 'packer-operator',
        name: 'Packer/Palletizer Operator',
        icon: 'Package',
        color: '#F59E0B',
        description: 'Packing and palletizing operations',
        equipmentCount: equipmentByCategory['Packer']?.equipment.size || 0,
        equipmentList: Array.from(equipmentByCategory['Packer']?.equipment || []),
        alerts: equipmentByCategory['Packer']?.alerts || 0,
        tasks: [
          { id: 1, title: 'Case Former Setup', status: 'completed', priority: 'high', action: 'Load case blanks and verify formation' },
          { id: 2, title: 'Pallet Pattern', status: 'in_progress', priority: 'high', action: 'Confirm pallet configuration for product' },
          { id: 3, title: 'Wrapper Check', status: 'pending', priority: 'medium', action: 'Monitor shrink wrap quality' },
          { id: 4, title: 'Pallet Transfer', status: 'pending', priority: 'medium', action: 'Coordinate with warehouse logistics' }
        ],
        kpis: [
          { label: 'Pack Rate', value: '245 CPM', status: 'good' },
          { label: 'Case Quality', value: '99.5%', status: 'good' },
          { label: 'Alerts', value: equipmentByCategory['Packer']?.alerts || 0, status: equipmentByCategory['Packer']?.alerts > 40 ? 'danger' : 'good' }
        ]
      },
      {
        id: 'blender-operator',
        name: 'Blender/Warmer Operator',
        icon: 'Beaker',
        color: '#8B4513',
        description: 'Blending and warming operations',
        equipmentCount: equipmentByCategory['Blender']?.equipment.size || 0,
        equipmentList: Array.from(equipmentByCategory['Blender']?.equipment || []),
        alerts: equipmentByCategory['Blender']?.alerts || 0,
        tasks: [
          { id: 1, title: 'Recipe Verification', status: 'completed', priority: 'high', action: 'Confirm recipe loaded for production run' },
          { id: 2, title: 'Brix Monitoring', status: 'in_progress', priority: 'high', action: 'Check blend concentration levels' },
          { id: 3, title: 'Temperature Control', status: 'in_progress', priority: 'high', action: 'Maintain warmer setpoint temperature' },
          { id: 4, title: 'Tank Level Check', status: 'pending', priority: 'medium', action: 'Monitor buffer tank levels' }
        ],
        kpis: [
          { label: 'Brix Accuracy', value: '±0.1°', status: 'good' },
          { label: 'Temp Stability', value: '96.8%', status: 'good' },
          { label: 'Alerts', value: equipmentByCategory['Blender']?.alerts || 0, status: equipmentByCategory['Blender']?.alerts > 25 ? 'warning' : 'good' }
        ]
      },
      {
        id: 'quality-inspector',
        name: 'Quality Inspector',
        icon: 'CheckCircle',
        color: '#9333EA',
        description: 'Quality assurance and inspection',
        equipmentCount: equipmentByCategory['Quality']?.equipment.size || 0,
        equipmentList: Array.from(equipmentByCategory['Quality']?.equipment || []),
        alerts: equipmentByCategory['Quality']?.alerts || 0,
        tasks: [
          { id: 1, title: 'Hourly Inspection', status: 'in_progress', priority: 'high', action: 'Conduct product quality checks' },
          { id: 2, title: 'Seal Integrity Test', status: 'pending', priority: 'high', action: 'Verify cap torque and seal quality' },
          { id: 3, title: 'Label Compliance', status: 'pending', priority: 'medium', action: 'Check label content and placement' },
          { id: 4, title: 'Documentation', status: 'pending', priority: 'medium', action: 'Record inspection results in QMS' }
        ],
        kpis: [
          { label: 'Pass Rate', value: '99.7%', status: 'good' },
          { label: 'Reject Rate', value: '0.3%', status: 'good' },
          { label: 'Alerts', value: equipmentByCategory['Quality']?.alerts || 0, status: 'good' }
        ]
      },
      {
        id: 'line-lead',
        name: 'Line Lead/Supervisor',
        icon: 'Users',
        color: '#DC2626',
        description: 'Overall line coordination',
        equipmentCount: Object.values(equipmentByCategory).reduce((sum, cat) => sum + cat.equipment.size, 0),
        equipmentList: Array.from(new Set(Object.values(equipmentByCategory).flatMap(cat => Array.from(cat.equipment)))),
        alerts: Object.values(equipmentByCategory).reduce((sum, cat) => sum + cat.alerts, 0),
        tasks: [
          { id: 1, title: 'Shift Handover', status: 'completed', priority: 'high', action: 'Review previous shift performance and issues' },
          { id: 2, title: 'Production Goals', status: 'in_progress', priority: 'high', action: 'Monitor progress vs production targets' },
          { id: 3, title: 'Team Coordination', status: 'in_progress', priority: 'high', action: 'Address operator concerns and resource needs' },
          { id: 4, title: 'Safety Walkthrough', status: 'pending', priority: 'high', action: 'Conduct safety inspection of line area' }
        ],
        kpis: [
          { label: 'Line OEE', value: '87.3%', status: 'warning' },
          { label: 'Total Output', value: '48,250 units', status: 'good' },
          { label: 'Team Alerts', value: Object.values(equipmentByCategory).reduce((sum, cat) => sum + cat.alerts, 0), status: 'warning' }
        ]
      }
    ]

    // Create workflow summary
    const workflows = personas.map(p => ({
      persona: p.name,
      pendingTasks: p.tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: p.tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: p.tasks.filter(t => t.status === 'completed').length,
      totalTasks: p.tasks.length
    }))

    // Top alerts aggregated
    const alerts = []
    Object.entries(equipmentByCategory).forEach(([category, data]) => {
      if (data.alerts > 0) {
        alerts.push({
          category,
          alertCount: data.alerts,
          equipmentCount: data.equipment.size,
          priority: data.alerts > 50 ? 'High' : data.alerts > 25 ? 'Medium' : 'Low'
        })
      }
    })
    alerts.sort((a, b) => b.alertCount - a.alertCount)

    const summary = {
      totalEvents: processData.length,
      alertCount: alertTags.length,
      manualActions: manualTags.length,
      equipmentCount: new Set(processData.map(e => e.equipment)).size,
      personaCount: personas.length,
      totalTasks: personas.reduce((sum, p) => sum + p.tasks.length, 0),
      pendingTasks: personas.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'pending').length, 0)
    }

    return {
      personas,
      workflows,
      alerts: alerts.slice(0, 8),
      summary
    }
  }

  const analytics = activeTab === 'changeover' ? calculateChangeoverAnalytics()
    : activeTab === 'foaming' ? calculateFoamingAnalytics()
    : activeTab === 'vcurve' ? calculateVCurveAnalytics()
    : activeTab === 'speedoflight' ? calculateSpeedOfLightAnalytics()
    : activeTab === 'lineefficiency' ? calculateLineEfficiencyAnalytics()
    : activeTab === 'connectedworker' ? calculateConnectedWorkerAnalytics()
    : {}

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>AI Assisted Connected Worker</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            AI-driven operator guidance and decision support for manufacturing operations
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151' }}>Time Range:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: timeRange === option.value ? '#0A1628' : '#f3f4f6',
                  color: timeRange === option.value ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchProcessData}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              background: 'white',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <div style={{
            padding: '6px 12px',
            background: '#E0F2E9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0F5132'
          }}>
            AI Operator
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: '8px' }}>
        {Object.entries(useCases).filter(([key]) => key === 'connectedworker').map(([key, useCase]) => {
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
      {activeTab === 'changeover' ? (
        <div className="tab-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading changeover analytics...</p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
                <div className="stat-card" style={{ padding: '10px', background: 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Activity size={14} />
                    <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px' }}>
                    {analytics.summary?.totalEvents?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.9 }}>Process events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Package size={14} style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>EQUIPMENT</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6', marginBottom: '2px' }}>
                    {analytics.summary?.uniqueEquipment || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Unique assets</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Layers size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>LINES</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.uniqueLines || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Production lines</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <BarChart3 size={14} style={{ color: '#F59E0B' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>AVG/EQUIP</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B', marginBottom: '2px' }}>
                    {analytics.summary?.avgEventsPerEquipment || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Events per asset</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>HIGH PRIORITY</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF4444', marginBottom: '2px' }}>
                    {analytics.summary?.highPriorityCount || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Optimization items</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <TrendingDown size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>SAVINGS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.totalPotentialSavings || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Event reduction</div>
                </div>

                <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <Zap size={16} style={{ color: '#9333EA', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Top Equipment</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#9333EA' }}>
                    {analytics.summary?.topEquipment?.substring(0, 15) || 'N/A'}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <TrendingUp size={16} style={{ color: '#8B4513', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Top Line</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#8B4513' }}>
                    {analytics.summary?.topLine?.substring(0, 15) || 'N/A'}
                  </div>
                </div>
              </div>
              {/* 3 MAIN CARDS LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                
                {/* CARD 1: CHANGEOVER OPTIMIZATION RECOMMENDATIONS */}
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Lightbulb size={20} style={{ color: '#F59E0B' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>CHANGEOVER OPTIMIZATION</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Actionable recommendations
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '6px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                    {analytics.changeoverRecommendations && analytics.changeoverRecommendations.length > 0 ? (
                      analytics.changeoverRecommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'white',
                            borderRadius: '6px',
                            padding: '10px',
                            border: `2px solid ${rec.priorityColor}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1f2937' }}>
                                {rec.equipment.substring(0, 25)}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  background: rec.priorityColor,
                                  color: 'white'
                                }}
                              >
                                {rec.priority}
                              </span>
                            </div>
                          </div>

                          {rec.issues.length > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {rec.issues.map((issue, iIdx) => (
                                  <span
                                    key={iIdx}
                                    style={{
                                      padding: '2px 6px',
                                      background: '#FEE2E2',
                                      color: '#991B1B',
                                      borderRadius: '3px',
                                      fontSize: '9px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ background: '#F0FDF4', borderRadius: '4px', padding: '6px', border: '1px solid #86EFAC' }}>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9px', color: '#166534', lineHeight: '1.4' }}>
                              {rec.recommendations.slice(0, 2).map((action, rIdx) => (
                                <li key={rIdx} style={{ marginBottom: '2px' }}>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px' }}>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                          No optimization opportunities detected
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: EQUIPMENT ACTIVITY + LINE PERFORMANCE */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>EQUIPMENT ACTIVITY</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Top equipment by event count</p>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={(analytics.equipmentActivity || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" style={{ fontSize: '10px' }} />
                      <YAxis dataKey="equipment" type="category" style={{ fontSize: '9px' }} width={75} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="events" fill={COLORS[1]} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>LINE PERFORMANCE</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Events by production line</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.linePerformance || []}
                        dataKey="events"
                        nameKey="line"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ line, events }) => `${(line || 'Unknown').substring(0, 8)}: ${events}`}
                        labelLine={false}
                        style={{ fontSize: '10px' }}
                      >
                        {(analytics.linePerformance || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* CARD 3: TOP 10 PROCESS TAGS + EQUIPMENT DETAILS */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>TOP 10 PROCESS TAGS</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Most frequent tags</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(analytics.tagDistribution || []).slice(0, 8)} margin={{ top: 5, right: 10, left: 5, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="tag" angle={-45} textAnchor="end" height={60} style={{ fontSize: '9px' }} />
                      <YAxis style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="count" fill={COLORS[2]} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 6px 0', color: '#1f2937' }}>EQUIPMENT DETAILS</h3>
                    <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <table className="data-table" style={{ fontSize: '10px' }}>
                        <thead>
                          <tr>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Equipment</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Events</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Tags</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics.topEquipment || []).slice(0, 8).map((eq, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: '600', fontSize: '10px', padding: '6px' }}>{eq.equipment.substring(0, 20)}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.events.toLocaleString()}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.tagCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'foaming' ? (
        <div className="tab-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading foaming analytics...</p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '8px' }}>
                <div className="stat-card" style={{ padding: '10px', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Activity size={14} />
                    <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px' }}>
                    {analytics.summary?.totalEvents?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.9 }}>Process events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Gauge size={14} style={{ color: '#DC2626' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>PRESSURE</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#DC2626', marginBottom: '2px' }}>
                    {analytics.summary?.pressureAlerts?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Pressure events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Droplet size={14} style={{ color: '#0EA5E9' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>LEVEL</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#0EA5E9', marginBottom: '2px' }}>
                    {analytics.summary?.levelAlerts?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Level events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Zap size={14} style={{ color: '#F59E0B' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>FLOW</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B', marginBottom: '2px' }}>
                    {analytics.summary?.flowEvents?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Flow events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Package size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>FILLERS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.fillerEquipment || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Filler equipment</div>
                </div>

                <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <TrendingUp size={16} style={{ color: '#8B4513', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Top Filler</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#8B4513' }}>
                    {analytics.summary?.topFiller?.substring(0, 15) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* 3 MAIN CARDS LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                
                {/* CARD 1: FOAMING RISK ANALYSIS & RECOMMENDATIONS */}
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>RISK ANALYSIS</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Actionable recommendations
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '6px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                    {analytics.riskAnalysis && analytics.riskAnalysis.length > 0 ? (
                      analytics.riskAnalysis.map((risk, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'white',
                            borderRadius: '6px',
                            padding: '10px',
                            border: `2px solid ${risk.riskColor}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1f2937' }}>
                                {risk.equipment.substring(0, 25)}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  background: risk.riskColor,
                                  color: 'white'
                                }}
                              >
                                {risk.riskLevel}
                              </span>
                            </div>
                          </div>

                          {risk.riskFactors.length > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {risk.riskFactors.map((factor, fIdx) => (
                                  <span
                                    key={fIdx}
                                    style={{
                                      padding: '2px 6px',
                                      background: '#FEE2E2',
                                      color: '#991B1B',
                                      borderRadius: '3px',
                                      fontSize: '9px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ background: '#F0FDF4', borderRadius: '4px', padding: '6px', border: '1px solid #86EFAC' }}>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9px', color: '#166534', lineHeight: '1.4' }}>
                              {risk.recommendations.slice(0, 2).map((rec, rIdx) => (
                                <li key={rIdx} style={{ marginBottom: '2px' }}>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px' }}>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                          No significant foaming risk detected
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: PRESSURE & FILLER MONITORING */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>PRESSURE MONITORING</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Top equipment with pressure events</p>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={(analytics.pressureEvents || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" style={{ fontSize: '10px' }} />
                      <YAxis dataKey="equipment" type="category" style={{ fontSize: '9px' }} width={75} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="events" fill="#DC2626" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>FILLER ACTIVITY</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Events by filler equipment</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.fillerMetrics || []}
                        dataKey="events"
                        nameKey="equipment"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ equipment, events }) => `${(equipment || 'Unknown').substring(0, 8)}: ${events}`}
                        labelLine={false}
                        style={{ fontSize: '10px' }}
                      >
                        {(analytics.fillerMetrics || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* CARD 3: LEVEL MONITORING + DETAILS */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>LEVEL MONITORING</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Most active level sensors</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(analytics.levelEvents || []).slice(0, 8)} margin={{ top: 5, right: 10, left: 5, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="tag" angle={-45} textAnchor="end" height={60} style={{ fontSize: '9px' }} />
                      <YAxis style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="count" fill="#0EA5E9" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 6px 0', color: '#1f2937' }}>EQUIPMENT DETAILS</h3>
                    <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <table className="data-table" style={{ fontSize: '10px' }}>
                        <thead>
                          <tr>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Equipment</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Events</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Avg Press</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics.pressureEvents || []).slice(0, 8).map((eq, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: '600', fontSize: '10px', padding: '6px' }}>{eq.equipment.substring(0, 20)}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.events.toLocaleString()}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.avgPressure}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'vcurve' ? (
        <div className="tab-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading V-curve analytics...</p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
                <div className="stat-card" style={{ padding: '10px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Activity size={14} />
                    <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px' }}>
                    {analytics.summary?.totalEvents?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.9 }}>Process events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Gauge size={14} style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>SPEED</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6', marginBottom: '2px' }}>
                    {analytics.summary?.speedTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Speed events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Zap size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>FLOW</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.flowTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Flow events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Activity size={14} style={{ color: '#DC2626' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>PRESSURE</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#DC2626', marginBottom: '2px' }}>
                    {analytics.summary?.pressureTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Pressure events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Package size={14} style={{ color: '#F59E0B' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>EQUIPMENT</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B', marginBottom: '2px' }}>
                    {analytics.summary?.uniqueEquipment || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Unique assets</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>HIGH PRIORITY</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF4444', marginBottom: '2px' }}>
                    {analytics.summary?.highPriorityCount || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Optimization items</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <TrendingUp size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>IMPROVEMENT</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.totalImprovement || 0}%
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Potential gain</div>
                </div>

                <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <TrendingUp size={16} style={{ color: '#8B4513', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Top Equipment</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#8B4513' }}>
                    {analytics.summary?.topEquipment?.substring(0, 15) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* 3 MAIN CARDS LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>

                {/* CARD 1: V-CURVE OPTIMIZATION RECOMMENDATIONS */}
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Lightbulb size={20} style={{ color: '#10B981' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>V-CURVE OPTIMIZATION</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Actionable recommendations
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '6px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                    {analytics.optimizationRecommendations && analytics.optimizationRecommendations.length > 0 ? (
                      analytics.optimizationRecommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'white',
                            borderRadius: '6px',
                            padding: '10px',
                            border: `2px solid ${rec.priorityColor}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1f2937' }}>
                                {rec.equipment.substring(0, 25)}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  background: rec.priorityColor,
                                  color: 'white'
                                }}
                              >
                                {rec.priority}
                              </span>
                              {rec.estimatedImprovement > 0 && (
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    background: '#E0F2E9',
                                    color: '#0F5132'
                                  }}
                                >
                                  +{rec.estimatedImprovement}% potential
                                </span>
                              )}
                            </div>
                          </div>

                          {rec.issues.length > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {rec.issues.map((issue, iIdx) => (
                                  <span
                                    key={iIdx}
                                    style={{
                                      padding: '2px 6px',
                                      background: '#FEE2E2',
                                      color: '#991B1B',
                                      borderRadius: '3px',
                                      fontSize: '9px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ background: '#F0FDF4', borderRadius: '4px', padding: '6px', border: '1px solid #86EFAC' }}>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9px', color: '#166534', lineHeight: '1.4' }}>
                              {rec.recommendations.slice(0, 2).map((action, rIdx) => (
                                <li key={rIdx} style={{ marginBottom: '2px' }}>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px' }}>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                          No optimization opportunities detected
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: SPEED MONITORING + PRESSURE ANALYSIS */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>SPEED MONITORING</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Top equipment by speed events</p>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={(analytics.speedEvents || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" style={{ fontSize: '10px' }} />
                      <YAxis dataKey="equipment" type="category" style={{ fontSize: '9px' }} width={75} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="events" fill="#3B82F6" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>PRESSURE ANALYSIS</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Pressure events by equipment</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.pressureEvents || []}
                        dataKey="events"
                        nameKey="equipment"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ equipment, events }) => `${(equipment || 'Unknown').substring(0, 8)}: ${events}`}
                        labelLine={false}
                        style={{ fontSize: '10px' }}
                      >
                        {(analytics.pressureEvents || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* CARD 3: FLOW MONITORING + EQUIPMENT DETAILS */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>FLOW MONITORING</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Top equipment by flow events</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(analytics.flowEvents || []).slice(0, 8)} margin={{ top: 5, right: 10, left: 5, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={60} style={{ fontSize: '9px' }} />
                      <YAxis style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="events" fill="#10B981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 6px 0', color: '#1f2937' }}>EQUIPMENT DETAILS</h3>
                    <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <table className="data-table" style={{ fontSize: '10px' }}>
                        <thead>
                          <tr>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Equipment</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Events</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Avg Speed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics.speedEvents || []).slice(0, 8).map((eq, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: '600', fontSize: '10px', padding: '6px' }}>{eq.equipment.substring(0, 20)}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.events.toLocaleString()}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.avgSpeed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'speedoflight' ? (
        <div className="tab-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading Speed of Light analytics...</p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
                <div className="stat-card" style={{ padding: '10px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Activity size={14} />
                    <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px' }}>
                    {analytics.summary?.totalEvents?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.9 }}>Process events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Gauge size={14} style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>SPEED</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6', marginBottom: '2px' }}>
                    {analytics.summary?.speedTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Speed events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <BarChart3 size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>THROUGHPUT</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.throughputTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Throughput events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <AlertCircle size={14} style={{ color: '#DC2626' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>BOTTLENECKS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#DC2626', marginBottom: '2px' }}>
                    {analytics.summary?.bottleneckTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Constraint events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Package size={14} style={{ color: '#8B4513' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>EQUIPMENT</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#8B4513', marginBottom: '2px' }}>
                    {analytics.summary?.uniqueEquipment || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Unique assets</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>HIGH PRIORITY</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF4444', marginBottom: '2px' }}>
                    {analytics.summary?.highPriorityCount || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Optimization items</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Clock size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>TIME SAVED</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.totalReduction || 0}%
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Cycle reduction</div>
                </div>

                <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <TrendingUp size={16} style={{ color: '#9333EA', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Top Equipment</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#9333EA' }}>
                    {analytics.summary?.topEquipment?.substring(0, 15) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* 3 MAIN CARDS LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>

                {/* CARD 1: FAST-TRACK OPTIMIZATION RECOMMENDATIONS */}
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Lightbulb size={20} style={{ color: '#F59E0B' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>FAST-TRACK OPTIMIZATION</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Priority product recommendations
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '6px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                    {analytics.optimizationRecommendations && analytics.optimizationRecommendations.length > 0 ? (
                      analytics.optimizationRecommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'white',
                            borderRadius: '6px',
                            padding: '10px',
                            border: `2px solid ${rec.priorityColor}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1f2937' }}>
                                {rec.equipment.substring(0, 25)}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  background: rec.priorityColor,
                                  color: 'white'
                                }}
                              >
                                {rec.priority}
                              </span>
                              {rec.estimatedReduction > 0 && (
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    background: '#E0F2E9',
                                    color: '#0F5132'
                                  }}
                                >
                                  -{rec.estimatedReduction}% cycle time
                                </span>
                              )}
                            </div>
                          </div>

                          {rec.issues.length > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {rec.issues.map((issue, iIdx) => (
                                  <span
                                    key={iIdx}
                                    style={{
                                      padding: '2px 6px',
                                      background: '#FEE2E2',
                                      color: '#991B1B',
                                      borderRadius: '3px',
                                      fontSize: '9px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ background: '#F0FDF4', borderRadius: '4px', padding: '6px', border: '1px solid #86EFAC' }}>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9px', color: '#166534', lineHeight: '1.4' }}>
                              {rec.recommendations.slice(0, 2).map((action, rIdx) => (
                                <li key={rIdx} style={{ marginBottom: '2px' }}>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px' }}>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                          No optimization opportunities detected
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: SPEED METRICS + BOTTLENECK ANALYSIS */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>SPEED METRICS</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Top equipment by speed events</p>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={(analytics.speedMetrics || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" style={{ fontSize: '10px' }} />
                      <YAxis dataKey="equipment" type="category" style={{ fontSize: '9px' }} width={75} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="events" fill="#3B82F6" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>BOTTLENECK ANALYSIS</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Constraint events by equipment</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.bottleneckAnalysis || []}
                        dataKey="events"
                        nameKey="equipment"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ equipment, events }) => `${(equipment || 'Unknown').substring(0, 8)}: ${events}`}
                        labelLine={false}
                        style={{ fontSize: '10px' }}
                      >
                        {(analytics.bottleneckAnalysis || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* CARD 3: THROUGHPUT METRICS + EQUIPMENT DETAILS */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>THROUGHPUT METRICS</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Production output by equipment</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(analytics.throughputMetrics || []).slice(0, 8)} margin={{ top: 5, right: 10, left: 5, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={60} style={{ fontSize: '9px' }} />
                      <YAxis style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="events" fill="#10B981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 6px 0', color: '#1f2937' }}>EQUIPMENT DETAILS</h3>
                    <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <table className="data-table" style={{ fontSize: '10px' }}>
                        <thead>
                          <tr>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Equipment</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Events</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Bottlenecks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics.optimizationRecommendations || []).slice(0, 8).map((eq, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: '600', fontSize: '10px', padding: '6px' }}>{eq.equipment.substring(0, 20)}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.events.toLocaleString()}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.bottleneckEvents}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'lineefficiency' ? (
        <div className="tab-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading line efficiency analytics...</p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
                <div className="stat-card" style={{ padding: '10px', background: 'linear-gradient(135deg, #8B4513 0%, #6B3410 100%)', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Activity size={14} />
                    <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px' }}>
                    {analytics.summary?.totalEvents?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.9 }}>Process events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Zap size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>RUNNING</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.runningTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Efficiency events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <AlertCircle size={14} style={{ color: '#DC2626' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>FAULTS</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#DC2626', marginBottom: '2px' }}>
                    {analytics.summary?.faultTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Downtime events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <BarChart3 size={14} style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>PRODUCTION</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6', marginBottom: '2px' }}>
                    {analytics.summary?.productionTags?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Output events</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Package size={14} style={{ color: '#F59E0B' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>EQUIPMENT</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B', marginBottom: '2px' }}>
                    {analytics.summary?.uniqueEquipment || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Unique assets</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>HIGH PRIORITY</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF4444', marginBottom: '2px' }}>
                    {analytics.summary?.highPriorityCount || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Improvement items</div>
                </div>

                <div className="stat-card" style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <TrendingUp size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>OEE GAIN</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                    {analytics.summary?.totalOEEImprovement || 0}%
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af' }}>Efficiency uplift</div>
                </div>

                <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <Gauge size={16} style={{ color: '#9333EA', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Top Equipment</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#9333EA' }}>
                    {analytics.summary?.topEquipment?.substring(0, 15) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* 3 MAIN CARDS LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>

                {/* CARD 1: LINE EFFICIENCY RECOMMENDATIONS */}
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Lightbulb size={20} style={{ color: '#8B4513' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>EFFICIENCY RECOMMENDATIONS</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        AI-powered line improvement actions
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '6px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                    {analytics.recommendations && analytics.recommendations.length > 0 ? (
                      analytics.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'white',
                            borderRadius: '6px',
                            padding: '10px',
                            border: `2px solid ${rec.priorityColor}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1f2937' }}>
                                {rec.equipment.substring(0, 25)}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  background: rec.priorityColor,
                                  color: 'white'
                                }}
                              >
                                {rec.priority}
                              </span>
                              {rec.estimatedOEE > 0 && (
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    background: '#E0F2E9',
                                    color: '#0F5132'
                                  }}
                                >
                                  +{rec.estimatedOEE}% OEE
                                </span>
                              )}
                            </div>
                          </div>

                          {rec.issues.length > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {rec.issues.map((issue, iIdx) => (
                                  <span
                                    key={iIdx}
                                    style={{
                                      padding: '2px 6px',
                                      background: '#FEE2E2',
                                      color: '#991B1B',
                                      borderRadius: '3px',
                                      fontSize: '9px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ background: '#F0FDF4', borderRadius: '4px', padding: '6px', border: '1px solid #86EFAC' }}>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9px', color: '#166534', lineHeight: '1.4' }}>
                              {rec.actions.slice(0, 2).map((action, rIdx) => (
                                <li key={rIdx} style={{ marginBottom: '2px' }}>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px' }}>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                          Line operating at optimal efficiency
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: EFFICIENCY METRICS + DOWNTIME ANALYSIS */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>EFFICIENCY METRICS</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Running indicators by equipment</p>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={(analytics.efficiencyMetrics || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" style={{ fontSize: '10px' }} />
                      <YAxis dataKey="equipment" type="category" style={{ fontSize: '9px' }} width={75} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="events" fill="#10B981" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>DOWNTIME ANALYSIS</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Fault events by equipment</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.downtimeAnalysis || []}
                        dataKey="events"
                        nameKey="equipment"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ equipment, events }) => `${(equipment || 'Unknown').substring(0, 8)}: ${events}`}
                        labelLine={false}
                        style={{ fontSize: '10px' }}
                      >
                        {(analytics.downtimeAnalysis || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* CARD 3: PRODUCTION OUTPUT + EQUIPMENT DETAILS */}
                <div className="chart-card" style={{ padding: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: '#1f2937' }}>PRODUCTION OUTPUT</h3>
                    <p style={{ fontSize: '10px', margin: 0, color: '#6b7280' }}>Output events by equipment</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(analytics.productionOutput || []).slice(0, 8)} margin={{ top: 5, right: 10, left: 5, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={60} style={{ fontSize: '9px' }} />
                      <YAxis style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="events" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 6px 0', color: '#1f2937' }}>EQUIPMENT DETAILS</h3>
                    <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <table className="data-table" style={{ fontSize: '10px' }}>
                        <thead>
                          <tr>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Equipment</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Events</th>
                            <th style={{ fontSize: '10px', padding: '6px' }}>Downtime</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics.recommendations || []).slice(0, 8).map((eq, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: '600', fontSize: '10px', padding: '6px' }}>{eq.equipment.substring(0, 20)}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.events.toLocaleString()}</td>
                              <td className="text-right" style={{ fontSize: '10px', padding: '6px' }}>{eq.downtimeEvents}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'connectedworker' ? (
        <div className="tab-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading connected worker workflows...</p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <AlertCircle size={14} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && analytics.personas && analytics.personas.length > 0 && (
            <>
              {/* Persona Navigation Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
                {analytics.personas.map((persona, idx) => {
                  const getIconComponent = (iconName) => {
                    const icons = { Droplet, Tag, Package, Beaker, CheckCircle, Users }
                    return icons[iconName] || Activity
                  }
                  const IconComponent = getIconComponent(persona.icon)
                  const isActive = selectedPersona === idx

                  return (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersona(idx)}
                      style={{
                        padding: '8px 16px',
                        background: isActive ? '#0A1628' : 'transparent',
                        color: isActive ? 'white' : '#6b7280',
                        border: 'none',
                        borderBottom: isActive ? '3px solid #0A1628' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        borderRadius: '4px 4px 0 0'
                      }}
                    >
                      <IconComponent size={14} />
                      {persona.name}
                    </button>
                  )
                })}
              </div>

              {(() => {
                const persona = analytics.personas[selectedPersona]
                const getIconComponent = (iconName) => {
                  const icons = { Droplet, Tag, Package, Beaker, CheckCircle, Users }
                  return icons[iconName] || Activity
                }
                const IconComponent = getIconComponent(persona.icon)

                return (
                  <>
                    {/* Persona Header */}
                    <div className="chart-card" style={{ padding: '10px 14px', marginBottom: '10px', background: 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)', color: 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)' }}>
                          <IconComponent size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h2 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0' }}>{persona.name}</h2>
                          <p style={{ fontSize: '10px', margin: 0, opacity: 0.9 }}>{persona.description}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '2px' }}>Equipment</div>
                          <div style={{ fontSize: '16px', fontWeight: '700' }}>{persona.equipmentCount}</div>
                        </div>
                      </div>
                    </div>

                    {/* KPI Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      {persona.kpis.map((kpi, kIdx) => (
                        <div key={kIdx} className="stat-card" style={{ padding: '12px' }}>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>{kpi.label}</div>
                          <div style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: kpi.status === 'good' ? '#10B981' : kpi.status === 'warning' ? '#F59E0B' : '#0A1628',
                            marginBottom: '4px'
                          }}>
                            {kpi.value}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>
                            {kpi.status === 'good' ? 'Performing well' : kpi.status === 'warning' ? 'Needs attention' : 'Critical'}
                          </div>
                        </div>
                      ))}
                      <div className="stat-card" style={{ padding: '12px', background: persona.alerts > 10 ? '#FEF2F2' : '#F0FDF4' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>ACTIVE ALERTS</div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          color: persona.alerts > 10 ? '#0A1628' : '#10B981',
                          marginBottom: '4px'
                        }}>
                          {persona.alerts}
                        </div>
                        <div style={{ fontSize: '9px', color: '#9ca3af' }}>
                          {persona.alerts > 10 ? 'Action required' : 'All clear'}
                        </div>
                      </div>
                    </div>

                    {/* Data Source Information */}
                    <div className="chart-card" style={{ padding: '14px', marginBottom: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Lightbulb size={16} style={{ color: '#0A1628', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#1f2937', margin: '0 0 6px 0' }}>DATA SOURCES & RECOMMENDATIONS</h3>
                          <p style={{ fontSize: '10px', color: '#4b5563', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                            All tasks and recommendations are derived from real-time analysis of <strong>OT Process Events</strong> table data.
                            This includes monitoring {persona.equipmentCount} pieces of equipment across Line 1 PET Bottles production.
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '9px' }}>
                            <div style={{ padding: '6px', background: 'white', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                              <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '2px' }}>Equipment Tags</div>
                              <div style={{ color: '#6b7280' }}>Speed, flow, pressure, temperature sensors</div>
                            </div>
                            <div style={{ padding: '6px', background: 'white', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                              <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '2px' }}>Alert System</div>
                              <div style={{ color: '#6b7280' }}>Fault codes, downtime events, state changes</div>
                            </div>
                            <div style={{ padding: '6px', background: 'white', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                              <div style={{ fontWeight: '700', color: '#0A1628', marginBottom: '2px' }}>Production Metrics</div>
                              <div style={{ color: '#6b7280' }}>Running status, output counts, efficiency</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task Workflow */}
                    <div className="chart-card" style={{ padding: '16px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937', margin: 0 }}>TODAY'S WORKFLOW</h3>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          <span style={{ fontWeight: '700', color: '#10B981' }}>{persona.tasks.filter(t => t.status === 'completed').length}</span> completed •
                          <span style={{ fontWeight: '700', color: '#F59E0B', marginLeft: '6px' }}>{persona.tasks.filter(t => t.status === 'in_progress').length}</span> in progress •
                          <span style={{ fontWeight: '700', color: '#9CA3AF', marginLeft: '6px' }}>{persona.tasks.filter(t => t.status === 'pending').length}</span> pending
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', paddingBottom: '8px' }}>
                        {persona.tasks.map((task, tIdx) => (
                          <div
                            key={task.id}
                            className="chart-card"
                            style={{
                              padding: '12px',
                              flex: 1,
                              minWidth: '0',
                              background: task.status === 'completed' ? '#F0FDF4' : task.status === 'in_progress' ? '#FEF3C7' : 'white',
                              border: `1px solid ${task.status === 'completed' ? '#10B981' : task.status === 'in_progress' ? '#F59E0B' : '#E5E7EB'}`,
                              borderLeft: `4px solid ${task.status === 'completed' ? '#10B981' : task.status === 'in_progress' ? '#F59E0B' : '#9CA3AF'}`
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                background: task.status === 'completed' ? '#10B981' : task.status === 'in_progress' ? '#F59E0B' : '#9CA3AF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '11px'
                              }}>
                                {tIdx + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#1f2937', margin: 0, flex: 1 }}>{task.title}</h4>
                                  {task.priority === 'high' && (
                                    <span style={{ fontSize: '8px', padding: '2px 6px', background: '#0A1628', color: 'white', borderRadius: '4px', fontWeight: '700' }}>
                                      HIGH PRIORITY
                                    </span>
                                  )}
                                  <div style={{
                                    fontSize: '9px',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: task.status === 'completed' ? '#10B981' : task.status === 'in_progress' ? '#F59E0B' : '#9CA3AF',
                                    color: 'white',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                  }}>
                                    {task.status.replace('_', ' ')}
                                  </div>
                                </div>
                                <p style={{ fontSize: '10px', color: '#4b5563', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                                  <strong>Action:</strong> {task.action}
                                </p>
                                <div style={{
                                  padding: '8px',
                                  background: 'rgba(139, 0, 5, 0.05)',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(139, 0, 5, 0.1)'
                                }}>
                                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#0A1628', marginBottom: '4px' }}>
                                    📊 DATA SOURCE
                                  </div>
                                  <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.4' }}>
                                    {task.dataSource || `Based on ${persona.equipmentCount} equipment monitoring points in OT Process Events table, analyzing real-time sensor data for speed, flow, pressure, and fault indicators.`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equipment Monitoring */}
                    <div className="chart-card" style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>EQUIPMENT MONITORING</h3>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '10px', lineHeight: '1.5' }}>
                        This persona monitors <strong>{persona.equipmentCount}</strong> equipment asset{persona.equipmentCount !== 1 ? 's' : ''}.
                        Alert status and recommendations are automatically updated based on equipment tag values from the OT Process Events data stream.
                      </div>

                      {/* Equipment List */}
                      {persona.equipmentList && persona.equipmentList.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#0A1628', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Assigned Equipment
                          </div>
                          <div style={{ display: 'grid', gap: '4px' }}>
                            {persona.equipmentList.slice(0, 10).map((eq, idx) => (
                              <div key={idx} style={{
                                padding: '6px 10px',
                                background: '#F9FAFB',
                                borderRadius: '4px',
                                border: '1px solid #E5E7EB',
                                fontSize: '9px',
                                fontWeight: '600',
                                color: '#1f2937'
                              }}>
                                {eq}
                              </div>
                            ))}
                            {persona.equipmentList.length > 10 && (
                              <div style={{
                                padding: '6px 10px',
                                background: '#FEF3C7',
                                borderRadius: '4px',
                                border: '1px solid #F59E0B',
                                fontSize: '9px',
                                fontWeight: '700',
                                color: '#92400E',
                                textAlign: 'center'
                              }}>
                                + {persona.equipmentList.length - 10} more equipment
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#1f2937', marginBottom: '6px' }}>
                            Critical Equipment Tags
                          </div>
                          <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.4' }}>
                            Monitoring speed variability, flow rates, pressure levels, temperature setpoints, and running status across all assigned equipment.
                          </div>
                        </div>
                        <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#1f2937', marginBottom: '6px' }}>
                            Alert Conditions
                          </div>
                          <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.4' }}>
                            Automatic detection of fault codes, downtime events, abnormal sensor readings, and equipment state changes requiring operator action.
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </>
          )}
        </div>
      ) : (
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: `3px solid ${currentUseCase.color}` }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Real-time Monitoring</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Continuous data collection and analysis</div>
            </div>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: `3px solid ${currentUseCase.color}` }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Predictive Analytics</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>AI-powered insights and recommendations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OTMVPSolutions
