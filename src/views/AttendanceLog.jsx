import { useState, useEffect, useRef } from "react";
import axiosClient from "../axios-client";
import { ClipboardList, Calendar, Loader2, RefreshCw, Users, Clock, Search, ChevronLeft, ChevronRight, FileText, X, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AttendanceLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [displayDate, setDisplayDate] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const pollIntervalRef = useRef(null);


    useEffect(() => {
        fetchLogsByDate(selectedDate);

        const today = new Date().toISOString().split('T')[0];
        if (selectedDate === today) {
            pollIntervalRef.current = setInterval(() => {
                fetchLogsByDate(selectedDate, true);
            }, 15000);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [selectedDate]);

    const fetchLogsByDate = async (date, silent = false) => {
        if (!silent) setLoading(true);

        try {
            const response = await axiosClient.get(`/attendance/today?date=${date}`);
            setLogs(response.data.logs || []);
            setTotalCount(response.data.count || 0);
            setDisplayDate(response.data.date || date);
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Failed to fetch attendance logs:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const goToPreviousDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev.toISOString().split('T')[0]);
    };

    const goToNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        const today = new Date().toISOString().split('T')[0];
        if (next.toISOString().split('T')[0] <= today) {
            setSelectedDate(next.toISOString().split('T')[0]);
        }
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const handleGenerateReport = () => {
        setShowReportModal(true);
    };

    const handlePrintReport = () => {
        // Generate print-friendly HTML content
        const currentLogs = logs.filter(log =>
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const timeFormatter = (timestamp) => {
            return new Date(timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        const tableRows = currentLogs.map((log, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${log.user?.name || 'Unknown'}</td>
                <td style="font-family: monospace;">${log.user?.student_id || '--'}</td>
                <td>${log.user?.course || '--'}</td>
                <td>${log.user?.year_level || '--'}</td>
                <td>${timeFormatter(log.logged_at)}</td>
            </tr>
        `).join('');

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Attendance Report - ${displayDate}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Times New Roman', serif; 
                        padding: 40px; 
                        background: white;
                        color: #000;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        padding-bottom: 20px; 
                        border-bottom: 2px solid #333; 
                    }
                    .header h1 { font-size: 22px; font-weight: bold; text-transform: uppercase; }
                    .header p { font-size: 14px; color: #555; margin-top: 5px; }
                    .header h2 { font-size: 18px; font-weight: bold; margin-top: 15px; text-transform: uppercase; }
                    .info { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 20px; 
                        font-size: 13px; 
                    }
                    .summary { 
                        background: #f5f5f5; 
                        border: 1px solid #ddd; 
                        padding: 15px; 
                        margin-bottom: 20px; 
                        border-radius: 5px; 
                    }
                    .summary h3 { font-size: 12px; text-transform: uppercase; margin-bottom: 8px; font-weight: bold; }
                    .summary p { font-size: 13px; }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 30px; 
                    }
                    th, td { 
                        border: 1px solid #333; 
                        padding: 10px; 
                        text-align: left; 
                        font-size: 12px; 
                    }
                    th { background: #e5e7eb; font-weight: bold; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .footer { 
                        margin-top: 30px; 
                        padding-top: 20px; 
                        border-top: 1px solid #ccc; 
                        font-size: 11px; 
                        color: #666; 
                        display: flex; 
                        justify-content: space-between; 
                    }
                    .signatures { 
                        display: flex; 
                        justify-content: space-around; 
                        margin-top: 60px; 
                    }
                    .signature-box { 
                        text-align: center; 
                        width: 200px; 
                    }
                    .signature-line { 
                        border-top: 1px solid #333; 
                        margin-top: 50px; 
                        padding-top: 8px; 
                    }
                    .signature-box p { font-size: 13px; }
                    .signature-box span { font-size: 11px; color: #666; }
                    .no-records { 
                        text-align: center; 
                        padding: 40px; 
                        color: #666; 
                        border: 1px dashed #ccc; 
                        border-radius: 8px; 
                    }
                    @media print {
                        body { padding: 20px; }
                    }
                    @page { margin: 0.5in; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>PCLU Library Management System</h1>
                    <p>Philippine Christian Luzon University</p>
                    <h2>Daily Attendance Report</h2>
                </div>
                
                <div class="info">
                    <div>
                        <p><strong>Report Date:</strong> ${displayDate}</p>
                        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Total Visitors:</strong> ${currentLogs.length}</p>
                        <p><strong>Report Type:</strong> Daily Attendance Log</p>
                    </div>
                </div>
                
                <div class="summary">
                    <h3>Summary</h3>
                    <p>This report documents all library visitors who checked in on <strong>${displayDate}</strong>. 
                    A total of <strong>${currentLogs.length} student(s)</strong> visited the library on this date.</p>
                </div>
                
                ${currentLogs.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Name</th>
                                <th>ID Number</th>
                                <th>Course</th>
                                <th>Year</th>
                                <th>Time In</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-records">
                        <p>No attendance records found for this date.</p>
                    </div>
                `}
                
                <div class="footer">
                    <div>
                        <p>Prepared by: Library Management System</p>
                        <p>Document generated on ${new Date().toLocaleString()}</p>
                    </div>
                    <div style="text-align: right;">
                        <p>Page 1 of 1</p>
                        <p>PCLU Library - Confidential</p>
                    </div>
                </div>
                
                <div class="signatures">
                    <div class="signature-box">
                        <div class="signature-line">
                            <p>Librarian Signature</p>
                            <span>Date: _______________</span>
                        </div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line">
                            <p>Noted By</p>
                            <span>Date: _______________</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Use iframe with srcdoc for printing (CSP-compliant - no document.write needed)
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        printFrame.style.left = '-9999px';

        // Use srcdoc attribute instead of document.write (CSP-safe)
        printFrame.srcdoc = printContent;
        document.body.appendChild(printFrame);

        // Wait for content to load then print
        printFrame.onload = () => {
            try {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
            } catch (e) {
                console.error('Print error:', e);
            }
            // Remove iframe after printing (longer delay to ensure print dialog completes)
            setTimeout(() => {
                if (printFrame.parentNode) {
                    document.body.removeChild(printFrame);
                }
            }, 2000);
        };
    };




    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    const getProfileImage = (user) => {
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
            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm report-no-print">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 report-no-print">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-blue-600" size={24} />
                                    <h2 className="text-xl font-bold text-slate-800">Attendance Report Preview</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrintReport}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        <Printer size={16} />
                                        Print Report
                                    </button>
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Report Document */}
                            <div className="overflow-auto flex-1 bg-slate-100 p-6">
                                <div
                                    id="report-document"
                                    className="bg-white mx-auto max-w-3xl p-10 shadow-lg"
                                    style={{ fontFamily: 'Times New Roman, serif' }}
                                >

                                    {/* Report Header */}
                                    <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
                                        <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">
                                            PCLU Library Management System
                                        </h1>
                                        <p className="text-sm text-slate-600 mb-4">
                                            Philippine Christian Luzon University
                                        </p>
                                        <h2 className="text-xl font-bold uppercase mt-4">
                                            Daily Attendance Report
                                        </h2>
                                    </div>

                                    {/* Report Info */}
                                    <div className="mb-6 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p><strong>Report Date:</strong> {displayDate}</p>
                                                <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p><strong>Total Visitors:</strong> {filteredLogs.length}</p>
                                                <p><strong>Report Type:</strong> Daily Attendance Log</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Box */}
                                    <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 mb-6">
                                        <h3 className="font-bold text-sm uppercase tracking-wide mb-2">Summary</h3>
                                        <p className="text-sm">
                                            This report documents all library visitors who checked in on <strong>{displayDate}</strong>.
                                            A total of <strong>{filteredLogs.length} student(s)</strong> visited the library on this date.
                                        </p>
                                    </div>

                                    {/* Attendance Table */}
                                    {filteredLogs.length > 0 ? (
                                        <table className="report-table w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-slate-200">
                                                    <th className="border border-slate-400 px-3 py-2 text-left font-bold">#</th>
                                                    <th className="border border-slate-400 px-3 py-2 text-left font-bold">Student Name</th>
                                                    <th className="border border-slate-400 px-3 py-2 text-left font-bold">ID Number</th>
                                                    <th className="border border-slate-400 px-3 py-2 text-left font-bold">Course</th>
                                                    <th className="border border-slate-400 px-3 py-2 text-left font-bold">Year</th>
                                                    <th className="border border-slate-400 px-3 py-2 text-left font-bold">Time In</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredLogs.map((log, index) => (
                                                    <tr key={log.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                        <td className="border border-slate-300 px-3 py-2">{index + 1}</td>
                                                        <td className="border border-slate-300 px-3 py-2">{log.user?.name || 'Unknown'}</td>
                                                        <td className="border border-slate-300 px-3 py-2 font-mono">{log.user?.student_id || '--'}</td>
                                                        <td className="border border-slate-300 px-3 py-2">{log.user?.course || '--'}</td>
                                                        <td className="border border-slate-300 px-3 py-2">{log.user?.year_level || '--'}</td>
                                                        <td className="border border-slate-300 px-3 py-2">{formatTime(log.logged_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center py-10 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                                            <p>No attendance records found for this date.</p>
                                        </div>
                                    )}

                                    {/* Report Footer */}
                                    <div className="mt-10 pt-6 border-t border-slate-300 text-xs text-slate-500">
                                        <div className="flex justify-between">
                                            <div>
                                                <p>Prepared by: Library Management System</p>
                                                <p>Document generated on {new Date().toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p>Page 1 of 1</p>
                                                <p>PCLU Library - Confidential</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signature Lines */}
                                    <div className="mt-12 grid grid-cols-2 gap-8">
                                        <div className="text-center">
                                            <div className="border-t border-slate-400 pt-2 mt-10">
                                                <p className="text-sm font-semibold">Librarian Signature</p>
                                                <p className="text-xs text-slate-500">Date: _______________</p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="border-t border-slate-400 pt-2 mt-10">
                                                <p className="text-sm font-semibold">Noted By</p>
                                                <p className="text-xs text-slate-500">Date: _______________</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header with Date Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <ClipboardList className="text-blue-600" size={28} />
                        Attendance Log
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Library attendance history and reports
                    </p>
                </div>

                {/* Date Navigation Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={goToPreviousDay}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        title="Previous Day"
                    >
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>

                    <input
                        type="date"
                        value={selectedDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <button
                        onClick={goToNextDay}
                        disabled={isToday}
                        className={`p-2 rounded-lg transition-colors ${isToday ? 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-50' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        title="Next Day"
                    >
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>

                    <button
                        onClick={goToToday}
                        disabled={isToday}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-default' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        Today
                    </button>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />

                    <button
                        onClick={handleGenerateReport}
                        disabled={loading || filteredLogs.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                        title="Generate Printable Report"
                    >
                        <FileText size={16} />
                        Generate Report
                    </button>

                    <button
                        onClick={() => fetchLogsByDate(selectedDate)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
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
                            <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Visitors</p>
                            <p className="text-4xl font-black mt-1">{totalCount}</p>
                        </div>
                        <Users className="text-blue-200" size={48} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Viewing Date</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{displayDate}</p>
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
                        <Clock className={`text-green-500 ${isToday ? 'animate-pulse' : ''}`} size={36} />
                    </div>
                    {isToday && <p className="text-xs text-green-600 mt-2 font-medium">● Auto-refreshing every 15s</p>}
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
                        <p className="text-slate-500">No attendance records for {displayDate}</p>
                        <p className="text-slate-400 text-sm">Try selecting a different date</p>
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
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3, delay: index * 0.02 }}
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
