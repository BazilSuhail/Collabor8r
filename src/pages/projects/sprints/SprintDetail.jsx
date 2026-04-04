import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { FiCalendar, FiPlay, FiCheckCircle, FiTrash2, FiEdit2, FiSave, FiX, FiPlus, FiTrendingUp, FiZap } from 'react-icons/fi'
import ProjectHeader from '../../../components/ui/ProjectHeader'
import api from '../../../utils/api'

const SprintDetail = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', goal: '', startDate: '', endDate: '' })
  const [showAddTasks, setShowAddTasks] = useState(null)
  const [tasks, setTasks] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', goal: '', startDate: '', endDate: '' })
  const [retro, setRetro] = useState(null)
  const [retroLoading, setRetroLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [sprintsRes, tasksRes] = await Promise.allSettled([
        api('GET', '/sprints/' + projectId),
        api('GET', '/manageTasks/project/' + projectId),
      ])
      if (sprintsRes.status === 'fulfilled') setSprints(sprintsRes.value.data || [])
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.validTasks || tasksRes.value.data.tasks || tasksRes.value.data || [])
      setLoading(false)
    }
    load()
  }, [projectId])

  const handleActivate = async (id) => {
    const { data } = await api('POST', '/sprints/sprint/' + id + '/activate')
    setSprints((prev) => prev.map((s) => (s._id === id ? data : s)))
  }

  const handleComplete = async (id) => {
    const { data } = await api('POST', '/sprints/sprint/' + id + '/complete')
    setSprints((prev) => prev.map((s) => (s._id === id ? data : s)))
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this sprint?')) return
    await api('DELETE', '/sprints/sprint/' + id)
    setSprints((prev) => prev.filter((s) => s._id !== id))
  }

  const handleCreateSprint = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) return
    const { data } = await api('POST', '/sprints/' + projectId, createForm)
    setSprints((prev) => [data, ...prev])
    setCreateForm({ name: '', goal: '', startDate: '', endDate: '' })
    setShowCreateForm(false)
  }

  const handleAiCreate = async (e) => {
    e.preventDefault()
    if (!aiPrompt.trim() || aiLoading) return
    setAiLoading(true)
    try {
      const { data, error } = await api('POST', '/ai/create-sprint', { prompt: aiPrompt, projectId })
      if (error) {
        alert(error)
        return
      }
      setSprints((prev) => [data.sprint, ...prev])
      setAiPrompt('')
    } catch (err) {
      console.error(err)
      alert('AI sprint creation failed. Check your API key or try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleRetrospective = async (id) => {
    setRetroLoading(true)
    setRetro(null)
    const { data, error } = await api('GET', '/sprints/sprint/' + id + '/retrospective')
    setRetroLoading(false)
    if (error) return
    setRetro(data)
  }

  const startEdit = (sprint) => {
    setEditingId(sprint._id)
    setEditForm({
      name: sprint.name || '',
      goal: sprint.goal || '',
      startDate: sprint.startDate ? sprint.startDate.split('T')[0] : '',
      endDate: sprint.endDate ? sprint.endDate.split('T')[0] : '',
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    const { data } = await api('PUT', '/sprints/sprint/' + editingId, editForm)
    setSprints((prev) => prev.map((s) => (s._id === editingId ? data : s)))
    setEditingId(null)
  }

  const openAddTasks = (sprintId) => {
    setShowAddTasks(sprintId)
    setSelectedTasks([])
  }

  const toggleTaskSelect = (taskId) => {
    setSelectedTasks((prev) => prev.includes(taskId) ? prev.filter((t) => t !== taskId) : [...prev, taskId])
  }

  const addTasksToSprint = async () => {
    if (!selectedTasks.length) return
    await api('POST', '/sprints/sprint/' + showAddTasks + '/add-tasks', { taskIds: selectedTasks })
    setShowAddTasks(null)
    setSelectedTasks([])
  }

  const removeTaskFromSprint = async (sprintId, taskId) => {
    await api('POST', '/sprints/sprint/' + sprintId + '/remove-tasks', { taskIds: [taskId] })
  }

  const sprintTasks = (sprintId) => tasks.filter((t) => t.sprintId === sprintId)
  const availableTasks = tasks.filter((t) => !t.sprintId)

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto">
        <ProjectHeader
          projectId={projectId}
          icon={FiCalendar}
          title="Sprint"
          highlight="Management"
          subtitle="All iterations"
          pageLabel="Sprints"
          action={
            <button onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold shadow-md hover:from-orange-500 hover:to-orange-600 transition-all">
              <FiPlus size={18} /> New Sprint
            </button>
          }
        />

      {showCreateForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateSprint}
          className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 mb-6 flex items-end gap-4 flex-wrap"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Name</label>
            <input type="text" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} placeholder="Sprint 1" required
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Goal</label>
            <input type="text" value={createForm.goal} onChange={(e) => setCreateForm((p) => ({ ...p, goal: e.target.value }))} placeholder="Sprint goal"
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Start</label>
            <input type="date" value={createForm.startDate} onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">End</label>
            <input type="date" value={createForm.endDate} onChange={(e) => setCreateForm((p) => ({ ...p, endDate: e.target.value }))}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <button type="submit" className="px-6 py-2.5 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 transition-all shadow-md">Create Sprint</button>
        </motion.form>
      )}

      <motion.form onSubmit={handleAiCreate}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-orange-50 dark:from-purple-950/20 dark:to-orange-950/10 border border-purple-200/60 dark:border-purple-500/20 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="flex items-center gap-2 sm:w-56 shrink-0">
          <FiZap className="text-purple-600 dark:text-purple-400" size={18} />
          <div>
            <p className="text-sm font-bold text-purple-900 dark:text-purple-200">AI Sprint Builder</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Describe a sprint in plain language</p>
          </div>
        </div>
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder='e.g. "2 week sprint on payment fixes, starts next Monday, goal is reducing checkout failures"'
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-purple-500 outline-none transition text-sm"
        />
        <button type="submit" disabled={!aiPrompt.trim() || aiLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white font-bold hover:from-purple-500 hover:to-purple-600 disabled:opacity-40 transition-all shadow-md shrink-0">
          {aiLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiZap size={16} />}
          {aiLoading ? 'Creating...' : 'Create with AI'}
        </button>
      </motion.form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 dark:bg-[#151515] rounded-xl animate-pulse" />)}
        </div>
      ) : sprints.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a]">
          <FiCalendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Sprints</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Create one from the backlog page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <motion.div key={sprint._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 hover:border-orange-500/30 transition-all"
            >
              {editingId === sprint._id ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none transition" required />
                    <input type="text" value={editForm.goal} onChange={(e) => setEditForm((p) => ({ ...p, goal: e.target.value }))} placeholder="Sprint goal"
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition" />
                    <input type="date" value={editForm.startDate} onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition" />
                    <input type="date" value={editForm.endDate} onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#151515] text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex items-center gap-1 px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-all"><FiSave size={14} /> Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] text-gray-500 text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#151515] transition-all"><FiX size={14} /> Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white shadow-md">
                        <FiCalendar size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{sprint.name}</h3>
                        {sprint.goal && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{sprint.goal}</p>}
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                          {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '—'} — {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                        sprint.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        sprint.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>{sprint.status || 'planned'}</span>
                      <button onClick={() => startEdit(sprint)} className="p-2.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all" title="Edit"><FiEdit2 size={16} /></button>
                      <button onClick={() => openAddTasks(sprint._id)} className="p-2.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Add tasks"><FiPlus size={16} /></button>
                      <button onClick={() => handleRetrospective(sprint._id)} className="p-2.5 rounded-lg text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all" title="Sprint retrospective"><FiTrendingUp size={16} /></button>
                      {sprint.status === 'planned' && (
                        <button onClick={() => handleActivate(sprint._id)} className="p-2.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all" title="Start sprint"><FiPlay size={16} /></button>
                      )}
                      {sprint.status === 'active' && (
                        <button onClick={() => handleComplete(sprint._id)} className="p-2.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Complete sprint"><FiCheckCircle size={16} /></button>
                      )}
                      {sprint.status !== 'active' && (
                        <button onClick={() => handleDelete(sprint._id)} className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Delete"><FiTrash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                  {sprintTasks(sprint._id).length > 0 && (
                    <div className="mt-3 ml-16">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">{sprintTasks(sprint._id).length} tasks</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sprintTasks(sprint._id).map((t) => (
                          <span key={t._id}
                            onClick={() => navigate('/tasks/' + t._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#151515] text-xs text-gray-700 dark:text-gray-300 font-medium cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all"
                          >
                            {t.title?.length > 25 ? t.title.slice(0, 25) + '...' : t.title}
                            <button onClick={(e) => { e.stopPropagation(); removeTaskFromSprint(sprint._id, t._id) }} className="text-gray-400 hover:text-red-500"><FiX size={10} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {showAddTasks === sprint._id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-[#1a1a1a]">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Add Tasks to Sprint</h4>
                  {availableTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">No unassigned tasks available.</p>
                  ) : (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto mb-3">
                      {availableTasks.map((t) => (
                        <label key={t._id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all">
                          <input type="checkbox" checked={selectedTasks.includes(t._id)} onChange={() => toggleTaskSelect(t._id)} className="accent-orange-600" />
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{t.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ml-auto ${
                            t.priority === 'High' ? 'bg-red-100 text-red-700' : t.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                          }`}>{t.priority}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={addTasksToSprint} disabled={!selectedTasks.length}
                      className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-50 transition-all">Add Selected ({selectedTasks.length})</button>
                    <button onClick={() => setShowAddTasks(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#1a1a1a] text-gray-500 text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#151515] transition-all">Close</button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(retro || retroLoading) && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-lg relative p-8 max-h-[95vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setRetro(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-orange-600 transition-colors rounded-xl dark:hover:bg-[#151515]"><FiX className="text-2xl" /></button>

              <header className="mb-4">
                <h3 className="text-2xl font-bold dark:text-white tracking-tight flex items-center gap-2"><FiTrendingUp className="text-orange-600" /> Sprint Retrospective</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-generated insights from sprint task data.</p>
              </header>
              <div className="h-[1px] bg-gray-100 dark:bg-[#1a1a1a] w-full mb-6" />

              {retroLoading ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 font-medium">Generating retrospective...</p>
                </div>
              ) : retro && (
                <>
                  {retro.stats && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="rounded-xl bg-gray-50 dark:bg-[#151515] p-4 text-center">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{retro.stats.totalTasks}</p>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mt-1">Total</p>
                      </div>
                      <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4 text-center">
                        <p className="text-2xl font-black text-green-600 dark:text-green-400">{retro.stats.completed}</p>
                        <p className="text-[10px] uppercase tracking-wider text-green-500 font-bold mt-1">Done</p>
                      </div>
                      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-center">
                        <p className="text-2xl font-black text-red-600 dark:text-red-400">{retro.stats.incomplete}</p>
                        <p className="text-[10px] uppercase tracking-wider text-red-500 font-bold mt-1">Open</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-5">
                    {retro.whatWentWell?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-2">What Went Well</h4>
                        <ul className="space-y-1.5">
                          {retro.whatWentWell.map((item, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {retro.whatCouldImprove?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">What Could Improve</h4>
                        <ul className="space-y-1.5">
                          {retro.whatCouldImprove.map((item, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {retro.actionItems?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-2">Action Items</h4>
                        <ul className="space-y-1.5">
                          {retro.actionItems.map((item, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-start gap-2"><span className="text-orange-500 mt-0.5">•</span>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

export default SprintDetail
