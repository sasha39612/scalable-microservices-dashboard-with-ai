'use client';

import React, { useMemo } from 'react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

// Chart data types
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  data: ChartDataPoint[];
  title?: string;
  width?: number;
  height?: number;
}

interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
  width?: number;
  height?: number;
}

interface PieChartProps {
  data: ChartDataPoint[];
  title?: string;
  size?: number;
}

// Line Chart Component
const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  title = "Line Chart", 
  width = 400, 
  height = 200 
}) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const pathData = useMemo(() => {
    if (data.length === 0) return "";
    
    return data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + (1 - point.value / maxValue) * chartHeight;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }, [data, maxValue, chartWidth, chartHeight, padding]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Chart line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth;
          const y = padding + (1 - point.value / maxValue) * chartHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="2"
            />
          );
        })}
        
        {/* Y-axis labels */}
        <text x="10" y={padding} dy="0.3em" fontSize="12" fill="#6b7280">
          {maxValue}
        </text>
        <text x="10" y={height - padding} dy="0.3em" fontSize="12" fill="#6b7280">
          0
        </text>
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-10">
        {data.map((point, index) => (
          <span key={index} className="text-xs text-gray-600 dark:text-gray-400">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// Bar Chart Component
const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title = "Bar Chart", 
  width = 400, 
  height = 200 
}) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / data.length * 0.8;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        <defs>
          <pattern id="barGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#barGrid)" />
        
        {/* Bars */}
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * chartHeight;
          const x = padding + index * (chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
          const y = height - padding - barHeight;
          
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={point.color || "#3b82f6"}
              rx="4"
              ry="4"
            />
          );
        })}
        
        {/* Y-axis labels */}
        <text x="10" y={padding} dy="0.3em" fontSize="12" fill="#6b7280">
          {maxValue}
        </text>
        <text x="10" y={height - padding} dy="0.3em" fontSize="12" fill="#6b7280">
          0
        </text>
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-10">
        {data.map((point, index) => (
          <span key={index} className="text-xs text-gray-600 dark:text-gray-400">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// Pie Chart Component
const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title = "Pie Chart", 
  size = 200 
}) => {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const radius = size / 2 - 20;
  const center = size / 2;

  const slices = useMemo(() => {
    let currentAngle = 0;
    
    return data.map((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      
      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);
      
      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      
      const pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      currentAngle += sliceAngle;
      
      return {
        pathData,
        color: item.color || `hsl(${index * 360 / data.length}, 70%, 50%)`,
        label: item.label,
        value: item.value,
        percentage: ((item.value / total) * 100).toFixed(1)
      };
    });
  }, [data, total, radius, center]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="flex items-center">
        <svg width={size} height={size}>
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}
        </svg>
        
        {/* Legend */}
        <div className="ml-4 space-y-2">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center text-sm">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: slice.color }}
              ></div>
              <span className="text-gray-700 dark:text-gray-300">
                {slice.label} ({slice.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Charts Component
const Charts: React.FC = () => {
  const { insights, trends, loading, error } = useAnalyticsData(7);

  // Transform trends data for charts
  const lineData: ChartDataPoint[] = useMemo(() => {
    if (!trends?.userGrowthTrend) {
      // Fallback sample data
      return [
        { label: 'Day 1', value: 65 },
        { label: 'Day 2', value: 78 },
        { label: 'Day 3', value: 90 },
        { label: 'Day 4', value: 81 },
        { label: 'Day 5', value: 95 },
        { label: 'Day 6', value: 120 },
        { label: 'Day 7', value: 110 }
      ];
    }
    
    return trends.userGrowthTrend.map(point => ({
      label: `Day ${point.day}`,
      value: point.users || 0
    }));
  }, [trends]);

  const barData: ChartDataPoint[] = useMemo(() => {
    if (!trends?.taskCompletionTrend) {
      // Fallback sample data
      return [
        { label: 'Day 1', value: 45, color: '#3b82f6' },
        { label: 'Day 2', value: 52, color: '#10b981' },
        { label: 'Day 3', value: 38, color: '#f59e0b' },
        { label: 'Day 4', value: 61, color: '#ef4444' },
        { label: 'Day 5', value: 55, color: '#8b5cf6' },
        { label: 'Day 6', value: 42, color: '#06b6d4' },
        { label: 'Day 7', value: 38, color: '#84cc16' }
      ];
    }
    
    return trends.taskCompletionTrend.map(point => ({
      label: `Day ${point.day}`,
      value: point.completed || 0,
      color: '#3b82f6'
    }));
  }, [trends]);

  const pieData: ChartDataPoint[] = useMemo(() => {
    if (!insights || insights.length === 0) {
      // Fallback sample data
      return [
        { label: 'Desktop', value: 45, color: '#3b82f6' },
        { label: 'Mobile', value: 35, color: '#10b981' },
        { label: 'Tablet', value: 15, color: '#f59e0b' },
        { label: 'Other', value: 5, color: '#ef4444' }
      ];
    }

    // Transform insights data for pie chart
    const insightTypes = insights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return Object.entries(insightTypes).map(([type, count], index) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: colors[index % colors.length]
    }));
  }, [insights]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
            <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading chart data</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <LineChart 
          data={lineData} 
          title="User Growth Trend" 
          width={600} 
          height={250} 
        />
      </div>
      
      <div>
        <PieChart 
          data={pieData} 
          title="Insights Distribution" 
          size={200} 
        />
      </div>
      
      <div className="xl:col-span-3">
        <BarChart 
          data={barData} 
          title="Task Completion Trend" 
          width={800} 
          height={300} 
        />
      </div>
    </div>
  );
};

export default Charts;