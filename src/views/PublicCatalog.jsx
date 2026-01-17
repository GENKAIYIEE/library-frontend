import { useState, useEffect } from "react";
import KioskLayout from "./KioskLayout";
import BookCardPublic from "../components/BookCardPublic";
import ShelfMapModal from "../components/ShelfMapModal";
import axiosClient from "../axios-client";
import { Search, Loader2 } from "lucide-react";
import Button from "../components/ui/Button";

export default function PublicCatalog() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBook, setSelectedBook] = useState(null); // For Modal

    const categories = ["All", "Fiction", "Science", "Technology", "History", "Education", "Maritime", "Hospitality"];

    useEffect(() => {
        fetchBooks();
    }, [searchTerm, selectedCategory]); // Debounce recommended but simple effect for now

    const fetchBooks = () => {
        setLoading(true);
        // Build query params
        const params = {};
        if (searchTerm) params.search = searchTerm;
        // Note: Category filtering is done via search keyword in backend simpler for now, 
        // or we can add precise category filter later. 
        // If selectedCategory !== All, we prepend it to search or handle client side if API doesn't support strict filter yet.
        // Given the PublicBookController implementation, it searches all fields. 
        // So passing category as search term works.

        // If we have both search term AND category, we might need to handle it. 
        // For now, let's just use search param.
        if (selectedCategory !== "All") {
            params.search = selectedCategory + (searchTerm ? " " + searchTerm : "");
        }

        axiosClient.get('/public/books', { params })
            .then(({ date, data }) => { // Pagination returns object with data array
                // data might be wrapped in pagination (data.data) or direct array depending on controller
                // PublicBookController uses paginate(), so it returns { data: [...], ... }
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
                // Find the available asset
                const asset = data.assets && data.assets.length > 0 ? data.assets[0] : null;
                if (asset) {
                    setSelectedBook(book);
                    // Attach location to book or separate state
                    setSelectedBook({ ...book, location: asset });
                } else {
                    alert("Sorry, no physical copy location found.");
                }
            })
            .catch(err => console.error(err));
    };

    return (
        <KioskLayout>
            {/* HERO SEARCH */}
            <div className="text-center mb-12 animate-fade-in-down">
                <h2 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
                    Find Your Next Great Read
                </h2>
                <p className="text-slate-500 mb-8 text-lg">
                    Search our collection of {books.length > 0 ? 'thousands of' : ''} books and resources.
                </p>

                <div className="max-w-2xl mx-auto relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="text-slate-400 group-focus-within:text-primary-500 transition-colors" size={24} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title, author, or ISBN..."
                        className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-slate-200 shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none text-lg transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* CATEGORY CHIPS */}
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all transform hover:-translate-y-0.5
                            ${selectedCategory === cat
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 ring-2 ring-primary-100'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-primary-300 hover:text-primary-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* RESULTS GRID */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={48} className="animate-spin mb-4 text-primary-500" />
                    <p>Searching the archives...</p>
                </div>
            ) : books.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                    {books.map(book => (
                        <BookCardPublic key={book.id} book={book} onLocate={handleLocate} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
                        <Search size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No books found</h3>
                    <p className="text-slate-500">Try adjusting your search terms or category.</p>
                    <button
                        onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
                        className="mt-6 text-primary-600 font-bold hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* MODAL */}
            {selectedBook && (
                <ShelfMapModal
                    book={selectedBook}
                    location={selectedBook.location} // Passed from handleLocate
                    onClose={() => setSelectedBook(null)}
                />
            )}

        </KioskLayout>
    );
}
