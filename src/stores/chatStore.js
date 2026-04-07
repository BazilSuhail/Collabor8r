import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  messages: [],
  loading: false,
  hasMore: true,
  onlineMembers: new Set(),

  fetchMessages: async (projectId, before) => {
    set({ loading: true })
    const url = '/chat/' + projectId + '/messages' + (before ? '?before=' + before : '')
    const { data, error } = await get(url)
    if (!error) {
      const newMessages = (data.messages || []).reverse()
      if (before) {
        set((s) => ({
          messages: [...newMessages, ...s.messages],
          loading: false,
          hasMore: newMessages.length === 50,
        }))
      } else {
        set({ messages: newMessages, loading: false, hasMore: newMessages.length === 50 })
      }
    } else {
      set({ loading: false })
    }
  },

  addMessage: (message) => {
    set((s) => {
      if (s.messages.find((m) => m._id === message._id)) return s
      return { messages: [...s.messages, message] }
    })
  },

  setOnlineMembers: (members) => set({ onlineMembers: new Set(members) }),

  addOnlineMember: (userId) => {
    set((s) => {
      const next = new Set(s.onlineMembers)
      next.add(userId)
      return { onlineMembers: next }
    })
  },

  removeOnlineMember: (userId) => {
    set((s) => {
      const next = new Set(s.onlineMembers)
      next.delete(userId)
      return { onlineMembers: next }
    })
  },

  clearMessages: () => set({ messages: [], hasMore: true }),

  listenSocket: () => {
    const { onChatMessage, onMemberOnline, onMemberOffline } = require('../lib/socket')
    const cleanup1 = onChatMessage((message) => {
      set((s) => {
        if (s.messages.find((m) => m._id === message._id)) return s
        return { messages: [...s.messages, message] }
      })
    })
    const cleanup2 = onMemberOnline(({ userId }) => {
      get().addOnlineMember(userId)
    })
    const cleanup3 = onMemberOffline(({ userId }) => {
      get().removeOnlineMember(userId)
    })
    return () => {
      cleanup1()
      cleanup2()
      cleanup3()
    }
  },
}))

export default useChatStore
