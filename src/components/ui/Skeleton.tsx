import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
}) => {
  const roundedClass = `rounded-${rounded}`;
  const style = { width, height };

  return (
    <div
      className={`animate-pulse bg-gray-200 ${roundedClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height="1rem" 
          width={i === lines - 1 ? '70%' : '100%'} 
          rounded="md" 
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-xl shadow-sm ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton width="3rem" height="3rem" rounded="full" />
        <div className="space-y-2 flex-1">
          <Skeleton height="1.25rem" width="40%" />
          <Skeleton height="0.875rem" width="30%" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
        <Skeleton height="2rem" width="5rem" rounded="lg" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = ''
}) => {
  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      <div className="bg-gray-50 flex p-4 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 pr-4">
            <Skeleton height="1.25rem" width="60%" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rIndex) => (
        <div key={rIndex} className="flex p-4 border-b border-gray-100 last:border-0">
          {Array.from({ length: cols }).map((_, cIndex) => (
            <div key={cIndex} className="flex-1 pr-4 flex items-center">
              <Skeleton height="1rem" width={cIndex === 0 ? '80%' : '50%'} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
