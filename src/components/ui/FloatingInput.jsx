import React, { useState } from 'react';

export default function FloatingInput({
    label,
    type = 'text',
    value,
    onChange,
    required = false,
    className = '',
    error,
    icon: Icon,
    disabled = false,
    name,
    id
}) {
    const [isFocused, setIsFocused] = useState(false);
    const isFloating = isFocused || value;

    return (
        <div className={`relative ${className}`}>
            {/* Input Field */}
            <div className="relative">
                {Icon && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${error ? 'text-red-400' : isFocused ? 'text-primary-600' : 'text-gray-400'
                        }`}>
                        <Icon size={18} />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    required={required}
                    disabled={disabled}
                    name={name}
                    id={id || name}
                    placeholder=" "
                    className={`
                        peer w-full pr-4 py-4 pt-6 
                        ${Icon ? 'pl-12' : 'pl-4'}
                        bg-white border-2 rounded-xl
                        text-gray-900 font-semibold
                        outline-none transition-all duration-200
                        hover:bg-white
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error
                            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                            : 'border-gray-200 focus:border-primary-600 focus:ring-4 focus:ring-primary-100'
                        }
                    `}
                />

                {/* Floating Label */}
                <label
                    className={`
                        absolute transition-all duration-200 pointer-events-none truncate max-w-[calc(100%-3rem)]
                        ${Icon ? 'left-12' : 'left-4'}
                        ${isFloating
                            ? 'top-2 text-xs font-bold'
                            : 'top-1/2 -translate-y-1/2 text-sm font-medium'
                        }
                        ${error
                            ? 'text-red-500'
                            : isFloating
                                ? 'text-primary-600'
                                : 'text-gray-500'
                        }
                    `}
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}
        </div>
    );
}
