import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiCalendar, FiClock, FiUser, FiTag, FiPaperclip, FiMessageSquare, FiZap, FiSend, FiTrash2, FiUpload, FiDownload, FiFile, FiLoader, FiCpu, FiLink, FiActivity, FiPlus } from 'react-icons/fi'
import PageHeader from '../../components/PageHeader'
import api from '../../utils/api'

const TaskDetail = () => {
  const { taskId } = useParams()
  const [currentTask, setCurrentTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [files, setFiles] = useState([])
  const [timeEntries, setTimeEntries] = useState([])
  const [activities, setActivities] = useState([])
  const [links, setLinks] = useState([])
  const [uploading, setUploading] = useState(false)
  const [aiLoading, setAiLoading] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [showTimeForm, setShowTimeForm] = useState(false)
  const [timeForm, setTimeForm] = useState({ hours: '', description: '' })

  useEffect(() => {
    const load = async () => {
      const [taskRes, commentsRes, filesRes, timeRes, activityRes, linksRes] = await Promise.allSettled([
        api('GET', '/project-tasks/' + taskId),
        api('GET', '/comments/tasks/' + taskId + '/comments'),
        api('GET', '/uploads/task/' + taskId),
        api('GET', '/time/entries/task/' + taskId),
        api('GET', '/activity/task/' + taskId),
        api('GET', '/task-links/task/' + taskId),
      ])
      if (taskRes.status === 'fulfilled') setCurrentTask(taskRes.value.data)
      if (commentsRes.status === 'fulfilled') setComments(commentsRes.value.data.comments || commentsRes.value.data || [])
      if (filesRes.status === 'fulfilled') setFiles(filesRes.value.data || [])
      if (timeRes.status === 'fulfilled') setTimeEntries(timeRes.value.data || [])
      if (activityRes.status === 'fulfilled') setActivities(activityRes.value.data || [])
      if (linksRes.status === 'fulfilled') setLinks(linksRes.value.data || [])
      setLoading(false)
    }
    load()
  }, [taskId])

  const addComment = async () => {
    if (!commentText.trim()) return
    const { data } = await api('POST', '/comments/tasks/' + taskId + '/comments', { content: commentText })
    const newComment = data.comment || data
    setComments((prev) => [...prev, newComment])
    setCommentText('')
  }

  const deleteComment = async (commentId) => {
    await api('DELETE', '/comments/' + commentId)
    setComments((prev) => prev.filter((c) => c._id !== commentId))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('files', file)
    const { data } = await api('POST', '/uploads/task/' + taskId, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    const uploaded = data.files || []
    if (Array.isArray(uploaded)) setFiles((prev) => [...prev, ...uploaded])
    else if (uploaded.name) setFiles((prev) => [...prev, uploaded])
    setUploading(false)
  }

  const deleteFile = async (fileId) => {
    await api('DELETE', '/uploads/' + fileId)
    setFiles((prev) => prev.filter((f) => f._id !== fileId && f.id !== fileId))
  }

  const logTime = async (e) => {
    e.preventDefault()
    if (!timeForm.hours) return
    const { data } = await api('POST', '/time/entries', { taskId, hours: parseFloat(timeForm.hours), description: timeForm.description })
    const entry = data.entry || data
    setTimeEntries((prev) => [...prev, entry])
    setTimeForm({ hours: '', description: '' })
    setShowTimeForm(false)
  }

  const deleteTimeEntry = async (entryId) => {
    await api('DELETE', '/time/entries/' + entryId)
    setTimeEntries((prev) => prev.filter((e) => e._id !== entryId))
  }

  const handleAi = async (endpoint, body, label) => {
    setAiLoading(label)
    const { data } = await api('POST', endpoint, body)
    setAiResult({ label, data })
    setAiLoading(null)
  }

  const priorityColor = {
    High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }

  if (loading || !currentTask) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      <Link to={`/projects/${currentTask.projectId}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 mb-4 transition-colors">
        <FiArrowLeft size={16} /> Back to Operations
      </Link>

      <PageHeader
        icon={FiZap}
        title={currentTask.title}
        subtitle={`Priority: ${currentTask.priority} · Status: ${currentTask.status}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Mission Brief</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{currentTask.description || 'No description provided.'}</p>
          </div>

          {currentTask.labels?.length > 0 && (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FiTag size={14} /> Labels</h3>
              <div className="flex flex-wrap gap-2">
                {currentTask.labels.map((label, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg font-bold"
                    style={{ backgroundColor: (label.color || '#ea580c') + '20', color: label.color || '#ea580c' }}
                  >
                    {typeof label === 'string' ? label : label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {links.length > 0 && (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FiLink size={14} /> Dependencies</h3>
              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={link._id || i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-gray-100 dark:bg-[#151515] text-gray-500">{link.linkType}</span>
                    <span className="text-gray-400">—</span>
                    <span className="font-medium">{link.targetTaskId || link.sourceTaskId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Actions */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FiCpu size={14} /> AI Operations</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleAi('/ai/summarize-comments', { taskId }, 'summary')} disabled={aiLoading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white text-xs font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-sm">
                {aiLoading === 'summary' ? <FiLoader className="animate-spin" size={14} /> : <FiMessageSquare size={14} />} Summarize Comments
              </button>
              <button onClick={() => handleAi('/ai/generate-acceptance-criteria', { title: currentTask.title, description: currentTask.description }, 'criteria')} disabled={aiLoading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-600 text-orange-600 text-xs font-bold hover:bg-orange-50 dark:hover:bg-orange-500/10 disabled:opacity-50 transition-all">
                {aiLoading === 'criteria' ? <FiLoader className="animate-spin" size={14} /> : <FiZap size={14} />} Generate Criteria
              </button>
            </div>
            {aiResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">{aiResult.label}</span>
                  <button onClick={() => setAiResult(null)} className="text-gray-400 hover:text-red-500"><FiTrash2 size={12} /></button>
                </div>
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {typeof aiResult.data === 'string' ? aiResult.data : JSON.stringify(aiResult.data, null, 2)}
                </pre>
              </motion.div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FiMessageSquare size={14} /> Communications ({comments.length})</h3>
            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6 font-medium">No transmissions yet.</p>
                ) : comments.map((c, i) => (
                  <motion.div key={c._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#1a1a1a] group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(c.user?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{c.user?.name || 'Agent'}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
                    </div>
                    <button onClick={() => deleteComment(c._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"><FiTrash2 size={12} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a transmission..." onKeyDown={(e) => e.key === 'Enter' && addComment()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition text-sm" />
              <button onClick={addComment} disabled={!commentText.trim()}
                className="p-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-all"><FiSend size={16} /></button>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FiPaperclip size={14} /> Attachments ({files.length})</h3>
            <div className="space-y-2 mb-4">
              {files.length === 0 && <p className="text-sm text-gray-400 text-center py-4 font-medium">No files attached.</p>}
              {files.map((f, i) => (
                <div key={f._id || f.id || i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#1a1a1a] group">
                  <div className="flex items-center gap-3 min-w-0">
                    <FiFile className="text-orange-600 shrink-0" size={16} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.name || f.path?.split('/').pop() || 'File'}</span>
                    {f.size && <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)}KB</span>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    {f.path && <a href={'http://localhost:3001' + f.path} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all"><FiDownload size={14} /></a>}
                    <button onClick={() => deleteFile(f._id || f.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#1a1a1a] cursor-pointer hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              {uploading ? <FiLoader className="animate-spin" size={16} /> : <FiUpload size={16} />}
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{uploading ? 'Uploading...' : 'Upload file'}</span>
            </label>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-5">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{currentTask.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Priority</span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${priorityColor[currentTask.priority] || ''}`}>{currentTask.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Assignee</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white text-[10px] font-bold">
                    {(currentTask.assignedTo?.name || 'U').charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{currentTask.assignedTo?.name || 'Unassigned'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Due Date</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" style={{ width: `${currentTask.progress || 0}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{currentTask.progress || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Log */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Log</h3>
              <button onClick={() => setShowTimeForm(!showTimeForm)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all"><FiPlus size={14} /></button>
            </div>
            {showTimeForm && (
              <form onSubmit={logTime} className="mb-4 space-y-2">
                <input type="number" step="0.5" min="0" value={timeForm.hours} onChange={(e) => setTimeForm((p) => ({ ...p, hours: e.target.value }))}
                  placeholder="Hours" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-orange-500 outline-none transition" />
                <input type="text" value={timeForm.description} onChange={(e) => setTimeForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-orange-500 outline-none transition" />
                <button type="submit" className="w-full py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-all">Log Time</button>
              </form>
            )}
            <div className="space-y-3">
              {currentTask.estimateHours > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Estimate</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{currentTask.estimateHours}h</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Logged</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{currentTask.loggedHours || 0}h</span>
              </div>
              {timeEntries.length > 0 && (
                <div className="border-t border-gray-100 dark:border-[#1a1a1a] pt-2 mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
                  {timeEntries.map((e, i) => (
                    <div key={e._id || i} className="flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{e.hours}h</span>
                        {e.description && <span className="text-gray-400 ml-1">— {e.description}</span>}
                      </div>
                      <button onClick={() => deleteTimeEntry(e._id)} className="p-0.5 text-gray-300 hover:text-red-500 ml-1"><FiTrash2 size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          {activities.length > 0 && (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-5">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FiActivity size={14} /> Activity</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {activities.slice(0, 10).map((a, i) => (
                  <div key={a._id || i} className="flex items-start gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5">
                      {(a.user?.name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-bold">{a.user?.name || 'Someone'}</span> {a.action || a.message}</p>
                      <p className="text-gray-400 mt-0.5">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetail