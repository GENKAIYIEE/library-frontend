import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, description }) {
    const colorStyles = {
        primary: 'bg-primary-50 text-primary-600',
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        green: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between transition hover:shadow-md">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <h4 className="text-3xl font-bold text-slate-800 mt-2">{value}</h4>
                {description && <div className="text-sm text-slate-400 mt-1">{description}</div>}
                {trend && <div className="text-xs text-emerald-600 font-medium mt-1">{trend}</div>}
            </div>
            <div className={`p-4 rounded-xl ${colorStyles[color] || colorStyles.primary}`}>
                {Icon && <Icon size={28} strokeWidth={1.5} />}
            </div>
        </div>
    );
}
