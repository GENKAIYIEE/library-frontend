import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { Trash2, UserPlus, Users, ToggleLeft, ToggleRight } from "lucide-react";
import BatchRegister from "./BatchRegister";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");

  // Fetch students when page loads
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
    if (!name || !studentId) {
      alert("Please fill in all fields");
      return;
    }

    axiosClient.post("/students", {
      name,
      student_id: studentId,
      course,
      year_level: yearLevel,
      section
    })
      .then(() => {
        alert("Student Registered Successfully!");
        setName("");
        setStudentId("");
        setCourse("");
        setYearLevel("");
        setSection("");
        getStudents(); // Refresh list
      })
      .catch(err => {
        alert(err.response?.data?.message || "Error registering student. ID might already exist.");
      });
  };

  const onDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    axiosClient.delete(`/students/${id}`).then(() => getStudents());
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* LEFT: REGISTER FORM OR BATCH MODE */}
      {batchMode ? (
        <BatchRegister
          onSuccess={getStudents}
          onCancel={() => setBatchMode(false)}
        />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-600">
              <UserPlus /> Register Student
            </h2>
            <button
              type="button"
              onClick={() => setBatchMode(true)}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1"
            >
              <ToggleLeft size={14} /> Batch Mode
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700">Full Name</label>
              <input
                className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Student ID</label>
              <input
                className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="e.g. 2025-1001"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Course</label>
              <select
                className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                value={course}
                onChange={e => setCourse(e.target.value)}
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
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700">Year Level</label>
                <select
                  className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                  value={yearLevel}
                  onChange={e => setYearLevel(e.target.value)}
                  required
                >
                  <option value="" disabled>Year</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700">Section</label>
                <input
                  className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  placeholder="e.g. A"
                  required
                />
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
              Register Student
            </button>
          </form>
        </div>
      )}

      {/* RIGHT: STUDENT LIST TABLE */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Users className="text-gray-600" />
          <h2 className="text-xl font-bold text-gray-800">Registered Students</h2>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Course</th>
              <th className="p-3">Year/Sec</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map(student => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono text-blue-600 font-bold">{student.student_id}</td>
                <td className="p-3 font-medium text-gray-800">{student.name}</td>
                <td className="p-3">
                  {student.course ? (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{student.course}</span>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </td>
                <td className="p-3 text-gray-600">
                  {student.year_level ? `${student.year_level}-${student.section || '?'}` : '-'}
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => onDelete(student.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}