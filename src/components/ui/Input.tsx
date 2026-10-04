import React, { InputHTMLAttributes, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, icon, required, disabled, id, type, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const isPasswordField = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    const effectiveType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            disabled={disabled}
            className={`
              block w-full rounded-lg border shadow-sm transition-colors
              focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm
              ${icon ? 'pl-10' : 'pl-3'} ${isPasswordField || hasError ? 'pr-10' : 'pr-3'} py-2
              ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
              ${hasError 
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500' 
                : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'}
              ${className}
            `}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-description` : undefined}
            {...props}
          />
          {isPasswordField ? (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          ) : hasError ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
          ) : null}
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
            {error}
          </p>
        )}
        {helperText && !hasError && (
          <p className="mt-1 text-sm text-gray-500" id={`${inputId}-description`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
