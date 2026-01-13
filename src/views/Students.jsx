import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { Trash2, UserPlus, Users } from "lucide-react";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");

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

    axiosClient.post("/students", { name, student_id: studentId })
      .then(() => {
        alert("Student Registered Successfully!");
        setName("");
        setStudentId("");
        getStudents(); // Refresh list
      })
      .catch(err => {
        alert(err.response?.data?.message || "Error registering student. ID might already exist.");
      });
  };

  const onDelete = (id) => {
    if(!window.confirm("Are you sure you want to delete this student?")) return;
    axiosClient.delete(`/students/${id}`).then(() => getStudents());
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT: REGISTER FORM */}
      <div className="bg-white p-6 rounded-lg shadow h-fit">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
            <UserPlus /> Register Student
        </h2>
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
            <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                Register Student
            </button>
        </form>
      </div>

      {/* RIGHT: STUDENT LIST TABLE */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
            <Users className="text-gray-600"/>
            <h2 className="text-xl font-bold text-gray-800">Registered Students</h2>
        </div>
        
        <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-blue-600 font-bold">{student.student_id}</td>
                        <td className="p-3 font-medium text-gray-800">{student.name}</td>
                        <td className="p-3 text-right">
                            <button onClick={() => onDelete(student.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
                {students.length === 0 && (
                    <tr>
                        <td colSpan="3" className="p-4 text-center text-gray-500">No students found.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

    </div>
  );
}