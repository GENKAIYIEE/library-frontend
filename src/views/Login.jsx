import { useState } from "react";
import axiosClient from "../axios-client";
import { Library, User, Lock, AlertCircle } from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import Button from "../components/ui/Button";
import LoginTransition from "../components/LoginTransition";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
      {/* Book Opening Transition Animation */}
      {showTransition && (
        <LoginTransition onFinish={() => window.location.reload()} />
      )}

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10 px-4">
        {/* Institution Header */}
        <div className="text-center mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-2xl inline-block mb-4">
            <Library size={48} className="text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PCLU Library</h1>
          <p className="text-white/70 text-sm">Admin Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Login</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Sign in to access the dashboard</p>
          </div>

          {/* Global Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-4 rounded-xl mb-6 flex items-start gap-3">
              <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Authentication Failed</p>
                <p className="text-sm mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <FloatingInput
              label="Username"
              type="text"
              name="username"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: null }));
              }}
              icon={User}
              required
              error={fieldErrors.username}
            />

            <FloatingInput
              label="Password"
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
              }}
              icon={Lock}
              required
              error={fieldErrors.password}
            />

            <Button
              type="submit"
              variant="form"
              fullWidth
              loading={loading}
              className="mt-6"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Authorized personnel only. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-white/50">
          &copy; 2026 PCLU Library System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
