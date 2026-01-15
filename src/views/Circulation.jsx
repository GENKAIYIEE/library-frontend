import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import PaymentModal from "./PaymentModal";
import { Search, ChevronDown, User, Book } from "lucide-react";

export default function Circulation() {
  // STATE FOR BORROWING
  const [studentId, setStudentId] = useState("");
  const [borrowBookCode, setBorrowBookCode] = useState("");

  // Available books dropdown
  const [availableBooks, setAvailableBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState("");

  // Students dropdown
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // STATE FOR RETURNING
  const [returnBookCode, setReturnBookCode] = useState("");
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [filteredBorrowedBooks, setFilteredBorrowedBooks] = useState([]);
  const [showReturnDropdown, setShowReturnDropdown] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");

  // GLOBAL MESSAGES
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // PAYMENT MODAL STATE
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchAvailableBooks();
    fetchBorrowedBooks();
    fetchStudents();
  }, []);

  // Filter available books
  useEffect(() => {
    if (bookSearchQuery) {
      const query = bookSearchQuery.toLowerCase();
      const filtered = availableBooks.filter(book =>
        book.asset_code.toLowerCase().includes(query) ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(availableBooks);
    }
  }, [bookSearchQuery, availableBooks]);

  // Filter students
  useEffect(() => {
    if (studentSearchQuery) {
      const query = studentSearchQuery.toLowerCase();
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.student_id.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [studentSearchQuery, students]);

  // Filter borrowed books
  useEffect(() => {
    if (returnSearchQuery) {
      const query = returnSearchQuery.toLowerCase();
      const filtered = borrowedBooks.filter(book =>
        book.asset_code.toLowerCase().includes(query) ||
        book.title.toLowerCase().includes(query) ||
        book.borrower.toLowerCase().includes(query) ||
        book.student_id.toLowerCase().includes(query)
      );
      setFilteredBorrowedBooks(filtered);
    } else {
      setFilteredBorrowedBooks(borrowedBooks);
    }
  }, [returnSearchQuery, borrowedBooks]);

  const fetchAvailableBooks = () => {
    axiosClient.get("/books/available")
      .then(({ data }) => {
        setAvailableBooks(data);
        setFilteredBooks(data);
      })
      .catch(() => { });
  };

  const fetchBorrowedBooks = () => {
    axiosClient.get("/books/borrowed")
      .then(({ data }) => {
        setBorrowedBooks(data);
        setFilteredBorrowedBooks(data);
      })
      .catch(() => { });
  };

  const fetchStudents = () => {
    axiosClient.get("/students")
      .then(({ data }) => {
        setStudents(data);
        setFilteredStudents(data);
      })
      .catch(() => { });
  };

  const handleSelectBook = (assetCode) => {
    setBorrowBookCode(assetCode);
    setBookSearchQuery("");
    setShowBookDropdown(false);
  };

  const handleSelectStudent = (studentIdValue) => {
    setStudentId(studentIdValue);
    setStudentSearchQuery("");
    setShowStudentDropdown(false);
  };

  const handleSelectReturnBook = (assetCode) => {
    setReturnBookCode(assetCode);
    setReturnSearchQuery("");
    setShowReturnDropdown(false);
  };

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
        setMessage(`✅ Success! Book borrowed until ${new Date(data.data.due_date).toLocaleDateString()}`);
        setStudentId("");
        setBorrowBookCode("");
        setBookSearchQuery("");
        setStudentSearchQuery("");
        fetchAvailableBooks();
        fetchBorrowedBooks();
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
        setReturnBookCode("");
        setReturnSearchQuery("");

        if (data.penalty > 0) {
          axiosClient.get("/transactions")
            .then(({ data: transactions }) => {
              const transaction = transactions.find(t =>
                t.penalty_amount == data.penalty &&
                t.payment_status === 'pending'
              );
              if (transaction) {
                setPendingTransaction(transaction);
                setShowPaymentModal(true);
              }
            });
          setMessage(`⚠️ Book returned with Late Fee: ₱${data.penalty}.00 (${data.days_late} days late)`);
        } else {
          setMessage("✅ Success! Book returned and is now available.");
        }
        fetchAvailableBooks();
        fetchBorrowedBooks();
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

  const handlePaymentSuccess = (successMessage) => {
    setMessage(`✅ ${successMessage}`);
    setShowPaymentModal(false);
    setPendingTransaction(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* LEFT SIDE: BORROW */}
      <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
        <h2 className="text-xl font-bold mb-4 text-gray-800">📖 Borrow Book</h2>
        <form onSubmit={handleBorrow} className="space-y-4">

          {/* STUDENT DROPDOWN */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1">Select Student</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={studentId || studentSearchQuery}
                onChange={e => {
                  setStudentSearchQuery(e.target.value);
                  setStudentId("");
                  setShowStudentDropdown(true);
                }}
                onFocus={() => setShowStudentDropdown(true)}
                className="w-full pl-10 pr-10 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Search by name or student ID..."
                required
              />
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                size={18}
                onClick={() => setShowStudentDropdown(!showStudentDropdown)}
              />
            </div>

            {showStudentDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {students.length === 0 ? "No students registered" : "No matches found"}
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student.student_id)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-gray-800">{student.name}</div>
                        <div className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {student.student_id}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* AVAILABLE BOOKS DROPDOWN */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1">Select Available Book</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={borrowBookCode || bookSearchQuery}
                onChange={e => {
                  setBookSearchQuery(e.target.value);
                  setBorrowBookCode("");
                  setShowBookDropdown(true);
                }}
                onFocus={() => setShowBookDropdown(true)}
                className="w-full pl-10 pr-10 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Search by barcode, title, or author..."
                required
              />
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                size={18}
                onClick={() => setShowBookDropdown(!showBookDropdown)}
              />
            </div>

            {showBookDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredBooks.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {availableBooks.length === 0 ? "No books available" : "No matches found"}
                  </div>
                ) : (
                  filteredBooks.map((book) => (
                    <div
                      key={book.asset_code}
                      onClick={() => handleSelectBook(book.asset_code)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-blue-600">{book.title}</div>
                          <div className="text-sm text-gray-600">by {book.author}</div>
                          <div className="text-xs text-gray-500 mt-1">📍 {book.location}</div>
                        </div>
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {book.asset_code}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded flex justify-between">
            <span>👤 {filteredStudents.length} students</span>
            <span>📚 {filteredBooks.length} available books</span>
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

          {/* BORROWED BOOKS DROPDOWN */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1">Select Borrowed Book</label>
            <div className="relative">
              <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={returnBookCode || returnSearchQuery}
                onChange={e => {
                  setReturnSearchQuery(e.target.value);
                  setReturnBookCode("");
                  setShowReturnDropdown(true);
                }}
                onFocus={() => setShowReturnDropdown(true)}
                className="w-full pl-10 pr-10 border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Search by barcode, title, or borrower..."
                required
              />
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                size={18}
                onClick={() => setShowReturnDropdown(!showReturnDropdown)}
              />
            </div>

            {showReturnDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredBorrowedBooks.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {borrowedBooks.length === 0 ? "No books currently borrowed" : "No matches found"}
                  </div>
                ) : (
                  filteredBorrowedBooks.map((book) => (
                    <div
                      key={book.asset_code}
                      onClick={() => handleSelectReturnBook(book.asset_code)}
                      className={`p-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0 transition ${book.is_overdue ? 'bg-red-50' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-gray-800">{book.title}</div>
                          <div className="text-sm text-gray-600">by {book.author}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            👤 {book.borrower} ({book.student_id})
                          </div>
                          <div className={`text-xs mt-1 ${book.is_overdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                            📅 Due: {book.due_date ? new Date(book.due_date).toLocaleDateString() : 'N/A'}
                            {book.is_overdue && ' ⚠️ OVERDUE'}
                          </div>
                        </div>
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {book.asset_code}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
            📖 {borrowedBooks.length} book{borrowedBooks.length !== 1 ? 's' : ''} currently borrowed
            {borrowedBooks.filter(b => b.is_overdue).length > 0 && (
              <span className="text-red-600 font-bold ml-2">
                ({borrowedBooks.filter(b => b.is_overdue).length} overdue)
              </span>
            )}
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

      {/* PAYMENT MODAL */}
      {showPaymentModal && pendingTransaction && (
        <PaymentModal
          transaction={pendingTransaction}
          onClose={() => {
            setShowPaymentModal(false);
            setPendingTransaction(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}