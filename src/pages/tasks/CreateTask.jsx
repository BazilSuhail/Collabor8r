import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  FiPlus, FiArrowLeft, FiArrowRight, FiCpu, FiCheckCircle, FiZap,
  FiChevronRight, FiLayers, FiEdit2, FiUsers, FiLoader, FiTag, FiClock,
} from 'react-icons/fi'
import { IoCheckmarkDoneCircleOutline } from 'react-icons/io5'
import PageHeader from '../../components/ui/Header'
import api from '../../utils/api'
import useAuthStore from '../../stores/authStore'

const STEPS = [
  { id: 'ai', label: 'AI Draft', icon: FiCpu, desc: 'Describe the task' },
  { id: 'details', label: 'Details', icon: FiLayers, desc: 'Refine the mission' },
  { id: 'assign', label: 'Assign & Plan', icon: FiUsers, desc: 'Owner, sprint, labels' },
  { id: 'review', label: 'Review', icon: FiCheckCircle, desc: 'Confirm & create' },
]

const emptyDraft = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Not Started',
  dueDate: '',
  estimateHours: '',
  acceptanceCriteria: [],
  assignedTo: '',
  sprintId: '',
  labels: [],
  parentId: '',
}

const CreateTask = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [step, setStep] = useState(0)
  const [mode, setMode] = useState('ai')
  const [aiMode, setAiMode] = useState('single')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [aiDraft, setAiDraft] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [goal, setGoal] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [roadmap, setRoadmap] = useState(null)
  const [suggestedTasks, setSuggestedTasks] = useState([])
  const [creatingBulk, setCreatingBulk] = useState(false)
  const [bulkCreated, setBulkCreated] = useState(0)
  const [users, setUsers] = useState([])
  const [sprints, setSprints] = useState([])
  const [labels, setLabels] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [criteriaInput, setCriteriaInput] = useState('')
  const [error, setError] = useState('')

  const isCreatorOrManager = role === 'creator' || role === 'manager'
  const updateDraft = (f) => (e) => setDraft((p) => ({ ...p, [f]: e.target.value }))

  useEffect(() => {
    const load = async () => {
      const [usersRes, sprintsRes, labelsRes, tasksRes] = await Promise.allSettled([
        api('GET', '/manageusers/' + projectId + '/get-all-users'),
        api('GET', '/sprints/' + projectId),
        api('GET', '/labels/project/' + projectId),
        api('GET', '/manageTasks/project/' + projectId),
      ])
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || [])
      if (sprintsRes.status === 'fulfilled') setSprints(sprintsRes.value.data || [])
      if (labelsRes.status === 'fulfilled') setLabels(labelsRes.value.data || [])
      if (tasksRes.status === 'fulfilled') {
        const d = tasksRes.value.data
        setAllTasks(d.validTasks || d.tasks || d || [])
      }
      setLoading(false)
    }
    load()
    const checkRole = async () => {
      const { data } = await api('GET', '/admin-projects/' + projectId)
      if (!data.error) setRole('creator')
      else {
        const { data: mgrData } = await api('GET', '/joinedprojects/' + projectId)
        if (mgrData?.project?.manager === user?._id) setRole('manager')
      }
    }
    checkRole()
  }, [projectId, user?._id])

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setGenerating(true)
    setError('')
    try {
      const res = await api('POST', '/ai/draft-task', { prompt, projectId })
      if (res.error) throw new Error(res.error?.error || 'AI draft failed')
      const t = res.data?.task || {}
      const match = users.find((u) => u.email === t.suggestedAssignee)
      setDraft({
        title: t.title || '',
        description: t.description || '',
        priority: t.priority || 'Medium',
        status: t.status || 'Not Started',
        dueDate: t.dueDate || '',
        estimateHours: t.estimateHours || '',
        acceptanceCriteria: t.acceptanceCriteria || [],
        assignedTo: match?._id || '',
        sprintId: '',
        labels: [],
        parentId: '',
      })
      setAiDraft({ ...t, suggestedName: match?.name || t.suggestedAssignee })
    } catch (err) {
      setError(err.message || 'Failed to generate task draft')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateRoadmap = async (e) => {
    if (e) e.preventDefault()
    if (!goal.trim()) { setError('Describe your project goal first'); return }
    setBulkLoading(true)
    setError('')
    setSuggestedTasks([])
    setBulkCreated(0)
    try {
      const res = await api('POST', '/ai/roadmap', { projectId, goal: goal.trim() })
      if (res.error) throw new Error(res.error?.error || 'Failed to generate roadmap')
      setRoadmap(res.data?.roadmap || null)
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleSuggestTasks = async () => {
    setBulkLoading(true)
    setError('')
    try {
      const res = await api('POST', '/ai/suggest-tasks', {
        projectId,
        roadmap: roadmap || undefined,
        prompt: goal.trim() || undefined,
      })
      if (res.error) throw new Error(res.error?.error || 'Failed to suggest tasks')
      setSuggestedTasks(res.data?.tasks || [])
    } catch (err) {
      setError(err.message || 'Failed to suggest tasks')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleCreateAll = async () => {
    if (!suggestedTasks.length) return
    setCreatingBulk(true)
    setError('')
    try {
      const res = await api('POST', '/ai/create-tasks', { projectId, tasks: suggestedTasks })
      if (res.error) throw new Error(res.error?.error || 'Failed to create tasks')
      setBulkCreated(res.data?.count || suggestedTasks.length)
      setSuggestedTasks([])
      setRoadmap(null)
      setGoal('')
    } catch (err) {
      setError(err.message || 'Failed to create tasks')
    } finally {
      setCreatingBulk(false)
    }
  }

  const addCriteria = () => {
    const c = criteriaInput.trim()
    if (!c || draft.acceptanceCriteria.includes(c)) { setCriteriaInput(''); return }
    setDraft((p) => ({ ...p, acceptanceCriteria: [...p.acceptanceCriteria, c] }))
    setCriteriaInput('')
  }

  const toggleLabel = (id) => {
    setDraft((p) => ({
      ...p,
      labels: p.labels.includes(id) ? p.labels.filter((l) => l !== id) : [...p.labels, id],
    }))
  }

  const suggestAssignee = async () => {
    if (!draft.title.trim() && !draft.description.trim()) {
      setError('Add a title or description before asking for an assignee.')
      return
    }
    setSuggesting(true)
    setError('')
    const { data, error: err } = await api('POST', '/ai/suggest-assignee', {
      projectId,
      taskDescription: `${draft.title} — ${draft.description}`,
    })
    setSuggesting(false)
    if (err || !data?.suggestedUser) { setError('Could not suggest an assignee.'); return }
    setDraft((p) => ({ ...p, assignedTo: data.suggestedUser._id }))
  }

  const generateCriteria = async () => {
    if (!draft.title.trim()) { setError('Add a task title first.'); return }
    setError('')
    const { data, error: err } = await api('POST', '/ai/generate-acceptance-criteria', {
      title: draft.title,
      description: draft.description,
    })
    if (err || !data?.criteria) { setError('Could not generate criteria.'); return }
    setDraft((p) => ({ ...p, acceptanceCriteria: data.criteria }))
  }

  const validateCurrent = () => {
    if (step === 0 && mode === 'ai' && !draft.title && !prompt) {
      setError('Describe the task or use the AI draft first')
      return false
    }
    if (step === 0 && mode === 'manual' && !draft.title.trim()) {
      setError('Task title is required to continue')
      return false
    }
    if (step === 1) {
      if (!draft.title.trim()) { setError('Task title is required'); return false }
      if (!draft.description.trim()) { setError('Task description is required'); return false }
      if (!draft.dueDate) { setError('A due date is required'); return false }
    }
    if (step === 3) {
      if (!draft.title.trim()) { setError('Task title is required'); return false }
      if (!draft.description.trim()) { setError('Task description is required'); return false }
      if (!draft.dueDate) { setError('A due date is required'); return false }
    }
    setError('')
    return true
  }

  const next = () => { if (validateCurrent()) setStep((s) => Math.min(s + 1, STEPS.length - 1)) }
  const prev = () => { setError(''); setStep((s) => Math.max(s - 1, 0)) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateCurrent()) return
    setSubmitting(true)
    setError('')
    const body = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      priority: draft.priority,
      status: draft.status,
      dueDate: draft.dueDate,
      estimateHours: Number(draft.estimateHours) || 0,
      acceptanceCriteria: draft.acceptanceCriteria,
      projectId,
      assignedTo: !isCreatorOrManager ? (draft.assignedTo || user?._id) : draft.assignedTo,
      sprintId: draft.sprintId || undefined,
      labels: draft.labels,
      parentId: draft.parentId || undefined,
    }
    if (!body.assignedTo) body.assignedTo = user?._id
    const res = await api('POST', '/manageTasks/', body)
    setSubmitting(false)
    if (res.error) {
      setError(res.error?.error || res.error?.errors?.[0] || 'Failed to create task')
      return
    }
    const task = res.data?.task || res.data
    navigate(`/tasks/${task._id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        icon={FiPlus}
        title="Create New"
        highlight="Task"
        subtitle="Configure your task with AI or manual setup"
      />

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="md:w-64 shrink-0">
          <div className="md:sticky md:top-24 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Setup Progress</p>
            <div className="space-y-0">
              {STEPS.map((s, i) => {
                const active = i === step
                const done = i < step
                return (
                  <button key={s.id} type="button" onClick={() => { if (done || i === step) { setError(''); setStep(i) } }}
                    className={`relative flex items-center gap-3 w-full text-left py-3 transition-all ${active ? 'text-orange-600' : done ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                    {i !== 0 && (
                      <span className={`absolute top-0 left-[15px] h-3 w-px ${done ? 'bg-green-500' : 'bg-gray-200 dark:bg-[#1a1a1a]'}`} />
                    )}
                    <span className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      active ? 'border-orange-600 bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                        : done ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#151515]'
                    }`}>
                      {done ? <IoCheckmarkDoneCircleOutline size={15} /> : <s.icon size={14} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold">{s.label}</span>
                      <span className="block text-[10px] font-medium opacity-70 truncate">{s.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <motion.form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => e.preventDefault()}
          className="flex-1 min-w-0 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 md:p-8 space-y-6"
        >
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
                  <div className="flex items-center gap-3 text-orange-600">
                    <FiCpu className="text-xl" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Create Your Task</h3>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button type="button" onClick={() => { setMode('ai'); setAiMode('single'); setError('') }}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'ai' && aiMode === 'single' ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-md' : 'bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}>
                      <FiCpu className="inline mr-1.5" size={14} /> AI Draft
                    </button>
                    <button type="button" onClick={() => { setMode('manual'); setError('') }}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'manual' ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-md' : 'bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}>
                      <FiEdit2 className="inline mr-1.5" size={14} /> Manual
                    </button>
                    <button type="button" onClick={() => { setMode('ai'); setAiMode('bulk'); setError('') }}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'ai' && aiMode === 'bulk' ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-md' : 'bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}>
                      <FiLayers className="inline mr-1.5" size={14} /> AI Generator
                    </button>
                  </div>
                </div>

                {mode === 'ai' && aiMode === 'single' && (
                  <>
                    <div className="bg-gray-50 dark:bg-[#151515] rounded-2xl p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0"><FiZap size={14} /></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          Tell me what needs to be done. Example: <span className="text-orange-600 dark:text-orange-400 font-medium">                          Build the checkout flow for the mobile app, including Stripe payments and error handling.</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input value={prompt} onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(e) }}
                          placeholder="Describe the task in natural language..."
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                        />
                        <button type="button" onClick={handleGenerate} disabled={generating}
                          className="px-5 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md whitespace-nowrap">
                          {generating ? <FiLoader className="animate-spin inline" size={15} /> : 'Draft'}
                        </button>
                      </div>
                    </div>

                    {aiDraft && (
                      <div className="rounded-2xl border border-orange-500/30 bg-orange-50/50 dark:bg-orange-500/5 p-5 space-y-3">
                        <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider">
                          <FiCheckCircle /> AI Draft Preview
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900 dark:text-white">{draft.title || 'Untitled'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{draft.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#151515] border border-orange-500/20 font-bold capitalize">{draft.priority}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#151515] border border-orange-500/20 font-bold">{draft.dueDate ? new Date(draft.dueDate + 'T00:00:00').toLocaleDateString() : 'No due date'}</span>
                          {draft.estimateHours > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#2a2a2a] font-bold">{draft.estimateHours}h est</span>
                          )}
                          {aiDraft.suggestedName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#2a2a2a] font-bold">👤 {aiDraft.suggestedName}</span>
                          )}
                        </div>
                        {draft.acceptanceCriteria.length > 0 && (
                          <ul className="space-y-1">
                            {draft.acceptanceCriteria.map((c, i) => (
                              <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><FiChevronRight className="text-orange-500 shrink-0" />{c}</li>
                            ))}
                          </ul>
                        )}
                        <button type="button" onClick={next}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white text-sm font-bold hover:from-orange-500 hover:to-orange-600 transition-all">
                          Continue with this draft <FiChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                )}

                {mode === 'ai' && aiMode === 'bulk' && (
                  <div className="bg-gray-50 dark:bg-[#151515] rounded-2xl p-5 space-y-4">
                    {/* Assistant welcome */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-amber-500 text-white flex items-center justify-center shrink-0"><FiZap size={14} /></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          Describe your project <span className="font-bold text-gray-900 dark:text-white">goal</span> and I'll build a
                          multi-phase <span className="text-orange-600 dark:text-orange-400 font-medium">roadmap</span>, then suggest
                          concrete tasks you can create all at once.
                        </p>
                      </div>
                    </div>

                    {/* Goal input */}
                    <div className="flex gap-2">
                      <input value={goal} onChange={(e) => setGoal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateRoadmap(e) }}
                        placeholder="e.g. Build a marketing site with blog, SEO and analytics..."
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      />
                      <button type="button" onClick={handleGenerateRoadmap} disabled={bulkLoading}
                        className="px-5 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md whitespace-nowrap">
                        {bulkLoading ? <FiLoader className="animate-spin inline" size={15} /> : <><FiLayers className="inline mr-1" size={14} /> Roadmap</>}
                      </button>
                    </div>

                    {/* Roadmap result */}
                    {roadmap && (
                      <div className="rounded-xl border border-orange-500/30 bg-white dark:bg-[#000] p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5"><FiLayers /> Delivery Roadmap</p>
                        {roadmap.summary && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{roadmap.summary}</p>
                        )}
                        {roadmap.phases?.map((phase, i) => (
                          <div key={i} className="border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-3">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{i + 1}. {phase.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{phase.description}</p>
                            <p className="text-[10px] text-gray-400 mt-1.5 font-semibold">{phase.tasks?.length || 0} tasks in this phase</p>
                          </div>
                        ))}
                        <button type="button" onClick={handleSuggestTasks} disabled={bulkLoading}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md">
                          {bulkLoading ? <FiLoader className="animate-spin" size={15} /> : <><FiZap size={15} /> Suggest Concrete Tasks</>}
                        </button>
                      </div>
                    )}

                    {/* Suggested tasks */}
                    {suggestedTasks.length > 0 && (
                      <div className="rounded-xl border border-orange-500/30 bg-white dark:bg-[#000] p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                          <FiCheckCircle /> {suggestedTasks.length} Task{suggestedTasks.length === 1 ? '' : 's'} Ready to Create
                        </p>
                        <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {suggestedTasks.map((t, i) => (
                            <li key={i} className="border border-gray-100 dark:border-[#1a1a1a] rounded-xl p-3">
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t.title}</p>
                              {t.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{t.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  t.priority === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                  t.priority === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                  'bg-green-100 dark:bg-green-900/30 text-green-600'
                                }`}>{t.priority}</span>
                                {Number(t.estimateHours) > 0 && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#151515] text-gray-500 dark:text-gray-400 font-bold">{t.estimateHours}h</span>
                                )}
                                {t.suggestedAssignee && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">👤 {t.suggestedAssignee}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <button type="button" onClick={handleCreateAll} disabled={creatingBulk}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white font-bold hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-md">
                          {creatingBulk ? <FiLoader className="animate-spin" size={15} /> : <FiCheckCircle size={15} />}
                          {creatingBulk ? 'Creating tasks...' : `Create All ${suggestedTasks.length} Task${suggestedTasks.length === 1 ? '' : 's'}`}
                        </button>
                      </div>
                    )}

                    {/* Success */}
                    {bulkCreated > 0 && (
                      <div className="rounded-xl border border-green-500/30 bg-green-50 dark:bg-green-500/10 p-4 text-center space-y-2">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">🎉 {bulkCreated} task{bulkCreated === 1 ? '' : 's'} created successfully!</p>
                        <button type="button" onClick={() => navigate(`/projects/${projectId}/manage`)}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-all">
                          View task board →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {mode === 'manual' && (
                  <div className="bg-gray-50 dark:bg-[#151515] rounded-2xl p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Task Title *</label>
                      <input value={draft.title} onChange={updateDraft('title')} placeholder="Task title" required
                        className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Description</label>
                      <textarea value={draft.description} onChange={updateDraft('description')} rows={3} placeholder="Short description"
                        className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <p className="text-xs text-gray-400">You can add all remaining details in the next step.</p>
                      <button type="button" onClick={next}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white text-sm font-bold hover:from-orange-500 hover:to-orange-600 transition-all">
                        Continue to details <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="flex items-center gap-3 text-orange-600">
                  <FiLayers className="text-xl" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Task Details</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Task Title *</label>
                  <input value={draft.title} onChange={updateDraft('title')} placeholder="Task title" required
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Description *</label>
                  <textarea value={draft.description} onChange={updateDraft('description')} rows={3} placeholder="Short description"
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Priority</label>
                    <select value={draft.priority} onChange={updateDraft('priority')}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition capitalize">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Status</label>
                    <select value={draft.status} onChange={updateDraft('status')}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition">
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Paused">Paused</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Due Date *</label>
                    <input type="date" value={draft.dueDate} onChange={updateDraft('dueDate')} required
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Est. Hours</label>
                    <input type="number" min="0" step="0.5" value={draft.estimateHours} onChange={updateDraft('estimateHours')} placeholder="0"
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acceptance Criteria</label>
                    <button type="button" onClick={generateCriteria}
                      className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition-all">
                      <FiZap size={12} /> Generate with AI
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input value={criteriaInput} onChange={(e) => setCriteriaInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCriteria() } }}
                      placeholder="Add a criterion and press Enter"
                      className="flex-1 px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
                    <button type="button" onClick={addCriteria}
                      className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 font-bold hover:bg-orange-600 hover:text-white transition-all">
                      +
                    </button>
                  </div>
                  {draft.acceptanceCriteria.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {draft.acceptanceCriteria.map((c, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          <FiChevronRight className="text-orange-500 shrink-0" />
                          <span className="flex-1">{c}</span>
                          <button type="button" onClick={() => setDraft((p) => ({ ...p, acceptanceCriteria: p.acceptanceCriteria.filter((x, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="assign" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center gap-3 text-orange-600">
                  <FiUsers className="text-xl" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Assign & Plan</h3>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assign To</label>
                    <button type="button" onClick={suggestAssignee} disabled={suggesting}
                      className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-all">
                      {suggesting ? <FiLoader className="animate-spin" size={12} /> : <FiZap size={12} />} Suggest assignee
                    </button>
                  </div>
                  <select value={draft.assignedTo} onChange={updateDraft('assignedTo')}
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition">
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  {!isCreatorOrManager && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">You can only assign tasks to yourself</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Sprint</label>
                    <select value={draft.sprintId} onChange={updateDraft('sprintId')}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition">
                      <option value="">No Sprint</option>
                      {sprints.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Parent Task</label>
                    <select value={draft.parentId} onChange={updateDraft('parentId')}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition">
                      <option value="">No Parent</option>
                      {allTasks.filter((t) => !t.parentId).map((t) => (
                        <option key={t._id} value={t._id}>{t.title?.length > 40 ? t.title.slice(0, 40) + '...' : t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider"><FiTag className="inline mr-1" /> Labels</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 dark:bg-[#151515] rounded-xl min-h-[42px] border border-gray-300 dark:border-[#1a1a1a]">
                    {labels.length === 0 && (
                      <span className="text-xs text-gray-400 px-2">No labels available</span>
                    )}
                    {labels.map((l) => {
                      const checked = draft.labels.includes(l._id)
                      return (
                        <button key={l._id} type="button" onClick={() => toggleLabel(l._id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${checked ? 'text-white' : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a1a1a]'}`}
                          style={checked ? { backgroundColor: l.color || '#ea580c' } : {}}
                        >
                          {l.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center gap-3 text-orange-600">
                  <FiCheckCircle className="text-xl" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Review & Create</h3>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-5 space-y-4">
                  <div>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{draft.title || 'Untitled'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{draft.description || 'No description'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                      draft.priority === 'High' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-500/20' :
                      draft.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-500/20'
                    }`}>{draft.priority}</span>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-[#2a2a2a]">{draft.status}</span>
                    {draft.dueDate && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-[#2a2a2a]">
                        <FiClock className="inline mr-1" size={10} />{new Date(draft.dueDate + 'T00:00:00').toLocaleDateString()}
                      </span>
                    )}
                    {Number(draft.estimateHours) > 0 && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">{draft.estimateHours}h est</span>
                    )}
                    {draft.labels.map((id) => {
                      const l = labels.find((x) => x._id === id)
                      return l ? (
                        <span key={id} className="text-[10px] px-2.5 py-1 rounded-full font-bold border"
                          style={{ backgroundColor: (l.color || '#ea580c') + '20', color: l.color || '#ea580c', borderColor: (l.color || '#ea580c') + '40' }}>{l.name}</span>
                      ) : null
                    })}
                  </div>
                  {draft.acceptanceCriteria.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Acceptance Criteria</p>
                      <ul className="space-y-1">
                        {draft.acceptanceCriteria.map((c, i) => <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><FiChevronRight className="text-orange-500" />{c}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-[#1a1a1a] text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Assignee</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                        {draft.assignedTo ? (users.find((u) => u._id === draft.assignedTo)?.name || 'Selected user') : 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Sprint</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                        {draft.sprintId ? (sprints.find((s) => s._id === draft.sprintId)?.name || 'Selected') : 'No Sprint'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button type="button" onClick={prev}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#151515] transition-all">
                  <FiArrowLeft size={16} /> Back
                </button>
              )}
              <button type="button" onClick={() => navigate(`/projects/${projectId}/manage`)}
                className="px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 font-bold hover:text-orange-600 transition-all">
                Cancel
              </button>
            </div>

            {step === 0 && mode === 'ai' && aiMode === 'bulk' ? null : step < STEPS.length - 1 ? (
              <button type="button" onClick={next} disabled={step === 0 && mode === 'ai' && generating}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md">
                Continue <FiArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md">
                <FiCheckCircle /> {submitting ? 'Creating...' : 'Create Task'}
              </button>
            )}
          </div>
        </motion.form>
      </div>
    </div>
  )
}

export default CreateTask
