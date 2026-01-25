import { useEffect, useState, useMemo } from "react";
import axiosClient from "../axios-client";
import Swal from "sweetalert2";
import {
  Trash2, Search, GraduationCap, LayoutGrid, List as ListIcon,
  Filter, Award, Pencil, Phone, Mail, MoreVertical
} from "lucide-react";
import { useToast } from "../components/ui/Toast";
import GlassCard from "../components/ui/GlassCard";
import StudentProfileModal from "./StudentProfileModal";
import { Menu } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/utils";

// Course color mapping
const COURSE_COLORS = {
  "BSIT": { from: "from-blue-500", to: "to-cyan-500", text: "text-blue-600", bg: "bg-blue-50" },
  "BSED": { from: "from-rose-500", to: "to-pink-500", text: "text-rose-600", bg: "bg-rose-50" },
  "BEED": { from: "from-pink-500", to: "to-purple-500", text: "text-pink-600", bg: "bg-pink-50" },
  "Maritime": { from: "from-cyan-500", to: "to-blue-500", text: "text-cyan-600", bg: "bg-cyan-50" },
  "BSHM": { from: "from-amber-500", to: "to-orange-500", text: "text-amber-600", bg: "bg-amber-50" },
  "BS Criminology": { from: "from-red-600", to: "to-orange-600", text: "text-red-700", bg: "bg-red-50" },
  "BSBA": { from: "from-emerald-500", to: "to-teal-500", text: "text-emerald-600", bg: "bg-emerald-50" },
  "BS Tourism": { from: "from-indigo-500", to: "to-violet-500", text: "text-indigo-600", bg: "bg-indigo-50" },
  "default": { from: "from-slate-500", to: "to-gray-500", text: "text-slate-600", bg: "bg-slate-50" }
};

const getCourseStyle = (course) => COURSE_COLORS[course] || COURSE_COLORS.default;

export default function Students() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterYear, setFilterYear] = useState("All");

  // Modals
  const [viewingStudent, setViewingStudent] = useState(null);
  // Note: Edit functionality would normally open a modal, omitted for brevity as per request to remove form
  // We can re-add an Edit Modal later if needed.

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

  const onDelete = (id, studentName) => {
    Swal.fire({
      title: 'Delete Student?',
      text: `Are you sure you want to delete "${studentName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete!',
    }).then((result) => {
      if (result.isConfirmed) {
        axiosClient.delete(`/students/${id}`)
          .then(() => {
            toast.success('Student removed successfully');
            getStudents();
          })
          .catch((err) => {
            toast.error(err.response?.data?.message || 'Failed to delete student.');
          });
      }
    });
  };

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.section && s.section.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCourse = filterCourse === "All" || s.course === filterCourse;
      const matchesYear = filterYear === "All" || (s.year_level && String(s.year_level) === filterYear);

      return matchesSearch && matchesCourse && matchesYear;
    });
  }, [students, searchTerm, filterCourse, filterYear]);

  // Unique Courses for Filter
  const availableCourses = useMemo(() => {
    const courses = new Set(students.map(s => s.course).filter(Boolean));
    return ["All", ...Array.from(courses).sort()];
  }, [students]);

  return (
    <div className="p-6 md:p-8 min-h-screen space-y-8 animate-fadeIn">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Student Directory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and view all registered students
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* View Toggle */}
          <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* SMART TOOLBAR */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-30 backdrop-blur-md">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            placeholder="Search students by name, ID, or section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>

        <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-1 md:pb-0">
          <div className="relative group">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="appearance-none pl-10 pr-8 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 cursor-pointer min-w-[140px]"
            >
              <option value="All">All Courses</option>
              {availableCourses.filter(c => c !== "All").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" size={18} />
          </div>

          <div className="relative group">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="appearance-none pl-10 pr-8 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 cursor-pointer min-w-[120px]"
            >
              <option value="All">All Years</option>
              {[1, 2, 3, 4].map(y => (
                <option key={y} value={y}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" size={18} />
          </div>
        </div>
      </GlassCard>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search size={64} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No students found</p>
          <p className="text-sm">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredStudents.map((student) => {
                const style = getCourseStyle(student.course);
                return (
                  <GlassCard
                    key={student.id}
                    className="relative group hover:scale-[1.02] transition-transform duration-300 border-t-4"
                    style={{ borderTopColor: style.from.replace('from-', '').replace('-500', '') }} // Fallback dynamic color
                  >
                    {/* Header Gradient Line handled by border-t-4 via style injection or class if we used arbitrary values */}
                    <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r rounded-t-xl", style.from, style.to)} />

                    <div className="p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg bg-gradient-to-br", style.from, style.to)}>
                          {student.name.charAt(0)}
                        </div>
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400">
                            <MoreVertical size={18} />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 focus:outline-none z-10 overflow-hidden">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setViewingStudent(student)}
                                  className={cn("flex items-center gap-2 w-full px-4 py-3 text-sm transition-colors", active ? 'bg-gray-50 dark:bg-slate-700' : '')}
                                >
                                  <Award size={16} className="text-amber-500" /> View Details
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onDelete(student.id, student.name)}
                                  className={cn("flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 transition-colors", active ? 'bg-red-50 dark:bg-red-900/20' : '')}
                                >
                                  <Trash2 size={16} /> Delete
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </div>

                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white line-clamp-1" title={student.name}>
                          {student.name}
                        </h3>
                        <p className="font-mono text-xs text-gray-400">{student.student_id}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={cn("px-2 py-1 rounded-md text-xs font-semibold bg-opacity-20", style.text, style.bg)}>
                          {student.course || "No Course"}
                        </span>
                        {student.year_level && (
                          <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                            Year {student.year_level}
                          </span>
                        )}
                        {student.section && (
                          <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                            Sec {student.section}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-gray-400">
                        {/* Contact Info Indicators */}
                        <div className="flex gap-2">
                          {student.email && <Mail size={14} className="hover:text-primary-500 cursor-help" title={student.email} />}
                          {student.phone_number && <Phone size={14} className="hover:text-green-500 cursor-help" title={student.phone_number} />}
                        </div>
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Course & Year</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredStudents.map((student) => {
                    const style = getCourseStyle(student.course);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm bg-gradient-to-br", style.from, style.to)}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 dark:text-white">{student.name}</div>
                              <div className="text-xs font-mono text-gray-400">{student.student_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className={cn("text-sm font-medium", style.text)}>
                              {student.course}
                            </span>
                            <span className="text-xs text-gray-500">
                              {student.year_level ? `Year ${student.year_level}` : ''}
                              {student.section ? ` • Sec ${student.section}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            {student.email && <div className="flex items-center gap-2"><Mail size={12} className="text-gray-400" /> {student.email}</div>}
                            {student.phone_number && <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400" /> {student.phone_number}</div>}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingStudent(student)}
                              className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                              title="View Profile"
                            >
                              <Award size={18} />
                            </button>
                            <button
                              onClick={() => onDelete(student.id, student.name)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* MODALS */}
      {viewingStudent && (
        <StudentProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
        />
      )}
    </div>
  );
}
