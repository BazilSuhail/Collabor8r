import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { FiClock, FiPlus, FiTrash2, FiEdit2, FiSave } from 'react-icons/fi'
import ProjectHeader from '../../../components/ui/ProjectHeader'
import { get, put, post, del } from '../../../utils/http'

const TimeTracking = () => {
  const { projectId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState({ taskId: '', hours: '', description: '', date: new Date().toISOString().split('T')[0] })
  const [editingId, setEditingId] = useState(null)
  const [entries, setEntries] = useState([])

  useEffect(() => {
    const load = async () => {
      const [reportRes, tasksRes] = await Promise.allSettled([
        get('/time/report/project/' + projectId),
        get('/manageTasks/project/' + projectId),
      ])
      if (reportRes.status === 'fulfilled') {
        const d = reportRes.value.data
        setReport(d)
        setEntries(d.entries || [])
      }
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.validTasks || tasksRes.value.data.tasks || tasksRes.value.data || [])
      setLoading(false)
    }
    load()
  }, [projectId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.taskId || !form.hours) return
    try {
      if (editingId) {
        const { data } = await put('/time/entries/' + editingId, { hours: parseFloat(form.hours), description: form.description, date: form.date })
        setEntries((prev) => prev.map((e) => (e._id === editingId ? data : e)))
      } else {
        const { data } = await post('/time/entries', { taskId: form.taskId, hours: parseFloat(form.hours), description: form.description, date: form.date })
        const entry = data.entry || data
        setEntries((prev) => [...prev, entry])
      }
      setForm({ taskId: '', hours: '', description: '', date: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      console.error('Time entry save failed:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this time entry?')) return
    try {
      await del('/time/entries/' + id)
      setEntries((prev) => prev.filter((e) => e._id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const startEdit = (entry) => {
    setEditingId(entry._id)
    setForm({
      taskId: entry.task?._id || entry.taskId || '',
      hours: entry.hours || '',
      description: entry.description || '',
      date: entry.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
    })
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <div className=" mx-auto">
        <ProjectHeader
          icon={FiClock}
          projectId={projectId}
          title="Time"
          highlight="Tracking"
          subtitle="Hours logged across operations"
          pageLabel="Time"
          action={
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ taskId: '', hours: '', description: '', date: new Date().toISOString().split('T')[0] }) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-md hover:from-orange-500 hover:to-orange-600 transition-all">
              <FiPlus size={18} /> {showForm ? 'Cancel' : 'Log Time'}
            </button>
          }
        />

      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Hours', value: report.totalHours || 0, unit: 'h' },
            { label: 'Hours Remaining', value: tasks.reduce((sum, t) => sum + (Number(t.remainingHours) || 0), 0), unit: 'h' },
            { label: 'Total Entries', value: report.entryCount || 0, unit: '' },
            { label: 'Avg per Entry', value: report.totalHours && report.entryCount ? (report.totalHours / report.entryCount).toFixed(1) : 0, unit: 'h' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-4"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}{stat.unit}</p>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className=" bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Task</label>
              <select value={form.taskId} onChange={(e) => setForm((p) => ({ ...p, taskId: e.target.value }))} required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition appearance-none"
              >
                <option value="">Select task...</option>
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>{t.title?.length > 40 ? t.title.slice(0, 40) + '...' : t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Hours</label>
              <input type="number" step="0.5" min="0.5" max="24" value={form.hours} onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))} required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What did you work on?"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
            </div>
          </div>
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 transition-all shadow-md">
            <FiSave size={16} /> {editingId ? 'Update Entry' : 'Log Time'}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#151515] rounded-xl animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a]">
          <FiClock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Time Entries</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Log time to track your work.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <motion.div key={entry._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between p-4 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] hover:border-orange-500/30 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white shadow-md shrink-0">
                  <FiClock size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{entry.task?.title || entry.description || 'Time entry'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                    {entry.user?.name || 'Someone'} · {entry.date ? new Date(entry.date).toLocaleDateString() : entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''}
                  </p>
                  {entry.description && entry.task?.title && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-lg font-black text-gray-900 dark:text-white">{entry.hours || entry.loggedHours}h</span>
                <button onClick={() => startEdit(entry)} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all opacity-0 group-hover:opacity-100"><FiEdit2 size={14} /></button>
                <button onClick={() => handleDelete(entry._id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"><FiTrash2 size={14} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

export default TimeTracking
