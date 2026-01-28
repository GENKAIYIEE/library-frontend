import { useEffect, useState } from "react";
import { useToast } from "../components/ui/Toast";
import axiosClient from "../axios-client";
import { DollarSign, CheckCircle, History as HistoryIcon, Search, BookOpen, User } from "lucide-react";
import Pagination from "../components/ui/Pagination";

export default function History() {
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('all');

  // Status Badge Component
  const StatusBadge = ({ transaction }) => {
    if (!transaction.returned_at) {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1 w-fit ml-auto">
          ⏳ Active
        </span>
      );
    }

    const hasPenalty = transaction.penalty_amount && parseFloat(transaction.penalty_amount) > 0;

    if (hasPenalty) {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 flex items-center gap-1 w-fit ml-auto">
          ⚠️ Returned Late
        </span>
      );
    }

    return (
      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1 w-fit ml-auto">
        ✓ Returned
      </span>
    );
  };


  // Handle Waiving a fine
  const handleWaiveFine = (transactionId) => {
    setProcessingId(transactionId);
    axiosClient.post(`/transactions/${transactionId}/waive`)
      .then(() => {
        toast.success("Fine waived successfully");
        fetchTransactions();
        setProcessingId(null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to waive fine");
        setProcessingId(null);
      });
  };

  const fetchTransactions = () => {
    setLoading(true);
    axiosClient.get("/transactions")
      .then(({ data }) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Poll for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Silent Fetch
      axiosClient.get("/transactions")
        .then(({ data }) => {
          // Only update if data changed (simple length check or deep compare if needed, 
          // here we just set it to keep it fresh)
          setTransactions(data);
        })
        .catch(() => { });
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Mark fine as paid
  const handleMarkAsPaid = (transactionId) => {
    setProcessingId(transactionId);
    axiosClient.post(`/transactions/${transactionId}/pay`)
      .then(() => {
        toast.success("Payment processed successfully");
        fetchTransactions(); // Refresh list
        setProcessingId(null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to process payment");
        setProcessingId(null);
      });
  };

  // Mark fine as UNPAID (Revert)
  const handleMarkAsUnpaid = (transactionId) => {
    setProcessingId(transactionId);
    axiosClient.post(`/transactions/${transactionId}/unpaid`)
      .then(() => {
        toast.info("Fine reverted to Unpaid");
        fetchTransactions(); // Refresh list
        setProcessingId(null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to revert status");
        setProcessingId(null);
      });
  };

  // Get payment status badge
  const getPaymentBadge = (transaction) => {
    if (!transaction.penalty_amount || parseFloat(transaction.penalty_amount) === 0) {
      return null; // No fine
    }

    switch (transaction.payment_status) {
      case 'paid':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">Paid</span>;
      case 'waived':
        return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Waived</span>;
      case 'pending':
      default:
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Unpaid</span>;
    }
  };



  // Get image URL helper
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
    return `${baseUrl}/${imagePath}`;
  };

  // Filter transactions based on Tabs and Search
  const filteredTransactions = transactions.filter(t => {
    // 1. apply Tab filter
    let matchesTab = true;
    switch (activeTab) {
      case 'active':
        matchesTab = !t.returned_at;
        break;
      case 'returned':
        matchesTab = !!t.returned_at;
        break;
      case 'returned':
        matchesTab = !!t.returned_at;
        break;
      case 'fines': // Renamed from 'unpaid'
        matchesTab = t.penalty_amount > 0; // Show ALL fines (Paid, Unpaid, Waived)
        break;
      case 'deleted':
      case 'deleted':
        matchesTab = !t.book_asset; // Assumes deleted book assets are null in transaction
        break;
      default:
        matchesTab = true;
    }

    if (!matchesTab) return false;

    // 2. apply Search filter
    const searchLower = searchTerm.toLowerCase();
    const studentName = t.user?.name?.toLowerCase() || '';
    const bookTitle = t.book_asset?.book_title?.title?.toLowerCase() || '';
    const assetCode = t.book_asset?.asset_code?.toLowerCase() || '';

    return studentName.includes(searchLower) ||
      bookTitle.includes(searchLower) ||
      assetCode.includes(searchLower);
  });

  // Resets page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
            <HistoryIcon size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Transaction Logs</h2>
            <p className="text-gray-500 dark:text-slate-400">View borrowing and return history</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search student, book, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 outline-none text-sm w-64 bg-white dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'all', label: 'All Records' },
          { id: 'active', label: 'Active Loans' },
          { id: 'returned', label: 'Returned Books' },
          { id: 'fines', label: 'Violations & Fines' }, // Renamed
          { id: 'deleted', label: 'Deleted Books' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all
              ${activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 uppercase text-xs font-bold border-b border-gray-100 dark:border-slate-600">
              <tr>
                <th className="p-4">Date Borrowed</th>
                <th className="p-4">Student</th>
                <th className="p-4">Book</th>
                <th className="p-4">Date Returned</th>
                <th className="p-4">Fine</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      Loading logs...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500 dark:text-slate-400">
                    <HistoryIcon size={48} className="mx-auto mb-3 opacity-20" />
                    <p>{searchTerm ? `No records matching "${searchTerm}"` : 'No transaction records found.'}</p>
                  </td>
                </tr>
              )}

              {currentTransactions.map((t) => {
                const bookTitle = t.book_asset?.book_title;
                const imagePath = bookTitle?.image_path || bookTitle?.cover_image;
                const imageUrl = getImageUrl(imagePath);

                return (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                    <td className="p-4 text-gray-600 dark:text-slate-300 text-sm">
                      {new Date(t.borrowed_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                          <User size={14} className="text-gray-400 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white text-sm">{t.user ? t.user.name : 'Unknown'}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{t.user?.student_id || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Book Thumbnail */}
                        <div className="w-10 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded overflow-hidden flex-shrink-0 shadow-sm">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={bookTitle?.title || 'Book'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={14} className="text-gray-400 dark:text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-primary-600 dark:text-primary-400 text-sm truncate max-w-[200px]">
                            {bookTitle?.title || 'Deleted Book'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                            {t.book_asset?.asset_code || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-slate-300 text-sm">
                      {t.returned_at ? new Date(t.returned_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4">
                      {t.penalty_amount && parseFloat(t.penalty_amount) > 0 ? (
                        <span className="font-bold text-red-600 dark:text-red-400">₱{parseFloat(t.penalty_amount).toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getPaymentBadge(t)}
                        <div className="flex items-center gap-1 flex-wrap">
                          {t.penalty_amount && parseFloat(t.penalty_amount) > 0 && t.payment_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleMarkAsPaid(t.id)}
                                disabled={processingId === t.id}
                                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all duration-200 inline-flex items-center gap-1 font-bold shadow-sm hover:shadow"
                                title="Mark as Paid"
                              >
                                {processingId === t.id ? "..." : <><CheckCircle size={12} /> Pay</>}
                              </button>
                              <button
                                onClick={() => handleWaiveFine(t.id)}
                                disabled={processingId === t.id}
                                className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all duration-200 inline-flex items-center gap-1 font-bold shadow-sm hover:shadow"
                                title="Waive Fine"
                              >
                                {processingId === t.id ? "..." : "Waive"}
                              </button>
                            </>
                          )}
                          {t.penalty_amount && parseFloat(t.penalty_amount) > 0 && t.payment_status === 'paid' && (
                            <button
                              onClick={() => handleMarkAsUnpaid(t.id)}
                              disabled={processingId === t.id}
                              className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition-all duration-200 inline-flex items-center gap-1 font-bold shadow-sm hover:shadow opacity-50 hover:opacity-100"
                              title="Revert to Unpaid"
                            >
                              {processingId === t.id ? "..." : <><HistoryIcon size={12} /> Revert</>}
                            </button>
                          )}
                          {t.penalty_amount && parseFloat(t.penalty_amount) > 0 && t.payment_status === 'waived' && (
                            <>
                              <button
                                onClick={() => handleMarkAsUnpaid(t.id)}
                                disabled={processingId === t.id}
                                className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition-all duration-200 inline-flex items-center gap-1 font-bold shadow-sm hover:shadow opacity-50 hover:opacity-100"
                                title="Revert to Unpaid"
                              >
                                {processingId === t.id ? "..." : <><HistoryIcon size={12} /> Revert</>}
                              </button>
                              <button
                                onClick={() => handleMarkAsPaid(t.id)}
                                disabled={processingId === t.id}
                                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all duration-200 inline-flex items-center gap-1 font-bold shadow-sm hover:shadow ml-1"
                                title="Mark as Paid"
                              >
                                {processingId === t.id ? "..." : <><CheckCircle size={12} /> Pay</>}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <StatusBadge transaction={t} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Control */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div >
  );
}
