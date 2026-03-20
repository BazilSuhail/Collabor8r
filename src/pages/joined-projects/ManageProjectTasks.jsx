import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import TaskModal from '../../components/modals/ManageTask'
import { GrChapterAdd } from 'react-icons/gr'
import { FiTrash2, FiEdit3, FiCalendar, FiZap, FiList, FiArrowLeft, FiChevronRight } from 'react-icons/fi'
import { LuDoorOpen } from 'react-icons/lu'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../utils/api'
import useAuthStore from '../../stores/authStore'

const ManageProjectTasks = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isModalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [projectTeam, setProjectTeam] = useState(0)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [sprints, setSprints] = useState([])
  const [labels, setLabels] = useState([])
  const [role, setRole] = useState('member')
  const [newTask, setNewTask] = useState({
    title: '', description: '', status: 'Not Started',
    priority: 'Medium', dueDate: '', assignedTo: '',
    sprintId: '', estimateHours: '', labels: [], parentId: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)

  const isCreatorOrManager = role === 'creator' || role === 'manager'

  const fetchAll = async () => {
    const [tasksRes, usersRes, sprintsRes, labelsRes] = await Promise.allSettled([
      api('GET', '/manageTasks/project/' + projectId),
      api('GET', '/manageusers/' + projectId + '/get-all-users'),
      api('GET', '/sprints/' + projectId),
      api('GET', '/labels/project/' + projectId),
    ])
    if (tasksRes.status === 'fulfilled') {
      const d = tasksRes.value.data
      setTasks(d.validTasks || d.tasks || d || [])
      setProjectName(d.projectName || '')
      setProjectTeam(d.projectTeam || 0)
    }
    if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || [])
    if (sprintsRes.status === 'fulfilled') setSprints(sprintsRes.value.data || [])
    if (labelsRes.status === 'fulfilled') setLabels(labelsRes.value.data || [])
  }

  useEffect(() => {
    const load = async () => {
      await fetchAll()
      const { data } = await api('GET', '/admin-projects/' + projectId)
      if (!data.error) setRole('creator')
      else {
        const { data: mgrData } = await api('GET', '/joinedprojects/' + projectId)
        if (mgrData?.project?.manager === user?._id) setRole('manager')
      }
      setLoading(false)
    }
    load()
  }, [projectId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setNewTask((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (field, id) => {
    setNewTask((prev) => {
      const arr = prev[field] || []
      return {
        ...prev,
        [field]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
      }
    })
  }

  const handleEditTask = (task) => {
    setEditingTaskId(task._id)
    setNewTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo ? (task.assignedTo._id || task.assignedTo) : '',
      sprintId: task.sprintId || '',
      estimateHours: task.estimateHours || '',
      labels: (task.labels || []).map((l) => l._id || l),
      parentId: task.parentId || '',
    })
    handleOpenModal()
  }

  const handleUpdateTask = async (e) => {
    e.preventDefault()
    const { error: err } = await api('PATCH', '/manageTasks/' + editingTaskId, {
      ...newTask,
      assignedTo: !isCreatorOrManager ? (newTask.assignedTo || user?._id) : newTask.assignedTo,
    })
    if (err) { setError('Failed to update task.'); return }
    setSuccess('Task updated successfully.')
    setEditingTaskId(null)
    setNewTask({ title: '', description: '', status: 'Not Started', priority: 'Medium', dueDate: '', assignedTo: '', sprintId: '', estimateHours: '', labels: [], parentId: '' })
    await fetchAll()
    handleCloseModal()
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    const { error: err } = await api('DELETE', '/manageTasks/' + taskId)
    if (err) { setError('Failed to delete task.'); return }
    setSuccess('Task deleted successfully.')
    setTasks(prev => prev.filter(t => t._id !== taskId))
  }

  const handleOpenModal = () => setModalOpen(true)
  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingTaskId(null)
    setNewTask({ title: '', description: '', status: 'Not Started', priority: 'Medium', dueDate: '', assignedTo: '', sprintId: '', estimateHours: '', labels: [], parentId: '' })
  }

  return (
    <div className='min-h-screen bg-[#fcfaf8] w-full dark:bg-[#000000] pt-4 transition-colors duration-300'>
      <div className="max-w-[1400px] mx-auto">
        <nav className="flex items-center gap-1.5 mb-5">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all">
            <FiArrowLeft size={14} /> Back
          </button>
          <span className="text-gray-300 dark:text-zinc-700"><FiChevronRight size={14} /></span>
          <span className="text-xs font-bold text-orange-600 px-2 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg truncate max-w-[180px] sm:max-w-xs">
            {loading ? 'Loading...' : projectName}
          </span>
        </nav>

        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                <FiZap size={18} className="sm:text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
                  Operation Board {loading ? '' : `· ${tasks.length} operation${tasks.length === 1 ? '' : 's'}`}
                </p>
                <h1 className="mt-1 text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight break-words">
                  {loading ? 'Loading...' : projectName}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
                  Manage and assign operations to team members
                </p>
              </div>
            </div>
            {!loading && projectTeam > 0 && (
              <button onClick={() => navigate(`/projects/${projectId}/tasks/create`)}
                className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs md:text-sm transition-all shadow-md shadow-orange-600/20 shrink-0">
                <GrChapterAdd className="text-base md:text-lg text-white" />
                <span>New Task</span>
              </button>
            )}
          </div>
          <div className="mt-5 h-px bg-gradient-to-r from-orange-500/40 via-gray-200 dark:via-zinc-800 to-transparent" />
        </header>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold">{error}</div>
        )}
        {success && (
          <div className="mb-4 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold">{success}</div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-zinc-800 rounded-xl w-48" />
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
              <div className="grid grid-cols-7 gap-4 px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-100 dark:border-[#1a1a1a]">
                {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-3 bg-gray-200 dark:bg-zinc-800 rounded" />)}
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4 px-6 py-5 border-b border-gray-50 dark:border-zinc-900/60">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-100 dark:bg-zinc-800/60 rounded-lg" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : projectTeam === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 md:py-20 bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-dashed border-gray-200 dark:border-[#1a1a1a]'>
            <div className="relative mb-4 md:mb-6">
              <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
              <img src="/Resources/7.png" alt="Empty Team" className="w-40 md:w-48 grayscale opacity-40 dark:invert brightness-0" />
            </div>
            <p className="text-base md:text-lg font-bold text-gray-800 dark:text-white text-center mb-2">No Team Members</p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 text-center mb-6 px-4 max-w-xs">Add team members to your project before creating tasks</p>
            <Link to={`/projects/${projectId}`} className="px-6 md:px-8 py-2.5 md:py-3 bg-white dark:bg-[#151515] text-orange-600 border border-orange-600 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-orange-600 hover:text-white transition-all shadow-sm">
              Add Team Member
            </Link>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center gap-3 text-orange-600 mb-2">
              <LuDoorOpen className='text-xl md:text-2xl' />
              <h3 className="text-base md:text-xl font-bold">Tasks</h3>
              <span className="ml-auto bg-gray-100 dark:bg-[#151515] text-gray-500 px-2.5 md:px-3 py-1 rounded-lg text-[9px] md:text-xs font-bold">{tasks.length} Total</span>
            </div>

            {tasks.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="py-14 md:py-16 text-center bg-white dark:bg-[#0a0a0a] rounded-2xl border border-dashed border-gray-200 dark:border-[#1a1a1a]">
                <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <FiList size={20} />
                </div>
                <p className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">No tasks yet</p>
                <p className="text-sm text-gray-400 font-medium mb-6">Create your first operation to get this board moving.</p>
                <button onClick={() => navigate(`/projects/${projectId}/tasks/create`)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs md:text-sm transition-all shadow-md shadow-orange-600/20">
                  <GrChapterAdd className="text-white" />
                  Create Task
                </button>
              </motion.div>
            ) : (
              <>
                <div className="md:hidden space-y-3">
                  <AnimatePresence>
                    {tasks.map((task) => (
                      <motion.div key={task._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1"><p className="font-bold text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{task.title}</p></div>
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase whitespace-nowrap ${
                            task.priority === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            task.priority === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                            'bg-green-100 dark:bg-green-900/30 text-green-600'
                          }`}>{task.priority}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(task.labels || []).map((l, i) => (
                            <span key={i} className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                              style={{ backgroundColor: (l.color || '#ea580c') + '20', color: l.color || '#ea580c' }}
                            >{l.name || l}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 py-2 border-t border-gray-100 dark:border-[#1a1a1a]">
                          <img src={`/avatars/${task.assignedTo?.avatar || '1'}.jpg`} alt={task.assignedTo?.name || 'Unassigned'} className="w-6 h-6 rounded-lg border border-gray-200 dark:border-[#1a1a1a]" />
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 flex-1 truncate">{task.assignedTo?.name || 'Unassigned'}</span>
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase ${
                            task.status === 'Completed' ? 'bg-green-600 text-white' :
                            task.status === 'In Progress' ? 'bg-orange-600 text-white' :
                            'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500'
                          }`}>{task.status}</span>
                        </div>
                        {task.sprintId && (
                          <div className="flex items-center gap-1 text-[9px] text-gray-400 dark:text-gray-500">
                            <FiCalendar size={10} />
                            <span>{sprints.find(s => s._id === task.sprintId)?.name || 'Sprint'}</span>
                          </div>
                        )}
                        <div className="flex gap-1 pt-2 border-t border-gray-100 dark:border-[#1a1a1a]">
                          <button onClick={() => handleEditTask(task)} className="flex-1 p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-all text-xs font-semibold">Edit</button>
                          <button onClick={() => handleDeleteTask(task._id)} className="flex-1 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all text-xs font-semibold">Delete</button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className='hidden md:block bg-white dark:bg-[#161515] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] shadow-sm overflow-hidden'>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-[#151515]/50 border-b border-gray-100 dark:border-[#1a1a1a]">
                          <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-400">Task Title</th>
                          <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-400">Priority</th>
                          <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-400">Assignee</th>
                          <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-400">Sprint</th>
                          <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-400">Labels</th>
                          <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                          <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
                        <AnimatePresence>
                          {tasks.map((task) => (
                            <motion.tr key={task._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="hover:bg-orange-50/30 dark:hover:bg-orange-500/5 transition-colors group">
                              <td className="py-4 px-6"><p className="font-bold text-sm text-gray-800 dark:text-gray-200">{task.title?.length > 40 ? `${task.title.slice(0, 40)}...` : task.title}</p></td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                  task.priority === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                  task.priority === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                  'bg-green-100 dark:bg-green-900/30 text-green-600'
                                }`}>{task.priority}</span>
                              </td>
                              <td className="py-4 px-6">
                                <div className='flex items-center gap-3'>
                                  <img src={`/avatars/${task.assignedTo?.avatar || '1'}.jpg`} alt={task.assignedTo?.name || 'Unassigned'} className="w-8 h-8 rounded-lg border-2 border-white dark:border-[#0a0a0a] shadow-sm" />
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{task.assignedTo?.name || 'Unassigned'}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{task.sprintId ? (sprints.find(s => s._id === task.sprintId)?.name || '—') : '—'}</span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-1 flex-wrap">
                                  {(task.labels || []).map((l, i) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                      style={{ backgroundColor: (l.color || '#ea580c') + '20', color: l.color || '#ea580c' }}
                                    >{l.name || l}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                  task.status === 'Completed' ? 'bg-green-600 text-white' :
                                  task.status === 'In Progress' ? 'bg-orange-600 text-white' :
                                  'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500'
                                }`}>{task.status}</span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditTask(task)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-all" title="Edit Task"><FiEdit3 className="text-lg" /></button>
                                  <button onClick={() => handleDeleteTask(task._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Delete Task"><FiTrash2 className="text-lg" /></button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <TaskModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleUpdateTask}
          newTask={newTask} users={users} handleChange={handleChange} handleCheckboxChange={handleCheckboxChange}
          editingTaskId={editingTaskId} sprints={sprints} labels={labels} allTasks={tasks}
          currentUser={user} isCreatorOrManager={isCreatorOrManager} />
      </div>
    </div>
  )
}

export default ManageProjectTasks
