import { useState, useEffect } from 'react'
import {
  X, Save, RotateCcw, Eye, AlertCircle, CheckCircle, Loader,
  Users, Layout, Zap, Shield, Palette, Database
} from 'lucide-react'
import AgentsTab from './config-tabs/AgentsTab'
import PagesTab from './config-tabs/PagesTab'
import FeaturesTab from './config-tabs/FeaturesTab'
import PermissionsTab from './config-tabs/PermissionsTab'
import BrandingTab from './config-tabs/BrandingTab'
import DataConnectionsTab from './config-tabs/DataConnectionsTab'

function ProductConfigEditor({ productId, onClose, onSave }) {
  const [config, setConfig] = useState(null)
  const [originalConfig, setOriginalConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('agents')
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [productId])

  useEffect(() => {
    if (config && originalConfig) {
      setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig))
    }
  }, [config, originalConfig])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/config/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setOriginalConfig(JSON.parse(JSON.stringify(data)))
        setError(null)
      } else {
        throw new Error('Failed to load configuration')
      }
    } catch (err) {
      console.error('Error loading config:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate configuration
    const errors = validateConfig(config)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      setSaving(true)
      setValidationErrors({})
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/config/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        const updatedConfig = await response.json()
        setConfig(updatedConfig)
        setOriginalConfig(JSON.parse(JSON.stringify(updatedConfig)))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        if (onSave) onSave(updatedConfig)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save configuration')
      }
    } catch (err) {
      console.error('Error saving config:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all changes?')) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)))
      setValidationErrors({})
    }
  }

  const handlePreview = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/preview/products/${productId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: config })
      })
      
      if (response.ok) {
        const data = await response.json()
        const previewUrl = `${data.url}?previewProduct=${productId}`
        window.open(previewUrl, `preview-${productId}`, 'width=1400,height=900')
      } else {
        throw new Error('Failed to start preview')
      }
    } catch (err) {
      console.error('Error starting preview:', err)
      alert(`Error: ${err.message}`)
    }
  }

  const validateConfig = (cfg) => {
    const errors = {}
    
    if (!cfg.productName || cfg.productName.trim() === '') {
      errors.productName = 'Product name is required'
    }
    
    if (cfg.branding) {
      if (!isValidColor(cfg.branding.primaryColor)) {
        errors.primaryColor = 'Invalid color format'
      }
      if (!isValidColor(cfg.branding.secondaryColor)) {
        errors.secondaryColor = 'Invalid color format'
      }
    }
    
    return errors
  }

  const isValidColor = (color) => {
    return /^#[0-9A-F]{6}$/i.test(color)
  }

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let current = newConfig
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newConfig
    })
  }

  const tabs = [
    { id: 'agents', label: 'Agents', icon: Users },
    { id: 'pages', label: 'Pages & Navigation', icon: Layout },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'data', label: 'Data Connections', icon: Database }
  ]

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Loader size={48} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', fontWeight: '600' }}>Loading configuration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <AlertCircle size={64} color="#EF4444" style={{ marginBottom: '20px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', marginBottom: '12px' }}>
            Error Loading Configuration
          </h3>
          <p style={{ color: '#64748B', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        width: '95%',
        maxWidth: '1400px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '2px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#1E293B',
              marginBottom: '4px',
              letterSpacing: '-0.3px'
            }}>
              Configure Product: {config?.productName}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>
              ID: {config?.productId} • Version: {config?.version}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {hasChanges && (
              <span style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} />
                Unsaved Changes
              </span>
            )}
            {saveSuccess && (
              <span style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle size={14} />
                Saved Successfully
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={24} color="#64748B" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar Tabs */}
          <div style={{
            width: '240px',
            borderRight: '2px solid #E2E8F0',
            padding: '20px',
            background: '#F8FAFC',
            overflowY: 'auto'
          }}>
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    marginBottom: '8px',
                    background: activeTab === tab.id
                      ? 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)'
                      : 'white',
                    color: activeTab === tab.id ? 'white' : '#64748B',
                    border: activeTab === tab.id ? 'none' : '1px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = '#F1F5F9'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = 'white'
                    }
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            {activeTab === 'agents' && (
              <AgentsTab config={config} updateConfig={updateConfig} validationErrors={validationErrors} />
            )}
            {activeTab === 'pages' && (
              <PagesTab config={config} updateConfig={updateConfig} validationErrors={validationErrors} />
            )}
            {activeTab === 'features' && (
              <FeaturesTab config={config} updateConfig={updateConfig} validationErrors={validationErrors} />
            )}
            {activeTab === 'permissions' && (
              <PermissionsTab config={config} updateConfig={updateConfig} validationErrors={validationErrors} />
            )}
            {activeTab === 'branding' && (
              <BrandingTab config={config} updateConfig={updateConfig} validationErrors={validationErrors} />
            )}
            {activeTab === 'data' && (
              <DataConnectionsTab config={config} updateConfig={updateConfig} validationErrors={validationErrors} />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px 32px',
          borderTop: '2px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              style={{
                padding: '12px 24px',
                background: hasChanges ? 'white' : '#F1F5F9',
                color: hasChanges ? '#64748B' : '#94A3B8',
                border: hasChanges ? '2px solid #E2E8F0' : 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <RotateCcw size={16} />
              Reset Changes
            </button>
            <button
              onClick={handlePreview}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <Eye size={16} />
              Preview Changes
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#64748B',
                border: '2px solid #E2E8F0',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              style={{
                padding: '12px 32px',
                background: (saving || !hasChanges)
                  ? '#94A3B8'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: (saving || !hasChanges) ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {saving ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductConfigEditor