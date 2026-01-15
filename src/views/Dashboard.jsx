import { useEffect, useState } from "react";
import axiosClient from "../axios-client";

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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">PCLU Dashboard Overview</h2>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* Card 1: Total Titles */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm font-bold uppercase mb-1">Total Titles</div>
          <div className="text-3xl font-bold text-gray-800">{stats.titles}</div>
        </div>

        {/* Card 2: Total Copies */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <div className="text-gray-500 text-sm font-bold uppercase mb-1">Physical Books</div>
          <div className="text-3xl font-bold text-gray-800">{stats.copies}</div>
        </div>

        {/* Card 3: Active Loans */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="text-gray-500 text-sm font-bold uppercase mb-1">Books Borrowed</div>
          <div className="text-3xl font-bold text-gray-800">{stats.loans}</div>
        </div>

        {/* Card 4: Students */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-gray-500 text-sm font-bold uppercase mb-1">Reg. Students</div>
          <div className="text-3xl font-bold text-gray-800">{stats.students}</div>
        </div>

      </div>

      {/* WELCOME SECTION */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
        <h3 className="text-3xl font-bold mb-2">Welcome to PCLU Library System</h3>
        <p className="opacity-90 text-lg">
          You are logged in as Administrator. Use the sidebar to manage inventory and circulation.
        </p>
      </div>
    </div>
  );
}