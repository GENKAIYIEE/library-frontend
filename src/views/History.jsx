import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { DollarSign, CheckCircle, History as HistoryIcon, Search } from "lucide-react";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

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

  return (
    <div className="space-y-6 bg-gray-50 -m-8 p-8 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
            <HistoryIcon size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Transaction Logs</h2>
            <p className="text-gray-500">View borrowing and return history</p>
          </div>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow border border-gray-100">
          {transactions.length} total records
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b border-gray-100">
            <tr>
              <th className="p-4">Date Borrowed</th>
              <th className="p-4">Student</th>
              <th className="p-4">Book Title</th>
              <th className="p-4">Accession Code</th>
              <th className="p-4">Date Returned</th>
              <th className="p-4">Fine</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    Loading logs...
                  </div>
                </td>
              </tr>
            )}

            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan="8" className="p-12 text-center text-gray-500">
                  <HistoryIcon size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No transaction records found.</p>
                </td>
              </tr>
            )}

            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition">
                <td className="p-4 text-gray-600">{new Date(t.borrowed_at).toLocaleDateString()}</td>
                <td className="p-4 font-bold text-gray-800">{t.user ? t.user.name : 'Unknown'}</td>
                <td className="p-4 text-primary-600 font-medium">
                  {t.book_asset && t.book_asset.book_title ? t.book_asset.book_title.title : 'Deleted Book'}
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {t.book_asset ? t.book_asset.asset_code : 'N/A'}
                  </span>
                </td>
                <td className="p-4 text-gray-600">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
