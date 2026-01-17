import { useState, useEffect } from "react";
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
  UserCircle,
  Clock
} from "lucide-react";

import NotificationBell from "./components/NotificationBell";

// Digital Clock Component
function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const secondsStr = seconds < 10 ? '0' + seconds : seconds;
    return { time: `${hours}:${minutesStr}:${secondsStr}`, ampm };
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const { time: timeStr, ampm } = formatTime(time);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl border border-white/20">
      <Clock size={20} className="text-white/70" />
      <div className="flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-white tabular-nums tracking-tight">{timeStr}</span>
          <span className="text-xs font-bold text-white/70">{ampm}</span>
        </div>
        <div className="text-xs text-white/60 font-medium">{formatDate(time)}</div>
      </div>
    </div>
  );
}

import PublicCatalog from "./views/PublicCatalog";

export default function App() {
  // PUBLIC KIOSK ROUTE - Bypass Auth
  if (window.location.pathname === '/catalog') {
    return <PublicCatalog />;
  }

  const token = localStorage.getItem("ACCESS_TOKEN");
  const userName = localStorage.getItem("USER_NAME");
  const [activeTab, setActiveTab] = useState("dashboard");

  // State for passing scanned barcode from Circulation to Books for registration
  const [pendingBarcode, setPendingBarcode] = useState("");

  const onLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Navigation handler for registering new books from scanner
  const handleNavigateToBooks = (barcode) => {
    setPendingBarcode(barcode);
    setActiveTab("books");
  };

  // Clear pending barcode when Books form is closed
  const handleClearPendingBarcode = () => {
    setPendingBarcode("");
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
          ? 'bg-white/20 text-white shadow-sm border border-white/30'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
    >
      <Icon size={20} strokeWidth={2} />
      {label}
    </button>
  );

  // IF LOGGED IN -> SHOW MAIN LAYOUT
  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">

      {/* SIDEBAR - Dark Blue Institutional Theme */}
      <aside className="w-72 bg-primary-600 flex flex-col h-screen sticky top-0 shadow-xl">
        {/* Header with Logo */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-lg shadow-sm">
            <Library size={24} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white leading-none truncate">PCLU Library</h1>
            <p className="text-xs text-white/70 mt-1 font-medium truncate">Management System</p>
          </div>
          <NotificationBell />
        </div>

        {/* Digital Clock */}
        <div className="px-4 pt-4">
          <DigitalClock />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-4 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 mt-2">Main Menu</div>
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavItem id="circulation" label="Circulation" icon={Repeat} />
          <NavItem id="books" label="Book Inventory" icon={BookOpen} />
          <NavItem id="students" label="Student List" icon={Users} />

          <div className="px-4 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 mt-6">Analytics & Logs</div>
          <NavItem id="history" label="History Logs" icon={HistoryIcon} />
          <NavItem id="reports" label="Reports" icon={FileBarChart} />
          <NavItem id="department-analytics" label="Dept. Analytics" icon={PieChart} />

          <div className="px-4 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 mt-6">Public Access</div>
          <a
            href="/catalog"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <BookOpen size={20} strokeWidth={2} />
            Student Kiosk
          </a>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 mb-3">
            <UserCircle className="text-white/70" size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{userName}</div>
              <div className="text-xs text-white/60">Administrator</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-white/80 hover:text-white hover:bg-white/10 py-2.5 rounded-lg text-sm font-bold transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - Light Gray Background */}
      <main className="flex-1 overflow-auto h-screen bg-gray-100">
        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'books' && <Books pendingBarcode={pendingBarcode} onClearPendingBarcode={handleClearPendingBarcode} />}
          {activeTab === 'circulation' && <Circulation onNavigateToBooks={handleNavigateToBooks} />}
          {activeTab === 'history' && <History />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'department-analytics' && <DepartmentAnalytics />}
        </div>
      </main>
    </div>
  );
}