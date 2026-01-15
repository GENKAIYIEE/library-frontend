import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import StatCard from "../components/StatCard";
import Card from "../components/ui/Card";
import { BookOpen, Copy, Repeat, Users, Info } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    titles: 0,
    copies: 0,
    loans: 0,
    students: 0
  });

  useEffect(() => {
    // Fetch the numbers from Laravel
    axiosClient.get("/dashboard/stats")
      .then(({ data }) => {
        setStats(data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Overview of the library inventory and activities.</p>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WELCOME SECTION */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-2">Welcome Back!</h3>
            <p className="opacity-90 text-lg mb-6 max-w-md">
              You are logged in as Administrator. Manage your library inventory, track student loans, and generate reports from here.
            </p>
          </div>
          {/* Abstract Pattern */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>
        </div>

        <Card title="System Status" className="h-full">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
            <Info className="text-primary-500 mt-1" size={20} />
            <div>
              <h4 className="font-bold text-slate-700">All Systems Operational</h4>
              <p className="text-sm text-slate-500 mt-1">
                The system is running smoothly. All database connections are active.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}