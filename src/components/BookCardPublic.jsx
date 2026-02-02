import { MapPin, Book, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function BookCardPublic({ book, onLocate, onSelect, index }) {
    const isAvailable = book.available_copies > 0;
    const [isFlipped, setIsFlipped] = useState(false);

    // Get image URL
    const getImageUrl = () => {
        const imagePath = book.cover_image || book.image_path;
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;

        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

        // If path already acts as a full relative path (e.g. /storage/...)
        if (imagePath.startsWith('/')) return `${baseUrl}${imagePath}`;

        // Specific fix for "uploads/" directory (standard public folder, not storage linked)
        if (imagePath.startsWith('uploads/')) return `${baseUrl}/${imagePath}`;

        // Default assumption: it's a storage path
        return `${baseUrl}/storage/${imagePath}`;
    };

    const imageUrl = getImageUrl();

    // Deterministic height for masonry effect (Aspect Ratios: 3:4, 3:5, 4:5, 2:3)
    const rawRatios = ['3/4', '3/5', '4/5', '2/3'];
    const ratioIndex = (book.id ? book.id : index) % rawRatios.length;
    const paddingRatio = rawRatios[ratioIndex]; // e.g. "3/4"

    const handleInteraction = (e) => {
        // Prevent default only if necessary, but here we generally want propagation unless specific button click
        // e.stopPropagation(); 

        // On click (especially mobile), we want to both Select (Immersive BG) AND Flip
        // This ensures the user feels the interaction immediately.
        if (onSelect) onSelect(book);

        // Toggle flip state on click/tap
        setIsFlipped(!isFlipped);
    };

    return (
        <div
            className="break-inside-avoid mb-6 group relative"
            style={{
                perspective: "1000px",
                aspectRatio: paddingRatio,
                minHeight: '280px' // Fallback minimum height
            }}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            onClick={handleInteraction}
        >
            {/* The 3D Card Container */}
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    rotateY: isFlipped ? 180 : 0
                }}
                transition={{ duration: 0.6, type: "spring", stiffness: 180, damping: 14 }}
                style={{ transformStyle: "preserve-3d" }} // INLINE STYLE for 3D context
                className="relative w-full h-full rounded-2xl cursor-pointer"
            >
                {/* --- FRONT FACE (Cover Image) --- */}
                <div
                    className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-md group-hover:shadow-2xl transition-shadow duration-300 bg-gray-200 dark:bg-gray-800"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }} // INLINE STYLE
                >
                    <div className="w-full h-full relative">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.classList.add('flex', 'items-center', 'justify-center', 'bg-slate-800');
                                    e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                        )}

                        {/* Fallback Icon for Broken/Missing Images */}
                        <div className="fallback-icon hidden absolute inset-0 items-center justify-center">
                            <Book size={48} className="text-white/20" />
                        </div>

                        {/* Front Overlay Gradient (Subtle) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                        {/* Front Title (Minimal) */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-md leading-tight">{book.title}</h3>
                            <p className="text-white/70 text-xs mt-1 truncate">{book.author}</p>
                        </div>
                    </div>
                </div>

                {/* --- BACK FACE (Details) --- */}
                <div
                    className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-slate-900/90 backdrop-blur-3xl border border-white/10 shadow-2xl p-5 flex flex-col justify-between"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)"
                    }}
                >
                    {/* Top Actions */}
                    <div className="flex justify-between items-start">
                        <div className="bg-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm border border-white/5">
                            {book.category || 'General'}
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                            <Share2 size={16} />
                        </button>
                    </div>

                    {/* Content Info */}
                    <div className="flex-1 flex flex-col justify-center gap-3 py-2">
                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{book.title}</h3>
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-wide truncate">{book.author}</p>

                        <div className="mt-1 text-slate-300 text-xs leading-relaxed line-clamp-4 font-medium opacity-80">
                            {book.description || "No description available. Tap 'Locate' to find it on the shelf."}
                        </div>
                    </div>

                    {/* Bottom Action (Locate) */}
                    <div>
                        <div className="flex items-center justify-between mb-3 text-xs border-t border-white/10 pt-3">
                            <span className="text-slate-400 font-medium">Availability</span>
                            <span className={`font-bold ${isAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isAvailable ? 'In Stock' : 'All Borrowed'}
                            </span>
                        </div>

                        {isAvailable ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLocate(book);
                                }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all group/btn border border-white/10"
                            >
                                <MapPin size={16} className="group-hover/btn:animate-bounce" /> Find on Shelf
                            </button>
                        ) : (
                            <button disabled className="w-full py-3 bg-white/5 text-white/40 rounded-xl font-bold text-sm cursor-not-allowed border border-white/5">
                                Currently Unavailable
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
