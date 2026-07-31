import { useState } from 'react'
import { User, Bell, Shield, Database, Palette, Globe, Key, Save, RefreshCw, Eye, EyeOff, Check, HelpCircle, BookOpen, Video, MessageCircle, FileText, Lightbulb, ExternalLink } from 'lucide-react'
import './Dashboard.css'

function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saveStatus, setSaveStatus] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    department: 'Production',
    role: 'Manager'
  })

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    productionAlerts: true,
    scheduleChanges: true,
    systemUpdates: false,
    weeklyReports: true,
    alertThreshold: 85
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginNotifications: true
  })

  const [dataSettings, setDataSettings] = useState({
    retentionPeriod: 90,
    autoBackup: true,
    backupFrequency: 'daily',
    exportFormat: 'csv',
    dataCompression: true
  })

  const [appearance, setAppearance] = useState({
    theme: 'light',
    primaryColor: '#1C3668',
    fontSize: 'medium',
    compactMode: false,
    showAnimations: true
  })

  const [regional, setRegional] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD'
  })

  const [apiSettings, setApiSettings] = useState({
    apiKey: 'sk_live_••••••••••••••••',
    webhookUrl: 'https://api.example.com/webhook',
    rateLimit: 1000,
    enableLogging: true
  })

  const handleSave = (section) => {
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('success')
      console.log(`Saved ${section} settings`)
      setTimeout(() => setSaveStatus(null), 2000)
    }, 1000)
  }

  const tabs = [
    { id: 'profile', name: 'User Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'data', name: 'Data Management', icon: Database },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'regional', name: 'Regional', icon: Globe },
    { id: 'api', name: 'API', icon: Key },
    { id: 'help', name: 'Help Centre', icon: HelpCircle }
  ]

  const helpResources = [
    {
      id: 'getting-started',
      title: 'Getting Started Guide',
      description: 'Learn the basics of Manufacturing Intelligence and Optimization and get up to speed quickly',
      icon: BookOpen,
      color: '#0A1628',
      type: 'Documentation',
      link: '#',
      topics: ['Platform Overview', 'Navigation', 'Key Features', 'Quick Start Tutorial']
    },
    {
      id: 'video-tutorials',
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides covering all major features and workflows',
      icon: Video,
      color: '#3B82F6',
      type: 'Video',
      link: '#',
      topics: ['Dashboard Overview', 'Data Explorer', 'Production Metrics', 'Report Generation']
    },
    {
      id: 'user-manual',
      title: 'User Manual',
      description: 'Comprehensive documentation covering all features, settings, and best practices',
      icon: FileText,
      color: '#10B981',
      type: 'Documentation',
      link: '#',
      topics: ['Complete Feature List', 'Advanced Settings', 'Troubleshooting', 'FAQs']
    },
    {
      id: 'api-docs',
      title: 'API Documentation',
      description: 'Technical documentation for developers integrating with our platform APIs',
      icon: Key,
      color: '#F59E0B',
      type: 'Technical',
      link: '#',
      topics: ['REST API Reference', 'Authentication', 'Webhooks', 'Code Examples']
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      description: 'Industry best practices and optimization tips for production operations',
      icon: Lightbulb,
      color: '#8B4513',
      type: 'Guide',
      link: '#',
      topics: ['OEE Optimization', 'Data Quality', 'Performance Tuning', 'Security Guidelines']
    },
    {
      id: 'support',
      title: 'Contact Support',
      description: 'Get help from our support team for technical issues and questions',
      icon: MessageCircle,
      color: '#9333EA',
      type: 'Support',
      link: '#',
      topics: ['Submit Ticket', 'Live Chat', 'Email Support', 'Phone Support']
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px', fontSize: '20px' }}>Settings</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '11px' }}>
            Manage application settings and preferences
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saveStatus === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: '600', padding: '6px 12px', background: '#F0FDF4', borderRadius: '6px', fontSize: '11px' }}>
              <Check size={14} />
              Settings saved successfully
            </div>
          )}
          <div style={{
            padding: '6px 12px',
            background: '#E0F2E9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0F5132'
          }}>
            {tabs.length} Settings
          </div>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: '8px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Icon size={12} /> {tab.name}
            </button>
          )
        })}
      </div>

      <div className="tab-content">
        {activeTab === 'profile' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #E8E8E8' }}>
            <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #F5F5F5' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>User Profile</h2>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: '1.6' }}>Manage your personal information and account details</p>
            </div>
            
            <div className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} className="form-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="form-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select value={profile.department} onChange={(e) => setProfile({...profile, department: e.target.value})} className="form-select">
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={profile.role} onChange={(e) => setProfile({...profile, role: e.target.value})} className="form-select">
                    <option value="Manager">Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Operator">Operator</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={() => handleSave('profile')} disabled={saveStatus === 'saving'}>
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #E8E8E8' }}>
            <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #F5F5F5' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>Notification Preferences</h2>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: '1.6' }}>Configure alert preferences and notification settings</p>
            </div>

            <div className="settings-form">
              <div className="settings-group">
                <h3>Notification Channels</h3>
                <div className="toggle-list">
                  <div className="toggle-item">
                    <div>
                      <strong>Email Alerts</strong>
                      <p>Receive notifications via email</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifications.emailAlerts} onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>SMS Alerts</strong>
                      <p>Receive critical alerts via SMS</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifications.smsAlerts} onChange={(e) => setNotifications({...notifications, smsAlerts: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>Push Notifications</strong>
                      <p>Browser push notifications</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifications.pushNotifications} onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-group">
                <h3>Alert Types</h3>
                <div className="toggle-list">
                  <div className="toggle-item">
                    <div>
                      <strong>Production Alerts</strong>
                      <p>Alerts for production issues and delays</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifications.productionAlerts} onChange={(e) => setNotifications({...notifications, productionAlerts: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>Schedule Changes</strong>
                      <p>Notifications for schedule modifications</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifications.scheduleChanges} onChange={(e) => setNotifications({...notifications, scheduleChanges: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>System Updates</strong>
                      <p>Notifications about system maintenance</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifications.systemUpdates} onChange={(e) => setNotifications({...notifications, systemUpdates: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>Weekly Reports</strong>
                      <p>Receive weekly performance summaries</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifications.weeklyReports} onChange={(e) => setNotifications({...notifications, weeklyReports: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-group">
                <h3>Alert Threshold</h3>
                <div className="form-group">
                  <label>Production Efficiency Alert Threshold: {notifications.alertThreshold}%</label>
                  <input type="range" min="50" max="100" value={notifications.alertThreshold} onChange={(e) => setNotifications({...notifications, alertThreshold: parseInt(e.target.value)})} className="range-input" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={() => handleSave('notifications')} disabled={saveStatus === 'saving'}>
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #E8E8E8' }}>
            <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #F5F5F5' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>Security & Privacy</h2>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: '1.6' }}>Manage security settings, passwords, and privacy options</p>
            </div>

            <div className="settings-form">
              <div className="settings-group">
                <h3>Change Password</h3>
                <div className="form-group">
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} value={security.currentPassword} onChange={(e) => setSecurity({...security, currentPassword: e.target.value})} className="form-input" placeholder="Enter current password" />
                    <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>New Password</label>
                    <input type={showPassword ? "text" : "password"} value={security.newPassword} onChange={(e) => setSecurity({...security, newPassword: e.target.value})} className="form-input" placeholder="Enter new password" />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type={showPassword ? "text" : "password"} value={security.confirmPassword} onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})} className="form-input" placeholder="Confirm new password" />
                  </div>
                </div>
              </div>

              <div className="settings-group">
                <h3>Security Options</h3>
                <div className="toggle-list">
                  <div className="toggle-item">
                    <div>
                      <strong>Two-Factor Authentication</strong>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={security.twoFactorAuth} onChange={(e) => setSecurity({...security, twoFactorAuth: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>Login Notifications</strong>
                      <p>Get notified of new login attempts</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={security.loginNotifications} onChange={(e) => setSecurity({...security, loginNotifications: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Session Timeout</label>
                  <select value={security.sessionTimeout} onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})} className="form-select">
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={() => handleSave('security')} disabled={saveStatus === 'saving'}>
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #E8E8E8' }}>
            <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #F5F5F5' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>Data Management</h2>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: '1.6' }}>Configure data retention, backup, and export settings</p>
            </div>

            <div className="settings-form">
              <div className="settings-group">
                <h3>Data Retention</h3>
                <div className="form-group">
                  <label>Data Retention Period</label>
                  <select value={dataSettings.retentionPeriod} onChange={(e) => setDataSettings({...dataSettings, retentionPeriod: parseInt(e.target.value)})} className="form-select">
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>

              <div className="settings-group">
                <h3>Backup Settings</h3>
                <div className="toggle-list">
                  <div className="toggle-item">
                    <div>
                      <strong>Automatic Backup</strong>
                      <p>Enable automatic data backups</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={dataSettings.autoBackup} onChange={(e) => setDataSettings({...dataSettings, autoBackup: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>Data Compression</strong>
                      <p>Compress backup files to save storage</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={dataSettings.dataCompression} onChange={(e) => setDataSettings({...dataSettings, dataCompression: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Backup Frequency</label>
                  <select value={dataSettings.backupFrequency} onChange={(e) => setDataSettings({...dataSettings, backupFrequency: e.target.value})} className="form-select" disabled={!dataSettings.autoBackup}>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="settings-group">
                <h3>Export Settings</h3>
                <div className="form-group">
                  <label>Default Export Format</label>
                  <select value={dataSettings.exportFormat} onChange={(e) => setDataSettings({...dataSettings, exportFormat: e.target.value})} className="form-select">
                    <option value="csv">CSV</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={() => handleSave('dataSettings')} disabled={saveStatus === 'saving'}>
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn-secondary" style={{ marginLeft: '10px' }}>
                  <Database size={16} />
                  Export All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #E8E8E8' }}>
            <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #F5F5F5' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>Appearance</h2>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: '1.6' }}>Customize theme, layout, and display preferences</p>
            </div>

            <div className="settings-form">
              <div className="settings-group">
                <h3>Theme Settings</h3>
                <div className="form-group">
                  <label>Theme</label>
                  <select value={appearance.theme} onChange={(e) => setAppearance({...appearance, theme: e.target.value})} className="form-select">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Primary Color</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="color" value={appearance.primaryColor} onChange={(e) => setAppearance({...appearance, primaryColor: e.target.value})} style={{ width: '60px', height: '40px', border: '1px solid #E8E8E8', borderRadius: '6px', cursor: 'pointer' }} />
                    <span style={{ color: '#6B6B6B', fontSize: '14px' }}>{appearance.primaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="settings-group">
                <h3>Display Settings</h3>
                <div className="form-group">
                  <label>Font Size</label>
                  <select value={appearance.fontSize} onChange={(e) => setAppearance({...appearance, fontSize: e.target.value})} className="form-select">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="toggle-list">
                  <div className="toggle-item">
                    <div>
                      <strong>Compact Mode</strong>
                      <p>Reduce spacing for more content on screen</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={appearance.compactMode} onChange={(e) => setAppearance({...appearance, compactMode: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>Show Animations</strong>
                      <p>Enable smooth transitions and animations</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={appearance.showAnimations} onChange={(e) => setAppearance({...appearance, showAnimations: e.target.checked})} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={() => handleSave('appearance')} disabled={saveStatus === 'saving'}>
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'regional' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #E8E8E8' }}>
            <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #F5F5F5' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>Regional Settings</h2>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: '1.6' }}>Set language, timezone, and regional preferences</p>
            </div>

            <div className="settings-form">
              <div className="settings-group">
                <h3>Language & Region</h3>
                <div className="form-group">
                  <label>Language</label>
                  <select value={regional.language} onChange={(e) => setRegional({...regional, language: e.target.value})} className="form-select">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Timezone</label>
                  <select value={regional.timezone} onChange={(e) => setRegional({...regional, timezone: e.target.value})} className="form-select">
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Date Format</label>
                  <select value={regional.dateFormat} onChange={(e) => setRegional({...regional, dateFormat: e.target.value})} className="form-select">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Time Format</label>
                  <select value={regional.timeFormat} onChange={(e) => setRegional({...regional, timeFormat: e.target.value})} className="form-select">
                    <option value="12h">12-hour</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <select value={regional.currency} onChange={(e) => setRegional({...regional, currency: e.target.value})} className="form-select">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSave} className="save-button">
                <Save size={20} />
                Save Regional Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings