import { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX, FiLogOut, FiChevronDown } from 'react-icons/fi'
import useAuthStore from '../../stores/authStore'

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [compact, setCompact] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const lastScroll = useRef(0)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, token, isAuthenticated, logout, loadUser } = useAuthStore()
  const { scrollY } = useScroll()

  useEffect(() => {
    if (token && !user) loadUser()
  }, [])

  useMotionValueEvent(scrollY, 'change', (y) => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0
    setCompact(y > vh)

    const delta = y - lastScroll.current
    if (delta > 5 && y > 80) setHidden(true)
    else if (delta < -5) setHidden(false)
    lastScroll.current = y
  })

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    navigate('/')
  }

  const links = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/projects', label: 'Projects' },
      ]
    : []

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-3 flex justify-center pointer-events-none"
    >
      <motion.div
        layout
        animate={{
          maxWidth: compact ? '48rem' : '82rem',
          marginTop: '0.5rem',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="w-full bg-[#F4F4F4] backdrop-blur-lg border border-gray-300/80 rounded-2xl shadow-sm pointer-events-auto"
      >
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
                <div className="w-7 h-7 bg-[#FF4D24] rounded-lg flex items-center justify-center">
                  <img src="/collabor8r.svg" alt="C" className="w-4 h-4 brightness-0 invert" />
                </div>
                <span className="font-bold text-base text-[#111111] tracking-tight">Collabor8r</span>
              </Link>

              {isAuthenticated && (
                <div className="hidden md:flex items-center gap-0.5">
                  {links.map(({ to, label }) => (
                    <Link key={to} to={to}
                      className={`px-3 py-1.5 text-sm font-semibold transition-all rounded-lg ${
                        pathname === to
                          ? 'text-[#FF4D24] bg-[#FF4D24]/5'
                          : 'text-gray-400 hover:text-gray-800'
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FF4D24] text-white flex items-center justify-center text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">{user.name}</span>
                    <FiChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 overflow-hidden origin-top-right"
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <Link to="/profile" onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          Profile
                        </Link>
                        <button onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <FiLogOut size={14} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/login"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link to="/register"
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF4D24] text-white hover:bg-[#e04420] transition-all shadow-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all">
              {open ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {isAuthenticated && user && (
                  <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-lg bg-[#FF4D24] text-white flex items-center justify-center text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
                {links.map(({ to, label }) => (
                  <Link key={to} to={to} onClick={() => setOpen(false)}
                    className={`block px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      pathname === to
                        ? 'bg-[#FF4D24]/5 text-[#FF4D24]'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <div className="flex gap-2 pt-1">
                    <Link to="/login" onClick={() => setOpen(false)}
                      className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setOpen(false)}
                      className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#FF4D24] text-white hover:bg-[#e04420] transition-all shadow-sm"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
                {isAuthenticated && (
                  <button onClick={() => { setOpen(false); handleLogout() }}
                    className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <FiLogOut size={15} /> Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.nav>
  )
}

export default Navbar
