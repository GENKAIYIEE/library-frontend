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
        let ignore = false;

        const initScanner = async () => {
            // Wait for any pending cleanup or layout stability
            await new Promise(r => setTimeout(r, 100));

            if (!isMounted.current || ignore) return;

            // 1. CLEANUP START: Force clear any existing DOM elements
            const region = document.getElementById("attendance-scanner-region");
            if (region) region.innerHTML = "";

            // 2. CREATE INSTANCE
            const html5Qrcode = new Html5Qrcode("attendance-scanner-region");
            html5QrcodeRef.current = html5Qrcode;

            const config = {
                fps: 10,
                qrbox: { width: 220, height: 220 },
                // Allow library to determine best aspect ratio for camera, we crop with CSS
                videoConstraints: {
                    facingMode: "environment",
                    aspectRatio: { ideal: 1.0 }
                }
            };

            // 3. START SCANNING
            try {
                if (!isMounted.current || ignore) return;

                await html5Qrcode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    () => { }
                );

                if (isMounted.current && !ignore) {
                    setIsScanning(true);
                    setIsLoading(false);
                } else {
                    // Start finished but we unmounted/ignored
                    await stopScannerInstance(html5Qrcode);
                }
            } catch (err) {
                console.error("Environment camera failed, trying user camera:", err);
                try {
                    if (!isMounted.current || ignore) return;
                    await html5Qrcode.start(
                        { facingMode: "user" },
                        config,
                        onScanSuccess,
                        () => { }
                    );
                    if (isMounted.current && !ignore) {
                        setIsScanning(true);
                        setIsLoading(false);
                    } else {
                        await stopScannerInstance(html5Qrcode);
                    }
                } catch (userErr) {
                    console.error("All cameras failed:", userErr);
                    if (isMounted.current) {
                        setError("Camera access failed. Please ensure permission is granted.");
                        setIsLoading(false);
                    }
                }
            }
        };

        initScanner();

        return () => {
            isMounted.current = false;
            ignore = true;
            // Immediate cleanup on unmount
            if (html5QrcodeRef.current) {
                stopScannerInstance(html5QrcodeRef.current);
            }
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

    // Helper to stop a specific instance
    const stopScannerInstance = async (instance) => {
        try {
            if (instance.isScanning) {
                await instance.stop();
            }
            instance.clear();
        } catch (e) { console.debug("Stop error:", e); }
    };

    // Kept for manual retry button
    const startScanner = () => {
        window.location.reload(); // Simplest way to full reset if manual retry needed
    };

    // Inject custom styles for the video element to force it to fill the container
    // Inject custom styles for the video element and custom animations
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            #attendance-scanner-region video { 
                object-fit: cover !important; 
                width: 100% !important; 
                height: 100% !important; 
                border-radius: 1.5rem !important;
                filter: contrast(1.1) brightness(1.1);
            }
            @keyframes scanner-line {
                0% { top: 10%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 90%; opacity: 0; }
            }
            .animate-scanner-line {
                animation: scanner-line 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            @keyframes pulse-border {
                0%, 100% { opacity: 0.6; box-shadow: 0 0 10px rgba(59,130,246,0.3); }
                50% { opacity: 1; box-shadow: 0 0 20px rgba(59,130,246,0.6); }
            }
            .animate-pulse-border {
                animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

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
            try {
                await html5QrcodeRef.current.resume();
            } catch (err) {
                console.warn("Scanner resume failed, refreshing...", err);
                window.location.reload();
            }
        } else {
            window.location.reload();
        }
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
                        <div className={`p-0 rounded-[2rem] overflow-hidden bg-black relative ${result ? 'invisible' : ''} shadow-2xl border-4 border-slate-800`}>
                            <div id="attendance-scanner-region" className="w-full aspect-square bg-black" />

                            {/* Professional Viewfinder Overlay */}
                            {!result && (
                                <div className="absolute inset-0 pointer-events-none z-10 p-6">
                                    {/* Corner Brackets */}
                                    <div className="absolute top-6 left-6 w-16 h-16 border-t-[6px] border-l-[6px] border-blue-500 rounded-tl-2xl animate-pulse-border" />
                                    <div className="absolute top-6 right-6 w-16 h-16 border-t-[6px] border-r-[6px] border-blue-500 rounded-tr-2xl animate-pulse-border" style={{ animationDelay: '0.1s' }} />
                                    <div className="absolute bottom-6 left-6 w-16 h-16 border-b-[6px] border-l-[6px] border-blue-500 rounded-bl-2xl animate-pulse-border" style={{ animationDelay: '0.2s' }} />
                                    <div className="absolute bottom-6 right-6 w-16 h-16 border-b-[6px] border-r-[6px] border-blue-500 rounded-br-2xl animate-pulse-border" style={{ animationDelay: '0.3s' }} />

                                    {/* Scanning Laser */}
                                    {isScanning && !isLoading && !error && (
                                        <div className="absolute left-6 right-6 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-scanner-line" />
                                    )}

                                    {/* Status Badges */}
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm rounded-[1.5rem]">
                                            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-3" />
                                            <p className="text-blue-400 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Initializing Sensor</p>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur rounded-[1.5rem]">
                                            <XCircle className="w-16 h-16 text-red-500 mb-4 opacity-80" />
                                            <p className="text-white text-lg font-bold mb-2">Camera Offline</p>
                                            <p className="text-slate-400 text-sm mb-6 max-w-[200px]">{error}</p>
                                            <button
                                                onClick={() => { setError(null); startScanner(); }}
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/50"
                                            >
                                                Reconnect InfoLink
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
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
