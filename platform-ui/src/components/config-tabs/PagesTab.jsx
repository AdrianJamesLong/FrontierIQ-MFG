import '../../pages/Dashboard.css'
import '../../pages/AIStudioLab.css'

function PagesTab({ config, updateConfig, validationErrors }) {
  const allPages = [
    { path: '/', name: 'Home Dashboard' },
    { path: '/production-ops', name: 'Production Operations' },
    { path: '/data-agent', name: 'Data Agent' },
    { path: '/platform-control', name: 'Platform Control' },
    { path: '/settings', name: 'Settings' }
  ]

  const togglePage = (path) => {
    const isEnabled = config.ui.pages.enabled.includes(path)

    if (isEnabled) {
      updateConfig('ui.pages.enabled', config.ui.pages.enabled.filter(p => p !== path))
      updateConfig('ui.pages.disabled', [...config.ui.pages.disabled, path])
    } else {
      updateConfig('ui.pages.enabled', [...config.ui.pages.enabled, path])
      updateConfig('ui.pages.disabled', config.ui.pages.disabled.filter(p => p !== path))
    }
  }

  const toggleSidebarSection = (sectionId) => {
    const sections = config.ui.navigation.sidebar.sections
    const sectionIndex = sections.findIndex(s => s.id === sectionId)

    if (sectionIndex >= 0) {
      const newSections = [...sections]
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        enabled: !newSections[sectionIndex].enabled
      }
      updateConfig('ui.navigation.sidebar.sections', newSections)
    }
  }

  const enabledPagesCount = config.ui.pages.enabled.length
  const totalPagesCount = allPages.length
  const enabledSectionsCount = config.ui.navigation.sidebar.sections.filter(s => s.enabled).length
  const totalSectionsCount = config.ui.navigation.sidebar.sections.length

  return (
    <div>
      <div className="chart-card" style={{ padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#8B0000', margin: '0 0 4px 0' }}>
              PAGES & NAVIGATION
            </h3>
            <p style={{ fontSize: '11px', color: '#B22222', margin: 0 }}>
              Control which pages and navigation sections are visible
            </p>
          </div>
          <div style={{
            padding: '6px 12px',
            background: '#E5E7EB',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#DC143C'
          }}>
            {enabledPagesCount} Pages, {enabledSectionsCount} Sections
          </div>
        </div>
      </div>

      {/* Pages Section */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#8B0000', marginBottom: '8px', textTransform: 'uppercase' }}>
          Available Pages
        </h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          {allPages.map(page => {
            const isEnabled = config.ui.pages.enabled.includes(page.path)
            return (
              <label
                key={page.path}
                className="chart-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'white',
                  border: '1px solid #E8E8E8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>
                    {page.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
                    {page.path}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => togglePage(page.path)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#DC143C'
                  }}
                />
              </label>
            )
          })}
        </div>
      </div>

      {/* Sidebar Sections */}
      <div>
        <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginBottom: '8px', textTransform: 'uppercase' }}>
          Sidebar Sections
        </h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          {config.ui.navigation.sidebar.sections.map(section => (
            <label
              key={section.id}
              className="chart-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: section.enabled ? '#F3F4F6' : 'white',
                border: section.enabled ? '2px solid #6B7280' : '1px solid #E8E8E8',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>
                  {section.id === 'dashboards' ? 'Dashboards' : section.id === 'platform-control' ? 'Platform Control' : section.id}
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>
                  Items: {section.items.join(', ')}
                </div>
              </div>
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={() => toggleSidebarSection(section.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#3B82F6'
                }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PagesTab