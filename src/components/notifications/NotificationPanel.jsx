import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FiBell, FiTrash2, FiX, FiZap, FiUser, FiFolder, FiShield, FiRefreshCw, FiUserPlus, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { GoHourglass, GoPersonAdd } from 'react-icons/go'
import useNotificationStore from '../../stores/notificationStore'

const typeIcons = {
  task_assigned: FiZap,
  project_invite: FiFolder,
  manager_invite: FiShield,
  comment_added: FiUser,
  sprint_completed: GoHourglass,
  teamMember: FiUserPlus,
  projectManager: GoPersonAdd,
  projectLead: GoPersonAdd,
  invitationResponse: FiCheckCircle,
}

const typeStyles = {
  task_assigned: {
    gradient: 'from-violet-500 to-violet-600',
    shape: 'rounded-xl',
    ring: 'ring-violet-500/20',
    badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  },
  project_invite: {
    gradient: 'from-emerald-500 to-emerald-600',
    shape: 'rounded-full',
    ring: 'ring-emerald-500/20',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  },
  manager_invite: {
    gradient: 'from-amber-500 to-orange-600',
    shape: 'rounded-lg',
    ring: 'ring-amber-500/20',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
  comment_added: {
    gradient: 'from-blue-500 to-blue-600',
    shape: 'rounded-2xl',
    ring: 'ring-blue-500/20',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  sprint_completed: {
    gradient: 'from-pink-500 to-rose-600',
    shape: 'rounded-[10px]',
    ring: 'ring-pink-500/20',
    badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  },
  teamMember: {
    gradient: 'from-cyan-500 to-teal-500',
    shape: 'rounded-[18px]',
    ring: 'ring-cyan-500/20',
    badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  },
  projectManager: {
    gradient: 'from-amber-500 to-orange-600',
    shape: 'rounded-[10px]',
    ring: 'ring-amber-500/20',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
  projectLead: {
    gradient: 'from-amber-500 to-orange-600',
    shape: 'rounded-[10px]',
    ring: 'ring-amber-500/20',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
  invitationResponse: {
    gradient: 'from-green-500 to-emerald-600',
    shape: 'rounded-2xl',
    ring: 'ring-green-500/20',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
}

const NotificationPanel = () => {
  const {
    notifications,
    unreadCount,
    panelOpen,
    closePanel,
    fetchNotifications,
    markRead,
    clearAll,
  } = useNotificationStore()
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (panelOpen) {
      fetchNotifications()
      setExpanded(null)
    }
  }, [panelOpen])

  const handleEyeClick = (e, n, index) => {
    e.stopPropagation()
    if (expanded === index) {
      setExpanded(null)
    } else {
      setExpanded(index)
      if (!n.read) markRead(index)
    }
  }

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={closePanel}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 w-[600px] max-w-full z-50 flex flex-col bg-white dark:bg-[#080808] border-l border-gray-200 dark:border-[#1a1a1a] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#1a1a1a] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  <FiBell size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All clear'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    title="Clear all"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
                <button
                  onClick={closePanel}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#121212] flex items-center justify-center text-gray-300 dark:text-gray-600 mb-4">
                    <FiBell size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">You're all caught up. New notifications will appear here.</p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((n, index) => {
                    const d = n.data || {}
                    const TypeIcon = typeIcons[n.type] || FiBell
                    const style = typeStyles[n.type] || typeStyles.project_invite
                    const isExpanded = expanded === index
                    const unread = !n.read
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={`group flex items-start gap-4 px-6 py-4 transition-all cursor-pointer ${
                          unread
                            ? 'bg-gradient-to-r from-orange-500/[0.04] to-transparent dark:from-orange-500/[0.06] border-l-[3px] border-orange-500 hover:from-orange-500/[0.07] dark:hover:from-orange-500/[0.09]'
                            : 'border-l-[3px] border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                        }`}
                        onClick={() => { if (unread) markRead(index) }}
                      >
                        <div className={`relative w-10 h-10 ${style.shape} bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white shadow-lg shrink-0 mt-0.5 ${
                          unread ? `ring-2 ${style.ring} ring-offset-2 ring-offset-white dark:ring-offset-[#080808]` : 'opacity-70'
                        }`}>
                          <TypeIcon size={16} />
                          {unread && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-[#080808]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${unread ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white truncate`}>
                              {d.title || 'Notification'}
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${style.badge}`}>
                              {n.type?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {d.senderName && (
                            <p className={`text-xs mt-0.5 font-medium ${unread ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>{d.senderName}</p>
                          )}
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-2"
                            >
                              {d.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[#111] rounded-xl p-3 border border-gray-100 dark:border-[#1a1a1a]">
                                  {d.description}
                                </p>
                              )}
                            </motion.div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {d.projectName && (
                              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                unread ? 'bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300' : 'bg-gray-50 dark:bg-[#0d0d0d] text-gray-400 dark:text-gray-500'
                              }`}>{d.projectName}</span>
                            )}
                            {d.response && (
                              <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                                d.response === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>{d.response}</span>
                            )}
                            <span className={`text-xs ${unread ? 'text-gray-400 dark:text-gray-500' : 'text-gray-300 dark:text-gray-600'}`}>
                              {d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleEyeClick(e, n, index)}
                          className={`p-2 rounded-lg transition-all shrink-0 ${
                            unread
                              ? 'text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500/10 opacity-0 group-hover:opacity-100'
                              : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                          title={unread ? 'Mark read & view' : isExpanded ? 'Collapse' : 'View'}
                        >
                          {unread ? <FiEye size={16} /> : isExpanded ? <FiEyeOff size={16} /> : <FiEye size={16} className="opacity-50" />}
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-[#1a1a1a] shrink-0">
                <button
                  onClick={fetchNotifications}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-[#1a1a1a] text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-orange-600 hover:border-orange-500/30 transition-all"
                >
                  <FiRefreshCw size={14} /> Refresh
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationPanel
