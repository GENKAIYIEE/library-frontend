import { useEffect, useState } from "react";
import axiosClient, { ASSET_URL } from "../axios-client";
import Leaderboard from "../components/Leaderboard";
import MonthlyTrendChart from "../components/charts/MonthlyTrendChart";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import { BookOpen, Copy, Repeat, Users, LayoutDashboard, Plus, Search, Scan, ArrowRight, ClipboardList } from "lucide-react";
import Pagination from "../components/ui/Pagination";
import { motion } from "framer-motion";
import GlassCard from "../components/ui/GlassCard";
import FlipBookCard from "../components/FlipBookCard";
import MostPopularBooks from "../components/MostPopularBooks";

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    titles: 0,
    copies: 0,
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
      className="space-y-8 p-8 min-h-screen pb-24" // Added padding-bottom for dock
    >
      {/* Page Header */}
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
          title="Total Titles"
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
        />
        <DashboardStatCard
          title="Active Loans"
          value={stats.loans}
          icon={Repeat}
          color="bg-orange-500"
          delay={0.2}
        />
        <DashboardStatCard
          title="Reg. Students"
          value={stats.students}
          icon={Users}
          color="bg-emerald-500"
          delay={0.3}
        />
        <DashboardStatCard
          title="Today's Visitors"
          value={stats.todayAttendance}
          icon={ClipboardList}
          color="bg-purple-500"
          delay={0.4}
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* LEFT COLUMN (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">

          {/* MOST POPULAR BOOKS */}
          <MostPopularBooks />

          {/* RECENTLY AVAILABLE BOOKS */}
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
                {availableBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((book, index) => (
                  <FlipBookCard key={book.id} book={book} index={index} />
                ))}
              </div>
            )}

            {/* Pagination for Recent Books */}
            {availableBooks.length > itemsPerPage && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(availableBooks.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </motion.div>

          {/* CHARTS SECTION (MOVED HERE) */}
          <div className="pt-4">
            <GlassCard className="p-6 h-96">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Monthly Borrowing Trends</h3>
              <MonthlyTrendChart />
            </GlassCard>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3 width) */}
        <div className="space-y-6">
          {/* WELCOME BACK WIDGET */}
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

          {/* LEADERBOARD */}
          <Leaderboard />

          {/* CATEGORIES PIE CHART */}
          <GlassCard className="p-6 h-80">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Category Distribution</h3>
            <CategoryPieChart />
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardStatCard({ title, value, icon: Icon, color, delay }) {
  return (
    <GlassCard className="p-6 flex items-center gap-4" delay={delay} hoverEffect={true}>
      <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.replace('bg-', '')} shadow-sm`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
          {value !== undefined ? value : "-"}
        </h3>
      </div>
    </GlassCard>
  );
}




