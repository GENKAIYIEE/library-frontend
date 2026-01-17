import { MapPin, Book } from "lucide-react";

export default function BookCardPublic({ book, onLocate }) {
    const isAvailable = book.available_copies > 0;

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="flex h-full">
                {/* Cover Placeholder */}
                <div className="w-32 bg-slate-100 flex items-center justify-center shrink-0 border-r border-gray-100 relative overflow-hidden">
                    {book.cover_image ? (
                        <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <Book size={40} className="text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                    )}
                    {/* Status Band */}
                    <div className={`absolute bottom-0 w-full text-center text-[10px] font-bold uppercase py-1 ${isAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {isAvailable ? 'Available' : 'Borrowed'}
                    </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="mb-auto">
                        <span className="text-[10px] font-bold tracking-wider text-primary-600 uppercase mb-1 block">
                            {book.category}
                        </span>
                        <h3 className="font-bold text-gray-800 leading-tight mb-1 line-clamp-2">
                            {book.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{book.author}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 hidden md:flex">
                        <div className="text-xs font-medium text-gray-400">
                            {book.isbn || 'No ISBN'}
                        </div>
                        {isAvailable && (
                            <button
                                onClick={() => onLocate(book)}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                                <MapPin size={14} /> Find It
                            </button>
                        )}
                    </div>
                    {/* Mobile Button (Always visible available or not, maybe just status) */}
                    <div className="mt-2 md:hidden">
                        {isAvailable ? (
                            <button
                                onClick={() => onLocate(book)}
                                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-lg"
                            >
                                <MapPin size={14} /> Locate
                            </button>
                        ) : (
                            <div className="text-center text-xs font-bold text-rose-500 bg-rose-50 py-2 rounded-lg">
                                Out of Stock
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
