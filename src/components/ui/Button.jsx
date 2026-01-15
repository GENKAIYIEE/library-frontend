import React from 'react';

export default function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    className = '',
    disabled = false,
    icon: Icon
}) {
    const baseStyles = "px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-200",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200",
        ghost: "text-slate-600 hover:bg-slate-50",
        outline: "border border-slate-300 text-slate-700 hover:bg-slate-50"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {Icon && <Icon size={18} />}
            {children}
        </button>
    );
}
