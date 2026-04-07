import { create } from 'zustand'
import { post } from '../utils/http'
import useSocketStore from './socketStore'

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email, password) => {
    const { data, error } = await post('/auth/signin', { email, password })
    if (error) throw error
    localStorage.setItem('token', data.token)
    set({ token: data.token, isAuthenticated: true })
    await get().loadUser()
  },

  loginWithCode: async (email, code) => {
    const { data, error } = await post('/auth/signin-code', { email, code })
    if (error) throw error
    localStorage.setItem('token', data.token)
    set({ token: data.token, isAuthenticated: true })
    await get().loadUser()
  },

  signup: async (userData) => {
    const { data, error } = await post('/auth/signup', userData)
    if (error) throw error
    localStorage.setItem('token', data.token)
    set({ token: data.token, isAuthenticated: true })
    await get().loadUser()
  },

  signupWithCode: async (email, code, userData) => {
    const { data, error } = await post('/auth/signup-code', { ...userData, email, code })
    if (error) throw error
    localStorage.setItem('token', data.token)
    set({ token: data.token, isAuthenticated: true })
    await get().loadUser()
  },

  sendCode: async (email, purpose) => {
    const { error } = await post('/auth/send-code', { email, purpose })
    if (error) throw error
  },

  logout: () => {
    useSocketStore.getState().disconnect()
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadUser: async () => {
    try {
      const { data, error } = await get('/profile/')
      if (error) throw error
      set({ user: data })
      const { connect } = useSocketStore.getState()
      if (data._id) connect(data._id)
    } catch {
      get().logout()
    }
  },

  updateProfile: async (profileData) => {
    const { data, error } = await put('/profile/', profileData)
    if (error) throw error
    set({ user: data })
  },

  forgotPassword: async (email) => {
    const { error } = await post('/auth/forgot-password', { email })
    if (error) throw error
  },

  resetPassword: async (email, code, newPassword) => {
    const { error } = await post('/auth/reset-password', { email, code, newPassword })
    if (error) throw error
  },
}))

export default useAuthStore
