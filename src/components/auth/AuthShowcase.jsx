import { motion } from 'motion/react'
import {
  FiCheckSquare, FiBell, FiMessageSquare, FiCalendar,
  FiBarChart2, FiShield, FiUsers,
  FiGitBranch, FiZap, FiTarget, FiHexagon, FiDroplet,
  FiBox, FiCircle, FiCrosshair, FiStar,
} from 'react-icons/fi'

const floatingIcons = [
  { Icon: FiCheckSquare, x: '7%', y: '10%', delay: 0, size: 14 },
  { Icon: FiUsers, x: '86%', y: '13%', delay: 0.3, size: 12 },
  { Icon: FiGitBranch, x: '9%', y: '84%', delay: 0.6, size: 11 },
  { Icon: FiZap, x: '93%', y: '77%', delay: 0.9, size: 13 },
  { Icon: FiTarget, x: '3%', y: '46%', delay: 1.2, size: 10 },
  { Icon: FiBarChart2, x: '96%', y: '40%', delay: 1.5, size: 12 },
  { Icon: FiHexagon, x: '48%', y: '5%', delay: 0.5, size: 9 },
  { Icon: FiDroplet, x: '52%', y: '93%', delay: 0.8, size: 8 },
  { Icon: FiBox, x: '78%', y: '50%', delay: 1.1, size: 10 },
  { Icon: FiCrosshair, x: '22%', y: '60%', delay: 0.4, size: 9 },
  { Icon: FiStar, x: '65%', y: '30%', delay: 0.7, size: 8 },
  { Icon: FiBell, x: '35%', y: '80%', delay: 1.3, size: 7 },
  { Icon: FiCalendar, x: '70%', y: '65%', delay: 0.2, size: 9 },
]

const floatDot = (delay = 0) => ({
  y: [0, -14, 0],
  opacity: [0.15, 0.28, 0.15],
  transition: { duration: 5 + Math.random() * 3, repeat: Infinity, ease: 'easeInOut', delay },
})

const floatSlow = (delay = 0) => ({
  y: [0, -8, 0],
  rotate: [0, 5, 0],
  transition: { duration: 7 + delay, repeat: Infinity, ease: 'easeInOut', delay },
})

