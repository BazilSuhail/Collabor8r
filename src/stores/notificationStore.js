import { create } from 'zustand'
import { put } from '../utils/http'
import { onNotification } from '../lib/socket'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
  listening: false,

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  fetchNotifications: async () => {
    const { data, error } = await get('/profile/get-notifications')
    if (!error) {
      const notifs = data || []
      set({ notifications: notifs, unreadCount: notifs.filter((n) => !n.read).length })
    }
  },

  markRead: async (index) => {
    const { notifications } = get()
    await put('/profile/notifications/mark-read', { index })
    const updated = notifications.map((n, i) => (i === index ? { ...n, read: true } : n))
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length })
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 })
  },

  listenSocket: () => {
    if (get().listening) return
    const cleanup = onNotification((notification) => {
      const { notifications } = get()
      const updated = [notification, ...notifications]
      set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length })
    })
    set({ listening: true })
    return cleanup
  },
}))

export default useNotificationStore
