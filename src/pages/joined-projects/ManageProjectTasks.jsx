import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { GrChapterAdd } from 'react-icons/gr'
import { FiTrash2, FiEdit3, FiCalendar, FiZap, FiList, FiArrowLeft, FiChevronRight } from 'react-icons/fi'
import { LuDoorOpen } from 'react-icons/lu'
import { motion, AnimatePresence } from 'motion/react'
import { get, del } from '../../utils/http'
import useAuthStore from '../../stores/authStore'

const ManageProjectTasks = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [projectTeam, setProjectTeam] = useState(0)
  const [tasks, setTasks] = useState([])
  const [, setUsers] = useState([])
  const [sprints, setSprints] = useState([])
  const [, setLabels] = useState([])
  const [, setRole] = useState('member')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchAll = async () => {
    const [tasksRes, usersRes, sprintsRes, labelsRes] = await Promise.allSettled([
      get('/manageTasks/project/' + projectId),
      get('/manageusers/' + projectId + '/get-all-users'),
      get('/sprints/' + projectId),
      get('/labels/project/' + projectId),
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
      const { data } = await get('/admin-projects/' + projectId)
      if (!data.error) setRole('creator')
      else {
        const { data: mgrData } = await get('/joinedprojects/' + projectId)
        if (mgrData?.project?.manager === user?._id) setRole('manager')
      }
      setLoading(false)
    }
    load()
  }, [projectId])

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    const { error: err } = await del('/manageTasks/' + taskId)
    if (err) { setError('Failed to delete task.'); return }
    setSuccess('Task deleted successfully.')
    setTasks(prev => prev.filter(t => t._id !== taskId))
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
                  Task Board {loading ? '' : `· ${tasks.length} task${tasks.length === 1 ? '' : 's'}`}
                </p>
                <h1 className="mt-1 text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight break-words">
                  {loading ? 'Loading...' : projectName}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
                  Manage and assign tasks to your team
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl mt-auto" />
              </div>
            ))}
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
                <p className="text-sm text-gray-400 font-medium mb-6">Create your first task to get this board moving.</p>
                <button onClick={() => navigate(`/projects/${projectId}/tasks/create`)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs md:text-sm transition-all shadow-md shadow-orange-600/20">
                  <GrChapterAdd className="text-white" />
                  Create Task
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence>
                  {tasks.map((task) => {
                    const priorityMeta =
                      task.priority === 'High'
                        ? { grad: 'from-red-500 to-rose-600', text: 'bg-red-100 dark:bg-red-900/30 text-red-600' }
                        : task.priority === 'Medium'
                          ? { grad: 'from-amber-500 to-orange-600', text: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' }
                          : { grad: 'from-emerald-500 to-teal-600', text: 'bg-green-100 dark:bg-green-900/30 text-green-600' }
                    const statusStyle =
                      task.status === 'Completed' ? 'bg-green-600 text-white' :
                      task.status === 'In Progress' ? 'bg-orange-600 text-white' :
                      'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500'
                    const sprint = task.sprintId ? sprints.find((s) => s._id === task.sprintId) : null

                    return (
                      <motion.div
                        key={task._id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -5 }}
                        onClick={() => navigate(`/projects/${projectId}/tasks/${task._id}/edit`)}
                        className="group relative cursor-pointer bg-white dark:bg-[#0a0a0a] border border-gray-200/80 dark:border-[#1a1a1a] rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5"
                      >
                        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${priorityMeta.grad}`} />

                        {/* Header: Identity + Priority + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base text-white shadow-md bg-gradient-to-br ${priorityMeta.grad} shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                              {task.title?.charAt(0).toUpperCase() || 'T'}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                {task.title}
                              </h3>
                              <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${priorityMeta.text}`}>
                                <span className="w-1 h-1 rounded-full bg-current" /> {task.priority || 'Low'}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${statusStyle}`}>
                            {task.status || 'Pending'}
                          </span>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
                        )}

                        {/* Labels */}
                        {(task.labels || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {task.labels.map((l, j) => (
                              <span key={j} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ backgroundColor: (l.color || '#ea580c') + '20', color: l.color || '#ea580c' }}>
                                {l.name || l}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Assignee + Sprint */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800/60 mt-auto">
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={`/avatars/${task.assignedTo?.avatar || '1'}.jpg`} alt={task.assignedTo?.name || 'Unassigned'} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#1a1a1a] shrink-0" />
                            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate">{task.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                          {sprint && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                              <FiCalendar size={11} /> {sprint.name}
                            </span>
                          )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/tasks/${task._id}/edit`) }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-all text-xs font-bold border border-orange-500/20"
                          >
                            <FiEdit3 className="text-sm" /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id) }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-xs font-bold"
                          >
                            <FiTrash2 className="text-sm" /> Delete
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageProjectTasks
