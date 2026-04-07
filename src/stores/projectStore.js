import { create } from 'zustand'
import { get, post, patch } from '../utils/http'

const useProjectStore = create((set) => ({
  adminProjects: [],
  joinedProjects: [],
  managedProjects: [],
  ledProjects: [],
  currentProject: null,

  fetchAdminProjects: async () => {
    const { data, error } = await get('/admin-projects/')
    if (!error) set({ adminProjects: data })
  },

  fetchJoinedProjects: async () => {
    const { data, error } = await get('/joinedprojects/')
    if (!error) set({ joinedProjects: data })
  },

  fetchManagedProjects: async () => {
    const { data, error } = await get('/joinedprojects/as-lead')
    if (!error) set({ managedProjects: data, ledProjects: data })
  },

  fetchProjectDetail: async (id) => {
    let result = await get('/admin-projects/' + id)
    if (result.error) result = await get('/joinedprojects/' + id)
    const project = result.data?.project || result.data
    set({ currentProject: project })
    return project
  },

  createProject: async (projectData) => {
    const { data, error } = await post('/projects/create', projectData)
    if (error) throw error
    const project = data.project || data
    set((state) => ({ adminProjects: [...state.adminProjects, project] }))
    return project
  },

  updateProject: async (id, projectData) => {
    const { data, error } = await patch('/projects/' + id + '/update', projectData)
    if (error) throw error
    set({ currentProject: data })
    return data
  },

  respondLeadInvite: async (id, response) => {
    await patch('/projects/lead-response/' + id, { response })
  },

  fetchProjectTeam: async (id) => {
    const { data, error } = await get('/admin-projects/' + id)
    if (!error) set({ currentProjectTeam: data.team || [] })
  },

  addToTeam: async (inviteData) => {
    const { error } = await post('/admin-projects/send-project-invitation', inviteData)
    if (error) throw error
  },
}))

export default useProjectStore
