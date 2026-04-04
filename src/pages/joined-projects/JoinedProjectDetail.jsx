import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { FaEye, FaUsers, FaCrown, FaProjectDiagram } from 'react-icons/fa'
import { FaPeopleGroup } from 'react-icons/fa6'
import { IoMdDoneAll } from 'react-icons/io'
import { CgUiKit } from 'react-icons/cg'
import { FiCheckCircle } from 'react-icons/fi'
import {
  FiColumns,
  FiCalendar,
  FiClock,
  FiActivity,
  FiFilter,
  FiZap,
  FiList,
  FiArrowLeft,
  FiChevronRight,
  FiArrowRight,
} from 'react-icons/fi'
import { GoLink } from 'react-icons/go'
import { motion } from 'motion/react'
import useProjectStore from '../../stores/projectStore'
import useAuthStore from '../../stores/authStore'
import api from '../../utils/api'
import TeamMembers from '../../components/modals/TeamMembers'

const navSections = (projectId) => [
  {
    title: 'Operations',
    items: [
      { to: `/projects/${projectId}/board`, label: 'Board', icon: FiColumns },
      { to: `/projects/${projectId}/manage`, label: 'Task List', icon: FiList },
      { to: `/projects/${projectId}/backlog`, label: 'Backlog', icon: FiCalendar },
      { to: `/projects/${projectId}/sprints`, label: 'Sprints', icon: FiCalendar },
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { to: `/projects/${projectId}/time`, label: 'Time', icon: FiClock },
      { to: `/projects/${projectId}/activity`, label: 'Activity', icon: FiActivity },
      { to: `/projects/${projectId}/filters`, label: 'Filters', icon: FiFilter },
      { to: `/projects/${projectId}/dependencies`, label: 'Links', icon: GoLink },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { to: `/projects/${projectId}/ai`, label: 'AI', icon: FiZap },
    ]
  },
]

const ProjectTasksSection = ({ tasks, creator }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 md:py-20'>
        <img src="/placeholders/joined.svg" alt='No tasks' className='w-full max-w-80 h-auto mx-auto opacity-80 dark:opacity-40 select-none pointer-events-none' />
        <p className="text-center font-bold text-gray-400 mt-6 tracking-widest text-xs">No tasks yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {tasks.map(({ task, user }) => (
        <div key={task._id} className="bg-gray-50 dark:bg-[#131313] border border-gray-100 dark:border-[#1a1a1a] rounded-2xl shadow-sm hover:shadow-xl hover:border-orange-500/20 dark:hover:border-orange-500/10 cursor-pointer transition-all duration-300 group p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className='w-14 h-14 bg-gray-100 dark:bg-[#151515] p-3 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-500 shrink-0'>
                <svg className="text-3xl" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              </div>
              <div className="min-w-0">
                <h3 className='font-bold text-sm md:text-base text-gray-800 dark:text-gray-100 mb-2 truncate max-w-[200px] md:max-w-[300px]'>{task.title}</h3>
                <div className='flex items-center gap-3 flex-wrap'>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                    task.status === 'Not Started' ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' :
                    task.status === 'Completed' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' :
                    'text-orange-600 bg-orange-100 dark:bg-orange-500/20'
                  }`}>{task.status}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                    task.priority === 'High' ? 'text-red-600 bg-red-100 dark:bg-red-900/30' :
                    task.priority === 'Medium' ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' :
                    'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
                  }`}>{task.priority}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className='flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 rounded-lg text-red-600 dark:text-red-400'>
                <span className="text-[12px] font-black tracking-tighter">Deadline</span>
                <span className='text-xs font-semibold'>{task.dueDate ? new Date(task.dueDate.$date || task.dueDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              {user && (
                <div className="flex items-center gap-3 p-1 pl-3 pr-1 bg-gray-100 dark:bg-[#151515] rounded-xl border border-transparent group-hover:border-orange-500/20 transition-all">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Assigned:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{user.name}</span>
                    <img src={`/avatars/${user.avatar || 1}.jpg`} alt={user.name} className="w-8 h-8 rounded-lg border-2 border-white dark:border-[#0a0a0a]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const JoinedProjectDetail = () => {
  const { user } = useAuthStore()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentProject, fetchProjectDetail } = useProjectStore()
  const [myTasks, setMyTasks] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [view, setView] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchProjectDetail(projectId)
  }, [projectId])

  useEffect(() => {
    const fetchProjectTasks = async () => {
      try {
        const { data } = await api('GET', '/projecttasks/' + projectId)
        const tasks = data.tasks || []
        const assignedToMe = tasks.filter(t => t.task?.assignedTo === user?._id)
        setAllTasks(tasks)
        setMyTasks(assignedToMe)
      } catch { /* ignore */ }
    }
    if (projectId) fetchProjectTasks()
  }, [projectId, user?._id])

  const project = currentProject
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const themePath = `/themes/${project.theme || 1}.jpg`

  const stats = [
    { label: 'Team Size', value: project.team?.length || 0, icon: FaUsers, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Tasks', value: allTasks.length, icon: IoMdDoneAll, color: 'from-orange-500 to-orange-600' },
    { label: 'My Tasks', value: myTasks.length, icon: FiCheckCircle, color: 'from-emerald-500 to-green-600' },
  ]

  return (
    <main className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto pb-10">

        {/* Hero Banner */}
        <div className="relative h-64 sm:h-72 md:h-72 rounded-2xl md:rounded-3xl overflow-hidden border border-gray-100 dark:border-[#1a1a1a] shadow-xl">
          <img src={themePath} alt={project.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Top Bar Actions */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4 md:p-5 z-10">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-bold transition-all active:scale-95 border border-white/20 shrink-0"
              >
                <FiArrowLeft size={13} />
                <span className="hidden sm:inline">Back</span>
              </button>
              <span className="hidden sm:inline-flex items-center text-white/40"><FiChevronRight size={14} /></span>
              <span className="inline-flex items-center px-3 py-2 md:px-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-bold truncate max-w-[120px] sm:max-w-[220px] md:max-w-xs border border-white/20 transition-all">
                {project.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Joined
              </span>
            </div>
          </div>

          {/* Banner Details */}
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest">
                  <FaProjectDiagram size={10} /> Project Overview
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
                  Theme {project.theme || 1}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tighter leading-none mb-2 md:mb-3 drop-shadow-lg">
                {project.name}
              </h1>
              <p className="max-w-2xl text-xs md:text-sm text-gray-200 line-clamp-2 md:line-clamp-none font-medium opacity-90">
                {project.description || 'No description provided.'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Body Section */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8 mt-6 md:mt-8">

          {/* Sub-menu Navigation Sidebar */}
          <aside className="lg:col-span-3 xl:col-span-2">
            <div className="lg:sticky lg:top-4 flex flex-col gap-5">
              {navSections(projectId).map((section) => (
                <div key={section.title} className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-3">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 to-transparent" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                      {section.title}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {section.items.map(({ to, label, icon: Icon }) => {
                      const active = location.pathname === to
                      return (
                        <Link
                          key={to}
                          to={to}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all group ${
                            active
                              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600'
                          }`}
                        >
                          <Icon size={14} className="shrink-0" />
                          <span className="truncate">{label}</span>
                          <FiArrowRight size={12} className={`ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'opacity-60' : ''}`} />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Dashboard Content */}
          <div className="lg:col-span-9 xl:col-span-10 space-y-6 md:space-y-8">

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-[#0a0a0a] rounded-xl md:rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-4 md:p-5 hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md shrink-0`}>
                      <stat.icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                      <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* About Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-7"
            >
              <div className="flex items-center gap-3 text-orange-600 mb-4">
                <CgUiKit className="text-lg md:text-xl" />
                <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">About Project</h3>
              </div>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {project.description || 'No description provided.'}
              </p>
            </motion.div>

            {/* Tasks Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-7"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-6">
                <div className="flex items-center gap-3 text-orange-600">
                  <div className="w-1.5 md:w-2 h-6 md:h-8 bg-orange-600 rounded-full" />
                  <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">
                    {view === 'all' ? 'All Tasks' : 'My Tasks'}
                  </h3>
                </div>
                <div className="flex gap-2 bg-gray-50 dark:bg-[#151515] p-1.5 rounded-xl border border-gray-100 dark:border-[#1a1a1a] w-full sm:w-auto">
                  <button
                    onClick={() => setView('all')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      view === 'all' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setView('my')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      view === 'my' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600'
                    }`}
                  >
                    Mine
                  </button>
                </div>
              </div>

              <ProjectTasksSection tasks={view === 'all' ? allTasks : myTasks} creator={project.createdBy} />
            </motion.div>

            {/* Team Members Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-7"
            >
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <div className="flex items-center gap-3 text-orange-600">
                  <FaPeopleGroup className="text-lg md:text-xl" />
                  <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Team Members</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs text-orange-600 hover:text-white hover:bg-orange-600 font-bold rounded-lg transition-all"
                >
                  <FaEye size={12} /> View All
                </button>
              </div>

              {(project.team || []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto custom-scrollbar">
                  {(project.team || []).map((member) => (
                    <div
                      key={member._id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all group/member border ${
                        member._id === user?._id
                          ? 'bg-orange-50/60 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#151515] hover:border-gray-100 dark:hover:border-[#1a1a1a]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={`/avatars/${member.avatar || 1}.jpg`}
                          alt={member.name}
                          className="w-9 h-9 md:w-10 md:h-10 rounded-lg border border-gray-200 dark:border-[#1a1a1a] shadow-sm grayscale group-hover/member:grayscale-0 transition-all"
                        />
                        {member._id === user?._id && (
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#0a0a0a] rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {member.name}
                          {member._id === user?._id && <span className="ml-1.5 text-[8px] md:text-[9px] text-orange-600 font-bold uppercase">You</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{member.email}</p>
                      </div>
                      {member.role && (
                        <span className="text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#151515] text-gray-500 uppercase shrink-0">
                          {member.role}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-gray-400 font-medium">No team members yet</p>
                </div>
              )}
            </motion.div>

            {/* Leads Card */}
            {project.leads?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-7"
              >
                <div className="flex items-center gap-3 text-amber-600 mb-4 md:mb-5">
                  <FaCrown className="text-lg md:text-xl" />
                  <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Project Leads</h3>
                </div>
                <div className="space-y-2">
                  {project.leads.map((lead, i) => (
                    <div key={i} className="flex items-center gap-3 md:gap-4">
                      <div className="relative">
                        <img
                          src={`/avatars/${lead.avatar || 2}.jpg`}
                          alt={lead.name || 'Lead'}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-white dark:border-[#0a0a0a] shadow-md grayscale"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#0a0a0a] rounded-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">{lead.name || 'Lead'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.email || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <TeamMembers teamDetails={project.team || []} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  )
}

export default JoinedProjectDetail
