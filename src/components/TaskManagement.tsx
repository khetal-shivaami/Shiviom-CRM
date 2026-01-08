import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { Search, Filter, Plus, Calendar, Clock, AlertCircle, CheckCircle, User, Building, Users, ArrowLeft, Edit, LinkIcon, ChevronsUpDown, Check } from 'lucide-react';
import { Task, Customer, Partner, User as UserType, Profile } from '@/types';
import { API_ENDPOINTS } from '@/config/api';
import { cn } from '@/lib/utils';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';

interface TaskManagementProps {
  users: UserType[];
  currentUserId?: string;
}

const TaskManagement = ({ users, currentUserId }: TaskManagementProps) => {
  const { isAdmin, profile, user } = useAuth();
  const { toast } = useToast();
  const { tasks, loading, refreshTasks, updateTask } = useTaskManager();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isPartnersLoading, setIsPartnersLoading] = useState(true);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [assignedToFilters, setAssignedToFilters] = useState<string[]>([]);
  const [assignedByFilters, setAssignedByFilters] = useState<string[]>([]);
  const [onboardingFilter, setOnboardingFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    type: 'other' as Task['type'],
    customerId: 'none',
    partnerId: 'none',
    dueDate: '',
    assignedTo: ''
  });

  const fetchCustomersForPartner = async (partnerEmail: string, partnerId: string) => {
    if (!partnerEmail) {
      setCustomers([]);
      return;
    }
    setIsCustomersLoading(true);
    setCustomers([]); // Clear previous customers
    try {
      const formData = new FormData();
      formData.append('reseller_email', partnerEmail);

      const response = await fetch(API_ENDPOINTS.GET_CUSTOMER_LIST_OF_RESELLER_CRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success || !result.data || !result.data.data_result) {
        setCustomers([]);
        return;
      }

      const apiCustomers = result.data.data_result;
      const mappedCustomers: Customer[] = apiCustomers.map((c: any) => ({
        id: c.cust_id,
        domainName: c.customer_domainname,
        name: c.customer_name || c.customer_domainname,
        email: c.customer_emailid || '',
        phone: c.customer_contact_number || '',
        company: c.customer_company_name || c.customer_domainname,
        status: 'active',
        process: 'won',
        partnerId: partnerId,
        createdAt: new Date(c.created_on),
        value: 0,
      }));
      setCustomers(mappedCustomers);
    } catch (error: any) {
      toast({
        title: "Error fetching partner's customers",
        description: error.message,
        variant: 'destructive',
      });
      setCustomers([]);
    } finally {
      setIsCustomersLoading(false);
    }
  };

  useEffect(() => {
    const fetchPartners = async () => {
      setIsPartnersLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.GET_RESELLER_DATA, {
          method: 'POST',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (!result.success || !result.data || !result.data.data_result) {
          throw new Error('Invalid API response structure for partners');
        }
        const apiPartners = result.data.data_result;
        const mappedPartners: Partner[] = apiPartners.map((p: any) => ({
          id: p.reseller_id,
          name: p.reseller_name || '',
          email: p.reseller_email || '',
          company: p.company_name || '',
          phone: p.phone_number || '',
          specialization: p.partner_program || 'N/A',
          identity: 'it-consulting',
          status: p.isactive === 'ACCEPT' ? 'active' : 'inactive',
          customersCount: p.customer_count,
          totalValue: 0, newRevenue: 0, renewalRevenue: 0,
          portal_reseller_id: p.portal_reseller_id,
          createdAt: p.created_on ? new Date(p.created_on) : new Date(),
          agreementSigned: false, productTypes: [], paymentTerms: 'net-30',
          crm_id: p.crm_partner_id,
        }));
        setPartners(mappedPartners);
      } catch (error: any) {
        toast({
          title: 'Error fetching data',
          description: 'Could not load partners for task creation.',
          variant: 'destructive',
        });
      } finally {
        setIsPartnersLoading(false);
      }
    };

    fetchPartners();
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilters, priorityFilters, typeFilters, assignedToFilters, assignedByFilters, onboardingFilter]);

  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'medium' as Task['priority'],
      type: 'other' as Task['type'],
      customerId: 'none',
      partnerId: 'none',
      dueDate: '',
      assignedTo: ''
    });
  };

  const getCustomerName = (customerId?: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '';
  };

  const getPartnerName = (partnerId?: string) => {
    const partner = partners.find(p => p.crm_id === partnerId);
    return partner ? partner.name : '';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Filter tasks based on user role and permissions
  const userRelevantTasks = tasks.filter(task => {
    if (!currentUserId) return false;
    // Admin users can see all tasks
    if (isAdmin) return true;
    // Regular users can only see tasks assigned to them
    return task.assignedTo === currentUserId;
  });

  // Filter tasks based on search and filter criteria
  const filteredTasks = userRelevantTasks.filter(task => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = task.title.toLowerCase().includes(searchLower) ||
                         (task.customerDomain && task.customerDomain.toLowerCase().includes(searchLower)) ||
                         getPartnerName(task.partnerId).toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(task.status);
    const matchesPriority = priorityFilters.length === 0 || priorityFilters.includes(task.priority);
    const matchesType = typeFilters.length === 0 || typeFilters.includes(task.type);
    const matchesAssignedTo = assignedToFilters.length === 0 || assignedToFilters.includes(task.assignedTo);
    const matchesAssignedBy = assignedByFilters.length === 0 || assignedByFilters.includes(task.assignedBy);
    const matchesOnboarding = onboardingFilter === 'all' || 
      (onboardingFilter === 'onboarding' && task.isOnboardingTask) ||
      (onboardingFilter === 'regular' && !task.isOnboardingTask);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssignedTo && matchesAssignedBy && matchesOnboarding;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredTasks.slice(indexOfFirstRecord, indexOfLastRecord);

  const getStatusIcon = (status: Task['status']) => {
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

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleMultiSelectFilter = (
    currentFilters: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter((item) => item !== value)
      : [...currentFilters, value];
    setter(newFilters);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilters([]);
    setPriorityFilters([]);
    setTypeFilters([]);
    setAssignedToFilters([]);
    setAssignedByFilters([]);
    setOnboardingFilter('all');
  };

  const filterOptions = {
    statuses: ['pending', 'in-progress', 'completed', 'overdue'],
    priorities: ['low', 'medium', 'high', 'urgent'],
    types: ['follow-up', 'meeting', 'document-review', 'approval', 'negotiation', 'onboarding', 'support', 'other'],
  };

  const stats = {
    total: userRelevantTasks.length,
    pending: userRelevantTasks.filter(t => t.status === 'pending').length,
    inProgress: userRelevantTasks.filter(t => t.status === 'in-progress').length,
    completed: userRelevantTasks.filter(t => t.status === 'completed').length,
    overdue: userRelevantTasks.filter(t => t.status === 'overdue').length
  };

  const isAnyFilterActive =
    searchTerm !== '' ||
    statusFilters.length > 0 ||
    priorityFilters.length > 0 ||
    typeFilters.length > 0 ||
    assignedToFilters.length > 0 ||
    assignedByFilters.length > 0;

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.assignedTo || newTask.partnerId === 'none' || newTask.customerId === 'none') {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title, select a partner, a customer, and assign the task to a user.',
        variant: 'destructive',
      });
      return;
    }

    const selectedPartner = partners.find(p => p.id === newTask.partnerId);
    const selectedCustomer = customers.find(c => c.id === newTask.customerId);
    const assignedToUser = users.find(user => user.id === newTask.assignedTo);

    let supabasePartnerId: string | null = null;
    
    if (selectedPartner && newTask.partnerId !== 'none' && selectedPartner.id) {
      const { data: supabasePartner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('portal_reseller_id', selectedPartner.id)
        .single();

      if (partnerError || !supabasePartner) {
        toast({
          title: 'Partner Not Found in DB',
          description: `The selected partner "${selectedPartner.name}" could not be found in the system database. The task cannot be linked.`,
          variant: 'destructive',
        });
        return;
      }
      supabasePartnerId = supabasePartner.id;
    }

    const taskToInsert = {
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      type: newTask.type,
      status: 'pending',
      assigned_to: newTask.assignedTo,
      assigned_to_email: assignedToUser?.email || null,
      assignee_name: assignedToUser?.name || null,
      assigned_by: profile?.user_id,
      assigned_by_email: profile?.email,
      assigned_by_name: profile?.first_name,
      portal_customer_id: newTask.customerId === 'none' ? null : newTask.customerId,
      customer_domain: selectedCustomer?.domainName || null,
      partner_id: selectedPartner?.crm_id || null,
      partner_name: selectedPartner?.name || null,
      partner_email: selectedPartner?.email || null,
      partner_company: selectedPartner?.company || null,
      partner_phnnumber: selectedPartner?.contact_number || null,
      portal_reseller_id: selectedPartner?.id || null, // This was added in a previous request
      due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
      is_onboarding_task: newTask.type === 'onboarding',
    };
    console.log('Task to insert:', taskToInsert);

    
    const taskToInsert_insupabase = {
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      type: newTask.type,
      status: 'pending',
      assigned_to: newTask.assignedTo,
      assigned_by: profile?.user_id,
      portal_customer_id: newTask.customerId === 'none' ? null : newTask.customerId,
      customer_domain: selectedCustomer?.domainName || null,
      partner_id: selectedPartner?.crm_id || null,
      portal_reseller_id: selectedPartner?.id || null, // This was added in a previous request
      due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
      is_onboarding_task: newTask.type === 'onboarding',
    };

    // This logic should ideally be in your useTaskManager hook,
    // but here is the direct Supabase implementation.
    const { error } = await supabase.from('tasks').insert(taskToInsert_insupabase);

    if (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error Creating Task',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Task Created',
        description: 'The new task has been added successfully.',
      });
      setShowCreateDialog(false);
      resetNewTaskForm();
      refreshTasks();
      const creatorName = (profile?.first_name || profile?.last_name) 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : (user?.email || 'Unknown User');
      const logDetails = `User "${creatorName}" created new task: "${newTask.title}"`;
      await logCrmAction("Create Task", logDetails);

      // Send task notification
      try {
        const notificationResponse = await fetch(API_ENDPOINTS.SEND_TASK_NOTIFICATION_FRMCRM, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskToInsert),
        });

        if (!notificationResponse.ok) {
          // Log or toast a non-critical error if notification fails
          console.error('Failed to send task notification:', await notificationResponse.text());
        }
      } catch (notificationError: any) {
        console.error('Error sending task notification:', notificationError.message);
      }
    }
  };

    const logCrmAction = async (actiontype: string, details: string) => {
        if (!user?.id) {
            console.error("User ID not available for logging CRM action.");
            return;
        }
        try {
            const formData = new FormData();
            formData.append('userid', user.id);
            formData.append('actiontype', actiontype);
            formData.append('path', 'Task Management');
            formData.append('details', details);

            const response = await fetch(API_ENDPOINTS.STORE_INSERT_CRM_LOGS, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ message: `CRM log API request failed with status ${response.status}` }));
                throw new Error(errorResult.message);
            }
        } catch (error: any) {
            console.error("Error logging CRM action:", error.message);
        }
    };




  if (selectedTask) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedTask(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
            <p className="text-muted-foreground">Task Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(selectedTask.status)}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(selectedTask.status)} text-white border-0`}
                    >
                      {selectedTask.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(selectedTask.priority)} text-white border-0`}
                    >
                      {selectedTask.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {selectedTask.type.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                {selectedTask.dueDate && (
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <div className="flex items-center space-x-1 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{selectedTask.dueDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Assigned By</Label>
                  <div className="text-sm mt-1">{getUserName(selectedTask.assignedBy)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="text-sm mt-1">{selectedTask.createdAt.toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>

            {/* Associated Records */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Associated With</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedTask.customerId && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Customer</div>
                      <div className="text-sm text-muted-foreground">{selectedTask.customerDomain || getCustomerName(selectedTask.customerId)}</div>
                    </div>
                  </div>
                )}
                {selectedTask.partnerId && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Partner</div>
                      <div className="text-sm text-muted-foreground">{getPartnerName(selectedTask.partnerId)}</div>
                    </div>
                  </div>
                )}
                {!selectedTask.customerId && !selectedTask.partnerId && (
                  <div className="text-sm text-muted-foreground">No associated records</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{selectedTask.description || 'No description provided'}</p>
              </CardContent>
            </Card>

            {selectedTask.notes && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedTask.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task Management</h2>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage all tasks across the organization' : 'Manage your assigned tasks and track progress'}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(isOpen) => {
          setShowCreateDialog(isOpen);
          if (!isOpen) {
            resetNewTaskForm();
            setCustomers([]); // Reset customers when dialog closes
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 relative">
              {(isPartnersLoading || isCustomersLoading) && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg -m-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-sm text-muted-foreground">
                      {isPartnersLoading ? "Loading partners..." : "Loading customers..."}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input 
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Enter task description"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: Task['priority']) => setNewTask({...newTask, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Task Type</Label>
                  <Select value={newTask.type} onValueChange={(value: Task['type']) => setNewTask({...newTask, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="document-review">Document Review</SelectItem>
                      <SelectItem value="approval">Approval</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="renewal">Renewal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner">Partner *</Label>
                  <Select
                    value={newTask.partnerId}
                    onValueChange={(value) => {
                      const partnerId = value;
                      setNewTask({
                        ...newTask,
                        partnerId: partnerId,
                        customerId: 'none' // Reset customer when partner changes
                      });
                      if (partnerId !== 'none') {
                        const selectedPartner = partners.find(p => p.id === partnerId);
                        if (selectedPartner) {
                          fetchCustomersForPartner(selectedPartner.email, selectedPartner.id);
                        }
                      } else {
                        setCustomers([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Partner</SelectItem>
                      {partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name} - {partner.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select 
                    value={newTask.customerId} 
                    onValueChange={(value) => setNewTask({...newTask, customerId: value})}
                    disabled={!newTask.partnerId || newTask.partnerId === 'none' || isCustomersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isCustomersLoading
                          ? "Loading domains..."
                          : !newTask.partnerId || newTask.partnerId === 'none'
                            ? "Select partner first"
                            : "Select domain"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.domainName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedTo">Assign To *</Label>
                  <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({...newTask, assignedTo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input 
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleCreateTask}>
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h3 className="text-lg font-semibold text-muted-foreground">Loading Tasks</h3>
          <p className="text-sm text-muted-foreground">Please wait while we fetch the task list...</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, customers, partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Plus className="mr-2 h-4 w-4" />
                    Status
                    {statusFilters.length > 0 && <Badge variant="secondary" className="ml-2 rounded-sm px-1">{statusFilters.length}</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60" align="start">
                  <div className="space-y-2">
                    {filterOptions.statuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox id={`status-${status}`} checked={statusFilters.includes(status)} onCheckedChange={() => handleMultiSelectFilter(statusFilters, setStatusFilters, status)} />
                        <label htmlFor={`status-${status}`} className="text-sm font-medium capitalize">{status.replace('-', ' ')}</label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Plus className="mr-2 h-4 w-4" />
                    Priority
                    {priorityFilters.length > 0 && <Badge variant="secondary" className="ml-2 rounded-sm px-1">{priorityFilters.length}</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60" align="start">
                  <div className="space-y-2">
                    {filterOptions.priorities.map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox id={`priority-${priority}`} checked={priorityFilters.includes(priority)} onCheckedChange={() => handleMultiSelectFilter(priorityFilters, setPriorityFilters, priority)} />
                        <label htmlFor={`priority-${priority}`} className="text-sm font-medium capitalize">{priority}</label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Plus className="mr-2 h-4 w-4" />
                    Type
                    {typeFilters.length > 0 && <Badge variant="secondary" className="ml-2 rounded-sm px-1">{typeFilters.length}</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60" align="start">
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {filterOptions.types.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox id={`type-${type}`} checked={typeFilters.includes(type)} onCheckedChange={() => handleMultiSelectFilter(typeFilters, setTypeFilters, type)} />
                          <label htmlFor={`type-${type}`} className="text-sm font-medium capitalize">{type.replace('-', ' ')}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Plus className="mr-2 h-4 w-4" />
                    Assigned To
                    {assignedToFilters.length > 0 && <Badge variant="secondary" className="ml-2 rounded-sm px-1">{assignedToFilters.length}</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60" align="start">
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {users.map((user) => (
                        <div key={`assignedTo-${user.id}`} className="flex items-center space-x-2">
                          <Checkbox id={`assignedTo-${user.id}`} checked={assignedToFilters.includes(user.id)} onCheckedChange={() => handleMultiSelectFilter(assignedToFilters, setAssignedToFilters, user.id)} />
                          <label htmlFor={`assignedTo-${user.id}`} className="text-sm font-medium">{user.name}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Plus className="mr-2 h-4 w-4" />
                    Assigned By
                    {assignedByFilters.length > 0 && <Badge variant="secondary" className="ml-2 rounded-sm px-1">{assignedByFilters.length}</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60" align="start">
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {users.map((user) => (
                        <div key={`assignedBy-${user.id}`} className="flex items-center space-x-2">
                          <Checkbox id={`assignedBy-${user.id}`} checked={assignedByFilters.includes(user.id)} onCheckedChange={() => handleMultiSelectFilter(assignedByFilters, setAssignedByFilters, user.id)} />
                          <label htmlFor={`assignedBy-${user.id}`} className="text-sm font-medium">{user.name}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {isAnyFilterActive && (
                <Button variant="ghost" size="sm" className="h-8" onClick={resetFilters}>
                  Reset
                </Button>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Associated With</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    Loading tasks...
                  </TableCell>
                </TableRow>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(task.status)}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(task.status)} text-white border-0`}
                        >
                          {task.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(task.priority)} text-white border-0`}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {task.customerId && (
                          <div className="flex items-center space-x-1">
                            <Building className="h-3 w-3 text-blue-500" />
                            <span className="text-sm font-medium">{task.customerDomain || getCustomerName(task.customerId)}</span>
                          </div>
                        )}
                        {task.partnerId && getPartnerName(task.partnerId) && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-green-500" />
                            <span className="text-sm font-medium">{getPartnerName(task.partnerId)}</span>
                          </div>
                        )}
                        {!task.customerId && !task.partnerId && (
                          <span className="text-sm text-muted-foreground">No associations</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.dueDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {task.dueDate.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {task.assignedTo === currentUserId ? (
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                            Assigned to me
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                            I assigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getUserName(task.assignedTo)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getUserName(task.assignedBy)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {task.type.replace('-', ' ')}
                        </Badge>
                        {task.isOnboardingTask && (
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Onboarding
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        {task.status !== 'completed' && (
                         
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              const updaterName = (profile?.first_name || profile?.last_name) 
                                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                                : (user?.email || 'Unknown User');
                              const logDetails = `User "${updaterName}" marked task "${task.title}" (ID: ${task.id}) as completed.`;
                              await updateTask(task.id, { status: 'completed' });
                              await logCrmAction("Update Task Status", logDetails);
                            }}
                          >
                            Mark Complete
                          </Button>
                         
                        )}
                        {task.isOnboardingTask && task.partnerId && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Navigate to partner onboarding - you can implement this navigation
                              console.log('Navigate to partner onboarding:', task.partnerId);
                            }}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
                 
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    No tasks found.
                  </TableCell>
                </TableRow>
              )}
               
            </TableBody>
          </Table>
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredTasks.length > 0 ? indexOfFirstRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastRecord, filteredTasks.length)}</strong> of <strong>{filteredTasks.length}</strong> tasks.
            </div>
            <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManagement;