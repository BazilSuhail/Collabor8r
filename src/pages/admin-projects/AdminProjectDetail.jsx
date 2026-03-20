import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { FaUserPlus, FaSearch, FaUsers, FaCrown, FaProjectDiagram } from 'react-icons/fa'
import { CgUiKit } from 'react-icons/cg'
import { IoMdDoneAll } from 'react-icons/io'
import { MdErrorOutline } from 'react-icons/md'
import { IoCheckmarkDoneCircleSharp } from 'react-icons/io5'
import { 
  FiColumns, 
  FiCalendar, 
  FiClock, 
  FiActivity, 
  FiTag, 
  FiFilter, 
  FiZap, 
  FiSettings, 
  FiList, 
  FiCpu, 
  FiEdit3, 
  FiArrowLeft, 
  FiChevronRight, 
  FiArrowRight 
} from 'react-icons/fi'
import { GoLink } from 'react-icons/go'
import { motion } from 'framer-motion'
import api from '../../utils/api'
import useProjectStore from '../../stores/projectStore'

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
      { to: `/projects/${projectId}/team`, label: 'Team', icon: FaUsers },
      { to: `/projects/${projectId}/labels`, label: 'Labels', icon: FiTag },
      { to: `/projects/${projectId}/board/config`, label: 'Board Config', icon: FiColumns },
      { to: `/projects/${projectId}/webhooks`, label: 'Webhooks', icon: FiZap },
      { to: `/projects/${projectId}/settings`, label: 'Settings', icon: FiSettings },
      { to: `/projects/${projectId}/ai`, label: 'AI', icon: FiCpu },
    ]
  },
]

const AdminProjectDetail = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentProject, fetchProjectDetail } = useProjectStore()
  
  const [email, setEmail] = useState('')
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const addMemberRef = useRef(null)

  useEffect(() => {
    fetchProjectDetail(projectId)
  }, [projectId])

  const handleSearch = async () => {
    setError('')
    setUser(null)
    setSuccess('')
    setIsLoading(true)
    const { data, error } = await api('POST', '/admin-projects/get-searched-user', { email, projectId })
    if (error) {
      setError(error?.message || error?.error || 'Failed to find the user.')
    } else {
      setUser(data)
    }
    setIsLoading(false)
  }

  const handleAddUser = async () => {
    setError('')
    setSuccess('')
    const { data, error } = await api('POST', '/admin-projects/send-project-invitation', { userId: user.userId, projectId })
    if (error) {
      setError('Failed to add user to project.')
    } else {
      setSuccess(data.message)
      setUser(null)
      setEmail('')
      fetchProjectDetail(projectId)
    }
  }

  const scrollToAddMember = () => addMemberRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const project = currentProject
  const themePath = `/themes/${project.theme || 1}.jpg`
  
  // Cleaned up stats array to remove duplicate counts
  const stats = [
    { label: 'Team Size', value: project.team?.length || 0, icon: FaUsers, color: 'from-blue-500 to-blue-600' },
    { label: 'Tasks', value: project.tasks?.length || 0, icon: IoMdDoneAll, color: 'from-orange-500 to-orange-600' },
    { label: 'Leads', value: project.leads?.length || 0, icon: FaCrown, color: 'from-amber-500 to-yellow-600' },
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

            <div className="flex items-center gap-2">
              <button 
                onClick={scrollToAddMember}
                className="inline-flex items-center gap-2 px-3 py-2 md:px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-orange-600/20 shrink-0"
              >
                <FaUserPlus size={13} /> 
                <span className="hidden sm:inline">Add Member</span>
              </button>
              <button 
                onClick={() => navigate(`/projects/${projectId}/edit`)}
                className="inline-flex items-center gap-2 px-3 py-2 md:px-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-bold transition-all active:scale-95 border border-white/20 shrink-0"
              >
                <FiEdit3 /> 
                <span className="hidden sm:inline">Edit Project</span>
              </button>
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

            {/* Form & Leads Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              
              {/* Add Member Card */}
              <motion.div 
                ref={addMemberRef} 
                initial={{ opacity: 0, x: 15 }} 
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-6"
              >
                <div className="flex items-center gap-3 text-orange-600 mb-4 md:mb-5">
                  <FaUserPlus className="text-lg md:text-xl" />
                  <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Add Member</h3>
                </div>
                
                <div className="relative group mb-3">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full pl-4 pr-24 py-2.5 md:py-3 bg-gray-50 dark:bg-[#151515] text-gray-800 dark:text-white text-sm border border-gray-200 dark:border-[#1a1a1a] focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 rounded-xl outline-none transition-all font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-start gap-2 mb-3">
                    <MdErrorOutline className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-semibold flex items-start gap-2 mb-3">
                    <IoCheckmarkDoneCircleSharp className="mt-0.5 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {user ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#1a1a1a]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={`/avatars/${user.avatar}.jpg`} 
                        alt={user.name}
                        className="w-10 h-10 rounded-lg border-2 border-white dark:border-[#0a0a0a] shadow-sm grayscale" 
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddUser}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 shrink-0 ml-2"
                    >
                      Invite
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center py-6 opacity-40 gap-2">
                    <FaSearch size={12} className="text-gray-400" />
                    <p className="text-xs text-gray-400 font-medium">Find a user by email</p>
                  </div>
                )}
              </motion.div>

              {/* Project Leads Card */}
              <motion.div 
                initial={{ opacity: 0, x: 15 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.05 }}
                className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-6 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full -mr-10 -mt-10" />
                <div className="flex items-center gap-3 text-amber-600 mb-4 md:mb-5 relative">
                  <FaCrown className="text-lg md:text-xl" />
                  <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Project Leads</h3>
                </div>
                {project.leads?.length ? (
                  <div className="space-y-2">
                    {project.leads.map((lead, i) => (
                      <div key={i} className="flex items-center gap-3 md:gap-4 group/mgr">
                        <div className="relative">
                          <img 
                            src={`/avatars/${lead.avatar || 2}.jpg`} 
                            alt={lead.name || 'Lead'}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-white dark:border-[#0a0a0a] shadow-md grayscale group-hover/mgr:grayscale-0 transition-all" 
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
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-400 font-medium">No leads assigned</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Team Members List */}
            <motion.div 
              initial={{ opacity: 0, x: 15 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-6"
            >
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <div className="flex items-center gap-3 text-orange-600">
                  <FaUsers className="text-lg md:text-xl" />
                  <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Team Members</h3>
                </div>
                <Link 
                  to={`/projects/${projectId}/team`}
                  className="text-[10px] md:text-xs text-orange-600 hover:text-orange-700 font-bold hover:underline"
                >
                  Manage
                </Link>
              </div>

              {project.team?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto custom-scrollbar">
                  {project.team.map((member, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#151515] transition-all group/member border border-transparent hover:border-gray-100 dark:hover:border-[#1a1a1a]"
                    >
                      <img 
                        src={`/avatars/${member.avatar || 1}.jpg`} 
                        alt={member.name}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-lg border border-gray-200 dark:border-[#1a1a1a] shadow-sm grayscale group-hover/member:grayscale-0 transition-all shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">{member.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{member.email}</p>
                      </div>
                      <span className="text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#151515] text-gray-500 uppercase shrink-0">
                        {member.role || 'member'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-gray-400 font-medium">No team members yet</p>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </main>
  )
}

export default AdminProjectDetail