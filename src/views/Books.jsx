import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Loader2,
  PlusCircle,
  Printer,
  Search,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import axiosClient from "../axios-client";
import { getStorageUrl } from "../lib/utils";
import PrintLabelModal from "../components/PrintLabelModal";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import AssetForm from "./AssetForm";
import BookForm from "./BookForm";
import DamagedBooksModal from "./DamagedBooksModal";
import LostBooksModal from "./LostBooksModal";

// Category color mapping for visual distinction
const CATEGORY_COLORS = {
  "Book": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700 border-purple-200", icon: "text-purple-500", gradient: "from-purple-500 to-purple-600" },
  "Article": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: "text-blue-500", gradient: "from-blue-500 to-blue-600" },
  "Thesis": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "text-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
  "Map": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "text-amber-500", gradient: "from-amber-500 to-amber-600" },
  "Visual Materials": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700 border-rose-200", icon: "text-rose-500", gradient: "from-rose-500 to-rose-600" },
  "Computer File/Electronic Resources": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "text-indigo-500", gradient: "from-indigo-500 to-indigo-600" },
  "default": { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-700 border-slate-200", icon: "text-slate-500", gradient: "from-slate-500 to-slate-600" }
};

const getCategoryColors = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

export default function Books({ pendingBarcode = "", onClearPendingBarcode }) {
  const toast = useToast();

  // View Mode States
  const [selectedCategory, setSelectedCategory] = useState(null); // null = category view, string = book list view
  const [categories, setCategories] = useState([]);
  const [categoryBooks, setCategoryBooks] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [perPage] = useState(20);

  // Search (within category)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal states
  const [showTitleForm, setShowTitleForm] = useState(false);
  const [showLostBooksModal, setShowLostBooksModal] = useState(false);
  const [showDamagedBooksModal, setShowDamagedBooksModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [prefillBarcode, setPrefillBarcode] = useState("");
  const [selectedBookForCopy, setSelectedBookForCopy] = useState(null);
  const [selectedBookForLabel, setSelectedBookForLabel] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch categories
  const getCategories = useCallback((silent = false) => {
    if (!silent) setLoadingCategories(true);
    axiosClient.get("/books/categories/summary")
      .then(({ data }) => {
        setCategories(data);
        setLoadingCategories(false);
      })
      .catch(() => {
        setLoadingCategories(false);
      });
  }, []);

  // Fetch books by category with pagination
  const getBooksByCategory = useCallback((category, page = 1, search = "") => {
    setLoadingBooks(true);
    axiosClient.get(`/books/by-category/${encodeURIComponent(category)}`, {
      params: { page, per_page: perPage, search }
    })
      .then(({ data }) => {
        setCategoryBooks(data.data);
        setCurrentPage(data.current_page);
        setTotalPages(data.last_page);
        setTotalBooks(data.total);
        setLoadingBooks(false);
      })
      .catch(() => {
        setLoadingBooks(false);
      });
  }, [perPage]);

  // Initial load - fetch categories
  useEffect(() => {
    getCategories();
  }, [getCategories]);

  // When category is selected, load its books
  useEffect(() => {
    if (selectedCategory) {
      getBooksByCategory(selectedCategory, currentPage, debouncedSearch);
    }
  }, [selectedCategory, currentPage, debouncedSearch, getBooksByCategory]);

  // Handle category card click
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Handle back to categories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryBooks([]);
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
    getCategories(); // Refresh categories when going back
  };

  // CRUD Operations
  const onDelete = (book) => {
    Swal.fire({
      title: 'Delete Book?',
      text: `Are you sure you want to delete "${book.title}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#020463',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        axiosClient.delete(`/books/${book.id}`)
          .then(() => {
            toast.success('The book has been removed.');
            if (selectedCategory) {
              getBooksByCategory(selectedCategory, currentPage, debouncedSearch);
            }
            getCategories(); // Refresh category counts
          })
          .catch((err) => {
            toast.error(err.response?.data?.message || 'Failed to delete book.');
          });
      }
    });
  };

  const onEdit = (book) => {
    setEditingBook(book);
    setShowTitleForm(true);
  };

  const onAddNew = () => {
    setEditingBook(null);
    setShowTitleForm(true);
  };


  // Get status badge
  const getStatusBadge = (book) => {
    const available = book.available_copies || 0;
    const damaged = book.damaged_copies || 0;
    const lost = book.lost_copies || 0;
    const borrowed = book.borrowed_copies || 0;
    const total = book.total_copies || (available + damaged + lost + borrowed);

    if (available > 0) {
      return { className: "bg-green-100 text-green-700 border border-green-200", text: `${available} Available` };
    }
    if (damaged > 0 && borrowed === 0) {
      return { className: "bg-rose-100 text-rose-700 border border-rose-200", text: damaged === total ? "All Damaged" : `${damaged} Damaged` };
    }
    if (lost > 0 && borrowed === 0 && damaged === 0) {
      return { className: "bg-red-100 text-red-700 border border-red-200", text: lost === total ? "All Lost" : `${lost} Lost` };
    }
    if (borrowed > 0) {
      let text = `${borrowed} Borrowed`;
      if (damaged > 0) text += `, ${damaged} Damaged`;
      if (lost > 0) text += `, ${lost} Lost`;
      return { className: "bg-amber-100 text-amber-700 border border-amber-200", text };
    }
    return { className: "bg-gray-100 text-gray-600 border border-gray-200", text: "No Copies" };
  };

  // Pagination controls
  const PaginationControls = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalBooks)} of {totalBooks} books
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={18} className="text-gray-600 dark:text-slate-300" />
          </button>
          {start > 1 && (
            <>
              <button onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300">1</button>
              {start > 2 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}
          {pages.map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${page === currentPage
                ? "bg-primary-600 text-white"
                : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300"
                }`}
            >
              {page}
            </button>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
              <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300">{totalPages}</button>
            </>
          )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={18} className="text-gray-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
    );
  };

  // Category Card Component
  const CategoryCard = ({ category, totalBooks, availableTitles, totalCopies, availableCopies }) => {
    const colors = getCategoryColors(category);
    return (
      <button
        onClick={() => handleCategoryClick(category)}
        className={`group relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${colors.bg} dark:bg-slate-800 border-2 ${colors.border} dark:border-slate-700`}
      >
        {/* Background gradient accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
              <BookOpen size={24} className="text-white" />
            </div>
          </div>
          <h3 className={`text-lg font-bold ${colors.text} dark:text-white mb-2 truncate`}>{category}</h3>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalBooks}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {availableTitles} available
            </p>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={24} className={colors.icon} />
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {selectedCategory && (
            <button
              onClick={handleBackToCategories}
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <ArrowLeft size={24} className="text-gray-600 dark:text-slate-300" />
            </button>
          )}
          <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {selectedCategory ? selectedCategory : "Book Inventory"}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              {selectedCategory
                ? `${totalBooks} titles in this category`
                : `${categories.length} categories • Click to browse`
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowDamagedBooksModal(true)}
            variant="outline"
            className="border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
          >
            <AlertCircle size={18} className="mr-2" /> Damaged Books
          </Button>
          <Button
            onClick={() => setShowLostBooksModal(true)}
            variant="outline"
            className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
          >
            <AlertCircle size={18} className="mr-2" /> Lost Books
          </Button>
          <Button onClick={onAddNew} icon={PlusCircle}>
            Add New Book
          </Button>
        </div>
      </div>

      {/* CATEGORY VIEW (when no category selected) */}
      {!selectedCategory && (
        <>
          {loadingCategories ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-primary-600" />
              <p>Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700">
              <Filter size={40} strokeWidth={1.5} className="mx-auto mb-4" />
              <p className="text-lg font-medium">No categories found</p>
              <p className="text-sm">Add new books using the button above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.category}
                  category={cat.category}
                  totalBooks={cat.total_books}
                  availableTitles={cat.available_titles}
                  totalCopies={cat.total_copies}
                  availableCopies={cat.available_copies}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* BOOK LIST VIEW (when category selected) */}
      {selectedCategory && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by title, author, ISBN..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-600 outline-none text-sm transition-all bg-gray-50 dark:bg-slate-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Book Table */}
          {loadingBooks ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4 text-primary-600" />
              <p className="text-gray-400 dark:text-slate-500">Loading books...</p>
            </div>
          ) : categoryBooks.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-slate-500">
              <Filter size={40} strokeWidth={1.5} className="mx-auto mb-4" />
              <p className="text-lg font-medium">
                {searchTerm ? `No books found matching "${searchTerm}"` : "No books in this category"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Title</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Author</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Publisher</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600">Call No.</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600 text-center">Status</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {categoryBooks.map((book) => {
                    const badge = getStatusBadge(book);
                    return (
                      <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {book.image_path && !imgErrors[book.id] ? (
                              <img
                                src={getStorageUrl(book.image_path)}
                                alt={book.title}
                                className="w-10 h-14 object-cover rounded shadow-sm"
                                onError={() => setImgErrors(prev => ({ ...prev, [book.id]: true }))}
                              />
                            ) : (
                              <div className="w-10 h-14 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center">
                                <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white">{book.title}</p>
                              {book.subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">{book.subtitle}</p>
                              )}
                              {book.isbn && (
                                <p className="text-xs text-slate-400 font-mono">{book.isbn}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{book.author}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{book.publisher || '-'}</td>
                        <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">{book.call_number || '-'}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setSelectedBookForLabel(book)}
                              className="text-xs bg-[#020463] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a1c7a] transition mr-1 font-medium flex items-center gap-1"
                              title="Print Label"
                            >
                              <Printer size={12} /> Label
                            </button>
                            <button
                              onClick={() => setSelectedBookForCopy(book)}
                              className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition mr-1 font-medium"
                            >
                              + Copy
                            </button>
                            <button onClick={() => onEdit(book)} className="text-slate-400 hover:text-[#020463] dark:hover:text-blue-400 p-2 rounded hover:bg-blue-50 dark:hover:bg-slate-700 transition" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => onDelete(book)} className="text-slate-400 hover:text-[#020463] dark:hover:text-red-400 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {categoryBooks.length > 0 && totalPages > 1 && (
            <div className="px-6 pb-6">
              <PaginationControls />
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showTitleForm && (
        <BookForm
          bookToEdit={editingBook}
          prefillBarcode={prefillBarcode}
          onClose={() => {
            setShowTitleForm(false);
            setPrefillBarcode("");
          }}
          onSuccess={(newBook) => {
            if (selectedCategory) {
              getBooksByCategory(selectedCategory, currentPage, debouncedSearch);
            }
            getCategories();
            if (newBook && newBook.id) {
              setSelectedBookForLabel(newBook);
            }
          }}
        />
      )}

      {selectedBookForCopy && (
        <AssetForm
          book={selectedBookForCopy}
          onClose={() => setSelectedBookForCopy(null)}
          onSuccess={() => {
            if (selectedCategory) {
              getBooksByCategory(selectedCategory, currentPage, debouncedSearch);
            }
            getCategories();
          }}
        />
      )}

      {selectedBookForLabel && (
        <PrintLabelModal book={selectedBookForLabel} onClose={() => setSelectedBookForLabel(null)} />
      )}

      {showLostBooksModal && (
        <LostBooksModal
          onClose={() => setShowLostBooksModal(false)}
          onSuccess={() => {
            if (selectedCategory) {
              getBooksByCategory(selectedCategory, currentPage, debouncedSearch);
            }
            getCategories();
          }}
        />
      )}

      {showDamagedBooksModal && (
        <DamagedBooksModal
          onClose={() => setShowDamagedBooksModal(false)}
          onSuccess={() => {
            if (selectedCategory) {
              getBooksByCategory(selectedCategory, currentPage, debouncedSearch);
            }
            getCategories();
          }}
        />
      )}
    </div>
  );
}
