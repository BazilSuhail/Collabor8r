import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiCheck, FiX, FiFolder, FiUsers, FiClock, FiCalendar, FiAlertTriangle, FiUser, FiShield } from 'react-icons/fi'
import { GoPersonAdd } from 'react-icons/go'
import { RxCross2 } from 'react-icons/rx'
import { IoCheckmarkDoneCircleOutline } from 'react-icons/io5'
import PageHeader from '../../components/PageHeader'
import api from '../../utils/api'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
]

const Invitations = () => {
  const [invitations, setInvitations] = useState([])
  const [activeFilter, setActiveFilter] = useState('active')
  const [sortBy, setSortBy] = useState('newest')
  const [modalInv, setModalInv] = useState(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await api('GET', '/invitations/pending')
      setInvitations(data || [])
    }
    load()
  }, [])

  const now = useMemo(() => new Date(), [])

  const filtered = useMemo(() => {
    let list = [...invitations]
    if (activeFilter === 'active') {
      list = list.filter((inv) => inv.status === 'pending' && new Date(inv.expiresAt) > now)
    } else if (activeFilter === 'expired') {
      list = list.filter((inv) => inv.status === 'pending' && new Date(inv.expiresAt) <= now)
    } else if (activeFilter === 'accepted') {
      list = list.filter((inv) => inv.status === 'accepted')
    } else if (activeFilter === 'declined') {
      list = list.filter((inv) => inv.status === 'declined')
    }
    list.sort((a, b) => {
      const dA = new Date(a.createdAt).getTime()
      const dB = new Date(b.createdAt).getTime()
      return sortBy === 'newest' ? dB - dA : dA - dB
    })
    return list
  }, [invitations, activeFilter, sortBy, now])

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const daysLeft = (dateStr) => {
    const diff = new Date(dateStr) - now
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleAccept = useCallback(async () => {
    setLoading(true)
    try {
      await api('POST', `/invitations/${modalInv.token}/accept`)
      setInvitations((prev) => prev.map((i) => i._id === modalInv._id ? { ...i, status: 'accepted' } : i))
      setFeedback({ type: 'success', message: `You've joined "${modalInv.projectName}"` })
      setModalInv(null)
    } catch {
      setFeedback({ type: 'error', message: 'Failed to accept invitation' })
    } finally {
      setLoading(false)
    }
  }, [modalInv])

  const handleDecline = useCallback(async (inv) => {
    setInvitations((prev) => prev.map((i) => i._id === inv._id ? { ...i, status: 'declined' } : i))
    try {
      await api('POST', `/invitations/${inv.token}/decline`)
      setFeedback({ type: 'success', message: `Declined invitation for "${inv.projectName}"` })
    } catch {
      setFeedback({ type: 'error', message: 'Failed to decline invitation' })
      setInvitations((prev) => prev.map((i) => i._id === inv._id ? { ...i, status: 'pending' } : i))
    }
  }, [])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(t)
  }, [feedback])

  return (
    <div>
      <PageHeader
        icon={FiMail}
        title="My"
        highlight="Invitations"
        subtitle={`${filtered.length} invitation${filtered.length !== 1 ? 's' : ''}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-1.5 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeFilter === f.key
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl px-3 py-1.5 text-sm font-bold text-gray-600 dark:text-gray-400 cursor-pointer outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
            }`}
          >
            {feedback.type === 'success' ? <IoCheckmarkDoneCircleOutline size={18} /> : <FiAlertTriangle size={18} />}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] w-full">
          <FiMail size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Invitations</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {activeFilter === 'all' ? 'No invitations yet.' : `No ${activeFilter} invitations.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {filtered.map((inv) => {
            const isManager = inv.role === 'projectManager' || inv.type === 'projectManager'
            const Icon = isManager ? GoPersonAdd : (inv.project || inv.projectName ? FiFolder : FiUsers)
            const expired = inv.status === 'pending' && new Date(inv.expiresAt) <= now
            const left = daysLeft(inv.expiresAt)

            return (
              <motion.div
                key={inv._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-5 md:p-6 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md shrink-0 ${
                      isManager ? 'from-amber-500 to-orange-600' : 'from-orange-600 to-orange-700'
                    }`}>
                      <Icon size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{inv.project?.name || inv.projectName || inv.organization?.name || 'Invitation'}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          inv.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {inv.status}
                        </span>
                        {expired && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-1">
                            <FiAlertTriangle size={12} /> Expired
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {inv.senderName ? (
                          <>from <span className="text-gray-700 dark:text-gray-300">{inv.senderName}</span></>
                        ) : (
                          <>Role: {inv.role || 'member'}</>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} /> Sent {formatDate(inv.createdAt)}
                        </span>
                        <span className={`flex items-center gap-1 ${expired ? 'text-red-500 dark:text-red-400' : ''}`}>
                          <FiClock size={12} />
                          {inv.status === 'pending'
                            ? (expired ? 'Expired' : `${left} day${left !== 1 ? 's' : ''} left`)
                            : `Expired ${formatDate(inv.expiresAt)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {inv.status === 'pending' && !expired && (
                    <div className="flex gap-2 shrink-0 ml-4">
                      <button onClick={() => setModalInv(inv)}
                        className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all">
                        <FiCheck size={18} />
                      </button>
                      <button onClick={() => handleDecline(inv)}
                        className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                        <FiX size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {modalInv && (
          <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-2xl md:rounded-3xl shadow-sm w-full max-w-md overflow-hidden relative p-6"
            >
              <button
                onClick={() => { if (!loading) setModalInv(null) }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors rounded-xl hover:bg-orange-50 dark:hover:bg-orange-500/10"
              >
                <RxCross2 className="text-xl" />
              </button>

              <header className="mb-6">
                <h3 className="text-xl font-bold dark:text-white tracking-tight">Accept Invitation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">You're about to join a project.</p>
              </header>

              <div className="h-[1px] bg-gray-100 dark:bg-[#1a1a1a] w-full mb-6" />

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#151515] rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white shadow-md shrink-0">
                    <FiFolder size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{modalInv.projectName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{modalInv.projectDescription || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <FiUser size={16} className="shrink-0" />
                  <span>Invited by <span className="text-gray-700 dark:text-gray-300">{modalInv.senderName}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <FiShield size={16} className="shrink-0" />
                  <span>Role: <span className="text-gray-700 dark:text-gray-300 capitalize">{modalInv.role}</span></span>
                </div>
              </div>

              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <IoCheckmarkDoneCircleOutline className="text-xl" />
                )}
                {loading ? 'Signing...' : 'Sign & Join'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Invitations
