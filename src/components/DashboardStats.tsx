
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Tag, DollarSign, TrendingUp } from 'lucide-react';
import { DashboardStats as StatsType } from '../types';
import DashboardMetricsGrid from './DashboardMetricsGrid';


interface DashboardStatsProps {
  stats?: StatsType;
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loading...
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-muted rounded h-8 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Partners',
      value: stats.totalPartners.toString(),
      icon: Tag,
      color: 'text-green-600',
    },
    {
      title: 'Total Value',
      value: `₹${stats.totalValue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-purple-600',
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers.toString(),
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-3 w-3 ${stat.color}`} />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div> */}

      {/* Enhanced Metrics Grid */}
      <DashboardMetricsGrid stats={stats} />
    </div>
  );
};

export default DashboardStats;
