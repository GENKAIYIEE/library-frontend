import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import axiosClient from "../axios-client";

/**
 * CameraScanner Component
 * Uses device camera to scan QR codes and barcodes
 * 
 * Props:
 * - onResult: (result: object) => void - Called with API lookup result
 * - onClose: () => void - Called when scanner is closed
 */
export default function CameraScanner({ onResult, onClose }) {
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastScanned, setLastScanned] = useState(null);
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);

    useEffect(() => {
        // Initialize scanner on mount
        startScanner();

        // Cleanup on unmount
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const html5Qrcode = new Html5Qrcode("camera-scanner-region");
            html5QrcodeRef.current = html5Qrcode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            await html5Qrcode.start(
                { facingMode: "environment" }, // Prefer back camera
                config,
                onScanSuccess,
                onScanFailure
            );

            setIsScanning(true);
            setIsLoading(false);
        } catch (err) {
            console.error("Camera error:", err);

            // Show user-friendly error messages
            let errorMessage = "Failed to start camera.";
            const errString = err.toString().toLowerCase();

            if (errString.includes("notreadable") || errString.includes("device in use")) {
                errorMessage = "📷 Camera is being used by another app. Please close other apps using the camera (Zoom, Teams, etc.) and try again.";
            } else if (errString.includes("notallowed") || errString.includes("permission")) {
                errorMessage = "🔒 Camera permission denied. Please click the lock icon in the address bar and allow camera access.";
            } else if (errString.includes("notfound") || errString.includes("no camera")) {
                errorMessage = "❌ No camera found. Please connect a camera and try again.";
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setIsLoading(false);
        }
    };


    const stopScanner = async () => {
        if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
            try {
                await html5QrcodeRef.current.stop();
                await html5QrcodeRef.current.clear();
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
        setIsScanning(false);
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        // Avoid duplicate scans of the same code
        if (lastScanned === decodedText) return;
        setLastScanned(decodedText);

        // Vibrate on successful scan (if supported)
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Pause scanner while processing
        if (html5QrcodeRef.current) {
            await html5QrcodeRef.current.pause(true);
        }

        setIsLoading(true);

        try {
            // Look up the scanned barcode
            const response = await axiosClient.get(`/books/lookup/${encodeURIComponent(decodedText)}`);
            const data = response.data;

            if (onResult) {
                onResult(data);
            }

            // Close scanner on successful scan
            stopScanner();
            if (onClose) onClose();

        } catch (error) {
            const errorData = error.response?.data || { found: false, message: "Book not found" };

            if (onResult) {
                onResult(errorData);
            }

            // Resume scanning after a short delay for failed lookups
            setTimeout(async () => {
                setLastScanned(null);
                if (html5QrcodeRef.current) {
                    try {
                        await html5QrcodeRef.current.resume();
                    } catch (e) {
                        console.error("Resume error:", e);
                    }
                }
            }, 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const onScanFailure = (error) => {
        // Ignore scan failures (no code detected) - this is normal
    };

    const handleRetry = () => {
        setError(null);
        setLastScanned(null);
        startScanner();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
            {/* Header */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <div className="text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Camera size={24} />
                        Camera Scanner
                    </h3>
                    <p className="text-sm text-white/70">Point camera at QR code or barcode</p>
                </div>
                <button
                    onClick={() => {
                        stopScanner();
                        if (onClose) onClose();
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                >
                    <CameraOff className="text-white" size={24} />
                </button>
            </div>

            {/* Scanner Container */}
            <div className="relative">
                {/* Camera Feed */}
                <div
                    id="camera-scanner-region"
                    ref={scannerRef}
                    className="w-80 h-80 bg-black rounded-lg overflow-hidden"
                />

                {/* Scanning Frame Overlay */}
                {isScanning && !isLoading && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
                            {/* Corner markers */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                        </div>
                        {/* Scan line animation */}
                        <div className="absolute inset-x-4 top-4 h-0.5 bg-green-400 animate-pulse"
                            style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-center text-white">
                            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                            <p>Looking up book...</p>
                        </div>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg p-4">
                        <div className="text-center text-white">
                            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                            <p className="text-sm mb-4">{error}</p>
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition mx-auto"
                            >
                                <RotateCcw size={18} />
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Indicator */}
            <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-white mb-2">
                    <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span>{isScanning ? 'Camera Active' : 'Starting...'}</span>
                </div>
                <p className="text-white/60 text-sm">
                    Supports QR codes, Code128, EAN-13, and other barcode formats
                </p>
            </div>

            {/* Inline styles for scan animation */}
            <style>{`
                @keyframes scanLine {
                    0%, 100% { transform: translateY(0); opacity: 1; }
                    50% { transform: translateY(280px); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
