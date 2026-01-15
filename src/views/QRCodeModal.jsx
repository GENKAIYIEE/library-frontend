import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download } from 'lucide-react';

export default function QRCodeModal({ book, onClose }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:bg-white print:static">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 print:shadow-none print:max-w-full">

                {/* Header - Hidden in print */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 text-white rounded-t-xl print:hidden">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">📱 QR Code Label</h3>
                        <button onClick={onClose} className="text-white hover:text-purple-200">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* QR Code Content */}
                <div className="p-8 text-center">
                    {/* Printable Label Container */}
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg print:border-solid print:border-black">
                        <div className="mb-4">
                            <QRCodeSVG
                                value={book.asset_code || book.isbn || 'NO-CODE'}
                                size={180}
                                level="H"
                                className="mx-auto"
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="font-mono text-2xl font-bold text-gray-800">
                                {book.asset_code || 'N/A'}
                            </div>
                            <div className="text-lg font-bold text-gray-700 truncate max-w-xs mx-auto">
                                {book.title}
                            </div>
                            <div className="text-sm text-gray-500">
                                {book.author}
                            </div>
                            {book.isbn && (
                                <div className="text-xs text-gray-400 font-mono">
                                    ISBN: {book.isbn}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Print Instructions - Hidden in print */}
                    <p className="text-sm text-gray-500 mt-4 print:hidden">
                        Print this label and attach it to the book
                    </p>
                </div>

                {/* Footer Actions - Hidden in print */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex gap-3 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition font-bold flex items-center justify-center gap-2"
                    >
                        <Printer size={18} /> Print Label
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:bg-white,
          .print\\:bg-white * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}
