import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiColumns, FiPlus, FiTrash2, FiEdit2, FiSave } from 'react-icons/fi'
import PageHeader from '../../../components/PageHeader'
import api from '../../../utils/api'

const defaultColumns = [
  { title: 'Not Started', limit: 0 },
  { title: 'In Progress', limit: 0 },
  { title: 'Paused', limit: 0 },
  { title: 'Completed', limit: 0 },
]

const BoardConfig = () => {
  const { projectId } = useParams()
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ name: '', columns: JSON.parse(JSON.stringify(defaultColumns)), swimlane: '' })

  useEffect(() => {
    const load = async () => {
      const { data, error } = await api('GET', '/boards/project/' + projectId)
      if (!error) setBoards(Array.isArray(data) ? data : data?.boards || [])
      setLoading(false)
    }
    load()
  }, [projectId])

  const addColumn = () => {
    setForm((p) => ({ ...p, columns: [...p.columns, { title: '', limit: 0 }] }))
  }

  const updateColumn = (index, field, value) => {
    setForm((p) => {
      const cols = [...p.columns]
      cols[index] = { ...cols[index], [field]: value }
      return { ...p, columns: cols }
    })
  }

  const removeColumn = (index) => {
    setForm((p) => ({ ...p, columns: p.columns.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.columns.length || form.columns.some((c) => !c.title.trim())) {
      setFormError('All columns must have a name.')
      return
    }
    const { data, error } = editingId
      ? await api('PUT', '/boards/' + editingId, form)
      : await api('POST', '/boards', { ...form, projectId })
    if (error) { setFormError(error?.message || error?.error || 'Failed to save board.'); return }
    if (editingId) {
      setBoards((prev) => prev.map((b) => (b._id === editingId ? data : b)))
    } else {
      setBoards((prev) => [...prev, data])
    }
    setForm({ name: '', columns: JSON.parse(JSON.stringify(defaultColumns)), swimlane: '' })
    setShowForm(false)
    setEditingId(null)
  }

  const startEdit = (board) => {
    setForm({ name: board.name || '', columns: board.columns || JSON.parse(JSON.stringify(defaultColumns)), swimlane: board.swimlane || '' })
    setEditingId(board._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this board configuration?')) return
    const { error } = await api('DELETE', '/boards/' + id)
    if (error) return
    setBoards((prev) => prev.filter((b) => b._id !== id))
  }

  return (
    <div>
      <PageHeader
        icon={FiColumns}
        title="Board"
        highlight="Config"
        subtitle="Customize Kanban columns and swimlanes"
        action={
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', columns: JSON.parse(JSON.stringify(defaultColumns)), swimlane: '' }); setFormError('') }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-md hover:from-orange-500 hover:to-orange-600 transition-all">
            <FiPlus size={18} /> {showForm ? 'Cancel' : 'New Board'}
          </button>
        }
      />

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 mb-6 space-y-4"
        >
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">{formError}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Board Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Main Board"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Columns <button type="button" onClick={addColumn} className="text-orange-500 hover:text-orange-600 ml-2">+ Add</button></label>
            <div className="space-y-2">
              {form.columns.map((col, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={col.title} onChange={(e) => updateColumn(i, 'title', e.target.value)} placeholder="Column name"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
                  <input type="number" value={col.limit || ''} onChange={(e) => updateColumn(i, 'limit', parseInt(e.target.value) || 0)} placeholder="WIP"
                    className="w-16 px-2 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white text-xs text-center focus:ring-2 focus:ring-orange-500 outline-none transition" title="WIP Limit" />
                  <button type="button" onClick={() => removeColumn(i)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><FiTrash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Swimlane (optional)</label>
            <input type="text" value={form.swimlane} onChange={(e) => setForm((p) => ({ ...p, swimlane: e.target.value }))} placeholder="e.g. Team, Priority"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>

          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 transition-all shadow-md">
            <FiSave size={16} /> {editingId ? 'Update Board' : 'Create Board'}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="space-y-2 max-w-2xl">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#151515] rounded-xl animate-pulse" />)}
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] max-w-2xl">
          <FiColumns size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Board Configs</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Create custom Kanban column layouts.</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {boards.filter(Boolean).map((board) => (
            <div key={board._id} className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-5 hover:border-orange-500/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white">{board.name || 'Unnamed Board'}</h3>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(board)} className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all"><FiEdit2 size={14} /></button>
                  <button onClick={() => handleDelete(board._id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><FiTrash2 size={14} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(board.columns || []).map((col, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-400 font-medium border border-gray-200 dark:border-[#1a1a1a]">
                    {col.title}{col.limit > 0 ? ` (${col.limit})` : ''}
                  </span>
                ))}
              </div>
              {board.swimlane && (
                <p className="text-xs text-gray-400 mt-2 font-medium">Swimlane: {board.swimlane}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BoardConfig