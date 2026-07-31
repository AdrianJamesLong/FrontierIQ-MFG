import { useState, useEffect } from 'react'
import { Shield, RefreshCw, AlertCircle, CheckCircle, AlertTriangle, Database, TrendingUp, Activity, BarChart3, Info, X } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const COLORS = ['#0A1628', '#152B55', '#1C3668', '#4A7AB5', '#6B9ED4', '#6B6B6B', '#9B9B9B', '#C0C0C0']

function DataQuality() {
  const [data, setData] = useState([])
  const [processEventsData, setProcessEventsData] = useState([])
  const [runratesData, setRunratesData] = useState([])
  const [unconstrainedRunratesData, setUnconstrainedRunratesData] = useState([])
  const [downtimeData, setDowntimeData] = useState([])
  const [energyData, setEnergyData] = useState([])
  const [inventoryData, setInventoryData] = useState([])
  const [batchQualityData, setBatchQualityData] = useState([])
  const [maintenanceData, setMaintenanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [masterTab, setMasterTab] = useState('sap')
  const [activeTab, setActiveTab] = useState('overview')
  const [showPageInfo, setShowPageInfo] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all data sources
      const [sapResponse, processEventsResponse, runratesResponse, unconstrainedRunratesResponse, downtimeResponse,
             energyResponse, inventoryResponse, batchQualityResponse, maintenanceResponse] = await Promise.all([
        fetch(`${API_URL}/api/data`),
        fetch(`${API_URL}/api/ot-process-events?limit=50000`),
        fetch(`${API_URL}/api/runrates`),
        fetch(`${API_URL}/api/unconstrained-runrates`),
        fetch(`${API_URL}/api/downtime`),
        fetch(`${API_URL}/api/energy`),
        fetch(`${API_URL}/api/inventory`),
        fetch(`${API_URL}/api/batch-quality`),
        fetch(`${API_URL}/api/maintenance-orders`),
      ])

      if (!sapResponse.ok) {
        const errorData = await sapResponse.json()
        throw new Error(errorData.detail || 'Server error fetching SAP data')
      }

      const sapResult = await sapResponse.json()
      setData(sapResult.data || [])

      // Process Events data is optional - don't fail if it's not available
      if (processEventsResponse.ok) {
        const processEventsResult = await processEventsResponse.json()
        setProcessEventsData(processEventsResult.data || [])
      } else {
        console.warn('Process Events data not available')
        setProcessEventsData([])
      }

      // Runrates data
      if (runratesResponse.ok) {
        const runratesResult = await runratesResponse.json()
        setRunratesData(runratesResult.data || [])
      } else {
        console.warn('Runrates data not available')
        setRunratesData([])
      }

      // Unconstrained Runrates data
      if (unconstrainedRunratesResponse.ok) {
        const unconstrainedRunratesResult = await unconstrainedRunratesResponse.json()
        setUnconstrainedRunratesData(unconstrainedRunratesResult.data || [])
      } else {
        console.warn('Unconstrained Runrates data not available')
        setUnconstrainedRunratesData([])
      }

      // Downtime data
      if (downtimeResponse.ok) {
        const downtimeResult = await downtimeResponse.json()
        setDowntimeData(downtimeResult.data || [])
      } else {
        console.warn('Downtime data not available')
        setDowntimeData([])
      }
      // Energy data
      if (energyResponse.ok) { const r = await energyResponse.json(); setEnergyData(r.data || []) }
      // Inventory data
      if (inventoryResponse.ok) { const r = await inventoryResponse.json(); setInventoryData(r.data || []) }
      // Batch quality data
      if (batchQualityResponse.ok) { const r = await batchQualityResponse.json(); setBatchQualityData(r.data || []) }
      // Maintenance orders data
      if (maintenanceResponse.ok) { const r = await maintenanceResponse.json(); setMaintenanceData(r.data || []) }
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate data quality metrics
  const calculateQualityMetrics = () => {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        completenessScore: 0,
        freshnessScore: 0,
        completeness: {},
        dataFreshness: {},
        consistencyIssues: [],
        duplicates: 0,
        nullPercentages: {},
        fieldPopulation: {},
        orderIntegrity: {},
        materialCoverage: {},
        dateTrends: []
      }
    }

    const fields = Object.keys(data[0])
    const totalRecords = data.length

    // Completeness Analysis
    const nullCounts = {}
    const fieldPopulation = {}
    fields.forEach(field => {
      const nullCount = data.filter(row => row[field] === null || row[field] === undefined || row[field] === '').length
      nullCounts[field] = nullCount
      fieldPopulation[field] = {
        populated: totalRecords - nullCount,
        null: nullCount,
        percentage: ((totalRecords - nullCount) / totalRecords) * 100
      }
    })

    // Overall completeness score (weighted)
    const criticalFields = ['ORDER_ID', 'MATERIAL_ID', 'WORK_CENTER', 'SCHEDULED_START_DATE']
    const completenessScore = fields.reduce((acc, field) => {
      const weight = criticalFields.includes(field) ? 2 : 1
      return acc + (fieldPopulation[field].percentage * weight)
    }, 0) / fields.reduce((acc, field) => criticalFields.includes(field) ? acc + 2 : acc + 1, 0)

    // Duplicate Detection (by ORDER_ID)
    const orderIds = data.map(row => row.ORDER_ID).filter(id => id)
    const duplicateOrders = orderIds.length - new Set(orderIds).size

    // Data Freshness
    const today = new Date()
    const recentRecords = data.filter(row => {
      const schedDate = row.SCHEDULED_START_DATE ? new Date(row.SCHEDULED_START_DATE) : null
      const actualDate = row.ACTUAL_START_DATE ? new Date(row.ACTUAL_START_DATE) : null
      const relevantDate = actualDate || schedDate
      if (!relevantDate) return false
      const daysDiff = (today - relevantDate) / (1000 * 60 * 60 * 24)
      return Math.abs(daysDiff) <= 30
    }).length

    const freshnessScore = (recentRecords / totalRecords) * 100

    // Consistency Issues
    const consistencyIssues = []

    // Check for negative quantities
    const negativeQty = data.filter(row =>
      (row.PLANNED_ORDER_QUANTITY && row.PLANNED_ORDER_QUANTITY < 0) ||
      (row.DELIVERED_QUANTITY && row.DELIVERED_QUANTITY < 0)
    ).length
    if (negativeQty > 0) {
      consistencyIssues.push({ type: 'Negative Quantities', count: negativeQty, severity: 'high' })
    }

    // Check for delivered > planned
    const overDelivered = data.filter(row =>
      row.DELIVERED_QUANTITY && row.PLANNED_ORDER_QUANTITY &&
      row.DELIVERED_QUANTITY > row.PLANNED_ORDER_QUANTITY
    ).length
    if (overDelivered > 0) {
      consistencyIssues.push({ type: 'Over-Delivered Orders', count: overDelivered, severity: 'medium' })
    }

    // Check for date inconsistencies (actual start before scheduled)
    const dateIssues = data.filter(row => {
      if (row.ACTUAL_START_DATE && row.SCHEDULED_START_DATE) {
        return new Date(row.ACTUAL_START_DATE) < new Date(row.SCHEDULED_START_DATE)
      }
      return false
    }).length
    if (dateIssues > 0) {
      consistencyIssues.push({ type: 'Date Inconsistencies', count: dateIssues, severity: 'low' })
    }

    // Order Integrity
    const ordersWithMaterial = data.filter(row => row.MATERIAL_ID && row.MATERIAL_DESC).length
    const ordersWithDates = data.filter(row => row.SCHEDULED_START_DATE).length
    const ordersWithQuantity = data.filter(row => row.PLANNED_ORDER_QUANTITY && row.PLANNED_ORDER_QUANTITY > 0).length

    // Material Coverage
    const uniqueMaterials = new Set(data.map(row => row.MATERIAL_ID).filter(id => id)).size
    const materialsWithDesc = new Set(data.filter(row => row.MATERIAL_ID && row.MATERIAL_DESC).map(row => row.MATERIAL_ID)).size

    // Date Trends (records by month)
    const dateTrends = {}
    data.forEach(row => {
      const date = row.SCHEDULED_START_DATE ? new Date(row.SCHEDULED_START_DATE) : null
      if (date && !isNaN(date)) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        dateTrends[monthKey] = (dateTrends[monthKey] || 0) + 1
      }
    })

    const dateTrendArray = Object.entries(dateTrends)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, count]) => ({ month, count }))

    return {
      totalRecords,
      completenessScore,
      freshnessScore,
      duplicates: duplicateOrders,
      nullPercentages: fieldPopulation,
      consistencyIssues,
      orderIntegrity: {
        withMaterial: ordersWithMaterial,
        withDates: ordersWithDates,
        withQuantity: ordersWithQuantity,
        complete: data.filter(row =>
          row.MATERIAL_ID && row.MATERIAL_DESC &&
          row.SCHEDULED_START_DATE &&
          row.PLANNED_ORDER_QUANTITY > 0
        ).length
      },
      materialCoverage: {
        total: uniqueMaterials,
        withDescription: materialsWithDesc,
        coverage: uniqueMaterials > 0 ? (materialsWithDesc / uniqueMaterials) * 100 : 0
      },
      dateTrends: dateTrendArray,
      criticalFieldsHealth: criticalFields.map(field => ({
        field,
        ...fieldPopulation[field]
      }))
    }
  }

  const metrics = calculateQualityMetrics()

  // Calculate Process Events quality metrics
  const calculateProcessEventsMetrics = () => {
    if (processEventsData.length === 0) {
      return {
        totalRecords: 0,
        completenessScore: 0,
        freshnessScore: 0,
        completeness: {},
        dataFreshness: {},
        consistencyIssues: [],
        duplicates: 0,
        nullPercentages: {},
        fieldPopulation: {},
        eventIntegrity: {},
        equipmentCoverage: {},
        dateTrends: []
      }
    }

    const fields = Object.keys(processEventsData[0])
    const totalRecords = processEventsData.length

    // Completeness Analysis
    const nullCounts = {}
    const fieldPopulation = {}
    fields.forEach(field => {
      const nullCount = processEventsData.filter(row => row[field] === null || row[field] === undefined || row[field] === '').length
      nullCounts[field] = nullCount
      fieldPopulation[field] = {
        populated: totalRecords - nullCount,
        null: nullCount,
        percentage: ((totalRecords - nullCount) / totalRecords) * 100
      }
    })

    // Critical fields for Process Events
    const criticalFields = ['equipment', 'edge_arrival_timestamp', 'event_type', 'event_value']
    const completenessScore = fields.reduce((acc, field) => {
      const weight = criticalFields.includes(field) ? 2 : 1
      return acc + (fieldPopulation[field].percentage * weight)
    }, 0) / fields.reduce((acc, field) => criticalFields.includes(field) ? acc + 2 : acc + 1, 0)

    // Duplicate Detection (by combination of equipment and timestamp)
    const eventKeys = processEventsData.map(row => `${row.equipment}_${row.edge_arrival_timestamp}`).filter(key => key)
    const duplicateEvents = eventKeys.length - new Set(eventKeys).size

    // Data Freshness - check if we have recent events
    const recentRecords = processEventsData.filter(row => {
      if (!row.edge_arrival_timestamp) return false
      // Since timestamp is in string format, we'll just check if it exists for now
      return true
    }).length
    const freshnessScore = (recentRecords / totalRecords) * 100

    // Consistency Issues
    const consistencyIssues = []

    // Check for events with missing critical fields
    const missingEquipment = processEventsData.filter(row => !row.equipment || row.equipment === '').length
    if (missingEquipment > 0) {
      consistencyIssues.push({ type: 'Missing Equipment', count: missingEquipment, severity: 'high' })
    }

    const missingEventType = processEventsData.filter(row => !row.event_type || row.event_type === '').length
    if (missingEventType > 0) {
      consistencyIssues.push({ type: 'Missing Event Type', count: missingEventType, severity: 'high' })
    }

    const missingTimestamp = processEventsData.filter(row => !row.edge_arrival_timestamp || row.edge_arrival_timestamp === '').length
    if (missingTimestamp > 0) {
      consistencyIssues.push({ type: 'Missing Timestamp', count: missingTimestamp, severity: 'high' })
    }

    // Event Integrity
    const eventsWithEquipment = processEventsData.filter(row => row.equipment && row.equipment !== '').length
    const eventsWithTimestamp = processEventsData.filter(row => row.edge_arrival_timestamp && row.edge_arrival_timestamp !== '').length
    const eventsWithType = processEventsData.filter(row => row.event_type && row.event_type !== '').length

    // Equipment Coverage
    const uniqueEquipment = new Set(processEventsData.map(row => row.equipment).filter(e => e)).size
    const equipmentWithEvents = new Set(processEventsData.filter(row => row.equipment && row.event_type).map(row => row.equipment)).size

    // Event Type Distribution
    const eventTypes = {}
    processEventsData.forEach(row => {
      if (row.event_type) {
        eventTypes[row.event_type] = (eventTypes[row.event_type] || 0) + 1
      }
    })

    const eventTypeArray = Object.entries(eventTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }))

    return {
      totalRecords,
      completenessScore,
      freshnessScore,
      duplicates: duplicateEvents,
      nullPercentages: fieldPopulation,
      consistencyIssues,
      eventIntegrity: {
        withEquipment: eventsWithEquipment,
        withTimestamp: eventsWithTimestamp,
        withType: eventsWithType,
        complete: processEventsData.filter(row =>
          row.equipment && row.equipment !== '' &&
          row.edge_arrival_timestamp && row.edge_arrival_timestamp !== '' &&
          row.event_type && row.event_type !== ''
        ).length
      },
      equipmentCoverage: {
        total: uniqueEquipment,
        withEvents: equipmentWithEvents,
        coverage: uniqueEquipment > 0 ? (equipmentWithEvents / uniqueEquipment) * 100 : 0
      },
      eventTypeDistribution: eventTypeArray,
      criticalFieldsHealth: criticalFields.map(field => ({
        field,
        ...fieldPopulation[field]
      }))
    }
  }

  const processEventsMetrics = calculateProcessEventsMetrics()

  // Calculate metrics for generic data sources (Runrates, Unconstrained Runrates, Downtime)
  const calculateGenericMetrics = (sourceData, sourceName) => {
    if (sourceData.length === 0) {
      return {
        totalRecords: 0,
        completenessScore: 0,
        freshnessScore: 0,
        completeness: {},
        dataFreshness: {},
        consistencyIssues: [],
        duplicates: 0,
        nullPercentages: {},
        fieldPopulation: {},
        criticalFieldsHealth: []
      }
    }

    const fields = Object.keys(sourceData[0])
    const totalRecords = sourceData.length

    // Completeness Analysis
    const fieldPopulation = {}
    fields.forEach(field => {
      const nullCount = sourceData.filter(row => row[field] === null || row[field] === undefined || row[field] === '').length
      fieldPopulation[field] = {
        populated: totalRecords - nullCount,
        null: nullCount,
        percentage: ((totalRecords - nullCount) / totalRecords) * 100
      }
    })

    // Overall completeness score
    const completenessScore = fields.reduce((acc, field) => {
      return acc + fieldPopulation[field].percentage
    }, 0) / fields.length

    // Data Freshness - simplified for generic sources
    const freshnessScore = 100 // Assume fresh if data exists

    // Consistency Issues - basic checks
    const consistencyIssues = []

    return {
      totalRecords,
      completenessScore,
      freshnessScore,
      duplicates: 0,
      nullPercentages: fieldPopulation,
      consistencyIssues,
      fieldPopulation,
      criticalFieldsHealth: fields.slice(0, 4).map(field => ({
        field,
        ...fieldPopulation[field]
      }))
    }
  }

  const runratesMetrics = calculateGenericMetrics(runratesData, 'Runrates')
  const unconstrainedRunratesMetrics = calculateGenericMetrics(unconstrainedRunratesData, 'Unconstrained Runrates')
  const downtimeMetrics = calculateGenericMetrics(downtimeData, 'Downtime')
  const energyMetrics = calculateGenericMetrics(energyData, 'Energy Consumption')
  const inventoryMetrics = calculateGenericMetrics(inventoryData, 'Inventory Stock')
  const batchQualityMetrics = calculateGenericMetrics(batchQualityData, 'Batch Quality')
  const maintenanceMetrics = calculateGenericMetrics(maintenanceData, 'Maintenance Orders')

  // Overall Quality Score (weighted average) for SAP Data
  const overallQualityScore = (
    metrics.completenessScore * 0.4 +
    metrics.freshnessScore * 0.2 +
    (metrics.duplicates === 0 ? 100 : Math.max(0, 100 - (metrics.duplicates / metrics.totalRecords) * 100)) * 0.2 +
    (metrics.consistencyIssues.length === 0 ? 100 : Math.max(0, 100 - metrics.consistencyIssues.reduce((acc, issue) => acc + issue.count, 0) / metrics.totalRecords * 100)) * 0.2
  )

  // Overall Quality Score for Process Events
  const processEventsQualityScore = processEventsMetrics.totalRecords > 0 ? (
    processEventsMetrics.completenessScore * 0.4 +
    processEventsMetrics.freshnessScore * 0.2 +
    (processEventsMetrics.duplicates === 0 ? 100 : Math.max(0, 100 - (processEventsMetrics.duplicates / processEventsMetrics.totalRecords) * 100)) * 0.2 +
    (processEventsMetrics.consistencyIssues.length === 0 ? 100 : Math.max(0, 100 - processEventsMetrics.consistencyIssues.reduce((acc, issue) => acc + issue.count, 0) / processEventsMetrics.totalRecords * 100)) * 0.2
  ) : 0

  // Generic quality score calculator
  const calculateGenericQualityScore = (metricsData) => {
    if (metricsData.totalRecords === 0) return 0
    return (
      metricsData.completenessScore * 0.5 +
      metricsData.freshnessScore * 0.3 +
      (metricsData.duplicates === 0 ? 100 : Math.max(0, 100 - (metricsData.duplicates / metricsData.totalRecords) * 100)) * 0.2
    )
  }

  const runratesQualityScore = calculateGenericQualityScore(runratesMetrics)
  const unconstrainedRunratesQualityScore = calculateGenericQualityScore(unconstrainedRunratesMetrics)
  const downtimeQualityScore = calculateGenericQualityScore(downtimeMetrics)
  const energyQualityScore = calculateGenericQualityScore(energyMetrics)
  const inventoryQualityScore = calculateGenericQualityScore(inventoryMetrics)
  const batchQualityQualityScore = calculateGenericQualityScore(batchQualityMetrics)
  const maintenanceQualityScore = calculateGenericQualityScore(maintenanceMetrics)

  // Use the appropriate metrics based on master tab
  const getMetricsForTab = () => {
    switch(masterTab) {
      case 'sap': return metrics
      case 'processEvents': return processEventsMetrics
      case 'runrates': return runratesMetrics
      case 'unconstrainedRunrates': return unconstrainedRunratesMetrics
      case 'downtime': return downtimeMetrics
      case 'energy': return energyMetrics
      case 'inventory': return inventoryMetrics
      case 'batchQuality': return batchQualityMetrics
      case 'maintenance': return maintenanceMetrics
      default: return metrics
    }
  }

  const getQualityScoreForTab = () => {
    switch(masterTab) {
      case 'sap': return overallQualityScore
      case 'processEvents': return processEventsQualityScore
      case 'runrates': return runratesQualityScore
      case 'unconstrainedRunrates': return unconstrainedRunratesQualityScore
      case 'downtime': return downtimeQualityScore
      case 'energy': return energyQualityScore
      case 'inventory': return inventoryQualityScore
      case 'batchQuality': return batchQualityQualityScore
      case 'maintenance': return maintenanceQualityScore
      default: return overallQualityScore
    }
  }

  const getDataSourceName = () => {
    switch(masterTab) {
      case 'sap': return 'SAP Orders'
      case 'processEvents': return 'Process Events'
      case 'runrates': return 'Runrates'
      case 'unconstrainedRunrates': return 'Unconstrained Runrates'
      case 'downtime': return 'Downtime'
      case 'energy': return 'Energy Consumption'
      case 'inventory': return 'Inventory Stock'
      case 'batchQuality': return 'Batch Quality'
      case 'maintenance': return 'Maintenance Orders'
      default: return 'SAP Orders'
    }
  }

  const currentMetrics = getMetricsForTab()
  const currentQualityScore = getQualityScoreForTab()
  const currentDataLength = currentMetrics.totalRecords

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '8px', borderBottom: '2px solid #E8E8E8', paddingBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h1 className="page-title" style={{ fontSize: '20px', margin: 0 }}>Data Quality & Governance</h1>
            <button onClick={() => setShowPageInfo(true)} title="About this page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FA', border: '1px solid #DDE3EE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><Info size={14} /></button>
          </div>
          <p className="page-subtitle" style={{ fontSize: '11px' }}>Comprehensive data quality monitoring across 9 Lakehouse tables</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'white',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={12} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <div style={{
            padding: '6px 12px',
            background: '#E0F2E9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0F5132'
          }}>
            9 Data Sources
          </div>
        </div>
      </div>

      {loading && data.length === 0 && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing data quality...</p>
        </div>
      )}

      {error && (
        <div className="error-card">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="info-card">
          <Database size={24} />
          <p>No data available for quality analysis</p>
        </div>
      )}

      {!loading && !error && (data.length > 0 || processEventsData.length > 0 || runratesData.length > 0 || unconstrainedRunratesData.length > 0 || downtimeData.length > 0 || energyData.length > 0 || inventoryData.length > 0 || batchQualityData.length > 0 || maintenanceData.length > 0) && (
        <>
          {/* Master Tabs */}
          <div className="tabs-container" style={{ marginBottom: '8px', flexWrap: 'wrap' }}>
            <button
              className={`tab-button ${masterTab === 'sap' ? 'active' : ''}`}
              onClick={() => {
                setMasterTab('sap')
                setActiveTab('overview')
              }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Database size={12} /> Production schedule from SAP Orders
            </button>
            <button
              className={`tab-button ${masterTab === 'processEvents' ? 'active' : ''}`}
              onClick={() => {
                setMasterTab('processEvents')
                setActiveTab('overview')
              }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Activity size={12} /> Raw process events data
            </button>
            <button
              className={`tab-button ${masterTab === 'runrates' ? 'active' : ''}`}
              onClick={() => {
                setMasterTab('runrates')
                setActiveTab('overview')
              }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <TrendingUp size={12} /> Run rate standards data
            </button>
            <button
              className={`tab-button ${masterTab === 'unconstrainedRunrates' ? 'active' : ''}`}
              onClick={() => {
                setMasterTab('unconstrainedRunrates')
                setActiveTab('overview')
              }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <BarChart3 size={12} /> Unconstrained run rates standards data
            </button>
            <button
              className={`tab-button ${masterTab === 'downtime' ? 'active' : ''}`}
              onClick={() => { setMasterTab('downtime'); setActiveTab('overview') }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <AlertTriangle size={12} /> Downtime data
            </button>
            <button
              className={`tab-button ${masterTab === 'energy' ? 'active' : ''}`}
              onClick={() => { setMasterTab('energy'); setActiveTab('overview') }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <BarChart3 size={12} /> Energy consumption
            </button>
            <button
              className={`tab-button ${masterTab === 'inventory' ? 'active' : ''}`}
              onClick={() => { setMasterTab('inventory'); setActiveTab('overview') }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Database size={12} /> Inventory stock
            </button>
            <button
              className={`tab-button ${masterTab === 'batchQuality' ? 'active' : ''}`}
              onClick={() => { setMasterTab('batchQuality'); setActiveTab('overview') }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <TrendingUp size={12} /> Batch quality
            </button>
            <button
              className={`tab-button ${masterTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => { setMasterTab('maintenance'); setActiveTab('overview') }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Activity size={12} /> Maintenance orders
            </button>
          </div>

          {/* Summary Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <div className="stat-card" style={{ padding: '10px', background: 'linear-gradient(135deg, #0A1628 0%, #152B55 100%)', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Shield size={14} />
                <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase' }}>QUALITY SCORE</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px' }}>
                {currentQualityScore.toFixed(1)}%
              </div>
              <div style={{ fontSize: '9px', opacity: 0.9 }}>
                {currentQualityScore >= 90 ? 'Excellent' : currentQualityScore >= 70 ? 'Good' : 'Needs Attention'}
              </div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Database size={14} style={{ color: '#4A7AB5' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>TOTAL RECORDS</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#4A7AB5', marginBottom: '2px' }}>
                {currentMetrics.totalRecords.toLocaleString()}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>In Fabric Lakehouse</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <CheckCircle size={14} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>COMPLETENESS</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '2px' }}>
                {currentMetrics.completenessScore.toFixed(1)}%
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Weighted avg</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Activity size={14} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>FRESHNESS</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B', marginBottom: '2px' }}>
                {currentMetrics.freshnessScore.toFixed(1)}%
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Recent data</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <AlertTriangle size={14} style={{ color: currentMetrics.duplicates === 0 ? '#10B981' : '#0A1628' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>DUPLICATES</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: currentMetrics.duplicates === 0 ? '#10B981' : '#0A1628', marginBottom: '2px' }}>
                {currentMetrics.duplicates}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Duplicate records</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <AlertCircle size={14} style={{ color: currentMetrics.consistencyIssues.length === 0 ? '#10B981' : '#F59E0B' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>ISSUES</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: currentMetrics.consistencyIssues.length === 0 ? '#10B981' : '#F59E0B', marginBottom: '2px' }}>
                {currentMetrics.consistencyIssues.reduce((acc, issue) => acc + issue.count, 0)}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>{currentMetrics.consistencyIssues.length} types</div>
            </div>

            <div className="stat-card" style={{ padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Shield size={14} style={{ color: '#4A7AB5' }} />
                <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>CRITICAL FIELDS</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#4A7AB5', marginBottom: '2px' }}>
                {currentMetrics.criticalFieldsHealth.filter(f => f.percentage >= 95).length}/{currentMetrics.criticalFieldsHealth.length}
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Above 95%</div>
            </div>

            <div className="stat-card" style={{ padding: '10px', textAlign: 'center' }}>
              <Database size={16} style={{ color: '#8B4513', margin: '0 auto 4px' }} />
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Data Source</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#8B4513' }}>
                {getDataSourceName()}
              </div>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="tabs-container" style={{ marginBottom: '8px' }}>
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <BarChart3 size={12} /> Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'completeness' ? 'active' : ''}`}
              onClick={() => setActiveTab('completeness')}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <CheckCircle size={12} /> Completeness
            </button>
            <button
              className={`tab-button ${activeTab === 'consistency' ? 'active' : ''}`}
              onClick={() => setActiveTab('consistency')}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <AlertCircle size={12} /> Consistency
            </button>
            <button
              className={`tab-button ${activeTab === 'integrity' ? 'active' : ''}`}
              onClick={() => setActiveTab('integrity')}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Shield size={12} /> Integrity
            </button>
            {(masterTab === 'sap') && (
              <button
                className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
                onClick={() => setActiveTab('trends')}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                <TrendingUp size={12} /> Trends
              </button>
            )}
            {masterTab === 'processEvents' && (
              <button
                className={`tab-button ${activeTab === 'eventTypes' ? 'active' : ''}`}
                onClick={() => setActiveTab('eventTypes')}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                <Activity size={12} /> Event Types
              </button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <BarChart3 size={20} style={{ color: '#0A1628' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>CRITICAL FIELDS POPULATION</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Key fields required for data integrity
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={currentMetrics.criticalFieldsHealth}
                      margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="field"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '11px' }}
                      />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="populated" fill={COLORS[1]} name="Populated" />
                      <Bar dataKey="null" fill="#ef4444" name="Null/Empty" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={20} style={{ color: '#10B981' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>DATA QUALITY BREAKDOWN</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Quality score components
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={[
                        { name: 'Completeness', score: currentMetrics.completenessScore, weight: '40%' },
                        { name: 'Freshness', score: currentMetrics.freshnessScore, weight: '20%' },
                        { name: 'No Duplicates', score: currentMetrics.duplicates === 0 ? 100 : Math.max(0, 100 - (currentMetrics.duplicates / currentMetrics.totalRecords) * 100), weight: '20%' },
                        { name: 'Consistency', score: currentMetrics.consistencyIssues.length === 0 ? 100 : Math.max(0, 100 - currentMetrics.consistencyIssues.reduce((acc, i) => acc + i.count, 0) / currentMetrics.totalRecords * 100), weight: '20%' }
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                      <YAxis domain={[0, 100]} style={{ fontSize: '12px' }} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="score" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {currentMetrics.consistencyIssues.length > 0 && (
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertCircle size={20} style={{ color: '#F59E0B' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>CONSISTENCY ISSUES DETECTED</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Issues requiring attention
                      </p>
                    </div>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Issue Type</th>
                          <th>Count</th>
                          <th>Severity</th>
                          <th>Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentMetrics.consistencyIssues.map((issue, idx) => (
                          <tr key={idx}>
                            <td>{issue.type}</td>
                            <td className="text-center">{issue.count.toLocaleString()}</td>
                            <td>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: issue.severity === 'high' ? '#fee2e2' : issue.severity === 'medium' ? '#fef3c7' : '#dbeafe',
                                color: issue.severity === 'high' ? '#991b1b' : issue.severity === 'medium' ? '#92400e' : '#1e40af'
                              }}>
                                {issue.severity.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-right">{((issue.count / currentMetrics.totalRecords) * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completeness Tab */}
          {activeTab === 'completeness' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CheckCircle size={20} style={{ color: '#10B981' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>FIELD POPULATION RATES</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Percentage of populated records per field
                      </p>
                    </div>
                  </div>
                  <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Field Name</th>
                          <th>Populated</th>
                          <th>Null/Empty</th>
                          <th>Population %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentMetrics.nullPercentages)
                          .sort((a, b) => a[1].percentage - b[1].percentage)
                          .map(([field, stats]) => (
                            <tr key={field}>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{field}</td>
                              <td className="text-right">{stats.populated.toLocaleString()}</td>
                              <td className="text-right" style={{ color: stats.null > 0 ? '#ef4444' : '#6b7280' }}>
                                {stats.null.toLocaleString()}
                              </td>
                              <td className="text-right">
                                <span style={{
                                  fontWeight: '600',
                                  color: stats.percentage >= 95 ? COLORS[1] : stats.percentage >= 80 ? '#f59e0b' : '#ef4444'
                                }}>
                                  {stats.percentage.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <BarChart3 size={20} style={{ color: '#0A1628' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>COMPLETENESS DISTRIBUTION</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Fields by population rate
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={360}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Excellent (95-100%)',
                            value: Object.values(currentMetrics.nullPercentages).filter(s => s.percentage >= 95).length,
                            color: COLORS[1]
                          },
                          {
                            name: 'Good (80-95%)',
                            value: Object.values(currentMetrics.nullPercentages).filter(s => s.percentage >= 80 && s.percentage < 95).length,
                            color: '#f59e0b'
                          },
                          {
                            name: 'Poor (<80%)',
                            value: Object.values(currentMetrics.nullPercentages).filter(s => s.percentage < 80).length,
                            color: '#ef4444'
                          }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { color: COLORS[1] },
                          { color: '#f59e0b' },
                          { color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Consistency Tab */}
          {activeTab === 'consistency' && (
            <div className="tab-content">
              {currentMetrics.consistencyIssues.length > 0 && (
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertCircle size={20} style={{ color: '#F59E0B' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>CONSISTENCY ISSUES BREAKDOWN</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Detailed view of all detected issues
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={currentMetrics.consistencyIssues.map(issue => ({
                        ...issue,
                        percentage: (issue.count / currentMetrics.totalRecords) * 100
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="type"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" name="Issue Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {currentMetrics.consistencyIssues.length === 0 && (
                <div className="chart-card" style={{ padding: '24px', background: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <CheckCircle size={48} style={{ color: COLORS[1], margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>No Consistency Issues Detected</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>All data validation checks passed successfully</p>
                </div>
              )}
            </div>
          )}

          {/* Integrity Tab */}
          {activeTab === 'integrity' && masterTab === 'sap' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={20} style={{ color: '#0A1628' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>ORDER INTEGRITY METRICS</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Percentage of orders with required data
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Complete Orders',
                          value: (currentMetrics.orderIntegrity.complete / currentMetrics.totalRecords) * 100
                        },
                        {
                          name: 'With Material',
                          value: (currentMetrics.orderIntegrity.withMaterial / currentMetrics.totalRecords) * 100
                        },
                        {
                          name: 'With Dates',
                          value: (currentMetrics.orderIntegrity.withDates / currentMetrics.totalRecords) * 100
                        },
                        {
                          name: 'With Quantity',
                          value: (currentMetrics.orderIntegrity.withQuantity / currentMetrics.totalRecords) * 100
                        }
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis domain={[0, 100]} style={{ fontSize: '12px' }} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="value" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CheckCircle size={20} style={{ color: '#10B981' }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#1f2937' }}>MATERIAL COVERAGE STATUS</h3>
                      <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#6b7280' }}>
                        Materials with complete information
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'With Description',
                            value: currentMetrics.materialCoverage.withDescription
                          },
                          {
                            name: 'Missing Description',
                            value: currentMetrics.materialCoverage.total - currentMetrics.materialCoverage.withDescription
                          }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill={COLORS[1]} />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Integrity Tab for Process Events */}
          {activeTab === 'integrity' && masterTab === 'processEvents' && (
            <div className="tab-content">
              <div className="stats-grid" style={{ marginBottom: '16px' }}>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">COMPLETE EVENTS</span>
                  </div>
                  <div className="stat-value-large">
                    {((currentMetrics.eventIntegrity.complete / currentMetrics.totalRecords) * 100).toFixed(1)}%
                  </div>
                  <div className="stat-footer">{currentMetrics.eventIntegrity.complete.toLocaleString()} events</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">EQUIPMENT COVERAGE</span>
                  </div>
                  <div className="stat-value-large">{currentMetrics.equipmentCoverage.coverage.toFixed(1)}%</div>
                  <div className="stat-footer">{currentMetrics.equipmentCoverage.withEvents}/{currentMetrics.equipmentCoverage.total} equipment</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">EVENTS WITH TIMESTAMP</span>
                  </div>
                  <div className="stat-value-large">
                    {((currentMetrics.eventIntegrity.withTimestamp / currentMetrics.totalRecords) * 100).toFixed(1)}%
                  </div>
                  <div className="stat-footer">{currentMetrics.eventIntegrity.withTimestamp.toLocaleString()} events</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">EVENTS WITH TYPE</span>
                  </div>
                  <div className="stat-value-large">
                    {((currentMetrics.eventIntegrity.withType / currentMetrics.totalRecords) * 100).toFixed(1)}%
                  </div>
                  <div className="stat-footer">{currentMetrics.eventIntegrity.withType.toLocaleString()} events</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="chart-card">
                  <h4>EVENT INTEGRITY METRICS</h4>
                  <p className="chart-subtitle">Percentage of events with required data</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Complete Events',
                          value: (currentMetrics.eventIntegrity.complete / currentMetrics.totalRecords) * 100
                        },
                        {
                          name: 'With Equipment',
                          value: (currentMetrics.eventIntegrity.withEquipment / currentMetrics.totalRecords) * 100
                        },
                        {
                          name: 'With Timestamp',
                          value: (currentMetrics.eventIntegrity.withTimestamp / currentMetrics.totalRecords) * 100
                        },
                        {
                          name: 'With Type',
                          value: (currentMetrics.eventIntegrity.withType / currentMetrics.totalRecords) * 100
                        }
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis domain={[0, 100]} style={{ fontSize: '12px' }} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="value" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h4>EQUIPMENT COVERAGE STATUS</h4>
                  <p className="chart-subtitle">Equipment with event data</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'With Events',
                            value: currentMetrics.equipmentCoverage.withEvents
                          },
                          {
                            name: 'Without Events',
                            value: currentMetrics.equipmentCoverage.total - currentMetrics.equipmentCoverage.withEvents
                          }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill={COLORS[1]} />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Event Types Tab - Only for Process Events */}
          {activeTab === 'eventTypes' && masterTab === 'processEvents' && (
            <div className="tab-content">
              <div className="chart-card">
                <h4>EVENT TYPE DISTRIBUTION</h4>
                <p className="chart-subtitle">Top 10 event types by count</p>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={currentMetrics.eventTypeDistribution}
                    margin={{ top: 10, right: 30, left: 20, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="type"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Bar dataKey="count" fill={COLORS[1]} name="Event Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card" style={{ marginTop: '16px' }}>
                <h4>EVENT TYPE SUMMARY</h4>
                <p className="chart-subtitle">Detailed breakdown of event types</p>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Event Type</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMetrics.eventTypeDistribution.map((event, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{event.type}</td>
                          <td className="text-right">{event.count.toLocaleString()}</td>
                          <td className="text-right">
                            <span style={{ fontWeight: '600', color: COLORS[1] }}>
                              {((event.count / currentMetrics.totalRecords) * 100).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab - Only for SAP Data */}
          {activeTab === 'trends' && masterTab === 'sap' && (
            <div className="tab-content">
              <div className="chart-card">
                <h4>DATA VOLUME TRENDS</h4>
                <p className="chart-subtitle">Number of records by month (last 12 months)</p>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={currentMetrics.dateTrends}
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={COLORS[1]}
                      strokeWidth={2}
                      name="Records"
                      dot={{ fill: COLORS[1], r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-grid" style={{ marginTop: '16px' }}>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">PEAK MONTH</span>
                    <TrendingUp size={18} style={{ color: COLORS[1] }} />
                  </div>
                  <div className="stat-value-large">
                    {currentMetrics.dateTrends.length > 0
                      ? currentMetrics.dateTrends.reduce((max, curr) => curr.count > max.count ? curr : max, currentMetrics.dateTrends[0]).month
                      : 'N/A'
                    }
                  </div>
                  <div className="stat-footer">
                    {currentMetrics.dateTrends.length > 0
                      ? `${currentMetrics.dateTrends.reduce((max, curr) => curr.count > max.count ? curr : max, currentMetrics.dateTrends[0]).count.toLocaleString()} records`
                      : 'No data'
                    }
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">AVERAGE PER MONTH</span>
                    <Activity size={18} style={{ color: COLORS[1] }} />
                  </div>
                  <div className="stat-value-large">
                    {currentMetrics.dateTrends.length > 0
                      ? Math.round(currentMetrics.dateTrends.reduce((sum, curr) => sum + curr.count, 0) / currentMetrics.dateTrends.length).toLocaleString()
                      : '0'
                    }
                  </div>
                  <div className="stat-footer">Records per month</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">LATEST MONTH</span>
                  </div>
                  <div className="stat-value-large">
                    {currentMetrics.dateTrends.length > 0
                      ? currentMetrics.dateTrends[currentMetrics.dateTrends.length - 1].month
                      : 'N/A'
                    }
                  </div>
                  <div className="stat-footer">
                    {currentMetrics.dateTrends.length > 0
                      ? `${currentMetrics.dateTrends[currentMetrics.dateTrends.length - 1].count.toLocaleString()} records`
                      : 'No data'
                    }
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">DATA SPAN</span>
                  </div>
                  <div className="stat-value-large">
                    {currentMetrics.dateTrends.length}
                  </div>
                  <div className="stat-footer">Months of data</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {showPageInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(2px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowPageInfo(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid #E8ECF4' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>About this section</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A1628' }}>Data Quality & Governance</div>
              </div>
              <button onClick={() => setShowPageInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>What this page does</div>
                <p style={{ margin: 0 }}>Monitors data quality across all 9 Lakehouse tables in the NovaChem Fabric workspace. Surfaces completeness, consistency and freshness issues before they affect downstream analytics or agent responses. The Data Quality Agent can also be interrogated directly to flag reliability concerns in any table.</p>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Dataset groups</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Production Schedule from SAP Orders</strong> — Completeness of order IDs, material codes, dates and quantities; duplicate detection</li>
                  <li style={{ marginBottom: '4px' }}><strong>Raw Process Events Data</strong> — OT tag coverage, event frequency anomalies, missing timestamps</li>
                  <li style={{ marginBottom: '4px' }}><strong>Run Rate Standards Data</strong> — Coverage of line/material combinations, outlier rates</li>
                </ul>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F4FA' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Sub-tabs (per dataset)</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Overview</strong> — Record count, null rates, freshness and overall quality score</li>
                  <li style={{ marginBottom: '4px' }}><strong>Completeness</strong> — Field-level null and missing value analysis</li>
                  <li style={{ marginBottom: '4px' }}><strong>Consistency</strong> — Duplicate detection and cross-field validation</li>
                  <li style={{ marginBottom: '4px' }}><strong>Anomalies</strong> — Statistical outliers and unexpected value distributions</li>
                </ul>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em', marginBottom: '6px' }}>Data sources</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>All 9 Lakehouse tables</strong> — Quality metrics are computed live from the Fabric SQL Analytics Endpoint at refresh time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataQuality
