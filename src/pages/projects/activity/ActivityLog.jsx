import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiActivity, FiUser, FiCalendar, FiTag, FiClock, FiColumns, FiLink, FiMail, FiZap, FiFilter, FiChevronDown } from 'react-icons/fi'
import ProjectHeader from '../../../components/ui/ProjectHeader'
import api from '../../../utils/api'

const actionColors = {
  created: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  updated: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  status_changed: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  comment_added: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  comment_edited: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  comment_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  activated: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  accepted: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  declined: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  invited: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
  logged: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
  uploaded: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600',
  removed: 'bg-red-100 dark:bg-red-900/30 text-red-600',
}

const typeIcons = {
  task: <FiTag size={14} />,
  project: <FiActivity size={14} />,
  comment: <FiUser size={14} />,
  sprint: <FiCalendar size={14} />,
  label: <FiTag size={14} />,
  time: <FiClock size={14} />,
  board: <FiColumns size={14} />,
  taskLink: <FiLink size={14} />,
  invitation: <FiMail size={14} />,
  webhook: <FiZap size={14} />,
  filter: <FiFilter size={14} />,
}

const ActivityLog = () => {
  const { projectId } = useParams()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('project')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      let endpoint = '/activity/project/' + projectId
      if (filter === 'user') endpoint = '/activity/user'
      const { data } = await api('GET', endpoint)
      setActivities(data || [])
      setLoading(false)
    }
    fetch()
  }, [projectId, filter])

  const filtered = typeFilter === 'all'
    ? activities
    : activities.filter((a) => a.entityType === typeFilter)

  const typeCount = (type) => activities.filter((a) => a.entityType === type).length

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto">
        <ProjectHeader
          projectId={projectId}
          icon={FiActivity}
          title="Activity"
          highlight="Operation Log"
          subtitle="Every action across this project"
          pageLabel="Activity"
          action={
            <div className="flex bg-gray-100 dark:bg-[#151515] rounded-xl p-1">
              {[
                { key: 'project', label: 'Project' },
                { key: 'user', label: 'My Activity' },
              ].map((opt) => (
                <button key={opt.key} onClick={() => setFilter(opt.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === opt.key ? 'bg-white dark:bg-[#0a0a0a] text-orange-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type:</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition cursor-pointer">
            <option value="all">All Types ({activities.length})</option>
            {Object.keys(typeIcons).filter((t) => typeCount(t) > 0).map((t) => (
              <option key={t} value={t}>{t} ({typeCount(t)})</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#151515] rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] max-w-2xl">
            <FiActivity size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Activity</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No operations recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a, i) => {
              const name = a.actorName || a.actorId?.name || 'Someone'
              const initial = name.charAt(0).toUpperCase()
              const actionLabel = a.action?.replace(/_/g, ' ') || ''
              const entityLabel = a.entityName ? `${a.entityType} "${a.entityName}"` : a.entityType

              return (
                <motion.div
                  key={a._id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-4 p-4 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] hover:border-orange-500/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      <span className="font-bold">{name}</span>{' '}
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mx-1 ${actionColors[a.action] || 'bg-gray-100 dark:bg-[#151515] text-gray-500'}`}>
                        {actionLabel}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">{entityLabel}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{a.description}</p>
                    {a.changes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {a.changes.map((c, j) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-gray-50 dark:bg-[#151515] text-gray-500 font-medium">
                            {c.field}: {String(c.oldValue ?? '—')} → {String(c.newValue ?? '—')}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                      </span>
                      {a.projectName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#151515] text-gray-500 font-medium">
                          {a.projectName}
                        </span>
                      )}
                      {a.entityType && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#151515] text-gray-500 font-medium flex items-center gap-1">
                          {typeIcons[a.entityType] || null}
                          {a.entityType}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLog
