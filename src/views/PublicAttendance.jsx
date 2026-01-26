import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import KioskLayout from "./KioskLayout";
import axiosClient from "../axios-client";
import { Camera, CheckCircle, XCircle, Loader2, UserCheck, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicAttendance() {
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null); // { success, message, student, logged_at }
    const [error, setError] = useState(null);
    const html5QrcodeRef = useRef(null);
    const isMounted = useRef(true);
    const lastScannedRef = useRef(null);

    useEffect(() => {
        isMounted.current = true;
        startScanner();

        return () => {
            isMounted.current = false;
            stopScanner();
        };
    }, []);

    // Auto-reset removed as per user request
    // useEffect(() => {
    //     if (result) {
    //         const timer = setTimeout(() => {
    //             resetScanner();
    //         }, 5000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [result]);

    const startScanner = async () => {
        if (!isMounted.current) return;
        setError(null);
        setIsLoading(true);

        try {
            // Request camera permission
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (permErr) {
                if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
                    throw new Error("Camera permission denied. Please allow camera access.");
                }
            }

            if (html5QrcodeRef.current) {
                await stopScanner();
            }

            const html5Qrcode = new Html5Qrcode("attendance-scanner-region");
            html5QrcodeRef.current = html5Qrcode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
            };

            try {
                await html5Qrcode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    () => { }
                );
            } catch {
                await html5Qrcode.start(
                    { facingMode: "user" },
                    config,
                    onScanSuccess,
                    () => { }
                );
            }

            if (isMounted.current) {
                setIsScanning(true);
                setIsLoading(false);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err.message || "Failed to start camera.");
                setIsLoading(false);
            }
        }
    };

    const stopScanner = async () => {
        try {
            if (html5QrcodeRef.current) {
                try {
                    if (html5QrcodeRef.current.getState() >= 2) {
                        await html5QrcodeRef.current.stop();
                    }
                } catch { }
                try {
                    await html5QrcodeRef.current.clear();
                } catch { }
                html5QrcodeRef.current = null;
            }
        } catch { }
        setIsScanning(false);
    };

    const onScanSuccess = async (decodedText) => {
        if (!isMounted.current) return;

        // Prevent duplicate scans
        if (lastScannedRef.current === decodedText) return;
        lastScannedRef.current = decodedText;

        // Vibrate
        if (navigator.vibrate) navigator.vibrate(200);

        // Pause scanner
        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.pause(true);
            } catch (e) {
                console.debug("Scanner pause:", e.message);
            }
        }

        setIsLoading(true);

        try {
            const response = await axiosClient.post('/public/attendance', {
                student_id: decodedText
            });

            if (isMounted.current) {
                setResult(response.data);
                // Play success sound
                playSound('success');
            }
        } catch (err) {
            console.error("Attendance error:", err);
            if (isMounted.current) {
                const errorData = err.response?.data || { success: false, message: "Failed to log attendance." };
                setResult(errorData);
                // Play error/warning sound
                playSound(errorData.student ? 'warning' : 'error');
            }
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    // Simple sound feedback using Web Audio API
    const playSound = (type) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (type === 'success') {
                // Pleasant ascending tone
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            } else if (type === 'warning') {
                // Two quick beeps for "already logged"
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
            } else {
                // Low tone for error
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }
        } catch (e) {
            console.debug("Audio not available:", e.message);
        }
    };

    const resetScanner = async () => {
        setResult(null);
        lastScannedRef.current = null;

        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.resume();
                return;
            } catch { }
        }

        // If resume fails, restart scanner
        await stopScanner();
        startScanner();
    };

    const getProfileImage = (student) => {
        if (student?.profile_picture_url) return student.profile_picture_url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'Student')}&background=00008B&color=fff&size=200&bold=true`;
    };

    return (
        <KioskLayout>
            <div className="max-w-2xl mx-auto text-center py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl mb-4">
                        <UserCheck className="text-white" size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 mb-2">Library Attendance</h1>
                    <p className="text-slate-500 text-lg">Scan your Library ID QR code to log your attendance</p>
                </motion.div>

                {/* Scanner / Result Area */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`bg-white rounded-3xl shadow-2xl p-8 border-4 ${result.success ? 'border-green-400' : 'border-amber-400'}`}
                            >
                                {result.success ? (
                                    <div className="text-center">
                                        <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                                        <img
                                            src={getProfileImage(result.student)}
                                            alt={result.student?.name}
                                            className="w-24 h-24 rounded-2xl mx-auto mb-4 object-cover border-4 border-green-200 shadow-lg"
                                        />
                                        <h2 className="text-2xl font-bold text-slate-800 mb-1">{result.student?.name}</h2>
                                        <p className="text-slate-500 font-mono text-sm mb-2">{result.student?.student_id}</p>
                                        <p className="text-blue-600 font-semibold">{result.student?.course} - Year {result.student?.year_level}</p>
                                        <div className="mt-4 bg-green-50 rounded-xl px-6 py-3 inline-block">
                                            <p className="text-green-700 font-bold">✓ Logged at {result.logged_at}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <XCircle className="text-amber-500 mx-auto mb-4" size={64} />
                                        <h2 className="text-xl font-bold text-slate-800 mb-2">{result.message}</h2>
                                        {result.student && (
                                            <>
                                                <img
                                                    src={getProfileImage(result.student)}
                                                    alt={result.student.name}
                                                    className="w-20 h-20 rounded-xl mx-auto mb-2 object-cover"
                                                />
                                                <p className="text-slate-600">{result.student.name}</p>
                                            </>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={resetScanner}
                                    className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <RotateCcw size={20} /> Scan Next
                                </button>
                                {/* <p className="text-slate-400 text-sm mt-3">Auto-resetting in 5 seconds...</p> */}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="scanner"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-white rounded-3xl shadow-2xl p-6 border border-slate-200"
                            >
                                {/* Camera Feed */}
                                <div className="relative rounded-2xl overflow-hidden bg-black mb-4">
                                    <div
                                        id="attendance-scanner-region"
                                        className="w-full aspect-square max-w-md mx-auto"
                                    />

                                    {/* Loading Overlay */}
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <div className="text-white text-center">
                                                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                                                <p>Processing...</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Overlay */}
                                    {error && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                                            <div className="text-white text-center">
                                                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                                <p className="mb-4">{error}</p>
                                                <button
                                                    onClick={() => { setError(null); startScanner(); }}
                                                    className="px-6 py-2 bg-blue-500 rounded-lg font-bold"
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Scanning Indicator */}
                                    {isScanning && !isLoading && !error && (
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                            Camera Active
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center gap-2 text-slate-500">
                                    <Camera size={20} />
                                    <span>Position your QR code within the frame</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    {/* File Upload Scanner */}
                    <div className="relative">
                        <input
                            type="file"
                            id="qr-file-input"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files.length === 0) return;
                                const file = e.target.files[0];

                                const html5Qm = new Html5Qrcode("attendance-scanner-region");
                                html5Qm.scanFile(file, false)
                                    .then(decodedText => {
                                        onScanSuccess(decodedText);
                                    })
                                    .catch(err => {
                                        console.error("File scan error", err);
                                        setError("Could not read QR code from image. Try a clearer photo.");
                                        playSound('error');
                                    });
                            }}
                        />
                        <button
                            onClick={() => document.getElementById('qr-file-input').click()}
                            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100"
                        >
                            <Camera size={16} /> Scan from Image File
                        </button>
                    </div>

                    <a
                        href="/catalog"
                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                    >
                        ← Back to Book Catalog
                    </a>
                </div>
            </div>
        </KioskLayout>
    );
}
