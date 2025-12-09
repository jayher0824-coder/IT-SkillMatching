import { useState, useEffect, createContext, useContext } from 'react'
import axios from 'axios'

const API_BASE = '/api'

// Simple routing state
const ROUTES = {
  LOGIN: 'login',
  REGISTER: 'register',
  DASHBOARD: 'dashboard'
}

// Create Auth Context
const AuthContext = createContext()

const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth Provider
const AuthProvider = ({ children, onRouteChange }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Verify token and get user info
      axios.get(`${API_BASE}/auth/me`)
        .then(response => {
          if (response.data.success && response.data.data.role === 'admin') {
            setUser(response.data.data)
          } else {
            logout()
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password })
      if (response.data.success && response.data.user.role === 'admin') {
        const { token, user } = response.data
        localStorage.setItem('token', token)
        setToken(token)
        setUser(user)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        if (onRouteChange) {
          onRouteChange(ROUTES.DASHBOARD)
        }
        
        return { success: true }
      } else {
        return { success: false, message: 'Admin access required' }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    
    if (onRouteChange) {
      onRouteChange(ROUTES.LOGIN)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Import the original app.js content and convert to JSX modules
// For now, we'll use a placeholder that loads the existing app.js
const App = () => {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.LOGIN)
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user && currentRoute === ROUTES.LOGIN) {
      setCurrentRoute(ROUTES.DASHBOARD)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>
      </div>
    )
  }

  // For now, load the existing admin app from the old file
  // This is a bridge to use your existing app.js while migrating to Vite
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/admin/js/app.js'
    script.type = 'application/javascript'
    document.body.appendChild(script)
  }, [])

  return <div id="admin-app-root"></div>
}

const AppWithNavigation = () => {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.LOGIN)
  const { user, loading } = useAuth()

  useEffect(() => {
    const handleNavigate = (e) => {
      setCurrentRoute(e.detail.route)
    }
    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [])

  useEffect(() => {
    if (user && currentRoute === ROUTES.LOGIN) {
      setCurrentRoute(ROUTES.DASHBOARD)
    } else if (!user && currentRoute === ROUTES.DASHBOARD) {
      setCurrentRoute(ROUTES.LOGIN)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>
      </div>
    )
  }

  return <App />
}

const AppWrapper = () => {
  return (
    <AuthProvider onRouteChange={(route) => {
      const event = new CustomEvent('navigate', { detail: { route } })
      window.dispatchEvent(event)
    }}>
      <AppWithNavigation />
    </AuthProvider>
  )
}

export default AppWrapper
