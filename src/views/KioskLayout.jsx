import { Library, Clock, LogIn, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // If available, or just use window.location

// Reusing Digital Clock logic simplified
function KioskClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    };

    return (
        <div className="flex items-center gap-2 text-primary-100 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
            <Clock size={16} />
            <span className="font-bold font-mono tracking-wide">{formatTime(time)}</span>
        </div>
    );
}

export default function KioskLayout({ children }) {
    // Simple navigation hack if not using router
    const goLogin = () => {
        window.location.href = '/login'; // Or reload if handled by App.jsx
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* KIOSK HEADER */}
            <header className="bg-primary-600 text-white shadow-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-xl shadow-lg">
                            <Library className="text-primary-600" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold leading-none tracking-tight">PCLU Library</h1>
                            <p className="text-primary-200 text-xs font-medium tracking-wider uppercase mt-1">Student Kiosk</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <KioskClock />
                        <a
                            href="/attendance"
                            className="hidden md:flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            <UserCheck size={16} /> Attendance
                        </a>
                        <a
                            href="/catalog"
                            className="hidden md:flex bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            Catalog
                        </a>
                        <a href="/" className="text-primary-200 hover:text-white text-xs font-bold flex gap-1 items-center opacity-50 hover:opacity-100 transition-opacity">
                            <LogIn size={14} /> Staff
                        </a>
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>

            {/* FOOTER */}
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-400 text-sm">
                <p>© 2026 PCLU Library Management System • Public Access Catalog</p>
            </footer>
        </div>
    );
}
