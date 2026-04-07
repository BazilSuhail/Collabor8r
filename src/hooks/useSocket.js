import { useEffect } from 'react'
import useAuthStore from '../stores/authStore'
import useSocketStore from '../stores/socketStore'

export const useSocket = () => {
  const user = useAuthStore((s) => s.user)
  const connect = useSocketStore((s) => s.connect)
  const disconnect = useSocketStore((s) => s.disconnect)

  useEffect(() => {
    if (user?._id) {
      connect(user._id)
    }
    return () => {
      if (!useAuthStore.getState().user) {
        disconnect()
      }
    }
  }, [user?._id, connect, disconnect])
}
