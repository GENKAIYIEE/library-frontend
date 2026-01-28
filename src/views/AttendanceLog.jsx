import { useState, useEffect, useRef } from "react";
import axiosClient from "../axios-client";
import { ClipboardList, Calendar, Loader2, RefreshCw, Users, Clock, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AttendanceLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [todayCount, setTodayCount] = useState(0);
    const [todayDate, setTodayDate] = useState("");
    const [lastRefresh, setLastRefresh] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        fetchTodayLogs();

        // Real-time polling every 10 seconds
        pollIntervalRef.current = setInterval(() => {
            fetchTodayLogs(true); // silent refresh
        }, 10000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const fetchTodayLogs = async (silent = false) => {
        if (!silent) setLoading(true);

        try {
            // Use the general attendance endpoint but we could filter by date if the API supported it
            // For now, let's switch to the new index endpoint which returns formatted logs
            // BUT, the index endpoint returns PAGINATED data. 
            // Let's stick to the plan: Update backend `today` to return logs.

            // Wait, looking at the code I'm replacing... I am replacing the fetch function.
            // If I change the backend, I don't need to change this frontend much, except maybe to match structure.

            // Let's assume I will update backend `today` method in next step.
            const response = await axiosClient.get('/attendance/today');
            setLogs(response.data.logs || []); // Backend needs to send this
            setTodayCount(response.data.count || 0);
            setTodayDate(response.data.date || new Date().toLocaleDateString());
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Failed to fetch attendance logs:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const getProfileImage = (user) => {
        // Use the computed profile_picture_url from the API if available
        if (user?.profile_picture_url) {
            return user.profile_picture_url;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'S')}&background=00008B&color=fff&size=100&bold=true`;
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <ClipboardList className="text-blue-600" size={28} />
                        Attendance Log
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Real-time library attendance monitoring
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchTodayLogs()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Today's Visitors</p>
                            <p className="text-4xl font-black mt-1">{todayCount}</p>
                        </div>
                        <Users className="text-blue-200" size={48} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Date</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{todayDate}</p>
                        </div>
                        <Calendar className="text-slate-400" size={36} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Last Updated</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                {lastRefresh ? formatTime(lastRefresh) : '--'}
                            </p>
                        </div>
                        <Clock className="text-green-500 animate-pulse" size={36} />
                    </div>
                    <p className="text-xs text-green-600 mt-2 font-medium">● Auto-refreshing every 10s</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
                        <p className="text-slate-500">Loading attendance logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No attendance records for today</p>
                        <p className="text-slate-400 text-sm">Students will appear here when they scan their QR codes</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Time In</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                <AnimatePresence>
                                    {filteredLogs.map((log, index) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, backgroundColor: '#dcfce7' }}
                                            animate={{ opacity: 1, backgroundColor: 'transparent' }}
                                            transition={{ duration: 0.5, delay: index * 0.05 }}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getProfileImage(log.user)}
                                                        alt={log.user?.name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                                                    />
                                                    <span className="font-semibold text-slate-800 dark:text-white">
                                                        {log.user?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                    {log.user?.student_id || '--'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {log.user?.course || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {log.user?.year_level || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-bold">
                                                    <Clock size={14} />
                                                    {formatTime(log.logged_at)}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
