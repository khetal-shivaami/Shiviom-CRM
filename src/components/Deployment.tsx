import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rocket, Server, UserCheck, CheckCircle, Clock, Search, PlayCircle, Settings2, Send } from 'lucide-react';
import { Customer, Product, User } from '@/types';
import { useToast } from '@/hooks/use-toast';

type DeploymentStatus = 'payment-confirmed' | 'provisioning' | 'setup' | 'onboarding' | 'live' | 'archived';

interface Deployment {
  id: string;
  customerId: string;
  productId: string;
  assignedTo: string;
  paymentDate: Date;
  targetGoLiveDate: Date;
  status: DeploymentStatus;
  notes?: string;
}

const mockDeployments: Deployment[] = [
  { id: 'dep-001', customerId: 'cust-001', productId: 'prod-001', assignedTo: 'user-fsr-1', paymentDate: new Date('2024-07-20'), targetGoLiveDate: new Date('2024-08-01'), status: 'provisioning' },
  { id: 'dep-002', customerId: 'cust-002', productId: 'prod-002', assignedTo: 'user-tl-1', paymentDate: new Date('2024-07-18'), targetGoLiveDate: new Date('2024-07-28'), status: 'setup' },
  { id: 'dep-003', customerId: 'cust-003', productId: 'prod-003', assignedTo: 'user-fsr-2', paymentDate: new Date('2024-07-15'), targetGoLiveDate: new Date('2024-07-25'), status: 'onboarding' },
  { id: 'dep-004', customerId: 'cust-004', productId: 'prod-001', assignedTo: 'user-fsr-1', paymentDate: new Date('2024-07-10'), targetGoLiveDate: new Date('2024-07-20'), status: 'live' },
  { id: 'dep-005', customerId: 'cust-005', productId: 'prod-004', assignedTo: 'user-tl-1', paymentDate: new Date('2024-07-22'), targetGoLiveDate: new Date('2024-08-05'), status: 'payment-confirmed' },
];

interface DeploymentProps {
  customers: Customer[];
  products: Product[];
  users: User[];
}

const DeploymentPage = ({ customers, products, users }: DeploymentProps) => {
  const { toast } = useToast();
  const [deployments, setDeployments] = useState<Deployment[]>(mockDeployments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getCustomer = (id: string) => customers.find(c => c.id === id);
  const getProduct = (id: string) => products.find(p => p.id === id);
  const getUser = (id: string) => users.find(u => u.id === id);

  const filteredDeployments = useMemo(() => {
    return deployments.filter(dep => {
      const customer = getCustomer(dep.customerId);
      const product = getProduct(dep.productId);
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = searchTerm === '' ||
        customer?.name.toLowerCase().includes(searchLower) ||
        customer?.domainName.toLowerCase().includes(searchLower) ||
        product?.name.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || dep.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deployments, searchTerm, statusFilter, customers, products]);

  const deploymentStats = useMemo(() => ({
    inProgress: deployments.filter(d => ['provisioning', 'setup', 'onboarding'].includes(d.status)).length,
    pending: deployments.filter(d => d.status === 'payment-confirmed').length,
    completed: deployments.filter(d => d.status === 'live').length,
  }), [deployments]);

  const getStatusInfo = (status: DeploymentStatus): { label: string; color: string; icon: React.ElementType } => {
    switch (status) {
      case 'payment-confirmed': return { label: 'Payment Confirmed', color: 'bg-gray-100 text-gray-800', icon: Clock };
      case 'provisioning': return { label: 'Provisioning', color: 'bg-blue-100 text-blue-800', icon: Server };
      case 'setup': return { label: 'Setup in Progress', color: 'bg-yellow-100 text-yellow-800', icon: Settings2 };
      case 'onboarding': return { label: 'Onboarding User', color: 'bg-purple-100 text-purple-800', icon: UserCheck };
      case 'live': return { label: 'Live', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'archived': return { label: 'Archived', color: 'bg-gray-400 text-white', icon: CheckCircle };
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const handleUpdateStatus = (deploymentId: string, newStatus: DeploymentStatus) => {
    setDeployments(prev => prev.map(dep => dep.id === deploymentId ? { ...dep, status: newStatus } : dep));
    toast({
      title: 'Deployment Status Updated',
      description: `The deployment status has been changed to "${getStatusInfo(newStatus).label}".`,
    });
  };

  const deploymentStages: DeploymentStatus[] = ['payment-confirmed', 'provisioning', 'setup', 'onboarding', 'live'];

  const getNextStage = (currentStatus: DeploymentStatus): DeploymentStatus | null => {
    const currentIndex = deploymentStages.indexOf(currentStatus);
    if (currentIndex > -1 && currentIndex < deploymentStages.length - 1) {
      return deploymentStages[currentIndex + 1];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Rocket size={28} />
            SaaS Deployment Pipeline
          </h2>
          <p className="text-muted-foreground">
            Manage and track the deployment process for new customers.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deployment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{deploymentStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{deploymentStats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed & Live</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deploymentStats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <CardTitle>Current Deployments</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full md:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {deploymentStages.map(stage => (
                    <SelectItem key={stage} value={stage}>{getStatusInfo(stage).label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Target Go-Live</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeployments.length > 0 ? (
                filteredDeployments.map((dep) => {
                  const customer = getCustomer(dep.customerId);
                  const product = getProduct(dep.productId);
                  const user = getUser(dep.assignedTo);
                  const statusInfo = getStatusInfo(dep.status);
                  const nextStage = getNextStage(dep.status);

                  return (
                    <TableRow key={dep.id}>
                      <TableCell>
                        <div className="font-medium">{customer?.name}</div>
                        <div className="text-sm text-muted-foreground">{customer?.domainName}</div>
                      </TableCell>
                      <TableCell>{product?.name}</TableCell>
                      <TableCell>{user?.name}</TableCell>
                      <TableCell>{dep.paymentDate.toLocaleDateString()}</TableCell>
                      <TableCell>{dep.targetGoLiveDate.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          <statusInfo.icon size={14} className="mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {nextStage ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(dep.id, nextStage)}
                            >
                              <PlayCircle size={16} className="mr-2" />
                              Start {getStatusInfo(nextStage).label}
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" disabled>
                              <CheckCircle size={16} className="mr-2" />
                              Completed
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Send size={16} className="mr-2" />
                            Send Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No deployments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentPage;