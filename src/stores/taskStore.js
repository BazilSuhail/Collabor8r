import { create } from 'zustand'
import { get, post, patch, del } from '../utils/http'

const useTaskStore = create((set) => ({
  tasks: [],
  currentTask: null,
  loading: false,

  fetchProjectTasks: async (projectId) => {
    set({ loading: true })
    const { data, error } = await get('/project-tasks/' + projectId + '/tasks')
    if (!error) {
      const tasks = data.tasks || data || []
      set({ tasks, loading: false })
    } else {
      set({ loading: false })
    }
  },

  createTask: async (taskData) => {
    const { data, error } = await post('/manageTasks/', taskData)
    if (error) throw error
    const task = data.task || data
    set((s) => ({ tasks: [...s.tasks, task] }))
    return task
  },

  updateTask: async (taskId, updates) => {
    const { data, error } = await patch('/manageTasks/' + taskId, updates)
    if (error) throw error
    const task = data.task || data
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === taskId ? task : t)),
    }))
    return task
  },

  deleteTask: async (taskId) => {
    const { error } = await del('/manageTasks/' + taskId)
    if (error) throw error
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== taskId) }))
  },

  setCurrentTask: (task) => set({ currentTask: task }),

  listenSocket: () => {
    const socket = require('../lib/socket').getSocket()
    if (!socket) return
    socket.on('task.updated', (task) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t._id === task._id ? task : t)),
      }))
    })
    socket.on('task.deleted', (task) => {
      set((s) => ({ tasks: s.tasks.filter((t) => t._id !== task._id) }))
    })
  },
}))

export default useTaskStore
