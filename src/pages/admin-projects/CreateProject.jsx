import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  FiPlus, FiArrowLeft, FiArrowRight, FiCpu, FiCheckCircle, FiZap,
  FiChevronRight, FiMail, FiTag, FiLayers, FiEdit2,
} from 'react-icons/fi'
import { IoCheckmarkDoneCircleOutline } from 'react-icons/io5'
import PageHeader from '../../components/ui/Header'
import useProjectStore from '../../stores/projectStore'
import { post } from '../../utils/http'

const STEPS = [
  { id: 'ai', label: 'AI Draft', icon: FiCpu, desc: 'Describe your project' },
  { id: 'details', label: 'Details', icon: FiLayers, desc: 'Refine the metadata' },
  { id: 'team', label: 'Lead & Theme', icon: FiMail, desc: 'Assign the lead' },
  { id: 'review', label: 'Review', icon: FiCheckCircle, desc: 'Confirm & create' },
]

const emptyDraft = {
  name: '',
  description: '',
  about: '',
  objectives: [],
  tags: [],
  category: 'other',
  methodology: 'sprint',
  startDate: '',
  targetDate: '',
  version: 'v1.0',
  links: [],
}

const CATEGORIES = ['software', 'marketing', 'design', 'research', 'business', 'other']

const CreateProject = () => {
  const { projectId } = useParams()
  const isEdit = Boolean(projectId)
  const { fetchProjectDetail, createProject, updateProject } = useProjectStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(isEdit ? 1 : 0)
  const [isReady, setIsReady] = useState(!isEdit)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [chat, setChat] = useState([])
  const [draft, setDraft] = useState(emptyDraft)
  const [leadEmail, setLeadEmail] = useState('')
  const [theme, setTheme] = useState(1)
  const [tagInput, setTagInput] = useState('')
  const [objInput, setObjInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('ai')
  const [error, setError] = useState('')

  const updateDraft = (f) => (e) => setDraft((p) => ({ ...p, [f]: e.target.value }))

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    fetchProjectDetail(projectId)
      .then((p) => {
        if (cancelled || !p) return
        setDraft({
          name: p.name || '',
          description: p.description || '',
          about: p.about || '',
          objectives: Array.isArray(p.objectives) ? p.objectives : [],
          tags: Array.isArray(p.tags) ? p.tags : [],
          category: p.category || 'other',
          methodology: p.methodology || 'sprint',
          startDate: p.startDate ? String(p.startDate).slice(0, 10) : '',
          targetDate: p.targetDate ? String(p.targetDate).slice(0, 10) : '',
          version: p.version || 'v1.0',
          links: Array.isArray(p.links) ? p.links : [],
        })
        setLeadEmail(p.leads?.length ? (p.leads[0]?.email || String(p.leads[0])) : '')
        setTheme(p.theme || 1)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsReady(true)
      })
    return () => { cancelled = true }
  }, [isEdit, projectId])

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setGenerating(true)
    setError('')
    setChat((prev) => [...prev, { role: 'user', text: prompt }])
    try {
      const res = await post('/projects/ai-assist', { prompt })
      if (res.error) throw new Error(res.error?.error || 'AI draft failed')
      const p = res.data?.project || {}
      setDraft({
        name: p.name || '',
        description: p.description || '',
        about: p.about || '',
        objectives: Array.isArray(p.objectives) ? p.objectives : [],
        tags: Array.isArray(p.tags) ? p.tags : [],
        category: p.category || 'other',
        methodology: p.methodology || 'sprint',
        startDate: p.startDate ? String(p.startDate).slice(0, 10) : '',
        targetDate: p.targetDate ? String(p.targetDate).slice(0, 10) : '',
        version: p.version || 'v1.0',
        links: [],
      })
      setChat((prev) => [...prev, { role: 'ai', text: 'Here is your project draft — review it below, then continue.' }])
    } catch (err) {
      setError(err.message || 'Failed to generate project draft')
      setChat((prev) => [...prev, { role: 'ai', text: 'I could not draft the project. Please try again.' }])
    } finally {
      setGenerating(false)
    }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || draft.tags.includes(t)) { setTagInput(''); return }
    setDraft((p) => ({ ...p, tags: [...p.tags, t] }))
    setTagInput('')
  }

  const addObjective = () => {
    const o = objInput.trim()
    if (!o || draft.objectives.includes(o)) { setObjInput(''); return }
    setDraft((p) => ({ ...p, objectives: [...p.objectives, o] }))
    setObjInput('')
  }

  const validateCurrent = () => {
    if (step === 0 && mode === 'ai' && !draft.name && !prompt) {
      setError('Describe your project or use the AI draft first')
      return false
    }
    if (step === 0 && mode === 'manual' && !draft.name.trim()) {
      setError('Project name is required to continue')
      return false
    }
    if (step === 2) {
      if (!leadEmail.trim()) { setError('Project lead email is required'); return false }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) { setError('Please enter a valid lead email'); return false }
    }
    if (step === 3) {
      if (!draft.name.trim()) { setError('Project name is required'); return false }
      if (!draft.description.trim()) { setError('Project description is required'); return false }
      if (!leadEmail.trim()) { setError('Project lead email is required'); return false }
    }
    setError('')
    return true
  }

  const next = () => { if (validateCurrent()) setStep((s) => Math.min(s + 1, STEPS.length - 1)) }
  const prev = () => { setError(''); setStep((s) => Math.max(s - 1, 0)) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateCurrent()) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...draft,
        leadEmail,
        theme,
        links: draft.links || [],
        startDate: draft.startDate ? new Date(draft.startDate) : null,
        targetDate: draft.targetDate ? new Date(draft.targetDate) : null,
      }
      if (isEdit) {
        await updateProject(projectId, payload)
        navigate(`/projects/${projectId}`)
      } else {
        const project = await createProject(payload)
        navigate(`/projects/${project._id}`)
      }
    } catch (err) {
      const body = err?.response?.data || err?.error || err
      setError(body?.errors?.[0] || body?.error || body?.message || 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  if (isEdit && !isReady) {
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
        title={isEdit ? 'Edit' : 'Create New'}
        highlight="Project"
        subtitle={isEdit ? 'Modify your project workspace' : 'Configure your project workspace'}
      />

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Side progress bar */}
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

        {/* Step content */}
        <motion.form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => e.preventDefault()}
          className="flex-1 min-w-0 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 md:p-8 space-y-6"
        >
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1 — AI draft */}
            {step === 0 && (
              <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
                  <div className="flex items-center gap-3 text-orange-600">
                    <FiCpu className="text-xl" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Create Your Project</h3>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button type="button" onClick={() => { setMode('ai'); setError('') }}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'ai' ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-md' : 'bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}>
                      <FiCpu className="inline mr-1.5" size={14} /> AI Draft
                    </button>
                    <button type="button" onClick={() => { setMode('manual'); setError('') }}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'manual' ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-md' : 'bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}>
                      <FiEdit2 className="inline mr-1.5" size={14} /> Manual
                    </button>
                  </div>
                </div>

                {mode === 'ai' && (
                <>
                <div className="bg-gray-50 dark:bg-[#151515] rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0"><FiZap size={14} /></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      Tell me what you're building. Example: <span className="text-orange-600 dark:text-orange-400 font-medium">"A mobile app for tracking gym workouts with social challenges, targeting release this quarter."</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(e) }}
                      placeholder="Describe your project in natural language..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                    <button type="button" onClick={handleGenerate} disabled={generating}
                      className="px-5 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md whitespace-nowrap">
                      {generating ? 'Drafting...' : 'Draft'}
                    </button>
                  </div>
                </div>

                {chat.length > 0 && (
                  <div className="space-y-3">
                    {chat.map((m, i) => (
                      <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${m.role === 'user' ? 'bg-gray-400' : 'bg-orange-600'}`}>
                          {m.role === 'user' ? 'U' : <FiCpu size={14} />}
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium max-w-[80%] ${
                          m.role === 'user'
                            ? 'bg-orange-600 text-white rounded-tr-sm'
                            : 'bg-gray-100 dark:bg-[#151515] text-gray-700 dark:text-gray-300 rounded-tl-sm'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(draft.name || draft.description) && (
                  <div className="rounded-2xl border border-orange-500/30 bg-orange-50/50 dark:bg-orange-500/5 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider">
                      <FiCheckCircle /> AI Draft Preview
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-900 dark:text-white">{draft.name || 'Untitled'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{draft.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#151515] border border-orange-500/20 font-bold capitalize">{draft.category}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#151515] border border-orange-500/20 font-bold capitalize">{draft.methodology}</span>
                      {draft.tags.slice(0, 5).map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#2a2a2a] font-bold">#{t}</span>
                      ))}
                    </div>
                    <button type="button" onClick={next}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white text-sm font-bold hover:from-orange-500 hover:to-orange-600 transition-all">
                      Continue with this draft <FiChevronRight />
                    </button>
                  </div>
                )}
                </>
                )}

                {mode === 'manual' && (
                <div className="bg-gray-50 dark:bg-[#151515] rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Project Name *</label>
                    <input value={draft.name} onChange={updateDraft('name')} placeholder="Project name" required
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

            {/* STEP 2 — Details */}
            {step === 1 && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="flex items-center gap-3 text-orange-600">
                  <FiLayers className="text-xl" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Project Details</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Project Name *</label>
                  <input value={draft.name} onChange={updateDraft('name')} placeholder="Project name" required
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Description *</label>
                  <textarea value={draft.description} onChange={updateDraft('description')} rows={3} placeholder="Short description"
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">About</label>
                  <textarea value={draft.about} onChange={updateDraft('about')} rows={4} placeholder="Long-form overview for the About page"
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Category</label>
                    <select value={draft.category} onChange={updateDraft('category')}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition capitalize">
                      {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Methodology</label>
                    <select value={draft.methodology} onChange={updateDraft('methodology')}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition capitalize">
                      <option value="sprint">Sprint</option>
                      <option value="kanban">Kanban</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Start Date</label>
                    <input type="date" value={draft.startDate} onChange={updateDraft('startDate')}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Target Date</label>
                    <input type="date" value={draft.targetDate} onChange={updateDraft('targetDate')}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Tags</label>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                      placeholder="Add tag and press Enter"
                      className="flex-1 px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
                    <button type="button" onClick={addTag}
                      className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 font-bold hover:bg-orange-600 hover:text-white transition-all">
                      <FiTag />
                    </button>
                  </div>
                  {draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {draft.tags.map((t) => (
                        <span key={t} className="text-xs px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20 flex items-center gap-1.5">
                          #{t}
                          <button type="button" onClick={() => setDraft((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }))} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Objectives</label>
                  <div className="flex gap-2">
                    <input value={objInput} onChange={(e) => setObjInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addObjective() } }}
                      placeholder="Add an objective and press Enter"
                      className="flex-1 px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
                    <button type="button" onClick={addObjective}
                      className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 font-bold hover:bg-orange-600 hover:text-white transition-all">
                      +
                    </button>
                  </div>
                  {draft.objectives.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {draft.objectives.map((o, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          <FiChevronRight className="text-orange-500 shrink-0" />
                          <span className="flex-1">{o}</span>
                          <button type="button" onClick={() => setDraft((p) => ({ ...p, objectives: p.objectives.filter((x, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Lead & Theme */}
            {step === 2 && (
              <motion.div key="team" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center gap-3 text-orange-600">
                  <FiMail className="text-xl" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Lead & Theme</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Project Lead Email *</label>
                  <input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="lead@example.com" required
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition" />
                  <p className="text-xs text-gray-400 mt-1.5">The lead will receive an invitation to manage this project alongside you.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Cover Theme</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <button key={n} type="button" onClick={() => setTheme(n)}
                        className={`relative rounded-xl overflow-hidden border-4 transition-all ${theme === n ? 'border-orange-600' : 'border-transparent'}`}>
                        <img src={`/themes/${n}.jpg`} alt={`Theme ${n}`} className="w-full h-20 object-cover" />
                        {theme === n && <span className="absolute top-1.5 right-1.5 bg-orange-600 text-white rounded-full p-0.5"><IoCheckmarkDoneCircleOutline /></span>}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4 — Review */}
            {step === 3 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center gap-3 text-orange-600">
                  <FiCheckCircle className="text-xl" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Review & Create</h3>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden">
                  <div className="relative h-36">
                    <img src={`/themes/${theme}.jpg`} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5">
                      <h3 className="text-2xl font-black text-white">{draft.name || 'Untitled'}</h3>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold capitalize border border-orange-500/20">{draft.category}</span>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold capitalize border border-purple-500/20">{draft.methodology}</span>
                      {draft.tags.map((t) => <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#151515] text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-[#2a2a2a]">#{t}</span>)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{draft.description}</p>
                    {draft.about && <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{draft.about}</p>}
                    {draft.objectives.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Objectives</p>
                        <ul className="space-y-1">
                          {draft.objectives.map((o, i) => <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><FiChevronRight className="text-orange-500" />{o}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-[#1a1a1a] text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Lead</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{leadEmail}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Timeline</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{draft.startDate ? String(draft.startDate).slice(0, 10) : '—'} → {draft.targetDate ? String(draft.targetDate).slice(0, 10) : 'Open'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button type="button" onClick={prev}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-[#1a1a1a] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#151515] transition-all">
                  <FiArrowLeft size={16} /> Back
                </button>
              )}
              <button type="button" onClick={() => navigate(isEdit ? `/projects/${projectId}` : '/projects')}
                className="px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 font-bold hover:text-orange-600 transition-all">
                Cancel
              </button>
            </div>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} disabled={step === 0 && mode === 'ai' && generating}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md">
                Continue <FiArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md">
                <FiCheckCircle /> {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Project')}
              </button>
            )}
          </div>
        </motion.form>
      </div>
    </div>
  )
}

export default CreateProject
