import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheck, FiLayers, FiUsers, FiZap, FiBarChart2, FiShield, FiClock } from 'react-icons/fi'

const floatingIcons = [
  { Icon: FiLayers, x: 10, y: 20, delay: 0, size: 20 },
  { Icon: FiUsers, x: 85, y: 15, delay: 0.5, size: 22 },
  { Icon: FiZap, x: 90, y: 70, delay: 1, size: 18 },
  { Icon: FiBarChart2, x: 8, y: 75, delay: 0.3, size: 20 },
  { Icon: FiShield, x: 15, y: 50, delay: 0.8, size: 16 },
  { Icon: FiClock, x: 82, y: 45, delay: 1.2, size: 18 },
]

const stats = [
  { label: 'Active Users', value: '10K+' },
  { label: 'Projects Shipped', value: '50K+' },
  { label: 'Tasks Completed', value: '1M+' },
]

const perks = [
  { icon: FiCheck, text: 'No credit card required' },
  { icon: FiCheck, text: 'Free forever plan' },
  { icon: FiCheck, text: 'Unlimited team members' },
]

export default function HeroSection() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const bgOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])
  const y = useTransform(scrollYProgress, [0, 1], [0, 100])

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fafaf9]">
      <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.07] via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/[0.03] rounded-full blur-3xl" />
      </motion.div>

      {floatingIcons.map(({ Icon, x, y: yPos, delay, size }) => (
        <motion.div
          key={Icon}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className="absolute hidden lg:block text-primary/20"
          style={{ left: `${x}%`, top: `${yPos}%` }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
          >
            <Icon size={size} />
          </motion.div>
        </motion.div>
      ))}

      <motion.div style={{ y }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 border border-primary/20"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Real-time collaboration platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight"
          >
            Manage Projects{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-500">
              Together
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Plan, track, and ship projects with your team in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link to="/register" className="group px-8 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all inline-flex items-center gap-2 shadow-lg">
              Get Started Free
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="px-8 py-3.5 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 hover:text-gray-900 transition-all">
              Sign In
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
          >
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={14} className="text-primary" />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-24 grid grid-cols-3 gap-12 max-w-2xl mx-auto"
        >
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-black text-gray-900">{value}</div>
              <div className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
