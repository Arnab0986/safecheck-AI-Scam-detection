import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      // Handle specific error codes
      switch (status) {
        case 401:
          // Token expired or invalid
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break
        
        case 403:
          // Access forbidden
          toast.error('Access denied. Please check your subscription.')
          break
        
        case 429:
          // Rate limit exceeded
          toast.error('Too many requests. Please try again later.')
          break
        
        case 500:
          // Server error
          toast.error('Server error. Please try again later.')
          break
        
        default:
          if (data.error) {
            toast.error(data.error)
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.')
    } else {
      // Request setup error
      toast.error('Request failed. Please try again.')
    }
    
    return Promise.reject(error)
  }
)

// Auth API methods
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  
  getProfile: () =>
    api.get('/auth/me'),
  
  updateProfile: (data) =>
    api.put('/auth/me', data)
}

// Scan API methods
export const scanAPI = {
  scanText: (text, type = 'text') =>
    api.post('/scan/text', { text, type }),
  
  scanUrl: (url) =>
    api.post('/scan/url', { url }),
  
  getHistory: (params) =>
    api.get('/scan/history', { params }),
  
  getScan: (id) =>
    api.get(`/scan/${id}`),
  
  getStats: () =>
    api.get('/scan/stats')
}

// OCR API methods
export const ocrAPI = {
  extractText: (formData) =>
    api.post('/ocr/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  
  scanInvoice: (formData) =>
    api.post('/ocr/scan-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
}

// Payment API methods
export const paymentAPI = {
  createOrder: (plan) =>
    api.post('/payment/create-order', { plan }),
  
  verifyPayment: (orderId) =>
    api.post('/payment/verify', { order_id: orderId }),
  
  getSubscription: () =>
    api.get('/payment/subscription'),
  
  cancelSubscription: () =>
    api.post('/payment/cancel')
}

// Subscription API methods
export const subscriptionAPI = {
  getPlans: () =>
    api.get('/subscription/plans'),
  
  getUsage: () =>
    api.get('/subscription/usage'),
  
  updatePlan: (plan) =>
    api.put('/subscription/plan', { plan })
}

// Helper function to handle file uploads
export const uploadFile = async (file, endpoint) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// Helper function to handle errors
export const handleAPIError = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  return error.message || 'An error occurred'
}

export { api }