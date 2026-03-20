import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiFilter, FiPlus, FiTrash2, FiEdit2, FiSave, FiX } from 'react-icons/fi'
import ProjectHeader from '../../../components/ui/ProjectHeader'
import api from '../../../utils/api'

const SavedFilters = () => {
  const { projectId } = useParams()
  const [filters, setFilters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', criteria: '{}', isDefault: false })

  useEffect(() => {
    const load = async () => {
      const { data } = await api('GET', '/filters/project/' + projectId)
      setFilters(data || [])
      setLoading(false)
    }
    load()
  }, [projectId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    let query = {}
    try { query = JSON.parse(form.criteria) } catch { query = { search: form.criteria } }
    try {
      if (editingId) {
        const { data } = await api('PUT', '/filters/' + editingId, { name: form.name, query, isDefault: form.isDefault })
        setFilters((prev) => prev.map((f) => (f._id === editingId ? data : f)))
      } else {
        const { data } = await api('POST', '/filters', { name: form.name, projectId, query, isDefault: form.isDefault })
        setFilters((prev) => [...prev, data])
      }
      setForm({ name: '', criteria: '{}', isDefault: false })
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      console.error('Filter save failed:', err)
    }
  }

  const startEdit = (filter) => {
    setForm({ name: filter.name, criteria: JSON.stringify(filter.query || filter.criteria || {}, null, 2), isDefault: filter.isDefault || false })
    setEditingId(filter._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this filter?')) return
    await api('DELETE', '/filters/' + id)
    setFilters((prev) => prev.filter((f) => f._id !== id))
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto">
        <ProjectHeader
          projectId={projectId}
          icon={FiFilter}
          title="Saved"
          highlight="Filters"
          subtitle="Reusable search parameters for quick task lookup"
          pageLabel="Filters"
          action={
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', criteria: '{}', isDefault: false }) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-md hover:from-orange-500 hover:to-orange-600 transition-all">
              <FiPlus size={18} /> {showForm ? 'Cancel' : 'New Filter'}
            </button>
          }
        />

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 mb-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Filter Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="My Filter"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Criteria (JSON)</label>
            <textarea value={form.criteria} onChange={(e) => setForm((p) => ({ ...p, criteria: e.target.value }))} rows={3}
              placeholder='{"priority": "High", "status": "In Progress"}'
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-orange-500 outline-none transition resize-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} className="accent-orange-600" />
            Set as default filter
          </label>
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 transition-all shadow-md">
            <FiSave size={16} /> {editingId ? 'Update Filter' : 'Save Filter'}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#151515] rounded-xl animate-pulse" />)}
        </div>
      ) : filters.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a]">
          <FiFilter size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Saved Filters</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Save custom filters to quickly find tasks.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((filter) => (
            <div key={filter._id} className="flex items-center justify-between p-4 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] hover:border-orange-500/30 transition-all group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{filter.name}</p>
                  {filter.isDefault && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold uppercase">Default</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">
                  {filter.query ? JSON.stringify(filter.query).slice(0, 60) : filter.criteria ? JSON.stringify(filter.criteria).slice(0, 60) : 'No criteria'}
                </p>
              </div>
              <div className="flex gap-1 shrink-0 ml-4">
                <button onClick={() => startEdit(filter)} className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all opacity-0 group-hover:opacity-100"><FiEdit2 size={14} /></button>
                <button onClick={() => handleDelete(filter._id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

export default SavedFilters