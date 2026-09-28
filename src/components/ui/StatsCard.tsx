import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './Card';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'indigo',
  className = '',
}) => {
  // We use a mapping or general classes since dynamic tailwind classes like `text-${color}-600` might not be purged correctly if not safelisted.
  // Using custom style for dynamic colored background to avoid safelisting issues in standard tailwind.
  const colorMap: Record<string, { bg: string, text: string }> = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };

  const style = colorMap[color] || colorMap.indigo;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
            
            {trend && (
              <div className="flex items-center mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${style.bg} ${style.text}`}>
            {React.isValidElement(Icon) ? Icon : typeof Icon === 'function' ? <Icon className="w-6 h-6" /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
