import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { DollarSign, CheckCircle } from "lucide-react";

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
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Paid</span>;
      case 'waived':
        return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Waived</span>;
      case 'pending':
      default:
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Unpaid</span>;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📜 Transaction Logs</h2>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
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
          <tbody className="divide-y divide-gray-200">
            {loading && <tr><td colSpan="8" className="p-4 text-center">Loading logs...</td></tr>}

            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-600">{new Date(t.borrowed_at).toLocaleDateString()}</td>
                <td className="p-4 font-bold text-gray-800">{t.user ? t.user.name : 'Unknown'}</td>
                <td className="p-4 text-blue-600">
                  {t.book_asset && t.book_asset.book_title ? t.book_asset.book_title.title : 'Deleted Book'}
                </td>
                <td className="p-4 font-mono text-xs text-gray-500">
                  {t.book_asset ? t.book_asset.asset_code : 'N/A'}
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
                  {getPaymentBadge(t)}
                  {t.penalty_amount && parseFloat(t.penalty_amount) > 0 && t.payment_status === 'pending' && (
                    <button
                      onClick={() => handleMarkAsPaid(t.id)}
                      disabled={processingId === t.id}
                      className="ml-2 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100 transition inline-flex items-center gap-1"
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
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.returned_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {t.returned_at ? 'Returned' : 'Active Loan'}
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