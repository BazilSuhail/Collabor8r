import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { FiHome } from 'react-icons/fi'
import useAuthStore from '../../stores/authStore'
import AuthShowcase from './AuthShowcase'
import BrandBadge from './BrandBadge'

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { forgotPassword, resetPassword } = useAuthStore()
  const navigate = useNavigate()

  const handleSendCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setDirection(1)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code')
    } finally { setLoading(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      await resetPassword(email, code, newPassword)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally { setLoading(false) }
  }

  const header = step === 1
    ? { title: 'Forgot password?', desc: 'Enter your email and we\'ll send a reset code.' }
    : { title: 'Reset password', desc: 'Enter the code sent to your email and choose a new password.' }

  return (
    <div className="h-screen relative bg-white">
      <AuthShowcase />

      <div className="absolute top-4 left-4 lg:top-6 lg:left-8 z-30">
        <Link to="/" className="w-9 h-9 rounded-xl bg-[#FF4D24] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all shrink-0">
          <FiHome className="w-4 h-4 text-white" />
        </Link>
      </div>

      <div className="lg:hidden absolute top-4 right-4 z-30">
        <Link to="/" className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <FiHome className="w-4 h-4 text-gray-600" />
        </Link>
      </div>

      <div className="relative z-20 h-screen flex items-center justify-center px-6 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="rounded-3xl p-8 sm:p-10">
            <BrandBadge />

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black text-[#111111]">{header.title}</h1>
              <p className="text-gray-500 text-sm mt-1">{header.desc}</p>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold mb-4 text-center"
              >
                {error}
              </motion.p>
            )}

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                {step === 1 ? (
                  <form onSubmit={handleSendCode} className="space-y-4">
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
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          Sending...
                        </span>
                      ) : 'Send Reset Code'}
                    </motion.button>
                  </form>
                ) : (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Verification Code</label>
                      <input
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200 text-center text-2xl tracking-[12px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          Resetting...
                        </span>
                      ) : 'Reset Password'}
                    </motion.button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-sm text-gray-500 mt-6">
              {step === 1 ? (
                <>Remember your password? <Link to="/login" className="text-[#FF4D24] hover:underline font-bold">Sign in</Link></>
              ) : (
                <button onClick={() => { setDirection(-1); setStep(1); setError('') }} className="text-[#FF4D24] hover:underline font-bold">Back to email</button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
