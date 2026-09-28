import React, { SelectHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, options, placeholder, required, disabled, id, children, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`
              block w-full rounded-lg border shadow-sm transition-colors appearance-none
              focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm pl-3 pr-10 py-2
              ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
              ${hasError 
                ? 'border-red-300 text-red-900 focus:ring-red-500' 
                : 'border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'}
              ${className}
            `}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${selectId}-error` : helperText ? `${selectId}-description` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children ? children : options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            {hasError ? (
              <AlertCircle className="h-5 w-5 text-red-500 mr-4" aria-hidden="true" />
            ) : null}
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
            {error}
          </p>
        )}
        {helperText && !hasError && (
          <p className="mt-1 text-sm text-gray-500" id={`${selectId}-description`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
