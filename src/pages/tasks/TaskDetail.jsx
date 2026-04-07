import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { FiArrowLeft, FiClock, FiPaperclip, FiMessageSquare, FiZap, FiSend, FiTrash2, FiUpload, FiDownload, FiFile, FiLoader, FiCpu, FiLink, FiActivity, FiPlus, FiCheckCircle, FiCheckSquare, FiSave } from 'react-icons/fi'
import { get, post, patch, del } from '../../utils/http'

const priorityMeta = {
  High: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20', label: 'High' },
  Medium: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20', label: 'Medium' },
  Low: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20', label: 'Low' },
}

const statusMeta = {
  'Not Started': { text: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800' },
  'In Progress': { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  'Paused': { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/10' },
  'Completed': { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
}

const SectionTitle = ({ icon: Icon, children }) => (
  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
    {Icon && <Icon size={13} className="text-zinc-400 dark:text-zinc-500" />}
    {children}
  </h3>
)

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
  const [aiSummary, setAiSummary] = useState(null)
  const [criteria, setCriteria] = useState([])
  const [generatedCriteria, setGeneratedCriteria] = useState([])
  const [savingCriteria, setSavingCriteria] = useState(false)
  const [showTimeForm, setShowTimeForm] = useState(false)
  const [timeForm, setTimeForm] = useState({ hours: '', description: '' })

  useEffect(() => {
    const load = async () => {
      const [taskRes, commentsRes, filesRes, timeRes, activityRes, linksRes] = await Promise.allSettled([
        get('/project-tasks/' + taskId),
        get('/comments/tasks/' + taskId + '/comments'),
        get('/uploads/task/' + taskId),
        get('/time/entries/task/' + taskId),
        get('/activity/task/' + taskId),
        get('/task-links/task/' + taskId),
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

  useEffect(() => {
    if (!currentTask) return
    const saved = currentTask.acceptanceCriteria || []
    setCriteria(saved)
    setGeneratedCriteria(saved)
  }, [currentTask])

  const addComment = async () => {
    if (!commentText.trim()) return
    const { data } = await post('/comments/tasks/' + taskId + '/comments', { content: commentText })
    const newComment = data.comment || data
    setComments((prev) => [...prev, newComment])
    setCommentText('')
  }

  const deleteComment = async (commentId) => {
    await del('/comments/' + commentId)
    setComments((prev) => prev.filter((c) => c._id !== commentId))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('files', file)
    const { data } = await post('/uploads/task/' + taskId, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    const uploaded = data.files || []
    if (Array.isArray(uploaded)) setFiles((prev) => [...prev, ...uploaded])
    else if (uploaded.name) setFiles((prev) => [...prev, uploaded])
    setUploading(false)
  }

  const deleteFile = async (fileId) => {
    await del('/uploads/' + fileId)
    setFiles((prev) => prev.filter((f) => f._id !== fileId && f.id !== fileId))
  }

  const logTime = async (e) => {
    e.preventDefault()
    if (!timeForm.hours) return
    const { data } = await post('/time/entries', { taskId, hours: parseFloat(timeForm.hours), description: timeForm.description })
    const entry = data.entry || data
    setTimeEntries((prev) => [...prev, entry])
    setTimeForm({ hours: '', description: '' })
    setShowTimeForm(false)
  }

  const deleteTimeEntry = async (entryId) => {
    await del('/time/entries/' + entryId)
    setTimeEntries((prev) => prev.filter((e) => e._id !== entryId))
  }

  const generateCriteria = async () => {
    setAiLoading('criteria')
    setAiSummary(null)
    const { data, error } = await post('/ai/generate-acceptance-criteria', {
      title: currentTask.title,
      description: currentTask.description,
    })
    setAiLoading(null)
    if (error || !data?.criteria) return
    setGeneratedCriteria(data.criteria)
  }

  const summarizeComments = async () => {
    setAiLoading('summary')
    setAiSummary(null)
    const { data, error } = await post('/ai/summarize-comments', { taskId })
    setAiLoading(null)
    if (error) return
    setAiSummary(data)
  }

  const saveCriteria = async () => {
    setSavingCriteria(true)
    await patch('/manageTasks/' + taskId, { acceptanceCriteria: generatedCriteria })
    setCriteria(generatedCriteria)
    setSavingCriteria(false)
  }

  const hasUnsavedCriteria = generatedCriteria.length > 0 && JSON.stringify(generatedCriteria) !== JSON.stringify(criteria)

  if (loading || !currentTask) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  const pMeta = priorityMeta[currentTask.priority] || priorityMeta.Medium
  const sMeta = statusMeta[currentTask.status] || statusMeta['Not Started']

  return (
    <div>
      <Link to={`/projects/${currentTask.projectId}`} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-orange-600 transition-colors">
        <FiArrowLeft size={14} /> Back to operations
      </Link>

      <header className="mt-4 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              <FiZap size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                Operation · {currentTask.priority} priority · {currentTask.status}
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight break-words">
                {currentTask.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ${pMeta.ring} ${pMeta.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dot}`} />
              {pMeta.label} priority
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${sMeta.bg} ${sMeta.text}`}>
              {currentTask.status}
            </span>
          </div>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-orange-500/40 via-zinc-200 dark:via-zinc-800 to-transparent" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <SectionTitle icon={FiZap}>Objective</SectionTitle>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
              {currentTask.description || 'No objective has been defined for this operation.'}
            </p>
            {currentTask.labels?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {currentTask.labels.map((label, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full font-bold"
                    style={{ backgroundColor: (label.color || '#ea580c') + '20', color: label.color || '#ea580c' }}>
                    {typeof label === 'string' ? label : label.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle icon={FiCheckSquare}>Acceptance Criteria</SectionTitle>
              <button onClick={generateCriteria} disabled={aiLoading !== null}
                className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-all">
                {aiLoading === 'criteria' ? <FiLoader size={12} className="animate-spin" /> : <FiCpu size={12} />} Generate
              </button>
            </div>

            {criteria.length === 0 && generatedCriteria.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-400 font-medium">
                No criteria defined yet. Generate a checklist with AI or leave this section blank.
              </p>
            ) : (
              <ol className="mt-4 space-y-2.5">
                {(generatedCriteria.length > 0 ? generatedCriteria : criteria).map((c, i) => (
                  <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 px-3.5 py-3">
                    <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      i < criteria.length ? 'bg-orange-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                    }`}>{i + 1}</span>
                    <span className="text-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300 flex-1">{c}</span>
                  </motion.li>
                ))}
              </ol>
            )}

            {hasUnsavedCriteria && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 px-4 py-3">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  {generatedCriteria.length - criteria.length > 0
                    ? `${generatedCriteria.length - criteria.length} new criterion${generatedCriteria.length - criteria.length > 1 ? 'a' : ''} ready to record.`
                    : 'Updated criteria ready to record.'}
                </p>
                <button onClick={saveCriteria} disabled={savingCriteria}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-50 transition-all">
                  {savingCriteria ? <FiLoader size={12} className="animate-spin" /> : <FiSave size={12} />} Save criteria
                </button>
              </div>
            )}
          </section>

          {links.length > 0 && (
            <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
              <SectionTitle icon={FiLink}>Linked Operations</SectionTitle>
              <div className="mt-3 space-y-2">
                {links.map((link, i) => (
                  <div key={link._id || i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{link.linkType}</span>
                    <span className="text-zinc-400">—</span>
                    <span className="font-medium">{link.targetTaskId || link.sourceTaskId}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle icon={FiCpu}>AI Assist</SectionTitle>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={summarizeComments} disabled={aiLoading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold hover:bg-orange-600 hover:text-white disabled:opacity-50 transition-all">
                {aiLoading === 'summary' ? <FiLoader size={13} className="animate-spin" /> : <FiMessageSquare size={13} />} Summarize comments
              </button>
              <button onClick={generateCriteria} disabled={aiLoading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold hover:bg-orange-600 hover:text-white disabled:opacity-50 transition-all">
                {aiLoading === 'criteria' ? <FiLoader size={13} className="animate-spin" /> : <FiCheckSquare size={13} />} Generate criteria
              </button>
            </div>

            {aiSummary && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 px-4 py-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Thread summary</span>
                  <span className="text-[10px] text-zinc-400 font-bold">{aiSummary.commentCount} comments</span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{aiSummary.summary}</p>
              </motion.div>
            )}
          </section>

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <SectionTitle icon={FiMessageSquare}>Comments ({comments.length})</SectionTitle>
            <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-1">
              <AnimatePresence>
                {comments.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8 font-medium">No comments yet — start the discussion.</p>
                ) : comments.map((c, i) => (
                  <motion.div key={c._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(c.user?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{c.user?.name || 'Agent'}</span>
                        <span className="text-[10px] text-zinc-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{c.content}</p>
                    </div>
                    <button onClick={() => deleteComment(c._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"><FiTrash2 size={12} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-4 flex gap-2">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a comment..." onKeyDown={(e) => e.key === 'Enter' && addComment()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#000] text-zinc-900 dark:text-white placeholder-zinc-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition text-sm" />
              <button onClick={addComment} disabled={!commentText.trim()}
                className="p-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-all"><FiSend size={16} /></button>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <SectionTitle icon={FiPaperclip}>Attachments ({files.length})</SectionTitle>
            <div className="mt-4 space-y-2 mb-4">
              {files.length === 0 && <p className="text-sm text-zinc-400 text-center py-4 font-medium">No files attached.</p>}
              {files.map((f, i) => (
                <div key={f._id || f.id || i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <FiFile className="text-orange-600 shrink-0" size={16} />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{f.name || f.path?.split('/').pop() || 'File'}</span>
                    {f.size && <span className="text-xs text-zinc-400 shrink-0">{(f.size / 1024).toFixed(0)}KB</span>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    {f.path && <a href={'http://localhost:3001' + f.path} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-zinc-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all"><FiDownload size={14} /></a>}
                    <button onClick={() => deleteFile(f._id || f.id)} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              {uploading ? <FiLoader className="animate-spin" size={16} /> : <FiUpload size={16} />}
              <span className="text-sm font-medium text-zinc-400">{uploading ? 'Uploading...' : 'Upload file'}</span>
            </label>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-5">
            <SectionTitle icon={FiCheckCircle}>Details</SectionTitle>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Status</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${sMeta.bg} ${sMeta.text}`}>{currentTask.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Priority</span>
                <span className={`text-[11px] font-bold ${pMeta.text}`}>{pMeta.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Assignee</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {(currentTask.assignedTo?.name || 'U').charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{currentTask.assignedTo?.name || 'Unassigned'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Due date</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <FiClock size={13} className="text-zinc-400" />
                  {currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Progress</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{currentTask.progress || 0}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all" style={{ width: `${currentTask.progress || 0}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={FiClock}>Time on Mission</SectionTitle>
              <button onClick={() => setShowTimeForm(!showTimeForm)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all"><FiPlus size={14} /></button>
            </div>
            {showTimeForm && (
              <form onSubmit={logTime} className="mb-4 space-y-2">
                <input type="number" step="0.5" min="0" value={timeForm.hours} onChange={(e) => setTimeForm((p) => ({ ...p, hours: e.target.value }))}
                  placeholder="Hours" className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-orange-500 outline-none transition" />
                <input type="text" value={timeForm.description} onChange={(e) => setTimeForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description" className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-orange-500 outline-none transition" />
                <button type="submit" className="w-full py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-all">Log time</button>
              </form>
            )}
            <div className="space-y-3">
              {currentTask.estimateHours > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Estimate</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{currentTask.estimateHours}h</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Logged</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{currentTask.loggedHours || 0}h</span>
              </div>
              {timeEntries.length > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
                  {timeEntries.map((e, i) => (
                    <div key={e._id || i} className="flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{e.hours}h</span>
                        {e.description && <span className="text-zinc-400 ml-1">— {e.description}</span>}
                      </div>
                      <button onClick={() => deleteTimeEntry(e._id)} className="p-0.5 text-zinc-300 hover:text-red-500 ml-1"><FiTrash2 size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {activities.length > 0 && (
            <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-5">
              <SectionTitle icon={FiActivity}>Activity</SectionTitle>
              <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                {activities.slice(0, 10).map((a, i) => (
                  <div key={a._id || i} className="flex items-start gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5">
                      {(a.user?.name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300"><span className="font-bold">{a.user?.name || 'Someone'}</span> {a.action || a.message}</p>
                      <p className="text-zinc-400 mt-0.5">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

export default TaskDetail
