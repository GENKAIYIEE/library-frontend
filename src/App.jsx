import { useState } from "react";
import Login from "./views/Login";
import Books from "./views/Books";
import Circulation from "./views/Circulation";
import History from "./views/History";
import Dashboard from "./views/Dashboard";
import Students from "./views/Students";
import Reports from "./views/Reports";
import DepartmentAnalytics from "./views/DepartmentAnalytics";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Repeat,
  History as HistoryIcon,
  FileBarChart,
  PieChart,
  LogOut,
  Library,
  UserCircle
} from "lucide-react";

export default function App() {
  const token = localStorage.getItem("ACCESS_TOKEN");
  const userName = localStorage.getItem("USER_NAME");
  const [activeTab, setActiveTab] = useState("dashboard");

  const onLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // IF NOT LOGGED IN -> SHOW LOGIN PAGE
  if (!token) {
    return <Login />;
  }

  const NavItem = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
        ${activeTab === id
          ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <Icon size={20} strokeWidth={2} />
      {label}
    </button>
  );

  // IF LOGGED IN -> SHOW MAIN LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-lg text-white">
            <Library size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none">PCLU Library</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Management System</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Main Menu</div>
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavItem id="circulation" label="Circulation" icon={Repeat} />
          <NavItem id="books" label="Book Inventory" icon={BookOpen} />
          <NavItem id="students" label="Student List" icon={Users} />

          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Analytics & Logs</div>
          <NavItem id="history" label="History Logs" icon={HistoryIcon} />
          <NavItem id="reports" label="Reports" icon={FileBarChart} />
          <NavItem id="department-analytics" label="Dept. Analytics" icon={PieChart} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-3">
            <UserCircle className="text-slate-400" size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800 truncate">{userName}</div>
              <div className="text-xs text-slate-500">Administrator</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg text-sm font-bold transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-auto h-screen bg-slate-50/50">
        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'books' && <Books />}
          {activeTab === 'circulation' && <Circulation />}
          {activeTab === 'history' && <History />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'department-analytics' && <DepartmentAnalytics />}
        </div>
      </main>
    </div>
  );
}