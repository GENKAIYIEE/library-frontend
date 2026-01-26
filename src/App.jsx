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
import Settings from "./views/Settings";
import AttendanceLog from "./views/AttendanceLog";
import { ToastProvider } from "./components/ui/Toast";
import { ThemeProvider } from "./context/ThemeContext";
import MainLayout from "./components/MainLayout";



import PublicCatalog from "./views/PublicCatalog";
import PublicAttendance from "./views/PublicAttendance";
import PrintLibraryCard from "./views/PrintLibraryCard";

export default function App() {
  // PUBLIC KIOSK ROUTE - Bypass Auth
  if (window.location.pathname === '/catalog') {
    return (
      <ThemeProvider>
        <ToastProvider>
          <PublicCatalog />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  // PUBLIC ATTENDANCE KIOSK - Bypass Auth
  if (window.location.pathname === '/attendance') {
    return (
      <ThemeProvider>
        <ToastProvider>
          <PublicAttendance />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  // PRINT ROUTE - Bypass Main Layout
  if (window.location.pathname === '/print/card') {
    return <PrintLibraryCard />;
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
    return (
      <ThemeProvider>
        <ToastProvider>
          <Login />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  // IF LOGGED IN -> SHOW MAIN LAYOUT
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainLayout
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
          userName={userName}
        >
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'books' && <Books pendingBarcode={pendingBarcode} onClearPendingBarcode={handleClearPendingBarcode} />}
          {activeTab === 'circulation' && <Circulation onNavigateToBooks={handleNavigateToBooks} />}
          {activeTab === 'history' && <History />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'department-analytics' && <DepartmentAnalytics />}
          {activeTab === 'user-management' && <UserManagement />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'attendance-log' && <AttendanceLog />}
        </MainLayout>
      </ToastProvider>
    </ThemeProvider >
  );
}