import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiColumns, FiPlus } from 'react-icons/fi'
import PageHeader from '../../../components/PageHeader'
import api from '../../../utils/api'
import useAuthStore from '../../../stores/authStore'

const defaultStatuses = ['Not Started', 'In Progress', 'Paused', 'Completed']

const KanbanBoard = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState([])
  const [labels, setLabels] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragTask, setDragTask] = useState(null)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState('member')
  const [statuses, setStatuses] = useState(defaultStatuses)

  const isCreatorOrManager = role === 'creator' || role === 'manager'

  useEffect(() => {
    const load = async () => {
      const [tasksRes, labelsRes, usersRes, boardsRes] = await Promise.allSettled([
        api('GET', '/project-tasks/' + projectId + '/tasks'),
        api('GET', '/labels/project/' + projectId),
        api('GET', '/manageusers/' + projectId + '/get-all-users'),
        api('GET', '/boards/project/' + projectId),
      ])
      if (tasksRes.status === 'fulfilled') {
        const d = tasksRes.value.data
        setTasks(d.tasks || d || [])
      }
      if (labelsRes.status === 'fulfilled') setLabels(labelsRes.value.data || [])
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || [])
      if (boardsRes.status === 'fulfilled' && boardsRes.value.data?.length > 0) {
        const cols = boardsRes.value.data[0].columns || []
        if (cols.length > 0) setStatuses(cols.map((c) => c.title))
      }
      setLoading(false)
    }
    load()
    const checkRole = async () => {
      const { data } = await api('GET', '/admin-projects/' + projectId)
      if (!data.error) setRole('creator')
      else {
        const { data: mgrData } = await api('GET', '/joinedprojects/' + projectId)
        if (mgrData?.project?.manager === user?._id) setRole('manager')
      }
    }
    checkRole()
  }, [projectId])

  const isOwnTask = (task) => {
    const assignedId = task.assignedTo?._id || task.assignedTo?.user?._id || task.assignedTo
    return assignedId === user?._id
  }

  const handleDrop = async (taskId, newStatus) => {
    const task = tasks.find((t) => t._id === taskId)
    if (!task || task.status === newStatus) return
    if (!isCreatorOrManager && !isOwnTask(task)) return
    setSaving(true)
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)))
    const { error } = await api('PATCH', '/projecttasks/tasks/update', { updates: [{ id: taskId, status: newStatus }] })
    if (error) setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: task.status } : t)))
    setSaving(false)
  }

  const getUserName = (task) => {
    if (task.user?.name) return task.user.name
    if (task.assignedTo?.name) return task.assignedTo.name
    if (task.assignedTo?.user?.name) return task.assignedTo.user.name
    return null
  }

  const getUserAvatar = (task) => {
    if (task.user?.avatar) return task.user.avatar
    if (task.assignedTo?.avatar) return task.assignedTo.avatar
    return '1'
  }

  return (
    <div>
      <PageHeader
        icon={FiColumns}
        title="Kanban"
        highlight="Board"
        subtitle="Drag-and-drop mission control"
        action={
          <button onClick={() => navigate(`/projects/${projectId}/manage`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-md hover:from-orange-500 hover:to-orange-600 transition-all">
            <FiPlus size={18} /> Add Task
          </button>
        }
      />

      {saving && (
        <div className="mb-4 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 rounded-xl text-sm font-bold flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          Synchronizing...
        </div>
      )}

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {defaultStatuses.map((s) => (
            <div key={s} className="flex-1 min-w-[280px] bg-gray-100 dark:bg-[#151515] rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status || t.task?.status === status)
            return (
              <div key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const id = e.dataTransfer.getData('taskId'); if (id) handleDrop(id, status) }}
                className="flex-1 min-w-[280px] bg-gray-100 dark:bg-[#151515] rounded-xl p-4"
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between px-1">
                  {status}
                  <span className="text-xs bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full font-bold shadow-sm">{columnTasks.length}</span>
                </h3>
                <div className="space-y-3 min-h-[200px]">
                  <AnimatePresence>
                    {columnTasks.map((item, i) => {
                      const task = item.task || item
                      return (
                        <motion.div
                          key={task._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.03 }}
                          draggable={isCreatorOrManager || isOwnTask(task)}
                          onDragStart={(e) => { e.dataTransfer.setData('taskId', task._id); setDragTask(task._id) }}
                          onDragEnd={() => setDragTask(null)}
                          onClick={() => navigate(`/tasks/${task._id}`)}
                          className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-4 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{task.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded font-bold shrink-0 ${
                              task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>{task.priority}</span>
                          </div>
                          {(task.labels || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {task.labels.slice(0, 3).map((l, li) => (
                                <span key={li} className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                                  style={{ backgroundColor: (l.color || '#ea580c') + '20', color: l.color || '#ea580c' }}
                                >{l.name || l}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            {getUserName(task) && (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white text-[10px] font-bold">
                                  {getUserName(task).charAt(0)}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{getUserName(task)}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(task.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                    {columnTasks.length === 0 && (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No tasks</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default KanbanBoard