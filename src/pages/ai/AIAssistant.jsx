import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { FiCpu, FiMessageSquare, FiZap, FiUser, FiCalendar, FiSearch, FiCheckCircle, FiAlertTriangle, FiBarChart2, FiList, FiLoader, FiChevronRight, FiCopy, FiExternalLink, FiPlus } from 'react-icons/fi'
import PageHeader from '../../components/ui/Header'
import api from '../../utils/api'

const features = [
  { id: 'create-task', icon: FiPlus, label: 'Create Task from Prompt', desc: 'Natural language → structured task', endpoint: '/ai/create-task', method: 'POST', input: 'prompt', inputLabel: 'Describe the task', inputPlaceholder: 'e.g. Set up CI/CD pipeline for the backend project', needProject: true },
  { id: 'create-sprint', icon: FiCalendar, label: 'Create Sprint', desc: 'Plain command → sprint with dates & goal', endpoint: '/ai/create-sprint', method: 'POST', input: 'prompt', inputLabel: 'Describe the sprint', inputPlaceholder: 'e.g. 2 week sprint on payment fixes starting next Monday', needProject: true },
  { id: 'breakdown', icon: FiList, label: 'Break Down Task', desc: 'Generate subtask breakdown', endpoint: '/ai/breakdown-task', method: 'POST', input: 'taskDescription', inputLabel: 'Task description', inputPlaceholder: 'e.g. Implement user authentication system', needProject: false },
  { id: 'suggest-assignee', icon: FiUser, label: 'Suggest Assignee', desc: 'AI recommends best team member', endpoint: '/ai/suggest-assignee', method: 'POST', input: 'taskDescription', inputLabel: 'Task description', inputPlaceholder: 'e.g. Frontend UI for dashboard', needProject: true },
  { id: 'recommend-metadata', icon: FiCalendar, label: 'Recommend Metadata', desc: 'Priority, status & due date', endpoint: '/ai/recommend-metadata', method: 'POST', input: 'title', inputLabel: 'Task title + description', inputPlaceholder: 'e.g. Fix login bug on production', needProject: false },
  { id: 'project-summary', icon: FiBarChart2, label: 'Project Summary', desc: 'AI-generate project status', endpoint: '/ai/project-summary/', method: 'GET', input: null, inputLabel: '', inputPlaceholder: '', needProject: true },
  { id: 'search-tasks', icon: FiSearch, label: 'Semantic Search', desc: 'Search tasks via AI', endpoint: '/ai/search-tasks', method: 'POST', input: 'query', inputLabel: 'Search query', inputPlaceholder: 'e.g. tasks related to payment gateway', needProject: false },
  { id: 'summarize', icon: FiMessageSquare, label: 'Summarize Comments', desc: 'TL;DR of task discussion', endpoint: '/ai/summarize-comments', method: 'POST', input: 'taskId', inputLabel: 'Task ID', inputPlaceholder: 'Paste task ID', needProject: false },
  { id: 'criteria', icon: FiCheckCircle, label: 'Acceptance Criteria', desc: 'Generate 3-5 criteria items', endpoint: '/ai/generate-acceptance-criteria', method: 'POST', input: 'title', inputLabel: 'Task title + description', inputPlaceholder: 'e.g. User should be able to reset password via email', needProject: false },
  { id: 'risks', icon: FiAlertTriangle, label: 'Detect Risks', desc: 'Scan project for risks', endpoint: '/ai/detect-risks', method: 'POST', input: null, inputLabel: '', inputPlaceholder: '', needProject: true },
  { id: 'retro', icon: FiBarChart2, label: 'Sprint Retrospective', desc: 'Analyze sprint performance', endpoint: '/ai/retrospective', method: 'POST', input: 'sprintId', inputLabel: 'Sprint ID', inputPlaceholder: 'Paste sprint ID', needProject: false },
]

