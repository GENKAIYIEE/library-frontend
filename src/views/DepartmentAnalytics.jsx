import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { Users, BookOpen, AlertCircle, Filter } from "lucide-react";

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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-blue-800">
                    <Filter size={24} /> Departmental Analytics
                </h2>

                {/* FILTERS */}
                <div className="flex gap-2 flex-wrap w-full md:w-auto">
                    <select
                        value={course}
                        onChange={e => setCourse(e.target.value)}
                        className="border p-2 rounded outline-none w-full md:w-auto font-bold bg-blue-50 text-blue-700"
                    >
                        {courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={yearLevel}
                        onChange={e => setYearLevel(e.target.value)}
                        className="border p-2 rounded outline-none w-full md:w-auto"
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
                        className="border p-2 rounded outline-none w-full md:w-auto"
                    />
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Students</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.total_students}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">Active Borrowers</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.active_borrowers}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">Late Returners</div>
                    <div className="text-2xl font-bold text-red-600">{stats.late_returners}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">Pending Fines</div>
                    <div className="text-2xl font-bold text-yellow-600">₱{parseFloat(stats.pending_fines).toFixed(2)}</div>
                </div>
            </div>

            {/* DETAILED TABLE */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b font-bold text-gray-700 bg-gray-50">
                    Student Breakdown: {course} {yearLevel ? `- Year ${yearLevel}` : ''} {section ? `- Section ${section}` : ''}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-gray-600 uppercase border-b">
                            <tr>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">ID</th>
                                <th className="p-3 text-center">Year/Sec</th>
                                <th className="p-3 text-center">Active Loans</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-right">Pending Fine</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan="6" className="p-4 text-center">Loading data...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan="6" className="p-4 text-center text-gray-500">No students found for this filter.</td></tr>
                            ) : (
                                students.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{s.name}</td>
                                        <td className="p-3 font-mono text-xs">{s.student_id}</td>
                                        <td className="p-3 text-center">
                                            {s.year_level ? `${s.year_level}-${s.section || '?'}` : 'N/A'}
                                        </td>
                                        <td className="p-3 text-center">
                                            {s.active_loans > 0 ? (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {s.active_loans}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                    s.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-500'
                                                }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-medium">
                                            {s.pending_fine > 0 ? (
                                                <span className="text-red-600">₱{parseFloat(s.pending_fine).toFixed(2)}</span>
                                            ) : '-'}
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
