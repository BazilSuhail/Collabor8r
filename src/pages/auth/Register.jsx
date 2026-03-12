import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUsers, FiHome } from 'react-icons/fi'
import useAuthStore from '../../stores/authStore'
import AuthShowcase from '../../components/auth/AuthShowcase'

const floatingDot = {
  animate: { y: [0, -12, 0] },
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
}

const stepVariants = {
  enter: (i) => ({ opacity: 0, x: i >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (i) => ({ opacity: 0, x: i >= 0 ? -40 : 40 }),
}

const tabs = [
  { key: 'password', label: 'Password' },
  { key: 'code', label: 'Email Code' },
]

const Register = () => {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', gender: '', phone: '', dob: '', password: '', confirmPassword: '' })
  const [useCode, setUseCode] = useState(false)
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signup, signupWithCode, sendCode } = useAuthStore()
  const navigate = useNavigate()

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const nextStep = () => {
    setError('')
    if (step === 1 && (!form.name || !form.email)) { setError('Name and email are required'); return }
    if (step === 2 && (!form.gender || !form.phone || !form.dob)) { setError('All fields are required'); return }
    setDirection(1)
    setStep((s) => s + 1)
  }

  const prevStep = () => { setError(''); setDirection(-1); setStep((s) => s - 1) }

  const handleSendCode = async () => {
    setLoading(true)
    setError('')
    try {
      await sendCode(form.email, 'registration')
      setCodeSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code')
    } finally { setLoading(false) }
  }

  const handlePasswordSignup = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      await signup({ name: form.name, email: form.email, gender: form.gender, phone: form.phone, dob: form.dob, password: form.password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const handleCodeSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signupWithCode(form.email, code, { name: form.name, gender: form.gender, phone: form.phone, dob: form.dob })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
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
              <FiUsers className="w-5 h-5 text-white" />
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
      <div className="flex-1 flex items-center justify-center px-8 py-12">
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
            <h1 className="text-3xl font-black text-[#111111]">Get started</h1>
            <p className="text-gray-500 text-sm mt-1">
              {step === 1 ? 'Tell us about yourself' : step === 2 ? 'A bit more information' : useCode ? 'Check your email' : 'Choose a password'}
            </p>
          </div>

          <div className="flex items-center justify-between w-full mb-8">
            <div className="flex flex-col items-center">
              <motion.div
                animate={step === 1 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= 1 ? 'bg-[#FF4D24] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > 1 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : 1}
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300 ${
                step === 1 ? 'text-[#FF4D24]' : step > 1 ? 'text-gray-700' : 'text-gray-400'
              }`}>Identity</span>
            </div>

            <div className={`grow h-0.5 mx-3 rounded-full transition-all duration-500 ${step > 1 ? 'bg-[#FF4D24]' : 'bg-gray-200'}`} />

            <div className="flex flex-col items-center">
              <motion.div
                animate={step === 2 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= 2 ? 'bg-[#FF4D24] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > 2 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : 2}
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300 ${
                step === 2 ? 'text-[#FF4D24]' : step > 2 ? 'text-gray-700' : 'text-gray-400'
              }`}>Details</span>
            </div>

            <div className={`grow h-0.5 mx-3 rounded-full transition-all duration-500 ${step > 2 ? 'bg-[#FF4D24]' : 'bg-gray-200'}`} />

            <div className="flex flex-col items-center">
              <motion.div
                animate={step === 3 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= 3 ? 'bg-[#FF4D24] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > 3 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : 3}
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300 ${
                step === 3 ? 'text-[#FF4D24]' : step > 3 ? 'text-gray-700' : 'text-gray-400'
              }`}>{useCode ? 'Verification' : 'Security'}</span>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold mb-4 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={update('name')}
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={update('email')}
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                  />
                </div>
                <motion.button
                  type="button"
                  onClick={nextStep}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                >
                  Continue
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={update('gender')}
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] font-medium focus:border-[#FF4D24] outline-none transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat cursor-pointer"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={update('phone')}
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={update('dob')}
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                  />
                </div>
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={prevStep}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4 relative">
                  {tabs.map((t) => {
                    const isActive = (t.key === 'code') === useCode
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => { setUseCode(t.key === 'code'); setCodeSent(false); setError('') }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${
                          isActive
                            ? 'text-[#FF4D24]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                  <motion.div
                    layoutId="register-tab-bg"
                    className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm border border-gray-200/80 z-0"
                    style={{ left: useCode ? '50%' : '0.25rem', right: useCode ? '0.25rem' : '50%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                </div>

                {useCode ? (
                  <form onSubmit={handleCodeSignup} className="space-y-4">
                    {!codeSent ? (
                      <motion.button
                        type="button"
                        onClick={handleSendCode}
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                            Sending...
                          </span>
                        ) : 'Send Verification Code'}
                      </motion.button>
                    ) : (
                      <>
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
                        <div className="flex gap-3">
                          <motion.button
                            type="button"
                            onClick={() => { setUseCode(false); setError('') }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
                          >
                            Back
                          </motion.button>
                          <motion.button
                            type="submit"
                            disabled={loading}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                          >
                            {loading ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                Creating...
                              </span>
                            ) : 'Create Account'}
                          </motion.button>
                        </div>
                      </>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handlePasswordSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={update('password')}
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={update('confirmPassword')}
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                      />
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        type="button"
                        onClick={prevStep}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                            Creating...
                          </span>
                        ) : 'Create Account'}
                      </motion.button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#FF4D24] font-bold hover:underline">Sign in</Link>
            </p>
            <p className="text-[13px] sm:text-sm text-gray-400 mt-1">
              Team members are invited by project managers
            </p>
          </div>
        </motion.div>
      </div>

      <AuthShowcase />
    </div>
  )
}

export default Register