const AIAssistant = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [projectInput, setProjectInput] = useState(projectId || '')
  const [inputValues, setInputValues] = useState({})
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})

  const handleRun = async (feature) => {
    const { id, endpoint, method, input, needProject } = feature
    const value = inputValues[id] || ''
    if (needProject && !projectInput) return
    if (input && !value) return

    setLoading((prev) => ({ ...prev, [id]: true }))
    setResults((prev) => ({ ...prev, [id]: null }))

    try {
      let data
      if (method === 'GET') {
        const url = endpoint + (needProject ? projectInput : '')
        const res = await api('GET', url)
        data = res.data
      } else {
        let body = {}
        if (input) body[input] = value
        if (needProject && projectInput) body.projectId = projectInput
        const res = await api('POST', endpoint, body)
        data = res.data
      }
      setResults((prev) => ({ ...prev, [id]: data }))
    } catch {
      setResults((prev) => ({ ...prev, [id]: { error: 'Request failed' } }))
    }
    setLoading((prev) => ({ ...prev, [id]: false }))
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2))
  }

  const renderResult = (id, data) => {
    if (!data) return null
    if (data.error) return <p className="text-red-500 text-xs font-medium">{data.error}</p>

    if (id === 'create-task') {
      const task = data.task || data.aiExtracted || data
      return (
        <div className="space-y-1">
          {task.title && <p className="text-sm font-bold text-gray-900 dark:text-white">{task.title}</p>}
          {task.description && <p className="text-xs text-gray-500">{task.description}</p>}
          {(task.priority || task.status) && <p className="text-xs text-gray-400">{task.priority && `Priority: ${task.priority}`}{task.status && ` · Status: ${task.status}`}</p>}
        </div>
      )
    }
    if (id === 'create-sprint') {
      const sprint = data.sprint || data.aiExtracted || data
      return (
        <div className="space-y-1">
          {sprint.name && <p className="text-sm font-bold text-gray-900 dark:text-white">{sprint.name}</p>}
          {sprint.goal && <p className="text-xs text-gray-500">{sprint.goal}</p>}
          {(sprint.startDate || sprint.endDate) && <p className="text-xs text-gray-400 font-medium">{sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : ''} — {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : ''}</p>}
        </div>
      )
    }
    if (id === 'breakdown') {
      const subtasks = data.subtasks || data
      if (Array.isArray(subtasks)) return subtasks.map((s, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
          <FiChevronRight className="text-orange-600 mt-0.5 shrink-0" size={12} />
          <div><span className="font-bold">{s.title}</span>{s.estimateHours && <span className="text-gray-400 ml-1">({s.estimateHours}h)</span>}</div>
        </div>
      ))
      return <p className="text-xs text-gray-500">{JSON.stringify(data)}</p>
    }
    if (id === 'suggest-assignee') {
      const user = data.suggestedUser || data.suggestedEmail || data
      return <p className="text-sm font-bold text-gray-900 dark:text-white">{typeof user === 'string' ? user : user.name || user.email || JSON.stringify(user)}</p>
    }
    if (id === 'recommend-metadata') {
      return (
        <div className="flex gap-2 flex-wrap text-xs">
          {data.priority && <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold">{data.priority}</span>}
          {data.status && <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">{data.status}</span>}
          {data.suggestedDueDate && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold">{new Date(data.suggestedDueDate).toLocaleDateString()}</span>}
        </div>
      )
    }
    if (id === 'project-summary') {
      return (
        <div className="space-y-2 text-xs">
          {data.summary && <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{data.summary}</p>}
          {data.stats && <div className="flex gap-2 flex-wrap">{Object.entries(data.stats).map(([k, v]) => <span key={k} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">{k}: {v}</span>)}</div>}
        </div>
      )
    }
    if (id === 'search-tasks') {
      const tasks = data.tasks || data
      if (Array.isArray(tasks)) return tasks.map((t, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-gray-50 dark:bg-[#151515]">
          <FiChevronRight size={10} className="text-orange-600 shrink-0" />
          <span className="font-bold">{t.title}</span>
          {t.status && <span className="text-gray-400">· {t.status}</span>}
        </div>
      ))
      return <p className="text-xs text-gray-500">{JSON.stringify(data)}</p>
    }
    if (id === 'summarize') {
      return <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{data.summary || JSON.stringify(data)}</p>
    }
    if (id === 'criteria') {
      const criteria = data.criteria || data
      if (Array.isArray(criteria)) return criteria.map((c, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
          <FiCheckCircle className="text-green-600 mt-0.5 shrink-0" size={12} /> <span>{typeof c === 'string' ? c : c.description || c.title || JSON.stringify(c)}</span>
        </div>
      ))
      return <p className="text-xs text-gray-500">{JSON.stringify(data)}</p>
    }
    if (id === 'risks') {
      const risks = data.risks || data
      if (Array.isArray(risks)) return risks.map((r, i) => (
        <div key={i} className={`p-2 rounded-lg text-xs ${r.severity === 'high' || r.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
          <p className="font-bold">{r.severity?.toUpperCase()}: {r.description}</p>
          {r.suggestion && <p className="mt-0.5 opacity-80">→ {r.suggestion}</p>}
        </div>
      ))
      return <p className="text-xs text-gray-500">{JSON.stringify(data)}</p>
    }
    if (id === 'retro') {
      return (
        <div className="space-y-2 text-xs">
          {data.whatWentWell && <div><span className="font-bold text-green-600">Went well:</span> {Array.isArray(data.whatWentWell) ? data.whatWentWell.join(', ') : data.whatWentWell}</div>}
          {data.whatCouldImprove && <div><span className="font-bold text-amber-600">Improve:</span> {Array.isArray(data.whatCouldImprove) ? data.whatCouldImprove.join(', ') : data.whatCouldImprove}</div>}
          {data.actionItems && <div><span className="font-bold text-blue-600">Actions:</span> {Array.isArray(data.actionItems) ? data.actionItems.join(', ') : data.actionItems}</div>}
        </div>
      )
    }
    return <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
  }

  return (
    <div>
      <PageHeader icon={FiCpu} title="AI" highlight="Command" subtitle="Neural intelligence for mission operations" />

      <div className="max-w-4xl mx-auto space-y-6">
        {!projectId && (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-4">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Project ID (required for project-scoped features)</label>
            <input type="text" value={projectInput} onChange={(e) => setProjectInput(e.target.value)} placeholder="Paste a project ID" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition text-sm" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            const isActive = !loading[feature.id]
            const needsInput = feature.input !== null
            const needsProject = feature.needProject && !projectInput

            return (
              <motion.div key={feature.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-5 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white shadow-md shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{feature.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{feature.desc}</p>
                  </div>
                </div>

                {needsInput && (
                  <input type="text" value={inputValues[feature.id] || ''} onChange={(e) => setInputValues((prev) => ({ ...prev, [feature.id]: e.target.value }))}
                    placeholder={feature.inputPlaceholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white placeholder-gray-400 text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none transition mb-3" />
                )}

                <button onClick={() => handleRun(feature)} disabled={!isActive || (needsInput && !inputValues[feature.id]) || needsProject}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white text-xs font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-40 transition-all shadow-sm">
                  {loading[feature.id] ? <><FiLoader className="animate-spin" size={14} /> Processing...</> : <><FiZap size={14} /> Execute</>}
                </button>

                <AnimatePresence>
                  {results[feature.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#1a1a1a] relative">
                        <button onClick={() => handleCopy(results[feature.id])} className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all"><FiCopy size={12} /></button>
                        {renderResult(feature.id, results[feature.id])}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AIAssistant
