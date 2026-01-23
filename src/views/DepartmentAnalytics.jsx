import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { Users, BookOpen, AlertCircle, Filter, PieChart } from "lucide-react";

export default function DepartmentAnalytics() {
    const [stats, setStats] = useState({
        total_students: 0,
        active_borrowers: 0,
        late_returners: 0,
        pending_fines: 0
    });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [course, setCourse] = useState("BSIT");
    const [yearLevel, setYearLevel] = useState("");
    const [section, setSection] = useState("");

    const courses = [
        "BSIT", "BSED", "BEED", "Maritime", "BSHM", "BS Criminology", "BSBA", "BS Tourism"
    ];

    useEffect(() => {
        fetchData();
    }, [course, yearLevel, section]);

    const fetchData = () => {
        setLoading(true);
        axiosClient.get("/reports/department", {
            params: { course, year_level: yearLevel, section }
        })
            .then(({ data }) => {
                setStats(data.stats);
                setStudents(data.students);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    return (
        <div className="space-y-6 bg-gray-50 p-8 min-h-screen">
            {/* Page Header with Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-lg border border-gray-100 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
                        <PieChart size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Departmental Analytics</h2>
                        <p className="text-gray-500">View statistics by course and class</p>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex gap-3 flex-wrap w-full md:w-auto">
                    <select
                        value={course}
                        onChange={e => setCourse(e.target.value)}
                        className="border-2 border-primary-200 p-3 rounded-xl outline-none w-full md:w-auto font-bold bg-primary-50 text-primary-700 focus:ring-4 focus:ring-primary-100 focus:border-primary-600 transition-all"
                    >
                        {courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={yearLevel}
                        onChange={e => setYearLevel(e.target.value)}
                        className="border-2 border-gray-200 p-3 rounded-xl outline-none w-full md:w-auto bg-gray-50 focus:ring-4 focus:ring-primary-100 focus:border-primary-600 transition-all"
                    >
                        <option value="">All Year Levels</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>

                    <input
                        placeholder="Section (e.g. A)"
                        value={section}
                        onChange={e => setSection(e.target.value)}
                        className="border-2 border-gray-200 p-3 rounded-xl outline-none w-full md:w-auto bg-gray-50 focus:ring-4 focus:ring-primary-100 focus:border-primary-600 transition-all"
                    />
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Total Students</div>
                    <div className="text-4xl font-bold text-gray-800">{stats.total_students}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Active Borrowers</div>
                    <div className="text-4xl font-bold text-emerald-600">{stats.active_borrowers}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Late Returners</div>
                    <div className="text-4xl font-bold text-red-600">{stats.late_returners}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Pending Fines</div>
                    <div className="text-4xl font-bold text-amber-600">₱{parseFloat(stats.pending_fines).toFixed(2)}</div>
                </div>
            </div>

            {/* DETAILED TABLE */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-100 font-bold text-gray-700 bg-gray-50 flex items-center gap-2">
                    <Users size={18} className="text-primary-600" />
                    Student Breakdown: <span className="text-primary-600">{course}</span>
                    {yearLevel ? <span className="text-gray-500"> • Year {yearLevel}</span> : ''}
                    {section ? <span className="text-gray-500"> • Section {section}</span> : ''}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b border-gray-100">
                            <tr>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">ID</th>
                                <th className="p-4 text-center">Year/Sec</th>
                                <th className="p-4 text-center">Active Loans</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Pending Fine</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                                            Loading data...
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-500">
                                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                                        No students found for this filter.
                                    </td>
                                </tr>
                            ) : (
                                students.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-medium text-gray-800">{s.name}</td>
                                        <td className="p-4">
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{s.student_id}</span>
                                        </td>
                                        <td className="p-4 text-center text-gray-600">
                                            {s.year_level ? `${s.year_level}-${s.section || '?'}` : 'N/A'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {s.active_loans > 0 ? (
                                                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold border border-primary-200">
                                                    {s.active_loans}
                                                </span>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${s.status === 'Overdue' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                s.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                    'bg-gray-100 text-gray-500 border border-gray-200'
                                                }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {s.pending_fine > 0 ? (
                                                <span className="text-red-600 font-bold">₱{parseFloat(s.pending_fine).toFixed(2)}</span>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

