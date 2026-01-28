import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import KioskLayout from "./KioskLayout";
import axiosClient from "../axios-client";
import { Camera, CheckCircle, XCircle, Loader2, UserCheck, RotateCcw, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Glass Card Helper ---
const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden ${className}`}>
        {children}
    </div>
);

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

    // Auto-reset after scan
    useEffect(() => {
        if (result) {
            const timer = setTimeout(() => {
                resetScanner();
            }, 3000); // 3 seconds delay
            return () => clearTimeout(timer);
        }
    }, [result]);

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
        if (lastScannedRef.current === decodedText) return; // Prevent duplicate
        lastScannedRef.current = decodedText;

        if (navigator.vibrate) navigator.vibrate(200);

        if (html5QrcodeRef.current) {
            try { await html5QrcodeRef.current.pause(true); } catch (e) { }
        }

        setIsLoading(true);

        try {
            const response = await axiosClient.post('/public/attendance', { student_id: decodedText });
            if (isMounted.current) {
                setResult(response.data);
                playSound('success');
            }
        } catch (err) {
            console.error("Attendance error:", err);
            if (isMounted.current) {
                const errorData = err.response?.data || { success: false, message: "Failed to log attendance." };
                setResult(errorData);
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
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            } else if (type === 'warning') {
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
            } else {
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }
        } catch (e) { }
    };

    const resetScanner = async () => {
        setResult(null);
        lastScannedRef.current = null;
        if (html5QrcodeRef.current) {
            try { await html5QrcodeRef.current.resume(); return; } catch { }
        }
        await stopScanner();
        startScanner();
    };

    const getProfileImage = (student) => {
        if (student?.profile_picture_url) return student.profile_picture_url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'Student')}&background=00008B&color=fff&size=200&bold=true`;
    };

    return (
        <KioskLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6 border border-white/10 backdrop-blur-md">
                        <ScanLine className="text-blue-400" size={48} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Attendance Log</h1>
                    <p className="text-blue-200 text-lg max-w-lg mx-auto leading-relaxed">
                        Present your Library ID Code to the scanner below to check in.
                    </p>
                </motion.div>

                {/* Scanner / Result Area */}
                <GlassCard className="max-w-md w-full mx-auto relative group">
                    {/* Decorative Glow */}
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    <div className="relative p-1">
                        {/* Scanner Layer */}
                        <div className={`p-6 rounded-[1.8rem] bg-black/40 ${result ? 'invisible' : ''}`}>
                            <div className="relative rounded-2xl overflow-hidden bg-black mb-6 shadow-inner ring-1 ring-white/10">
                                <div id="attendance-scanner-region" className="w-full aspect-square bg-black opacity-90" />

                                {/* Scanner Overlays */}
                                {!result && (
                                    <>
                                        {isLoading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                                                <div className="text-white text-center">
                                                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2 text-blue-500" />
                                                    <p className="font-bold text-sm tracking-widest uppercase">Processing...</p>
                                                </div>
                                            </div>
                                        )}
                                        {error && (
                                            <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-6 z-20 text-center">
                                                <div>
                                                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                                    <p className="text-white mb-6 font-medium">{error}</p>
                                                    <button onClick={() => { setError(null); startScanner(); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors">
                                                        Retry
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {isScanning && !isLoading && !error && (
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute inset-0 border-[3px] border-blue-500/50 rounded-2xl m-8" />
                                                <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-ping" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-3 text-slate-400 text-sm font-medium">
                                <Camera size={18} />
                                <span>Align QR code within frame</span>
                            </div>
                        </div>

                        {/* Result Overlay */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 rounded-[1.8rem]"
                                >
                                    {result.success ? (
                                        <div className="text-center w-full">
                                            <motion.div
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
                                            >
                                                <CheckCircle className="text-green-400" size={48} />
                                            </motion.div>

                                            <img src={getProfileImage(result.student)} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-green-500/30 shadow-2xl" />

                                            <h2 className="text-2xl font-bold text-white mb-1">{result.student?.name}</h2>
                                            <div className="inline-block bg-white/10 px-3 py-1 rounded-full mb-6">
                                                <p className="text-slate-300 font-mono text-xs tracking-widest">{result.student?.student_id}</p>
                                            </div>

                                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-3">
                                                <p className="text-green-400 font-bold text-sm tracking-wide uppercase">✓ Logged at {result.logged_at}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center w-full">
                                            <XCircle className="text-amber-500 mx-auto mb-6" size={64} />
                                            <h2 className="text-xl font-bold text-white mb-2">{result.message}</h2>
                                            {result.student && (
                                                <div className="bg-white/5 rounded-xl p-4 mt-4">
                                                    <p className="text-slate-300 font-medium">{result.student.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-auto w-full pt-8">
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 3, ease: "linear" }}
                                                className="h-full bg-blue-500"
                                            />
                                        </div>
                                        <p className="text-center text-slate-500 text-xs mt-3 font-mono">Auto-resetting...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </GlassCard>

                {/* Footer Actions */}
                <div className="mt-12">
                    <div className="relative group">
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
                                    .then(decodedText => onScanSuccess(decodedText))
                                    .catch(err => {
                                        console.error("File scan error", err);
                                        setError("Could not read QR. Try a clearer photo.");
                                        playSound('error');
                                    });
                            }}
                        />
                        <button
                            onClick={() => document.getElementById('qr-file-input').click()}
                            className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 px-6 py-3 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                        >
                            <Camera size={16} /> Scan from Image
                        </button>
                    </div>
                </div>
            </div>
        </KioskLayout>
    );
}
