import { useEffect, useState } from "react";
import axiosClient from "../axios-client";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosClient.get("/transactions")
      .then(({ data }) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

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
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && <tr><td colSpan="6" className="p-4 text-center">Loading logs...</td></tr>}
            
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