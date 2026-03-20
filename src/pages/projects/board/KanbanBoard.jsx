import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiColumns, FiPlus, FiFilter, FiX } from 'react-icons/fi'
import ProjectHeader from '../../../components/ui/ProjectHeader'
import api from '../../../utils/api'
import useAuthStore from '../../../stores/authStore'

const defaultColumns = [
  { name: 'Not Started', statuses: [], wipLimit: 0 },
  { name: 'In Progress', statuses: [], wipLimit: 0 },
  { name: 'Paused', statuses: [], wipLimit: 0 },
  { name: 'Completed', statuses: [], wipLimit: 0 },
]

const emptyTaskForm = { title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '', sprintId: '' }

const KanbanBoard = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [sprints, setSprints] = useState([])
  const [columns, setColumns] = useState(defaultColumns)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState('member')
  const [sprintFilter, setSprintFilter] = useState('all')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [taskError, setTaskError] = useState('')

  const isCreatorOrManager = role === 'creator' || role === 'manager'
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const load = async () => {
      const [tasksRes, usersRes, boardsRes, sprintsRes] = await Promise.allSettled([
        api('GET', '/project-tasks/' + projectId + '/tasks'),
        api('GET', '/manageusers/' + projectId + '/get-all-users'),
        api('GET', '/boards/project/' + projectId),
        api('GET', '/sprints/' + projectId),
      ])
      if (tasksRes.status === 'fulfilled') {
        const d = tasksRes.value.data
        setTasks(d.tasks || d || [])
      }
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || [])
      if (sprintsRes.status === 'fulfilled') setSprints(sprintsRes.value.data || [])
      if (boardsRes.status === 'fulfilled' && boardsRes.value.data?.length > 0) {
        const cols = boardsRes.value.data[0].columns || []
        if (cols.length > 0) {
          setColumns(cols.map((c) => ({
            name: c.name || c.title || '',
            statuses: (c.statuses || []).filter(Boolean),
            wipLimit: c.wipLimit ?? c.limit ?? 0,
          })))
        }
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
  }, [projectId, reloadKey, user?._id])

  const getTask = (item) => item.task || item

  const isOwnTask = (task) => {
    const assignedId = task.assignedTo?._id || task.assignedTo?.user?._id || task.assignedTo
    return assignedId === user?._id
  }

  const setTaskInList = (taskId, updater) => {
    setTasks((prev) => prev.map((item) => {
      if (getTask(item)._id !== taskId) return item
      if (item.task) return { ...item, task: updater(item.task) }
      return updater(item)
    }))
  }

  const handleDrop = async (taskId, newStatus) => {
    const item = tasks.find((t) => getTask(t)._id === taskId)
    if (!item) return
    const task = getTask(item)
    if (task.status === newStatus) return
    if (!isCreatorOrManager && !isOwnTask(task)) return
    setSaving(true)
    setTaskInList(taskId, (t) => ({ ...t, status: newStatus }))
    const { error } = await api('PATCH', '/projecttasks/tasks/update', { updates: [{ id: taskId, status: newStatus }] })
    if (error) setTaskInList(taskId, (t) => ({ ...t, status: task.status }))
    setSaving(false)
  }

  const taskInColumn = (item, col) => {
    const st = getTask(item).status
    const colStatuses = (col.statuses || []).filter(Boolean)
    if (colStatuses.length > 0) return colStatuses.includes(st)
    return col.name === st
  }

  const visibleTasks = tasks.filter((item) => {
    const sprintId = getTask(item).sprintId
    if (sprintFilter === 'all') return true
    if (sprintFilter === 'backlog') return !sprintId
    return String(sprintId) === sprintFilter
  })

  const getUserName = (item) => {
    const t = getTask(item)
    if (t.user?.name) return t.user.name
    if (t.assignedTo?.name) return t.assignedTo.name
    if (t.assignedTo?.user?.name) return t.assignedTo.user.name
    return null
  }

  const openQuickAdd = () => {
    setTaskForm({ ...emptyTaskForm, sprintId: (sprintFilter !== 'all' && sprintFilter !== 'backlog') ? sprintFilter : '' })
    setTaskError('')
    setShowQuickAdd(true)
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim() || !taskForm.dueDate) { setTaskError('Title and due date are required.'); return }
    const body = {
      ...taskForm,
      projectId,
      assignedTo: !isCreatorOrManager ? (taskForm.assignedTo || user?._id) : taskForm.assignedTo,
      description: taskForm.description || 'No description provided',
    }
    if (!body.assignedTo) body.assignedTo = user?._id
    if (!body.sprintId) delete body.sprintId
    const { error } = await api('POST', '/manageTasks/', body)
    if (error) { setTaskError('Failed to create task.'); return }
    setTaskForm(emptyTaskForm)
    setShowQuickAdd(false)
    setReloadKey((k) => k + 1)
  }

  const handleTaskChange = (e) => {
    const { name, value } = e.target
    setTaskForm((prev) => ({ ...prev, [name]: value }))
  }

  const sprintName = (id) => {
    const s = sprints.find((s) => s._id === id)
    return s?.name || ''
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        <ProjectHeader
          projectId={projectId}
          icon={FiColumns}
          title="Kanban"
          highlight="Operation Board"
          subtitle="Drag-and-drop mission control"
          pageLabel="Board"
          action={
            <button onClick={openQuickAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-md hover:from-orange-500 hover:to-orange-600 transition-all">
              <FiPlus size={18} /> Quick Add Task
            </button>
          }
        />

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" size={16} />
          <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition cursor-pointer">
            <option value="all">All Tasks</option>
            <option value="backlog">Backlog (unscheduled)</option>
            {sprints.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          {sprintFilter !== 'all' && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold">
              {sprintFilter === 'backlog' ? 'Backlog' : sprintName(sprintFilter)}
            </span>
          )}
        </div>

        {saving && (
          <div className="px-4 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 rounded-xl text-sm font-bold flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            Synchronizing...
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {defaultColumns.map((s) => (
            <div key={s.name} className="flex-1 min-w-[280px] bg-gray-100 dark:bg-[#151515] rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const columnTasks = visibleTasks.filter((item) => taskInColumn(item, col))
            const wipLimit = col.wipLimit || 0
            return (
              <div key={col.name}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const id = e.dataTransfer.getData('taskId'); if (id) handleDrop(id, col.name) }}
                className="flex-1 min-w-[280px] bg-gray-100 dark:bg-[#151515] rounded-xl p-4"
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between px-1">
                  <span className="flex items-center gap-2">
                    {col.name}
                    {wipLimit > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        columnTasks.length > wipLimit ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
                      }`}>{columnTasks.length}/{wipLimit}</span>
                    )}
                  </span>
                  <span className="text-xs bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full font-bold shadow-sm">{columnTasks.length}</span>
                </h3>
                <div className="space-y-3 min-h-[200px]">
                  <AnimatePresence>
                    {columnTasks.map((item, i) => {
                      const task = getTask(item)
                      return (
                        <motion.div
                          key={task._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.03 }}
                          draggable={isCreatorOrManager || isOwnTask(task)}
                          onDragStart={(e) => { e.dataTransfer.setData('taskId', task._id) }}
                          onDragEnd={() => {}}
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
                            {getUserName(item) && (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white text-[10px] font-bold">
                                  {getUserName(item).charAt(0)}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{getUserName(item)}</span>
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

      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-lg relative p-8 max-h-[95vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setShowQuickAdd(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-orange-600 transition-colors rounded-xl dark:hover:bg-[#151515]"><FiX className="text-2xl" /></button>

              <header className="mb-4">
                <h3 className="text-2xl font-bold dark:text-white tracking-tight">Quick Add Task</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Drop straight onto the board.</p>
              </header>
              <div className="h-[1px] bg-gray-100 dark:bg-[#1a1a1a] w-full mb-6" />

              {taskError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold mb-4">{taskError}</div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Task Title</label>
                  <input type="text" name="title" value={taskForm.title} onChange={handleTaskChange} placeholder="Primary objective"
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-[#151515] dark:text-white border border-transparent focus:border-orange-500/50 rounded-xl outline-none transition-all" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Priority</label>
                    <select name="priority" value={taskForm.priority} onChange={handleTaskChange}
                      className="w-full px-5 py-3 bg-gray-50 dark:bg-[#151515] dark:text-white border border-transparent hover:border-orange-500/30 rounded-xl outline-none transition-all appearance-none cursor-pointer">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Due Date</label>
                    <input type="date" name="dueDate" value={taskForm.dueDate} onChange={handleTaskChange}
                      className="w-full px-5 py-3 bg-gray-50 dark:bg-[#151515] dark:text-white border border-transparent focus:border-orange-500/50 rounded-xl outline-none transition-all" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Assign To</label>
                    <select name="assignedTo" value={taskForm.assignedTo} onChange={handleTaskChange}
                      className="w-full px-5 py-3 bg-gray-50 dark:bg-[#151515] dark:text-white border border-transparent hover:border-orange-500/30 rounded-xl outline-none transition-all appearance-none cursor-pointer">
                      <option value="">Select Contributor</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    {!isCreatorOrManager && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">You can only assign tasks to yourself</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Sprint</label>
                    <select name="sprintId" value={taskForm.sprintId} onChange={handleTaskChange}
                      className="w-full px-5 py-3 bg-gray-50 dark:bg-[#151515] dark:text-white border border-transparent hover:border-orange-500/30 rounded-xl outline-none transition-all appearance-none cursor-pointer">
                      <option value="">No Sprint</option>
                      {sprints.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Description</label>
                  <textarea name="description" value={taskForm.description} onChange={handleTaskChange} placeholder="Specific requirements and success criteria..."
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-[#151515] dark:text-white border border-transparent focus:border-orange-500/50 rounded-xl outline-none transition-all h-24 resize-none" />
                </div>

                <button type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]">
                  <FiPlus className="text-xl" /> Add to Board
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

export default KanbanBoard
