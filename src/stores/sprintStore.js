import { create } from 'zustand'
import { get, post, del } from '../utils/http'

const useSprintStore = create((set) => ({
  sprints: [],
  activeSprint: null,
  loading: false,

  fetchSprints: async (projectId) => {
    set({ loading: true })
    const { data, error } = await get('/sprints/' + projectId)
    if (!error) {
      const sprints = data || []
      const active = sprints.find((s) => s.isActive) || null
      set({ sprints, activeSprint: active, loading: false })
    } else {
      set({ loading: false })
    }
  },

  createSprint: async (projectId, sprintData) => {
    const { data, error } = await post('/sprints/' + projectId, sprintData)
    if (error) throw error
    set((s) => ({ sprints: [...s.sprints, data] }))
    return data
  },

  updateSprint: async (sprintId, sprintData) => {
    const { data, error } = await patch('/sprints/sprint/' + sprintId, sprintData)
    if (error) throw error
    const sprint = data.sprint || data
    set((s) => ({
      sprints: s.sprints.map((sp) => (sp._id === sprintId ? sprint : sp)),
    }))
    return sprint
  },

  deleteSprint: async (sprintId) => {
    const { error } = await del('/sprints/sprint/' + sprintId)
    if (error) throw error
    set((s) => ({ sprints: s.sprints.filter((sp) => sp._id !== sprintId) }))
  },

  activateSprint: async (sprintId) => {
    const { data, error } = await post('/sprints/sprint/' + sprintId + '/activate')
    if (error) throw error
    const sprint = data.sprint || data
    set((s) => ({
      sprints: s.sprints.map((sp) => (sp._id === sprintId ? sprint : { ...sp, isActive: false })),
      activeSprint: sprint,
    }))
  },

  completeSprint: async (sprintId) => {
    const { data, error } = await post('/sprints/sprint/' + sprintId + '/complete')
    if (error) throw error
    const sprint = data.sprint || data
    set((s) => ({
      sprints: s.sprints.map((sp) => (sp._id === sprintId ? sprint : sp)),
      activeSprint: null,
    }))
  },

  listenSocket: () => {
    const { getSocket } = require('../lib/socket')
    const socket = getSocket()
    if (!socket) return
    socket.on('sprint.updated', (sprint) => {
      set((s) => ({
        sprints: s.sprints.map((sp) => (sp._id === sprint._id ? sprint : sp)),
      }))
    })
  },
}))

export default useSprintStore
