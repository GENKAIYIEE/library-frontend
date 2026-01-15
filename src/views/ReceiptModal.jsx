import { X, Printer } from 'lucide-react';

export default function ReceiptModal({ type, data, onClose }) {
    const handlePrint = () => {
        window.print();
    };

    const currentDate = new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">

                {/* Header - Hidden in print */}
                <div className="bg-gradient-to-r from-green-600 to-green-800 p-4 text-white rounded-t-xl print:hidden">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">🧾 Transaction Receipt</h3>
                        <button onClick={onClose} className="text-white hover:text-green-200">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="p-6" id="receipt-content">
                    {/* Receipt Header */}
                    <div className="text-center border-b-2 border-dashed pb-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">📚 PCLU LIBRARY</h2>
                        <p className="text-sm text-gray-500">Library Management System</p>
                        <p className="text-xs text-gray-400 mt-2">{currentDate}</p>
                    </div>

                    {/* Transaction Type */}
                    <div className="text-center mb-4">
                        <span className={`px-4 py-2 rounded-full text-lg font-bold ${type === 'borrow'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                            {type === 'borrow' ? '📖 BOOK BORROWED' : '↩️ BOOK RETURNED'}
                        </span>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-3 border-b-2 border-dashed pb-4 mb-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Student:</span>
                            <span className="font-bold text-gray-800">{data.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Student ID:</span>
                            <span className="font-mono text-gray-800">{data.studentId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Book Title:</span>
                            <span className="font-bold text-gray-800 text-right max-w-48 truncate">{data.bookTitle}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Barcode:</span>
                            <span className="font-mono text-gray-800">{data.assetCode}</span>
                        </div>

                        {type === 'borrow' && data.dueDate && (
                            <div className="flex justify-between bg-yellow-50 p-2 rounded -mx-2">
                                <span className="text-yellow-700 font-bold">📅 Due Date:</span>
                                <span className="font-bold text-yellow-700">
                                    {new Date(data.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}

                        {type === 'return' && data.penalty > 0 && (
                            <div className="flex justify-between bg-red-50 p-2 rounded -mx-2">
                                <span className="text-red-700 font-bold">⚠️ Late Fee:</span>
                                <span className="font-bold text-red-700">₱{data.penalty.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-400">
                        <p>Thank you for using PCLU Library!</p>
                        <p>Please return books on or before the due date.</p>
                        <p className="mt-2">Late fee: ₱5.00 per day</p>
                    </div>
                </div>

                {/* Footer Actions - Hidden in print */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex gap-3 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition font-bold flex items-center justify-center gap-2"
                    >
                        <Printer size={18} /> Print Receipt
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
