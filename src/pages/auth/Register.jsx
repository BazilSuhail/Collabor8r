import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { FiHome } from "react-icons/fi";
import useAuthStore from "../../stores/authStore";
import AuthShowcase from "../../components/auth/AuthShowcase";

const stepVariants = {
  enter: (i) => ({ opacity: 0, x: i >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (i) => ({ opacity: 0, x: i >= 0 ? -40 : 40 }),
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const monthAbbr = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};
const parseMonth = (v) => {
  if (!v) return -1;
  const n = parseInt(v);
  if (!isNaN(n) && n >= 1 && n <= 12) return n - 1;
  const lower = v.toLowerCase().slice(0, 3);
  if (lower in monthAbbr) return monthAbbr[lower];
  const idx = months.findIndex((m) => m.toLowerCase() === v.toLowerCase());
  return idx;
};

const tabs = [
  { key: "password", label: "Password" },
  { key: "code", label: "Email Code" },
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    gender: "",
    phone: "",
    phoneCode: "+1",
    dobMonth: "",
    dobDay: "",
    dobYear: "",
    password: "",
    confirmPassword: "",
  });
  const [codeTimer, setCodeTimer] = useState(0);
  const [codeInstructions, setCodeInstructions] = useState("");
  const [useCode, setUseCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signup, signupWithCode, sendCode } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (codeTimer <= 0) return;
    const interval = setInterval(() => setCodeTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [codeTimer]);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const nextStep = () => {
    setError("");
    if (step === 1 && (!form.name || !form.email)) {
      setError("Name and email are required");
      return;
    }
    if (step === 2) {
      if (
        !form.gender ||
        !form.phone ||
        !form.dobMonth ||
        !form.dobDay ||
        !form.dobYear
      ) {
        setError("All fields are required");
        return;
      }
      const day = parseInt(form.dobDay);
      const year = parseInt(form.dobYear);
      if (isNaN(day) || day < 1 || day > 31) {
        setError("Enter a valid day (1-31)");
        return;
      }
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        setError("Enter a valid year");
        return;
      }
      const monthIdx = parseMonth(form.dobMonth);
      if (monthIdx === -1) {
        setError("Enter a valid month");
        return;
      }
      form.dob = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setError("");
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSendCode = async () => {
    setLoading(true);
    setError("");
    try {
      await sendCode(form.email, "registration");
      setCodeSent(true);
      setCodeTimer(120);
      setCodeInstructions("Enter the 6-digit code sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (codeTimer > 0) return;
    setLoading(true);
    setError("");
    try {
      await sendCode(form.email, "registration");
      setCodeTimer(120);
      setCode("");
      setCodeInstructions("A new code has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignup = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signup({
        name: form.name,
        email: form.email,
        gender: form.gender,
        phone: form.phoneCode + form.phone,
        dob: form.dob,
        password: form.password,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signupWithCode(form.email, code, {
        name: form.name,
        gender: form.gender,
        phone: form.phoneCode + form.phone,
        dob: form.dob,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen relative bg-white overflow-hidden">
      <AuthShowcase />

      {/* Top-left home button */}
      <div className="absolute top-4 left-4 lg:top-6 lg:left-8 z-30 flex items-center gap-2">
        <Link
          to="/"
          className="w-9 h-9 rounded-xl bg-[#FF4D24] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all shrink-0"
        >
          <FiHome className="w-4 h-4 text-white" />
        </Link>
      </div>

      {/* Mobile-only home button */}
      <div className="lg:hidden absolute top-4 right-4 z-30">
        <Link
          to="/"
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <FiHome className="w-4 h-4 text-gray-600" />
        </Link>
      </div>

      {/* Centered form */}
      <div className="relative z-20 h-screen flex items-center justify-center px-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-6"
        >
          <div className="rounded-3xl p-8 sm:p-10">
            <div className="flex justify-center items-center  bg-white py-4 shadow-md rounded-2xl border border-slate-200 w-full gap-2 mb-6">
              <div className="w-7 h-7 bg-[#FF4D24]  rounded-lg flex items-center justify-center">
                <img
                  src="/collabor8r.svg"
                  alt="C"
                  className="w-3.5 h-3.5 brightness-0 invert"
                />
              </div>
              <p className="ml-2 text-[20px] font-bold text-[#111111] tracking-tight">
                Collabor<span className="text-orange-600">8</span>r
              </p>
            </div>

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black text-[#111111]">
                Get started
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {step === 1
                  ? "Tell us about yourself"
                  : step === 2
                    ? "A bit more information"
                    : useCode
                      ? "Check your email"
                      : "Choose a password"}
              </p>
            </div>

            <div className="flex items-center justify-between w-full mb-8">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={step === 1 ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= 1
                      ? "bg-[#FF4D24] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 1 ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    1
                  )}
                </motion.div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300 ${
                    step === 1
                      ? "text-[#FF4D24]"
                      : step > 1
                        ? "text-gray-700"
                        : "text-gray-400"
                  }`}
                >
                  Identity
                </span>
              </div>

              <div
                className={`grow h-0.5 mx-3 rounded-full transition-all duration-500 ${step > 1 ? "bg-[#FF4D24]" : "bg-gray-200"}`}
              />

              <div className="flex flex-col items-center">
                <motion.div
                  animate={step === 2 ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= 2
                      ? "bg-[#FF4D24] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 2 ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    2
                  )}
                </motion.div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300 ${
                    step === 2
                      ? "text-[#FF4D24]"
                      : step > 2
                        ? "text-gray-700"
                        : "text-gray-400"
                  }`}
                >
                  Details
                </span>
              </div>

              <div
                className={`grow h-0.5 mx-3 rounded-full transition-all duration-500 ${step > 2 ? "bg-[#FF4D24]" : "bg-gray-200"}`}
              />

              <div className="flex flex-col items-center">
                <motion.div
                  animate={step === 3 ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= 3
                      ? "bg-[#FF4D24] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 3 ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    3
                  )}
                </motion.div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300 ${
                    step === 3
                      ? "text-[#FF4D24]"
                      : step > 3
                        ? "text-gray-700"
                        : "text-gray-400"
                  }`}
                >
                  {useCode ? "Verification" : "Security"}
                </span>
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
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={update("name")}
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={update("email")}
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
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                      Gender
                    </label>
                    <select
                      value={form.gender}
                      onChange={update("gender")}
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] font-medium focus:border-[#FF4D24] outline-none transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat cursor-pointer"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                      Phone
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-[5.5rem] shrink-0">
                        <input
                          type="text"
                          list="phone-codes"
                          placeholder="+1"
                          value={form.phoneCode || "+1"}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              phoneCode: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] font-medium text-sm focus:border-[#FF4D24] outline-none transition-all duration-200"
                        />
                        <datalist id="phone-codes">
                          {[
                            "+1",
                            "+44",
                            "+91",
                            "+86",
                            "+49",
                            "+33",
                            "+61",
                            "+81",
                            "+7",
                            "+55",
                            "+971",
                            "+65",
                            "+92",
                            "+971",
                            "+966",
                            "+90",
                            "+82",
                            "+39",
                            "+34",
                            "+31",
                          ].map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            phone: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="flex-1 px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                      Date of Birth
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        list="months-list"
                        placeholder="Month"
                        value={form.dobMonth}
                        onChange={update("dobMonth")}
                        className="flex-[2] min-w-0 px-3 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium text-sm focus:border-[#FF4D24] outline-none transition-all duration-200"
                      />
                      <datalist id="months-list">
                        {months.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Day"
                        value={form.dobDay}
                        onChange={(e) => {
                          const v = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 2);
                          setForm((p) => ({ ...p, dobDay: v }));
                        }}
                        className="w-[4rem] shrink-0 px-2 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200 text-center"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        list="years-list"
                        placeholder="Year"
                        value={form.dobYear}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            dobYear: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4),
                          }))
                        }
                        className="w-[4.5rem] shrink-0 px-2 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium text-sm focus:border-[#FF4D24] outline-none transition-all duration-200 text-center"
                      />
                      <datalist id="years-list">
                        {years.map((y) => (
                          <option key={y} value={y} />
                        ))}
                      </datalist>
                    </div>
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
                  <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-4 relative shadow-sm">
                    {tabs.map((t) => {
                      const isActive = (t.key === "code") === useCode;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => {
                            setUseCode(t.key === "code");
                            setCodeSent(false);
                            setError("");
                          }}
                          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${
                            isActive
                              ? "text-[#FF4D24]"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                    <motion.div
                      layoutId="register-tab-bg"
                      className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm border border-gray-200/80 z-0"
                      style={{
                        left: useCode ? "50%" : "0.25rem",
                        right: useCode ? "0.25rem" : "50%",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  </div>

                  {useCode ? (
                    <form onSubmit={handleCodeSignup} className="space-y-4">
                      {!codeSent ? (
                        <>
                          <p className="text-xs text-gray-500 text-center leading-relaxed">
                            A 6-digit code will be sent to{" "}
                            <span className="font-bold text-[#111111]">
                              {form.email}
                            </span>
                            . Make sure your email is correct before proceeding.
                          </p>
                          <motion.button
                            type="button"
                            onClick={handleSendCode}
                            disabled={loading}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                          >
                            {loading ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg
                                  className="animate-spin h-4 w-4"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Sending...
                              </span>
                            ) : (
                              "Send Verification Code"
                            )}
                          </motion.button>
                        </>
                      ) : (
                        <>
                          {codeInstructions && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-gray-500 text-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
                            >
                              {codeInstructions}
                            </motion.p>
                          )}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                              Verification Code
                            </label>
                            <input
                              type="text"
                              placeholder="000000"
                              value={code}
                              onChange={(e) =>
                                setCode(
                                  e.target.value.replace(/\D/g, "").slice(0, 6),
                                )
                              }
                              required
                              maxLength={6}
                              className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200 text-center text-2xl tracking-[12px]"
                            />
                          </div>
                          {codeTimer > 0 ? (
                            <p className="text-xs text-gray-400 text-center">
                              Code expires in{" "}
                              <span className="font-bold text-[#FF4D24]">
                                {Math.floor(codeTimer / 60)}:
                                {String(codeTimer % 60).padStart(2, "0")}
                              </span>
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResendCode}
                              disabled={loading}
                              className="w-full text-xs font-bold text-[#FF4D24] hover:underline text-center bg-transparent border-none cursor-pointer"
                            >
                              Resend code
                            </button>
                          )}
                          <div className="flex gap-3">
                            <motion.button
                              type="button"
                              onClick={() => {
                                setUseCode(false);
                                setCodeSent(false);
                                setCodeTimer(0);
                                setError("");
                              }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
                            >
                              Back
                            </motion.button>
                            <motion.button
                              type="submit"
                              disabled={loading || code.length !== 6}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 py-3.5 rounded-xl bg-[#111111] text-white font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                            >
                              {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                  Creating...
                                </span>
                              ) : (
                                "Create Account"
                              )}
                            </motion.button>
                          </div>
                        </>
                      )}
                    </form>
                  ) : (
                    <form onSubmit={handlePasswordSignup} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                          Password
                        </label>
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={form.password}
                          onChange={update("password")}
                          required
                          minLength={6}
                          className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          placeholder="Re-enter password"
                          value={form.confirmPassword}
                          onChange={update("confirmPassword")}
                          required
                          minLength={6}
                          className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-[#111111] placeholder-gray-400 font-medium focus:border-[#FF4D24] outline-none transition-all duration-200"
                        />
                      </div>
                      {form.password && form.password.length < 6 && (
                        <p className="text-xs text-amber-500 text-center">
                          Password must be at least 6 characters
                        </p>
                      )}
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
                              <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Creating...
                            </span>
                          ) : (
                            "Create Account"
                          )}
                        </motion.button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#FF4D24] font-bold hover:underline"
                >
                  Sign in
                </Link>
              </p>
              <p className="text-[13px] sm:text-sm text-gray-400 mt-1">
                Team members are invited by project managers
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Person with laptop SVG decoration */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 right-0 w-[38%] max-w-[420px] pointer-events-none select-none hidden lg:block"
      >
        <svg
          viewBox="0 0 500 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <g
            stroke="#111111"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Head */}
            <motion.circle
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              cx="250"
              cy="90"
              r="28"
              fill="white"
            />
            {/* Hair */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              d="M222 80 Q225 55 250 52 Q275 55 278 80"
            />
            {/* Eyes */}
            <motion.circle
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2, delay: 0.5 }}
              cx="240"
              cy="88"
              r="2.5"
              fill="#111111"
              style={{ transformOrigin: "center" }}
            />
            <motion.circle
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2, delay: 0.55 }}
              cx="260"
              cy="88"
              r="2.5"
              fill="#111111"
              style={{ transformOrigin: "center" }}
            />
            {/* Smile */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              d="M242 98 Q250 105 258 98"
            />
            {/* Neck */}
            <motion.line
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              x1="250"
              y1="118"
              x2="250"
              y2="135"
            />
            {/* Body */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              d="M220 135 L210 220 L290 220 L280 135 Z"
              fill="#F4F4F4"
            />
            {/* Left arm reaching to laptop */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              d="M220 150 Q170 190 155 235"
            />
            {/* Right arm on laptop */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              d="M280 150 Q310 195 310 235"
            />
          </g>

          {/* Laptop */}
          <g>
            {/* Screen */}
            <motion.rect
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              x="95"
              y="200"
              width="120"
              height="80"
              rx="6"
              fill="white"
              stroke="#111111"
              strokeWidth="2"
              style={{ transformOrigin: "bottom" }}
            />
            {/* Screen glow */}
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.9 }}
              x="100"
              y="206"
              width="110"
              height="64"
              rx="3"
              fill="#FF4D24"
              fillOpacity="0.08"
            />
            {/* Code lines on screen */}
            <motion.line
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: 1.1 }}
              x1="108"
              y1="218"
              x2="148"
              y2="218"
              stroke="#FF4D24"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ transformOrigin: "left" }}
            />
            <motion.line
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: 1.2 }}
              x1="108"
              y1="230"
              x2="175"
              y2="230"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.3"
              style={{ transformOrigin: "left" }}
            />
            <motion.line
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: 1.25 }}
              x1="108"
              y1="242"
              x2="160"
              y2="242"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.3"
              style={{ transformOrigin: "left" }}
            />
            <motion.line
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: 1.15 }}
              x1="108"
              y1="254"
              x2="195"
              y2="254"
              stroke="#FF4D24"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ transformOrigin: "left" }}
            />
            {/* Base */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              d="M85 280 L95 200 L215 200 L225 280 Z"
              fill="#F4F4F4"
              stroke="#111111"
              strokeWidth="2"
            />
            {/* Keyboard area */}
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 1 }}
              x="105"
              y="250"
              width="100"
              height="20"
              rx="2"
              fill="white"
            />
          </g>

          {/* Floating code symbols */}
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            opacity="0.5"
          >
            <text
              x="320"
              y="180"
              fontSize="14"
              fontWeight="bold"
              fill="#FF4D24"
              fontFamily="monospace"
            >
              {"</>"}
            </text>
          </motion.g>
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 2 }}
            opacity="0.4"
          >
            <text
              x="80"
              y="130"
              fontSize="11"
              fontWeight="bold"
              fill="#111111"
              fontFamily="monospace"
            >
              {"{}"}
            </text>
          </motion.g>
          <motion.g
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
            opacity="0.3"
          >
            <text
              x="350"
              y="280"
              fontSize="10"
              fontWeight="bold"
              fill="#FF4D24"
              fontFamily="monospace"
            >
              {"() =>"}
            </text>
          </motion.g>

          {/* Desk */}
          <motion.line
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            x1="40"
            y1="290"
            x2="370"
            y2="290"
            stroke="#111111"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transformOrigin: "center" }}
          />
          <motion.line
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.95 }}
            x1="80"
            y1="310"
            x2="340"
            y2="310"
            stroke="#111111"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ transformOrigin: "center" }}
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default Register;
