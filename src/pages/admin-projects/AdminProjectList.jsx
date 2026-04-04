import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiClipboard, FiFolder, FiSettings, FiLink, FiTag, FiEye, FiUser, 
  FiTrendingUp, FiUsers, FiCheckCircle, FiLayers 
} from 'react-icons/fi'
import { AiOutlinePlus } from 'react-icons/ai'
import { GrTask } from 'react-icons/gr'
import { RiTeamLine } from 'react-icons/ri'
import { PiGraphDuotone } from 'react-icons/pi'
import { MdOutlineManageAccounts } from 'react-icons/md'
import { motion, AnimatePresence } from 'motion/react'
import PageHeader from '../../components/ui/Header'
import useProjectStore from '../../stores/projectStore'

const colors = [
  'from-rose-500 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-[#0d0d0d]',
  'from-cyan-500 to-blue-600',
]

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)]

const SkeletonCard = () => (
  <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse p-5 flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-gray-800 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      </div>
    </div>
    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
    <div className="grid grid-cols-2 gap-2.5">
      <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
  </div>
)

const SkeletonStats = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-4 bg-white dark:bg-[#0a0a0a] border border-gray-200/80 dark:border-[#1a1a1a] rounded-2xl flex items-center gap-3 animate-pulse">
        <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
)

