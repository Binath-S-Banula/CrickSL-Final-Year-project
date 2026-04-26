import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on page load
  useEffect(() => {
    const storedUser  = localStorage.getItem('cricksl_user')
    const storedToken = localStorage.getItem('cricksl_access_token')
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    const { access_token, refresh_token, user: userData } = response.data

    localStorage.setItem('cricksl_access_token', access_token)
    localStorage.setItem('cricksl_refresh_token', refresh_token)
    localStorage.setItem('cricksl_user', JSON.stringify(userData))

    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('cricksl_access_token')
    localStorage.removeItem('cricksl_refresh_token')
    localStorage.removeItem('cricksl_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const isAdmin      = () => user?.role === 'admin'
  const isAuthenticated = () => !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
