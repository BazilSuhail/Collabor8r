import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { FiActivity, FiFolder, FiUsers, FiShield, FiCheckCircle, FiClock, FiAlertTriangle, FiBarChart2 } from 'react-icons/fi'
import PageHeader from '../components/ui/Header'
import api from '../utils/api'

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-5 flex items-center gap-4 hover:border-orange-500/30 transition-all"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
  </motion.div>
)

const Overview = () => {
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [overviewRes, tasksRes] = await Promise.allSettled([
        api('GET', '/overview/progress-overview'),
        api('GET', '/overview/assigned-tasks'),
      ])
      if (overviewRes.status === 'fulfilled') {
        setStats(overviewRes.value.data.projectCounts || overviewRes.value.data)
      }
      if (tasksRes.status === 'fulfilled') {
        setTasks((tasksRes.value.data.tasks || tasksRes.value.data || []).slice(0, 8))
      }
      setLoading(false)
    }
    load()
  }, [])

  const counts = stats?.projectCounts || stats || {}
  const adminCount = counts.adminProjectsCount ?? counts.adminProjects ?? '-'
  const joinedCount = counts.joinedProjectsCount ?? counts.joinedProjects ?? '-'
  const leadCount = counts.leadProjectCount ?? counts.leadProjects ?? '-'
  const taskCount = Array.isArray(stats?.tasks) ? stats.tasks.length : tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length
  const highPriority = tasks.filter((t) => t.priority === 'High').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader icon={FiBarChart2} title="Sector:" highlight="Overview" subtitle="High-level mission analytics and status" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiFolder} label="Admin Sectors" value={adminCount} color="bg-gradient-to-br from-orange-600 to-orange-700" delay={0} />
        <StatCard icon={FiUsers} label="Joined Sectors" value={joinedCount} color="bg-gradient-to-br from-blue-600 to-blue-700" delay={0.05} />
        <StatCard icon={FiShield} label="Led Sectors" value={leadCount} color="bg-gradient-to-br from-purple-600 to-purple-700" delay={0.1} />
        <StatCard icon={FiCheckCircle} label="Total Tasks" value={taskCount} color="bg-gradient-to-br from-green-600 to-green-700" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiActivity size={14} /> Assigned Directives
          </h3>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 font-medium">No directives assigned.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <motion.div key={task._id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#151515] hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all border border-transparent hover:border-orange-500/20"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'Completed' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-orange-500' : 'bg-gray-400'}`} />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{task.title}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 ml-2 hidden md:inline">{task.projectName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>{task.priority}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      task.status === 'Completed' ? 'bg-green-600 text-white' :
                      task.status === 'In Progress' ? 'bg-orange-600 text-white' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>{task.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiClock size={14} /> Task Health
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Completed</span>
                  <span className="font-bold text-gray-900 dark:text-white">{taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${taskCount > 0 ? (completedTasks / taskCount) * 100 : 0}%` }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">High Priority</span>
                  <span className="font-bold text-gray-900 dark:text-white">{highPriority}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${taskCount > 0 ? (highPriority / taskCount) * 100 : 0}%` }}
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" />
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <FiAlertTriangle size={12} />
                <span>{highPriority > 0 ? `${highPriority} high-priority tasks need attention` : 'All clear — no high-priority items'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiBarChart2 size={14} /> Status Breakdown
            </h3>
            <div className="space-y-3">
              {['Not Started', 'In Progress', 'Completed'].map((status) => {
                const count = tasks.filter((t) => t.status === status).length
                const pct = taskCount > 0 ? (count / taskCount) * 100 : 0
                const colors = {
                  'Not Started': 'from-gray-400 to-gray-300',
                  'In Progress': 'from-orange-500 to-amber-400',
                  'Completed': 'from-green-500 to-emerald-400',
                }
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{status}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        className={`h-full bg-gradient-to-r ${colors[status]} rounded-full`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview
