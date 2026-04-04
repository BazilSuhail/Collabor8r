import { motion } from 'motion/react'

const PageHeader = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  highlight, 
  action, 
  gradient = 'from-orange-500 via-amber-500 to-orange-600' 
}) => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full p-6 lg:p-8 rounded-2xl md:rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-orange-500/5 overflow-hidden mb-6 group"
    >
      {/* FULL-WIDTH SPREAD: SHARP BORDERED INNER SVGs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        

        {/* 3. CENTER: Sharp Outline 4-Point Starburst */}
        <motion.svg 
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-3 left-[48%] w-8 h-8 lg:w-10 lg:h-10 text-amber-500 dark:text-amber-400" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </motion.svg>

        {/* 4. MID-RIGHT: Floating Dual Nested Triangles with Thick Stroke */}
        <motion.svg 
          animate={{ y: [8, -8, 8], rotate: [6, -6, 6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -translate-y-1/2 right-[20%] w-32 h-32 lg:w-44 lg:h-44 text-orange-600/30 dark:text-orange-400/25" 
          viewBox="0 0 100 100" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3"
        >
          <polygon points="50,10 90,85 10,85" />
          <polygon points="50,25 80,75 20,75" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
        </motion.svg>

        {/* 5. FAR RIGHT: Heavy-Stroked Sharp Chevron */}
        <motion.svg 
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-12 -right-12 w-64 h-64 lg:w-80 lg:h-80 text-orange-500/10 dark:text-orange-400/10" 
          viewBox="0 0 100 100" 
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="4"
        >
          <polygon points="0,20 60,0 100,80 40,100" />
        </motion.svg>

        {/* Top Gradient Accent Trim */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 dark:via-orange-400/30 to-transparent" />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
        <div className="flex items-center gap-4 lg:gap-6">
          {Icon && (
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${gradient} rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0`}
            >
              <Icon size={28} className="md:text-3xl" />
              
              {/* Sharp decorative triangle badge behind icon */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 dark:bg-amber-300 rounded-sm rotate-45 -z-10" />
            </motion.div>
          )}

          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight flex flex-wrap items-center gap-x-2">
              <span>{title}</span>
              {highlight && (
                <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 dark:from-orange-400 dark:to-amber-300 bg-clip-text text-transparent">
                  {highlight}
                </span>
              )}
            </h1>

            {subtitle && (
              <p className="text-xs md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && (
          <div className="shrink-0 w-full md:w-auto pt-2 md:pt-0">
            {action}
          </div>
        )}
      </div>
    </motion.header>
  )
}

export default PageHeader
