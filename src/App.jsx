import { useState } from "react";
import Login from "./views/Login";
import Books from "./views/Books";
import Circulation from "./views/Circulation";
import History from "./views/History";
import Dashboard from "./views/Dashboard";
import Students from "./views/Students";

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

  // IF LOGGED IN -> SHOW MAIN LAYOUT
  return (
    <div className="min-h-screen bg-gray-100 flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">Library System</h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          
          {/* HISTORY LOGS */}
          <button 
             onClick={() => setActiveTab("history")}
             className={`w-full text-left px-4 py-2 rounded ${activeTab === 'history' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             📜 History Logs
          </button>

          {/* CIRCULATION */}
          <button 
            onClick={() => setActiveTab("circulation")}
            className={`w-full text-left px-4 py-2 rounded ${activeTab === 'circulation' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            🔄 Circulation
          </button>

          {/* DASHBOARD */}
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            📊 Dashboard
          </button>

          {/* BOOK INVENTORY */}
          <button 
            onClick={() => setActiveTab("books")}
            className={`w-full text-left px-4 py-2 rounded ${activeTab === 'books' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            📚 Book Inventory
          </button>

          {/* STUDENT LIST (Added Here!) */}
          <button 
            onClick={() => setActiveTab("students")}
            className={`w-full text-left px-4 py-2 rounded ${activeTab === 'students' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            🎓 Student List
          </button>

        </nav>

        <div className="p-4 border-t">
          <div className="text-sm text-gray-600 mb-2">User: {userName}</div>
          <button onClick={onLogout} className="w-full text-left text-red-500 hover:text-red-700 text-sm font-bold">
            Logout
          </button>
        </div>
      </aside> 

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-auto h-screen">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'students' && <Students />}
        {activeTab === 'books' && <Books />}
        {activeTab === 'circulation' && <Circulation />}
        {activeTab === 'history' && <History />}
      </main>
    </div>
  );
}