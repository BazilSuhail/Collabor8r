import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { FiZap, FiPlus, FiTrash2, FiEdit2, FiSave, FiPlay } from 'react-icons/fi'
import ProjectHeader from '../../../components/ui/ProjectHeader'
import { get, put, post, del } from '../../../utils/http'

const eventOptions = ['project.created', 'task.created', 'task.updated', 'task.completed', 'task.deleted', 'sprint.activated', 'sprint.completed', 'comment.added', 'member.added']

const Webhooks = () => {
  const { projectId } = useParams()
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', url: '', events: [], secret: '' })

  useEffect(() => {
    const load = async () => {
      const { data } = await get('/webhooks/project/' + projectId)
      setWebhooks(data || [])
      setLoading(false)
    }
    load()
  }, [projectId])

  const toggleEvent = (event) => {
    setForm((p) => ({
      ...p,
      events: p.events.includes(event) ? p.events.filter((e) => e !== event) : [...p.events, event]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.url.trim() || !form.events.length) return
    try {
      if (editingId) {
        const { data } = await put('/webhooks/' + editingId, form)
        setWebhooks((prev) => prev.map((w) => (w._id === editingId ? data : w)))
      } else {
        const { data } = await post('/webhooks', { ...form, projectId })
        setWebhooks((prev) => [...prev, data])
      }
      setForm({ name: '', url: '', events: [], secret: '' })
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      console.error('Webhook save failed:', err)
    }
  }

  const startEdit = (hook) => {
    setForm({ name: hook.name || '', url: hook.url, events: hook.events || [], secret: hook.secret || '' })
    setEditingId(hook._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this webhook?')) return
    await del('/webhooks/' + id)
    setWebhooks((prev) => prev.filter((w) => w._id !== id))
  }

  const handleTest = async (id) => {
    try {
      const { data } = await post('/webhooks/' + id + '/test')
      alert('Test result: ' + (data.statusCode || data.status || 'sent'))
    } catch (err) {
      console.error('Test failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <div className="max-w-[1000px] mx-auto">
        <ProjectHeader
          icon={FiZap}
          projectId={projectId}
          title="Webhook"
          highlight="Integrations"
          subtitle="Configure external communications"
          pageLabel="Webhooks"
          action={
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', url: '', events: [], secret: '' }) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-md hover:from-orange-500 hover:to-orange-600 transition-all">
              <FiPlus size={18} /> {showForm ? 'Cancel' : 'New Webhook'}
            </button>
          }
        />

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 mb-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Name (optional)</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="My Integration"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Webhook URL</label>
            <input type="url" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://hooks.example.com/webhook" required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Events</label>
            <div className="flex flex-wrap gap-2">
              {eventOptions.map((ev) => (
                <label key={ev} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  form.events.includes(ev) ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' : 'bg-gray-100 dark:bg-[#151515] text-gray-500 dark:text-gray-400 border border-transparent'
                }`}>
                  <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} className="hidden" />
                  {ev.replace(/\./g, ' ')}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Secret (optional)</label>
            <input type="text" value={form.secret} onChange={(e) => setForm((p) => ({ ...p, secret: e.target.value }))} placeholder="HMAC secret"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 transition-all shadow-md">
            <FiSave size={16} /> {editingId ? 'Update Webhook' : 'Create Webhook'}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#151515] rounded-xl animate-pulse" />)}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a]">
          <FiZap size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Webhooks</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Configure integrations for real-time events.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((hook) => (
            <div key={hook._id} className="flex items-center justify-between p-4 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] hover:border-orange-500/30 transition-all group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{hook.name || 'Webhook'}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    hook.isActive !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>{hook.isActive !== false ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">{hook.url}</p>
                {hook.events?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hook.events.map((ev) => (
                      <span key={ev} className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#151515] text-gray-500 dark:text-gray-400">{ev.replace(/\./g, ' ')}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0 ml-4">
                <button onClick={() => handleTest(hook._id)} className="p-2.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all" title="Test"><FiPlay size={16} /></button>
                <button onClick={() => startEdit(hook)} className="p-2.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100" title="Edit"><FiEdit2 size={16} /></button>
                <button onClick={() => handleDelete(hook._id)} className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Delete"><FiTrash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

export default Webhooks
