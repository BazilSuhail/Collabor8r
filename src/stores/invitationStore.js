import { create } from 'zustand'
import { post } from '../utils/http'

const useInvitationStore = create((set, get) => ({
  invitations: [],
  loading: false,

  fetchPending: async () => {
    set({ loading: true })
    const { data, error } = await get('/invitations/pending')
    if (!error) set({ invitations: data || [], loading: false })
    else set({ loading: false })
  },

  accept: async (token) => {
    const { data, error } = await post('/invitations/' + token + '/accept')
    if (error) throw error
    set((s) => ({
      invitations: s.invitations.filter((i) => i.token !== token),
    }))
    return data
  },

  decline: async (token) => {
    const { data, error } = await post('/invitations/' + token + '/decline')
    if (error) throw error
    set((s) => ({
      invitations: s.invitations.filter((i) => i.token !== token),
    }))
    return data
  },

  addInvitation: (invitation) => {
    set((s) => ({ invitations: [invitation, ...s.invitations] }))
  },

  listenSocket: () => {
    const { onInvitation } = require('../lib/socket')
    const cleanup = onInvitation((invitation) => {
      get().addInvitation(invitation)
    })
    return cleanup
  },
}))

export default useInvitationStore
