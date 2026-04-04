import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { FiLink, FiPlus, FiTrash2, FiChevronRight } from 'react-icons/fi'
import { GoLink } from 'react-icons/go'
import { MdOutlineLink } from 'react-icons/md'
import ProjectHeader from '../../components/ui/ProjectHeader'
import api from '../../utils/api'

const TaskDependencies = () => {
  const { projectId } = useParams()
  const [tasks, setTasks] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ sourceTaskId: '', targetTaskId: '', linkType: 'blocks' })

  const fetchLinks = async () => {
    const allLinkPromises = tasks.map((t) =>
      api('GET', '/task-links/task/' + t._id).then((res) => res.data || [])
    )
    const results = await Promise.allSettled(allLinkPromises)
    const allLinks = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value)
    const seen = new Set()
    setLinks(allLinks.filter((l) => { const k = l._id; if (seen.has(k)) return false; seen.add(k); return true }))
  }

  useEffect(() => {
    const load = async () => {
      const tasksRes = await api('GET', '/manageTasks/project/' + projectId)
      const taskList = tasksRes.data.validTasks || tasksRes.data.tasks || tasksRes.data || []
      setTasks(taskList)
      setLoading(false)
    }
    load()
  }, [projectId])

  useEffect(() => {
    if (tasks.length > 0) fetchLinks()
  }, [tasks.length])

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => !t.parentId)
  }, [tasks])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sourceTaskId || !form.targetTaskId || form.sourceTaskId === form.targetTaskId) return
    try {
      const { data } = await api('POST', '/task-links', { ...form, projectId })
      setLinks((prev) => [...prev, data])
      setForm({ sourceTaskId: '', targetTaskId: '', linkType: 'blocks' })
      setShowForm(false)
    } catch (err) {
      console.error('Link creation failed:', err)
    }
  }

  const handleDelete = async (linkId) => {
    if (!confirm('Remove this dependency link?')) return
    try {
      await api('DELETE', '/task-links/' + linkId)
      setLinks((prev) => prev.filter((l) => l._id !== linkId))
    } catch (err) {
      console.error(err)
    }
  }

  const getTaskTitle = (id) => {
    const task = tasks.find((t) => t._id === id)
    return task ? task.title : 'Unknown'
  }

  if (loading) {
    return (
      <div className="space-y-2 w-full">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#151515] rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <div className=" mx-auto">
        <ProjectHeader
          icon={GoLink}
          projectId={projectId}
          title="Task"
          highlight="Dependencies"
          subtitle="Link tasks with dependency relationships"
          pageLabel="Dependencies"
          action={
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-md hover:from-orange-500 hover:to-orange-600 transition-all">
              <FiPlus size={18} /> {showForm ? 'Cancel' : 'New Link'}
            </button>
          }
        />

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="w-full bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Source Task</label>
              <select value={form.sourceTaskId} onChange={(e) => setForm((p) => ({ ...p, sourceTaskId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition appearance-none"
              >
                <option value="">Select task...</option>
                {filteredTasks.map((t) => (
                  <option key={t._id} value={t._id}>{t.title?.length > 40 ? t.title.slice(0, 40) + '...' : t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Target Task</label>
              <select value={form.targetTaskId} onChange={(e) => setForm((p) => ({ ...p, targetTaskId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition appearance-none"
              >
                <option value="">Select task...</option>
                {filteredTasks.map((t) => (
                  <option key={t._id} value={t._id}>{t.title?.length > 40 ? t.title.slice(0, 40) + '...' : t.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Link Type</label>
            <select value={form.linkType} onChange={(e) => setForm((p) => ({ ...p, linkType: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition appearance-none"
            >
              <option value="blocks">Blocks</option>
              <option value="blocked-by">Blocked By</option>
              <option value="relates-to">Relates To</option>
              <option value="duplicates">Duplicates</option>
              <option value="depends-on">Depends On</option>
            </select>
          </div>

          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 transition-all shadow-md">
            <FiLink size={16} /> Create Link
          </button>
        </motion.form>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
          <FiLink size={14} /> Dependencies
          <span className="text-xs bg-gray-100 dark:bg-[#151515] text-gray-400 px-2 py-0.5 rounded-full font-bold">{links.length}</span>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a]">
            <FiLink size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Dependencies</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Link tasks to define relationships and order.</p>
          </div>
        ) : (
          links.map((link, i) => (
            <motion.div key={link._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-4 hover:border-orange-500/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MdOutlineLink className="text-orange-600 shrink-0" size={20} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{getTaskTitle(link.sourceTaskId)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        link.linkType === 'blocks' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        link.linkType === 'blocked-by' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        link.linkType === 'depends-on' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        link.linkType === 'relates-to' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>{link.linkType}</span>
                      <FiChevronRight size={14} className="text-gray-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{getTaskTitle(link.targetTaskId)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(link._id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
      </div>
    </div>
  )
}

export default TaskDependencies
