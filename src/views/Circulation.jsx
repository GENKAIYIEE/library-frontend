import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import PaymentModal from "./PaymentModal";
import BookScanModal from "../components/BookScanModal";
import BookNotFoundModal from "../components/BookNotFoundModal";
import CameraScanner from "../components/CameraScanner";
import ScanModeSelector from "../components/ScanModeSelector";
import { Search, ChevronDown, User, Book, Scan, Camera } from "lucide-react";

export default function Circulation({ onNavigateToBooks }) {
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
  const [scannedBook, setScannedBook] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [scanMode, setScanMode] = useState(null); // 'borrow' | 'register' | 'return'

  // BOOK NOT FOUND MODAL STATE
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState("");

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
      .catch(err => {
        console.error("Failed to fetch available books:", err);
        setError("Failed to load available books.");
      });

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

    // Get book info for success message
    const bookInfo = borrowedBooks.find(b => b.asset_code === returnBookCode);
    const bookTitle = bookInfo?.title || 'Unknown';
    const assetCode = returnBookCode;

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
          setMessage(`⚠️ Book "${bookTitle}" (${assetCode}) returned with Late Fee: ₱${data.penalty}.00 (${data.days_late} days late)`);
        } else {
          setMessage(`✅ Success! Book "${bookTitle}" (${assetCode}) has been returned and is now available.`);
        }
        fetchAvailableBooks();
        fetchBorrowedBooks();
        if (studentId) refreshClearance();
      })
      .catch(err => {
        const response = err.response;
        if (response && response.status === 422) {
          setError(response.data.message);
        } else {
          setError(`Error returning book ${assetCode}. Check the barcode.`);
        }
      });
  };

  const refreshClearance = (id = studentId) => {
    if (!id) return;

    axiosClient.get(`/students/${id}/clearance`)
      .then(({ data }) => {
        setClearance(data);
      })
      .catch(() => { });
  };

  const handlePaymentSuccess = (successMessage) => {
    setMessage(`✅ ${successMessage}`);
    setShowPaymentModal(false);
    setPendingTransaction(null);
    if (studentId) refreshClearance();
  };

  // Handle mode selection from the pre-scan selector
  const handleModeSelect = (mode) => {
    setScanMode(mode);
    setShowModeSelector(false);
    setShowCameraScanner(true);
  };

  // BARCODE SCAN HANDLERS - Uses scanMode to determine action with proper validation
  const handleScanResult = (result) => {
    const scannedBarcode = result.asset_code || result.scanned_code || "";

    // Clear any previous messages
    setMessage(null);
    setError(null);

    switch (scanMode) {
      case 'borrow':
        // BORROW MODE: Book must be 'available' to borrow
        // Action: Pre-fill the borrow form with the scanned Book ID
        if (!result.found) {
          // Book not in database
          setNotFoundBarcode(scannedBarcode);
          setShowNotFoundModal(true);
          setShowCameraScanner(false);
        } else if (result.status === 'available') {
          // ✅ SUCCESS: Book is available, pre-fill the borrow form
          setShowCameraScanner(false);
          setBorrowBookCode(result.asset_code);
          setScannedBook(result); // Store for reference
          setMessage(`📚 Book "${result.title}" (${result.asset_code}) selected. Now select a student to complete the loan.`);
        } else if (result.status === 'borrowed') {
          // ❌ ERROR: Book is already checked out
          setError(`❌ Cannot borrow. Book "${result.title}" (${result.asset_code}) is currently borrowed.`);
          setShowCameraScanner(false);
        } else {
          // Unknown status
          setError(`Cannot borrow. Book status: ${result.status || 'unknown'}`);
          setShowCameraScanner(false);
        }
        break;

      case 'return':
        // RETURN MODE: Book must be 'borrowed' to return
        // Action: Direct database update - mark as returned immediately
        if (!result.found) {
          // Book not in database
          setNotFoundBarcode(scannedBarcode);
          setShowNotFoundModal(true);
          setShowCameraScanner(false);
        } else if (result.status === 'borrowed') {
          // ✅ SUCCESS: Book is borrowed, process return directly
          setShowCameraScanner(false);
          handleScanReturn(result.asset_code, result.title);
        } else if (result.status === 'available') {
          // ❌ ERROR: Book is not currently borrowed
          setError(`❌ This book is not currently borrowed. "${result.title}" (${result.asset_code}) is already available in the library.`);
          setShowCameraScanner(false);
        } else {
          // Unknown status
          setError(`Cannot return. Book status: ${result.status || 'unknown'}`);
          setShowCameraScanner(false);
        }
        break;

      case 'register':
        // REGISTER MODE: Book should NOT already exist in database
        // Action: Redirect to Inventory/Add Book page with pre-filled ISBN/ID
        if (result.found) {
          // ❌ ERROR: Book already exists
          setError(`❌ Book already registered: "${result.title}" (${result.asset_code})`);
          setShowCameraScanner(false);
        } else {
          // ✅ SUCCESS: Book not found, navigate to register page with pre-filled code
          setShowCameraScanner(false);
          if (onNavigateToBooks) {
            onNavigateToBooks(scannedBarcode);
          }
        }
        break;

      default:
        // No mode selected (shouldn't happen), fall back to showing scan modal
        setShowCameraScanner(false);
        if (result.found) {
          setScannedBook(result);
          setShowScanModal(true);
        } else {
          setNotFoundBarcode(scannedBarcode);
          setShowNotFoundModal(true);
        }
        break;
    }

    setScanMode(null);
  };

  // Handle registering a new book from the Not Found modal
  const handleRegisterBook = (barcode) => {
    setShowNotFoundModal(false);
    setNotFoundBarcode("");
    // Navigate to Books page with the barcode to pre-fill
    if (onNavigateToBooks) {
      onNavigateToBooks(barcode);
    }
  };

  const handleScanBorrow = (assetCode) => {
    setShowScanModal(false);
    setBorrowBookCode(assetCode);
    setMessage(`📚 Book selected: ${scannedBook.title}. Select a student to complete the loan.`);
  };

  const handleScanReturn = (assetCode, bookTitle = null) => {
    setShowScanModal(false);
    // Directly process return - immediate database update
    axiosClient.post("/return", { asset_code: assetCode })
      .then(({ data }) => {
        const displayTitle = bookTitle || data.title || assetCode;

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
          setMessage(`⚠️ Book "${displayTitle}" (${assetCode}) returned with Late Fee: ₱${data.penalty}.00 (${data.days_late} days late)`);
        } else {
          setMessage(`✅ Success! Book "${displayTitle}" (${assetCode}) has been returned and is now available.`);
        }
        fetchAvailableBooks();
        fetchBorrowedBooks();
        setScannedBook(null);
        if (studentId) refreshClearance();
      })
      .catch(err => {
        setError(err.response?.data?.message || `Error returning book ${assetCode}.`);
      });
  };

  // Handle adding a physical copy for a book that exists but has no copies
  const handleAddCopy = (book) => {
    setShowScanModal(false);
    setScannedBook(null);
    // Navigate to Books page - the book title already exists, they just need to add a copy
    // Show a message to guide the user
    setMessage(`📦 "${book.title}" needs a physical copy. Go to Book Inventory → find the book → click "+ Copy" to add a physical copy.`);
  };

  return (
    <div className="space-y-6 bg-gray-50 -m-8 p-8 min-h-screen">

      {/* SCANNER MODE HEADER - Deep Navy Blue Gradient */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 text-white p-6 rounded-2xl shadow-xl border border-primary-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Scan size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Quick Scan Mode</h2>
              <p className="text-sm text-white/70">Scan book barcode or QR code for instant lookup</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Camera Scanner Button */}
            <button
              onClick={() => setShowModeSelector(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all bg-white text-primary-600 hover:bg-white/90 hover:scale-105 shadow-lg"
            >
              <Camera size={20} />
              Camera Scan
            </button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT SIDE: BORROW - Elevated White Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 rounded-xl">
              <Book size={24} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Borrow Book</h2>
              <p className="text-sm text-gray-500">Issue a book to a student</p>
            </div>
          </div>
          <form onSubmit={handleBorrow} className="space-y-5">

            {/* STUDENT DROPDOWN - Modernized Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Student</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-400" size={18} />
                <input
                  type="text"
                  value={studentId || studentSearchQuery}
                  onChange={e => {
                    setStudentSearchQuery(e.target.value);
                    setStudentId("");
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  className="w-full pl-12 pr-12 border-2 border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-600 outline-none transition-all bg-gray-50 hover:bg-white"
                  placeholder="Search by name or student ID..."
                  required
                />
                <ChevronDown
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-primary-600 transition"
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

            {/* AVAILABLE BOOKS DROPDOWN - Modernized Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Available Book</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-400" size={18} />
                <input
                  type="text"
                  value={borrowBookCode || bookSearchQuery}
                  onChange={e => {
                    setBookSearchQuery(e.target.value);
                    setBorrowBookCode("");
                    setShowBookDropdown(true);
                  }}
                  onFocus={() => setShowBookDropdown(true)}
                  className="w-full pl-12 pr-12 border-2 border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-600 outline-none transition-all bg-gray-50 hover:bg-white"
                  placeholder="Search by barcode, title, or author..."
                  required
                />
                <ChevronDown
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-primary-600 transition"
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

            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="flex items-center gap-1"><User size={14} /> {filteredStudents.length} students</span>
              <span className="flex items-center gap-1"><Book size={14} /> {filteredBooks.length} available</span>
            </div>

            {/* Confirm Loan Button - Full Width, High Contrast Dark Blue */}
            <button
              disabled={clearance && !clearance.is_cleared}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 transform ${clearance && !clearance.is_cleared
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-primary-200'
                }`}
            >
              {clearance && !clearance.is_cleared ? '🚫 Borrowing Blocked' : '✓ Confirm Loan'}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: RETURN - Elevated White Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Book size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Return Book</h2>
              <p className="text-sm text-gray-500">Process a book return</p>
            </div>
          </div>
          <form onSubmit={handleReturn} className="space-y-5">

            {/* BORROWED BOOKS DROPDOWN - Modernized Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Borrowed Book</label>
              <div className="relative">
                <Book className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400" size={18} />
                <input
                  type="text"
                  value={returnBookCode || returnSearchQuery}
                  onChange={e => {
                    setReturnSearchQuery(e.target.value);
                    setReturnBookCode("");
                    setShowReturnDropdown(true);
                  }}
                  onFocus={() => setShowReturnDropdown(true)}
                  className="w-full pl-12 pr-12 border-2 border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all bg-gray-50 hover:bg-white"
                  placeholder="Search by barcode, title, or borrower..."
                  required
                />
                <ChevronDown
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-emerald-600 transition"
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

            {/* Stats Row with Status Badge */}
            <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500">📖 {borrowedBooks.length} book{borrowedBooks.length !== 1 ? 's' : ''} borrowed</span>
              {borrowedBooks.filter(b => b.is_overdue).length > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold border border-red-200">
                  {borrowedBooks.filter(b => b.is_overdue).length} Overdue
                </span>
              )}
            </div>

            {/* Mark as Returned Button - Full Width, Success Green */}
            <button className="w-full bg-emerald-600 text-white py-4 rounded-xl hover:bg-emerald-700 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] font-bold text-lg transition-all duration-200 transform shadow-md shadow-emerald-200">
              ✓ Mark as Returned
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
          onAddCopy={handleAddCopy}
          onClose={() => {
            setShowScanModal(false);
            setScannedBook(null);
          }}
        />
      )}

      {/* SCAN MODE SELECTOR */}
      {showModeSelector && (
        <ScanModeSelector
          onSelectMode={handleModeSelect}
          onClose={() => setShowModeSelector(false)}
        />
      )}

      {/* CAMERA SCANNER */}
      {showCameraScanner && (
        <CameraScanner
          onResult={handleScanResult}
          onClose={() => {
            setShowCameraScanner(false);
            setScanMode(null);
          }}
        />
      )}

      {/* BOOK NOT FOUND MODAL */}
      {showNotFoundModal && (
        <BookNotFoundModal
          scannedCode={notFoundBarcode}
          onRegister={handleRegisterBook}
          onClose={() => {
            setShowNotFoundModal(false);
            setNotFoundBarcode("");
          }}
        />
      )}
    </div>
  );
}