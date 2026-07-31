import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CustomAgentsProvider } from './contexts/CustomAgentsContext'
import { ProductConfigProvider } from './contexts/ProductConfigContext'
import Sidebar from './components/Sidebar'

// Landing
import Home from './pages/Home'

// AI Assistant
import DataAgent from './pages/DataAgent'

// Production Intelligence (consolidated)
import ProductionIntelligence from './pages/ProductionIntelligence'

// Legacy pages (kept as routes, removed from sidebar)
import Dashboard from './pages/Dashboard'
import ProductionOps from './pages/ProductionOps'
import ProcessOptimization from './pages/ProcessOptimization'
import Tier1AnalyticalAgents from './pages/Tier1AnalyticalAgents'
import Tier2DiagnosticRCAAgents from './pages/Tier2DiagnosticRCAAgents'
import Tier3PredictivePrescriptiveAgents from './pages/Tier3PredictivePrescriptiveAgents'

// Asset Intelligence
import PlantPerformance from './pages/PlantPerformance'
import OTDataInsights from './pages/OTDataInsights'
import OTProcessInsights from './pages/OTProcessInsights'
import MaintenanceOrders from './pages/MaintenanceOrders'

// Energy Optimisation
import EnergyDashboard from './pages/EnergyDashboard'
import EnergyConsumption from './pages/EnergyConsumption'
import PeakDemandAI from './pages/PeakDemandAI'

// Inventory Optimisation
import StockOverview from './pages/StockOverview'
import MaterialReplenishment from './pages/MaterialReplenishment'
import DemandForecasting from './pages/DemandForecasting'

// Quality Optimisation
import QualityDashboard from './pages/QualityDashboard'
import BatchAnalytics from './pages/BatchAnalytics'
import CIPYieldTracker from './pages/CIPYieldTracker'

// Platform
import DataExplorer from './pages/DataExplorer'
import DataQuality from './pages/DataQuality'
import AppHealth from './pages/AppHealth'

import './App.css'

function App() {
  return (
    <ProductConfigProvider>
      <CustomAgentsProvider>
        <Router>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Routes>
                {/* Landing */}
                <Route path="/" element={<Home />} />

                {/* AI Assistant */}
                <Route path="/data-agent" element={<DataAgent />} />

                {/* Production Intelligence */}
                <Route path="/production-intelligence" element={<ProductionIntelligence />} />
                {/* Legacy routes kept as aliases */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/production-ops" element={<ProductionOps />} />
                <Route path="/schedule-optimisation" element={<ProcessOptimization />} />
                <Route path="/process-optimization" element={<ProcessOptimization />} />
                <Route path="/tier1-analytical-agents" element={<Tier1AnalyticalAgents />} />
                <Route path="/tier2-diagnostic-rca-agents" element={<Tier2DiagnosticRCAAgents />} />
                <Route path="/tier3-predictive-prescriptive-agents" element={<Tier3PredictivePrescriptiveAgents />} />

                {/* Asset Intelligence */}
                <Route path="/plant-performance" element={<PlantPerformance />} />
                <Route path="/ot-data-insights" element={<OTDataInsights />} />
                <Route path="/ot-process-insights" element={<OTProcessInsights />} />
                <Route path="/maintenance-orders" element={<MaintenanceOrders />} />

                {/* Energy Optimisation */}
                <Route path="/energy-dashboard" element={<EnergyDashboard />} />
                <Route path="/energy-consumption" element={<EnergyConsumption />} />
                <Route path="/peak-demand" element={<PeakDemandAI />} />

                {/* Inventory Optimisation */}
                <Route path="/stock-overview" element={<StockOverview />} />
                <Route path="/replenishment" element={<MaterialReplenishment />} />
                <Route path="/demand-forecasting" element={<DemandForecasting />} />

                {/* Quality Optimisation */}
                <Route path="/quality-dashboard" element={<QualityDashboard />} />
                <Route path="/batch-analytics" element={<BatchAnalytics />} />
                <Route path="/cip-yield" element={<CIPYieldTracker />} />

                {/* Platform */}
                <Route path="/data-explorer" element={<DataExplorer />} />
                <Route path="/data-quality" element={<DataQuality />} />
                <Route path="/app-health" element={<AppHealth />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CustomAgentsProvider>
    </ProductConfigProvider>
  )
}

export default App
