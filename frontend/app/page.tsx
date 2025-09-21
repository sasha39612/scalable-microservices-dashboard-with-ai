'use client';

import StatsCard from '@/components/widgets/StatsCard';
import useDashboardStats from '@/hooks/useDashboardStats';
import { FiUsers, FiActivity, FiAlertCircle } from 'react-icons/fi';

// Define the DashboardStat type if not imported from elsewhere
type DashboardStat = {
  title: string;
  value: number | string;
  trend?: 'up' | 'down';
  trendValue?: number | string;
};

const DashboardPage = () => {
  const { stats, loading, error } = useDashboardStats();

  const iconMap: Record<string, React.ReactNode> = {
    Users: <FiUsers size={24} />,
    'Active Tasks': <FiActivity size={24} />,
    Errors: <FiAlertCircle size={24} />,
  };

  if (loading) return <p>Loading stats...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat: DashboardStat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={iconMap[stat.title]}
            trend={stat.trend as 'up' | 'down'}
            trendValue={stat.trendValue}
          />
        ))}
      </div>
    </section>
  );
}

export default DashboardPage;
