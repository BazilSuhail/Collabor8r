import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { FiGitBranch, FiChevronRight, FiUser, FiCalendar, FiTag } from 'react-icons/fi'
import PageHeader from '../components/ui/Header'
import api from '../utils/api'
import useAuthStore from '../stores/authStore'

const statuses = ['Not Started', 'In Progress', 'Paused', 'Completed']

const statusColors = {
  'Not Started': { bg: 'bg-gray-100 dark:bg-gray-800', dot: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-600' },
  'In Progress': { bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' },
  'Paused': { bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' },
  'Completed': { bg: 'bg-green-50 dark:bg-green-900/20', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400', border: 'border-green-300 dark:border-green-700' },
}

const Workflow = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragTask, setDragTask] = useState(null)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('all')
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    const load = async () => {
      const { data } = await api('GET', '/overview/assigned-tasks')
      const taskList = data.tasks || data || []
      setTasks(Array.isArray(taskList) ? taskList : [])
      const projSet = new Set()
      taskList.forEach((t) => { if (t.projectId) projSet.add(t.projectId) })
      const projList = Array.from(projSet).map((id) => {
        const t = taskList.find((tk) => tk.projectId === id)
        return { _id: id, name: t.projectName || id }
      })
      setProjects(projList)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = selectedProject === 'all' ? tasks : tasks.filter((t) => t.projectId === selectedProject)

  const grouped = {}
  statuses.forEach((s) => { grouped[s] = filtered.filter((t) => t.status === s) })

  const isOwnTask = (task) => {
    const assignedId = task.assignedTo?._id || task.assignedTo
    return assignedId === user?._id
  }

  const handleDrop = async (taskId, newStatus) => {
    const task = tasks.find((t) => t._id === taskId)
    if (!task || task.status === newStatus) return
    setSaving(true)
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)))
    const { error } = await api('PATCH', '/projecttasks/tasks/update', { updates: [{ id: taskId, status: newStatus }] })
    if (error) setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: task.status } : t)))
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader icon={FiGitBranch} title="Directive:" highlight="Workflow" subtitle="Drag tasks between stages to update status" />

      {saving && (
        <div className="mb-4 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 rounded-xl text-sm font-bold flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          Synchronizing directives...
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filter:</span>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none transition"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {statuses.map((status) => {
          const items = grouped[status] || []
          const colors = statusColors[status]
          return (
            <div key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData('taskId'); if (id) handleDrop(id, status) }}
              className={`bg-white dark:bg-[#0a0a0a] rounded-xl border ${colors.border} p-4 min-h-[300px] transition-all`}
            >
              <div className={`flex items-center justify-between mb-4 px-3 py-2 rounded-lg ${colors.bg}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <h3 className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>{status}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{items.length}</span>
              </div>

              <div className="space-y-2 min-h-[200px]">
                <AnimatePresence>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
                      <p className="text-xs font-medium">No tasks</p>
                    </div>
                  ) : items.map((task, i) => (
                    <motion.div key={task._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.02 }}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('taskId', task._id)}
                      onDragEnd={() => setDragTask(null)}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#1a1a1a] cursor-grab active:cursor-grabbing hover:border-orange-500/30 hover:shadow-md transition-all group"
                    >
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">{task.title}</p>
                      {(task.labels || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(task.labels || []).slice(0, 3).map((l, li) => (
                            <span key={li} className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                              style={{ backgroundColor: (l.color || '#ea580c') + '20', color: l.color || '#ea580c' }}
                            >{l.name || l}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>{task.priority}</span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                          {task.projectName && <span className="truncate max-w-[80px]">{task.projectName}</span>}
                          <FiChevronRight size={12} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                        {task.assignedTo?.name && (
                          <span className="flex items-center gap-1"><FiUser size={10} /> {task.assignedTo.name}</span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1"><FiCalendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Workflow
