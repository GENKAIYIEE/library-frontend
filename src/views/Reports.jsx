import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { FileText, Users, DollarSign, Download, Calendar, FileBarChart } from "lucide-react";

export default function Reports() {
    // Date Filter State
    const [dateRange, setDateRange] = useState("30");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    // Report Data State
    const [mostBorrowed, setMostBorrowed] = useState([]);
    const [topStudents, setTopStudents] = useState([]);
    const [penalties, setPenalties] = useState({ monthly: [], summary: {} });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("books");

    // Calculate date range
    const getDateParams = () => {
        const now = new Date();
        let start, end;

        if (dateRange === "custom") {
            return { start_date: customStart, end_date: customEnd };
        }

        end = now.toISOString().split('T')[0];

        switch (dateRange) {
            case "7":
                start = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case "30":
                start = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
                break;
            case "90":
                start = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
                break;
            case "365":
                start = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
                break;
            default:
                start = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
        }

        return { start_date: start, end_date: new Date().toISOString().split('T')[0] };
    };

    // Fetch all reports
    const fetchReports = () => {
        setLoading(true);
        const params = getDateParams();

        Promise.all([
            axiosClient.get("/reports/most-borrowed", { params }),
            axiosClient.get("/reports/top-students", { params }),
            axiosClient.get("/reports/penalties", { params })
        ])
            .then(([booksRes, studentsRes, penaltiesRes]) => {
                setMostBorrowed(booksRes.data);
                setTopStudents(studentsRes.data);
                setPenalties(penaltiesRes.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange, customStart, customEnd]);

    // Export CSV
    const exportCsv = (type) => {
        const params = getDateParams();
        const queryString = new URLSearchParams(params).toString();
        const token = localStorage.getItem("ACCESS_TOKEN");

        // Create download link
        const link = document.createElement('a');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
        link.href = `${baseUrl}/reports/export/${type}?${queryString}`;
        link.setAttribute('download', `report_${type}_${new Date().toISOString().split('T')[0]}.csv`);

        // We need to fetch with auth header
        fetch(link.href, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            });
    };

    // Export PDF (using browser print)
    const exportPdf = () => {
        window.print();
    };

    return (
        <div className="space-y-6 bg-gray-50 -m-8 p-8 min-h-screen print:bg-white print:m-0 print:p-0">
            {/* Header */}
            <div className="flex justify-between items-center print:hidden">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
                        <FileBarChart size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
                        <p className="text-gray-500">Generate and export library statistics</p>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow border border-gray-100">
                    <Calendar size={18} className="text-primary-600" />
                    <select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-primary-100 focus:border-primary-600 outline-none transition-all bg-gray-50"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="365">This Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {dateRange === "custom" && (
                        <>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-primary-100 focus:border-primary-600 outline-none"
                            />
                            <span className="text-gray-400 font-medium">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-primary-100 focus:border-primary-600 outline-none"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-4">
                <h1 className="text-2xl font-bold">PCLU Library System - Report</h1>
                <p className="text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-3 print:hidden">
                <button
                    onClick={() => setActiveTab("books")}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === "books" ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "bg-white text-gray-600 hover:bg-gray-50 shadow border border-gray-100"}`}
                >
                    <FileText size={18} /> Most Borrowed Books
                </button>
                <button
                    onClick={() => setActiveTab("students")}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === "students" ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "bg-white text-gray-600 hover:bg-gray-50 shadow border border-gray-100"}`}
                >
                    <Users size={18} /> Top Students
                </button>
                <button
                    onClick={() => setActiveTab("penalties")}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === "penalties" ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "bg-white text-gray-600 hover:bg-gray-50 shadow border border-gray-100"}`}
                >
                    <DollarSign size={18} /> Penalty Collection
                </button>
            </div>

            {loading && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        Loading reports...
                    </div>
                </div>
            )}

            {/* Most Borrowed Books */}
            {activeTab === "books" && !loading && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="text-primary-600" size={20} /> Most Borrowed Books
                        </h3>
                        <div className="flex gap-2 print:hidden">
                            <button onClick={() => exportCsv("books")} className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm">
                                <Download size={14} /> CSV
                            </button>
                            <button onClick={exportPdf} className="flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium shadow-sm">
                                <Download size={14} /> PDF
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-gray-100">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase">
                                <tr>
                                    <th className="p-4">Rank</th>
                                    <th className="p-4">Book</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 text-right">Times Borrowed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {mostBorrowed.map((book, index) => {
                                    const imagePath = book.image_path || book.cover_image;
                                    const imageUrl = imagePath
                                        ? (imagePath.startsWith('http')
                                            ? imagePath
                                            : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || ''}/${imagePath}`)
                                        : null;

                                    return (
                                        <tr key={book.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index < 3 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Book Thumbnail */}
                                                    <div className="w-10 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded overflow-hidden flex-shrink-0 shadow-sm print:hidden">
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={book.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <FileText size={14} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{book.title}</p>
                                                        <p className="text-sm text-gray-500">{book.author}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold border border-primary-100">{book.category}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="font-bold text-emerald-600 text-lg">{book.borrow_count}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {mostBorrowed.length === 0 && (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">No data for selected period</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top Students */}
            {activeTab === "students" && !loading && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Users className="text-primary-600" size={20} /> Top Borrowers
                        </h3>
                        <div className="flex gap-2 print:hidden">
                            <button onClick={() => exportCsv("students")} className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm">
                                <Download size={14} /> CSV
                            </button>
                            <button onClick={exportPdf} className="flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium shadow-sm">
                                <Download size={14} /> PDF
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-gray-100">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase">
                                <tr>
                                    <th className="p-4">Rank</th>
                                    <th className="p-4">Student Name</th>
                                    <th className="p-4">Student ID</th>
                                    <th className="p-4 text-center">Books Borrowed</th>
                                    <th className="p-4 text-center">Active Loans</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {topStudents.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-bold text-primary-600">#{index + 1}</td>
                                        <td className="p-4 font-medium text-gray-800">{student.name}</td>
                                        <td className="p-4">
                                            <span className="text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">{student.student_id}</span>
                                        </td>
                                        <td className="p-4 text-center font-bold text-emerald-600">{student.borrow_count}</td>
                                        <td className="p-4 text-center">
                                            {student.active_loans > 0 ? (
                                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">{student.active_loans} Active</span>
                                            ) : (
                                                <span className="text-gray-400">None</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {topStudents.length === 0 && (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No data for selected period</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Penalty Collection */}
            {activeTab === "penalties" && !loading && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Fines</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">₱{penalties.summary.total_fines?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Collected</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-2">₱{penalties.summary.total_collected?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pending</p>
                            <p className="text-3xl font-bold text-amber-600 mt-2">₱{penalties.summary.total_pending?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Late Returns</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{penalties.summary.total_late_returns || 0}</p>
                        </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <DollarSign className="text-primary-600" size={20} /> Monthly Breakdown
                            </h3>
                            <div className="flex gap-2 print:hidden">
                                <button onClick={() => exportCsv("penalties")} className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm">
                                    <Download size={14} /> CSV
                                </button>
                                <button onClick={exportPdf} className="flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium shadow-sm">
                                    <Download size={14} /> PDF
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl overflow-hidden border border-gray-100">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="p-4">Month</th>
                                        <th className="p-4 text-right">Total Fines</th>
                                        <th className="p-4 text-right">Collected</th>
                                        <th className="p-4 text-right">Pending</th>
                                        <th className="p-4 text-center">Late Returns</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {penalties.monthly?.map((row) => (
                                        <tr key={row.month} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-medium text-gray-800">{row.month}</td>
                                            <td className="p-4 text-right font-mono text-gray-700">₱{parseFloat(row.total_penalties).toFixed(2)}</td>
                                            <td className="p-4 text-right font-mono text-emerald-600 font-bold">₱{parseFloat(row.collected).toFixed(2)}</td>
                                            <td className="p-4 text-right font-mono text-amber-600">₱{parseFloat(row.pending).toFixed(2)}</td>
                                            <td className="p-4 text-center">{row.late_returns}</td>
                                        </tr>
                                    ))}
                                    {(!penalties.monthly || penalties.monthly.length === 0) && (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">No penalty data for selected period</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
