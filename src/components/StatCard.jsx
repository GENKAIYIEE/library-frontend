import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, description }) {
    const colorStyles = {
        primary: 'bg-primary-50 text-primary-600 border-primary-100',
        blue: 'bg-primary-50 text-primary-600 border-primary-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        orange: 'bg-amber-50 text-amber-600 border-amber-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                <h4 className="text-4xl font-bold text-gray-800 mt-2">{value}</h4>
                {description && <div className="text-sm text-gray-400 mt-1">{description}</div>}
                {trend && <div className="text-xs text-emerald-600 font-medium mt-1">{trend}</div>}
            </div>
            <div className={`p-4 rounded-xl border ${colorStyles[color] || colorStyles.primary}`}>
                {Icon && <Icon size={28} strokeWidth={1.5} />}
            </div>
        </div>
    );
}

