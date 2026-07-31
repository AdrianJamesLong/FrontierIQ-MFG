import { createContext, useContext, useState, useEffect } from 'react'

const ProductConfigContext = createContext(null)

export function ProductConfigProvider({ children }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadConfig = async () => {
    try {
      setLoading(true)
      
      // Check if we're in preview mode with a specific product
      const urlParams = new URLSearchParams(window.location.search)
      const previewProduct = urlParams.get('previewProduct')
      
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      let apiUrl = `${BASE}/api/config/current`
      if (previewProduct) {
        // Load specific product for preview
        apiUrl = `${BASE}/api/config/products/${previewProduct}`
      }
      
      const response = await fetch(apiUrl)
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setError(null)
      } else {
        // No active product, use platform mode
        setConfig({
          mode: 'platform',
          productId: null,
          productName: 'Platform Mode'
        })
      }
    } catch (err) {
      console.error('Error loading product config:', err)
      setError(err.message)
      // Fallback to platform mode on error
      setConfig({
        mode: 'platform',
        productId: null,
        productName: 'Platform Mode'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const reloadConfig = () => {
    return loadConfig()
  }

  const isFeatureEnabled = (feature) => {
    if (!config || config.mode === 'platform') return true
    return config.ui?.features?.[feature] ?? false
  }

  const getEnabledAgents = () => {
    if (!config || config.mode === 'platform') {
      // Return all agents in platform mode
      return [
        'data_agent',
        'performance_analyst',
        'data_quality',
        'line_operations',
        'downtime_rca',
        'bottleneck_constraint',
        'operations_recommendation',
        'executive_briefing'
      ]
    }
    return config.agents?.enabled ?? []
  }

  const isAgentEnabled = (agentSlug) => {
    const enabledAgents = getEnabledAgents()
    return enabledAgents.includes(agentSlug)
  }

  const isPageEnabled = (pagePath) => {
    if (!config || config.mode === 'platform') return true
    const enabledPages = config.ui?.pages?.enabled ?? []
    return enabledPages.some(pattern => {
      if (pattern.endsWith('/*')) {
        return pagePath.startsWith(pattern.slice(0, -2))
      }
      return pagePath === pattern
    })
  }

  const checkPermission = (capability) => {
    if (!config || config.mode === 'platform') return true
    return config.permissions?.capabilities?.[capability] ?? false
  }

  const getBranding = () => {
    if (!config || config.mode === 'platform') {
      return {
        name: 'Manufacturing Intelligence and Optimization',
        primaryColor: '#1C3668',
        secondaryColor: '#0A1628'
      }
    }
    return config.branding ?? {}
  }

  const value = {
    config,
    loading,
    error,
    reloadConfig,
    isFeatureEnabled,
    getEnabledAgents,
    isAgentEnabled,
    isPageEnabled,
    checkPermission,
    getBranding,
    isPlatformMode: !config || config.mode === 'platform',
    isProductMode: config && config.mode === 'product'
  }

  return (
    <ProductConfigContext.Provider value={value}>
      {children}
    </ProductConfigContext.Provider>
  )
}

export function useProductConfig() {
  const context = useContext(ProductConfigContext)
  if (!context) {
    throw new Error('useProductConfig must be used within ProductConfigProvider')
  }
  return context
}