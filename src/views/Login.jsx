import { useState } from "react";
import axiosClient from "../axios-client";
import { Library, User, Lock, AlertCircle, ArrowRight, BookOpen } from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import Button from "../components/ui/Button";
import LoginTransition from "../components/LoginTransition";
import { motion } from "framer-motion";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!username) {
      errors.username = "Username is required";
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 4) {
      errors.password = "Password must be at least 4 characters";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    axiosClient.post("/login", {
      username,
      password,
    })
      .then(({ data }) => {
        localStorage.setItem("ACCESS_TOKEN", data.token);
        localStorage.setItem("USER_NAME", data.user.name);
        localStorage.setItem("USER_ROLE", data.user.role);
        // Trigger the book opening animation
        setShowTransition(true);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        const response = err.response;
        if (response && response.status === 401) {
          setError("Invalid username or password. Please try again.");
        } else {
          setError("Connection error. Please check if the server is running.");
        }
      });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      {/* Book Opening Transition Animation */}
      {showTransition && (
        <LoginTransition onFinish={() => window.location.reload()} />
      )}

      {/* LEFT PANEL - LANDING / HERO */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-blue-600 overflow-hidden items-center justify-center p-12">
        {/* Animated Background Shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-blue-500 rounded-full blur-3xl opacity-50 pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-3xl opacity-50 pointer-events-none"
        />

        <div className="relative z-10 max-w-2xl text-left text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Library size={18} />
              <span className="font-bold text-sm tracking-wide">PCLU LIBRARY SYSTEM</span>
            </div>
            <h1 className="text-6xl font-black mb-6 leading-tight">
              Knowledge at <br /> Your Fingertips.
            </h1>
            <p className="text-blue-100 text-lg mb-10 leading-relaxed max-w-lg">
              Access thousands of books, journals, and resources. Manage circulation, track inventory, and empower learning with our advanced management system.
            </p>

            {/* STUDENT CTA */}
            <div className="p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all group cursor-pointer" onClick={() => window.location.href = '/catalog'}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <BookOpen className="text-yellow-400" />
                  Are you a Student?
                </h3>
                <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight size={20} strokeWidth={3} />
                </div>
              </div>
              <p className="text-blue-100 opacity-80 group-hover:opacity-100 transition-opacity">
                Browse the catalog, find books, and check availability instantly via our Kiosk.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-20 relative z-20">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden mb-8 text-center">
          <div className="inline-block p-4 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Library size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">PCLU Library</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 lg:p-12 mb-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Login</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Enter your credentials to access the dashboard.</p>
            </div>

            {/* Global Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 text-sm">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <FloatingInput
                label="Username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: null });
                }}
                icon={User}
                error={fieldErrors.username}
              />

              <div className="space-y-1">
                <FloatingInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                  }}
                  icon={Lock}
                  error={fieldErrors.password}
                />
                <div className="flex justify-end">
                  <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700">Forgot Password?</a>
                </div>
              </div>

              <Button type="submit" variant="form" fullWidth loading={loading} size="lg" className="rounded-xl py-4 shadow-lg shadow-blue-500/20">
                Sign In to Dashboard
              </Button>
            </form>
          </div>

          {/* Mobile Student Link */}
          <div className="lg:hidden text-center bg-blue-50 dark:bg-slate-800 p-6 rounded-2xl border border-blue-100 dark:border-slate-700 cursor-pointer" onClick={() => window.location.href = '/catalog'}>
            <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center justify-center gap-2">
              <BookOpen size={18} /> Student Access
            </h4>
            <p className="text-sm text-slate-500">Tap here to browse the book catalog</p>
          </div>

          <p className="text-center mt-12 text-xs text-slate-400">
            &copy; 2026 PCLU Library System. <br /> Secured Audit Logging Enabled.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
