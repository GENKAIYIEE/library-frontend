import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { Trash2, UserPlus, Users, ToggleLeft, Search } from "lucide-react";
import BatchRegister from "./BatchRegister";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  // Single registration state
  const [name, setName] = useState("");
  const [course, setcourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    getStudents();
  }, []);

  const getStudents = () => {
    setLoading(true);
    axiosClient.get("/students")
      .then(({ data }) => {
        setStudents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!name || !course || !yearLevel || !section) {
      alert("Please fill in all fields");
      return;
    }

    axiosClient.post("/students", {
      name,
      course,
      year_level: parseInt(yearLevel),
      section
    })
      .then((res) => {
        alert(`Student Registered! ID: ${res.data.student_id}`);
        setName("");
        setcourse("");
        setYearLevel("");
        setSection("");
        getStudents();
      })
      .catch(err => {
        alert(err.response?.data?.message || "Error registering student.");
      });
  };

  const onDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    axiosClient.delete(`/students/${id}`).then(() => getStudents());
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* LEFT: REGISTER FORM OR BATCH MODE */}
      <div className="lg:col-span-1">
        {batchMode ? (
          <BatchRegister
            onSuccess={getStudents}
            onCancel={() => setBatchMode(false)}
          />
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Register Student</h2>
              </div>
              <Button
                onClick={() => setBatchMode(true)}
                variant="secondary"
                className="text-xs px-2 py-1"
              >
                <ToggleLeft size={16} /> Batch
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                required
              />

              <Select
                label="Course"
                value={course}
                onChange={e => setcourse(e.target.value)}
                required
              >
                <option value="" disabled>Select Course</option>
                <option value="BSIT">BSIT</option>
                <option value="BSED">BSED</option>
                <option value="BEED">BEED</option>
                <option value="Maritime">Maritime</option>
                <option value="BSHM">BSHM</option>
                <option value="BS Criminology">BS Criminology</option>
                <option value="BSBA">BSBA</option>
                <option value="BS Tourism">BS Tourism</option>
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Year"
                  value={yearLevel}
                  onChange={e => setYearLevel(e.target.value)}
                  required
                >
                  <option value="" disabled>Select</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </Select>

                <Input
                  label="Section"
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  placeholder="e.g. A"
                  required
                />
              </div>

              <Button type="submit" className="w-full justify-center">
                Register Student
              </Button>
            </form>
          </Card>
        )}
      </div>

      {/* RIGHT: STUDENT LIST TABLE */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Registered Students</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                placeholder="Search students..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Year/Sec</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition group">
                    <td className="p-3 font-mono text-primary-600 font-semibold text-sm">{student.student_id}</td>
                    <td className="p-3 text-slate-700 font-medium">{student.name}</td>
                    <td className="p-3">
                      {student.course ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">{student.course}</span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 text-sm">
                      {student.year_level ? `${student.year_level}-${student.section || '?'}` : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onDelete(student.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        title="Delete Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={32} strokeWidth={1.5} />
                        <p>No students registered yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}