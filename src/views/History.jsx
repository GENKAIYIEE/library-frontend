import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { DollarSign, CheckCircle, History as HistoryIcon, Search, BookOpen, User } from "lucide-react";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Mark fine as paid
  const handleMarkAsPaid = (transactionId) => {
    setProcessingId(transactionId);
    axiosClient.post(`/transactions/${transactionId}/pay`)
      .then(() => {
        fetchTransactions(); // Refresh list
        setProcessingId(null);
      })
      .catch(() => {
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

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    const studentName = t.user?.name?.toLowerCase() || '';
    const bookTitle = t.book_asset?.book_title?.title?.toLowerCase() || '';
    const assetCode = t.book_asset?.asset_code?.toLowerCase() || '';

    return studentName.includes(searchLower) ||
      bookTitle.includes(searchLower) ||
      assetCode.includes(searchLower);
  });

  return (
    <div className="space-y-6 bg-gray-50 -m-8 p-8 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
            <HistoryIcon size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Transaction Logs</h2>
            <p className="text-gray-500">View borrowing and return history</p>
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
              className="pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm w-64 bg-white"
            />
          </div>

          <div className="text-sm text-gray-500 bg-white px-4 py-2.5 rounded-xl shadow border border-gray-100">
            {filteredTransactions.length} records
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b border-gray-100">
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
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      Loading logs...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500">
                    <HistoryIcon size={48} className="mx-auto mb-3 opacity-20" />
                    <p>{searchTerm ? `No records matching "${searchTerm}"` : 'No transaction records found.'}</p>
                  </td>
                </tr>
              )}

              {filteredTransactions.map((t) => {
                const bookTitle = t.book_asset?.book_title;
                const imagePath = bookTitle?.image_path || bookTitle?.cover_image;
                const imageUrl = getImageUrl(imagePath);

                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(t.borrowed_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{t.user ? t.user.name : 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{t.user?.student_id || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Book Thumbnail */}
                        <div className="w-10 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded overflow-hidden flex-shrink-0 shadow-sm">
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
                              <BookOpen size={14} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-primary-600 text-sm truncate max-w-[200px]">
                            {bookTitle?.title || 'Deleted Book'}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {t.book_asset?.asset_code || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {t.returned_at ? new Date(t.returned_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4">
                      {t.penalty_amount && parseFloat(t.penalty_amount) > 0 ? (
                        <span className="font-bold text-red-600">₱{parseFloat(t.penalty_amount).toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getPaymentBadge(t)}
                        {t.penalty_amount && parseFloat(t.penalty_amount) > 0 && t.payment_status === 'pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(t.id)}
                            disabled={processingId === t.id}
                            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all duration-200 inline-flex items-center gap-1 font-bold shadow-sm hover:shadow"
                          >
                            {processingId === t.id ? (
                              "..."
                            ) : (
                              <>
                                <CheckCircle size={12} /> Pay
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${t.returned_at ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                        {t.returned_at ? '✓ Returned' : '⏳ Active Loan'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
