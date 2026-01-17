import { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import axiosClient from "../axios-client";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.length;

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const fetchNotifications = () => {
        axiosClient.get('/notifications')
            .then(({ data }) => setNotifications(data))
            .catch(err => console.error("Failed to fetch notifications", err));
    };

    const markAsRead = (id, event) => {
        event.stopPropagation();
        axiosClient.post(`/notifications/${id}/read`)
            .then(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            })
            .catch(err => console.error(err));
    };

    const markAllAsRead = () => {
        axiosClient.post('/notifications/read-all')
            .then(() => {
                setNotifications([]);
                setIsOpen(false);
            })
            .catch(err => console.error(err));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-primary-600 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-left animate-scale-up">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No new notifications</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group relative">
                                    <div className="pr-8">
                                        <p className="text-sm text-gray-600 leading-snug">
                                            {n.data.message}
                                        </p>
                                        <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase tracking-wide">
                                            {n.data.days_overdue} Days Overdue
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => markAsRead(n.id, e)}
                                        className="absolute top-4 right-4 text-gray-300 hover:text-emerald-500 transition-colors p-1"
                                        title="Mark as read"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
