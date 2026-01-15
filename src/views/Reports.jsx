import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { FileText, Users, DollarSign, Download, Calendar } from "lucide-react";

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
        link.href = `http://127.0.0.1:8000/api/reports/export/${type}?${queryString}`;
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
        <div className="print:bg-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-800">📊 Reports & Analytics</h2>

                {/* Date Filter */}
                <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-500" />
                    <select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        className="border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                className="border rounded px-2 py-1 text-sm"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
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
            <div className="flex gap-2 mb-6 print:hidden">
                <button
                    onClick={() => setActiveTab("books")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === "books" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                    <FileText size={16} /> Most Borrowed Books
                </button>
                <button
                    onClick={() => setActiveTab("students")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === "students" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                    <Users size={16} /> Top Students
                </button>
                <button
                    onClick={() => setActiveTab("penalties")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === "penalties" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                    <DollarSign size={16} /> Penalty Collection
                </button>
            </div>

            {loading && <div className="text-center py-8 text-gray-500">Loading reports...</div>}

            {/* Most Borrowed Books */}
            {activeTab === "books" && !loading && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">📚 Most Borrowed Books</h3>
                        <div className="flex gap-2 print:hidden">
                            <button onClick={() => exportCsv("books")} className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1 rounded hover:bg-green-100 transition">
                                <Download size={14} /> CSV
                            </button>
                            <button onClick={exportPdf} className="flex items-center gap-1 text-sm bg-red-50 text-red-700 px-3 py-1 rounded hover:bg-red-100 transition">
                                <Download size={14} /> PDF
                            </button>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="p-3">Rank</th>
                                <th className="p-3">Title</th>
                                <th className="p-3">Author</th>
                                <th className="p-3">Category</th>
                                <th className="p-3 text-right">Times Borrowed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {mostBorrowed.map((book, index) => (
                                <tr key={book.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-bold text-blue-600">#{index + 1}</td>
                                    <td className="p-3 font-medium">{book.title}</td>
                                    <td className="p-3 text-gray-600">{book.author}</td>
                                    <td className="p-3">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{book.category}</span>
                                    </td>
                                    <td className="p-3 text-right font-bold text-green-600">{book.borrow_count}</td>
                                </tr>
                            ))}
                            {mostBorrowed.length === 0 && (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No data for selected period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Top Students */}
            {activeTab === "students" && !loading && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">🎓 Top Borrowers</h3>
                        <div className="flex gap-2 print:hidden">
                            <button onClick={() => exportCsv("students")} className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1 rounded hover:bg-green-100 transition">
                                <Download size={14} /> CSV
                            </button>
                            <button onClick={exportPdf} className="flex items-center gap-1 text-sm bg-red-50 text-red-700 px-3 py-1 rounded hover:bg-red-100 transition">
                                <Download size={14} /> PDF
                            </button>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="p-3">Rank</th>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Student ID</th>
                                <th className="p-3 text-center">Books Borrowed</th>
                                <th className="p-3 text-center">Active Loans</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {topStudents.map((student, index) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-bold text-blue-600">#{index + 1}</td>
                                    <td className="p-3 font-medium">{student.name}</td>
                                    <td className="p-3 text-gray-600 font-mono">{student.student_id}</td>
                                    <td className="p-3 text-center font-bold text-green-600">{student.borrow_count}</td>
                                    <td className="p-3 text-center">
                                        {student.active_loans > 0 ? (
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">{student.active_loans} Active</span>
                                        ) : (
                                            <span className="text-gray-400">None</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {topStudents.length === 0 && (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No data for selected period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Penalty Collection */}
            {activeTab === "penalties" && !loading && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <p className="text-sm text-gray-500">Total Fines</p>
                            <p className="text-2xl font-bold text-gray-800">₱{penalties.summary.total_fines?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                            <p className="text-sm text-gray-500">Collected</p>
                            <p className="text-2xl font-bold text-green-600">₱{penalties.summary.total_collected?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">₱{penalties.summary.total_pending?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                            <p className="text-sm text-gray-500">Late Returns</p>
                            <p className="text-2xl font-bold text-red-600">{penalties.summary.total_late_returns || 0}</p>
                        </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">💰 Monthly Breakdown</h3>
                            <div className="flex gap-2 print:hidden">
                                <button onClick={() => exportCsv("penalties")} className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1 rounded hover:bg-green-100 transition">
                                    <Download size={14} /> CSV
                                </button>
                                <button onClick={exportPdf} className="flex items-center gap-1 text-sm bg-red-50 text-red-700 px-3 py-1 rounded hover:bg-red-100 transition">
                                    <Download size={14} /> PDF
                                </button>
                            </div>
                        </div>

                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-sm">
                                <tr>
                                    <th className="p-3">Month</th>
                                    <th className="p-3 text-right">Total Fines</th>
                                    <th className="p-3 text-right">Collected</th>
                                    <th className="p-3 text-right">Pending</th>
                                    <th className="p-3 text-center">Late Returns</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {penalties.monthly?.map((row) => (
                                    <tr key={row.month} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{row.month}</td>
                                        <td className="p-3 text-right font-mono">₱{parseFloat(row.total_penalties).toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono text-green-600">₱{parseFloat(row.collected).toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono text-yellow-600">₱{parseFloat(row.pending).toFixed(2)}</td>
                                        <td className="p-3 text-center">{row.late_returns}</td>
                                    </tr>
                                ))}
                                {(!penalties.monthly || penalties.monthly.length === 0) && (
                                    <tr><td colSpan="5" className="p-4 text-center text-gray-500">No penalty data for selected period</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
