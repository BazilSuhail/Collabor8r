import { create } from 'zustand'
import api from '../utils/api'
import useSocketStore from './socketStore'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
  listening: false,

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  fetchNotifications: async () => {
    const { data, error } = await api('GET', '/profile/get-notifications')
    if (!error) {
      const notifs = data || []
      set({ notifications: notifs, unreadCount: notifs.filter((n) => !n.read).length })
    }
  },

  markRead: async (index) => {
    const { notifications } = get()
    await api('PUT', '/profile/notifications/mark-read', { index })
    const updated = notifications.map((n, i) => (i === index ? { ...n, read: true } : n))
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length })
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 })
  },

  listenSocket: () => {
    if (get().listening) return
    const socket = useSocketStore.getState().socket
    if (!socket) return
    socket.on('notification', (notification) => {
      const { notifications } = get()
      const updated = [notification, ...notifications]
      set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length })
    })
    set({ listening: true })
  },
}))

export default useNotificationStore