const AdminProjectList = () => {
  const navigate = useNavigate()
  const { adminProjects, fetchAdminProjects } = useProjectStore()
  const [loading, setLoading] = useState(true)
  const [projectColors, setProjectColors] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdminProjects().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!adminProjects.length) return
    setProjectColors((prev) => {
      const colorMapping = { ...prev }
      adminProjects.forEach((project) => {
        if (!colorMapping[project._id]) {
          colorMapping[project._id] = getRandomColor()
        }
      })
      return colorMapping
    })
  }, [adminProjects])

  // Calculated Metrics
  const metrics = useMemo(() => {
    const total = adminProjects.length
    const active = adminProjects.filter((p) => (p.status || 'active').toLowerCase() === 'active').length
    const totalMembers = adminProjects.reduce((acc, p) => acc + (p.teamCount ?? p.team?.length ?? 0), 0)
    const avgCompletion = total > 0 
      ? Math.round(adminProjects.reduce((acc, p) => acc + (p.stats?.avgProgress || 0), 0) / total) 
      : 0

    return { total, active, totalMembers, avgCompletion }
  }, [adminProjects])

  const handleTaskManagement = (projectId) => {
    navigate(`/projects/${projectId}/manage`)
  }

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] flex flex-col transition-colors duration-300 pb-16">
      <PageHeader
        icon={FiFolder}
        title="Created"
        highlight="Projects"
        subtitle="Manage and administer all your created projects"
        action={
          <button
            onClick={() => navigate('/projects/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-orange-600 to-orange-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-600/20 hover:from-orange-500 hover:to-orange-600 active:scale-[0.98] transition-all"
          >
            <AiOutlinePlus className="text-base" /> Create Project
          </button>
        }
      />

      <div className="h-[1px] bg-gray-200 dark:bg-[#1a1a1a] w-full mb-6" />

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Top Quick Overview Stats Banner */}
      {loading ? (
        <SkeletonStats />
      ) : adminProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          <div className="p-4 bg-white dark:bg-[#0a0a0a] border border-gray-200/80 dark:border-[#1a1a1a] rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
              <FiLayers size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Managed</p>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">{metrics.total}</h4>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#0a0a0a] border border-gray-200/80 dark:border-[#1a1a1a] rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FiCheckCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Active</p>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">{metrics.active}</h4>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#0a0a0a] border border-gray-200/80 dark:border-[#1a1a1a] rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <FiUsers size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Team Pool</p>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">{metrics.totalMembers}</h4>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#0a0a0a] border border-gray-200/80 dark:border-[#1a1a1a] rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FiTrendingUp size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Avg Progress</p>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">{metrics.avgCompletion}%</h4>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main List Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : adminProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-6 py-16 sm:py-24 bg-white dark:bg-[#0a0a0a] border border-gray-200/80 dark:border-[#1a1a1a] rounded-3xl">
          <div className="relative mb-6 sm:mb-8 w-full flex justify-center">
            <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full" />
            <img
              src="/placeholders/admin.svg"
              alt="No projects"
              className="w-full max-w-64 h-auto mx-auto select-none pointer-events-none"
            />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
            No Projects Created Yet
          </h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mb-8">
            You haven't created any projects. Start one now and bring your team together.
          </p>
          <button
            onClick={() => navigate('/projects/new')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-orange-600 to-orange-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-orange-600/20 hover:from-orange-500 hover:to-orange-600 transition-all"
          >
            <AiOutlinePlus className="text-base" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Quick Create Card */}
          <div
            onClick={() => navigate('/projects/new')}
            className="cursor-pointer group relative overflow-hidden min-h-[280px] border-2 border-dashed border-gray-200 dark:border-[#1a1a1a] flex flex-col justify-center items-center bg-white/40 dark:bg-[#0a0a0a]/40 hover:bg-white dark:hover:bg-[#0a0a0a] rounded-2xl transition-all duration-300"
          >
            <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-full group-hover:scale-110 transition-transform duration-300">
              <AiOutlinePlus className="text-2xl text-orange-600" />
            </div>
            <span className="text-sm font-bold mt-3 text-gray-500 dark:text-gray-400 group-hover:text-orange-600 transition-colors">
              Create New Project
            </span>
          </div>

          <AnimatePresence>
            {adminProjects.map((project) => {
              const projectGradient = projectColors[project._id] || 'from-gray-500 to-gray-700'
              const stats = project.stats || {}
              const progress = stats.avgProgress || 0
              const lead = project.leads?.[0]

              return (
                <motion.div
                  key={project._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -5 }}
                  onClick={() => handleProjectClick(project._id)}
                  className="group relative cursor-pointer bg-white dark:bg-[#0a0a0a] border border-gray-200/80 dark:border-[#1a1a1a] rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5"
                >
                  {/* Header: Identity + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base text-white shadow-md bg-gradient-to-br ${projectGradient} shrink-0 group-hover:scale-105 transition-transform duration-300`}
                      >
                        {project.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <FiUser size={11} className="shrink-0" /> {project.createdBy?.name || 'Unknown Owner'}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {project.status || 'active'}
                    </span>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Attribute Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                      <FiEye size={10} /> {project.visibility || 'private'}
                    </span>
                    {project.category && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                        <FiTag size={10} /> {project.category}
                      </span>
                    )}
                    {project.links?.length > 0 && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                        <FiLink size={10} /> {project.links.length} links
                      </span>
                    )}
                    {project.tags?.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-[10px] font-bold text-orange-600 dark:text-orange-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* 2x2 Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gray-50 dark:bg-[#121214] border border-gray-100 dark:border-[#1f1f23] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg text-orange-500 shadow-sm">
                        <RiTeamLine className="text-base" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Team</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none mt-0.5">
                          {project.teamCount ?? project.team?.length ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#121214] border border-gray-100 dark:border-[#1f1f23] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg text-orange-500 shadow-sm">
                        <GrTask className="text-base" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Tasks</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none mt-0.5">
                          {project.taskCount ?? project.tasks?.length ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#121214] border border-gray-100 dark:border-[#1f1f23] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg text-orange-500 shadow-sm">
                        <MdOutlineManageAccounts className="text-base" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Leads</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none mt-0.5">
                          {project.leads?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#121214] border border-gray-100 dark:border-[#1f1f23] rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Progress</p>
                        <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400">{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700/60 overflow-hidden mt-2">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer: Lead + Actions */}
                  <div className="mt-auto pt-3 border-t border-dashed border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-2">
                    {lead ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 border border-orange-500/20">
                          <MdOutlineManageAccounts className="text-sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] uppercase tracking-wider font-black text-orange-600 dark:text-orange-400">
                            Lead
                          </p>
                          <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate max-w-[130px]">
                            {lead.name || lead.email || lead}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/projects/${project._id}/edit`)
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-all text-[11px] font-bold border border-orange-500/20"
                      >
                        <PiGraphDuotone className="text-sm" /> Appoint Lead
                      </button>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTaskManagement(project._id)
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800 transition-all"
                        title="Manage Tasks"
                      >
                        <FiClipboard size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProjectClick(project._id)
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800 transition-all"
                        title="Settings"
                      >
                        <FiSettings size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default AdminProjectList
