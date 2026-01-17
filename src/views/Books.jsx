import { useEffect, useState, useMemo } from "react";
import axiosClient from "../axios-client";
import BookForm from "./BookForm";
import AssetForm from "./AssetForm";
import {
  Edit, Trash2, PlusCircle, Search, BookOpen, Filter,
  ChevronDown, ChevronRight, FolderOpen, Layers,
  Maximize2, Minimize2
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import FloatingSelect from "../components/ui/FloatingSelect";

// Category color mapping for visual distinction
const CATEGORY_COLORS = {
  "Fiction": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700 border-purple-200", icon: "text-purple-500" },
  "Technology": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: "text-blue-500" },
  "Science": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "text-emerald-500" },
  "History": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "text-amber-500" },
  "Education": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700 border-rose-200", icon: "text-rose-500" },
  "default": { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-700 border-slate-200", icon: "text-slate-500" }
};

const getCategoryColors = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

export default function Books({ pendingBarcode = "", onClearPendingBarcode }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTitleForm, setShowTitleForm] = useState(false);

  // Store the book we want to edit
  const [editingBook, setEditingBook] = useState(null);

  // Store barcode to pre-fill in form when adding from scanner
  const [prefillBarcode, setPrefillBarcode] = useState("");

  const [selectedBookForCopy, setSelectedBookForCopy] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, available, borrowed

  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    getBooks();

    // Poll every 5 seconds (reduced from 1s)
    const interval = setInterval(() => {
      getBooks(true); // Silent update
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-open form when navigating from scanner with a barcode
  useEffect(() => {
    if (pendingBarcode) {
      setPrefillBarcode(pendingBarcode);
      setEditingBook(null);
      setShowTitleForm(true);
      // Clear the pending barcode so it doesn't re-trigger
      if (onClearPendingBarcode) {
        onClearPendingBarcode();
      }
    }
  }, [pendingBarcode, onClearPendingBarcode]);

  const getBooks = (silent = false) => {
    if (!silent) setLoading(true);
    axiosClient.get("/books")
      .then(({ data }) => {
        setBooks(data);
        if (!silent) setLoading(false);
      })
      .catch(() => {
        if (!silent) setLoading(false);
      });
  };

  // DELETE FUNCTION
  const onDelete = (book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }
    axiosClient.delete(`/books/${book.id}`)
      .then(() => {
        getBooks(); // Refresh list
      });
  };

  // EDIT FUNCTION
  const onEdit = (book) => {
    setEditingBook(book);
    setShowTitleForm(true);
  };

  // OPEN "ADD NEW" (Clear editing data)
  const onAddNew = () => {
    setEditingBook(null);
    setShowTitleForm(true);
  }

  // Enhanced filtering: Title, Author, ISBN, and Category
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        book.title.toLowerCase().includes(searchLower) ||
        book.author.toLowerCase().includes(searchLower) ||
        (book.isbn && book.isbn.toLowerCase().includes(searchLower)) ||
        book.category.toLowerCase().includes(searchLower);

      // Status filter
      if (filterStatus === "available") {
        return matchesSearch && book.available_copies > 0;
      } else if (filterStatus === "borrowed") {
        return matchesSearch && book.available_copies === 0;
      }

      return matchesSearch;
    });
  }, [books, searchTerm, filterStatus]);

  // Group books by category
  const booksByCategory = useMemo(() => {
    const grouped = {};
    filteredBooks.forEach(book => {
      const category = book.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(book);
    });
    // Sort categories alphabetically
    return Object.keys(grouped).sort().reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {});
  }, [filteredBooks]);

  // Category stats
  const categoryStats = useMemo(() => {
    return Object.entries(booksByCategory).map(([category, categoryBooks]) => ({
      category,
      totalBooks: categoryBooks.length,
      available: categoryBooks.filter(b => b.available_copies > 0).length,
      borrowed: categoryBooks.filter(b => b.available_copies === 0).length
    }));
  }, [booksByCategory]);

  // Toggle category collapse
  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Expand/Collapse all
  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const all = {};
    Object.keys(booksByCategory).forEach(cat => all[cat] = true);
    setCollapsedCategories(all);
  };

  // Get status badge style
  const getStatusBadge = (availableCopies) => {
    if (availableCopies > 0) {
      return {
        className: "bg-green-100 text-green-700 border border-green-200",
        text: `${availableCopies} Available`
      };
    } else {
      return {
        className: "bg-red-100 text-red-700 border border-red-200",
        text: "All Borrowed"
      };
    }
  };

  // Category Section Component
  const CategorySection = ({ category, categoryBooks }) => {
    const isCollapsed = collapsedCategories[category];
    const colors = getCategoryColors(category);
    const availableCount = categoryBooks.filter(b => b.available_copies > 0).length;
    const totalCopies = categoryBooks.reduce((sum, b) => sum + (b.available_copies || 0), 0);

    return (
      <div className={`mb-4 rounded-xl overflow-hidden border-2 ${colors.border} transition-all duration-200`}>
        {/* Category Header */}
        <button
          onClick={() => toggleCategory(category)}
          className={`w-full ${colors.bg} px-4 py-3 flex items-center justify-between hover:brightness-95 transition-all`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
              {isCollapsed ? (
                <ChevronRight size={20} className={colors.icon} />
              ) : (
                <ChevronDown size={20} className={colors.icon} />
              )}
            </div>
            <div className="text-left">
              <h3 className={`font-bold text-lg ${colors.text}`}>{category}</h3>
              <p className="text-xs text-slate-500">
                {categoryBooks.length} title{categoryBooks.length !== 1 ? 's' : ''} •
                {availableCount} available • {totalCopies} total copies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
              {categoryBooks.length} Books
            </span>
          </div>
        </button>

        {/* Category Books Table */}
        {!isCollapsed && (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-4 border-b border-slate-100">Title</th>
                  <th className="p-4 border-b border-slate-100">Author</th>
                  <th className="p-4 border-b border-slate-100">ISBN</th>
                  <th className="p-4 border-b border-slate-100 text-center">Status</th>
                  <th className="p-4 border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categoryBooks.map((book) => {
                  const badge = getStatusBadge(book.available_copies);
                  return (
                    <tr key={book.id} className="hover:bg-slate-50 transition group">
                      <td className="p-4 font-semibold text-slate-800">{book.title}</td>
                      <td className="p-4 text-slate-600">{book.author}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{book.isbn || '-'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          {/* ADD COPY BUTTON */}
                          <button
                            onClick={() => setSelectedBookForCopy(book)}
                            className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition mr-2 font-medium"
                          >
                            + Copy
                          </button>
                          {/* EDIT BUTTON */}
                          <button onClick={() => onEdit(book)} className="text-slate-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition" title="Edit">
                            <Edit size={16} />
                          </button>
                          {/* DELETE BUTTON */}
                          <button onClick={() => onDelete(book)} className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition" title="Delete">
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
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-gray-50 -m-8 p-8 min-h-screen">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Book Inventory</h2>
            <p className="text-gray-500 text-sm">Organized by category • {filteredBooks.length} books total</p>
          </div>
        </div>

        <Button
          onClick={onAddNew}
          icon={PlusCircle}
        >
          Add New Title
        </Button>
      </div>

      {/* CATEGORY SUMMARY CARDS */}
      {categoryStats.length > 0 && !searchTerm && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categoryStats.map(({ category, totalBooks, available }) => {
            const colors = getCategoryColors(category);
            return (
              <button
                key={category}
                onClick={() => {
                  // Expand this category and scroll to it
                  setCollapsedCategories(prev => ({ ...prev, [category]: false }));
                }}
                className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-4 text-left hover:brightness-95 transition-all duration-200 hover:shadow-lg`}
              >
                <div className={`text-xs font-bold ${colors.text} uppercase tracking-wide mb-2`}>{category}</div>
                <div className="text-3xl font-bold text-gray-800">{totalBooks}</div>
                <div className="text-xs text-gray-500 mt-1">{available} available</div>
              </button>
            );
          })}
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Search Books</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-400" size={18} />
              <input
                type="text"
                placeholder="Search by Title, Author, ISBN, Category..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-600 outline-none text-sm transition-all bg-gray-50 hover:bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-56">
            <FloatingSelect
              label="Status Filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Show All</option>
              <option value="available">Available</option>
              <option value="borrowed">Borrowed</option>
            </FloatingSelect>
          </div>

          {/* Expand/Collapse Controls */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              title="Expand All Categories"
            >
              <Maximize2 size={16} /> Expand
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              title="Collapse All Categories"
            >
              <Minimize2 size={16} /> Collapse
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY SECTIONS */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400 border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading inventory...</p>
        </div>
      ) : Object.keys(booksByCategory).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400 border border-gray-100">
          <div className="flex flex-col items-center gap-2">
            <Filter size={40} strokeWidth={1.5} />
            <p className="text-lg font-medium">
              {searchTerm ? `No books found matching "${searchTerm}"` : "No books in inventory"}
            </p>
            <p className="text-sm">Add new books using the button above</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(booksByCategory).map(([category, categoryBooks]) => (
            <CategorySection
              key={category}
              category={category}
              categoryBooks={categoryBooks}
            />
          ))}
        </div>
      )}

      {showTitleForm && (
        <BookForm
          bookToEdit={editingBook}
          prefillBarcode={prefillBarcode}
          onClose={() => {
            setShowTitleForm(false);
            setPrefillBarcode("");
          }}
          onSuccess={getBooks}
        />
      )}

      {selectedBookForCopy && (
        <AssetForm book={selectedBookForCopy} onClose={() => setSelectedBookForCopy(null)} onSuccess={getBooks} />
      )}
    </div>
  );
}
