import { useState, useEffect } from "react";
import KioskLayout from "./KioskLayout";
import FlipBookCard from "../components/FlipBookCard";
import ShelfMapModal from "../components/ShelfMapModal";
import axiosClient from "../axios-client";
import { Search, Loader2, BookOpen, MapPin, Sparkles, TrendingUp, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Glass Card Helper ---
const GlassCard = ({ children, className = "", onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden hover:bg-white/10 transition-colors ${className} ${onClick ? 'cursor-pointer group' : ''}`}
    >
        {children}
    </div>
);

export default function PublicCatalog() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBook, setSelectedBook] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [categories, setCategories] = useState([]); // Dynamic categories
    const [loadingCategories, setLoadingCategories] = useState(true);

    // const categories = ["All", "Fiction", "Science", "Technology", "History", "Education", "Literature", "Reference"];

    useEffect(() => {
        // Fetch Categories
        setLoadingCategories(true);
        axiosClient.get('/public/books/categories')
            .then(({ data }) => {
                // Ensure "All" is always first
                const totalBooks = data.reduce((sum, cat) => sum + cat.count, 0);
                const allCategory = { category: "All", count: totalBooks };
                setCategories([allCategory, ...data]);
                setLoadingCategories(false);
            })
            .catch(err => {
                console.error("Failed to fetch categories:", err);
                setLoadingCategories(false);
            });

        const delayDebounceFn = setTimeout(() => {
            fetchBooks();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedCategory]);

    const fetchBooks = () => {
        setLoading(true);
        const params = {};
        if (selectedCategory !== "All") {
            params.search = searchTerm ? `${selectedCategory} ${searchTerm}` : selectedCategory;
        } else if (searchTerm) {
            params.search = searchTerm;
        }

        axiosClient.get('/public/books', { params })
            .then(({ data }) => {
                if (data && data.data) setBooks(data.data);
                else if (Array.isArray(data)) setBooks(data);
                else setBooks([]);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleLocate = (book) => {
        axiosClient.get(`/public/books/${book.id}`)
            .then(({ data }) => {
                const asset = data.assets && data.assets.length > 0 ? data.assets[0] : null;
                if (asset) setSelectedBook({ ...book, location: asset });
                else alert("Sorry, no physical copy location found.");
            })
            .catch(err => console.error(err));
    };

    return (
        <KioskLayout>
            {/* HERO DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">

                {/* 1. GREETING & STATUS (Left - Large) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-8 flex flex-col gap-6"
                >
                    {/* Welcome Card */}
                    <GlassCard className="p-10 flex items-center justify-between bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Welcome Area.</h2>
                                <p className="text-blue-200 text-lg max-w-md leading-relaxed">
                                    Access a world of knowledge. You have <span className="text-white font-bold">0 pending fines</span> and <span className="text-emerald-400 font-bold">3 active loans</span>.
                                </p>
                            </motion.div>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white mb-1">3</div>
                                <div className="text-xs text-blue-300 uppercase tracking-wider font-bold">Borrowed</div>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div className="text-center">
                                <div className="text-3xl font-bold text-emerald-400 mb-1">0</div>
                                <div className="text-xs text-emerald-400/70 uppercase tracking-wider font-bold">Fines</div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* HERO SEARCH BAR (Moved into Grid) */}
                    <GlassCard className="p-1 relative group bg-slate-900/60 transition-all hover:bg-slate-900/80 hover:shadow-blue-500/10">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
                        <div className="relative flex items-center px-6 py-4">
                            <Search className="text-blue-400 mr-4" size={28} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search the catalog (Title, Author, ISBN)..."
                                className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 text-xl font-medium"
                                autoFocus
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
                                    Clear
                                </button>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* 2. SIDE WIDGETS (Right - Vertical) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Featured / Trending */}
                    <GlassCard className="flex-1 p-6 relative overflow-hidden group border-amber-500/10 bg-amber-900/5">
                        <div className="absolute -right-4 -top-4 text-amber-500/10">
                            <Sparkles size={120} />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="text-amber-400" size={18} />
                            <h3 className="text-amber-100 font-bold text-sm tracking-wide uppercase">Trending Now</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { title: "The Pragmatic Programmer", author: "Andrew Hunt", views: "1.2k views" },
                                { title: "Clean Code", author: "Robert C. Martin", views: "900 views" }
                            ].map((book, i) => (
                                <div key={i} className="flex items-center gap-3 group/item cursor-pointer">
                                    <div className="w-10 h-14 bg-slate-800 rounded shadow-md border border-white/5 flex items-center justify-center text-xs text-slate-600 font-serif">
                                        COVER
                                    </div>
                                    <div>
                                        <p className="text-slate-200 font-bold text-sm group-hover/item:text-amber-400 transition-colors">{book.title}</p>
                                        <p className="text-slate-500 text-xs">{book.author}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-end">
                            <span className="text-xs text-slate-500">Updated hourly</span>
                            <button className="text-amber-400 text-xs font-bold hover:underline">View Top 100</button>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* CATALOG SECTION */}
            <div className="relative z-10">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Star className="text-yellow-400 fill-yellow-400" size={20} />
                        Explore Collection
                    </h2>

                    {/* Category Tags */}
                    {/* Category Tags */}
                    <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {loadingCategories ? (
                            // Skeleton loaders for categories
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-9 w-24 bg-white/5 rounded-xl animate-pulse" />
                            ))
                        ) : (
                            categories.map(cat => (
                                <button
                                    key={cat.category}
                                    onClick={() => setSelectedCategory(cat.category)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.category
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50'
                                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {cat.category}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${selectedCategory === cat.category ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
                                        }`}>
                                        {cat.count || 0}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* BOOKS GRID */}
                <div className="min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                            <p className="text-slate-500 animate-pulse">Scanning archives...</p>
                        </div>
                    ) : books.length > 0 ? (
                        <motion.div
                            initial="hidden" animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                        >
                            {books.map((book, i) => (
                                <motion.div
                                    key={book.id}
                                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                >
                                    <div className="relative group">
                                        <FlipBookCard book={book} index={i} /> {/* Ideally, FlipBookCard should be styled for dark mode too */}

                                        {/* Quick Locate Button Overlay */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLocate(book); }}
                                            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-1 z-30 whitespace-nowrap"
                                        >
                                            <MapPin size={10} /> LOCATE
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <BookOpen size={48} className="mb-4 text-slate-700" />
                            <p>No results found for "{searchTerm || selectedCategory}".</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            <AnimatePresence>
                {selectedBook && (
                    <ShelfMapModal
                        book={selectedBook}
                        location={selectedBook.location}
                        onClose={() => setSelectedBook(null)}
                    />
                )}
            </AnimatePresence>
        </KioskLayout>
    );
}
