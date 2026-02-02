import { AnimatePresence, motion } from "framer-motion";
import { Globe, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLibrarySettings } from "../context/LibrarySettingsContext";

// --- Advanced Kiosk Clock ---
function KioskClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col items-end leading-none">
            <span className="font-bold font-mono text-xl tracking-tight text-white drop-shadow-md">{formatTime(time)}</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{formatDate(time)}</span>
        </div>
    );
}

// --- Cinematic Background ---
const KioskBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#020617] overflow-hidden">
        {/* Deep Atmospheric Glows */}
        <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[80vw] h-[80vw] bg-indigo-900/30 rounded-full blur-[150px]"
        />
        <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] bg-blue-900/20 rounded-full blur-[180px]"
        />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-violet-900/20 rounded-full blur-[120px]" />

        {/* Subtle Noise Texture for Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>

        {/* Technological Grid Floor */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
    </div>
);

// --- Refined Librarian Avatar (Preserved functionality, improved UI) ---
const LibrarianAvatar = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeak = () => {
        const audio = new Audio('/shush.mp3');
        setIsSpeaking(true);
        audio.play().catch(e => console.error("Audio play failed:", e));
        audio.onended = () => setIsSpeaking(false);
    };

    return (
        <div className="fixed bottom-0 right-0 z-[60] pointer-events-none select-none">
            <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 80, damping: 15 }}
                className="relative w-72 h-72 md:w-96 md:h-96 mr-[-2rem] mb-[-3rem]"
            >
                <motion.div
                    animate={isSpeaking ? { y: [0, -5, 0], scale: [1, 1.02, 1] } : { y: [0, -8, 0] }}
                    transition={isSpeaking ? { duration: 0.3, repeat: Infinity } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full h-full relative"
                >
                    <AnimatePresence>
                        {isSpeaking && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute top-10 left-10 transform -translate-x-full bg-white/95 backdrop-blur-xl text-slate-900 px-6 py-4 rounded-2xl rounded-br-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/50 z-50 min-w-[160px] text-center pointer-events-auto"
                            >
                                <p className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">SHHHHHH!</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quiet Zone Enforced</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <img
                        src="/librarian-avatar.png"
                        alt="Librarian"
                        onClick={handleSpeak}
                        className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:brightness-110 transition-all duration-300 cursor-pointer pointer-events-auto active:scale-95"
                    />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default function KioskLayout({ children, disableBackground = false }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const currentPath = window.location.pathname;
    const { libraryName } = useLibrarySettings();

    // Mock User - Preserved
    const user = {
        name: "Student Guest",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        role: "Student"
    };

    return (
        <div className="min-h-screen font-sans flex flex-col relative overflow-x-hidden text-slate-200 selection:bg-indigo-500/30">
            {!disableBackground && <KioskBackground />}
            <LibrarianAvatar />

            {/* --- CINEMATIC NAVBAR --- */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-6 md:px-8 pointer-events-none">
                <motion.div
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="max-w-7xl mx-auto flex items-center justify-between"
                >
                    {/* Brand Pill */}
                    {/* Brand Pill - Click to Exit */}
                    <a
                        href="/"
                        title="Exit Kiosk Mode"
                        className="pointer-events-auto bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-full pl-3 pr-6 py-2 flex items-center gap-4 shadow-2xl shadow-black/20 group hover:border-white/20 hover:bg-white/5 transition-all duration-300 cursor-pointer"
                    >
                        <div className="relative group-hover:scale-110 transition-transform duration-300">
                            {/* Subtle glowing aura behind logo on hover */}
                            <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <img src="/pclu-logo.png" alt="Logo" className="w-9 h-9 object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-white tracking-wide leading-tight group-hover:text-blue-200 transition-colors">{libraryName}</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest group-hover:text-emerald-300">Kiosk Active</span>
                            </div>
                        </div>
                    </a>

                    {/* Navigation Dock */}
                    <nav className="pointer-events-auto hidden md:flex items-center gap-2 bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-2xl shadow-black/20">
                        {[
                            { name: 'Catalog', path: '/catalog', icon: Sparkles },
                            { name: 'Attendance', path: '/attendance', icon: Globe }
                        ].map((item) => {
                            const isActive = currentPath === item.path;
                            return (
                                <a
                                    key={item.path}
                                    href={item.path}
                                    className={`relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="navPill"
                                            className="absolute inset-0 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <item.icon size={16} /> {item.name}
                                    </span>
                                </a>
                            );
                        })}
                    </nav>

                    {/* Status Pill */}
                    <div className="pointer-events-auto bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-2 flex items-center gap-6 shadow-2xl shadow-black/20">
                        <KioskClock />
                        <div className="h-8 w-px bg-white/10 mx-1"></div>
                        <div className="flex items-center gap-3">
                            <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/10 bg-slate-800" />
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="pointer-events-auto md:hidden bg-slate-950/60 backdrop-blur-md p-3 rounded-full text-white border border-white/10" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </motion.div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-28 relative z-10">
                {children}
            </main>

            {/* MINIMALIST FOOTER */}
            <footer className="relative z-10 border-t border-white/5 bg-slate-950/50 backdrop-blur-md py-4">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <p>© 2026 {libraryName}</p>
                    <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        System Operational
                    </p>
                </div>
            </footer>
        </div>
    );
}