import React from 'react';

export type BadgeVariant = 
  | 'active' | 'available' | 'inactive' | 'disabled' | 'suspended' | 'maintenance' | 'occupied' | 'released'
  | 'primary' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: BadgeSize;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, size = 'sm', className = '' }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    active: 'bg-green-100 text-green-800',
    available: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    disabled: 'bg-gray-100 text-gray-800',
    suspended: 'bg-amber-100 text-amber-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    occupied: 'bg-blue-100 text-blue-800',
    released: 'bg-gray-100 text-gray-800',
    primary: 'bg-indigo-100 text-indigo-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    destructive: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    outline: 'border border-gray-200 text-gray-800 bg-white',
  };

  const dotStyles: Record<BadgeVariant, string> = {
    active: 'bg-green-500',
    available: 'bg-green-500',
    inactive: 'bg-gray-400',
    disabled: 'bg-gray-400',
    suspended: 'bg-amber-500',
    maintenance: 'bg-yellow-500',
    occupied: 'bg-blue-500',
    released: 'bg-gray-400',
    primary: 'bg-indigo-500',
    secondary: 'bg-gray-400',
    success: 'bg-green-500',
    destructive: 'bg-red-500',
    warning: 'bg-amber-500',
    outline: 'bg-gray-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
  
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      <span className={`${dotSize} rounded-full mr-1.5 ${dotStyles[variant]}`} aria-hidden="true" />
      {children}
    </span>
  );
};
