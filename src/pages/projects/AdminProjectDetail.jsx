import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaUserPlus, FaSearch, FaClipboardList, FaUsers, FaCrown, FaProjectDiagram } from 'react-icons/fa'
import { CgUiKit } from 'react-icons/cg'
import { IoMdDoneAll } from 'react-icons/io'
import { MdErrorOutline, MdMarkEmailUnread, MdOutlineAdminPanelSettings } from 'react-icons/md'
import { IoCheckmarkDoneCircleSharp } from 'react-icons/io5'
import { FiColumns, FiCalendar, FiClock, FiActivity, FiTag, FiFilter, FiZap, FiSettings, FiGrid, FiList, FiLink, FiCpu } from 'react-icons/fi'
import { GoLink } from 'react-icons/go'
import { motion } from 'framer-motion'
import api from '../../utils/api'
import useProjectStore from '../../stores/projectStore'
import EditProject from '../../components/modals/EditProject'

const navSections = (projectId) => [
  {
    title: 'Operations',
    items: [
      { to: `/projects/${projectId}/board`, label: 'Board', icon: FiColumns, desc: 'Drag-drop Kanban' },
      { to: `/projects/${projectId}/manage`, label: 'Task List', icon: FiList, desc: 'Table CRUD' },
      { to: `/projects/${projectId}/backlog`, label: 'Backlog', icon: FiCalendar, desc: 'Sprint planning' },
      { to: `/projects/${projectId}/sprints`, label: 'Sprints', icon: FiCalendar, desc: 'Iterations' },
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { to: `/projects/${projectId}/time`, label: 'Time', icon: FiClock, desc: 'Hours logged' },
      { to: `/projects/${projectId}/activity`, label: 'Activity', icon: FiActivity, desc: 'Audit trail' },
      { to: `/projects/${projectId}/filters`, label: 'Filters', icon: FiFilter, desc: 'Saved searches' },
      { to: `/projects/${projectId}/dependencies`, label: 'Links', icon: GoLink, desc: 'Task dependencies' },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { to: `/projects/${projectId}/team`, label: 'Team', icon: FaUsers, desc: 'Personnel' },
      { to: `/projects/${projectId}/labels`, label: 'Labels', icon: FiTag, desc: 'Classification' },
      { to: `/projects/${projectId}/board/config`, label: 'Board Config', icon: FiColumns, desc: 'Columns/WIP' },
      { to: `/projects/${projectId}/webhooks`, label: 'Webhooks', icon: FiZap, desc: 'Integrations' },
      { to: `/projects/${projectId}/settings`, label: 'Settings', icon: FiSettings, desc: 'Project config' },
      { to: `/projects/${projectId}/ai`, label: 'AI', icon: FiCpu, desc: 'Neural ops' },
    ]
  },
]

