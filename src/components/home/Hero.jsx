import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const wordReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.3 + i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const floatDot = (delay = 0) => ({
  y: [0, -12, 0],
  opacity: [0.15, 0.4, 0.15],
  transition: { duration: 4 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay },
});

export default function Hero() {
  const ref = useRef(null);

  return (
    <section ref={ref} className="w-full max-w-340 mx-auto px-4 sm:px-6 py-6 md:py-10 mt-15 sm:mt-5 min-h-screen flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* ── Main card (left 2 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          whileHover={{ scale: 1.005 }}
          className="lg:col-span-2 bg-[#F4F4F4] rounded-[2rem] p-6 sm:p-8 md:p-12 flex flex-col justify-between relative overflow-hidden min-h-[350px] md:min-h-[450px] lg:min-h-[550px] group"
        >
          {/* Decorative floating dots */}
          {[
            { top: '15%', left: '60%', size: 6, color: '#FF4D24' },
            { top: '70%', left: '10%', size: 4, color: '#111111' },
            { top: '40%', left: '80%', size: 5, color: '#FFE500' },
          ].map((dot, i) => (
            <motion.div
              key={i}
              animate={floatDot(i * 0.8)}
              className="absolute rounded-full pointer-events-none z-0"
              style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size, backgroundColor: dot.color }}
            />
          ))}

          {/* Background grid dots */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-[0.03]" viewBox="0 0 800 600">
            <defs>
              <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#111111" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="self-start relative z-10"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-[#FF4D24] text-[#FF4D24] rounded-full text-xs font-semibold bg-white/50 backdrop-blur-sm">
              Next group starts in 3 days!
              <motion.span
                animate={{ rotate: [0, 45, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-[#FF4D24] text-white rounded-full p-1 text-[10px] inline-flex"
              >
                <FiArrowRight />
              </motion.span>
            </span>
          </motion.div>

          <motion.div className="relative z-10 max-w-lg">
            <h1 className="text-3xl mb-20 sm:mb-0 sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.1]">
              {'Take control of your projects online'.split(' ').map((w, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={wordReveal}
                  initial="hidden"
                  animate="visible"
                  className="inline-block mr-[0.3em]"
                >
                  {w}
                </motion.span>
              ))}
            </h1>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(255,77,36,0.35)' }}
                whileTap={{ scale: 0.96 }}
                className="mt-8 px-8 py-4 bg-[#111111] text-white rounded-full font-medium hover:bg-black transition-colors duration-200 relative overflow-hidden"
              >
                Get started
              </motion.button>
            </Link>
          </motion.div>

          {/* Floating SVG illustration */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-10 sm:bottom-30 right-0 w-[60%] md:w-[60%] lg:w-[65%] h-auto max-h-[320px] pointer-events-none select-none block"
          >
            <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
              <g stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: 'easeInOut' }}
                  d="M120 270 L200 370 L420 280 L340 180 Z" fill="#FFFFFF"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: 'easeInOut' }}
                  d="M120 270 L120 290 L200 390 L420 300 L420 280"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.9, ease: 'easeInOut' }}
                  d="M200 370 L200 390"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.7, ease: 'easeInOut' }}
                  d="M140 280 L230 350" stroke="#FF4D24" strokeWidth="6"
                />
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 1.1 }}
                  x="180" y="270" width="100" height="60" rx="6" transform="rotate(30 180 270)" fill="#111111"
                />
                <motion.rect
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 1.3, ease: 'backOut' }}
                  x="235" y="295" width="12" height="10" rx="1" fill="#F4B41A" transform="rotate(30 235 295)"
                />
                <motion.rect
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 1.2 }}
                  x="130" y="240" width="30" height="30" rx="4" fill="#FFFFFF" transform="skewX(-10)"
                />
                <motion.rect
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 1.25 }}
                  x="170" y="230" width="30" height="30" rx="4" fill="#FFFFFF" transform="skewX(-10)"
                />
                <motion.rect
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 1.3 }}
                  x="210" y="220" width="30" height="30" rx="4" fill="#FFFFFF" transform="skewX(-10)"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.8, ease: 'easeInOut' }}
                  d="M450 160 C380 160, 310 190, 290 210 C270 230, 250 250, 230 255"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.1, ease: 'easeInOut' }}
                  d="M230 255 C220 257, 215 250, 225 245 C240 230, 275 210, 285 200"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 1.2, ease: 'easeInOut' }}
                  d="M285 200 C300 185, 330 190, 315 215"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 1.25, ease: 'easeInOut' }}
                  d="M315 215 C335 195, 355 200, 340 230"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 1.3, ease: 'easeInOut' }}
                  d="M340 230 C365 210, 385 215, 365 250"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 1.35, ease: 'easeInOut' }}
                  d="M365 250 C390 235, 410 245, 385 285"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.4, ease: 'easeInOut' }}
                  d="M450 160 Q480 200 450 300"
                />
              </g>
            </svg>
          </motion.div>
        </motion.div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-6">

          {/* ── Orange chart card ── */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotate: 1 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            className="bg-[#FF4D24] text-white rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between min-h-[250px] md:h-[300px] relative overflow-hidden group"
          >
            {/* Animated background radial pulse */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white pointer-events-none"
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="z-10 relative"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight max-w-[200px]">
                Track your progress live
              </h2>
            </motion.div>

            <div className="absolute inset-0 pt-24 px-6 pb-6 flex flex-col justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3, ease: 'backOut' }}
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                className="absolute top-24 right-8 bg-[#FFE500] text-black text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm"
              >
                +46%
              </motion.div>

              <svg className="w-full h-full" viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Animated vertical grid lines */}
                {[
                  { x: 80, delay: 0.5 },
                  { x: 180, delay: 0.55 },
                  { x: 270, delay: 0.6 },
                ].map((line) => (
                  <motion.line
                    key={line.x}
                    initial={{ scaleY: 0, y: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: line.delay, ease: 'easeOut' }}
                    style={{ transformOrigin: 'bottom' }}
                    x1={line.x} y1="120" x2={line.x} y2="0"
                    stroke="white" strokeOpacity="0.4" strokeWidth="1.5"
                  />
                ))}

                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: 'easeInOut' }}
                  d="M10 80 L80 40 L180 50 L270 15"
                  stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                />
                <motion.path
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                  d="M10 80 L80 40 L180 50 L270 15 L270 120 L10 120 Z"
                  fill="url(#orangeGrad)" opacity="0.15"
                />
                <motion.circle
                  initial={{ r: 0 }}
                  animate={{ r: 4 }}
                  transition={{ duration: 0.3, delay: 1 }}
                  cx="80" cy="40" fill="white"
                />
                <motion.circle
                  initial={{ r: 0 }}
                  animate={{ r: 4 }}
                  transition={{ duration: 0.3, delay: 1.1 }}
                  cx="180" cy="50" fill="white"
                />
                <motion.circle
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: 7, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.2, ease: 'backOut' }}
                  cx="270" cy="15" fill="white"
                />
                <motion.circle
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: 3, opacity: 1 }}
                  transition={{ duration: 0.2, delay: 1.4 }}
                  cx="270" cy="15" fill="#FF4D24"
                />
                <defs>
                  <linearGradient id="orangeGrad" x1="140" y1="15" x2="140" y2="120" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* ── Dark team card ── */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotate: 1 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            className="bg-[#0B0B0B] text-white rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between min-h-[200px] md:h-[230px] relative overflow-hidden group"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative z-10"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
                Join a <br />team session
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="relative z-10 flex items-center gap-3"
            >
              <div className="flex -space-x-3 overflow-hidden">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
                ].map((src, i) => (
                  <motion.img
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                    className="inline-block h-11 w-11 rounded-full ring-2 ring-[#0B0B0B] object-cover relative"
                    src={src}
                    alt={`Mentor ${i + 1}`}
                  />
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                className="inline-flex items-center justify-center px-4 py-2 border border-white/20 rounded-full text-xs font-medium transition-colors cursor-pointer"
              >
                +56 mentors
              </motion.div>
            </motion.div>

            {/* Rotating radar + pulsing dots */}
            <motion.div
              initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="absolute bottom-0 right-0 w-36 sm:w-48 h-36 sm:h-48 pointer-events-none select-none"
            >
              <motion.svg
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"
              >
                <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="1" />
                <motion.circle
                  animate={{ r: [20, 26, 20] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  cx="100" cy="100" stroke="white" strokeWidth="1"
                />
                <line x1="20" y1="100" x2="180" y2="100" stroke="white" strokeWidth="0.5" opacity="0.5" />
                <line x1="100" y1="20" x2="100" y2="180" stroke="white" strokeWidth="0.5" opacity="0.5" />
                {[
                  { cx: 100, cy: 40, delay: 0 },
                  { cx: 100, cy: 160, delay: 0.5 },
                  { cx: 40, cy: 100, delay: 1 },
                  { cx: 160, cy: 100, delay: 1.5 },
                ].map((dot, i) => (
                  <motion.circle
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3], r: [3, 4.5, 3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: dot.delay }}
                    cx={dot.cx} cy={dot.cy} fill="white"
                  />
                ))}
              </motion.svg>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
