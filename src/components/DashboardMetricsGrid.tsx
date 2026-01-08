import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Target,
  BarChart3,
  RefreshCw,
  DollarSign,
  ListTodo,
} from 'lucide-react';
import { DashboardStats, Task, Partner } from '@/types'; // Assuming Partner type is defined in @/types
import { supabase } from '@/integrations/supabase/client'; // Assuming you have a supabase client setup
import TaskItem from './TaskItem';
import { API_ENDPOINTS } from '@/config/api';
import TaskListModal from './TaskListModal';
import PartnerListModal from './PartnerListModal';

interface DashboardMetricsGridProps {
  stats?: DashboardStats;
}
const DashboardMetricsGrid = ({ stats }: DashboardMetricsGridProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [partnerStats, setPartnerStats] = useState({
    total: 0,
    outreach: 0,
    portalActivated: 0,
    agreementCompleted: 0,
    kycCompleted: 0,
    onboarded: 0,
  });
  const [renewalStats, setRenewalStats] = useState({
    upcomingRenewals: 0,
    renewalSuccessRate: 0,
    renewalsAtRisk: 0,
  });
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    tasks: Task[];
    status: string;
  }>({ isOpen: false, tasks: [], status: '' });
  const [partnerModalState, setPartnerModalState] = useState<{
    isOpen: boolean;
    partners: Partner[];
    stage: string;
  }>({ isOpen: false, partners: [], stage: '' });

  useEffect(() => {
    const fetchTasks = async () => {
      // Fetch all tasks to calculate accurate stats.
      const { data, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) {
        console.error('Error fetching tasks:', error);
      } else if (data) {
        setTasks(data);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchPartnerData = async () => {
      let allPartners: Partner[] = [];
      let page = 0;
      const pageSize = 1000; // Supabase's default/max limit per request

      while (true) {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error('Error fetching partner data:', error);
          return; // Exit if there's an error
        }

        if (data && data.length > 0) {
          allPartners = allPartners.concat(data);
        }

        // If we fetched less than the page size, it's the last page
        if (!data || data.length < pageSize) {
          break;
        }

        page++;
      }
      console.log(allPartners)
      setAllPartners(allPartners);
      const total = allPartners.length;
      const outreach = allPartners.filter(p => p.onboarding_stage === 'outreach').length;
      const portalActivated = allPartners.filter(p => p.onboarding_stage === 'portal-activation').length;
      const agreementCompleted = allPartners.filter(p => p.onboarding_stage === 'agreement').length;
      const kycCompleted = allPartners.filter(p => p.onboarding_stage === 'kyc').length;
      const onboarded = allPartners.filter(p => p.onboarding_stage === 'onboarded').length;

      

      setPartnerStats({
        total, outreach, portalActivated, agreementCompleted, kycCompleted, onboarded,
      });
    };

    fetchPartnerData();
  }, []);

  useEffect(() => {
    const fetchRenewalData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.GET_RENEWAL_CRMDATA);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data)
        // Assuming the API returns an object with upcomingRenewals, renewalSuccessRate, and renewalsAtRisk
        // You might need to adjust this based on the actual API response structure
        setRenewalStats({
          upcomingRenewals: data.upcoming_renewals_30_days || 0,
          renewalSuccessRate: data.success_rate || 0,
          renewalsAtRisk: data.renewals_at_risk || 0,
        });
      } catch (error) {
        console.error('Error fetching renewal data:', error);
      }
    };
    fetchRenewalData();
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-1">
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="h-6 bg-muted rounded w-1/2 mb-1"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // --- Locally Calculated Task Stats ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const overdueTasks = tasks.filter(task => task.status === 'overdue').length;

  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<Task['status'], number>) || {};

  // Sort tasks to show the most recent ones first in the list.
  const recentTasks = [...tasks].sort((a, b) => b.id - a.id).slice(0, 5);

  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleStatusClick = (status: Task['status']) => {
    const filteredTasks = tasks.filter(task => task.status === status);
    setModalState({
      isOpen: true,
      tasks: filteredTasks,
      status: status,
    });
  };
  const closeModal = () => setModalState({ isOpen: false, tasks: [], status: '' });

  const handlePartnerStageClick = (stage: Partner['onboarding_stage'] | 'total') => {
    const filteredPartners =
      stage === 'total'
        ? allPartners
        : allPartners.filter(p => p.onboarding_stage === stage);
    setPartnerModalState({
      isOpen: true,
      partners: filteredPartners,
      stage: stage,
    });
  };
  const closePartnerModal = () => setPartnerModalState({ isOpen: false, partners: [], stage: '' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Revenue Breakdown */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-green-600" />
            Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">New Revenue</span>
            <span className="text-sm font-semibold">₹{stats.newRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Renewal Revenue</span>
            <span className="text-sm font-semibold">₹{stats.renewalRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t pt-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">Total Revenue</span>
              <span className="text-sm font-bold text-primary">₹{stats.totalValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600">+{stats.monthlyGrowthRate.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Task Management Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blue-600" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-muted-foreground">Overall Progress</span>
              <span className="text-xs font-bold">{completionPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
            <div className="space-y-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handleStatusClick('completed')}>
              <div className="text-muted-foreground text-xs">Total</div>
              <div className="font-bold text-lg">{totalTasks}</div>
            </div>
            <div className="space-y-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handleStatusClick('completed')}>
              <div className="text-muted-foreground text-xs">Completed</div>
              <div className="font-bold text-lg text-green-600">{completedTasks}</div>
            </div>
            <div className="text-xs flex justify-between items-center col-span-2 border-t pt-2 mt-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handleStatusClick('pending')}>
              <span className="text-muted-foreground">Pending</span><span className="font-semibold">{taskStatusCounts.pending || 0}</span>
            </div>
            <div className="text-xs flex justify-between items-center col-span-2 border-t pt-2 mt-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handleStatusClick('in-progress')}>
              <span className="text-muted-foreground">In Progress</span><span className="font-semibold">{taskStatusCounts['in-progress'] || 0}</span>
            </div>
            <div className="text-xs flex justify-between items-center col-span-2 border-t pt-2 mt-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handleStatusClick('overdue')}>
              <span className="text-muted-foreground">Overdue</span><span className="font-semibold text-red-600">{taskStatusCounts.overdue || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partner Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Partner Funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-muted-foreground">Onboarded Rate</span>
              <span className="text-xs font-bold">
                {partnerStats.total > 0 ? ((partnerStats.onboarded / partnerStats.total) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${partnerStats.total > 0 ? (partnerStats.onboarded / partnerStats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
            <div className="space-y-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handlePartnerStageClick('total')}>
              <div className="text-muted-foreground text-xs">Total</div>
              <div className="font-bold text-lg">{partnerStats.total}</div>
            </div>
            <div className="space-y-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handlePartnerStageClick('onboarded')}>
              <div className="text-muted-foreground text-xs">Onboarded</div>
              <div className="font-bold text-lg text-green-600">{partnerStats.onboarded}</div>
            </div>
            <div className="text-xs flex justify-between items-center col-span-2 border-t pt-2 mt-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handlePartnerStageClick('outreach')}>
              <span className="text-muted-foreground">Outreach</span><span className="font-semibold">{partnerStats.outreach}</span>
            </div>
            <div className="text-xs flex justify-between items-center col-span-2 border-t pt-2 mt-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handlePartnerStageClick('agreement')}>
              <span className="text-muted-foreground">Agreement</span><span className="font-semibold">{partnerStats.agreementCompleted}</span>
            </div>
            <div className="text-xs flex justify-between items-center col-span-2 border-t pt-2 mt-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handlePartnerStageClick('kyc')}>
              <span className="text-muted-foreground">KYC Completed</span><span className="font-semibold">{partnerStats.kycCompleted}</span>
            </div>
            <div className="text-xs flex justify-between items-center col-span-2 border-t pt-2 mt-1 cursor-pointer p-2 rounded-md transition-colors hover:bg-muted/50" onClick={() => handlePartnerStageClick('portal-activation')}>
              <span className="text-muted-foreground">Portal Activated</span><span className="font-semibold">{partnerStats.portalActivated}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Pipeline */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <BarChart3 className="h-3 w-3 text-orange-600" />
            Customer Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">In Progress</span>
            <span className="text-sm font-semibold">{stats.customersPipeline}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Won</span>
            <span className="text-sm font-semibold text-green-600">{stats.customersWon}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Conversion Rate</span>
            <span className="text-sm font-semibold">{stats.conversionRate.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Renewals Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-teal-600" />
            Renewals Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Upcoming (30d)</span>
            <span className="font-semibold">{renewalStats.upcomingRenewals}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Success Rate</span>
            <span className="font-semibold">{renewalStats.renewalSuccessRate.toFixed(1)}%</span>
          </div>
          {renewalStats.renewalsAtRisk > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">{renewalStats.renewalsAtRisk} at risk</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <Target className="h-3 w-3 text-indigo-600" />
            Key Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-1">
          {overdueTasks > 0 && (
            <div className="flex items-center gap-2 p-1 bg-red-50 rounded">
              <Clock className="h-3 w-3 text-red-500" />
              <span className="text-xs text-red-700">{overdueTasks} overdue</span>
            </div>
          )}
          {stats.renewalsAtRisk > 0 && (
            <div className="flex items-center gap-2 p-1 bg-yellow-50 rounded">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-yellow-700">{stats.renewalsAtRisk} at risk</span>
            </div>
          )}
          {stats.partnerOnboardingInProgress > 0 && (
            <div className="flex items-center gap-2 p-1 bg-blue-50 rounded">
              <Users className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-blue-700">{stats.partnerOnboardingInProgress} onboarding</span>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskListModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        tasks={modalState.tasks}
        status={modalState.status}
      />

      <PartnerListModal
        isOpen={partnerModalState.isOpen}
        onClose={closePartnerModal}
        partners={partnerModalState.partners}
        stage={partnerModalState.stage}
      />
    </div>
  );
};

export default DashboardMetricsGrid;