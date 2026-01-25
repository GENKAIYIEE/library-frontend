import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Book, Filter, ChevronRight, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { ASSET_URL } from "../axios-client";
import { cn } from "../lib/utils";

export default function BookSelectorModal({
    isOpen,
    onClose,
    books,
    onSelect,
    title = "Select Book",
    mode = "borrow" // 'borrow' | 'return'
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [categories, setCategories] = useState(["All"]);
    const [filteredBooks, setFilteredBooks] = useState([]);

    // Extract unique categories
    useEffect(() => {
        if (books && books.length > 0) {
            const uniqueCats = ["All", ...new Set(books.map(b => b.category || "Uncategorized"))];
            setCategories(uniqueCats);
        }
        setFilteredBooks(books);
    }, [books]);

    // Filter logic
    useEffect(() => {
        let result = books;

        // 1. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(b =>
                b.title.toLowerCase().includes(query) ||
                b.author.toLowerCase().includes(query) ||
                b.asset_code.toLowerCase().includes(query) ||
                (b.borrower && b.borrower.toLowerCase().includes(query))
            );
        }

        // 2. Category Filter
        if (selectedCategory !== "All") {
            result = result.filter(b => (b.category || "Uncategorized") === selectedCategory);
        }

        setFilteredBooks(result);
    }, [searchQuery, selectedCategory, books]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Book className={mode === 'borrow' ? "text-blue-600" : "text-emerald-600"} />
                                    {title}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {filteredBooks.length} books found
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by title, author, barcode..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-xl outline-none transition-all font-medium text-gray-700 dark:text-gray-200"
                                    autoFocus
                                />
                            </div>

                            {/* Category Filter Desktop */}
                            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 max-w-md no-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors",
                                            selectedCategory === cat
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950/50 p-6 custom-scrollbar">
                        {filteredBooks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Book size={64} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No books found matching your criteria</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredBooks.map((book) => (
                                    <div
                                        key={book.asset_code}
                                        onClick={() => onSelect(book)}
                                        className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="flex gap-4">
                                            {/* Book Cover / Icon */}
                                            <div className="w-16 h-24 bg-blue-50 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-sm">
                                                {book.image_path ? (
                                                    <img
                                                        src={`${ASSET_URL}/${book.image_path}`}
                                                        alt={book.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Book size={32} className="text-blue-300 dark:text-slate-500" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                                        {book.category || "General"}
                                                    </span>
                                                    {book.is_recommended && (
                                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded font-bold">Recommended</span>
                                                    )}
                                                </div>

                                                <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate pr-4" title={book.title}>
                                                    {book.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{book.author}</p>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{book.asset_code}</span>

                                                    {/* Status Badge */}
                                                    {mode === 'return' ? (
                                                        <div className="text-right">
                                                            <div className="text-xs font-medium text-gray-500">Borrowed by</div>
                                                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{book.borrower}</div>
                                                        </div>
                                                    ) : (
                                                        <span className={cn(
                                                            "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
                                                            book.status === 'available'
                                                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                        )}>
                                                            {book.status === 'available' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                            {book.status === 'available' ? 'Available' : 'Unavailable'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Effect overlay */}
                                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-xs text-gray-500">
                        <span>Showing {filteredBooks.length} results</span>
                        <span>Press <kbd className="font-mono bg-white dark:bg-slate-800 px-1 border rounded">Esc</kbd> to close</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
