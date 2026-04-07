import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiSave, FiZap, FiTag, FiClock, FiUser, FiLayers, FiLink, FiCheckCircle, FiEdit3 } from 'react-icons/fi'
import { get, patch, post } from '../../utils/http'
import useAuthStore from '../../stores/authStore'
import CustomSelect from '../../components/ui/CustomSelect'

const STATUS_META = {
  'Not Started': { dot: '#71717a', text: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800' },
  'In Progress': { dot: '#f97316', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  'Paused': { dot: '#0ea5e9', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/10' },
  'Completed': { dot: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
}

const PRIORITY_META = {
  High: { dot: '#ef4444', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  Medium: { dot: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  Low: { dot: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
}

const statusOptions = Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: value, ...meta }))
const priorityOptions = Object.entries(PRIORITY_META).map(([value, meta]) => ({ value, label: value, ...meta }))

const Pill = ({ meta, label }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${meta.bg} ${meta.text}`}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
    {label}
  </span>
)

const BoxTrigger = ({ selected, placeholder }) => (
  <span className="flex items-center justify-between gap-2 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#000] text-sm font-medium text-zinc-700 dark:text-zinc-300">
    <span className="truncate">{selected?.label ?? placeholder}</span>
  </span>
)

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#000] text-zinc-900 dark:text-white placeholder-zinc-400 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-sm'

const emptyForm = {
  title: '',
  description: '',
  status: 'Not Started',
  priority: 'Medium',
  dueDate: '',
  estimateHours: '',
  assignedTo: '',
  sprintId: '',
  labels: [],
  parentId: '',
}

const SectionTitle = ({ icon: Icon, children }) => (
  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
    {Icon && <Icon size={13} className="text-zinc-400 dark:text-zinc-500" />}
    {children}
  </h3>
)

const TaskView = () => {
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const isEdit = Boolean(taskId)

  const [form, setForm] = useState(emptyForm)
  const [users, setUsers] = useState([])
  const [sprints, setSprints] = useState([])
  const [labels, setLabels] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isCreatorOrManager = role === 'creator' || role === 'manager'

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleLabel = (id) => {
    setForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(id) ? prev.labels.filter((l) => l !== id) : [...prev.labels, id],
    }))
  }

  useEffect(() => {
    const load = async () => {
      const [usersRes, sprintsRes, labelsRes, tasksRes, taskRes] = await Promise.allSettled([
        get('/manageusers/' + projectId + '/get-all-users'),
        get('/sprints/' + projectId),
        get('/labels/project/' + projectId),
        get('/manageTasks/project/' + projectId),
        taskId ? get('/project-tasks/' + taskId) : Promise.resolve({ status: 'fulfilled', value: { data: null } }),
      ])

      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || [])
      if (sprintsRes.status === 'fulfilled') setSprints(sprintsRes.value.data || [])
      if (labelsRes.status === 'fulfilled') setLabels(labelsRes.value.data || [])
      if (tasksRes.status === 'fulfilled') {
        const d = tasksRes.value.data
        setAllTasks(d.validTasks || d.tasks || d || [])
      }
      if (taskRes.status === 'fulfilled' && taskRes.value?.data) {
        const t = taskRes.value.data
        setForm({
          title: t.title || '',
          description: t.description || '',
          status: t.status || 'Not Started',
          priority: t.priority || 'Medium',
          dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
          estimateHours: t.estimateHours || '',
          assignedTo: t.assignedTo ? (t.assignedTo._id || t.assignedTo) : '',
          sprintId: t.sprintId || '',
          labels: (t.labels || []).map((l) => l._id || l),
          parentId: t.parentId || '',
        })
      }

      const { data } = await get('/admin-projects/' + projectId)
      if (!data.error) setRole('creator')
      else {
        const { data: mgrData } = await get('/joinedprojects/' + projectId)
        if (mgrData?.project?.manager === user?._id) setRole('manager')
      }

      setLoading(false)
    }
    load()
  }, [projectId, taskId, user?._id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Task title is required'); return }
    setSubmitting(true)
    setError('')

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate,
      estimateHours: Number(form.estimateHours) || 0,
      assignedTo: !isCreatorOrManager ? (form.assignedTo || user?._id) : form.assignedTo,
      sprintId: form.sprintId || undefined,
      labels: form.labels,
      parentId: form.parentId || undefined,
    }
    if (!body.assignedTo) body.assignedTo = user?._id

    const res = isEdit
      ? await patch('/manageTasks/' + taskId, body)
      : await post('/manageTasks/', { ...body, projectId })

    setSubmitting(false)
    if (res.error) {
      setError(res.error?.error || res.error?.errors?.[0] || 'Failed to save task')
      return
    }
    navigate(`/projects/${projectId}/manage`)
  }

  if (loading) {
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

  return (
    <div>
      <Link to={`/projects/${projectId}/manage`} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-orange-600 transition-colors">
        <FiArrowLeft size={14} /> Back to tasks
      </Link>

      <header className="mt-4 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              {isEdit ? <FiEdit3 size={20} /> : <FiZap size={20} />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                {isEdit ? 'Edit Task' : 'New Task'}
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight break-words">
                {isEdit ? 'Update Task Details' : 'Create a New Task'}
              </h1>
            </div>
          </div>
        </div>
        <div className="mt-5 h-px bg-gradient-to-r from-orange-500/40 via-zinc-200 dark:via-zinc-800 to-transparent" />
      </header>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <SectionTitle icon={FiLayers}>Task Details</SectionTitle>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Title *</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="What needs to be done?" required className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Add more details about this task..." className={inputClass + ' resize-none'} />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <SectionTitle icon={FiCheckCircle}>Status & Priority</SectionTitle>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Status</label>
                <CustomSelect
options={statusOptions}
                  value={form.status}
                  onChange={(val) => setForm((p) => ({ ...p, status: val }))}
                  openMode="click"
                  align="left"
                  matchTrigger
                  containerClassName="w-full"
                  triggerClassName="w-full"
                  renderTrigger={({ selected, toggle }) => {
                    const meta = STATUS_META[selected?.value || form.status]
                    return (
                      <button type="button" onClick={toggle} className="w-full">
                        <span className={`inline-flex items-center justify-start gap-1.5 w-full px-3 py-2.5 rounded-xl text-[11px] font-bold ${meta.bg} ${meta.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                          {selected?.label || form.status}
                        </span>
                      </button>
                    )
                  }}
                  renderOption={(opt, isActive, select) => (
                    <button key={opt.value} type="button" onClick={select}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors ${isActive ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                      <Pill meta={opt} label={opt.label} />
                    </button>
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Priority</label>
                <CustomSelect
options={priorityOptions}
                  value={form.priority}
                  onChange={(val) => setForm((p) => ({ ...p, priority: val }))}
                  openMode="click"
                  align="left"
                  matchTrigger
                  containerClassName="w-full"
                  triggerClassName="w-full"
                  renderTrigger={({ selected, toggle }) => {
                    const meta = PRIORITY_META[selected?.value || form.priority]
                    return (
                      <button type="button" onClick={toggle} className="w-full">
                        <span className={`inline-flex items-center justify-start gap-1.5 w-full px-3 py-2.5 rounded-xl text-[11px] font-bold ${meta.bg} ${meta.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                          {selected?.label || form.priority}
                        </span>
                      </button>
                    )
                  }}
                  renderOption={(opt, isActive, select) => (
                    <button key={opt.value} type="button" onClick={select}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors ${isActive ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                      <Pill meta={opt} label={opt.label} />
                    </button>
                  )}
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <SectionTitle icon={FiClock}>Schedule</SectionTitle>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Due Date</label>
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Estimated Hours</label>
                <input type="number" name="estimateHours" value={form.estimateHours} onChange={handleChange} placeholder="0" min="0" step="0.5" className={inputClass} />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <SectionTitle icon={FiUser}>Assignment</SectionTitle>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Assign To</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...users.map((u) => ({
                      value: u._id,
                      label: u.name,
                      email: u.email,
                      avatar: u.avatar || '1',
                    })),
                  ]}
                  value={form.assignedTo}
                  onChange={(val) => setForm((p) => ({ ...p, assignedTo: val }))}
                  openMode="click"
                  align="left"
                  matchTrigger
                  containerClassName="w-full"
                  triggerClassName="w-full"
                  renderTrigger={({ selected, toggle }) => (
                    <button type="button" onClick={toggle} className="w-full text-left">
                      <span className="flex items-center justify-between gap-2 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#000] text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        <span className="flex items-center gap-2 truncate">
                          {selected?.value ? (
                            <img src={`/avatars/${selected.avatar}.jpg`} alt={selected.label} className="w-5 h-5 rounded-md border border-zinc-200 dark:border-zinc-800" />
                          ) : (
                            <FiUser size={14} className="text-zinc-400" />
                          )}
                          <span className="truncate">{selected?.label ?? 'Unassigned'}</span>
                        </span>
                      </span>
                    </button>
                  )}
                  renderOption={(opt, isActive, select) => (
                    <button key={opt.value} type="button" onClick={select}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}>
                      {opt.value ? (
                        <img src={`/avatars/${opt.avatar}.jpg`} alt={opt.label} className="w-6 h-6 rounded-md border border-zinc-200 dark:border-zinc-800" />
                      ) : (
                        <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"><FiUser size={11} className="text-zinc-400" /></span>
                      )}
                      <span className="flex-1 truncate">{opt.label}</span>
                      {opt.email && <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">{opt.email}</span>}
                    </button>
                  )}
                />
                {!isCreatorOrManager && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">You can only assign tasks to yourself</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">Sprint</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'No Sprint' },
                    ...sprints.map((s) => ({ value: s._id, label: s.name })),
                  ]}
                  value={form.sprintId}
                  onChange={(val) => setForm((p) => ({ ...p, sprintId: val }))}
                  openMode="click"
                  align="left"
                  matchTrigger
                  containerClassName="w-full"
                  triggerClassName="w-full"
                  renderTrigger={({ selected, toggle }) => (
                    <button type="button" onClick={toggle} className="w-full text-left">
                      <BoxTrigger selected={selected} placeholder="No Sprint" />
                    </button>
                  )}
                  renderOption={(opt, isActive, select) => (
                    <button key={opt.value} type="button" onClick={select}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}>
                      <span className="flex-1 truncate">{opt.label}</span>
                    </button>
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider"><FiLink size={11} className="inline mr-1" /> Parent Task</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'No Parent' },
                    ...allTasks.filter((t) => t._id !== taskId && !t.parentId).map((t) => ({
                      value: t._id,
                      label: t.title?.length > 40 ? t.title.slice(0, 40) + '...' : t.title,
                    })),
                  ]}
                  value={form.parentId}
                  onChange={(val) => setForm((p) => ({ ...p, parentId: val }))}
                  openMode="click"
                  align="left"
                  searchable={allTasks.length > 6}
                  matchTrigger
                  containerClassName="w-full"
                  triggerClassName="w-full"
                  renderTrigger={({ selected, toggle }) => (
                    <button type="button" onClick={toggle} className="w-full text-left">
                      <BoxTrigger selected={selected} placeholder="No Parent" />
                    </button>
                  )}
                  renderOption={(opt, isActive, select) => (
                    <button key={opt.value} type="button" onClick={select}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}>
                      <span className="flex-1 truncate">{opt.label}</span>
                    </button>
                  )}
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6">
            <SectionTitle icon={FiTag}>Labels</SectionTitle>
            <div className="mt-4 flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl min-h-[46px] border border-zinc-100 dark:border-zinc-800">
              {labels.length === 0 && (
                <span className="text-xs text-zinc-400 px-2">No labels available</span>
              )}
              {labels.map((l) => {
                const checked = form.labels.includes(l._id)
                return (
                  <button key={l._id} type="button" onClick={() => toggleLabel(l._id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${checked ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800'}`}
                    style={checked ? { backgroundColor: l.color || '#ea580c' } : {}}
                  >
                    {l.name}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white dark:bg-[#0b0b0c] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 sticky top-24">
            <SectionTitle icon={FiSave}>Actions</SectionTitle>
            <div className="mt-4 space-y-2.5">
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 text-white text-sm font-bold hover:from-orange-500 hover:to-amber-400 disabled:opacity-50 transition-all shadow-md">
                {submitting ? <FiSave size={16} className="animate-spin" /> : <FiSave size={16} />}
                {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
              </button>
              <Link to={`/projects/${projectId}/manage`}
                className="w-full flex items-center justify-center py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                Cancel
              </Link>
            </div>

            <div className="mt-6 space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Status</span>
                <Pill meta={STATUS_META[form.status]} label={form.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Priority</span>
                <Pill meta={PRIORITY_META[form.priority]} label={form.priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Assignee</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                  {form.assignedTo ? (users.find((u) => u._id === form.assignedTo)?.name || 'Selected') : 'Unassigned'}
                </span>
              </div>
              {form.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Due date</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FiClock size={13} className="text-zinc-400" />
                    {new Date(form.dueDate + 'T00:00:00').toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </section>
        </aside>
      </form>
    </div>
  )
}

export default TaskView
