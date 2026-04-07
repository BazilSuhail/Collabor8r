import { useEffect } from 'react'
import useChatStore from '../stores/chatStore'

export const useOnlineMembers = () => {
  useEffect(() => {
    const cleanup = useChatStore.getState().listenSocket()
    return () => {
      cleanup?.()
    }
  }, [])
}
