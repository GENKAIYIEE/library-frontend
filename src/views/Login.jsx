import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import {
  Library, User, Lock, AlertCircle, ArrowRight, BookOpen,
  TrendingUp, Users, ShieldCheck, CheckCircle2, Globe, Sparkles
} from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import Button from "../components/ui/Button";
import LoginTransition from "../components/LoginTransition";
import { motion, AnimatePresence } from "framer-motion";

// --- Internal Components ---

const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={`relative overflow-hidden bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const StatTicker = () => {
  const stats = [
    { label: "Active Users", value: "2,450+", icon: Users, color: "text-blue-400" },
    { label: "Books Circulated", value: "15,300", icon: BookOpen, color: "text-emerald-400" },
    { label: "Digital Resources", value: "8,900+", icon: Globe, color: "text-purple-400" },
    { label: "System Uptime", value: "99.9%", icon: ShieldCheck, color: "text-green-400" },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % stats.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2 border border-white/10">
      <div className="bg-blue-500/20 p-1.5 rounded-full">
        <TrendingUp size={14} className="text-blue-400" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 min-w-[140px]"
        >
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{stats[index].label}</span>
          <span className={`text-sm font-bold ${stats[index].color}`}>{stats[index].value}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [secureConnection, setSecureConnection] = useState(false);

  // Simulate SSL/Security Check on mount
  useEffect(() => {
    setTimeout(() => setSecureConnection(true), 1500);
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
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30 overflow-hidden relative flex items-center justify-center p-4 lg:p-8">

      {/* --- BACKGROUND ANIMATION --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-cyan-500/10 rounded-full blur-[80px]" />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* --- TRANSITION --- */}
      {showTransition && <LoginTransition onFinish={() => window.location.reload()} />}

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min lg:h-[650px]">

        {/* 1. HERO SECTION (Top Left - Large) */}
        <GlassCard className="col-span-1 md:col-span-2 lg:col-span-8 lg:row-span-8 rounded-[2.5rem] p-10 flex flex-col justify-between group overflow-hidden" delay={0.1}>
          {/* Abstract Decoration */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 -top-40 w-[500px] h-[500px] border-[60px] border-white/5 rounded-full blur-sm opacity-50"
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                <Library className="text-blue-400" size={20} />
                <span className="font-bold tracking-widest text-sm text-blue-100">PCLU LIBRARY</span>
              </div>
              <StatTicker />
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent drop-shadow-sm">
              The Future of <br /> Knowledge.
            </h1>
            <p className="text-lg text-blue-200/80 max-w-2xl leading-relaxed">
              Experience the next generation of library management.
              Real-time tracking, seamless circulation, and advanced analytics
              powered by intelligent automation.
            </p>
          </div>

          {/* Bottom Actions of Hero */}
          <div className="relative z-10 mt-12 flex flex-wrap gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0f172a] bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center text-slate-800 font-bold text-xs relative z-0 hover:z-10 hover:scale-110 transition-transform">
                  <User size={16} className="opacity-50" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#0f172a] bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                +2k
              </div>
            </div>
            <p className="flex items-center text-sm text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              System Online & Operational
            </p>
          </div>
        </GlassCard>

        {/* 2. LOGIN FORM (Right - Vertical) */}
        <GlassCard className="col-span-1 md:col-span-1 lg:col-span-4 lg:row-span-12 rounded-[2.5rem] p-8 flex flex-col justify-center border-t-4 border-t-blue-500" delay={0.2}>
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
              <Lock className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Admin Portal</h2>
            <p className="text-slate-400 text-sm mt-1">Secure Access Required</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3"
              >
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <p className="text-red-200 text-xs">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1">
              <FloatingInput
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={User}
                error={fieldErrors.username}
                className="bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1">
              <FloatingInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                error={fieldErrors.password}
                className="bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                {secureConnection ? (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                ) : (
                  <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                )}
                <span>{secureConnection ? "Secure Connection" : "Verifying..."}</span>
              </div>
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</a>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-600/30 rounded-xl py-4 font-bold tracking-wide mt-2"
            >
              AUTHENTICATE
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
              <ShieldCheck size={12} /> Authorized Personnel Only
            </p>
          </div>
        </GlassCard>

        {/* 3. STUDENT ACCESS CARD (Bottom Left - Medium) */}
        <GlassCard
          className="col-span-1 md:col-span-1 lg:col-span-5 lg:row-span-4 rounded-[2.5rem] p-6 cursor-pointer group hover:bg-white/15 transition-colors border-l-4 border-l-yellow-400"
          delay={0.3}
        >
          <div className="h-full flex flex-col justify-between" onClick={() => window.location.href = '/catalog'}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="text-yellow-400" size={20} />
                  Student Access
                </h3>
                <ArrowRight className="text-white/50 group-hover:translate-x-1 group-hover:text-white transition-all" size={20} />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Browse the catalog, check book availability, and view trending resources via the Kiosk.
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <span className="px-3 py-1 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-bold border border-yellow-400/20">Catalog</span>
              <span className="px-3 py-1 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-bold border border-yellow-400/20">Kiosk</span>
            </div>
          </div>
        </GlassCard>

        {/* 4. STATS / INFO CARD (Bottom Center - Small) */}
        <GlassCard className="col-span-1 md:col-span-1 lg:col-span-3 lg:row-span-4 rounded-[2.5rem] p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-emerald-900/40 to-slate-900/40 border-emerald-500/20" delay={0.4}>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 animate-pulse">
            <Sparkles className="text-emerald-400" size={24} />
          </div>
          <h4 className="text-2xl font-bold text-emerald-100 mb-1">New Arrivals</h4>
          <p className="text-xs text-emerald-300/70 mb-3">50+ New Books Details</p>
        </GlassCard>

      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-[10px] text-slate-600 font-mono">
        PCLU LMS v2.0 • Build 2026.01.27
      </div>

    </div>
  );
}
