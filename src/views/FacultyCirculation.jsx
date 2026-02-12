import { useState, useEffect, useCallback } from "react";
import { useToast } from "../components/ui/Toast";
import axiosClient from "../axios-client";
import BookSelectorModal from "../components/BookSelectorModal";
import CameraScanner from "../components/CameraScanner";
import {
    Search,
    User,
    Book,
    BookOpen,
    RotateCcw,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Building2,
    Calendar,
    Clock,
    Scan,
    X,
    Library,
    Camera
} from "lucide-react";
import Swal from "sweetalert2";
import Button from "../components/ui/Button";

export default function FacultyCirculation() {
    const toast = useToast();

    // Tab state
    const [activeTab, setActiveTab] = useState("borrow"); // 'borrow' or 'return'

    // Borrow Tab States
    const [facultySearch, setFacultySearch] = useState("");
    const [facultyResults, setFacultyResults] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [assetCode, setAssetCode] = useState("");
    const [selectedBook, setSelectedBook] = useState(null);
    const [borrowLoading, setBorrowLoading] = useState(false);

    // Return Tab States
    const [returnAssetCode, setReturnAssetCode] = useState("");
    const [returnSelectedBook, setReturnSelectedBook] = useState(null);
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [returnLoading, setReturnLoading] = useState(false);
    const [loadingBorrowed, setLoadingBorrowed] = useState(false);

    // Available Books for borrowing (shared with student circulation)
    const [availableBooks, setAvailableBooks] = useState([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);

    // Book Selector Modal States
    const [showBorrowBookModal, setShowBorrowBookModal] = useState(false);
    const [showReturnBookModal, setShowReturnBookModal] = useState(false);

    // Camera Scanner States
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [scanMode, setScanMode] = useState(null); // 'borrow' | 'return'

    // Faculty Search
    useEffect(() => {
        if (facultySearch.length >= 2) {
            const timer = setTimeout(() => {
                axiosClient.get(`/faculties/search?q=${encodeURIComponent(facultySearch)}`)
                    .then(({ data }) => setFacultyResults(data))
                    .catch(() => setFacultyResults([]));
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setFacultyResults([]);
        }
    }, [facultySearch]);

    // Fetch available books (same endpoint as student circulation)
    const fetchAvailableBooks = useCallback(() => {
        setLoadingAvailable(true);
        axiosClient.get("/books/available")
            .then(({ data }) => {
                setAvailableBooks(data);
                setLoadingAvailable(false);
            })
            .catch(() => {
                setLoadingAvailable(false);
            });
    }, []);

    // Fetch borrowed books for return tab
    const fetchBorrowedBooks = useCallback(() => {
        setLoadingBorrowed(true);
        axiosClient.get("/faculty/borrowed")
            .then(({ data }) => {
                setBorrowedBooks(data);
                setLoadingBorrowed(false);
            })
            .catch(() => {
                setLoadingBorrowed(false);
            });
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchAvailableBooks();
        fetchBorrowedBooks();
    }, [fetchAvailableBooks, fetchBorrowedBooks]);

    // Refresh when tab changes
    useEffect(() => {
        if (activeTab === "return") {
            fetchBorrowedBooks();
        } else {
            fetchAvailableBooks();
        }
    }, [activeTab, fetchBorrowedBooks, fetchAvailableBooks]);

    // Select Faculty
    const handleSelectFaculty = (faculty) => {
        setSelectedFaculty(faculty);
        setFacultySearch("");
        setFacultyResults([]);
    };

    // Handle Book Selection from Modal (Borrow)
    const handleSelectBorrowBook = (book) => {
        setAssetCode(book.asset_code);
        setSelectedBook(book);
        setShowBorrowBookModal(false);
        toast.info(`Selected: "${book.title}"`);
    };

    // Handle Book Selection from Modal (Return)
    const handleSelectReturnBook = (book) => {
        setReturnAssetCode(book.asset_code);
        setReturnSelectedBook({
            asset_code: book.asset_code,
            title: book.title || book.book_title,
            borrower: book.borrower || book.faculty_name
        });
        setShowReturnBookModal(false);
        toast.info(`Selected: "${book.title || book.book_title}"`);
    };

    // =========================================
    // CAMERA SCANNER HANDLERS
    // =========================================

    // Handle Auto Return from Scanner
    const handleScanReturnSubmit = (code) => {
        setReturnLoading(true);

        axiosClient.post("/faculty/return", {
            asset_code: code.trim()
        })
            .then(({ data }) => {
                let message = `
          <div class="text-left">
            <p><strong>Faculty:</strong> ${data.faculty_name}</p>
            <p><strong>Book:</strong> ${data.book_title}</p>
            <p><strong>Returned:</strong> ${new Date(data.returned_at).toLocaleDateString()}</p>
          </div>
        `;

                Swal.fire({
                    icon: "success",
                    title: "Book Returned!",
                    html: message,
                    confirmButtonColor: "#7c3aed"
                });

                setReturnAssetCode("");
                setReturnSelectedBook(null);
                fetchAvailableBooks();
                fetchBorrowedBooks();
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to return book.");
            })
            .finally(() => setReturnLoading(false));
    };

    // Handle camera scan result
    const handleScanResult = (result) => {
        const scannedBarcode = result.asset_code || result.scanned_code || "";

        if (scanMode === 'borrow') {
            // BORROW MODE
            if (!result.found) {
                toast.error(`Book with barcode "${scannedBarcode}" not found in library.`);
                setShowCameraScanner(false);
            } else if (result.status === 'available') {
                // Book is available - select it
                setAssetCode(result.asset_code);
                setSelectedBook({
                    asset_code: result.asset_code,
                    title: result.title,
                    author: result.author,
                    category: result.category
                });
                setShowCameraScanner(false);
                toast.success(`Book "${result.title}" selected for borrowing.`);
            } else if (result.status === 'borrowed') {
                toast.error(`"${result.title}" is currently borrowed and not available.`);
                setShowCameraScanner(false);
            } else {
                toast.error(`Cannot borrow. Book status: ${result.status || 'unknown'}`);
                setShowCameraScanner(false);
            }
        } else if (scanMode === 'return') {
            // RETURN MODE
            if (!result.found) {
                toast.error(`Book with barcode "${scannedBarcode}" not found in library.`);
                setShowCameraScanner(false);
            } else if (result.status === 'borrowed') {
                // Check if borrowed by Student - REJECT if so
                const borrowerType = result.borrower?.type;

                if (borrowerType === 'Student') {
                    toast.error(`This book is borrowed by a Student. Please use Student Circulation.`);
                    setShowCameraScanner(false);
                    return;
                }

                // ✅ SUCCESS: Confirm before processing (Faculty)
                setShowCameraScanner(false);

                const borrower = result.borrower || {};
                const borrowerName = borrower.name || 'Unknown Faculty';
                const borrowerId = borrower.student_id || ''; // faculty_id
                const typeLabel = borrower.type || 'Faculty';

                Swal.fire({
                    title: 'Return Book?',
                    html: `
              <div style="text-align: left; font-size: 0.95rem;">
                <p style="color: #64748b; margin-bottom: 0.5rem;">Are you sure you want to return:</p>
                <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                  <p style="font-weight: 700; color: #1e293b; margin-bottom: 0.25rem;">${result.title}</p>
                  <p style="font-family: monospace; color: #64748b; font-size: 0.8em;">${result.asset_code}</p>
                </div>
                
                <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                   <p style="text-transform: uppercase; font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.25rem;">Borrowed By</p>
                   <p style="font-weight: 700; color: #0f172a; font-size: 1.1rem; margin-bottom: 0.25rem;">${borrowerName}</p>
                   <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="background: #e0f2fe; color: #0369a1; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">${typeLabel}</span>
                      <span style="color: #64748b; font-size: 0.9rem;">${borrowerId}</span>
                   </div>
                </div>
              </div>
            `,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#7c3aed', // Purple-600
                    cancelButtonColor: '#ef4444', // Red-500
                    confirmButtonText: 'Yes, Return it!',
                    focusCancel: true
                }).then((swalResult) => {
                    if (swalResult.isConfirmed) {
                        // Assuming handleReturn handles the actual API call, but FacultyCirculation uses state then manual submit or similar?
                        // Checking existing code: handleReturn takes an 'e' event.
                        // I should verify how to trigger return programmatically.
                        // Existing handleScanReturn didn't exist in FacultyCirculation.
                        // I need to implement a dedicated return handler or use the existing one differently.

                        // The previous logic was: setReturnAssetCode -> setReturnSelectedBook -> User clicks "Return Book" manually?
                        // Wait, previous logic (lines 184-191) set state and showed toast "Ready for return".
                        // It DID NOT auto-submit.

                        // The user request was "scanner will ask 1st the user to return this book".
                        // Implies auto-submit after confirmation.

                        // I need to create a helper to submit the return.
                        handleScanReturnSubmit(result.asset_code);
                    }
                });

            } else if (result.status === 'available') {
                toast.error(`"${result.title}" is not currently borrowed.`);
                setShowCameraScanner(false);
            } else {
                toast.error(`Cannot return. Book status: ${result.status || 'unknown'}`);
                setShowCameraScanner(false);
            }
        }

        setScanMode(null);
    };

    // Start camera scan for borrow
    const handleStartBorrowScan = () => {
        setScanMode('borrow');
        setShowCameraScanner(true);
    };

    // Start camera scan for return
    const handleStartReturnScan = () => {
        setScanMode('return');
        setShowCameraScanner(true);
    };

    // Handle Borrow
    const handleBorrow = (e) => {
        e.preventDefault();

        if (!selectedFaculty) {
            toast.error("Please select a faculty member first.");
            return;
        }
        if (!assetCode.trim()) {
            toast.error("Please select or enter a book barcode.");
            return;
        }

        setBorrowLoading(true);

        axiosClient.post("/faculty/borrow", {
            faculty_id: selectedFaculty.id,
            asset_code: assetCode.trim()
        })
            .then(({ data }) => {
                Swal.fire({
                    icon: "success",
                    title: "Book Issued!",
                    html: `
            <div class="text-left">
              <p><strong>Faculty:</strong> ${data.faculty_name}</p>
              <p><strong>Book:</strong> ${data.book_title}</p>
              <p><strong>Due Date:</strong> ${data.due_date}</p>
            </div>
          `,
                    confirmButtonColor: "#7c3aed"
                });
                setAssetCode("");
                setSelectedBook(null);
                setSelectedFaculty(null);
                fetchAvailableBooks();
                fetchBorrowedBooks();
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to issue book.");
            })
            .finally(() => setBorrowLoading(false));
    };

    // Handle Return
    const handleReturn = (e) => {
        e.preventDefault();

        if (!returnAssetCode.trim()) {
            toast.error("Please select or enter a book barcode.");
            return;
        }

        setReturnLoading(true);

        axiosClient.post("/faculty/return", {
            asset_code: returnAssetCode.trim()
        })
            .then(({ data }) => {
                let message = `
          <div class="text-left">
            <p><strong>Faculty:</strong> ${data.faculty_name}</p>
            <p><strong>Book:</strong> ${data.book_title}</p>
            <p><strong>Returned:</strong> ${new Date(data.returned_at).toLocaleDateString()}</p>
          </div>
        `;

                Swal.fire({
                    icon: "success",
                    title: "Book Returned!",
                    html: message,
                    confirmButtonColor: "#7c3aed"
                });

                setReturnAssetCode("");
                setReturnSelectedBook(null);
                fetchAvailableBooks();
                fetchBorrowedBooks();
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to return book.");
            })
            .finally(() => setReturnLoading(false));
    };

    // Quick return from list
    const handleQuickReturn = (book) => {
        setReturnAssetCode(book.asset_code);
        setReturnSelectedBook({
            asset_code: book.asset_code,
            title: book.book_title,
            borrower: book.faculty_name
        });
    };

    // Transform borrowed books for BookSelectorModal format
    const borrowedBooksForModal = borrowedBooks.map(book => ({
        ...book,
        title: book.book_title,
        author: book.department || "Faculty",
        category: book.department,
        borrower: book.faculty_name,
        image_path: null
    }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
            {/* Camera Scanner */}
            {showCameraScanner && (
                <CameraScanner
                    onResult={handleScanResult}
                    onClose={() => {
                        setShowCameraScanner(false);
                        setScanMode(null);
                    }}
                />
            )}

            {/* Book Selector Modals */}
            <BookSelectorModal
                isOpen={showBorrowBookModal}
                onClose={() => setShowBorrowBookModal(false)}
                books={availableBooks}
                onSelect={handleSelectBorrowBook}
                title="Browse Library Catalog"
                mode="borrow"
            />

            <BookSelectorModal
                isOpen={showReturnBookModal}
                onClose={() => setShowReturnBookModal(false)}
                books={borrowedBooksForModal}
                onSelect={handleSelectReturnBook}
                title="Select Book to Return"
                mode="return"
            />

            {/* Header with Quick Scan */}
            <div className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                            <Building2 size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Faculty Circulation</h1>
                            <p className="text-gray-500 dark:text-slate-400">Borrow and return books for faculty members</p>
                        </div>
                    </div>

                    {/* Quick Scan Header Button */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Scan size={20} />
                            <span className="font-medium">Quick Scan:</span>
                        </div>
                        <button
                            onClick={handleStartBorrowScan}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                        >
                            <Camera size={16} />
                            Borrow
                        </button>
                        <button
                            onClick={handleStartReturnScan}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                        >
                            <Camera size={16} />
                            Return
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab("borrow")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "borrow"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                        : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                        }`}
                >
                    <BookOpen size={20} />
                    Borrow Book
                </button>
                <button
                    onClick={() => setActiveTab("return")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "return"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                        : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                        }`}
                >
                    <RotateCcw size={20} />
                    Return Book
                </button>
            </div>

            {/* BORROW TAB */}
            {activeTab === "borrow" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Faculty Selection */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <User size={20} className="text-purple-600" />
                            Select Faculty
                        </h2>

                        {selectedFaculty ? (
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                            {selectedFaculty.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{selectedFaculty.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">{selectedFaculty.faculty_id}</p>
                                            <p className="text-xs text-purple-600">{selectedFaculty.department}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFaculty(null)}
                                        className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition"
                                    >
                                        <X size={18} className="text-gray-400" />
                                    </button>
                                </div>
                                {selectedFaculty.active_loans > 0 && (
                                    <p className="mt-3 text-sm text-amber-600 flex items-center gap-1">
                                        <AlertTriangle size={14} /> Has {selectedFaculty.active_loans} active loan(s)
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or faculty ID..."
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                                    value={facultySearch}
                                    onChange={(e) => setFacultySearch(e.target.value)}
                                />

                                {/* Search Results */}
                                {facultyResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 max-h-60 overflow-y-auto">
                                        {facultyResults.map((f) => (
                                            <button
                                                key={f.id}
                                                onClick={() => handleSelectFaculty(f)}
                                                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                    {f.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-white">{f.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">{f.faculty_id} • {f.department}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Book Selection */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Book size={20} className="text-purple-600" />
                            Select Book
                        </h2>

                        <form onSubmit={handleBorrow} className="space-y-4">
                            {/* Selected Book Display */}
                            {selectedBook ? (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{selectedBook.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">{selectedBook.author}</p>
                                            <p className="text-xs font-mono text-emerald-600 mt-1">{selectedBook.asset_code}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedBook(null);
                                                setAssetCode("");
                                            }}
                                            className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition"
                                        >
                                            <X size={18} className="text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Manual Barcode Input */}
                                    <div className="relative">
                                        <Scan className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Scan or enter book barcode..."
                                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                                            value={assetCode}
                                            onChange={(e) => setAssetCode(e.target.value)}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={handleStartBorrowScan}
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition font-medium shadow-md"
                                        >
                                            <Camera size={18} />
                                            Camera Scan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowBorrowBookModal(true)}
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium"
                                        >
                                            <Library size={18} />
                                            Browse Catalog
                                        </button>
                                    </div>
                                </>
                            )}

                            <Button
                                type="submit"
                                disabled={borrowLoading || !selectedFaculty || !assetCode}
                                loading={borrowLoading}
                                icon={BookOpen}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            >
                                Issue Book to Faculty
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* RETURN TAB */}
            {activeTab === "return" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Return Input */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <RotateCcw size={20} className="text-purple-600" />
                            Return Book
                        </h2>

                        <form onSubmit={handleReturn} className="space-y-4">
                            {/* Selected Return Book Display */}
                            {returnSelectedBook ? (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{returnSelectedBook.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">Borrowed by: {returnSelectedBook.borrower}</p>
                                            <p className="text-xs font-mono text-amber-600 mt-1">{returnSelectedBook.asset_code}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReturnSelectedBook(null);
                                                setReturnAssetCode("");
                                            }}
                                            className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition"
                                        >
                                            <X size={18} className="text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Scan className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Scan or enter book barcode..."
                                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                                            value={returnAssetCode}
                                            onChange={(e) => setReturnAssetCode(e.target.value)}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={handleStartReturnScan}
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition font-medium shadow-md"
                                        >
                                            <Camera size={18} />
                                            Camera Scan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowReturnBookModal(true)}
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium"
                                        >
                                            <BookOpen size={18} />
                                            Browse Borrowed
                                        </button>
                                    </div>
                                </>
                            )}

                            <Button
                                type="submit"
                                disabled={returnLoading || !returnAssetCode}
                                loading={returnLoading}
                                icon={CheckCircle}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                            >
                                Return Book
                            </Button>
                        </form>
                    </div>

                    {/* Currently Borrowed */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-amber-500" />
                            Currently Borrowed by Faculty ({borrowedBooks.length})
                        </h2>

                        {loadingBorrowed ? (
                            <div className="text-center py-8">
                                <Loader2 className="animate-spin h-8 w-8 mx-auto text-purple-600" />
                                <p className="text-gray-400 mt-2">Loading...</p>
                            </div>
                        ) : borrowedBooks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-slate-500">
                                <CheckCircle size={40} strokeWidth={1.5} className="mx-auto mb-2" />
                                <p>No books currently borrowed by faculty</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {borrowedBooks.map((book) => (
                                    <div
                                        key={book.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border ${book.is_overdue
                                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                            : "bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-600"
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-white">{book.book_title}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                {book.faculty_name} • {book.department}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                <span className="text-gray-500 dark:text-slate-400">
                                                    Code: {book.asset_code}
                                                </span>
                                                <span className={book.is_overdue ? "text-red-600 font-medium" : "text-gray-500 dark:text-slate-400"}>
                                                    <Calendar size={12} className="inline mr-1" />
                                                    Due: {new Date(book.due_date).toLocaleDateString()}
                                                </span>
                                                {book.is_overdue && (
                                                    <span className="text-red-600 font-bold flex items-center gap-1">
                                                        <AlertTriangle size={12} />
                                                        {book.days_overdue} days overdue
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleQuickReturn(book)}
                                            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                                        >
                                            Return
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
