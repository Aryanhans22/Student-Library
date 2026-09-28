import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) return <Inbox className="w-8 h-8" />;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="w-8 h-8" />;
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4 text-indigo-500">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
