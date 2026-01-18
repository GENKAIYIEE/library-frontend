import { useEffect, useState, useMemo } from "react";
import axiosClient from "../axios-client";
import {
  Trash2, UserPlus, Users, ToggleLeft, Search,
  ChevronDown, ChevronRight, GraduationCap, Layers,
  Maximize2, Minimize2, User, BookOpen, Hash, Award, X
} from "lucide-react";
import BatchRegister from "./BatchRegister";
import Button from "../components/ui/Button";
import FloatingInput from "../components/ui/FloatingInput";
import FloatingSelect from "../components/ui/FloatingSelect";
import AchievementBadges from "../components/AchievementBadges";

// Course color mapping for visual distinction
const COURSE_COLORS = {
  "BSIT": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: "text-blue-500" },
  "BSED": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700 border-rose-200", icon: "text-rose-500" },
  "BEED": { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", badge: "bg-pink-100 text-pink-700 border-pink-200", icon: "text-pink-500" },
  "Maritime": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700 border-cyan-200", icon: "text-cyan-500" },
  "BSHM": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "text-amber-500" },
  "BS Criminology": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700 border-red-200", icon: "text-red-500" },
  "BSBA": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "text-emerald-500" },
  "BS Tourism": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "text-indigo-500" },
  "default": { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-700 border-slate-200", icon: "text-slate-500" }
};

