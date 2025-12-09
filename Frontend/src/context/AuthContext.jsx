import { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        
        // Fetch subscription status
        const subscriptionResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payment/subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          setSubscription(subscriptionData.data?.subscription || { active: false })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    }

    setLoading(false)
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { token, user: userData } = response.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      setUser(userData)
      
      // Fetch subscription status
      const subscriptionResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payment/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json()
        setSubscription(subscriptionData.data?.subscription || { active: false })
      }

      return userData
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password)
      const { token, user: userData } = response.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      setUser(userData)
      setSubscription({ active: false })

      return userData
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  }

  const logout = async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setSubscription(null)
    navigate('/login')
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const updateSubscription = (subscriptionData) => {
    setSubscription(subscriptionData)
  }

  const value = {
    user,
    subscription,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateSubscription
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}