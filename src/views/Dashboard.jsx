import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import StatCard from "../components/StatCard";
import Leaderboard from "../components/Leaderboard";
import MonthlyTrendChart from "../components/charts/MonthlyTrendChart";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import { BookOpen, Copy, Repeat, Users, LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    titles: 0,
    copies: 0,
    loans: 0,
    students: 0
  });

  const [availableBooks, setAvailableBooks] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      // Fetch stats
      axiosClient.get("/dashboard/stats")
        .then(({ data }) => setStats(data))
        .catch(err => console.error(err));

      // Fetch dashboard books
      axiosClient.get("/dashboard/books")
        .then(({ data }) => setAvailableBooks(data))
        .catch(err => console.error(err));
    };

    // Initial fetch
    fetchData();

    // Poll every 30 seconds (reduced from 5s to avoid 429 Too Many Requests)
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 bg-gray-50 -m-8 p-8 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
          <LayoutDashboard size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500">Overview of the library inventory and activities.</p>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Titles"
          value={stats.titles}
          icon={BookOpen}
          color="blue"
          description="Unique book titles"
        />
        <StatCard
          title="Physical Copies"
          value={stats.copies}
          icon={Copy}
          color="indigo"
          description="Total books in shelf"
        />
        <StatCard
          title="Active Loans"
          value={stats.loans}
          icon={Repeat}
          color="orange"
          description="Books currently borrowed"
        />
        <StatCard
          title="Reg. Students"
          value={stats.students}
          icon={Users}
          color="green"
          description="Total registered students"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">30-Day Borrowing Activity</h3>
          <MonthlyTrendChart />
        </div>

        {/* Category Popularity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Categories</h3>
          <CategoryPieChart />
        </div>
      </div>


      {/* RECENTLY AVAILABLE BOOKS GRID */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Recently Available Books</h3>
          <a href="/books" className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline transition">
            View All Inventory &rarr;
          </a>
        </div>

        {availableBooks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center text-gray-500">
            <BookOpen className="mx-auto mb-4 opacity-20" size={56} />
            <p className="text-lg">No books currently available to display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {availableBooks.map((book) => (
              <div key={book.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
                {/* Book Cover */}
                <div className="aspect-[2/3] bg-gray-100 relative overflow-hidden">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 ${book.cover_image ? 'hidden' : 'flex'}`}>
                    <BookOpen size={32} strokeWidth={1.5} />
                  </div>

                  {/* Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                    Available
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight mb-1" title={book.title}>
                    {book.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-auto">{book.author}</p>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                      {book.category}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {book.available_copies} copies
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WELCOME SECTION */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-3">Welcome Back!</h3>
            <p className="opacity-80 text-lg mb-6 max-w-md leading-relaxed">
              You are logged in as Administrator. Manage your library inventory, track student loans, and generate reports from here.
            </p>
          </div>
          {/* Abstract Pattern */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        {/* TOP READERS LEADERBOARD */}
        <Leaderboard />
      </div>
    </div>
  );
}

