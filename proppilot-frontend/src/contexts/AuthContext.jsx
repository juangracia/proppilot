import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import { API_BASE_URL } from '../config/api'

const AuthContext = createContext()

const isLocalDev = import.meta.env.DEV && !Capacitor.isNativePlatform()
const isNative = Capacitor.isNativePlatform()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [token])

  // Initialize native Google Auth if on native platform
  useEffect(() => {
    const initNativeGoogleAuth = async () => {
      if (isNative) {
        try {
          const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
          await GoogleAuth.initialize({
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
          })
        } catch (error) {
          console.error('Failed to initialize native Google Auth:', error)
        }
      }
    }
    initNativeGoogleAuth()
  }, [])

  const loginWithLocalUser = async (email, name) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/local`, {
        email,
        name
      })
      const { token: newToken, email: userEmail, name: userName } = response.data
      localStorage.setItem('token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      setToken(newToken)
      setUser({ email: userEmail, name: userName, picture: null })
      return true
    } catch (error) {
      console.error('Local login failed:', error)
      return false
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`)
      const userData = response.data
      setUser({
        email: userData.email,
        name: userData.fullName,
        picture: userData.pictureUrl
      })
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

  // Native Google Sign-In for mobile apps
  const loginWithGoogleNative = async () => {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
      const result = await GoogleAuth.signIn()

      // The native plugin returns an authentication object with idToken
      if (result.authentication?.idToken) {
        return await loginWithGoogle(result.authentication.idToken)
      }

      console.error('No idToken received from native Google Auth')
      return { success: false, error: 'No authentication token received' }
    } catch (error) {
      console.error('Native Google login failed:', error)
      // Return a detailed error for display
      const errorMessage = error.message || 'Google Sign-In not configured for this platform'
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    // Sign out from native Google Auth if on native platform
    if (isNative) {
      try {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
        await GoogleAuth.signOut()
      } catch (error) {
        console.error('Native Google signOut error:', error)
      }
    }

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
    isLocalDev,
    isNative,
    loginWithGoogle,
    loginWithGoogleNative,
    loginWithLocalUser,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
