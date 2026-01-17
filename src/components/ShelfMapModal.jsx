import { X, MapPin, Building, Library } from "lucide-react";

export default function ShelfMapModal({ book, location, onClose }) {
    if (!book || !location) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scale-up">

                {/* Header */}
                <div className="bg-primary-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Library size={120} />
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-bold mb-1">Locate Book</h2>
                    <p className="text-primary-100 text-sm">Follow the map to find your book.</p>
                </div>

                {/* Book Info */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-lg">{book.title}</h3>
                    <p className="text-gray-500 text-sm">{book.author}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Available Now
                    </div>
                </div>

                {/* Location Details */}
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4 p-4 border-2 border-primary-100 rounded-xl bg-primary-50/50">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-primary-600">
                            <MapPin size={28} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-primary-400 uppercase tracking-wider">Exact Location</div>
                            <div className="text-xl font-bold text-gray-800">{location.shelf}</div>
                            <div className="text-sm text-gray-600">{location.building}, {location.aisle}</div>
                        </div>
                    </div>

                    {/* Visual Map Placeholder */}
                    <div className="h-40 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <Building size={32} className="mb-2" />
                        <span className="text-xs font-medium">Shelf Map Visualization</span>
                        <span className="text-[10px] mt-1">(Mockup)</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                        onClick={onClose}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-200"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
}
