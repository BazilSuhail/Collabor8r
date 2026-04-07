import { useEffect, useCallback } from 'react'
import useChatStore from '../stores/chatStore'

export const useChat = (projectId) => {
  const fetchMessages = useChatStore((s) => s.fetchMessages)
  const messages = useChatStore((s) => s.messages)
  const loading = useChatStore((s) => s.loading)
  const hasMore = useChatStore((s) => s.hasMore)
  const listenSocket = useChatStore((s) => s.listenSocket)

  useEffect(() => {
    if (!projectId) return
    fetchMessages(projectId)
    const cleanup = listenSocket()
    return cleanup
  }, [projectId, fetchMessages, listenSocket])

  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(projectId, messages[0].createdAt)
    }
  }, [projectId, messages, hasMore, fetchMessages])

  return { messages, loading, hasMore, loadMore }
}
