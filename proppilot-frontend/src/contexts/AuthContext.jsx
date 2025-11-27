import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const AuthContext = createContext()

const isLocalDev = import.meta.env.DEV && !import.meta.env.VITE_GOOGLE_CLIENT_ID

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(isLocalDev ? { name: 'Local Dev User', email: 'dev@local' } : null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(!isLocalDev)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`)
      setUser(response.data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async (credential) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google`, {
        credential
      })
      const { token: newToken, email, name, picture } = response.data
      localStorage.setItem('token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      setToken(newToken)
      setUser({ email, name, picture })
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    loginWithGoogle,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
