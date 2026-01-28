import { useEffect, useState } from "react";
import axiosClient, { ASSET_URL } from "../axios-client";
import { useToast } from "../components/ui/Toast";
import { X, RefreshCw, AlertCircle, BookOpen, CheckCircle } from "lucide-react";

export default function LostBooksModal({ onClose, onSuccess }) {
    const toast = useToast();
    const [lostBooks, setLostBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState(null);
    const [payingId, setPayingId] = useState(null);

    useEffect(() => {
        fetchLostBooks();
    }, []);

    const fetchLostBooks = () => {
        setLoading(true);
        axiosClient.get('/books/lost')
            .then(({ data }) => {
                setLostBooks(data);
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
                toast.error("Failed to load lost books.");
            });
    };

    const handleRestore = (assetId) => {
        setRestoringId(assetId);
        axiosClient.post(`/books/assets/${assetId}/restore`)
            .then(() => {
                toast.success("Book has been restored to inventory.");
                fetchLostBooks();
                if (onSuccess) onSuccess();
                setRestoringId(null);
            })
            .catch((err) => {
                const message = err.response?.data?.message || "Failed to restore book.";
                if (err.response?.data?.error === 'unpaid_fine') {
                    toast.error(message); // Already specific
                } else {
                    toast.error(message);
                }
                setRestoringId(null);
            });
    };

    const handlePay = (transactionId) => {
        setPayingId(transactionId);
        axiosClient.post(`/transactions/${transactionId}/pay`)
            .then(() => {
                toast.success("Fine paid successfully. You can now restore the book.");
                fetchLostBooks(); // Refresh to update status
                setPayingId(null);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Failed to pay fine.");
                setPayingId(null);
            });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-amber-600 p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <AlertCircle size={24} /> Lost Books Management
                        </h2>
                        <p className="text-amber-100 mt-1">Found a lost book? Restore it to the inventory here.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                        </div>
                    ) : lostBooks.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                            <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-lg">No books currently marked as lost.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lostBooks.map((asset) => (
                                <div key={asset.id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600 flex justify-between items-center group hover:border-amber-200 dark:hover:border-amber-700 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-16 bg-gray-200 dark:bg-slate-600 rounded flex-shrink-0 overflow-hidden">
                                            {asset.book_title?.image_path ? (
                                                <img src={`${ASSET_URL}/${asset.book_title.image_path}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <BookOpen size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white line-clamp-1">{asset.book_title?.title}</h4>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">Code: <span className="font-mono text-amber-600 dark:text-amber-400">{asset.asset_code}</span></p>
                                            <p className="text-xs text-start text-gray-400">Lost since: {new Date(asset.updated_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {/* Show Fine Logic */}
                                        {(() => {
                                            const latestTx = asset.transactions && asset.transactions[0];
                                            const hasUnpaidFine = latestTx && latestTx.penalty_amount > 0 && latestTx.payment_status === 'pending';

                                            if (hasUnpaidFine) {
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-200">
                                                            Unpaid: ₱{latestTx.penalty_amount}
                                                        </span>
                                                        <button
                                                            onClick={() => handlePay(latestTx.id)}
                                                            disabled={payingId === latestTx.id}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                                                        >
                                                            {payingId === latestTx.id ? "..." : <><CheckCircle size={12} /> Pay Now</>}
                                                        </button>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        <button
                                            onClick={() => handleRestore(asset.id)}
                                            disabled={restoringId === asset.id || (asset.transactions && asset.transactions[0] && asset.transactions[0].payment_status === 'pending' && asset.transactions[0].penalty_amount > 0)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
                                            title={asset.transactions && asset.transactions[0]?.payment_status === 'pending' ? "Pay fine first" : "Restore to inventory"}
                                        >
                                            {restoringId === asset.id ? (
                                                "Restoring..."
                                            ) : (
                                                <>
                                                    <RefreshCw size={16} /> Restore
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex justify-end shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-bold transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
