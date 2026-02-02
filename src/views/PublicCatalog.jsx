import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Grid3x3, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axiosClient from "../axios-client";
import ShelfMapModal from "../components/ShelfMapModal";
import KioskLayout from "./KioskLayout";

export default function PublicCatalog() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBook, setSelectedBook] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [hoveredBook, setHoveredBook] = useState(null);
    const [featuredBook, setFeaturedBook] = useState(null);
    const [viewMode, setViewMode] = useState('spotlight'); // spotlight, grid, carousel
    const [currentSlide, setCurrentSlide] = useState(0);

    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

    useEffect(() => {
        setLoadingCategories(true);
        axiosClient.get('/public/books/categories')
            .then(({ data }) => {
                const totalBooks = data.reduce((sum, cat) => sum + cat.count, 0);
                const allCategory = { category: "All", count: totalBooks };
                setCategories([allCategory, ...data]);
                setLoadingCategories(false);
            })
            .catch(err => {
                console.error("Failed to fetch categories:", err);
                setLoadingCategories(false);
            });
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchBooks();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedCategory]);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
        if (path.startsWith('/')) return `${baseUrl}${path}`;
        if (path.startsWith('uploads/')) return `${baseUrl}/${path}`;
        return `${baseUrl}/storage/${path}`;
    };

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
                let fetchedBooks = [];
                if (data && data.data) fetchedBooks = data.data;
                else if (Array.isArray(data)) fetchedBooks = data;

                setBooks(fetchedBooks);
                if (fetchedBooks.length > 0 && !featuredBook) {
                    setFeaturedBook(fetchedBooks[0]);
                }
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

    const handleBookHover = (book) => {
        setHoveredBook(book);
        setFeaturedBook(book);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % books.length);
        setFeaturedBook(books[(currentSlide + 1) % books.length]);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + books.length) % books.length);
        setFeaturedBook(books[(currentSlide - 1 + books.length) % books.length]);
    };

    return (
        <KioskLayout disableBackground={true}>
            {/* DYNAMIC IMMERSIVE BACKGROUND */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                {/* Animated gradient base */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950"
                    animate={{
                        background: [
                            'linear-gradient(to bottom right, #1e1b4b, #581c87, #0f172a)',
                            'linear-gradient(to bottom right, #581c87, #1e1b4b, #0f172a)',
                            'linear-gradient(to bottom right, #0f172a, #1e1b4b, #581c87)',
                        ]
                    }}
                    transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                />

                {/* Featured book background */}
                <AnimatePresence mode="wait">
                    {featuredBook && (
                        <motion.div
                            key={featuredBook.id}
                            initial={{ opacity: 0, scale: 1.2 }}
                            animate={{ opacity: 0.3, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url('${getImageUrl(featuredBook.cover_image || featuredBook.image_path)}')`,
                                filter: 'blur(60px)',
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Overlay gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />

                {/* Animated particles */}
                <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white/20 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                opacity: [0.2, 0.5, 0.2],
                                scale: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* FLOATING SEARCH BAR */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
            >
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full p-2 shadow-2xl">
                        <div className="flex items-center gap-3 px-4">
                            <Search className="text-white/60" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Discover your next favorite book..."
                                className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none py-3 text-lg"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('spotlight')}
                                    className={`p-2 rounded-full transition-all ${viewMode === 'spotlight' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/60'}`}
                                >
                                    <Sparkles size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/60'}`}
                                >
                                    <Grid3x3 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* FLOATING CATEGORY PILLS */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="fixed top-32 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4"
            >
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
                    {categories.map((cat, idx) => (
                        <motion.button
                            key={cat.category}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedCategory(cat.category)}
                            className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${selectedCategory === cat.category
                                    ? 'bg-white text-black shadow-lg shadow-white/20 scale-110'
                                    : 'bg-white/10 text-white/70 backdrop-blur-md border border-white/10 hover:bg-white/20 hover:scale-105'
                                }`}
                        >
                            {cat.category}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* MAIN CONTENT AREA */}
            <div className="relative z-10 pt-48 pb-20 px-4" ref={containerRef}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <LoadingSpotlight />
                    ) : viewMode === 'spotlight' ? (
                        <SpotlightView
                            books={books}
                            onBookHover={handleBookHover}
                            onLocate={handleLocate}
                            featuredBook={featuredBook}
                            setFeaturedBook={setFeaturedBook}
                            getImageUrl={getImageUrl}
                        />
                    ) : (
                        <GridView
                            books={books}
                            onBookHover={handleBookHover}
                            onLocate={handleLocate}
                            getImageUrl={getImageUrl}
                        />
                    )}
                </AnimatePresence>
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

// SPOTLIGHT VIEW - Hero book with carousel
function SpotlightView({ books, onBookHover, onLocate, featuredBook, setFeaturedBook, getImageUrl }) {
    if (books.length === 0) return <EmptyState />;

    return (
        <div className="max-w-7xl mx-auto">
            {/* HERO FEATURED BOOK */}
            <AnimatePresence mode="wait">
                {featuredBook && (
                    <motion.div
                        key={featuredBook.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="mb-16"
                    >
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* Book Cover - Large */}
                            <motion.div
                                className="relative group cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl blur-3xl group-hover:blur-4xl transition-all" />
                                <div
                                    className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
                                    style={{ aspectRatio: '3/4' }} // INLINE FIX
                                >
                                    {getImageUrl(featuredBook.cover_image || featuredBook.image_path) ? (
                                        <img
                                            src={getImageUrl(featuredBook.cover_image || featuredBook.image_path)}
                                            alt={featuredBook.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                            <Sparkles className="text-white/50" size={64} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Book Details - Untouched */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div>
                                    <motion.h1
                                        className="text-6xl font-bold text-white mb-4 leading-tight"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {featuredBook.title}
                                    </motion.h1>
                                    <motion.p
                                        className="text-2xl text-white/60 mb-2"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {featuredBook.author}
                                    </motion.p>
                                    {featuredBook.category && (
                                        <motion.span
                                            className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md text-white/80 rounded-full text-sm"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            {featuredBook.category}
                                        </motion.span>
                                    )}
                                </div>

                                {featuredBook.description && (
                                    <motion.p
                                        className="text-lg text-white/70 leading-relaxed"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {featuredBook.description}
                                    </motion.p>
                                )}

                                <motion.button
                                    onClick={() => onLocate(featuredBook)}
                                    className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-white/20"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <MapPin className="group-hover:rotate-12 transition-transform" />
                                    Find This Book
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HORIZONTAL SCROLLING CAROUSEL */}
            <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-6">Explore More</h2>
                <div className="relative">
                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                        <div className="flex gap-6">
                            {books.map((book, idx) => (
                                <motion.div
                                    key={book.id}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setFeaturedBook(book)}
                                    onMouseEnter={() => onBookHover(book)}
                                    className="group flex-shrink-0 w-48 cursor-pointer"
                                >
                                    <div
                                        className="relative rounded-2xl overflow-hidden border border-white/10 mb-3 group-hover:scale-105 group-hover:border-white/30 transition-all shadow-lg hover:shadow-2xl hover:shadow-purple-500/20"
                                        style={{ aspectRatio: '2/3' }} // INLINE FIX
                                    >
                                        {getImageUrl(book.cover_image || book.image_path) ? (
                                            <img
                                                src={getImageUrl(book.cover_image || book.image_path)}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                <Sparkles className="text-white/30" size={32} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-purple-300 transition-colors">
                                        {book.title}
                                    </h3>
                                    <p className="text-white/50 text-xs mt-1">{book.author}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// GRID VIEW - Immersive masonry
function GridView({ books, onBookHover, onLocate, getImageUrl }) {
    if (books.length === 0) return <EmptyState />;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
                {books.map((book, idx) => (
                    <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onMouseEnter={() => onBookHover(book)}
                        className="break-inside-avoid mb-4 group cursor-pointer"
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 group-hover:border-white/30 transition-all shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 group-hover:scale-[1.02]">
                            <div
                                className="relative"
                                style={{ aspectRatio: '3/4' }} // INLINE FIX
                            >
                                {getImageUrl(book.cover_image || book.image_path) ? (
                                    <img
                                        src={getImageUrl(book.cover_image || book.image_path)}
                                        alt={book.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                        <Sparkles className="text-white/30" size={32} />
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                        <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">{book.title}</h3>
                                        <p className="text-white/70 text-sm mb-3">{book.author}</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLocate(book);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform"
                                        >
                                            <MapPin size={14} />
                                            Locate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// Loading state
function LoadingSpotlight() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                <div className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse" />
                <div className="space-y-6">
                    <div className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                    <div className="h-8 bg-white/5 rounded-xl w-2/3 animate-pulse" />
                    <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}

// Empty state
function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32"
        >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 backdrop-blur-md">
                <Sparkles size={48} className="text-white/40" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">No books found</h3>
            <p className="text-xl text-white/60">Try a different search or category</p>
        </motion.div>
    );
}