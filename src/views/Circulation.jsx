import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import PaymentModal from "./PaymentModal";
import BarcodeInput from "../components/BarcodeInput";
import BookScanModal from "../components/BookScanModal";
import CameraScanner from "../components/CameraScanner";
import { Search, ChevronDown, User, Book, Scan, ToggleLeft, ToggleRight, Camera } from "lucide-react";

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

  // CLEARANCE STATE
  const [clearance, setClearance] = useState(null);
  const [selectedStudentCourse, setSelectedStudentCourse] = useState("");

  // SCANNER MODE STATE
  const [scannerMode, setScannerMode] = useState(false);
  const [scannedBook, setScannedBook] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

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

  const fetchAvailableBooks = (course = "") => {
    axiosClient.get("/books/available", { params: { course } })
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

  const handleSelectStudent = (studentIdValue, course = "") => {
    setStudentId(studentIdValue);
    setSelectedStudentCourse(course);
    setStudentSearchQuery("");
    setShowStudentDropdown(false);
    setClearance(null);

    // Fetch clearance status
    axiosClient.get(`/students/${studentIdValue}/clearance`)
      .then(({ data }) => {
        setClearance(data);
        // Refresh books with student's course for prioritization
        fetchAvailableBooks(data.course);
      })
      .catch(() => setClearance(null));
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

  // BARCODE SCAN HANDLERS
  const handleScanResult = (result) => {
    if (result.found) {
      setScannedBook(result);
      setShowScanModal(true);
    } else {
      setError(`❌ ${result.message}`);
    }
  };

  const handleScanBorrow = (assetCode) => {
    setShowScanModal(false);
    setBorrowBookCode(assetCode);
    setScannerMode(false);
    setMessage(`📚 Book selected: ${scannedBook.title}. Select a student to complete the loan.`);
  };

  const handleScanReturn = (assetCode) => {
    setShowScanModal(false);
    // Directly process return
    axiosClient.post("/return", { asset_code: assetCode })
      .then(({ data }) => {
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
        setScannedBook(null);
      })
      .catch(err => {
        setError(err.response?.data?.message || "Error returning book.");
      });
  };

  return (
    <div className="space-y-6">

      {/* SCANNER MODE HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scan size={28} />
            <div>
              <h2 className="text-lg font-bold">Quick Scan Mode</h2>
              <p className="text-sm text-white/80">Scan book barcode or QR code for instant lookup</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Camera Scanner Button */}
            <button
              onClick={() => setShowCameraScanner(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition bg-green-500 hover:bg-green-600 text-white"
            >
              <Camera size={20} />
              📷 Camera Scan
            </button>
            {/* Text Scanner Toggle */}
            <button
              onClick={() => setScannerMode(!scannerMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${scannerMode
                ? 'bg-white text-indigo-600'
                : 'bg-white/20 hover:bg-white/30'
                }`}
            >
              {scannerMode ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {scannerMode ? 'Text Mode ON' : 'Text Input'}
            </button>
          </div>
        </div>

        {/* Scanner Input (shown when enabled) */}
        {scannerMode && (
          <div className="mt-4">
            <BarcodeInput
              onResult={handleScanResult}
              placeholder="Scan book barcode or type manually..."
              autoFocus={true}
            />
          </div>
        )}
      </div>


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
                        onClick={() => handleSelectStudent(student.student_id, student.course)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-800">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.course || 'No course'} - Year {student.year_level || '?'}</div>
                          </div>
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

            {/* CLEARANCE STATUS BADGE */}
            {clearance && (
              <div className={`p-3 rounded-lg border ${clearance.is_cleared ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-bold ${clearance.is_cleared ? 'text-green-700' : 'text-red-700'}`}>
                      {clearance.is_cleared ? '✅ CLEARED' : '🚫 BLOCKED'}
                    </span>
                    <span className="text-gray-600 text-sm ml-2">
                      {clearance.course} | Loan Period: {clearance.loan_days} day(s)
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <div>Active Loans: <span className="font-bold">{clearance.active_loans}/3</span></div>
                    {clearance.pending_fines > 0 && (
                      <div className="text-red-600 font-bold">Pending: ₱{parseFloat(clearance.pending_fines).toFixed(2)}</div>
                    )}
                  </div>
                </div>
                {clearance.block_reason && (
                  <div className="text-red-600 text-sm mt-1">⚠️ {clearance.block_reason}</div>
                )}
              </div>
            )}

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
                        className={`p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition ${book.is_recommended ? 'bg-green-50' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-bold text-blue-600 flex items-center gap-2">
                              {book.title}
                              {book.is_recommended && (
                                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">⭐ Recommended</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">by {book.author}</div>
                            <div className="text-xs text-gray-500 mt-1">📍 {book.location} | 📁 {book.category}</div>
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

            <button
              disabled={clearance && !clearance.is_cleared}
              className={`w-full py-2 rounded font-bold transition ${clearance && !clearance.is_cleared
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {clearance && !clearance.is_cleared ? '🚫 Borrowing Blocked' : 'Confirm Loan'}
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

      {/* BOOK SCAN MODAL */}
      {showScanModal && scannedBook && (
        <BookScanModal
          book={scannedBook}
          onBorrow={handleScanBorrow}
          onReturn={handleScanReturn}
          onClose={() => {
            setShowScanModal(false);
            setScannedBook(null);
          }}
        />
      )}

      {/* CAMERA SCANNER */}
      {showCameraScanner && (
        <CameraScanner
          onResult={handleScanResult}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
}