import { useState, useEffect, useMemo } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { RiLogoutBoxRLine } from 'react-icons/ri'
import { RxDashboard } from 'react-icons/rx'
import { MdOutlineFolderShared } from 'react-icons/md'
import { BsGraphUp } from 'react-icons/bs'
import { FaCubes } from 'react-icons/fa'
import { GoPeople } from 'react-icons/go'
import { LuCopyMinus, LuMailCheck } from 'react-icons/lu'
import useUiStore from '../../stores/uiStore'
import useAuthStore from '../../stores/authStore'
import useProjectStore from '../../stores/projectStore'
import useNotificationStore from '../../stores/notificationStore'
import NotificationPanel from '../notifications/NotificationPanel'

const colors = [
  'bg-red-400', 'bg-blue-400', 'bg-green-700', 'bg-yellow-600',
  'bg-indigo-400', 'bg-orange-400', 'bg-cyan-400', 'bg-violet-400',
]

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)]

const projectNavs = ['/projects', '/projects/joined', '/projects/managing']

const isNavMatch = (to, pathname) => {
  if (to === '/projects') return pathname === '/projects' || /^\/projects\/[a-f0-9]+$/.test(pathname)
  if (to === '/projects/joined') return pathname === '/projects/joined' || pathname.endsWith('/joined')
  if (to === '/projects/managing') return pathname === '/projects/managing' || pathname.endsWith('/manage')
  return pathname === to
}

const mainNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <RxDashboard size={19} /> },
  { to: '/overview', label: 'Overview', icon: <MdOutlineFolderShared size={19} /> },
  { to: '/workflow', label: 'Workflow', icon: <BsGraphUp size={19} /> },
]

const projectNavItems = [
  { to: '/projects', label: 'My Projects', icon: <FaCubes size={19} /> },
  { to: '/projects/joined', label: 'Joined Projects', icon: <LuCopyMinus size={19} /> },
  { to: '/projects/managing', label: 'Managed Projects', icon: <GoPeople size={19} /> },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { fetchJoinedProjects, joinedProjects: rawJoined } = useProjectStore()
  const joinedProjects = useMemo(() => rawJoined.filter((p, i, arr) => arr.findIndex((x) => x._id === p._id) === i), [rawJoined])
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUiStore()
  const [projectColors, setProjectColors] = useState({})
  const location = useLocation()
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [barVisible, setBarVisible] = useState(true)
  const { unreadCount, togglePanel: toggleNotificationPanel, fetchNotifications, listenSocket } = useNotificationStore()

  useEffect(() => {
    fetchJoinedProjects()
    fetchNotifications()
    listenSocket()
  }, [])

  useEffect(() => {
    const colorMapping = {}
    joinedProjects.forEach((project) => {
      colorMapping[project._id] = getRandomColor()
    })
    setProjectColors(colorMapping)
  }, [joinedProjects])

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY
      if (delta > 8) {
        setBarVisible(false)
        setIsMobileSheetOpen(false)
      } else if (delta < -4) {
        setBarVisible(true)
      }
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const quickPaths = ['/dashboard', '/overview', '/workflow']
  const showQuickLinks = quickPaths.includes(location.pathname)

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  }

  const renderNavLink = (item) => {
    const end = projectNavs.includes(item.to)
    const active = isNavMatch(item.to, location.pathname)
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={end}
        className={`flex items-center p-2.5 rounded-xl transition-all duration-200 group ${
          active
            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white font-medium'
        } ${!sidebarOpen && 'justify-center'}`}
      >
        <span className="min-w-[20px] flex items-center justify-center">{item.icon}</span>
        {sidebarOpen && <p className="ml-3 text-[14px] truncate">{item.label}</p>}
      </NavLink>
    )
  }

  return (
    <nav className="relative">
      {/* mobile top navbar */}
      <motion.div
        className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-gray-800/50 z-50 h-16 flex items-center justify-between px-4"
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img src="/collabor8r.svg" alt="logo" className="w-7 h-7" />
          <div className="text-[16px] font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Collabor<span className="text-orange-600">8</span>r
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleNotificationPanel}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </motion.div>

      {/* floating bottom bar (mobile/tablet) */}
      <motion.div
        className="lg:hidden fixed left-2 right-2 z-40 flex items-center justify-between"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
        animate={{ y: barVisible && !isMobileSheetOpen ? 0 : 120 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {showQuickLinks && (
          <div className="flex items-center bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-200 dark:border-gray-800/50 shadow-lg backdrop-blur-sm p-1.5 gap-1">
            {mainNavItems.map((item) => {
              const active = isNavMatch(item.to, location.pathname)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[64px] ${
                    active
                      ? 'bg-orange-600/10 text-orange-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
          className="ml-auto p-3 bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-200 dark:border-gray-800/50 shadow-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </motion.div>

      {/* mobile bottom sheet */}
      <AnimatePresence>
        {isMobileSheetOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSheetOpen(false)}
            />
            <motion.div
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0d0d0d] rounded-t-3xl border-t border-gray-200 dark:border-gray-800/50 max-h-[80vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              </div>

              <div className="flex items-center gap-3 px-5 py-3">
                <Link to="/profile" onClick={() => setIsMobileSheetOpen(false)} className="flex items-center flex-1">
                  <img
                    src={`/avatars/${user?.avatar || '1'}.jpg`}
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      const fb = e.target.nextSibling
                      if (fb) fb.style.display = 'flex'
                    }}
                  />
                  <div className="hidden w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-500/20 dark:to-orange-600/20 items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 ml-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                </Link>
              </div>

              <div className="px-3 pb-6 space-y-4">
                <div>
                  <p className="px-3 pb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                    Main
                  </p>
                  {mainNavItems.map(renderNavLink)}
                </div>

                <div>
                  <p className="px-3 pb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                    Projects
                  </p>
                  {projectNavItems.map(renderNavLink)}
                </div>

                <div>
                  <p className="px-3 pb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                    Account
                  </p>
                  <NavLink
                    to="/invitations"
                    onClick={() => setIsMobileSheetOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center p-2.5 rounded-xl transition-all ${
                        isActive ? 'bg-orange-600/10 text-orange-600 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                      }`
                    }
                  >
                    <LuMailCheck size={19} />
                    <span className="ml-3 text-sm font-medium">Invitations</span>
                  </NavLink>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-800/50 space-y-1">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center p-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  >
                    {theme === 'dark' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    )}
                    <span className="ml-3 font-medium text-sm">
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                  >
                    <RiLogoutBoxRLine size={20} />
                    <span className="ml-3 font-medium text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* desktop sidebar */}
      <motion.div
        initial={sidebarOpen ? 'expanded' : 'collapsed'}
        animate={sidebarOpen ? 'expanded' : 'collapsed'}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden bg-[#fcfcfc] dark:bg-[#0d0d0d] fixed left-0 top-0 lg:flex flex-col border-r border-gray-200 dark:border-gray-800/50 h-screen transition-colors duration-300 z-40"
      >
        {/* floating edge toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute right-0 top-5 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-orange-600 transition-all shadow-md z-50 translate-x-1/2"
        >
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} className="flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 9L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </button>

        <div className="flex flex-col h-full p-4 overflow-hidden">
          {/* header & logo */}
          <div className="flex items-center justify-between mb-5 px-1">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/collabor8r.svg" alt="logo" className="w-8 h-8 min-w-[32px]" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[19px] font-black text-gray-900 dark:text-gray-100 tracking-tight"
                  >
                    Collabor<span className="text-orange-600">8</span>r
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* cool pill dark mode row with notifications */}
          <div className={`flex items-center justify-between gap-1 mb-4 ${!sidebarOpen && 'hidden'}`}>
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.95 }}
              className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-900 border border-gray-200/80 dark:border-gray-700/50 hover:border-orange-500/40 dark:hover:border-orange-500/40 shadow-sm transition-all duration-300"
              title="toggle theme"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    className="text-amber-500 dark:text-amber-400 flex items-center"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    className="text-indigo-600 dark:text-indigo-400 flex items-center"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
              {theme === 'dark' ? (
                <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-300 tracking-wide">Light Mode</span>
              ) : (
                <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 tracking-wide">Dark Mode</span>
              )}
            </motion.button>

            <div className="flex items-center gap-1">
              <motion.button
                onClick={toggleNotificationPanel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800/60 transition-colors relative"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          {/* user profile card */}
          <Link to="/profile" className="mb-5">
            <div className={`flex items-center p-2 rounded-xl bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200/60 dark:hover:bg-gray-800/70 border border-gray-200/50 dark:border-gray-800/50 transition-all ${!sidebarOpen ? 'justify-center' : 'px-3'}`}>
              <div className={`flex items-center w-full gap-2.5 overflow-hidden ${!sidebarOpen && 'justify-center'}`}>
                <img
                  src={`/avatars/${user?.avatar || '1'}.jpg`}
                  alt="profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-500/20 shrink-0"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    const fb = e.target.nextSibling
                    if (fb) fb.style.display = 'flex'
                  }}
                />
                <div className="hidden w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-500/20 dark:to-orange-600/20 items-center justify-center text-orange-600 dark:text-orange-400 text-xs font-bold shrink-0">
                  {user?.name?.charAt(0)}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">{user?.email}</p>
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* categorized navigation list */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1 no-scrollbar space-y-4">
            {/* section 1: main overview */}
            <div>
              {sidebarOpen && (
                <p className="px-3 pb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  Main
                </p>
              )}
              <div className="space-y-1">
                {mainNavItems.map(renderNavLink)}
              </div>
            </div>

            {/* section 2: projects management */}
            <div>
              {sidebarOpen && (
                <p className="px-3 pb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  Projects
                </p>
              )}
              <div className="space-y-1">
                {projectNavItems.map(renderNavLink)}
              </div>
            </div>

            {/* flat joined projects list */}
            {sidebarOpen && joinedProjects.length > 0 && (
              <div className="pt-2">
                <p className="px-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  Recent Projects
                </p>
                <div className="space-y-0.5">
                  {joinedProjects.map((project) => (
                    <div
                      key={project._id}
                      onClick={() => handleProjectClick(project._id)}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer group transition-all"
                    >
                      <div
                        className={`w-4 h-4 text-[9px] flex items-center justify-center text-white font-bold rounded ${
                          projectColors[project._id] || 'bg-gray-400'
                        } flex-shrink-0`}
                      >
                        {project.name?.charAt(0)}
                      </div>
                      <p className="ml-2.5 text-[13px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 truncate">
                        {project.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* section 3: account & communications */}
            <div>
              {sidebarOpen && (
                <p className="px-3 pb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  Account
                </p>
              )}
              <div className="space-y-1">
                <NavLink
                  to="/invitations"
                  className={({ isActive }) =>
                    `flex items-center p-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white font-medium'
                    } ${!sidebarOpen && 'justify-center'}`
                  }
                >
                  <span className="min-w-[20px] flex items-center justify-center">
                    <LuMailCheck size={19} />
                  </span>
                  {sidebarOpen && <p className="ml-3 text-[14px]">Invitations</p>}
                </NavLink>
              </div>
            </div>
          </div>

          {/* footer / logout */}
          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-800/50">
            <button
              onClick={handleLogout}
              className={`flex items-center w-full p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all ${
                !sidebarOpen && 'justify-center'
              }`}
            >
              <RiLogoutBoxRLine size={18} className="shrink-0" />
              {sidebarOpen && <span className="ml-3 font-semibold text-[14px]">Logout</span>}
            </button>
          </div>
        </div>
      </motion.div>

      <NotificationPanel />
    </nav>
  )
}

export default Sidebar