const getCourseColors = (course) => COURSE_COLORS[course] || COURSE_COLORS.default;

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Single registration state
  const [name, setName] = useState("");
  const [course, setcourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");

  // Achievement Modal state
  const [viewingBadges, setViewingBadges] = useState(null);

  // Collapsed courses state
  const [collapsedCourses, setCollapsedCourses] = useState({});

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

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const query = searchTerm.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.student_id.toLowerCase().includes(query) ||
      (s.course && s.course.toLowerCase().includes(query)) ||
      (s.section && s.section.toLowerCase().includes(query))
    );
  }, [students, searchTerm]);

  // Group students by course
  const studentsByCourse = useMemo(() => {
    const grouped = {};
    filteredStudents.forEach(student => {
      const courseName = student.course || "Unassigned";
      if (!grouped[courseName]) {
        grouped[courseName] = [];
      }
      grouped[courseName].push(student);
    });
    // Sort courses alphabetically
    return Object.keys(grouped).sort().reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {});
  }, [filteredStudents]);

  // Course stats
  const courseStats = useMemo(() => {
    return Object.entries(studentsByCourse).map(([courseName, courseStudents]) => ({
      course: courseName,
      totalStudents: courseStudents.length,
      yearBreakdown: courseStudents.reduce((acc, s) => {
        const yr = s.year_level || 'Unknown';
        acc[yr] = (acc[yr] || 0) + 1;
        return acc;
      }, {})
    }));
  }, [studentsByCourse]);

  // Toggle course collapse
  const toggleCourse = (courseName) => {
    setCollapsedCourses(prev => ({
      ...prev,
      [courseName]: !prev[courseName]
    }));
  };

  // Expand/Collapse all
  const expandAll = () => setCollapsedCourses({});
  const collapseAll = () => {
    const all = {};
    Object.keys(studentsByCourse).forEach(c => all[c] = true);
    setCollapsedCourses(all);
  };

  // Course Section Component
  const CourseSection = ({ courseName, courseStudents }) => {
    const isCollapsed = collapsedCourses[courseName];
    const colors = getCourseColors(courseName);

    // Group by year level for stats
    const yearCounts = courseStudents.reduce((acc, s) => {
      const yr = s.year_level || '?';
      acc[yr] = (acc[yr] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className={`mb-4 rounded-xl overflow-hidden border-2 ${colors.border} transition-all duration-200`}>
        {/* Course Header */}
        <button
          onClick={() => toggleCourse(courseName)}
          className={`w-full ${colors.bg} px-4 py-3 flex items-center justify-between hover:brightness-95 transition-all`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
              {isCollapsed ? (
                <ChevronRight size={20} className={colors.icon} />
              ) : (
                <ChevronDown size={20} className={colors.icon} />
              )}
            </div>
            <div className="text-left">
              <h3 className={`font-bold text-lg ${colors.text}`}>{courseName}</h3>
              <p className="text-xs text-slate-500">
                {courseStudents.length} student{courseStudents.length !== 1 ? 's' : ''} •
                {Object.entries(yearCounts).map(([yr, count]) => ` Year ${yr}: ${count}`).join(' •')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
              {courseStudents.length} Students
            </span>
          </div>
        </button>

        {/* Course Students Table */}
        {!isCollapsed && (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-3 border-b border-slate-100">Student ID</th>
                  <th className="p-3 border-b border-slate-100">Name</th>
                  <th className="p-3 border-b border-slate-100">Year/Section</th>
                  <th className="p-3 border-b border-slate-100 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {courseStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition group">
                    <td className="p-3 font-mono text-primary-600 font-semibold text-sm">{student.student_id}</td>
                    <td className="p-3 text-slate-700 font-medium">{student.name}</td>
                    <td className="p-3 text-slate-600 text-sm">
                      {student.year_level ? `${student.year_level}-${student.section || '?'}` : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setViewingBadges(student)}
                          className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-lg transition"
                          title="View Achievements"
                        >
                          <Award size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(student.id)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 -m-8 p-8 min-h-screen relative">

      {/* ACHIEVEMENTS MODAL */}
      {viewingBadges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-scaleIn">
            <button
              onClick={() => setViewingBadges(null)}
              className="absolute top-4 right-4 z-[60] p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all shadow-lg"
              title="Close"
            >
              <X size={20} />
            </button>
            <AchievementBadges studentId={viewingBadges.id} />
          </div>
        </div>
      )}

      {/* LEFT: REGISTER FORM OR BATCH MODE */}
      <div className="lg:col-span-1">
        {batchMode ? (
          <BatchRegister
            onSuccess={getStudents}
            onCancel={() => setBatchMode(false)}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-600 rounded-xl shadow">
                  <UserPlus size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Register Student</h2>
              </div>
              <Button
                onClick={() => setBatchMode(true)}
                variant="secondary"
                className="text-xs px-3 py-2"
              >
                <ToggleLeft size={16} /> Batch
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <FloatingInput
                label="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                icon={User}
                required
              />

              <FloatingSelect
                label="Course"
                value={course}
                onChange={e => setcourse(e.target.value)}
                required
              >
                <option value="BSIT">BSIT</option>
                <option value="BSED">BSED</option>
                <option value="BEED">BEED</option>
                <option value="Maritime">Maritime</option>
                <option value="BSHM">BSHM</option>
                <option value="BS Criminology">BS Criminology</option>
                <option value="BSBA">BSBA</option>
                <option value="BS Tourism">BS Tourism</option>
              </FloatingSelect>

              <div className="flex flex-wrap gap-4">
                <FloatingSelect
                  label="Year Level"
                  value={yearLevel}
                  onChange={e => setYearLevel(e.target.value)}
                  required
                  className="flex-grow min-w-[140px]"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </FloatingSelect>

                <FloatingInput
                  label="Section"
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  icon={Hash}
                  required
                  className="flex-grow min-w-[140px]"
                />
              </div>

              <Button type="submit" variant="form" fullWidth className="mt-2">
                Register Student
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* RIGHT: STUDENT LIST ORGANIZED BY COURSE */}
      <div className="lg:col-span-2">
        {/* Header and Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Registered Students</h2>
              <p className="text-sm text-gray-500">Organized by course • {filteredStudents.length} students total</p>
            </div>
          </div>
        </div>

        {/* Course Summary Cards */}
        {courseStats.length > 0 && !searchTerm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {courseStats.slice(0, 8).map(({ course: courseName, totalStudents }) => {
              const colors = getCourseColors(courseName);
              return (
                <button
                  key={courseName}
                  onClick={() => {
                    setCollapsedCourses(prev => ({ ...prev, [courseName]: false }));
                  }}
                  className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-4 text-left hover:brightness-95 transition-all duration-200 hover:shadow-lg`}
                >
                  <div className={`text-xs font-bold ${colors.text} uppercase tracking-wide truncate mb-1`}>{courseName}</div>
                  <div className="text-2xl font-bold text-gray-800">{totalStudents}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Search and Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-4 top-3 text-primary-400" size={18} />
                <input
                  placeholder="Search by name, ID, course, section..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-600 transition-all bg-gray-50 hover:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                title="Expand All"
              >
                <Maximize2 size={16} /> Expand
              </button>
              <button
                onClick={collapseAll}
                className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                title="Collapse All"
              >
                <Minimize2 size={16} /> Collapse
              </button>
            </div>
          </div>
        </div>

        {/* Course Sections */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400 border border-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p>Loading students...</p>
          </div>
        ) : Object.keys(studentsByCourse).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400 border border-gray-100">
            <div className="flex flex-col items-center gap-2">
              <Users size={48} strokeWidth={1.5} className="opacity-30" />
              <p className="text-lg font-medium text-gray-600">
                {searchTerm ? `No students found matching "${searchTerm}"` : "No students registered yet"}
              </p>
              <p className="text-sm text-gray-400">Register students using the form on the left</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(studentsByCourse).map(([courseName, courseStudents]) => (
              <CourseSection
                key={courseName}
                courseName={courseName}
                courseStudents={courseStudents}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
