
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Plus, Calendar, Filter, BarChart3, Users, Tag, Package, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Customer, Partner, Product, User, Task } from '../types';
import CustomReportDialog from './CustomReportDialog';
import ScheduleReportDialog from './ScheduleReportDialog';
import ScheduledReportsManager from './ScheduledReportsManager';
import { useAuth } from '@/contexts/AuthContext';
import { mockTasks } from '@/utils/mockTasks';
import { reportService } from '@/services/reportService';
import { useToast } from '@/hooks/use-toast';

interface ReportsProps {
  customers: Customer[];
  partners: Partner[];
  products: Product[];
  users: User[];
}

const Reports = ({ customers, partners, products, users }: ReportsProps) => {
  const [isCustomReportOpen, setIsCustomReportOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Filter data based on user role and assignments
  const { filteredCustomers, filteredPartners, filteredTasks } = useMemo(() => {
    // Admin users see all data
    if (profile?.role === 'admin') {
      return {
        filteredCustomers: customers,
        filteredPartners: partners,
        filteredTasks: mockTasks
      };
    }
    
    // Regular users only see data assigned to them
    const userAssignedCustomers = customers.filter(customer => 
      customer.assignedUserIds?.includes(user?.id || '')
    );
    
    const userAssignedPartners = partners.filter(partner => 
      partner.assignedUserIds?.includes(user?.id || '')
    );

    const userAssignedTasks = mockTasks.filter(task => 
      task.assignedTo === user?.id || task.assignedBy === user?.id
    );
    
    return {
      filteredCustomers: userAssignedCustomers,
      filteredPartners: userAssignedPartners,
      filteredTasks: userAssignedTasks
    };
  }, [customers, partners, user?.id, profile?.role]);

  // Task analytics
  const taskAnalytics = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const overdueTasks = filteredTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;
    const highPriorityTasks = filteredTasks.filter(t => 
      t.priority === 'high' || t.priority === 'urgent'
    ).length;
    const avgCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      highPriorityTasks,
      avgCompletionRate
    };
  }, [filteredTasks]);

  // Filter reports based on user role
  const availableReports = useMemo(() => {
    const baseReports = [
      // Task & Performance Reports
      {
        id: 'task-performance',
        title: 'Task Performance Dashboard',
        description: profile?.role === 'admin' 
          ? 'Comprehensive task analytics and team productivity metrics'
          : 'Your task completion rates and productivity analytics',
        category: 'tasks',
        lastGenerated: new Date('2024-07-15'),
        isNew: true,
      },
      {
        id: 'employee-productivity',
        title: 'Employee Productivity Report',
        description: profile?.role === 'admin'
          ? 'Individual and team performance metrics with task completion rates'
          : 'Your personal productivity metrics and task analytics',
        category: 'performance',
        lastGenerated: new Date('2024-07-14'),
        isNew: true,
      },
      {
        id: 'customer-engagement',
        title: 'Customer Engagement Report',
        description: 'Task activity correlation with customer satisfaction and value',
        category: 'analytics',
        lastGenerated: new Date('2024-07-13'),
        isNew: true,
      },
      
      // Business Intelligence Reports
      {
        id: 'revenue-attribution',
        title: 'Revenue Attribution Analysis',
        description: 'Track revenue sources and customer lifecycle impact',
        category: 'intelligence',
        lastGenerated: new Date('2024-07-12'),
        isNew: true,
      },
      {
        id: 'partner-onboarding-analytics',
        title: 'Partner Onboarding Analytics',
        description: 'Onboarding stage progression and bottleneck analysis',
        category: 'intelligence',
        lastGenerated: new Date('2024-07-11'),
        isNew: true,
      },
      {
        id: 'customer-lifecycle',
        title: 'Customer Lifecycle Analysis',
        description: 'Journey mapping from prospect to renewal with task correlation',
        category: 'analytics',
        lastGenerated: new Date('2024-07-10'),
        isNew: true,
      },

      // Operational Reports  
      {
        id: 'capacity-planning',
        title: 'Resource Capacity Planning',
        description: 'Team workload analysis and capacity optimization recommendations',
        category: 'operational',
        lastGenerated: new Date('2024-07-09'),
        isNew: true,
      },
      {
        id: 'bottleneck-analysis',
        title: 'Process Bottleneck Analysis',
        description: 'Identify workflow inefficiencies and optimization opportunities',
        category: 'operational',
        lastGenerated: new Date('2024-07-08'),
        isNew: true,
      },

      // Traditional Reports (Enhanced)
      {
        id: 'customer-summary',
        title: 'Enhanced Customer Report',
        description: profile?.role === 'admin' 
          ? 'Comprehensive customer analytics with task and engagement metrics'
          : 'Your assigned customers with detailed engagement analytics',
        category: 'customers',
        lastGenerated: new Date('2024-07-07'),
      },
      {
        id: 'partner-performance',
        title: 'Advanced Partner Analytics',
        description: profile?.role === 'admin'
          ? 'Partner performance with onboarding progression and revenue attribution'
          : 'Your partner performance metrics and onboarding status',
        category: 'partners',
        lastGenerated: new Date('2024-07-06'),
      },
      {
        id: 'product-adoption',
        title: 'Product Adoption Intelligence',
        description: 'Product usage patterns, customer adoption lifecycle, and growth metrics',
        category: 'products',
        lastGenerated: new Date('2024-07-05'),
      },
      {
        id: 'renewal-tracking',
        title: 'Predictive Renewal Analytics',
        description: profile?.role === 'admin'
          ? 'Renewal forecasting with risk scoring and task correlation'
          : 'Your renewal pipeline with risk indicators and action items',
        category: 'renewals',
        lastGenerated: new Date('2024-07-04'),
      },
      {
        id: 'sales-pipeline',
        title: 'AI-Enhanced Sales Pipeline',
        description: profile?.role === 'admin'
          ? 'Predictive sales analytics with conversion probability and task impact'
          : 'Your sales opportunities with AI-powered insights',
        category: 'sales',
        lastGenerated: new Date('2024-07-03'),
      },
    ];

    // Admin-only reports
    if (profile?.role === 'admin') {
      baseReports.push(
        {
          id: 'executive-dashboard',
          title: 'Executive Dashboard Report',
          description: 'High-level KPIs, strategic metrics, and executive summary',
          category: 'executive',
          lastGenerated: new Date('2024-07-02'),
          isNew: true,
        },
        {
          id: 'predictive-analytics',
          title: 'Predictive Business Analytics',
          description: 'Forecasting models for revenue, churn, and growth predictions',
          category: 'predictive',
          lastGenerated: new Date('2024-07-01'),
          isNew: true,
        },
        {
          id: 'team-performance',
          title: 'Team Performance Analysis',
          description: 'Cross-team productivity comparison and optimization insights',
          category: 'performance',
          lastGenerated: new Date('2024-06-30'),
          isNew: true,
        }
      );
    }

    return baseReports;
  }, [profile?.role]);

  const getCategoryColor = (category: string) => {
    const colors = {
      tasks: 'bg-emerald-100 text-emerald-800',
      performance: 'bg-blue-100 text-blue-800', 
      analytics: 'bg-violet-100 text-violet-800',
      intelligence: 'bg-cyan-100 text-cyan-800',
      operational: 'bg-amber-100 text-amber-800',
      customers: 'bg-blue-100 text-blue-800',
      partners: 'bg-green-100 text-green-800',
      products: 'bg-purple-100 text-purple-800',
      renewals: 'bg-orange-100 text-orange-800',
      sales: 'bg-red-100 text-red-800',
      executive: 'bg-gray-100 text-gray-800',
      predictive: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleDownloadReport = async (reportId: string) => {
    setIsGenerating(reportId);
    
    try {
      await reportService.generateReport(
        {
          type: reportId,
          format: 'excel',
          dateRange: 'last-30-days'
        },
        {
          customers: filteredCustomers,
          partners: filteredPartners,
          products,
          users,
          tasks: filteredTasks
        }
      );
      
      toast({
        title: "Report Downloaded",
        description: "Your report has been generated and downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId);
    
    try {
      await reportService.generateReport(
        {
          type: reportId,
          format: 'pdf',
          dateRange: 'last-30-days'
        },
        {
          customers: filteredCustomers,
          partners: filteredPartners,
          products,
          users,
          tasks: filteredTasks
        }
      );
      
      toast({
        title: "Report Generated",
        description: "Your report has been generated and downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Available Reports</h3>
          <p className="text-muted-foreground text-sm">Generate and download business reports</p>
        </div>
        <Button onClick={() => setIsCustomReportOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus size={16} />
          Create Custom Report
        </Button>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-600 md:w-5 md:h-5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Customers</p>
                <p className="text-lg md:text-2xl font-bold">{filteredCustomers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-green-600 md:w-5 md:h-5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Partners</p>
                <p className="text-lg md:text-2xl font-bold">{filteredPartners.filter(p => p.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-purple-600 md:w-5 md:h-5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Products</p>
                <p className="text-lg md:text-2xl font-bold">{products.filter(p => p.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-600 md:w-5 md:h-5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Total Tasks</p>
                <p className="text-lg md:text-2xl font-bold">{taskAnalytics.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600 md:w-5 md:h-5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Completed</p>
                <p className="text-lg md:text-2xl font-bold">{taskAnalytics.completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600 md:w-5 md:h-5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Overdue</p>
                <p className="text-lg md:text-2xl font-bold">{taskAnalytics.overdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Task Completion Rate</p>
                <p className="text-2xl font-bold">{taskAnalytics.avgCompletionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="text-emerald-600 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Pipeline</p>
                <p className="text-2xl font-bold">₹{filteredCustomers.reduce((sum, c) => sum + c.value, 0).toLocaleString('en-IN')}</p>
              </div>
              <BarChart3 className="text-blue-600 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority Tasks</p>
                <p className="text-2xl font-bold">{taskAnalytics.highPriorityTasks}</p>
              </div>
              <AlertTriangle className="text-amber-600 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predefined Reports */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileText size={18} />
            Predefined Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {availableReports.map((report) => (
              <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h4 className="font-medium text-sm md:text-base truncate">{report.title}</h4>
                    <div className="flex gap-2">
                      <Badge className={getCategoryColor(report.category)}>
                        {report.category}
                      </Badge>
                      {report.isNew && (
                        <Badge className="bg-green-100 text-green-800">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">{report.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    Last generated: {report.lastGenerated.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col lg:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isGenerating === report.id}
                    className="flex-1 sm:flex-none text-xs"
                  >
                    {isGenerating === report.id ? 'Generating...' : 'Generate PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(report.id)}
                    disabled={isGenerating === report.id}
                    className="gap-1 flex-1 sm:flex-none text-xs"
                  >
                    <Download size={12} />
                    {isGenerating === report.id ? 'Downloading...' : 'Download Excel'}
                  </Button>
                  <ScheduleReportDialog
                    reportType={report.id}
                    reportName={report.title}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 flex-1 sm:flex-none text-xs"
                    >
                      <Calendar size={12} />
                      Schedule
                    </Button>
                  </ScheduleReportDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports Manager */}
      <ScheduledReportsManager />

      {/* Custom Report Dialog */}
      <CustomReportDialog
        open={isCustomReportOpen}
        onOpenChange={setIsCustomReportOpen}
        customers={filteredCustomers}
        partners={filteredPartners}
        products={products}
        users={users}
        tasks={filteredTasks}
      />
    </div>
  );
};

export default Reports;