const AdminProjectDetail = () => {
  const { projectId } = useParams()
  const { currentProject, fetchProjectDetail } = useProjectStore()
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchProjectDetail(projectId)
  }, [projectId])

  useEffect(() => {
    if (!showModal) fetchProjectDetail(projectId)
  }, [showModal])

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

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const project = currentProject

  return (
    <main className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] p-4 md:p-5 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 pt-4">
        {showModal && <EditProject project={project} setShowModal={setShowModal} />}

        {/* Hero Banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-orange-600 via-orange-700 to-red-800"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative p-6 md:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl text-white shadow-lg">
                <FaProjectDiagram />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">{project.name}</h1>
                <p className="text-sm md:text-base text-orange-100 font-medium mt-1 opacity-90">Project Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowModal(true)}
                className="px-5 md:px-8 py-2.5 md:py-3 bg-white text-orange-700 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:bg-orange-50 transition-all shadow-lg active:scale-95 whitespace-nowrap">
                Edit Project
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Team Size', value: project.team?.length || 0, icon: FaUsers, color: 'from-blue-500 to-blue-600' },
            { label: 'Tasks', value: project.tasks?.length || 0, icon: IoMdDoneAll, color: 'from-orange-500 to-orange-600' },
            { label: 'Manager', value: project.projectManager?.name || 'Unassigned', icon: FaCrown, color: 'from-amber-500 to-yellow-600' },
            { label: 'Members', value: project.team?.filter(m => m.role !== 'manager')?.length || 0, icon: FaUserPlus, color: 'from-green-500 to-emerald-600' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-xl md:rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-4 md:p-5 hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md shrink-0`}>
                  <stat.icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-base md:text-lg font-black text-gray-900 dark:text-white truncate">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column - Nav Sections */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-7"
            >
              <div className="flex items-center gap-3 text-orange-600 mb-4">
                <CgUiKit className="text-lg md:text-xl" />
                <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Mission Brief</h3>
              </div>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {project.description || 'No description provided.'}
              </p>
            </motion.div>

            {/* Navigation Sections */}
            {navSections(projectId).map((section, si) => (
              <motion.div key={section.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 to-transparent" />
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{section.title}</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-orange-500/50 to-transparent" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {section.items.map(({ to, label, icon: Icon, desc }) => (
                    <Link key={to} to={to}
                      className="group flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-100 dark:bg-[#151515] flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/15 group-hover:text-orange-600 transition-all shrink-0">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors truncate">{label}</p>
                        <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 truncate">{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            {/* Manager Card */}
            <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-6 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-3 text-amber-600 mb-4 md:mb-5 relative">
                <FaCrown className="text-lg md:text-xl" />
                <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Project Manager</h3>
              </div>
              {project.projectManager?.status === 'Pending' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-500/20">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                    Invitation Pending
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{project.projectManager?.email || 'N/A'}</p>
                </div>
              ) : project.projectManager ? (
                <div className="flex items-center gap-3 md:gap-4 group/mgr">
                  <div className="relative">
                    <img src={`/avatars/${project.projectManager.avatar || 2}.jpg`} alt={project.projectManager.name}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-white dark:border-[#0a0a0a] shadow-md grayscale group-hover/mgr:grayscale-0 transition-all" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#0a0a0a] rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">{project.projectManager.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.projectManager.email}</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-400 font-medium">No manager assigned</p>
                </div>
              )}
            </motion.div>

            {/* Add Members */}
            <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-6"
            >
              <div className="flex items-center gap-3 text-orange-600 mb-4 md:mb-5">
                <FaUserPlus className="text-lg md:text-xl" />
                <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Add Member</h3>
              </div>
              <div className="relative group mb-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-4 pr-24 py-2.5 md:py-3 bg-gray-50 dark:bg-[#151515] text-gray-800 dark:text-white text-sm border border-gray-200 dark:border-[#1a1a1a] focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 rounded-xl outline-none transition-all font-medium"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95">
                  {isLoading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Search'}
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
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#1a1a1a]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={`/avatars/${user.avatar}.jpg`} alt={user.name}
                      className="w-10 h-10 rounded-lg border-2 border-white dark:border-[#0a0a0a] shadow-sm grayscale" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={handleAddUser}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 shrink-0 ml-2">
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

            {/* Team List */}
            <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-3xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-6"
            >
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <div className="flex items-center gap-3 text-orange-600">
                  <FaUsers className="text-lg md:text-xl" />
                  <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">Team</h3>
                </div>
                <Link to={`/projects/${projectId}/team`}
                  className="text-[10px] md:text-xs text-orange-600 hover:text-orange-700 font-bold hover:underline">
                  Manage
                </Link>
              </div>
              {project.team?.length > 0 ? (
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto custom-scrollbar">
                  {project.team.map((member, index) => (
                    <div key={index}
                      className="flex items-center gap-3 p-2 md:p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#151515] transition-all group/member"
                    >
                      <img src={`/avatars/${member.avatar || 1}.jpg`} alt={member.name}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-lg border border-gray-200 dark:border-[#1a1a1a] shadow-sm grayscale group-hover/member:grayscale-0 transition-all shrink-0" />
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