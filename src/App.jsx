import { useState, useEffect } from "react";
import Login from "./views/Login";
import Books from "./views/Books";
import Circulation from "./views/Circulation";
import History from "./views/History";
import Dashboard from "./views/Dashboard";
import Students from "./views/Students";
import Reports from "./views/Reports";
import DepartmentAnalytics from "./views/DepartmentAnalytics";
import UserManagement from "./views/UserManagement";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Repeat,
  History as HistoryIcon,
  FileBarChart,
  PieChart,
  Library,
  UserPlus,
  X,
  Clock,
  LogOut,
  User
} from "lucide-react";

// Digital Clock Component for Sidebar
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
    hours = hours ? hours : 12;
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // State for passing scanned barcode from Circulation to Books for registration
  const [pendingBarcode, setPendingBarcode] = useState("");

  // Notification count (can be connected to real data later)
  const [notificationCount, setNotificationCount] = useState(3);

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

  // Toggle mobile sidebar
  const handleMenuToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // IF NOT LOGGED IN -> SHOW LOGIN PAGE
  if (!token) {
    return <Login />;
  }

  const NavItem = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setMobileSidebarOpen(false); // Close mobile sidebar on nav
      }}
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

  // Sidebar Content Component
  const SidebarContent = () => (
    <>
      {/* Header with Logo */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="bg-white p-2.5 rounded-lg shadow-sm">
          <Library size={24} style={{ color: '#020463' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white leading-none truncate">PCLU Library</h1>
          <p className="text-xs text-white/70 mt-1 font-medium truncate">Management System</p>
        </div>
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
        <NavItem id="user-management" label="User Management" icon={UserPlus} />

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

      {/* User Profile & Sign Out */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
            <p className="text-xs text-white/60">Administrator</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
        >
          <LogOut size={20} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </>
  );

  // IF LOGGED IN -> SHOW MAIN LAYOUT
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="flex">
        {/* SIDEBAR - Desktop (always visible) */}
        <aside className="hidden lg:flex w-72 flex-col h-screen sticky top-0 shadow-xl" style={{ backgroundColor: '#020463' }}>
          <SidebarContent />
        </aside>

        {/* SIDEBAR - Mobile Overlay */}
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Sidebar */}
            <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 shadow-2xl animate-slideIn" style={{ backgroundColor: '#020463' }}>
              {/* Close button */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </aside>
          </>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-auto min-h-screen bg-gray-100">
          <div className="p-8 max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'students' && <Students />}
            {activeTab === 'books' && <Books pendingBarcode={pendingBarcode} onClearPendingBarcode={handleClearPendingBarcode} />}
            {activeTab === 'circulation' && <Circulation onNavigateToBooks={handleNavigateToBooks} />}
            {activeTab === 'history' && <History />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'department-analytics' && <DepartmentAnalytics />}
            {activeTab === 'user-management' && <UserManagement />}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}