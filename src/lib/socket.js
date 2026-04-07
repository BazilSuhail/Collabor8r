import { io } from 'socket.io-client'
import { API_BASE_URL } from '../utils/constants'

let socket = null

export const connectSocket = (userId) => {
  if (socket?.connected) return socket

  socket = io(API_BASE_URL, {
    auth: { userId },
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const joinProject = (projectId) => {
  socket?.emit('join-project', projectId)
}

export const leaveProject = (projectId) => {
  socket?.emit('leave-project', projectId)
}

export const sendChatMessage = (projectId, content, type = 'text') => {
  socket?.emit('chat:message', { projectId, content, type })
}

export const onChatMessage = (cb) => {
  socket?.on('chat:message', cb)
  return () => socket?.off('chat:message', cb)
}

export const onMemberOnline = (cb) => {
  socket?.on('member:online', cb)
  return () => socket?.off('member:online', cb)
}

export const onMemberOffline = (cb) => {
  socket?.on('member:offline', cb)
  return () => socket?.off('member:offline', cb)
}

export const onNotification = (cb) => {
  socket?.on('notification', cb)
  return () => socket?.off('notification', cb)
}

export const onInvitation = (cb) => {
  socket?.on('invitation', cb)
  return () => socket?.off('invitation', cb)
}

export const onOnlineCount = (cb) => {
  socket?.on('online-count', cb)
  return () => socket?.off('online-count', cb)
}

export const onChatError = (cb) => {
  socket?.on('chat:error', cb)
  return () => socket?.off('chat:error', cb)
}
