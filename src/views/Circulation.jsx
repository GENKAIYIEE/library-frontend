import { useState } from "react";
import axiosClient from "../axios-client";

export default function Circulation() {
  // STATE FOR BORROWING
  const [studentId, setStudentId] = useState("");
  const [borrowBookCode, setBorrowBookCode] = useState("");

  // STATE FOR RETURNING
  const [returnBookCode, setReturnBookCode] = useState("");

  // GLOBAL MESSAGES
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // --- HANDLE BORROW ---
  const handleBorrow = (ev) => {
    ev.preventDefault();
    setMessage(null);
    setError(null);

    axiosClient.post("/borrow", {
      student_id: studentId,
      asset_code: borrowBookCode
    })
    .then(({ data }) => {
      setMessage(`✅ Success! Book borrowed until ${data.data.due_date}`);
      setStudentId("");      // Clear form
      setBorrowBookCode(""); // Clear form
    })
    .catch(err => {
      const response = err.response;
      if (response && response.status === 422) {
        setError(response.data.message);
      } else {
        setError("Error processing loan. Check Student ID.");
      }
    });
  };

  // --- HANDLE RETURN ---
  const handleReturn = (ev) => {
    ev.preventDefault();
    setMessage(null);
    setError(null);

    axiosClient.post("/return", {
      asset_code: returnBookCode
    })
    .then(({ data }) => {
      // 1. Clear the input
      setReturnBookCode("");
      
      // 2. CHECK FOR FINES (The New Feature)
      if (data.penalty > 0) {
        // Late Return -> Show Alert
        alert(`⚠️ LATE RETURN ALERT!\n\nThis book is ${data.days_late} days late.\nStudent must pay: ₱${data.penalty}.00`);
        setMessage(`⚠️ Book returned with Late Fee: ₱${data.penalty}.00`);
      } else {
        // On Time -> Show Success
        setMessage("✅ Success! Book returned and is now available.");
      }
    })
    .catch(err => {
      const response = err.response;
      if (response && response.status === 422) {
        setError(response.data.message);
      } else {
        setError("Error returning book. Check the barcode.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* LEFT SIDE: BORROW */}
      <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
        <h2 className="text-xl font-bold mb-4 text-gray-800">📖 Borrow Book</h2>
        <form onSubmit={handleBorrow} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Student ID</label>
            <input 
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="e.g. 2025-1001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Book Barcode</label>
            <input 
              value={borrowBookCode}
              onChange={e => setBorrowBookCode(e.target.value)}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Scan Barcode Here"
              required
            />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold transition">
            Confirm Loan
          </button>
        </form>
      </div>

      {/* RIGHT SIDE: RETURN */}
      <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
        <h2 className="text-xl font-bold mb-4 text-gray-800">↩️ Return Book</h2>
        <form onSubmit={handleReturn} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Book Barcode</label>
            <input 
              value={returnBookCode}
              onChange={e => setReturnBookCode(e.target.value)}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" 
              placeholder="Scan Barcode Here"
              required
            />
          </div>
          <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold transition">
            Mark as Returned
          </button>
        </form>
      </div>

      {/* STATUS MESSAGES AREA */}
      <div className="md:col-span-2">
        {message && (
          <div className={`border px-4 py-3 rounded ${message.includes('Late Fee') ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}