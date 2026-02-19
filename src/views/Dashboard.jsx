import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, BookOpen, ClipboardList, Copy, DollarSign, LayoutDashboard, Repeat, Users } from "lucide-react";
import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import FlipBookCard from "../components/FlipBookCard";
import Leaderboard from "../components/Leaderboard";
import MostPopularBooks from "../components/MostPopularBooks";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import GlassCard from "../components/ui/GlassCard";
import Pagination from "../components/ui/Pagination";

// ... (imports remain the same)

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    titles: 0,
    copies: 0,
    copies_breakdown: null, // Initialize breakdown
    loans: 0,
    students: 0,
    todayAttendance: 0
  });

  const [availableBooks, setAvailableBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = () => {
      // Fetch stats
      axiosClient.get("/dashboard/stats")
        .then(({ data }) => setStats(prev => ({ ...prev, ...data })))
        .catch(err => console.error(err));

      // Fetch dashboard books
      axiosClient.get("/dashboard/books")
        .then(({ data }) => setAvailableBooks(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));

      // Fetch today's attendance count
      axiosClient.get("/attendance/today")
        .then(({ data }) => setStats(prev => ({ ...prev, todayAttendance: data.count || 0 })))
        .catch(err => console.debug("Attendance fetch:", err));
    };

    // Initial fetch
    fetchData();

    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-8 min-h-screen pb-24"
    >
      {/* Page Header is same */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg shadow-primary-900/20">
          <LayoutDashboard size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-slate-400">
            Dashboard
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Overview of the library inventory and activities.</p>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="Total Book Titles"
          value={stats.titles}
          icon={BookOpen}
          color="bg-blue-500"
          delay={0}
        />
        <DashboardStatCard
          title="Physical Copies"
          value={stats.copies}
          icon={Copy}
          color="bg-indigo-500"
          delay={0.1}
          breakdown={stats.copies_breakdown} // Pass breakdown here
        />
        <DashboardStatCard
          title="Active Loans"
          value={stats.loans}
          icon={Repeat}
          color="bg-orange-500"
          delay={0.2}
          breakdown={stats.loans_breakdown} // Pass breakdown here
        />
        <DashboardStatCard
          title="Overdue Books"
          value={stats.overdue || 0}
          icon={AlertTriangle}
          color="bg-red-500"
          delay={0.3}
        />
        <DashboardStatCard
          title="Reg. Students"
          value={stats.students}
          icon={Users}
          color="bg-emerald-500"
          delay={0.4}
        />
        <DashboardStatCard
          title="Revenue Collected"
          value={`₱${Number(stats.collected_fines || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="bg-yellow-500"
          delay={0.5}
        />
        <DashboardStatCard
          title="Today's Visitors"
          value={stats.todayAttendance}
          icon={ClipboardList}
          color="bg-purple-500"
          delay={0.4}
        />
      </div>

      {/* ... (rest of main content grid remains same) ... */}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <MostPopularBooks />
          <motion.div variants={itemVariants}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-slate-400">
                Recently Available Books
              </h3>
              <button onClick={() => setActiveTab && setActiveTab('books')} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 hover:scale-105 transition-transform flex items-center gap-1">
                View All Inventory <ArrowRight size={16} />
              </button>
            </div>

            {availableBooks.length === 0 ? (
              <GlassCard className="p-12 text-center text-gray-500 dark:text-slate-400 flex flex-col items-center justify-center">
                <BookOpen className="mb-4 opacity-20" size={56} />
                <p className="text-lg">No books currently available to display.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {availableBooks.map((book, index) => (
                  <FlipBookCard key={book.id} book={book} index={index} />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white"
          >
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Welcome Back!</h3>
              <p className="text-primary-100/90 text-sm leading-relaxed">
                You are logged in as Administrator. Use this command center to oversee library operations.
              </p>
            </div>
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          </motion.div>

          <Leaderboard />

          <GlassCard className="p-6 h-80">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Category Distribution</h3>
            <CategoryPieChart />
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardStatCard({ title, value, icon: Icon, color, delay, breakdown }) {
  return (
    <GlassCard className="p-6 relative group overflow-hidden" delay={delay} hoverEffect={true}>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.replace('bg-', '')} shadow-sm transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{title}</p>

          {/* Custom Display for Active Loans (Student / Faculty) */}
          {breakdown && breakdown.student !== undefined && breakdown.faculty !== undefined ? (
            <div className="flex items-baseline gap-3 mt-1">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{breakdown.student}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Student</span>
              </div>
              <div className="text-gray-300 text-xl font-light">/</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{breakdown.faculty}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Faculty</span>
              </div>
            </div>
          ) : (
            /* Default Value Display */
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
              {value !== undefined ? value : "-"}
            </h3>
          )}
        </div>
      </div>

      {/* Hover Breakdown - Only for Physical Copies (where student/faculty is NOT defined) */}
      {breakdown && breakdown.student === undefined && (
        <div className="absolute inset-x-0 bottom-0 bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out border-t border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center text-xs font-semibold px-2">
            <div className="flex flex-col items-center">
              <span className="text-emerald-500">Avail</span>
              <span className="text-gray-700 dark:text-gray-200">{breakdown.available || 0}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-orange-500">Borr</span>
              <span className="text-gray-700 dark:text-gray-200">{breakdown.borrowed || 0}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-red-500">Dmg</span>
              <span className="text-gray-700 dark:text-gray-200">{breakdown.damaged || 0}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-500">Lost</span>
              <span className="text-gray-700 dark:text-gray-200">{breakdown.lost || 0}</span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}




