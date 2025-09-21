import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: number | string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, trendValue }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      {trend && trendValue !== undefined && (
        <div className={`mt-2 flex items-center text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? '▲' : '▼'} {trendValue}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
