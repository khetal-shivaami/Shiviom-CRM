
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Building, MapPin, User, Package, Edit, Clock, CheckCircle, AlertCircle, Calendar, Loader2, Globe, Phone } from 'lucide-react';
import { Customer, Partner, Product, User as UserType, Task } from '../types';
import CustomerEditDialog from './CustomerEditDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerDetailProps {
  customer: Customer;
  partners: Partner[];
  products: Product[];
  users: UserType[];
  onBack: () => void;
  onCustomerUpdate: (updatedCustomer: Customer) => void;
}

const CustomerDetail = ({ customer, partners, products, users, onBack, onCustomerUpdate }: CustomerDetailProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const partner = partners.find(p => p.id === customer.partnerId) || null;
  const [customerTasks, setCustomerTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const { toast } = useToast();

  const getPartnerName = () => {
    const supabasePartner = partners.find(p => p.id === customer.partnerId);
    if (supabasePartner) return supabasePartner.name;
    if (customer.partnerName) return customer.partnerName; // From Supabase join
    return customer.resellerName || ''; // From CRM API or fallback
  };

  useEffect(() => {
    const fetchTasksForCustomer = async () => {
        if (!customer.id) return;
        setIsLoadingTasks(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('portal_customer_id', customer.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedTasks: Task[] = data.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status as Task['status'],
                priority: task.priority as Task['priority'],
                type: task.type as Task['type'],
                assignedTo: task.assigned_to,
                assignedBy: task.assigned_by,
                customerId: task.portal_customer_id,
                customerDomain: task.customer_domain,
                partnerId: task.partner_id,
                portal_reseller_id: task.portal_reseller_id,
                dueDate: task.due_date ? new Date(task.due_date) : undefined,
                createdAt: new Date(task.created_at),
                updatedAt: task.updated_at ? new Date(task.updated_at) : undefined,
                completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
                notes: task.notes,
                tags: task.tags || [],
                estimatedHours: task.estimated_hours,
                actualHours: task.actual_hours,
                isOnboardingTask: task.is_onboarding_task,
            }));
            setCustomerTasks(transformedTasks);
        } catch (error: any) {
            toast({ title: 'Error fetching tasks', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoadingTasks(false);
        }
    };

    if (customer) {
        fetchTasksForCustomer();
    }
  }, [customer, toast]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getZoneColor = (zone?: string) => {
    switch (zone) {
      case 'north': return 'bg-blue-100 text-blue-800';
      case 'east': return 'bg-green-100 text-green-800';
      case 'west': return 'bg-orange-100 text-orange-800';
      case 'south': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessColor = (process?: string) => {
    switch (process) {
      case 'prospect': return 'bg-gray-100 text-gray-800';
      case 'demo': return 'bg-blue-100 text-blue-800';
      case 'poc': return 'bg-cyan-100 text-cyan-800';
      case 'negotiating': return 'bg-yellow-100 text-yellow-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'deployment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTaskPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const taskStats = {
    total: customerTasks.length,
    completed: customerTasks.filter(t => t.status === 'completed').length,
    inProgress: customerTasks.filter(t => t.status === 'in-progress').length,
    pending: customerTasks.filter(t => t.status === 'pending').length,
    overdue: customerTasks.filter(t => t.status === 'overdue').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Customer Management
        </Button>
        <Button onClick={() => setIsEditDialogOpen(true)}>
          <Edit size={16} className="mr-2" />
          Edit Customer
        </Button>
      </div>

      {/* Customer Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail size={16} />
                  <span>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone size={16} />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Building size={16} />
                  <span>{customer.company}</span>
                </div>
                {(customer.customer_domain || customer.domainName) && (
                  <div className="flex items-center gap-1">
                    <Globe size={16} />
                    <span>{customer.customer_domain || customer.domainName}</span>
                  </div>
                )}
                {customer.zone && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <Badge className={getZoneColor(customer.zone)}>
                      {customer.zone.charAt(0).toUpperCase() + customer.zone.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(customer.status)}>
                {customer.status}
              </Badge>
              {customer.process && (
                <Badge className={getProcessColor(customer.process)}>
                  {customer.process.charAt(0).toUpperCase() + customer.process.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Partner</h4>
              <p className="text-lg">{getPartnerName()}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Customer Value</h4>
              <p className="text-lg font-bold">₹{customer.value.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Current Stage</h4>
              <p className="text-lg">
                {customer.process ? (
                  <Badge className={getProcessColor(customer.process)}>
                    {customer.process.charAt(0).toUpperCase() + customer.process.slice(1)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Created</h4>
              <p className="text-lg">{customer.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        {!customer.deal_products || customer.deal_products.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No products assigned to this customer.</p>
            </CardContent>
          </Card>
        ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Licenses</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price/License</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customer.deal_products.map((deal, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deal.productName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deal.skuName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{deal.licenseCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deal.planType}{deal.planDuration ? ` (${deal.planDuration} Yr)` : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{deal.pr_shivaamiprice?.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-medium">₹{deal.shivaamisubtotal?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
        )}
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tasks ({taskStats.total})</h2>
        </div>
        
        {/* Task Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{taskStats.total}</p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
                </div>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
                </div>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        {isLoadingTasks ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-muted-foreground">Loading tasks...</p>
            </CardContent>
          </Card>
        ) : customerTasks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No tasks assigned to this customer.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {customerTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTaskStatusIcon(task.status)}
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge className={getTaskStatusColor(task.status)}>
                          {task.status.replace('-', ' ')}
                        </Badge>
                        <Badge className={getTaskPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Assigned to: {getUserName(task.assignedTo)}</span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {task.dueDate.toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Est: {task.estimatedHours}h</span>
                          </div>
                        )}
                      </div>
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <CustomerEditDialog
        customer={customer}
        partners={partners}
        products={products}
        users={users}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={(updatedCustomer) => {
          onCustomerUpdate(updatedCustomer);
          setIsEditDialogOpen(false);
        }}
      />
    </div>
  );
};

export default CustomerDetail;
