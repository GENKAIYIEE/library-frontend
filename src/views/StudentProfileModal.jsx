import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { X, BookOpen, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";

export default function StudentProfileModal({ student, onClose }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBorrowed: 0,
        currentLoans: 0,
        overdueCount: 0,
        totalFines: 0,
        pendingFines: 0
    });

    useEffect(() => {
        fetchStudentHistory();
    }, [student]);

    const fetchStudentHistory = () => {
        axiosClient.get(`/students/${student.id}/history`)
            .then(({ data }) => {
                setTransactions(data.transactions || []);
                setStats(data.stats || stats);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">{student.name}</h2>
                            <div className="text-blue-200 text-sm mt-1">
                                Student ID: {student.student_id}
                            </div>
                            {student.email && (
                                <div className="text-blue-200 text-sm">
                                    Email: {student.email}
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="text-white hover:text-blue-200 transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                        <BookOpen className="mx-auto text-blue-500 mb-1" size={20} />
                        <div className="text-xl font-bold text-gray-800">{stats.totalBorrowed}</div>
                        <div className="text-xs text-gray-500">Total Borrowed</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                        <CheckCircle className="mx-auto text-green-500 mb-1" size={20} />
                        <div className="text-xl font-bold text-gray-800">{stats.currentLoans}</div>
                        <div className="text-xs text-gray-500">Current Loans</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                        <AlertTriangle className="mx-auto text-red-500 mb-1" size={20} />
                        <div className="text-xl font-bold text-red-600">{stats.overdueCount}</div>
                        <div className="text-xs text-gray-500">Overdue</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                        <DollarSign className="mx-auto text-yellow-500 mb-1" size={20} />
                        <div className="text-xl font-bold text-yellow-600">₱{parseFloat(stats.pendingFines || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Pending Fines</div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="p-4 overflow-y-auto max-h-80">
                    <h3 className="font-bold text-gray-700 mb-3">📜 Borrowing History</h3>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No borrowing history yet</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">Book</th>
                                    <th className="p-2 text-center">Borrowed</th>
                                    <th className="p-2 text-center">Returned</th>
                                    <th className="p-2 text-center">Status</th>
                                    <th className="p-2 text-right">Fine</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="p-2">
                                            <div className="font-medium">{t.book_title}</div>
                                            <div className="text-xs text-gray-500">{t.asset_code}</div>
                                        </td>
                                        <td className="p-2 text-center text-xs">
                                            {new Date(t.borrowed_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-2 text-center text-xs">
                                            {t.returned_at ? new Date(t.returned_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-2 text-center">
                                            {!t.returned_at ? (
                                                t.is_overdue ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">Overdue</span>
                                                ) : (
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Active</span>
                                                )
                                            ) : (
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Returned</span>
                                            )}
                                        </td>
                                        <td className="p-2 text-right">
                                            {t.penalty_amount > 0 ? (
                                                <span className={`font-bold ${t.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                                    ₱{parseFloat(t.penalty_amount).toFixed(2)}
                                                    {t.payment_status === 'paid' && <span className="text-xs ml-1">✓</span>}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
