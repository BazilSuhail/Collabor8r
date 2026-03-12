import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../../stores/authStore'
import AuthShowcase from './AuthShowcase'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { forgotPassword } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code')
    } finally { setLoading(false) }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex bg-white relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent hidden lg:block" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FF4D24] hidden lg:block" />
        <div className="flex-1 flex items-center justify-center px-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FF4D24] flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-[#111111] mb-2">Check your email</h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Reset code dispatched to <strong className="text-gray-900">{email}</strong>
              </p>
              <Link
                to="/reset-password"
                className="inline-block w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
              >
                Reset Password
              </Link>
              <p className="mt-6 text-sm text-gray-500">
                <Link to="/login" className="text-[#FF4D24] font-bold hover:underline">Back to sign in</Link>
              </p>
            </div>
          </motion.div>
        </div>
        <AuthShowcase />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-white relative">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent hidden lg:block" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FF4D24] hidden lg:block" />
      <div className="flex-1 flex items-center justify-center px-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#FF4D24] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <img src="/collabor8r.svg" alt="C" className="w-5 h-5 brightness-0 invert" />
              </div>
              <span className="text-xl font-black text-[#111111] tracking-tight">Collabor8r</span>
            </div>
            <h1 className="text-3xl font-black text-[#111111]">Forgot password?</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your email and we'll send a reset code.</p>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold mb-4 text-center"
            >
              {error}
            </motion.p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Sending...
                </span>
              ) : 'Send Reset Code'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6 font-medium">
            Remember your password?{' '}
            <Link to="/login" className="text-[#FF4D24] hover:underline font-bold">Sign in</Link>
          </p>
        </motion.div>
      </div>
      <AuthShowcase />
    </div>
  )
}

export default ForgotPassword
