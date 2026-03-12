import { motion } from 'framer-motion'
import {
  FiCheckSquare, FiBell, FiMessageSquare, FiCalendar,
  FiBarChart2, FiShield, FiArrowRight, FiUsers,
  FiGitBranch, FiZap, FiTarget,
} from 'react-icons/fi'

const features = [
  { icon: FiCheckSquare, label: 'Task Management', desc: 'Create, assign, and track tasks with priorities' },
  { icon: FiBell, label: 'Real-time Notifications', desc: 'Instant updates on invites and project changes' },
  { icon: FiMessageSquare, label: 'Team Collaboration', desc: 'Discussion boards and task-level comments' },
  { icon: FiCalendar, label: 'Project Timelines', desc: 'Gantt charts, milestones, and progress tracking' },
]

const floatingIcons = [
  { Icon: FiCheckSquare, x: '8%', y: '12%', delay: 0 },
  { Icon: FiUsers, x: '85%', y: '15%', delay: 0.3 },
  { Icon: FiGitBranch, x: '10%', y: '78%', delay: 0.6 },
  { Icon: FiZap, x: '90%', y: '72%', delay: 0.9 },
  { Icon: FiTarget, x: '5%', y: '48%', delay: 1.2 },
  { Icon: FiBarChart2, x: '93%', y: '45%', delay: 1.5 },
]

export default function AuthShowcase() {
  return (
    <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden bg-white p-8">
      {/* Decorative floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay }) => (
        <motion.div
          key={Icon.displayName || Icon.name}
          className="absolute z-10"
          style={{ left: x, top: y }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
        >
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#FF4D24] flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(255,77,36,0.3)]">
            <Icon className="w-5 h-5 text-[#FF4D24]" />
          </div>
        </motion.div>
      ))}

      <div className="relative z-10 w-full max-w-lg">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] p-8 mb-6 border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FF4D24] flex items-center justify-center mb-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <FiUsers className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-[#111111] tracking-tight mb-2">
            Project Management Suite
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Streamline team collaboration, manage tasks, track progress, and deliver projects on time — all in one place.
          </p>
        </motion.div>

        {/* Features bento grid — 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all group cursor-default"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
                i === 1 ? 'bg-[#FF4D24]' : 'bg-[#111111]'
              }`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-bold text-[#111111] mb-1">{f.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Bottom accent bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex items-center gap-3 text-xs font-semibold text-gray-500"
        >
          <div className="h-1.5 flex-1 rounded-full bg-[#FF4D24]" />
          <span>Built for modern teams</span>
          <div className="h-1.5 flex-1 rounded-full bg-[#FF4D24]" />
        </motion.div>
      </div>
    </div>
  )
}