export default function AuthShowcase() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4F4F4] via-white to-[#FF4D24]/5" />

      {/* Grid dots pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.09]" viewBox="0 0 800 600" preserveAspectRatio="none">
        <defs>
          <pattern id="auth-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#111111" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      {/* Decorative floating dots */}
      {[
        { top: '10%', left: '20%', size: 8, color: '#FF4D24' },
        { top: '75%', left: '12%', size: 5, color: '#111111' },
        { top: '28%', left: '86%', size: 6, color: '#FF4D24' },
        { top: '82%', left: '82%', size: 4, color: '#111111' },
        { top: '48%', left: '4%', size: 7, color: '#FF4D24' },
        { top: '18%', left: '53%', size: 3, color: '#FFE500' },
        { top: '65%', left: '35%', size: 4, color: '#FF4D24' },
        { top: '40%', left: '70%', size: 5, color: '#111111' },
        { top: '55%', left: '88%', size: 6, color: '#FF4D24' },
        { top: '30%', left: '40%', size: 3, color: '#FF4D24' },
        { top: '8%', left: '60%', size: 4, color: '#111111' },
      ].map((dot, i) => (
        <motion.div
          key={i}
          animate={floatDot(i * 0.5)}
          className="absolute rounded-full"
          style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size, backgroundColor: dot.color }}
        />
      ))}

      {/* Animated drawing rings */}
      <motion.svg
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[15%] left-[25%] w-32 h-32 opacity-[0.18]"
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="40" stroke="#FF4D24" strokeWidth="1" fill="none" />
        <circle cx="50" cy="50" r="25" stroke="#111111" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
      </motion.svg>
      <motion.svg
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[20%] right-[30%] w-40 h-40 opacity-[0.15]"
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="45" stroke="#FF4D24" strokeWidth="0.8" fill="none" />
        <circle cx="50" cy="50" r="30" stroke="#111111" strokeWidth="0.5" fill="none" strokeDasharray="6 3" />
      </motion.svg>

      {/* Wireframe 3D cube */}
      <motion.div
        animate={{ y: [0, -6, 0], rotateX: [0, 10, 0], rotateY: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[55%] left-[8%] w-28 h-28 opacity-[0.2]"
        style={{ perspective: '200px' }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g stroke="#FF4D24" strokeWidth="1" fill="none" strokeLinejoin="round">
            <path d="M20 30 L50 15 L80 30 L50 45 Z" />
            <path d="M20 30 L20 65 L50 80 L50 45" />
            <path d="M50 45 L50 80 L80 65 L80 30" />
            <path d="M20 65 L50 80" />
          </g>
        </svg>
      </motion.div>

      {/* Wireframe hexagon */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[8%] right-[12%] w-24 h-24 opacity-[0.2]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50 5 90 27.5 90 72.5 50 95 10 72.5 10 27.5" stroke="#FF4D24" strokeWidth="1" fill="none" />
          <polygon points="50 20 75 32.5 75 57.5 50 70 25 57.5 25 32.5" stroke="#111111" strokeWidth="0.6" fill="none" strokeDasharray="3 3" />
        </svg>
      </motion.div>

      {/* Laptop opening/closing */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[18%] right-[10%] w-20 h-20 opacity-[0.25]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="10" y="65" width="80" height="10" rx="2" fill="none" stroke="#111111" strokeWidth="1" />
          <rect x="8" y="72" width="84" height="4" rx="1.5" fill="none" stroke="#111111" strokeWidth="0.6" />
          <motion.g
            style={{ transformOrigin: '50px 65px' }}
            animate={{ rotate: [0, -55, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="20" y="10" width="60" height="55" rx="2" fill="none" stroke="#FF4D24" strokeWidth="1" />
            <rect x="25" y="15" width="50" height="38" rx="1" fill="none" stroke="#FF4D24" strokeWidth="0.5" strokeDasharray="2 3" />
            <line x1="28" y1="20" x2="50" y2="20" stroke="#FF4D24" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="28" y1="25" x2="45" y2="25" stroke="#FF4D24" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="28" y1="30" x2="55" y2="30" stroke="#FF4D24" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="28" y1="35" x2="40" y2="35" stroke="#FF4D24" strokeWidth="0.5" strokeDasharray="2 2" />
          </motion.g>
        </svg>
      </motion.div>

      {/* Rotating wireframe gear */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[18%] left-[8%] w-14 h-14 opacity-[0.2]"
      >
        <motion.svg
          viewBox="0 0 100 100" className="w-full h-full"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
          <g stroke="#FF4D24" strokeWidth="1.5" fill="none">
            <circle cx="50" cy="50" r="38" strokeDasharray="6 4" />
            <circle cx="50" cy="50" r="22" strokeWidth="0.8" strokeDasharray="3 5" />
            <circle cx="50" cy="50" r="4" fill="#FF4D24" fillOpacity="0.3" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1={50 + 38 * Math.cos((angle * Math.PI) / 180)}
                y1={50 + 38 * Math.sin((angle * Math.PI) / 180)}
                x2={50 + 48 * Math.cos((angle * Math.PI) / 180)}
                y2={50 + 48 * Math.sin((angle * Math.PI) / 180)}
              />
            ))}
            {[0, 90, 180, 270].map((angle) => (
              <line
                key={`spoke-${angle}`}
                x1={50 + 22 * Math.cos((angle * Math.PI) / 180)}
                y1={50 + 22 * Math.sin((angle * Math.PI) / 180)}
                x2={50 + 38 * Math.cos((angle * Math.PI) / 180)}
                y2={50 + 38 * Math.sin((angle * Math.PI) / 180)}
                strokeWidth="0.6"
                stroke="#111111"
              />
            ))}
          </g>
        </motion.svg>
      </motion.div>

      {/* Person with laptop SVG */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[5%] left-[4%] w-24 h-24 opacity-[0.2] pointer-events-none select-none"
      >
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <g stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="42" cy="22" r="8" fill="white" />
            <path d="M34 20 Q36 12 42 10 Q48 12 50 20" />
            <circle cx="39" cy="21" r="1" fill="#111111" />
            <circle cx="45" cy="21" r="1" fill="#111111" />
            <path d="M39 25 Q42 28 45 25" stroke="#FF4D24" strokeWidth="0.8" />
            <path d="M34 30 L30 55 L54 55 L50 30 Z" fill="#F4F4F4" />
            <path d="M34 35 L22 50" />
            <path d="M50 35 L60 50" />
          </g>
          <g>
            <motion.g
              style={{ transformOrigin: '80px 60px' }}
              animate={{ rotate: [0, -40, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <rect x="65" y="38" width="30" height="20" rx="2" fill="white" stroke="#111111" strokeWidth="1.2" />
              <rect x="67" y="40" width="26" height="14" rx="1" fill="#FF4D24" fillOpacity="0.06" />
              <line x1="70" y1="43" x2="82" y2="43" stroke="#FF4D24" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="70" y1="47" x2="88" y2="47" stroke="#111111" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.3" />
              <line x1="70" y1="51" x2="78" y2="51" stroke="#FF4D24" strokeWidth="1" strokeLinecap="round" />
            </motion.g>
            <path d="M62 58 L65 38 L95 38 L98 58 Z" fill="#F4F4F4" stroke="#111111" strokeWidth="1.2" />
          </g>
          <motion.text
            x="102" y="35"
            fontSize="8" fontWeight="bold" fill="#FF4D24" fontFamily="monospace"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            opacity="0.5"
          >{`</>`}</motion.text>
        </svg>
      </motion.div>

      {/* Pulsing diamond shapes */}
      {[
        { top: '12%', left: '42%', size: 10, delay: 0 },
        { top: '70%', left: '60%', size: 7, delay: 0.6 },
        { top: '50%', left: '50%', size: 5, delay: 1.2 },
      ].map((d, i) => (
        <motion.div
          key={`diamond-${i}`}
          animate={{ scale: [1, 1.15, 1], rotate: [0, 10, 0], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4 + d.delay, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute"
          style={{ top: d.top, left: d.left }}
        >
          <svg width={d.size} height={d.size} viewBox="0 0 24 24" fill="none" stroke="#FF4D24" strokeWidth="1.5">
            <path d="M12 2l3 5 5 3-5 3-3 5-3-5-5-3 5-3z" />
          </svg>
        </motion.div>
      ))}

      {/* Animated drawing paths */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          d="M200 100 Q400 300 300 500 T500 700"
          stroke="#FF4D24" strokeWidth="1.5" fill="none"
        />
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          d="M1100 150 Q900 350 1000 550 T800 800"
          stroke="#111111" strokeWidth="1" fill="none" strokeDasharray="4 6"
        />
      </svg>

      {/* Cross/plus decorations */}
      {[
        { top: '22%', left: '70%', size: 12, delay: 0.2 },
        { top: '68%', left: '55%', size: 8, delay: 0.8 },
        { top: '45%', left: '15%', size: 10, delay: 1.4 },
      ].map((c, i) => (
        <motion.div
          key={i}
          animate={{ rotate: [0, 45, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 5 + c.delay, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute opacity-[0.18]"
          style={{ top: c.top, left: c.left }}
        >
          <svg width={c.size} height={c.size} viewBox="0 0 24 24" fill="none" stroke="#FF4D24" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </motion.div>
      ))}

      {/* Floating icon badges */}
      {floatingIcons.map(({ Icon, x, y, delay, size }) => (
        <motion.div
          key={Icon.displayName || Icon.name}
          className="absolute"
          style={{ left: x, top: y }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
        >
          <div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/60 flex items-center justify-center shadow-sm" style={{ width: size * 4, height: size * 4 }}>
            <Icon className="text-[#FF4D24]" style={{ width: Math.max(size * 4 - 24, 14), height: Math.max(size * 4 - 24, 14) }} />
          </div>
        </motion.div>
      ))}

      {/* Large abstract decorative shapes */}
      <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#FF4D24]/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[35rem] h-[35rem] rounded-full bg-[#FF4D24]/5 blur-3xl" />
      <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-[#111111]/[0.02] blur-2xl" />

      {/* Small decorative circles */}
      <motion.div
        animate={floatSlow(0.3)}
        className="absolute top-[35%] right-[18%] w-16 h-16 rounded-full border border-[#FF4D24]/20"
      />
      <motion.div
        animate={floatSlow(1.2)}
        className="absolute bottom-[30%] left-[25%] w-12 h-12 rounded-full border-2 border-[#111111]/10"
      />

      {/* Diagonal accent lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.09]" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <line x1="0" y1="200" x2="1440" y2="500" stroke="#FF4D24" strokeWidth="2" />
        <line x1="0" y1="500" x2="1440" y2="800" stroke="#111111" strokeWidth="1.2" />
        <line x1="300" y1="0" x2="600" y2="900" stroke="#FF4D24" strokeWidth="1.2" strokeDasharray="4 8" />
        <line x1="1000" y1="0" x2="800" y2="900" stroke="#111111" strokeWidth="0.8" strokeDasharray="2 6" />
      </svg>

      {/* Radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#FF4D24]/[0.04] to-transparent blur-[120px]" />
    </div>
  )
}
