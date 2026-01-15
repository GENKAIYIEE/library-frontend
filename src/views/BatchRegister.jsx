import { useState } from "react";
import axiosClient from "../axios-client";
import { Users, Plus, Minus, Upload, FileSpreadsheet } from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

export default function BatchRegister({ onSuccess, onCancel }) {
    // Shared Attributes
    const [course, setCourse] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [section, setSection] = useState("");

    // Dynamic Student List
    const [students, setStudents] = useState([
        { name: "" }
    ]);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const courses = [
        "BSIT", "BSED", "BEED", "Maritime", "BSHM", "BS Criminology", "BSBA", "BS Tourism"
    ];

    const addRow = () => {
        setStudents([...students, { name: "" }]);
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
        const validStudents = students.filter(s => s.name.trim());
        if (validStudents.length === 0) {
            alert("Please add at least one student with a name.");
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
        <Card>
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Batch Registration</h2>
                        <p className="text-xs text-slate-500">Register multiple students at once</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* SHARED ATTRIBUTES */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Class Details (Applied to all)</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            label="Course"
                            value={course}
                            onChange={e => setCourse(e.target.value)}
                            options={courses}
                            placeholder="Select Course"
                            required
                        />

                        <Select
                            label="Year Level"
                            value={yearLevel}
                            onChange={e => setYearLevel(e.target.value)}
                            placeholder="Select Year"
                            required
                        >
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </Select>

                        <Input
                            label="Section"
                            value={section}
                            onChange={e => setSection(e.target.value)}
                            placeholder="e.g. A"
                            required
                        />
                    </div>
                </div>

                {/* STUDENT LIST */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-slate-700">Students List ({students.length})</div>
                        <Button
                            type="button"
                            onClick={addRow}
                            variant="secondary"
                            className="py-1 text-xs"
                            icon={Plus}
                        >
                            Add Row
                        </Button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                        {students.map((student, index) => (
                            <div key={index} className="flex gap-3 items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 w-6 text-center">{index + 1}.</span>
                                <Input
                                    value={student.name}
                                    onChange={e => updateStudent(index, "name", e.target.value)}
                                    placeholder="Student Name"
                                    className="flex-1 text-sm mb-0"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    className="text-slate-400 hover:text-red-500 p-2 transition"
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
                    <div className={`p-4 rounded-lg text-sm border ${result.registered > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <div className="font-bold">{result.message}</div>
                        {result.errors && result.errors.length > 0 && (
                            <ul className="mt-1 list-disc list-inside text-xs opacity-80">
                                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1"
                        icon={Upload}
                    >
                        {loading ? 'Processing...' : 'Register All Students'}
                    </Button>
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="ghost"
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    );
}
