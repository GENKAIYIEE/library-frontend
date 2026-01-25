import { useState, useEffect } from "react";
import { useToast } from "../components/ui/Toast";
import axiosClient from "../axios-client";
import PaymentModal from "./PaymentModal";
import BookScanModal from "../components/BookScanModal";
import BookNotFoundModal from "../components/BookNotFoundModal";
import CameraScanner from "../components/CameraScanner";
import ScanModeSelector from "../components/ScanModeSelector";
import StudentSearchModal from "../components/StudentSearchModal";
import BookSelectorModal from "../components/BookSelectorModal";
import { Search, ChevronDown, User, Book, Scan, Camera, Users, Library } from "lucide-react";

export default function Circulation({ onNavigateToBooks }) {
  // STATE FOR BORROWING
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentCourse, setStudentCourse] = useState("BSIT");
  const [studentYear, setStudentYear] = useState("1");
  const [studentSection, setStudentSection] = useState("");
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [borrowBookCode, setBorrowBookCode] = useState("");

  // Available books dropdown
  const [availableBooks, setAvailableBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState("");

  // Students dropdown (kept for data but hidden)
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showStudentSearchModal, setShowStudentSearchModal] = useState(false);

  // STATE FOR RETURNING
  const [returnBookCode, setReturnBookCode] = useState("");
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [filteredBorrowedBooks, setFilteredBorrowedBooks] = useState([]);
  const [showReturnDropdown, setShowReturnDropdown] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");

  // Toast hook
  const toast = useToast();

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

  // SMART BOOK SELECTOR MODAL STATE
  const [showBorrowBookModal, setShowBorrowBookModal] = useState(false);
  const [showReturnBookModal, setShowReturnBookModal] = useState(false);

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
    // Keep this for future expansion or background searches
    setFilteredStudents(students);
  }, [students]);

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
        // setError("Failed to load available books.");
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
    // setStudentId(studentIdValue); // Controlled by input
    setSelectedStudentCourse(course);
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

  const handleSelectStudentFromModal = (student) => {
    setStudentId(student.student_id);
    setStudentName(student.name);
    setIsNewStudent(false);
    handleSelectStudent(student.student_id, student.course);
  };

  const handleSelectReturnBook = (assetCode) => {
    setReturnBookCode(assetCode);
    setReturnSearchQuery("");
    setShowReturnDropdown(false);
  };

  // --- HANDLE BORROW ---
  const handleBorrow = async (ev) => {
    ev.preventDefault();

    if (!studentId || !borrowBookCode) {
      toast.error("Please provide Student ID and Book Code.");
      return;
    }

    // A. If New Student, Register First
    if (isNewStudent) {
      if (!studentName) {
        toast.error("Please enter the new student's name.");
        return;
      }
      if (!studentCourse || !studentYear) {
        toast.error("Please select Course and Year Level for new student.");
        return;
      }
      if (!studentSection) {
        toast.error("Please enter the Section.");
        return;
      }

      try {
        await axiosClient.post("/students", {
          student_id: studentId,
          name: studentName,
          // Defaults for quick registration
          course: studentCourse,
          year_level: parseInt(studentYear),
          section: studentSection
        });
        toast.success("New student registered successfully!");
        fetchStudents(); // Refresh local list
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to register new student.");
        return; // Stop if registration fails
      }
    }

    // B. Proceed to Borrow
    axiosClient.post("/borrow", {
      student_id: studentId,
      asset_code: borrowBookCode
    })
      .then(({ data }) => {
        toast.success(`Success! Book borrowed until ${new Date(data.data.due_date).toLocaleDateString()}`);
        setStudentId("");
        setStudentName("");
        setIsNewStudent(false);
        setStudentSection("");
        setBorrowBookCode("");
        setBookSearchQuery("");
        setClearance(null);
        fetchAvailableBooks();
        fetchBorrowedBooks();
      })
      .catch(err => {
        const response = err.response;
        if (response && response.status === 422) {
          toast.error(response.data.message);
        } else {
          toast.error("Error processing loan. Check Student ID.");
        }
      });
  };

  // --- HANDLE RETURN ---
  const handleReturn = (ev) => {
    ev.preventDefault();

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
          toast.warning(`Book "${bookTitle}" (${assetCode}) returned with Late Fee: ₱${data.penalty}.00 (${data.days_late} days late)`);
        } else {
          toast.success(`Success! Book "${bookTitle}" (${assetCode}) has been returned and is now available.`);
        }
        fetchAvailableBooks();
        fetchBorrowedBooks();
        if (studentId) refreshClearance();
      })
      .catch(err => {
        const response = err.response;
        if (response && response.status === 422) {
          toast.error(response.data.message);
        } else {
          toast.error(`Error returning book ${assetCode}. Check the barcode.`);
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
    toast.success(successMessage);
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
          toast.info(`Book "${result.title}" selected. Select a student to complete loan.`);
        } else if (result.status === 'borrowed') {
          // ❌ ERROR: Book is already checked out
          toast.error(`Cannot borrow. "${result.title}" is currently borrowed.`);
          setShowCameraScanner(false);
        } else {
          // Unknown status
          toast.error(`Cannot borrow. Book status: ${result.status || 'unknown'}`);
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
          toast.error(`Book "${result.title}" is not borrowed.`);
          setShowCameraScanner(false);
        } else {
          // Unknown status
          toast.error(`Cannot return. Book status: ${result.status || 'unknown'}`);
          setShowCameraScanner(false);
        }
        break;

      case 'register':
        // REGISTER MODE: Book should NOT already exist in database
        // Action: Redirect to Inventory/Add Book page with pre-filled ISBN/ID
        if (result.found) {
          // ❌ ERROR: Book already exists
          toast.error(`Book already registered: "${result.title}"`);
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
    toast.info(`Book selected: ${scannedBook.title}. Select a student.`);
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
          toast.warning(`Book "${displayTitle}" returned with Late Fee: ₱${data.penalty}.00`);
        } else {
          toast.success(`Success! "${displayTitle}" has been returned.`);
        }
        fetchAvailableBooks();
        fetchBorrowedBooks();
        setScannedBook(null);
        if (studentId) refreshClearance();
      })
      .catch(err => {
        toast.error(err.response?.data?.message || `Error returning book ${assetCode}.`);
      });
  };

  // Handle adding a physical copy for a book that exists but has no copies
  const handleAddCopy = (book) => {
    setShowScanModal(false);
    setScannedBook(null);
    // Navigate to Books page - the book title already exists, they just need to add a copy
    // Show a message to guide the user
    toast.info(`"${book.title}" needs a physical copy. Click "+ Copy" in Inventory.`);
  };

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">

      {/* SEARCH MODAL */}
      <StudentSearchModal
        isOpen={showStudentSearchModal}
        onClose={() => setShowStudentSearchModal(false)}
        students={students}
        onSelect={handleSelectStudentFromModal}
      />

      <BookSelectorModal
        isOpen={showBorrowBookModal}
        onClose={() => setShowBorrowBookModal(false)}
        books={availableBooks}
        onSelect={(book) => {
          setBorrowBookCode(book.asset_code);
          setShowBorrowBookModal(false);
        }}
        title="Browse Library Catalog"
        mode="borrow"
      />

      <BookSelectorModal
        isOpen={showReturnBookModal}
        onClose={() => setShowReturnBookModal(false)}
        books={borrowedBooks}
        onSelect={(book) => {
          setReturnBookCode(book.asset_code);
          setShowReturnBookModal(false);
        }}
        title="Select Book to Return"
        mode="return"
      />

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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 mt-6">

        {/* LEFT SIDE: BORROW - Elevated White Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
              <Book size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Borrow Book</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Quick issue to student</p>
            </div>
          </div>
          <form onSubmit={handleBorrow} className="space-y-5 flex-1 flex flex-col">

            {/* SMART STUDENT ID INPUT */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-12 gap-4">
                {/* ID Input */}
                <div className="col-span-4">
                  <label className="flex justify-between text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setStudentId(val);
                      // Smart Lookup
                      const found = students.find(s => s.student_id === val);
                      if (found) {
                        setStudentName(found.name);
                        setIsNewStudent(false);
                        handleSelectStudent(found.student_id, found.course);
                      } else {
                        if (!isNewStudent) {
                          setStudentName("");
                          setStudentCourse("BSIT");
                          setStudentYear("1");
                          setStudentSection("");
                        }
                        setIsNewStudent(true);
                        setClearance(null);
                      }
                    }}
                    className="w-full border-2 border-gray-200 dark:border-slate-600 p-3 rounded-xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-600 outline-none transition-all bg-gray-50 dark:bg-slate-900 dark:text-white font-mono font-bold"
                    placeholder="ID No."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentSearchModal(true)}
                    className="mt-2 w-full text-xs text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 py-1.5 rounded transition flex items-center justify-center gap-1 border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                  >
                    <Search size={12} /> Search Directory
                  </button>
                </div>

                {/* Name Input */}
                <div className="col-span-8">
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Student Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      readOnly={!isNewStudent}
                      className={`w-full pl-12 pr-4 border-2 p-3 rounded-xl outline-none transition-all 
                            ${!isNewStudent
                          ? 'bg-gray-100 dark:bg-slate-800 border-transparent text-gray-500 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900 border-primary-300 ring-2 ring-primary-100 text-primary-700 font-bold'
                        }`}
                      placeholder={isNewStudent && studentId.length > 2 ? "Enter new student name..." : "Waiting for ID..."}
                      required
                    />
                    {isNewStudent && studentId.length > 2 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* New Student Details (Animated) */}
              {isNewStudent && studentId.length > 2 && (
                <div className="grid grid-cols-2 gap-4 animate-scaleIn origin-top">
                  {/* Course Select */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Course</label>
                    <div className="relative">
                      <select
                        value={studentCourse}
                        onChange={(e) => setStudentCourse(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-900 border-2 border-primary-300 dark:border-primary-700 text-gray-800 dark:text-white p-3 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold"
                      >
                        <option value="BSIT">BSIT</option>
                        <option value="BSED">BSED</option>
                        <option value="BEED">BEED</option>
                        <option value="BSHM">BSHM</option>
                        <option value="BSBA">BSBA</option>
                        <option value="Maritime">Maritime</option>
                        <option value="BS Criminology">BS Criminology</option>
                        <option value="BS Tourism">BS Tourism</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Year & Section Split */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Year</label>
                      <div className="relative">
                        <select
                          value={studentYear}
                          onChange={(e) => setStudentYear(e.target.value)}
                          className="w-full appearance-none bg-white dark:bg-slate-900 border-2 border-primary-300 dark:border-primary-700 text-gray-800 dark:text-white p-3 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold"
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Section</label>
                      <input
                        type="text"
                        value={studentSection}
                        onChange={(e) => setStudentSection(e.target.value.toUpperCase())}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-primary-300 dark:border-primary-700 text-gray-800 dark:text-white p-3 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold placeholder-gray-400"
                        placeholder="Sec"
                        maxLength={5}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CLEARANCE STATUS BADGE (Only for existing students) */}
            {clearance && !isNewStudent && (
              <div className={`p-3 rounded-lg border ${clearance.is_cleared ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-bold ${clearance.is_cleared ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {clearance.is_cleared ? '✅ CLEARED' : '🚫 BLOCKED'}
                    </span>
                    <span className="text-gray-600 dark:text-slate-300 text-sm ml-2">
                      {clearance.course} | Loan Period: {clearance.loan_days} day(s)
                    </span>
                  </div>
                  <div className="text-right text-sm dark:text-slate-300">
                    <div>Active Loans: <span className="font-bold">{clearance.active_loans}/3</span></div>
                    {clearance.pending_fines > 0 && (
                      <div className="text-red-600 dark:text-red-400 font-bold">Pending: ₱{parseFloat(clearance.pending_fines).toFixed(2)}</div>
                    )}
                  </div>
                </div>
                {clearance.block_reason && (
                  <div className="text-red-600 dark:text-red-400 text-sm mt-1">⚠️ {clearance.block_reason}</div>
                )}
              </div>
            )}

            {/* AVAILABLE BOOKS DROPDOWN - Modernized Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Select Available Book</label>

              <div
                onClick={() => setShowBorrowBookModal(true)}
                className="group cursor-pointer relative w-full border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-400 bg-gray-50 dark:bg-slate-900 rounded-xl p-4 transition-all hover:bg-white dark:hover:bg-slate-800"
              >
                {borrowBookCode ? (
                  <div className="flex items-center gap-4">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg text-primary-600 dark:text-primary-400">
                      <Book size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Selected Book</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        {availableBooks.find(b => b.asset_code === borrowBookCode)?.title || borrowBookCode}
                        <span className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">{borrowBookCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBorrowBookCode("");
                      }}
                      className="ml-auto p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 transition-colors"
                    >
                      <span className="sr-only">Clear</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 text-gray-400 group-hover:text-primary-500 transition-colors">
                    <Library size={32} className="mb-2 opacity-50" />
                    <span className="font-bold">Click to Select Book</span>
                    <span className="text-xs mt-1">Browse library catalog</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Row - pushed to bottom */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700 mt-auto">
              <span className="flex items-center gap-1"><User size={14} /> {(isNewStudent ? 'New Student' : (studentName || 'Select Student'))}</span>
              <span className="flex items-center gap-1"><Book size={14} /> {filteredBooks.length} available</span>
            </div>

            {/* Confirm Loan Button - Full Width, High Contrast Dark Blue */}
            <button
              disabled={clearance && !clearance.is_cleared}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 transform ${clearance && !clearance.is_cleared
                ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-primary-200'
                }`}
            >
              {clearance && !clearance.is_cleared ? '🚫 Borrowing Blocked' : '✓ Confirm Loan'}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: RETURN - Elevated White Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Book size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Return Book</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Process a book return</p>
            </div>
          </div>
          <form onSubmit={handleReturn} className="space-y-5 flex-1 flex flex-col">

            {/* BORROWED BOOKS DROPDOWN - Modernized Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Select Borrowed Book</label>

              <div
                onClick={() => setShowReturnBookModal(true)}
                className="group cursor-pointer relative w-full border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-gray-50 dark:bg-slate-900 rounded-xl p-4 transition-all hover:bg-white dark:hover:bg-slate-800"
              >
                {returnBookCode ? (
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <Book size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Selected Book</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        {borrowedBooks.find(b => b.asset_code === returnBookCode)?.title || returnBookCode}
                        <span className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">{returnBookCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReturnBookCode("");
                      }}
                      className="ml-auto p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 transition-colors"
                    >
                      <span className="sr-only">Clear</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 text-gray-400 group-hover:text-emerald-500 transition-colors">
                    <Library size={32} className="mb-2 opacity-50" />
                    <span className="font-bold">Click to Return Book</span>
                    <span className="text-xs mt-1">Search borrowed books</span>
                  </div>
                )}
              </div>
            </div>



            {/* Stats Row with Status Badge - pushed to bottom */}
            <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700 mt-auto">
              <span className="text-gray-500 dark:text-slate-400">📖 {borrowedBooks.length} book{borrowedBooks.length !== 1 ? 's' : ''} borrowed</span>
              {borrowedBooks.filter(b => b.is_overdue).length > 0 && (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-bold border border-red-200 dark:border-red-800">
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

        {/* STATUS MESSAGES AREA REMOVED (Replaced by Toasts) */}

        {/* PAYMENT MODAL */}
        {
          showPaymentModal && pendingTransaction && (
            <PaymentModal
              transaction={pendingTransaction}
              onClose={() => {
                setShowPaymentModal(false);
                setPendingTransaction(null);
              }}
              onSuccess={handlePaymentSuccess}
            />
          )
        }
      </div >

      {/* BOOK SCAN MODAL */}
      {
        showScanModal && scannedBook && (
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
        )
      }

      {/* SCAN MODE SELECTOR */}
      {
        showModeSelector && (
          <ScanModeSelector
            onSelectMode={handleModeSelect}
            onClose={() => setShowModeSelector(false)}
          />
        )
      }

      {/* CAMERA SCANNER */}
      {
        showCameraScanner && (
          <CameraScanner
            onResult={handleScanResult}
            onClose={() => {
              setShowCameraScanner(false);
              setScanMode(null);
            }}
          />
        )
      }

      {/* BOOK NOT FOUND MODAL */}
      {
        showNotFoundModal && (
          <BookNotFoundModal
            scannedCode={notFoundBarcode}
            onRegister={handleRegisterBook}
            onClose={() => {
              setShowNotFoundModal(false);
              setNotFoundBarcode("");
            }}
          />
        )
      }
    </div >
  );
}