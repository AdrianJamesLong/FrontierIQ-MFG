import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, HelpCircle } from 'lucide-react'
import './TopBar.css'

function ClaudeMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 1.5L15.5 5.25V12.75L9 16.5L2.5 12.75V5.25L9 1.5Z" fill="#C15F3C" />
      <path d="M6.5 9L8 11L11.5 7" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <>
    <div className="top-bar">
      <div className="top-bar-content">
        <div className="top-bar-icons">
          <button
            className={`top-bar-icon ${isActive('/help-centre') ? 'active' : ''}`}
            onClick={() => navigate('/help-centre')}
            title="Help Centre"
          >
            <HelpCircle size={20} />
          </button>
          <button
            className={`top-bar-icon ${isActive('/settings') ? 'active' : ''}`}
            onClick={() => navigate('/settings')}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
    <div className="powered-by-claude">
      <ClaudeMark />
      <span>Powered by Claude</span>
    </div>
    </>
  )
}

export default TopBar
