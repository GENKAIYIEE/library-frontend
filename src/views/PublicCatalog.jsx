import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Grid3x3, Layout, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import ShelfMapModal from "../components/ShelfMapModal";
import KioskLayout from "./KioskLayout";

// --- Enhanced Book Card (3D Tilt Effect) ---
const BookCard3D = ({ book, onClick, getImageUrl }) => {
    return (
        <motion.div
            layoutId={`book-${book.id}`}
            onClick={onClick}
            whileHover={{ y: -10, zIndex: 10 }}
            className="group relative cursor-pointer"
        >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl bg-slate-800 transition-all duration-500 group-hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.4)]">
                {getImageUrl(book.cover_image || book.image_path) ? (
                    <img
                        src={getImageUrl(book.cover_image || book.image_path)}
                        alt={book.title}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <span className="text-3xl">📚</span>
                    </div>
                )}
                {/* Gloss Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            
            <div className="mt-4 space-y-1">
                <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">{book.title}</h3>
                <p className="text-slate-500 text-xs line-clamp-1">{book.author}</p>
            </div>
        </motion.div>
    );
};

export default function PublicCatalog() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBook, setSelectedBook] = useState(null);
    const [categories, setCategories] = useState([]);
    const [featuredBook, setFeaturedBook] = useState(null);
    const [viewMode, setViewMode] = useState('spotlight'); 

    // Logic for fetching (Preserved)
    useEffect(() => {
        axiosClient.get('/public/books/categories')
            .then(({ data }) => {
                const totalBooks = data.reduce((sum, cat) => sum + cat.count, 0);
                setCategories([{ category: "All", count: totalBooks }, ...data]);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const delay = setTimeout(fetchBooks, 500);
        return () => clearTimeout(delay);
    }, [searchTerm, selectedCategory]);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
        return `${baseUrl}/${path.startsWith('uploads/') ? path : 'storage/' + path}`;
    };

    const fetchBooks = () => {
        setLoading(true);
        const params = {};
        if (selectedCategory !== "All") params.search = searchTerm ? `${selectedCategory} ${searchTerm}` : selectedCategory;
        else if (searchTerm) params.search = searchTerm;

        axiosClient.get('/public/books', { params })
            .then(({ data }) => {
                const fetched = Array.isArray(data) ? data : data.data || [];
                setBooks(fetched);
                if (fetched.length > 0 && !featuredBook) setFeaturedBook(fetched[0]);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleLocate = (book) => {
        axiosClient.get(`/public/books/${book.id}`).then(({ data }) => {
            const asset = data.assets?.[0];
            if (asset) setSelectedBook({ ...book, location: asset });
            else alert("Location not available.");
        });
    };

    return (
        <KioskLayout disableBackground={true}>
            {/* --- IMMERSIVE HERO BACKGROUND --- */}
            <div className="fixed inset-0 z-0 bg-[#020617]">
                <AnimatePresence mode="wait">
                    {featuredBook && (
                        <motion.div
                            key={featuredBook.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('${getImageUrl(featuredBook.cover_image || featuredBook.image_path)}')` }}
                        >
                            <div className="absolute inset-0 backdrop-blur-[100px] bg-[#020617]/50 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/50 to-transparent" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- SEARCH HEADER --- */}
            <div className="relative z-20 mb-12 flex flex-col md:flex-row items-center gap-6 justify-between">
                {/* Search Bar */}
                <div className="relative w-full max-w-xl group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500" />
                    <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 shadow-2xl">
                        <Search className="text-slate-400 mr-4" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Find titles, authors, or topics..."
                            className="bg-transparent border-none outline-none text-white placeholder:text-slate-500 w-full text-lg font-medium"
                        />
                    </div>
                </div>

                {/* View Toggles */}
                <div className="flex bg-slate-900/60 backdrop-blur-md rounded-full p-1.5 border border-white/10">
                    {[ {id: 'spotlight', icon: Layout}, {id: 'grid', icon: Grid3x3} ].map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id)}
                            className={`p-3 rounded-full transition-all ${viewMode === mode.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <mode.icon size={18} />
                        </button>
                    ))}
                </div>
            </div>

            {/* --- CATEGORY PILLS --- */}
            <div className="relative z-20 mb-16 overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-3">
                    {categories.map((cat) => (
                        <button
                            key={cat.category}
                            onClick={() => setSelectedCategory(cat.category)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                                selectedCategory === cat.category
                                    ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] transform scale-105'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                            }`}
                        >
                            {cat.category}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="relative z-10 min-h-[50vh]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 text-sm tracking-widest uppercase animate-pulse">Loading Library</p>
                    </div>
                ) : books.length === 0 ? (
                    <div className="text-center py-20">
                        <Sparkles className="mx-auto text-slate-600 mb-4" size={48} />
                        <h3 className="text-2xl text-white font-bold">No books found</h3>
                    </div>
                ) : viewMode === 'spotlight' ? (
                    // SPOTLIGHT VIEW
                    <div className="space-y-20">
                        {featuredBook && (
                            <div className="grid lg:grid-cols-2 gap-16 items-center">
                                {/* Text Content */}
                                <motion.div 
                                    key={featuredBook.id + '-text'}
                                    initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                                    className="order-2 lg:order-1 space-y-8"
                                >
                                    <div>
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold uppercase tracking-widest mb-4 border border-indigo-500/20">
                                            {featuredBook.category || "Featured Selection"}
                                        </motion.div>
                                        <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tight mb-4">
                                            {featuredBook.title}
                                        </h1>
                                        <p className="text-2xl text-slate-400 font-light">{featuredBook.author}</p>
                                    </div>
                                    <p className="text-lg text-slate-300 leading-relaxed max-w-xl border-l-2 border-white/10 pl-6">
                                        {featuredBook.description || "No description available for this title."}
                                    </p>
                                    <button
                                        onClick={() => handleLocate(featuredBook)}
                                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                                    >
                                        <MapPin className="text-indigo-600 group-hover:rotate-12 transition-transform" />
                                        <span>Locate on Shelf</span>
                                        <ChevronRight size={16} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                    </button>
                                </motion.div>

                                {/* Cover Image */}
                                <motion.div 
                                    key={featuredBook.id + '-img'}
                                    initial={{ opacity: 0, scale: 0.9, rotateY: 30 }} 
                                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                    transition={{ type: "spring", stiffness: 50 }}
                                    className="order-1 lg:order-2 perspective-1000"
                                >
                                    <div className="relative w-3/4 mx-auto lg:w-full aspect-[2/3] rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] transform rotate-y-12 hover:rotate-y-0 transition-transform duration-700 bg-slate-800 overflow-hidden">
                                        {getImageUrl(featuredBook.cover_image || featuredBook.image_path) ? (
                                            <img src={getImageUrl(featuredBook.cover_image || featuredBook.image_path)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600"><Sparkles size={64} /></div>
                                        )}
                                        {/* Shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Horizontal Scroller */}
                        <div className="border-t border-white/5 pt-12">
                            <h3 className="text-xl text-white font-bold mb-6 flex items-center gap-2">
                                <Sparkles className="text-yellow-500" size={18} /> More to Explore
                            </h3>
                            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
                                {books.map((book) => (
                                    <div key={book.id} className="w-40 flex-shrink-0 snap-start" onClick={() => setFeaturedBook(book)}>
                                        <BookCard3D book={book} onClick={() => setFeaturedBook(book)} getImageUrl={getImageUrl} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // GRID VIEW
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12"
                    >
                        {books.map((book) => (
                            <BookCard3D 
                                key={book.id} 
                                book={book} 
                                onClick={() => handleLocate(book)} 
                                getImageUrl={getImageUrl} 
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedBook && (
                    <ShelfMapModal book={selectedBook} location={selectedBook.location} onClose={() => setSelectedBook(null)} />
                )}
            </AnimatePresence>
        </KioskLayout>
    );
}