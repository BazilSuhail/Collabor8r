import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSave, FiSettings, FiTag, FiTarget, FiLink, FiX, FiPlus } from 'react-icons/fi'
import ProjectHeader from '../../../components/ui/ProjectHeader'
import api from '../../../utils/api'

const categories = ['software', 'marketing', 'design', 'research', 'business', 'other']
const methodologies = ['sprint', 'kanban']

const ProjectSettings = () => {
  const { projectId } = useParams()
  const [form, setForm] = useState({
    name: '', description: '', about: '', theme: 1,
    objectives: [], tags: [], category: 'other', methodology: 'sprint',
    startDate: '', targetDate: '', version: 'v1.0', links: [],
  })
  const [objectiveInput, setObjectiveInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [linkInput, setLinkInput] = useState({ title: '', url: '', kind: 'other' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data, error } = await api('GET', '/admin-projects/' + projectId)
      if (!error) {
        const p = data?.project || data
        if (p) {
          setForm({
            name: p.name || '',
            description: p.description || '',
            about: p.about || '',
            theme: p.theme || 1,
            objectives: p.objectives || [],
            tags: p.tags || [],
            category: p.category || 'other',
            methodology: p.methodology || 'sprint',
            startDate: p.startDate ? String(p.startDate).split('T')[0] : '',
            targetDate: p.targetDate ? String(p.targetDate).split('T')[0] : '',
            version: p.version || 'v1.0',
            links: p.links || [],
          })
        }
      }
      setLoading(false)
    }
    load()
  }, [projectId])

  const addObjective = () => {
    if (!objectiveInput.trim()) return
    setForm((p) => ({ ...p, objectives: [...p.objectives, objectiveInput.trim()] }))
    setObjectiveInput('')
  }

  const removeObjective = (i) => setForm((p) => ({ ...p, objectives: p.objectives.filter((_, idx) => idx !== i) }))

  const addTag = () => {
    if (!tagInput.trim()) return
    const tag = tagInput.toLowerCase().trim().replace(/\s+/g, '-')
    setForm((p) => ({ ...p, tags: p.tags.includes(tag) ? p.tags : [...p.tags, tag] }))
    setTagInput('')
  }

  const removeTag = (i) => setForm((p) => ({ ...p, tags: p.tags.filter((_, idx) => idx !== i) }))

  const addLink = () => {
    if (!linkInput.title.trim() || !linkInput.url.trim()) return
    setForm((p) => ({ ...p, links: [...p.links, { ...linkInput, url: linkInput.url.trim() }] }))
    setLinkInput({ title: '', url: '', kind: 'other' })
  }

  const removeLink = (i) => setForm((p) => ({ ...p, links: p.links.filter((_, idx) => idx !== i) }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    const body = {
      name: form.name,
      description: form.description,
      about: form.about,
      theme: form.theme,
      objectives: form.objectives,
      tags: form.tags,
      category: form.category,
      methodology: form.methodology,
      startDate: form.startDate || null,
      targetDate: form.targetDate || null,
      version: form.version,
      links: form.links,
    }
    const { error } = await api('PUT', `/projects/${projectId}/update`, body)
    if (error) {
      setError(error?.error || 'Failed to save project settings.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition"
  const labelCls = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4">
        <div className="max-w-3xl mx-auto animate-pulse space-y-6">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <ProjectHeader
          projectId={projectId}
          icon={FiSettings}
          title="Sector"
          highlight="Settings"
          subtitle="Reconfigure mission parameters, metadata and links"
          pageLabel="Settings"
        />

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold">{error}</div>
        )}
        {saved && (
          <div className="mb-4 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold">Settings saved successfully.</div>
        )}

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSave}
          className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-[#1a1a1a] p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Sector Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Version</label>
              <input type="text" value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Mission Brief</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>About</label>
            <textarea value={form.about} onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={`${inputCls} cursor-pointer`}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Methodology</label>
              <select value={form.methodology} onChange={(e) => setForm((p) => ({ ...p, methodology: e.target.value }))} className={`${inputCls} cursor-pointer`}>
                {methodologies.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Target Date</label>
              <input type="date" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Theme</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button key={n} type="button" onClick={() => setForm((p) => ({ ...p, theme: n }))}
                  className={`relative rounded-xl overflow-hidden border-4 transition-all ${form.theme === n ? 'border-orange-600' : 'border-transparent'}`}>
                  <img src={`/themes/${n}.jpg`} alt={`Theme ${n}`} className="w-full h-16 object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`${labelCls} flex items-center gap-1.5`}><FiTarget size={12} /> Objectives</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={objectiveInput} onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addObjective() } }}
                placeholder="Add an objective and press Enter" className={inputCls} />
              <button type="button" onClick={addObjective} className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"><FiPlus size={16} /></button>
            </div>
            {form.objectives.length > 0 && (
              <div className="space-y-1.5">
                {form.objectives.map((obj, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#151515]">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{obj}</span>
                    <button type="button" onClick={() => removeObjective(i)} className="text-gray-400 hover:text-red-500 transition-all"><FiX size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={`${labelCls} flex items-center gap-1.5`}><FiTag size={12} /> Tags</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add a tag and press Enter" className={inputCls} />
              <button type="button" onClick={addTag} className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"><FiPlus size={16} /></button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 text-xs font-bold">
                    #{tag}
                    <button type="button" onClick={() => removeTag(i)} className="hover:text-red-500 transition-all"><FiX size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={`${labelCls} flex items-center gap-1.5`}><FiLink size={12} /> Links</label>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-2 mb-2">
              <input type="text" value={linkInput.title} onChange={(e) => setLinkInput((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className={inputCls} />
              <input type="url" value={linkInput.url} onChange={(e) => setLinkInput((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." className={inputCls} />
              <select value={linkInput.kind} onChange={(e) => setLinkInput((p) => ({ ...p, kind: e.target.value }))} className={`${inputCls} cursor-pointer`}>
                {['docs', 'repo', 'wiki', 'figma', 'other'].map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <button type="button" onClick={addLink} className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"><FiPlus size={16} /></button>
            </div>
            {form.links.length > 0 && (
              <div className="space-y-1.5">
                {form.links.map((link, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#151515]">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{link.title} <span className="text-[10px] text-gray-400 uppercase">({link.kind})</span></p>
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-orange-600 hover:underline truncate block">{link.url}</a>
                    </div>
                    <button type="button" onClick={() => removeLink(i)} className="text-gray-400 hover:text-red-500 transition-all shrink-0 ml-2"><FiX size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md">
            <FiSave size={16} /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </motion.form>
      </div>
    </div>
  )
}

export default ProjectSettings
