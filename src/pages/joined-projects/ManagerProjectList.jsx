import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaPeopleRoof } from 'react-icons/fa6'
import { GrTask } from 'react-icons/gr'
import { RiAdminLine, RiTeamLine } from 'react-icons/ri'
import { motion } from 'motion/react'
import PageHeader from '../../components/ui/Header'
import api from '../../utils/api'

const SkeletonCard = () => (
  <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#1a1a1a] rounded-xl overflow-hidden animate-pulse h-[280px]">
    <div className="h-32 bg-gray-200 dark:bg-gray-800" />
    <div className="px-8 py-6 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
    </div>
  </div>
)

const ManagerProjectList = () => {
  const [managedProjects, setManagedProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await api('GET', '/joinedprojects/as-lead')
      if (error) setError(error?.error || 'Failed to load managed projects')
      else setManagedProjects(data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className='min-h-screen bg-[#fcfaf8] dark:bg-[#000000] flex flex-col transition-colors duration-300'>
      <div className="max-w-[1400px] mx-auto w-full">
        <PageHeader
          icon={FaPeopleRoof}
          title="Command"
          highlight="Center"
          subtitle="Operational sectors under your jurisdiction"
        />

        <div className='h-[1px] bg-gray-200 dark:bg-[#1a1a1a] w-full mb-8'></div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-medium">{error}</div>
        ) : managedProjects.length === 0 ? (
          <div className='flex flex-col items-center justify-center text-center px-6 py-16 sm:py-24'>
            <div className="relative mb-6 sm:mb-8 w-full flex justify-center">
              <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full " />
              <img src="/placeholders/manager.svg" alt="No managed projects" className="w-full max-w-88 h-auto mx-auto select-none pointer-events-none" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white mb-2 uppercase tracking-widest">Authority Void</h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium max-w-md">
              You haven't been appointed as a lead for any projects yet. Manage one to take command.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {managedProjects.map((project) => (
              <motion.div key={project._id} whileHover={{ y: -8 }} className="group bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-[280px]">
                <div className="relative h-32 overflow-hidden">
                  <img src={`/themes/${project.theme || 1}.jpg`} alt="" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[1.5s] grayscale-[0.5] group-hover:grayscale-0" />
                  <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent flex items-center justify-end pl-10 pr-2">
                    <Link to={`/projects/${project._id}/manage`} className="font-black text-white text-lg tracking-tight hover:text-orange-500 transition-colors uppercase">
                      {project.name?.length > 20 ? project.name.slice(0, 20) + "..." : project.name}
                    </Link>
                  </div>
                </div>

                <div className="px-8 py-8 flex-1 flex relative">
                  <div className="absolute -top-12 left-4 z-10 transition-transform duration-500 group-hover:-translate-y-2">
                    <img src={`/avatars/${project.createdBy?.avatar || 1}.jpg`} alt="" className="w-20 h-20 rounded-full border-4 border-white dark:border-[#0a0a0a] shadow-2xl" />
                  </div>
                  <div className="ml-24 flex-1 space-y-3">
                    <div className='flex items-center gap-3'>
                      <RiAdminLine className='text-orange-600' />
                      <span className='text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest'>Admin:</span>
                      <span className='ml-auto font-bold text-gray-800 dark:text-gray-200 text-sm'>{project.createdBy?.name || 'Unknown'}</span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <GrTask className='text-orange-600' />
                      <span className='text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest'>Squad:</span>
                      <span className='ml-auto font-bold text-gray-800 dark:text-gray-200 text-sm'>
                        {project.teamCount || 0} <span className="text-[10px] opacity-60">UNITS</span>
                      </span>
                    </div>
                    <div className='flex items-center gap-3 pt-2 border-t border-gray-50 dark:border-[#1a1a1a]'>
                      <RiTeamLine className='text-orange-600' />
                      <span className='text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest'>Directives:</span>
                      <span className='ml-auto font-bold text-gray-800 dark:text-gray-200 text-sm'>
                        {project.taskCount || 0} <span className="text-[10px] opacity-60">ACTIVE</span>
                      </span>
                    </div>
                  </div>
                </div>
                <Link to={`/projects/${project._id}/manage`} className="w-full py-4 text-center bg-gray-50 dark:bg-[#151515] hover:bg-orange-600 hover:text-white text-[10px] font-black uppercase tracking-[3px] transition-all border-t border-gray-100 dark:border-[#1a1a1a]">
                  Assume Command &rarr;
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagerProjectList
