import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FiChevronDown, FiSearch, FiCheck } from 'react-icons/fi'

const ANIMATIONS = {
  fade: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } },
  scale: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } },
  slide: { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } },
}

const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  icon: TriggerIcon = FiChevronDown,
  triggerClassName = '',
  containerClassName = '',
  menuClassName = '',
  optionClassName = '',
  align = 'left',
  openMode = 'hover',
  searchable = false,
  animation = 'fade',
  closeOnSelect = true,
  emptyText = 'No options available',
  searchPlaceholder = 'Search...',
  matchTrigger = false,
  renderTrigger,
  renderOption,
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const leaveTimer = useRef(null)

  const selected = options.find((o) => o.value === value)

  const filtered = searchable
    ? options.filter((o) =>
        (o.label || o.value || '').toString().toLowerCase().includes(query.toLowerCase())
      )
    : options

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const openHover = () => {
    if (openMode !== 'hover') return
    clearTimeout(leaveTimer.current)
    setOpen(true)
  }

  const closeHover = () => {
    if (openMode !== 'hover') return
    clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(close, 150)
  }

  useEffect(() => {
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) close()
    }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => () => clearTimeout(leaveTimer.current), [])

  const select = (opt) => {
    onChange?.(opt.value, opt)
    if (closeOnSelect) close()
  }

  const toggle = () => setOpen((o) => !o)

  const alignClass = align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'

  return (
    <div
      ref={containerRef}
      onMouseEnter={openHover}
      onMouseLeave={closeHover}
      className={`relative ${containerClassName}`}
    >
      {renderTrigger ? (
        renderTrigger({ open, selected, value, close, select, toggle })
      ) : (
        <button
          type="button"
          onClick={openMode === 'click' ? () => setOpen((o) => !o) : undefined}
          className={`flex items-center justify-between gap-2 w-full cursor-pointer ${triggerClassName}`}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <TriggerIcon className={`transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} size={14} />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            {...ANIMATIONS[animation] || ANIMATIONS.fade}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full mt-2 z-50 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0b0b0c] shadow-xl shadow-black/5 overflow-hidden ${matchTrigger ? 'w-full' : 'min-w-[180px]'} ${alignClass} ${menuClassName}`}
          >
            {searchable && (
              <div className="relative px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <FiSearch size={13} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-xs font-medium placeholder-zinc-400 focus:ring-2 focus:ring-orange-500 outline-none transition"
                />
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-xs text-zinc-400 text-center">{emptyText}</p>
              ) : (
                filtered.map((opt) => {
                  const isActive = opt.value === value
                  if (renderOption) return renderOption(opt, isActive, () => select(opt), close)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => select(opt)}
                      className={`flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      } ${optionClassName} ${opt.className || ''}`}
                    >
                      {opt.dot && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} />}
                      {opt.icon}
                      <span className="flex-1 truncate font-medium">{opt.label}</span>
                      {isActive && <FiCheck size={14} className="shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomSelect
