import { useEffect } from 'react'
import { joinProject, leaveProject } from '../lib/socket'

export const useProjectRoom = (projectId) => {

  useEffect(() => {
    if (!projectId) return
    joinProject(projectId)
    return () => {
      leaveProject(projectId)
    }
  }, [projectId])
}
