import { useState, useEffect } from "react";
import KioskLayout from "./KioskLayout";
import FlipBookCard from "../components/FlipBookCard";
import ShelfMapModal from "../components/ShelfMapModal";
import axiosClient from "../axios-client";
import { Search, Loader2, BookOpen, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicCatalog() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBook, setSelectedBook] = useState(null); // For Modal

    const categories = ["All", "Fiction", "Science", "Technology", "History", "Education", "Literature", "Reference", "Business", "Arts", "Religion", "Philosophy", "Law", "Medicine", "Engineering", "Maritime", "Hospitality", "Criminology"];

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchBooks();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedCategory]);

    const fetchBooks = () => {
        setLoading(true);
        const params = {};
        // Combine category and search term for wider results if specific logic isn't in backend
        if (selectedCategory !== "All") {
            // If backend supports 'category' param, cleaner. If not, prepend to search.
            // PublicBookController lines 26-31 search all fields. appending category works.
            params.search = searchTerm ? `${selectedCategory} ${searchTerm}` : selectedCategory;
        } else if (searchTerm) {
            params.search = searchTerm;
        }

        axiosClient.get('/public/books', { params })
            .then(({ data }) => {
                if (data && data.data) {
                    setBooks(data.data);
                } else if (Array.isArray(data)) {
                    setBooks(data);
                } else {
                    setBooks([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleLocate = (book) => {
        // Fetch fresh details with location
        axiosClient.get(`/public/books/${book.id}`)
            .then(({ data }) => {
                const asset = data.assets && data.assets.length > 0 ? data.assets[0] : null;
                if (asset) {
                    setSelectedBook({ ...book, location: asset });
                } else {
                    alert("Sorry, no physical copy location found.");
                }
            })
            .catch(err => console.error(err));
    };

    return (
        <KioskLayout>
            {/* HERO SECTION */}
            <div className="relative mb-12 py-10 text-center">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-blue-500/5 blur-3xl rounded-full -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600">
                        Discover Your Next Read
                    </h2>
                    <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        Explore our vast collection of books, journals, and resources.
                        Tap any book to flip and see details.
                    </p>
                </motion.div>

                {/* SEARCH BAR */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="max-w-3xl mx-auto relative group z-20"
                >
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={28} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title, author, isbn, or topic..."
                        className="w-full pl-16 pr-6 py-6 rounded-3xl border-2 border-slate-200 shadow-xl shadow-blue-900/5 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-xl font-medium transition-all bg-white/80 backdrop-blur-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </motion.div>

                {/* CATEGORY PILLS */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-3 mt-8 max-w-5xl mx-auto px-4"
                >
                    {categories.map((cat, i) => (
                        <motion.button
                            key={cat}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i + 0.5 }}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border-2
                            ${selectedCategory === cat
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                                }`}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            {/* RESULTS GRID */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                        <p className="text-lg font-medium animate-pulse">Searching the archives...</p>
                    </div>
                ) : books.length > 0 ? (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4 pb-20"
                    >
                        {books.map((book, index) => (
                            <div key={book.id} className="relative group">
                                <FlipBookCard book={book} index={index} />

                                {/* LOCATE BUTTON (Floating below or overlaid) */}
                                {/* Since FlipBookCard consumes the click/hover, we can add a utilitarian button below it for Kiosk users who need the MAP */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleLocate(book); }}
                                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex items-center gap-2 hover:bg-slate-800 z-30"
                                >
                                    <MapPin size={12} /> LOCATE IN SHELF
                                </button>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20 max-w-lg mx-auto">
                        <div className="inline-flex p-6 bg-slate-50 rounded-full mb-6">
                            <BookOpen size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-3">No matching books found</h3>
                        <p className="text-slate-500 mb-8">
                            We couldn't find anything matching "{searchTerm || selectedCategory}".
                            Try broadening your search.
                        </p>
                        <button
                            onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL */}
            <AnimatePresence>
                {selectedBook && (
                    <ShelfMapModal
                        book={selectedBook}
                        location={selectedBook.location} // Passed from handleLocate
                        onClose={() => setSelectedBook(null)}
                    />
                )}
            </AnimatePresence>

        </KioskLayout>
    );
}
