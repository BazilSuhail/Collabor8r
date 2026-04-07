import { create } from 'zustand'
import { connectSocket, disconnectSocket } from '../lib/socket'

const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (userId) => {
    const existing = get().socket
    if (existing?.connected) return

    const socket = connectSocket(userId)
    socket.on('connect', () => set({ isConnected: true }))
    socket.on('disconnect', () => set({ isConnected: false }))
    set({ socket })
  },

  disconnect: () => {
    disconnectSocket()
    set({ socket: null, isConnected: false })
  },
}))

export default useSocketStore
