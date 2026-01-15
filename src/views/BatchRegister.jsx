import { useState } from "react";
import axiosClient from "../axios-client";
import { Users, Plus, Minus, Upload } from "lucide-react";

export default function BatchRegister({ onSuccess, onCancel }) {
    // Shared Attributes
    const [course, setCourse] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [section, setSection] = useState("");

    // Dynamic Student List
    const [students, setStudents] = useState([
        { name: "", student_id: "" }
    ]);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const courses = [
        "BSIT", "BSED", "BEED", "Maritime", "BSHM", "BS Criminology", "BSBA", "BS Tourism"
    ];

    const addRow = () => {
        setStudents([...students, { name: "", student_id: "" }]);
    };

    const removeRow = (index) => {
        if (students.length === 1) return;
        setStudents(students.filter((_, i) => i !== index));
    };

    const updateStudent = (index, field, value) => {
        const updated = [...students];
        updated[index][field] = value;
        setStudents(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate shared attributes
        if (!course || !yearLevel || !section) {
            alert("Please fill in Course, Year Level, and Section.");
            return;
        }

        // Validate all students have data
        const validStudents = students.filter(s => s.name && s.student_id);
        if (validStudents.length === 0) {
            alert("Please add at least one student with Name and ID.");
            return;
        }

        setLoading(true);
        setResult(null);

        axiosClient.post("/students/batch", {
            course,
            year_level: parseInt(yearLevel),
            section,
            students: validStudents
        })
            .then(({ data }) => {
                setResult(data);
                if (data.registered > 0) {
                    onSuccess();
                }
                setLoading(false);
            })
            .catch(err => {
                setResult({
                    message: err.response?.data?.message || "Batch registration failed.",
                    errors: err.response?.data?.errors || []
                });
                setLoading(false);
            });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-600">
                <Users /> Batch Register Students
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* SHARED ATTRIBUTES */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-sm font-bold text-purple-700 mb-2">📋 Class Block Details (Shared)</div>
                    <div className="grid grid-cols-3 gap-3">
                        <select
                            value={course}
                            onChange={e => setCourse(e.target.value)}
                            className="border p-2 rounded outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        >
                            <option value="" disabled>Course</option>
                            {courses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <select
                            value={yearLevel}
                            onChange={e => setYearLevel(e.target.value)}
                            className="border p-2 rounded outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        >
                            <option value="" disabled>Year</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>

                        <input
                            value={section}
                            onChange={e => setSection(e.target.value)}
                            placeholder="Section (e.g. A)"
                            className="border p-2 rounded outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>
                </div>

                {/* STUDENT LIST */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-700">👨‍🎓 Students ({students.length})</div>
                        <button
                            type="button"
                            onClick={addRow}
                            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 flex items-center gap-1"
                        >
                            <Plus size={16} /> Add Row
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-2">
                        {students.map((student, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                                <input
                                    value={student.name}
                                    onChange={e => updateStudent(index, "name", e.target.value)}
                                    placeholder="Student Name"
                                    className="flex-1 border p-2 rounded outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                                <input
                                    value={student.student_id}
                                    onChange={e => updateStudent(index, "student_id", e.target.value)}
                                    placeholder="Student ID"
                                    className="w-32 border p-2 rounded outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    disabled={students.length === 1}
                                >
                                    <Minus size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RESULT MESSAGE */}
                {result && (
                    <div className={`p-3 rounded text-sm ${result.registered > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <div className="font-bold">{result.message}</div>
                        {result.errors && result.errors.length > 0 && (
                            <ul className="mt-1 list-disc list-inside text-xs">
                                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                    >
                        <Upload size={18} /> {loading ? 'Registering...' : 'Register All'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-bold hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
