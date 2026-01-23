import { useState, useCallback } from "react";
import axiosClient from "../axios-client";
import Swal from "sweetalert2";
import {
    UserPlus, Shield, Eye, EyeOff,
    RefreshCw, Mail, User, Lock, ChevronRight
} from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import FloatingSelect from "../components/ui/FloatingSelect";
import Button from "../components/ui/Button";

export default function UserManagement() {
    // Form Fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [permissions, setPermissions] = useState("");

    // Form State
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Generate secure password
    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let result = "";
        const array = new Uint32Array(16);
        crypto.getRandomValues(array);
        for (let i = 0; i < 16; i++) {
            result += chars[array[i] % chars.length];
        }
        setPassword(result);
        setShowPassword(true);
    };

    // Validate unique fields
    const checkUnique = useCallback(async (field, value) => {
        if (!value) return true;
        try {
            const { data } = await axiosClient.post("/users/check-unique", { field, value });
            if (!data.is_unique) {
                setErrors(prev => ({ ...prev, [field]: data.message }));
                return false;
            }
            setErrors(prev => ({ ...prev, [field]: null }));
            return true;
        } catch {
            return true;
        }
    }, []);

    // Reset form
    const resetForm = () => {
        setName("");
        setEmail("");
        setUsername("");
        setPassword("");
        setPermissions("");
        setErrors({});
        setShowPassword(false);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Validate unique fields
        const emailUnique = await checkUnique("email", email);
        const usernameUnique = await checkUnique("username", username);

        if (!emailUnique || !usernameUnique) {
            setLoading(false);
            return;
        }

        const payload = {
            account_type: "admin",
            name,
            email,
            username,
            password,
            permissions,
        };

        try {
            const { data } = await axiosClient.post("/users", payload);

            Swal.fire({
                title: "Account Created!",
                html: `<p class="text-gray-600">New Admin <strong>${data.user.name}</strong> created successfully.</p>
               <p class="mt-2 text-sm text-gray-500">Username: <code class="bg-gray-100 px-2 py-1 rounded">${username}</code></p>`,
                icon: "success",
                confirmButtonColor: "#2563eb",
            });

            resetForm();
        } catch (err) {
            const message = err.response?.data?.message || "Failed to create account.";
            Swal.fire("Error", message, "error");

            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
                    <UserPlus size={28} className="text-white" />
                </div>
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-1">
                        <span>User Management</span>
                        <ChevronRight size={14} />
                        <span className="text-primary-600 dark:text-primary-400 font-semibold">Add New Account</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create Administrator Account</h2>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-700">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
                            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                                <Shield size={24} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">New Administrator</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Create a new admin account with system access</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <FloatingInput
                                label="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                icon={User}
                                required
                                error={errors.name}
                            />

                            <FloatingInput
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => checkUnique("email", email)}
                                icon={Mail}
                                required
                                error={errors.email}
                            />

                            <FloatingInput
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onBlur={() => checkUnique("username", username)}
                                icon={User}
                                required
                                error={errors.username}
                            />

                            <div className="relative">
                                <FloatingInput
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    icon={Lock}
                                    required
                                    error={errors.password}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition"
                                        title="Generate Secure Password"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>

                            <FloatingSelect
                                label="Permissions Level"
                                value={permissions}
                                onChange={(e) => setPermissions(e.target.value)}
                                required
                                error={errors.permissions}
                            >
                                <option value="full_access">Full Access</option>
                                <option value="read_only">Read Only</option>
                            </FloatingSelect>

                            <Button
                                type="submit"
                                variant="form"
                                fullWidth
                                loading={loading}
                            >
                                Create Administrator Account
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Right Side - Info Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg p-6 border border-primary-500">
                        <div className="text-white">
                            <Shield size={48} className="mb-4 opacity-80" />
                            <h3 className="text-xl font-bold mb-2">Administrator Account</h3>
                            <p className="text-sm opacity-80 mb-4">
                                Administrators can access the dashboard, manage books, students, and view reports.
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-white/60" />
                                    <span className="opacity-80">Full Access: All features</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-white/60" />
                                    <span className="opacity-80">Read Only: View only</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password Tips */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-800/50">
                        <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                            <Lock size={18} />
                            Password Security Tips
                        </h4>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                            <li>• Use the Generate button for a secure password</li>
                            <li>• Minimum 8 characters recommended</li>
                            <li>• Share credentials securely with the user</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
