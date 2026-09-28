import React from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  name?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
  children?: React.ReactNode;
}

export const AvatarFallback: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`w-full h-full flex items-center justify-center font-semibold ${className}`}>{children}</div>;
};

export const AvatarImage: React.FC<{ src?: string; alt?: string; className?: string }> = ({ src, alt = '', className = '' }) => {
  if (!src) return null;
  return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} />;
};

export const Avatar: React.FC<AvatarProps> = ({ src, name = '', fallback, size = 'md', className = '', children }) => {
  const getInitials = (text: string) => {
    if (!text) return 'U';
    return text
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const baseClasses = `relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${sizes[size]} ${className}`;

  if (children) {
    return (
      <div className={`${baseClasses} bg-indigo-100 text-indigo-600 font-semibold`}>
        {children}
      </div>
    );
  }

  if (src) {
    return (
      <div className={baseClasses}>
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      </div>
    );
  }

  const displayText = fallback || (name ? getInitials(name) : 'U');

  return (
    <div className={`${baseClasses} bg-indigo-100 text-indigo-600 font-semibold`} aria-label={name || 'Avatar'}>
      {displayText}
    </div>
  );
};
