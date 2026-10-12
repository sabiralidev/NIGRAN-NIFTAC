import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('mx_token')
    const storedUser = localStorage.getItem('mx_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('mx_token')
        localStorage.removeItem('mx_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await authAPI.login({ username, password })
    localStorage.setItem('mx_token', data.token)
    localStorage.setItem('mx_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (username, email, password) => {
    const data = await authAPI.register({ username, email, password })
    localStorage.setItem('mx_token', data.token)
    localStorage.setItem('mx_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('mx_token')
    localStorage.removeItem('mx_user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('mx_user', JSON.stringify(updatedUser))
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthContext
