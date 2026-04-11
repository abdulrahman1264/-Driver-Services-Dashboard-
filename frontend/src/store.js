import { create } from 'zustand'

export const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('ds_user') || 'null'),
  token: localStorage.getItem('ds_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('ds_token', token)
    localStorage.setItem('ds_user', JSON.stringify(user))
    set({ user, token })
  },

  clearAuth: () => {
    localStorage.removeItem('ds_token')
    localStorage.removeItem('ds_user')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.role === 'Administrator',
}))