import { useState, useEffect, useCallback, memo, lazy, Suspense } from "react";
import axiosClient from "../axios-client";
import {
  User, Lock, AlertCircle, ArrowRight, BookOpen,
  ShieldCheck, CheckCircle2
} from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import Button from "../components/ui/Button";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLibrarySettings } from "../context/LibrarySettingsContext";

import LoginTransition from "../components/LoginTransition";

// --- Memoized Glass Card Component ---
const GlassCard = memo(({ children, className = "", delay = 0, onClick }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.6,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`relative overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-2xl ${className}`}
      onClick={onClick}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

// --- Optimized Background Component ---
const OptimizedBackground = memo(() => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    // Static background for reduced motion preference
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-30%] left-[-15%] w-[80vw] h-[80vw] bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent rounded-full blur-[80px]" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[70vw] h-[70vw] bg-gradient-to-tl from-indigo-600/15 via-purple-500/10 to-transparent rounded-full blur-[70px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
            backgroundSize: '48px 48px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* CSS-animated background orbs - significantly more performant than JS */}
      <style>{`
        @keyframes orb-pulse-1 {
          0%, 100% { transform: scale(1) translateZ(0); opacity: 0.15; }
          50% { transform: scale(1.15) translateZ(0); opacity: 0.22; }
        }
        @keyframes orb-pulse-2 {
          0%, 100% { transform: scale(1.1) translateZ(0); opacity: 0.1; }
          50% { transform: scale(1) translateZ(0); opacity: 0.18; }
        }
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) translateZ(0); }
          50% { transform: translate(30px, -20px) translateZ(0); }
        }
        .orb-1 {
          animation: orb-pulse-1 10s ease-in-out infinite;
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        .orb-2 {
          animation: orb-pulse-2 12s ease-in-out 1s infinite;
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        .orb-3 {
          animation: orb-float 18s ease-in-out infinite;
          will-change: transform;
          transform: translateZ(0);
        }
      `}</style>

      {/* Primary Gradient Orbs - Using CSS animations */}
      <div className="orb-1 absolute top-[-30%] left-[-15%] w-[80vw] h-[80vw] bg-gradient-to-br from-blue-600/25 via-blue-500/15 to-transparent rounded-full blur-[80px]" />
      <div className="orb-2 absolute bottom-[-30%] right-[-15%] w-[70vw] h-[70vw] bg-gradient-to-tl from-indigo-600/20 via-purple-500/10 to-transparent rounded-full blur-[70px]" />
      <div className="orb-3 absolute top-[30%] right-[20%] w-[30vw] h-[30vw] bg-cyan-500/8 rounded-full blur-[60px]" />

      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}
      />

      {/* Vignette Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
    </div>
  );
});

OptimizedBackground.displayName = 'OptimizedBackground';

// --- Arrow Animation Component (CSS-based) ---
const AnimatedArrow = memo(() => (
  <>
    <style>{`
      @keyframes arrow-bounce {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(5px); }
      }
      .arrow-animated {
        animation: arrow-bounce 1.5s ease-in-out infinite;
        will-change: transform;
      }
    `}</style>
    <span className="arrow-animated inline-block">
      <ArrowRight className="text-amber-400 opacity-70" size={22} />
    </span>
  </>
));

AnimatedArrow.displayName = 'AnimatedArrow';

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [secureConnection, setSecureConnection] = useState(false);
  const { libraryName, libraryShortName } = useLibrarySettings();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setSecureConnection(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Memoized validation function
  const validateForm = useCallback(() => {
    const errors = {};
    if (!username) errors.username = "Username is required";
    else if (username.length < 3) errors.username = "Min 3 characters";

    if (!password) errors.password = "Password is required";
    else if (password.length < 4) errors.password = "Min 4 characters";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [username, password]);

  // Memoized submit handler
  const onSubmit = useCallback((ev) => {
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
  }, [username, password, validateForm]);

  // Memoized input handlers
  const handleUsernameChange = useCallback((e) => setUsername(e.target.value), []);
  const handlePasswordChange = useCallback((e) => setPassword(e.target.value), []);
  const handleStudentAccess = useCallback(() => window.location.href = '/catalog', []);
  const handleTransitionFinish = useCallback(() => window.location.reload(), []);

  // Animation variants with reduced motion support
  const headerVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1a] via-[#0f172a] to-[#0c1322] text-white font-sans selection:bg-blue-500/30 overflow-hidden relative flex items-center justify-center p-4 lg:p-8">

      {/* --- OPTIMIZED BACKGROUND --- */}
      <OptimizedBackground />

      {/* --- DIRECT LOAD TRANSITION --- */}
      <AnimatePresence>
        {showTransition && (
          <LoginTransition onFinish={handleTransitionFinish} />
        )}
      </AnimatePresence>

      {/* --- MAIN LAYOUT --- */}
      <div className="relative z-10 w-full max-w-5xl">

        {/* School Branding Header */}
        <motion.div
          initial={headerVariants.initial}
          animate={headerVariants.animate}
          transition={headerVariants.transition}
          className="text-center mb-10"
        >
          {/* Logo with Glow Effect */}
          <motion.div
            className="relative inline-block mb-6"
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl scale-150 opacity-60" />
            <div
              className="relative w-24 h-24 mx-auto bg-gradient-to-br from-white/15 to-white/5 rounded-3xl border border-white/20 backdrop-blur-lg flex items-center justify-center shadow-2xl shadow-blue-500/20"
              style={{ transform: 'translateZ(0)' }}
            >
              <img
                src="/pclu-logo.png"
                alt="School Logo"
                className="w-16 h-16 object-contain drop-shadow-lg"
                loading="eager"
              />
            </div>
          </motion.div>

          {/* School Name */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.3, duration: shouldReduceMotion ? 0.2 : 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3"
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              {libraryName || "Library Management System"}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.4, duration: shouldReduceMotion ? 0.2 : 0.8 }}
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
                whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: 5 }}
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
                onChange={handleUsernameChange}
                icon={User}
                error={fieldErrors.username}
                className="bg-slate-800/50 border-slate-700/50 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
              <FloatingInput
                label="Password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                icon={Lock}
                error={fieldErrors.password}
                className="bg-slate-800/50 border-slate-700/50 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-400">
                  {secureConnection ? (
                    <motion.div
                      initial={shouldReduceMotion ? {} : { scale: 0 }}
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
            onClick={handleStudentAccess}
          >
            <div className="h-full flex flex-col">
              {/* Card Header */}
              <div className="mb-6">
                <motion.div
                  className="w-16 h-16 mb-5 relative"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl blur-lg opacity-50" />
                  <div className="relative w-full h-full bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-xl">
                    <BookOpen className="text-white" size={28} />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                  Student Access
                  <AnimatedArrow />
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
                    whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
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
          transition={{ delay: shouldReduceMotion ? 0 : 0.6, duration: shouldReduceMotion ? 0.2 : 0.8 }}
          className="text-center mt-10 text-xs text-slate-600 font-medium"
        >
          {libraryShortName} LMS v2.0
        </motion.div>
      </div>
    </div>
  );
}
