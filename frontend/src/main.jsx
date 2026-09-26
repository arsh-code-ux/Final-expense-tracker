import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { CurrencyProvider, useCurrency } from './context/CurrencyContext'
import { DataSyncProvider } from './contexts/DataSyncContext'
import LandingPage from './pages/LandingPage'
import DashboardClean from './pages/DashboardClean'
import ChatPage from './pages/ChatPage'
import HelpDesk from './pages/HelpDesk'
import Login from './pages/Login'
import Settings from './pages/Settings'
import CollabWorkspace from './pages/CollabWorkspace'
import PublicProjectPage from './pages/PublicProjectPage'
import ProtectedRoute from './components/ProtectedRoute'
import './styles.css'
import ErrorBoundary from './components/ErrorBoundary'

function Navigation() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { currency, setCurrency, currencies } = useCurrency()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Don't show navigation on landing page for non-authenticated users
  if (!isAuthenticated && location.pathname === '/') {
    return null
  }

  const links = [
    { to: '/dashboard', label: 'Overview' },
    { to: '/workspace', label: 'Workspace' },
    { to: '/chat', label: 'AI assistant' },
    { to: '/help-desk', label: 'Help desk' },
    { to: '/settings', label: 'Settings' }
  ]

  return (
    <>
      <aside className="app-sidebar">
        <Link to="/dashboard" className="app-brand"><span className="app-brand-mark">N</span><span>Nest</span></Link>
        <p className="app-sidebar-label">Your money, clearly.</p>
        <nav className="app-sidebar-nav">
          {links.map((link) => <Link key={link.to} to={link.to} className={`app-sidebar-link ${location.pathname === link.to ? 'is-active' : ''}`}>{link.label}</Link>)}
        </nav>
        <div className="app-sidebar-bottom">
          <div className="app-sidebar-user"><span className="app-avatar">{(user?.name || 'U').slice(0, 1).toUpperCase()}</span><span>{user?.name || 'Guest'}</span></div>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="app-sidebar-select" aria-label="Currency">
            {Object.entries(currencies).map(([code, info]) => <option key={code} value={code}>{info.symbol} {code}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="app-sidebar-control" title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>{isDark ? '☼' : '☾'} Theme</button>
            {isAuthenticated && <button onClick={handleLogout} className="app-sidebar-control">Log out</button>}
          </div>
        </div>
      </aside>
      <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="app-mobile-menu" aria-label="Toggle navigation">{mobileMenuOpen ? '×' : '☰'}</button>
      {mobileMenuOpen && <div className="app-mobile-panel">{links.map((link) => <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className="app-sidebar-link">{link.label}</Link>)}</div>}
    </>
  )
}

function AppContent() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/' 

  return (
    <div className={`min-h-screen app-shell ${isLandingPage ? 'is-landing' : ''}`}>
      <div className="relative z-10">
        {!isLandingPage && <Navigation />}
        
        <main className={isLandingPage ? "" : "app-main"}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login/>} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardClean/>
              </ProtectedRoute>
            } />
            <Route path="/workspace" element={
              <ProtectedRoute>
                <CollabWorkspace/>
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatPage/>
              </ProtectedRoute>
            } />
            <Route path="/help-desk" element={
              <ProtectedRoute>
                <HelpDesk/>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={<Settings/>} />
            <Route path="/public/:token" element={<PublicProjectPage />} />
          </Routes>
        </main>
        
      </div>
    </div>
  )
}

function App(){
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <AuthProvider>
          <DataSyncProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </DataSyncProvider>
        </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  )
}

// Global error handlers (catch unhandled errors and promise rejections)
window.addEventListener('error', (event) => {
  console.error('Global error captured:', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
