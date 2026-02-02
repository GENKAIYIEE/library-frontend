import { AnimatePresence, motion } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { Calendar, Camera, CreditCard, Loader2, ScanLine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axiosClient from "../axios-client";
import KioskLayout from "./KioskLayout";

export default function PublicAttendance() {
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const html5QrcodeRef = useRef(null);
    const isMounted = useRef(true);
    const lastScannedRef = useRef(null);

    // --- Logic Preserved from original file (Init Scanner, Audio, etc.) ---
    useEffect(() => {
        isMounted.current = true;
        let ignore = false;

        const initScanner = async () => {
            await new Promise(r => setTimeout(r, 100));
            if (!isMounted.current || ignore) return;
            const region = document.getElementById("attendance-scanner-region");
            if (region) region.innerHTML = "";
            const html5Qrcode = new Html5Qrcode("attendance-scanner-region");
            html5QrcodeRef.current = html5Qrcode;

            const config = { fps: 10, qrbox: { width: 250, height: 250 }, videoConstraints: { facingMode: "environment", aspectRatio: { ideal: 1.0 } } };

            try {
                if (!isMounted.current || ignore) return;
                await html5Qrcode.start({ facingMode: "environment" }, config, onScanSuccess, () => { });
                if (isMounted.current && !ignore) { setIsScanning(true); setIsLoading(false); }
            } catch (err) {
                try {
                    if (!isMounted.current || ignore) return;
                    await html5Qrcode.start({ facingMode: "user" }, config, onScanSuccess, () => { });
                    if (isMounted.current && !ignore) { setIsScanning(true); setIsLoading(false); }
                } catch (userErr) {
                    if (isMounted.current) { setError("Camera access failed."); setIsLoading(false); }
                }
            }
        };
        initScanner();
        return () => {
            isMounted.current = false;
            ignore = true;
            if (html5QrcodeRef.current) stopScannerInstance(html5QrcodeRef.current);
        };
    }, []);

    useEffect(() => {
        if (result) {
            const timer = setTimeout(() => resetScanner(), 4000); // Extended result view time for better UX
            return () => clearTimeout(timer);
        }
    }, [result]);

    const stopScannerInstance = async (instance) => {
        try { if (instance.isScanning) { await instance.stop(); } instance.clear(); } catch (e) {}
    };

    const startScanner = () => window.location.reload();

    // Enhanced CSS for Video Element
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            #attendance-scanner-region video { 
                object-fit: cover !important; 
                width: 100% !important; 
                height: 100% !important; 
                border-radius: 1.5rem;
                filter: contrast(1.2) brightness(1.1) saturate(1.2);
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const onScanSuccess = async (decodedText) => {
        if (!isMounted.current) return;
        if (lastScannedRef.current === decodedText) return;
        lastScannedRef.current = decodedText;
        if (navigator.vibrate) navigator.vibrate(200);
        if (html5QrcodeRef.current) try { await html5QrcodeRef.current.pause(true); } catch (e) { }
        setIsLoading(true);

        try {
            const response = await axiosClient.post('/public/attendance', { student_id: decodedText });
            if (isMounted.current) { setResult(response.data); playSound('success'); }
        } catch (err) {
            if (isMounted.current) {
                const errorData = err.response?.data || { success: false, message: "Failed to log attendance." };
                setResult(errorData); playSound(errorData.student ? 'warning' : 'error');
            }
        } finally { if (isMounted.current) setIsLoading(false); }
    };

    const playSound = (type) => {
        // ... (Audio logic same as original) ...
        // Re-implementing briefly for completeness in context of UI
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            
            if (type === 'success') {
                osc.frequency.setValueAtTime(523, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
            } else {
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
            }
        } catch(e) {}
    };

    const resetScanner = async () => {
        setResult(null); lastScannedRef.current = null;
        if (html5QrcodeRef.current) try { await html5QrcodeRef.current.resume(); } catch (err) { window.location.reload(); }
        else window.location.reload();
    };

    const getProfileImage = (student) => student?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'Student')}&background=00008B&color=fff&size=200&bold=true`;

    return (
        <KioskLayout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
                
                {/* Header Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 z-10">
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter mb-4 drop-shadow-lg">
                        CHECK IN
                    </h1>
                    <p className="text-slate-400 text-lg font-medium tracking-wide flex items-center justify-center gap-2">
                        <ScanLine className="text-blue-500 animate-pulse" size={20} />
                        ALIGN QR CODE WITHIN FRAME
                    </p>
                </motion.div>

                {/* --- FUTURE TECH SCANNER MODULE --- */}
                <div className="relative w-full max-w-lg aspect-square">
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-[-20px] rounded-[3rem] bg-gradient-to-br from-blue-600/30 to-purple-600/30 blur-2xl animate-pulse"></div>

                    {/* Main Scanner Container */}
                    <div className="relative w-full h-full bg-slate-900 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden isolate">
                        {/* Video Layer */}
                        <div id="attendance-scanner-region" className="w-full h-full bg-black"></div>

                        {/* HUD Overlay (No Result) */}
                        {!result && (
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {/* Corner Brackets */}
                                <div className="absolute top-8 left-8 w-16 h-16 border-t-[4px] border-l-[4px] border-white/80 rounded-tl-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                <div className="absolute top-8 right-8 w-16 h-16 border-t-[4px] border-r-[4px] border-white/80 rounded-tr-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                <div className="absolute bottom-8 left-8 w-16 h-16 border-b-[4px] border-l-[4px] border-white/80 rounded-bl-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                <div className="absolute bottom-8 right-8 w-16 h-16 border-b-[4px] border-r-[4px] border-white/80 rounded-br-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>

                                {/* Active Scan Line */}
                                {!isLoading && !error && (
                                    <motion.div 
                                        animate={{ top: ['10%', '90%', '10%'] }}
                                        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                                        className="absolute left-8 right-8 h-0.5 bg-blue-400 shadow-[0_0_30px_rgba(59,130,246,1)]"
                                    >
                                        <div className="absolute inset-0 bg-blue-400 blur-sm"></div>
                                    </motion.div>
                                )}

                                {/* Loading State */}
                                {isLoading && (
                                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Loader2 className="text-blue-500 w-8 h-8 animate-pulse" />
                                            </div>
                                        </div>
                                        <p className="mt-4 text-blue-400 font-mono text-xs tracking-[0.3em] uppercase animate-pulse">Processing Data</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- RESULT OVERLAY CARD (Sliding Up) --- */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 120 }}
                                    className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-xl flex flex-col"
                                >
                                    {/* Success Header Gradient */}
                                    <div className={`h-2 ${result.success ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-orange-500'} w-full`} />
                                    
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                        {result.success ? (
                                            <>
                                                <motion.div 
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 relative"
                                                >
                                                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
                                                    <img 
                                                        src={getProfileImage(result.student)} 
                                                        className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-2xl" 
                                                    />
                                                    <div className="absolute -bottom-2 bg-emerald-500 text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                                                        Confirmed
                                                    </div>
                                                </motion.div>

                                                <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{result.student?.name}</h2>
                                                <p className="text-slate-400 font-medium mb-6">{result.student?.student_id}</p>

                                                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                                        <Calendar className="text-blue-400 mb-2 w-5 h-5" />
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Date</span>
                                                        <span className="text-sm font-mono text-white">{new Date().toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                                        <CreditCard className="text-purple-400 mb-2 w-5 h-5" />
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Time</span>
                                                        <span className="text-sm font-mono text-white">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <motion.div 
                                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                    className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6"
                                                >
                                                    <X className="w-10 h-10 text-red-500" />
                                                </motion.div>
                                                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                                                <p className="text-slate-400 text-sm max-w-[200px] leading-relaxed mx-auto">{result.message}</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Auto-Close Progress Bar */}
                                    <div className="h-1.5 w-full bg-slate-800">
                                        <motion.div 
                                            initial={{ width: "100%" }} 
                                            animate={{ width: "0%" }} 
                                            transition={{ duration: 4, ease: "linear" }}
                                            className={`h-full ${result.success ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Manual Upload Button */}
                <div className="mt-8">
                    <input type="file" id="qr-file-input" accept="image/*" className="hidden" 
                        onChange={(e) => {
                            if (e.target.files.length === 0) return;
                            const html5Qm = new Html5Qrcode("attendance-scanner-region");
                            html5Qm.scanFile(e.target.files[0], false).then(onScanSuccess);
                        }} 
                    />
                    <button onClick={() => document.getElementById('qr-file-input').click()} 
                        className="group flex items-center gap-3 px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/20 backdrop-blur-md">
                        <Camera size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm tracking-wide">Manual Upload</span>
                    </button>
                </div>

            </div>
        </KioskLayout>
    );
}