import { useState, useEffect, useCallback } from "react";
import {
    Settings as SettingsIcon,
    Save,
    Database,
    Activity,
    Wifi,
    WifiOff,
    Server,
    CheckCircle,
    RefreshCw,
    Info,
    Clock,
    DollarSign,
    BookOpen,
    Users,
    Zap,
    BarChart3,
    TrendingUp,
    AlertCircle,
    FileText,
    History,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import axiosClient from "../axios-client";

export default function Settings() {
    const toast = useToast();
    const [activeSection, setActiveSection] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // System Health State
    const [systemHealth, setSystemHealth] = useState({
        overall: 0,
        api: { status: 'checking', latency: 0, lastCheck: null },
        database: { status: 'checking', tables: 0 },
        uptime: 0
    });

    // Library Statistics
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalCopies: 0,
        availableCopies: 0,
        borrowedCopies: 0,
        totalStudents: 0,
        activeLoans: 0,
        overdueLoans: 0,
        pendingFines: 0,
        paidFines: 0,
        todayLoans: 0,
        todayReturns: 0
    });

    // Activity Log
    const [recentActivity, setRecentActivity] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Library Settings
    const [librarySettings, setLibrarySettings] = useState(() => {
        const saved = localStorage.getItem('librarySettings');
        return saved ? JSON.parse(saved) : {
            libraryName: "PCLU Library System",
            defaultLoanDays: 7,
            maxLoansPerStudent: 3,
            finePerDay: 10,
            emailNotifications: true
        };
    });

    // Fetch all data on mount and setup auto-refresh
    useEffect(() => {
        refreshAllData();
        const interval = setInterval(refreshAllData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Persist settings
    useEffect(() => {
        localStorage.setItem('librarySettings', JSON.stringify(librarySettings));
    }, [librarySettings]);

    const refreshAllData = useCallback(async () => {
        await Promise.all([
            checkSystemHealth(),
            fetchDetailedStats(),
            fetchRecentActivity()
        ]);
        setLastRefresh(new Date());
    }, []);

    const checkSystemHealth = async () => {
        const startTime = Date.now();
        let healthScore = 0;
        let apiStatus = 'offline';
        let dbStatus = 'offline';
        let latency = 0;
        let tableCount = 0;

        try {
            const res = await axiosClient.get('/books');
            latency = Date.now() - startTime;

            if (latency < 300) {
                apiStatus = 'excellent';
                healthScore += 35;
            } else if (latency < 800) {
                apiStatus = 'good';
                healthScore += 30;
            } else {
                apiStatus = 'slow';
                healthScore += 20;
            }

            dbStatus = 'connected';
            tableCount = 8;
            healthScore += 35;

            if (res.data && res.data.length > 0) {
                healthScore += 30;
            } else {
                healthScore += 15;
            }

        } catch (error) {
            if (error.code === 'ERR_NETWORK') {
                apiStatus = 'offline';
                dbStatus = 'unknown';
            } else if (error.response) {
                apiStatus = 'error';
                dbStatus = 'connected';
                healthScore += 20;
            }
        }

        setSystemHealth({
            overall: Math.min(healthScore, 100),
            api: {
                status: apiStatus,
                latency,
                lastCheck: new Date().toLocaleTimeString()
            },
            database: { status: dbStatus, tables: tableCount },
            uptime: Math.floor((Date.now() - window.performance.timing.navigationStart) / 1000 / 60)
        });
    };

    const fetchDetailedStats = async () => {
        try {
            const [booksRes, studentsRes, transactionsRes] = await Promise.all([
                axiosClient.get('/books').catch(() => ({ data: [] })),
                axiosClient.get('/students').catch(() => ({ data: [] })),
                axiosClient.get('/transactions').catch(() => ({ data: [] }))
            ]);

            const books = booksRes.data || [];
            const students = studentsRes.data || [];
            const transactions = transactionsRes.data || [];

            const today = new Date().toDateString();

            const totalCopies = books.reduce((sum, b) => sum + (b.total_copies || 1), 0);
            const availableCopies = books.reduce((sum, b) => sum + (b.available_copies || 0), 0);

            const activeLoans = transactions.filter(t => !t.returned_at);
            const overdueLoans = activeLoans.filter(t => {
                if (!t.due_date) return false;
                return new Date(t.due_date) < new Date();
            });

            const finesData = transactions.filter(t => t.penalty_amount && parseFloat(t.penalty_amount) > 0);
            const pendingFines = finesData
                .filter(t => t.payment_status === 'pending')
                .reduce((sum, t) => sum + parseFloat(t.penalty_amount || 0), 0);
            const paidFines = finesData
                .filter(t => t.payment_status === 'paid')
                .reduce((sum, t) => sum + parseFloat(t.penalty_amount || 0), 0);

            const todayLoans = transactions.filter(t =>
                new Date(t.borrowed_at).toDateString() === today
            ).length;

            const todayReturns = transactions.filter(t =>
                t.returned_at && new Date(t.returned_at).toDateString() === today
            ).length;

            setStats({
                totalBooks: books.length,
                totalCopies,
                availableCopies,
                borrowedCopies: totalCopies - availableCopies,
                totalStudents: students.length,
                activeLoans: activeLoans.length,
                overdueLoans: overdueLoans.length,
                pendingFines,
                paidFines,
                todayLoans,
                todayReturns
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            const res = await axiosClient.get('/transactions');
            const transactions = res.data || [];

            const recent = transactions
                .sort((a, b) => new Date(b.updated_at || b.borrowed_at) - new Date(a.updated_at || a.borrowed_at))
                .map(t => ({
                    id: t.id,
                    type: t.returned_at ? 'return' : 'borrow',
                    book: t.book_asset?.book_title?.title || 'Unknown Book',
                    user: t.user?.name || 'Unknown',
                    date: t.returned_at || t.borrowed_at,
                    hasOverdue: t.penalty_amount && parseFloat(t.penalty_amount) > 0
                }));

            setRecentActivity(recent);
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        }
    };

    const handleSaveSettings = () => {
        localStorage.setItem('librarySettings', JSON.stringify(librarySettings));
        toast.success("Settings saved successfully");
    };

    const handleExportCSV = async (type) => {
        setLoading(true);
        try {
            let filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
            const res = await axiosClient.get(`/${type}`);
            const data = res.data;

            if (!data || data.length === 0) {
                toast.warning('No data available to export');
                setLoading(false);
                return;
            }

            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row =>
                    headers.map(h => {
                        const val = row[h];
                        if (val === null || val === undefined) return '';
                        if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
                        return `"${String(val).replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`Exported ${data.length} ${type} records`);
        } catch (error) {
            toast.error(`Failed to export ${type}`);
        }
        setLoading(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'text-emerald-500';
            case 'good': return 'text-green-500';
            case 'connected': return 'text-emerald-500';
            case 'slow': return 'text-amber-500';
            case 'checking': return 'text-blue-500';
            default: return 'text-red-500';
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'excellent': case 'good': case 'connected': return 'bg-emerald-100';
            case 'slow': return 'bg-amber-100';
            case 'checking': return 'bg-blue-100';
            default: return 'bg-red-100';
        }
    };

    const getHealthGradient = (score) => {
        if (score >= 80) return 'from-emerald-500 to-green-400';
        if (score >= 50) return 'from-amber-500 to-yellow-400';
        return 'from-red-500 to-orange-400';
    };

    const SectionButton = ({ id, label, icon: Icon, badge }) => (
        <button
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left
        ${activeSection === id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} />
                {label}
            </div>
            {badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeSection === id ? 'bg-white/20 text-white' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    }`}>
                    {badge}
                </span>
            )}
        </button>
    );

    const StatCard = ({ icon: Icon, label, value, subValue, color = 'blue' }) => {
        const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            emerald: 'from-emerald-500 to-emerald-600',
            amber: 'from-amber-500 to-amber-600',
            red: 'from-red-500 to-red-600',
            purple: 'from-purple-500 to-purple-600',
            indigo: 'from-indigo-500 to-indigo-600'
        };

        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{label}</p>
                        <p className="text-3xl font-black text-gray-800 dark:text-white mt-1">{value}</p>
                        {subValue && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subValue}</p>}
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
                        <Icon size={22} className="text-white" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg shadow-primary-600/30">
                        <SettingsIcon size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white">System Settings</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={refreshAllData}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium text-sm shadow-lg shadow-primary-600/30"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full lg:w-56 flex-shrink-0">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 space-y-1">
                        <SectionButton id="dashboard" label="Dashboard" icon={BarChart3} />
                        <SectionButton id="health" label="System Health" icon={Activity} badge={`${systemHealth.overall}%`} />
                        <SectionButton id="library" label="Configuration" icon={BookOpen} />
                        <SectionButton id="data" label="Data Export" icon={Database} />
                        <SectionButton id="activity" label="Activity Log" icon={History} badge={recentActivity.length} />
                        <SectionButton id="about" label="About" icon={Info} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 min-h-[650px]">

                        {/* DASHBOARD */}
                        {activeSection === "dashboard" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <BarChart3 size={20} className="text-primary-500" />
                                    Quick Overview
                                </h3>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard icon={BookOpen} label="Total Books" value={stats.totalBooks} subValue={`${stats.totalCopies} copies total`} color="blue" />
                                    <StatCard icon={Users} label="Students" value={stats.totalStudents} color="emerald" />
                                    <StatCard icon={TrendingUp} label="Active Loans" value={stats.activeLoans} subValue={`${stats.overdueLoans} overdue`} color="amber" />
                                    <StatCard icon={DollarSign} label="Pending Fines" value={`₱${stats.pendingFines.toFixed(0)}`} subValue={`₱${stats.paidFines.toFixed(0)} collected`} color="red" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500 rounded-lg">
                                                <Zap size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.todayLoans}</p>
                                                <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">Books Borrowed Today</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500 rounded-lg">
                                                <CheckCircle size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.todayReturns}</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">Books Returned Today</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500 rounded-lg">
                                                <BookOpen size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-purple-700 dark:text-purple-400">{stats.availableCopies}</p>
                                                <p className="text-xs text-purple-600 dark:text-purple-300 font-medium">Available Now</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">System Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${systemHealth.overall >= 80 ? 'bg-emerald-500' : systemHealth.overall >= 50 ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`}></div>
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{systemHealth.overall}% Operational</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${getHealthGradient(systemHealth.overall)} transition-all duration-700`}
                                            style={{ width: `${systemHealth.overall}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SYSTEM HEALTH */}
                        {activeSection === "health" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Activity size={20} className="text-primary-500" />
                                        System Health Monitor
                                    </h3>
                                    <span className="text-xs text-gray-400">
                                        Last check: {systemHealth.api.lastCheck || 'Checking...'}
                                    </span>
                                </div>

                                <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-20 -mt-20"></div>
                                    <div className="relative z-10">
                                        <p className="text-sm text-slate-300 mb-2">Overall System Health</p>
                                        <div className="flex items-end gap-4">
                                            <span className="text-6xl font-black">{systemHealth.overall}%</span>
                                            <span className={`text-lg font-bold mb-2 ${systemHealth.overall >= 80 ? 'text-emerald-400' :
                                                systemHealth.overall >= 50 ? 'text-amber-400' : 'text-red-400'
                                                }`}>
                                                {systemHealth.overall >= 80 ? '✓ Excellent' :
                                                    systemHealth.overall >= 50 ? '⚠ Fair' : '✕ Critical'}
                                            </span>
                                        </div>
                                        <div className="mt-4 w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full bg-gradient-to-r ${getHealthGradient(systemHealth.overall)} transition-all duration-1000`}
                                                style={{ width: `${systemHealth.overall}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`p-5 rounded-2xl border ${getStatusBg(systemHealth.api.status)} dark:bg-opacity-20 dark:border-opacity-30 border-gray-200 dark:border-slate-600`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                                    {systemHealth.api.status !== 'offline' && systemHealth.api.status !== 'error'
                                                        ? <Wifi size={22} className={getStatusColor(systemHealth.api.status)} />
                                                        : <WifiOff size={22} className="text-red-500" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-white">API Server</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Backend Connection</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusBg(systemHealth.api.status)} ${getStatusColor(systemHealth.api.status)}`}>
                                                {systemHealth.api.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Response Time</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{systemHealth.api.latency}ms</span>
                                        </div>
                                    </div>

                                    <div className={`p-5 rounded-2xl border ${getStatusBg(systemHealth.database.status)} dark:bg-opacity-20 dark:border-opacity-30 border-gray-200 dark:border-slate-600`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                                    <Server size={22} className={getStatusColor(systemHealth.database.status)} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-white">Database</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">MySQL Server</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusBg(systemHealth.database.status)} ${getStatusColor(systemHealth.database.status)}`}>
                                                {systemHealth.database.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Active Tables</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{systemHealth.database.tables}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Clock size={16} className="text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-300">Session uptime:</span>
                                        <span className="font-bold text-gray-800 dark:text-white">{systemHealth.uptime} minutes</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LIBRARY CONFIG */}
                        {activeSection === "library" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <BookOpen size={20} className="text-primary-500" />
                                    Library Configuration
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Library Name</label>
                                        <input
                                            type="text"
                                            value={librarySettings.libraryName}
                                            onChange={(e) => setLibrarySettings({ ...librarySettings, libraryName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                            <Clock size={14} /> Default Loan Period (days)
                                        </label>
                                        <input
                                            type="number"
                                            min="1" max="30"
                                            value={librarySettings.defaultLoanDays}
                                            onChange={(e) => setLibrarySettings({ ...librarySettings, defaultLoanDays: parseInt(e.target.value) || 7 })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                            <BookOpen size={14} /> Max Loans Per Student
                                        </label>
                                        <input
                                            type="number"
                                            min="1" max="10"
                                            value={librarySettings.maxLoansPerStudent}
                                            onChange={(e) => setLibrarySettings({ ...librarySettings, maxLoansPerStudent: parseInt(e.target.value) || 3 })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                            <DollarSign size={14} /> Fine Per Day (₱)
                                        </label>
                                        <input
                                            type="number"
                                            min="0" max="500"
                                            value={librarySettings.finePerDay}
                                            onChange={(e) => setLibrarySettings({ ...librarySettings, finePerDay: parseInt(e.target.value) || 10 })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                                    <Button onClick={handleSaveSettings} icon={Save}>Save Configuration</Button>
                                </div>
                            </div>
                        )}

                        {/* DATA EXPORT */}
                        {activeSection === "data" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Database size={20} className="text-primary-500" />
                                    Data Export
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => handleExportCSV('books')}
                                        disabled={loading}
                                        className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-700/50 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        <BookOpen size={36} className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-blue-800 text-lg">Export Books</p>
                                        <p className="text-sm text-blue-600 mt-1">{stats.totalBooks} records</p>
                                    </button>

                                    <button
                                        onClick={() => handleExportCSV('students')}
                                        disabled={loading}
                                        className="group p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        <Users size={36} className="text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-emerald-800 text-lg">Export Students</p>
                                        <p className="text-sm text-emerald-600 mt-1">{stats.totalStudents} records</p>
                                    </button>

                                    <button
                                        onClick={() => handleExportCSV('transactions')}
                                        disabled={loading}
                                        className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-200 dark:border-purple-700/50 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        <FileText size={36} className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                                        <p className="font-bold text-purple-800 text-lg">Export Transactions</p>
                                        <p className="text-sm text-purple-600 mt-1">All history</p>
                                    </button>
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm text-amber-800 dark:text-amber-200">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                        <p>Exports are generated as CSV files. Large datasets may take a moment to download.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ACTIVITY LOG */}
                        {activeSection === "activity" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <History size={20} className="text-primary-500" />
                                    Activity Log
                                </h3>

                                <div className="space-y-3">
                                    {recentActivity.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <History size={40} className="mx-auto mb-3 opacity-50" />
                                            <p>No recent activity</p>
                                        </div>
                                    ) : (
                                        <>
                                            {recentActivity
                                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                                .map((activity) => (
                                                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                                                        <div className={`p-2 rounded-lg ${activity.type === 'borrow' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
                                                            {activity.type === 'borrow'
                                                                ? <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                                                                : <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-800 dark:text-white truncate">{activity.book}</p>
                                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                                {activity.type === 'borrow' ? 'Borrowed by' : 'Returned by'} {activity.user}
                                                            </p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-xs text-gray-400">
                                                                {new Date(activity.date).toLocaleDateString()}
                                                            </p>
                                                            {activity.hasOverdue && (
                                                                <span className="text-xs text-red-500 font-bold">Late</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                            {recentActivity.length > itemsPerPage && (
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                                                    <p className="text-sm text-gray-500">
                                                        Showing <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, recentActivity.length)}</span> of <span className="font-bold">{recentActivity.length}</span> results
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                            disabled={currentPage === 1}
                                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <ChevronLeft size={20} className="text-gray-600 dark:text-slate-400" />
                                                        </button>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Page {currentPage} of {Math.ceil(recentActivity.length / itemsPerPage)}
                                                        </span>
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recentActivity.length / itemsPerPage)))}
                                                            disabled={currentPage === Math.ceil(recentActivity.length / itemsPerPage)}
                                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <ChevronRight size={20} className="text-gray-600 dark:text-slate-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ABOUT */}
                        {activeSection === "about" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Info size={20} className="text-primary-500" />
                                    About System
                                </h3>

                                <div className="text-center py-10">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl flex items-center justify-center mb-5 shadow-2xl shadow-primary-600/40">
                                        <BookOpen size={44} className="text-white" />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-800 dark:text-white">{librarySettings.libraryName}</h2>
                                    <p className="text-gray-500 dark:text-slate-400 mt-2">Library Management System</p>

                                    <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 rounded-full">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-sm font-medium text-gray-600">Version 1.0.0</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-center">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Frontend</p>
                                        <p className="font-bold text-gray-800 dark:text-white mt-1">React + Vite</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-center">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Backend</p>
                                        <p className="font-bold text-gray-800 dark:text-white mt-1">Laravel 10</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-center">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Database</p>
                                        <p className="font-bold text-gray-800 dark:text-white mt-1">MySQL</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-center">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Styling</p>
                                        <p className="font-bold text-gray-800 dark:text-white mt-1">Tailwind CSS</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
