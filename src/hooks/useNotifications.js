import { useEffect } from 'react'
import useNotificationStore from '../stores/notificationStore'

export const useNotifications = () => {
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)
  const listenSocket = useNotificationStore((s) => s.listenSocket)

  useEffect(() => {
    fetchNotifications()
    const cleanup = listenSocket()
    return cleanup
  }, [fetchNotifications, listenSocket])
}
