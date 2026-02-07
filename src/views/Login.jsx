import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import {
  User, Lock, AlertCircle, ArrowRight, BookOpen,
  ShieldCheck, CheckCircle2
} from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import Button from "../components/ui/Button";
import LoginTransition from "../components/LoginTransition";
import { motion, AnimatePresence } from "framer-motion";
import { useLibrarySettings } from "../context/LibrarySettingsContext";

// --- Internal Components ---

const GlassCard = ({ children, className = "", delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`relative overflow-hidden bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] shadow-2xl ${className}`}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [secureConnection, setSecureConnection] = useState(false);
  const { libraryName, libraryShortName } = useLibrarySettings();

  useEffect(() => {
    setTimeout(() => setSecureConnection(true), 1200);
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!username) errors.username = "Username is required";
    else if (username.length < 3) errors.username = "Min 3 characters";

    if (!password) errors.password = "Password is required";
    else if (password.length < 4) errors.password = "Min 4 characters";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setLoading(true);

    axiosClient.post("/login", { username, password })
      .then(({ data }) => {
        localStorage.setItem("ACCESS_TOKEN", data.token);
        localStorage.setItem("USER_NAME", data.user.name);
        localStorage.setItem("USER_ROLE", data.user.role);
        setShowTransition(true);
      })
      .catch((err) => {
        setLoading(false);
        const response = err.response;
        if (response && response.status === 401) {
          setError("Invalid credentials.");
        } else {
          setError("Server unreachable.");
        }
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1a] via-[#0f172a] to-[#0c1322] text-white font-sans selection:bg-blue-500/30 overflow-hidden relative flex items-center justify-center p-4 lg:p-8">

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Primary Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-30%] left-[-15%] w-[80vw] h-[80vw] bg-gradient-to-br from-blue-600/30 via-blue-500/20 to-transparent rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-30%] right-[-15%] w-[70vw] h-[70vw] bg-gradient-to-tl from-indigo-600/25 via-purple-500/15 to-transparent rounded-full blur-[130px]"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] right-[20%] w-[30vw] h-[30vw] bg-cyan-500/10 rounded-full blur-[100px]"
        />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />

        {/* Vignette Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      </div>

      {/* --- TRANSITION --- */}
      {showTransition && <LoginTransition onFinish={() => window.location.reload()} />}

      {/* --- MAIN LAYOUT --- */}
      <div className="relative z-10 w-full max-w-5xl">

        {/* School Branding Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          {/* Logo with Glow Effect */}
          <motion.div
            className="relative inline-block mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl scale-150 opacity-60" />
            <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-white/15 to-white/5 rounded-3xl border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <img
                src="/pclu-logo.png"
                alt="School Logo"
                className="w-16 h-16 object-contain drop-shadow-lg"
              />
            </div>
          </motion.div>

          {/* School Name */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3"
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              {libraryName || "Library Management System"}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-slate-400 text-sm md:text-base font-medium tracking-wide uppercase"
          >
            Library Management System
          </motion.p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Admin Login Card */}
          <GlassCard
            className="rounded-3xl p-8 md:p-10 border-t-4 border-t-blue-500/80 hover:border-t-blue-400 transition-colors duration-500"
            delay={0.2}
          >
            {/* Card Header */}
            <div className="mb-8 text-center">
              <motion.div
                className="w-16 h-16 mx-auto mb-5 relative"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl blur-lg opacity-60" />
                <div className="relative w-full h-full bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Lock className="text-white" size={28} />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-1">Admin Portal</h2>
              <p className="text-slate-400 text-sm">Secure staff access</p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-red-200 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-5">
              <FloatingInput
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={User}
                error={fieldErrors.username}
                className="bg-slate-800/50 border-slate-700/50 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
              <FloatingInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                error={fieldErrors.password}
                className="bg-slate-800/50 border-slate-700/50 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-400">
                  {secureConnection ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-emerald-400/90">Secure Connection</span>
                    </motion.div>
                  ) : (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      <span>Establishing secure connection...</span>
                    </>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-indigo-500 text-white border-0 shadow-xl shadow-blue-600/25 rounded-xl py-4 font-semibold tracking-wide mt-3 transition-all duration-300"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-slate-400" />
                <span>Authorized Personnel Only</span>
              </p>
            </div>
          </GlassCard>

          {/* Student Access Card */}
          <GlassCard
            className="rounded-3xl p-8 md:p-10 cursor-pointer group border-l-4 border-l-amber-400/80 hover:border-l-amber-300 hover:bg-white/[0.12] transition-all duration-500"
            delay={0.3}
            onClick={() => window.location.href = '/catalog'}
          >
            <div className="h-full flex flex-col">
              {/* Card Header */}
              <div className="mb-6">
                <motion.div
                  className="w-16 h-16 mb-5 relative"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl blur-lg opacity-50" />
                  <div className="relative w-full h-full bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-xl">
                    <BookOpen className="text-white" size={28} />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                  Student Access
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="text-amber-400 opacity-70" size={22} />
                  </motion.div>
                </h2>
                <p className="text-slate-400 text-sm">Public library kiosk</p>
              </div>

              {/* Description */}
              <p className="text-slate-300 leading-relaxed mb-8 flex-grow">
                Browse the catalog, check book availability, and explore our collection. No login required.
              </p>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 rounded-xl bg-amber-400/10 text-amber-300 text-sm font-medium border border-amber-400/20 hover:bg-amber-400/20 transition-colors">
                  📚 Browse Catalog
                </span>
                <span className="px-4 py-2 rounded-xl bg-amber-400/10 text-amber-300 text-sm font-medium border border-amber-400/20 hover:bg-amber-400/20 transition-colors">
                  🔍 Search Books
                </span>
                <span className="px-4 py-2 rounded-xl bg-amber-400/10 text-amber-300 text-sm font-medium border border-amber-400/20 hover:bg-amber-400/20 transition-colors">
                  ✨ View Availability
                </span>
              </div>

              {/* CTA */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-slate-400 group-hover:text-white transition-colors">
                  <span className="text-sm font-medium">Enter Library Kiosk</span>
                  <motion.div
                    className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                  >
                    <ArrowRight size={18} className="text-amber-400" />
                  </motion.div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-center mt-10 text-xs text-slate-600 font-medium"
        >
          {libraryShortName} LMS v2.0
        </motion.div>
      </div>
    </div>
  );
}
