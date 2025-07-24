import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Filter, Plus, Calendar, Clock, AlertCircle, CheckCircle, User, Building, Users, ArrowLeft, Edit, LinkIcon } from 'lucide-react';
import { Task, Customer, Partner, User as UserType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskManager } from '@/hooks/useTaskManager';

interface TaskManagementProps {
  customers: Customer[];
  partners: Partner[];
  users: UserType[];
  currentUserId?: string;
}

const TaskManagement = ({ customers, partners, users, currentUserId }: TaskManagementProps) => {
  const { isAdmin } = useAuth();
  const { tasks, loading, createTask, updateTask, deleteTask, markTaskComplete } = useTaskManager();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [onboardingFilter, setOnboardingFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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

  // Filter tasks based on user role and permissions
  const userRelevantTasks = tasks.filter(task => {
    if (!currentUserId) return false;
    // Admin users can see all tasks
    if (isAdmin) return true;
    // Regular users can only see tasks assigned to them or assigned by them
    return task.assignedTo === currentUserId || task.assignedBy === currentUserId;
  });

  // Filter tasks based on search and filter criteria
  const filteredTasks = userRelevantTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCustomerName(task.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getPartnerName(task.partnerId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || task.type === typeFilter;
    const matchesOnboarding = onboardingFilter === 'all' || 
      (onboardingFilter === 'onboarding' && task.isOnboardingTask) ||
      (onboardingFilter === 'regular' && !task.isOnboardingTask);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesOnboarding;
  });

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

  const getCustomerName = (customerId?: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '';
  };

  const getPartnerName = (partnerId?: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : '';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };


  const stats = {
    total: userRelevantTasks.length,
    pending: userRelevantTasks.filter(t => t.status === 'pending').length,
    inProgress: userRelevantTasks.filter(t => t.status === 'in-progress').length,
    completed: userRelevantTasks.filter(t => t.status === 'completed').length,
    overdue: userRelevantTasks.filter(t => t.status === 'overdue').length
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignedTo) {
      return;
    }

    try {
      await createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        type: newTask.type,
        status: 'pending',
        assignedTo: newTask.assignedTo,
        customerId: newTask.customerId === 'none' ? undefined : newTask.customerId,
        partnerId: newTask.partnerId === 'none' ? undefined : newTask.partnerId,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      });

      setShowCreateDialog(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        type: 'other',
        customerId: 'none',
        partnerId: 'none',
        dueDate: '',
        assignedTo: ''
      });
    } catch (error) {
      console.error('Error creating task:', error);
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
                      <div className="text-sm text-muted-foreground">{getCustomerName(selectedTask.customerId)}</div>
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
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner">Partner (Optional)</Label>
                  <Select 
                    value={newTask.partnerId} 
                    onValueChange={(value) => {
                      const partnerId = value === 'none' ? '' : value;
                      setNewTask({
                        ...newTask, 
                        partnerId, 
                        customerId: 'none' // Reset customer when partner changes
                      });
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
                  <Label htmlFor="customer">Customer (Optional)</Label>
                  <Select 
                    value={newTask.customerId} 
                    onValueChange={(value) => setNewTask({...newTask, customerId: value === 'none' ? '' : value})}
                    disabled={!newTask.partnerId || newTask.partnerId === 'none'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !newTask.partnerId || newTask.partnerId === 'none' 
                          ? "Select partner first" 
                          : "Select customer"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Customer</SelectItem>
                      {customers
                        .filter(customer => customer.partnerId === newTask.partnerId)
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.company}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedTo">Assign To</Label>
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
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="document-review">Document Review</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
                <TableHead>Assigned By</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
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
                          <span className="text-sm font-medium">{getCustomerName(task.customerId)}</span>
                        </div>
                      )}
                      {task.partnerId && (
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
                          onClick={() => markTaskComplete(task.id)}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManagement;