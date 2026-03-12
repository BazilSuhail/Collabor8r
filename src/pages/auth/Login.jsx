import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiUsers, FiHome } from 'react-icons/fi'
import useAuthStore from '../../stores/authStore'
import AuthShowcase from '../../components/auth/AuthShowcase'

const floatingDot = {
  animate: { y: [0, -12, 0] },
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
}

const Login = () => {
  const [mode, setMode] = useState('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, loginWithCode, sendCode } = useAuthStore()
  const navigate = useNavigate()

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Authorization failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCode = async () => {
    setLoading(true)
    setError('')
    try {
      await sendCode(email, 'login')
      setCodeSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await loginWithCode(email, code)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white relative">
      <Link
        to="/"
        className="hidden lg:flex absolute top-6 left-8 z-20 items-center gap-2"
      >
        <div className="w-9 h-9 rounded-xl bg-[#FF4D24] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all">
          <FiHome className="w-4 h-4 text-white" />
        </div>
      </Link>
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent hidden lg:block z-10" />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FF4D24] hidden lg:block z-10"
        animate={floatingDot.animate}
        transition={floatingDot.transition}
      />
      <div className="lg:hidden w-full px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FF4D24] rounded-lg flex items-center justify-center">
              <img src="/collabor8r.svg" alt="C" className="w-4 h-4 brightness-0 invert" />
            </div>
            <span className="font-bold text-base text-[#111111] tracking-tight">Collabor8r</span>
          </div>
          <Link to="/" className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <FiHome className="w-4 h-4 text-gray-600" />
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F4F4F4] rounded-2xl p-5 border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D24] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <FiUser className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111111]">Project Management Suite</h2>
              <p className="text-xs text-gray-500">Streamline team collaboration</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-[#FF4D24]">Task Management</span>
            <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-[#FF4D24]">Real-time Updates</span>
            <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-[#FF4D24]">Team Collab</span>
          </div>
        </motion.div>
      </div>
      <div className="flex-1 flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#FF4D24] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <img src="/collabor8r.svg" alt="C" className="w-5 h-5 brightness-0 invert" />
              </div>
              <span className="text-xl font-black text-[#111111] tracking-tight">Collabor8r</span>
            </div>
            <h1 className="text-3xl font-black text-[#111111]">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 relative">
            {['password', 'code'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setCodeSent(false); setError('') }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${
                  mode === m
                    ? 'text-[#FF4D24]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'password' ? 'Password' : 'Secure Code'}
              </button>
            ))}
            <motion.div
              layoutId="login-tab-bg"
              className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm border border-gray-200/80 z-0"
              style={{ left: mode === 'password' ? '0.25rem' : '50%', right: mode === 'password' ? '50%' : '0.25rem' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold mb-4 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {mode === 'password' ? (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePasswordLogin}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Authenticating...
                    </span>
                  ) : 'Sign In'}
                </motion.button>
                <Link
                  to="/forgot-password"
                  className="block text-center text-sm font-bold text-[#FF4D24] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </motion.form>
            ) : (
              <motion.form
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={codeSent ? handleCodeLogin : (e) => { e.preventDefault(); handleSendCode() }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                  />
                </div>
                <AnimatePresence>
                  {codeSent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Verification Code</label>
                      <input
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200 text-center text-2xl tracking-[12px]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Processing...
                    </span>
                  ) : codeSent ? 'Verify & Sign In' : 'Send Code'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center space-y-1.5">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#FF4D24] hover:underline font-bold">
                Create account
              </Link>
            </p>
            <p className="text-[13px] sm:text-sm text-gray-400">
              <Link to="/register" className="hover:text-[#FF4D24] transition-colors">
                Team registration
              </Link>
              <span className="text-gray-300"> · </span>
              <span className="text-gray-400">Managers can invite members</span>
            </p>
          </div>
        </motion.div>
      </div>

      <AuthShowcase />
    </div>
  )
}

export default Login
