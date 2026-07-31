import '../../pages/Dashboard.css'
import '../../pages/AIStudioLab.css'

function BrandingTab({ config, updateConfig, validationErrors }) {
  return (
    <div>
      <div className="chart-card" style={{ padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="ai-studio-card-header" style={{ fontSize: '13px', fontWeight: '700', color: '#1F1F1F', margin: '0 0 4px 0' }}>
              BRANDING & APPEARANCE
            </h3>
            <p className="ai-studio-text" style={{ fontSize: '11px', color: '#6B6B6B', margin: 0 }}>
              Customize the look and feel of your product
            </p>
          </div>
          <div style={{
            padding: '6px 12px',
            background: '#E5E7EB',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#6B7280'
          }}>
            {config.branding.name ? 'Configured' : 'Not Set'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {/* Product Name */}
        <div className="chart-card" style={{ padding: '12px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px', textTransform: 'uppercase' }}>
            Product Display Name
          </label>
          <input
            type="text"
            value={config.branding.name}
            onChange={(e) => updateConfig('branding.name', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: `1px solid ${validationErrors.productName ? '#9CA3AF' : '#E2E8F0'}`,
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#1E293B'
            }}
            placeholder="Enter product display name"
          />
          {validationErrors.productName && (
            <p style={{ color: '#EF4444', fontSize: '10px', marginTop: '4px', fontWeight: '600' }}>
              {validationErrors.productName}
            </p>
          )}
        </div>

        {/* Colors */}
        <div className="chart-card" style={{ padding: '12px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '10px', textTransform: 'uppercase' }}>
            Color Scheme
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {/* Primary Color */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Primary Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={config.branding.primaryColor}
                  onChange={(e) => updateConfig('branding.primaryColor', e.target.value)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={config.branding.primaryColor}
                    onChange={(e) => updateConfig('branding.primaryColor', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${validationErrors.primaryColor ? '#EF4444' : '#E2E8F0'}`,
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}
                    placeholder="#3B82F6"
                  />
                  {validationErrors.primaryColor && (
                    <p style={{ color: '#EF4444', fontSize: '10px', marginTop: '2px' }}>
                      {validationErrors.primaryColor}
                    </p>
                  )}
                </div>
              </div>
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: config.branding.primaryColor,
                borderRadius: '6px',
                textAlign: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700'
              }}>
                Preview
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Secondary Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={config.branding.secondaryColor}
                  onChange={(e) => updateConfig('branding.secondaryColor', e.target.value)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={config.branding.secondaryColor}
                    onChange={(e) => updateConfig('branding.secondaryColor', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${validationErrors.secondaryColor ? '#EF4444' : '#E2E8F0'}`,
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}
                    placeholder="#1E40AF"
                  />
                  {validationErrors.secondaryColor && (
                    <p style={{ color: '#EF4444', fontSize: '10px', marginTop: '2px' }}>
                      {validationErrors.secondaryColor}
                    </p>
                  )}
                </div>
              </div>
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: config.branding.secondaryColor,
                borderRadius: '6px',
                textAlign: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700'
              }}>
                Preview
              </div>
            </div>
          </div>
        </div>

        {/* Logo & Favicon */}
        <div className="chart-card" style={{ padding: '12px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '10px', textTransform: 'uppercase' }}>
            Logo & Favicon
          </h4>

          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Logo URL (Optional)
              </label>
              <input
                type="text"
                value={config.branding.logo || ''}
                onChange={(e) => updateConfig('branding.logo', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Favicon URL (Optional)
              </label>
              <input
                type="text"
                value={config.branding.favicon || ''}
                onChange={(e) => updateConfig('branding.favicon', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
                placeholder="https://example.com/favicon.ico"
              />
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="chart-card" style={{
          padding: '12px',
          background: `linear-gradient(135deg, ${config.branding.primaryColor} 0%, ${config.branding.secondaryColor} 100%)`,
          color: 'white'
        }}>
          <h4 style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
            Branding Preview
          </h4>
          <p style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
            {config.branding.name}
          </p>
        </div>
      </div>
    </div>
  )
}

export default BrandingTab