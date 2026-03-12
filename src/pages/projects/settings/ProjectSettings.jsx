import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSave, FiSettings, FiTrash2 } from 'react-icons/fi'
import PageHeader from '../../../components/PageHeader'
import api from '../../../utils/api'

const ProjectSettings = () => {
  const { projectId } = useParams()
  const [form, setForm] = useState({ name: '', description: '', theme: '#ea580c' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const [projectRes] = await Promise.allSettled([
        api('GET', '/admin-projects/' + projectId),
        api('GET', '/profile/notifications/unread-count'),
      ])
      if (projectRes.status === 'fulfilled') {
        const p = projectRes.value.data?.project || projectRes.value.data
        if (p) setForm({ name: p.name || '', description: p.description || '', theme: p.theme || '#ea580c' })
      }
      setLoading(false)
    }
    load()
  }, [projectId])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const { error } = await api('PUT', `/projects/${projectId}/update`, form)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl max-w-2xl" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        icon={FiSettings}
        title="Sector"
        highlight="Settings"
        subtitle="Reconfigure mission parameters"
      />

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSave}
        className="max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-8 space-y-6"
      >
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Sector Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required
            className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Mission Brief</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={5}
            className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition resize-none" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Theme Color</label>
          <div className="flex items-center gap-4">
            <input type="color" value={form.theme} onChange={(e) => setForm((p) => ({ ...p, theme: e.target.value }))}
              className="w-12 h-12 rounded-xl border border-gray-300 dark:border-[#1a1a1a] cursor-pointer" />
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Project identity color</span>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md">
          <FiSave size={16} /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </motion.form>
    </div>
  )
}

export default ProjectSettings