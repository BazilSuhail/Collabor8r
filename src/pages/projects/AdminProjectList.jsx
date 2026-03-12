import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiClipboard, FiFolder, FiSettings } from 'react-icons/fi'
import { AiOutlinePlus } from 'react-icons/ai'
import { GrTask } from 'react-icons/gr'
import { RiTeamLine } from 'react-icons/ri'
import { PiGraphDuotone } from 'react-icons/pi'
import { MdOutlineManageAccounts } from 'react-icons/md'
import { motion } from 'framer-motion'
import useProjectStore from '../../stores/projectStore'
import CreateProject from '../../components/modals/CreateProject'
import EditProject from '../../components/modals/EditProject'

const colors = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600',
  'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400',
]

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)]

const SkeletonCard = () => (
  <div className="h-[320px] bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse">
    <div className="p-4 bg-gray-50 dark:bg-[#151515] border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28" />
      </div>
      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
    </div>
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-8" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-8" />
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-[#1a1a1a] space-y-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    </div>
    <div className="px-5 pb-5">
      <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
  </div>
)

const AdminProjectList = () => {
  const navigate = useNavigate()
  const { adminProjects, fetchAdminProjects } = useProjectStore()
  const [loading, setLoading] = useState(true)
  const [projectColors, setProjectColors] = useState({})
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editModal, showEditModal] = useState(false)
  const [projectDetails, setProjectDetails] = useState(null)

  useEffect(() => {
    fetchAdminProjects().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!adminProjects.length) return
    const colorMapping = {}
    adminProjects.forEach((project) => {
      if (!colorMapping[project._id]) colorMapping[project._id] = getRandomColor()
    })
    setProjectColors((prev) => ({ ...prev, ...colorMapping }))
  }, [adminProjects])

  useEffect(() => {
    const colorMapping = {}
    adminProjects.forEach((project) => {
      colorMapping[project._id] = getRandomColor()
    })
    setProjectColors(colorMapping)
  }, [adminProjects])

  const handleTaskManagement = (projectId) => {
    navigate(`/projects/${projectId}/manage`)
  }

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  const handleManagerAssignmentClick = (project) => {
    setProjectDetails(project)
    showEditModal(true)
  }

  return (
    <div className='min-h-screen bg-[#fcfaf8] dark:bg-[#000000] flex flex-col p-4 transition-colors duration-300'>
      {showModal && <CreateProject setShowModal={setShowModal} />}
      {editModal && <EditProject project={projectDetails} heading={'Assign a Manager'} setShowModal={showEditModal} />}

      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center">
        <div className="flex items-center space-x-2">
          <FiFolder className="text-2xl text-gray-600 dark:text-gray-400" />
          <h2 className="text-2xl md:text-3xl text-gray-800 dark:text-white font-bold tracking-tight">Created Projects</h2>
        </div>
      </div>
      <p className='mt-1 text-sm text-gray-500 dark:text-gray-400 lg:ml-8 mb-6'>Manage and administrate your established project ecosystems.</p>
      <div className='h-[1px] bg-gray-200 dark:bg-[#1a1a1a] w-full mb-8'></div>

      {error &&
        <div className='p-4 bg-red-100 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl mb-6'>{error}</div>
      }

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : adminProjects.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20'>
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full" />
            <img src="/Resources/3.png" alt='No projects' className='relative w-64 md:w-80 opacity-80 dark:opacity-40 grayscale' />
          </div>
          <p className="text-lg font-bold text-gray-800 dark:text-white mb-4">You haven't created any Project</p>
          <button onClick={() => setShowModal(true)} className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all">
            Create One Now
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div onClick={() => setShowModal(true)} className='cursor-pointer group relative overflow-hidden h-[320px] border-2 border-dashed border-gray-200 dark:border-[#1a1a1a] flex flex-col justify-center items-center bg-white/50 dark:bg-[#0a0a0a]/50 hover:bg-white dark:hover:bg-[#0a0a0a] rounded-2xl transition-all duration-300'>
            <div className="p-5 bg-orange-50 dark:bg-orange-500/10 rounded-full group-hover:scale-110 transition-transform duration-500">
              <AiOutlinePlus className="text-4xl text-orange-600" />
            </div>
            <span className='text-sm font-bold mt-4 text-gray-500 dark:text-gray-400 group-hover:text-orange-600 transition-colors'>Establish New Frontier</span>
          </div>

              {adminProjects.map((project) => {
            const projectColor = projectColors[project._id] || 'bg-gray-400';
            
            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                className="group relative h-[340px] bg-white dark:bg-[#09090b] border border-gray-100 dark:border-[#1e1e24] rounded-2xl overflow-hidden p-5 flex flex-col justify-between transition-all duration-300 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/5"
              >
                {/* Dynamic Glow Effect on Hover */}
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
                <div>
                  {/* Header: Identity & Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md shadow-black/5 ${projectColor}`}>
                      {project.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>
          
                  {/* Project Name & Info */}
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-lg group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors duration-300 truncate">
                      {project.name}
                    </h3>
                    {project.projectManager?.status === 'Pending' && (
                      <div className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        Manager Approval Pending
                      </div>
                    )}
                  </div>
          
                  {/* 2x2 Clean Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-100 dark:border-[#1f1f23] rounded-xl p-2.5 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg text-orange-500 shadow-sm">
                        <RiTeamLine className="text-base" />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Squad</p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{project.team?.length || 0}</p>
                      </div>
                    </div>
          
                    <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-100 dark:border-[#1f1f23] rounded-xl p-2.5 flex items-center gap-2.5">
                      <div className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg text-orange-500 shadow-sm">
                        <GrTask className="text-base" />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Units</p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{project.tasks?.length || 0}</p>
                      </div>
                    </div>
                  </div>
          
                  {/* Action Quick-Links */}
                  <div className="flex gap-2 pt-1 border-t border-dashed border-zinc-100 dark:border-zinc-800/60">
                    <button 
                      onClick={() => handleProjectClick(project._id)} 
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-all text-xs font-semibold border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                    >
                      <FiSettings className="text-xs" /> Settings
                    </button>
                    <button 
                      onClick={() => handleTaskManagement(project._id)} 
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-all text-xs font-semibold border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                    >
                      <FiClipboard className="text-xs" />Manage Tasks
                    </button>
                  </div>
                </div>
          
                {/* Footer Interface: Manager Row */}
                <div className="mt-4">
                  {project.projectManager?.status === 'Pending' ? (
                    <button 
                      onClick={() => handleManagerAssignmentClick(project)} 
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-orange-600 hover:bg-orange-600 dark:bg-zinc-800 dark:hover:bg-orange-600 text-white transition-all duration-300 text-xs font-bold shadow-md tracking-wide"
                    >
                      <PiGraphDuotone className="text-sm animate-spin-slow" />
                      Appoint Lead
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/40 dark:bg-orange-500/5 border border-orange-100/40 dark:border-orange-500/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                          <MdOutlineManageAccounts className="text-base" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider font-extrabold text-orange-600 dark:text-orange-400/80">Project Lead</p>
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{project.projectManager?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  )
}

export default AdminProjectList
