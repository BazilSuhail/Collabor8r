import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi'
import api from '../../utils/api'

const ProjectHeader = ({
  projectId,
  icon: Icon,
  title,
  highlight,
  subtitle,
  action,
  pageLabel,
  fallbackName = 'Project',
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [projectName, setProjectName] = useState(fallbackName)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!projectId) { setLoading(false); return }
      const { data, error } = await api('GET', '/admin-projects/' + projectId)
      if (mounted) {
        setProjectName(data?.project?.name || data?.name || fallbackName)
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [projectId, fallbackName])

  const currentPath = pageLabel || (location.pathname.split('/').filter(Boolean).pop() || '')

  return (
    <div className="mb-6">
      <nav className="flex items-center gap-1.5 mb-5">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all">
          <FiArrowLeft size={14} /> <span className="hidden sm:inline">Back</span>
        </button>
        <span className="text-gray-300 dark:text-zinc-700"><FiChevronRight size={14} /></span>
        <span className="text-xs font-bold text-orange-600 px-2 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg truncate max-w-[160px] sm:max-w-xs">
          {loading ? 'Loading...' : projectName}
        </span>
        {currentPath && (
          <>
            <span className="text-gray-300 dark:text-zinc-700"><FiChevronRight size={14} /></span>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 px-2 py-1.5 bg-gray-100 dark:bg-[#151515] rounded-lg capitalize truncate max-w-[140px] sm:max-w-[220px]">
              {currentPath}
            </span>
          </>
        )}
      </nav>

      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            {Icon && (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                <Icon size={18} className="sm:text-xl" />
              </div>
            )}
            <div className="min-w-0">
              {highlight && (
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
                  {highlight}
                </p>
              )}
              <h1 className="mt-1 text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight break-words">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-orange-500/40 via-gray-200 dark:via-zinc-800 to-transparent" />
      </header>
    </div>
  )
}

export default ProjectHeader
