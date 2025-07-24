import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, AlertTriangle, CheckCircle, Clock, XCircle, Phone, Mail, Filter, ChevronDown, Users, Download, Send, Trash2, Edit, UserIcon, Eye, X } from 'lucide-react';
import { Renewal, Customer, Partner, Product, User } from '../types';
import RenewalEmailDialog from './RenewalEmailDialog';
import BulkRenewalEmailDialog from './BulkRenewalEmailDialog';
import CustomerDetailDialog from './CustomerDetailDialog';

interface RenewalsProps {
  renewals: Renewal[];
  customers: Customer[];
  partners: Partner[];
  products: Product[];
  users?: User[];
}

const Renewals = ({ renewals, customers, partners, products, users = [] }: RenewalsProps) => {
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection states
  const [selectedRenewals, setSelectedRenewals] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Dialog states
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const filteredRenewals = useMemo(() => {
    return renewals.filter(renewal => {
      // Status filter
      if (statusFilter !== 'all' && renewal.status !== statusFilter) return false;
      
      // Partner filter
      if (partnerFilter !== 'all' && renewal.partnerId !== partnerFilter) return false;
      
      // Product filter
      if (productFilter !== 'all' && renewal.productId !== productFilter) return false;
      
      // Date filter
      if (dateFilter !== 'all') {
        const today = new Date();
        const renewalDate = new Date(renewal.renewalDate);
        const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            if (daysUntil !== 0) return false;
            break;
          case 'week':
            if (daysUntil < 0 || daysUntil > 7) return false;
            break;
          case 'month':
            if (daysUntil < 0 || daysUntil > 30) return false;
            break;
          case 'overdue':
            if (daysUntil >= 0) return false;
            break;
        }
      }
      
      // Search filter
      if (searchTerm) {
        const customerName = getCustomerName(renewal.customerId).toLowerCase();
        const partnerName = getPartnerName(renewal.partnerId).toLowerCase();
        const productName = getProductName(renewal.productId).toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        if (!customerName.includes(searchLower) && 
            !partnerName.includes(searchLower) && 
            !productName.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  }, [renewals, statusFilter, partnerFilter, productFilter, dateFilter, searchTerm]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getCustomer = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : 'Unknown Partner';
  };

  const getPartner = (partnerId: string) => {
    return partners.find(p => p.id === partnerId);
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const getAssignedEmployees = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (partner?.assignedUserIds) {
      return users.filter(u => partner.assignedUserIds?.includes(u.id));
    }
    return [];
  };

  const getFirstAssignedEmployee = (partnerId: string) => {
    const assignedEmployees = getAssignedEmployees(partnerId);
    return assignedEmployees.length > 0 ? assignedEmployees[0] : undefined;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'due': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'renewed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock size={16} className="text-blue-600" />;
      case 'due': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'overdue': return <XCircle size={16} className="text-red-600" />;
      case 'renewed': return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled': return <XCircle size={16} className="text-gray-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getDaysUntilRenewal = (renewalDate: Date) => {
    const today = new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRenewals(filteredRenewals.map(r => r.id));
    } else {
      setSelectedRenewals([]);
    }
  };

  const handleSelectRenewal = (renewalId: string, checked: boolean) => {
    if (checked) {
      setSelectedRenewals([...selectedRenewals, renewalId]);
    } else {
      setSelectedRenewals(selectedRenewals.filter(id => id !== renewalId));
    }
  };

  const handleCustomerClick = (customerId: string, partnerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    const partner = partners.find(p => p.id === partnerId);
    setSelectedCustomer(customer || null);
    setSelectedPartner(partner || null);
    setCustomerDetailOpen(true);
  };

  // Bulk actions
  const selectedRenewalObjects = filteredRenewals.filter(r => selectedRenewals.includes(r.id));

  const handleBulkEmail = () => {
    setBulkEmailOpen(true);
  };

  const handleBulkStatusUpdate = (newStatus: string) => {
    console.log('Updating status for renewals:', selectedRenewals, 'to:', newStatus);
    // Implement bulk status update logic here
    setSelectedRenewals([]);
  };

  const handleExportSelected = () => {
    console.log('Exporting selected renewals:', selectedRenewals);
    // Implement export logic here
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPartnerFilter('all');
    setProductFilter('all');
    setDateFilter('all');
    setSearchTerm('');
  };

  const totalValue = filteredRenewals.reduce((sum, renewal) => sum + renewal.contractValue, 0);
  const urgentRenewals = renewals.filter(r => r.status === 'due' || r.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Renewals</p>
                <p className="text-2xl font-bold">{renewals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{urgentRenewals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Renewed</p>
                <p className="text-2xl font-bold">{renewals.filter(r => r.status === 'renewed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="text-purple-600">₹</div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">₹{totalValue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle>Renewal Management</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search customers, partners, products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter size={16} />
                      Filters
                      <ChevronDown size={16} className={showFilters ? "rotate-180" : ""} />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </div>
            </div>
            
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="due">Due</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="renewed">Renewed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Partner</label>
                    <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Partners" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Partners</SelectItem>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Product</label>
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Due Date</label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Due Today</SelectItem>
                        <SelectItem value="week">Due This Week</SelectItem>
                        <SelectItem value="month">Due This Month</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear All Filters
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredRenewals.length} of {renewals.length} renewals
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Bulk Actions Bar */}
            {selectedRenewals.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedRenewals.length} of {filteredRenewals.length} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleBulkEmail} className="gap-1">
                      <Send size={14} />
                      Send Emails
                    </Button>
                    <Select onValueChange={handleBulkStatusUpdate}>
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Set Upcoming</SelectItem>
                        <SelectItem value="due">Set Due</SelectItem>
                        <SelectItem value="renewed">Set Renewed</SelectItem>
                        <SelectItem value="cancelled">Set Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={handleExportSelected} className="gap-1">
                      <Download size={14} />
                      Export
                    </Button>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedRenewals([])}
                  className="gap-1"
                >
                  <X size={14} />
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRenewals.length === filteredRenewals.length && filteredRenewals.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Contract Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRenewals.map((renewal) => {
                const daysLeft = getDaysUntilRenewal(renewal.renewalDate);
                const customer = getCustomer(renewal.customerId);
                const partner = getPartner(renewal.partnerId);
                const assignedEmployee = getFirstAssignedEmployee(renewal.partnerId);
                const isSelected = selectedRenewals.includes(renewal.id);
                
                return (
                  <TableRow key={renewal.id} className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRenewal(renewal.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-left"
                        onClick={() => handleCustomerClick(renewal.customerId, renewal.partnerId)}
                      >
                        {getCustomerName(renewal.customerId)}
                      </Button>
                    </TableCell>
                    <TableCell>{getPartnerName(renewal.partnerId)}</TableCell>
                    <TableCell>{getProductName(renewal.productId)}</TableCell>
                    <TableCell>{renewal.renewalDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        daysLeft < 0 ? 'text-red-600' : 
                        daysLeft <= 30 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : 
                         daysLeft === 0 ? 'Due today' : 
                         `${daysLeft} days`}
                      </span>
                    </TableCell>
                    <TableCell>₹{renewal.contractValue.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(renewal.status)}
                        <Badge className={getStatusColor(renewal.status)}>
                          {renewal.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renewal.lastContactDate ? 
                        renewal.lastContactDate.toLocaleDateString() : 
                        'No contact'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Phone size={14} />
                          Contact
                        </Button>
                        {customer && partner && (
                          <RenewalEmailDialog
                            renewal={renewal}
                            customer={customer}
                            partner={partner}
                            assignedEmployee={assignedEmployee}
                          >
                            <Button variant="outline" size="sm" className="gap-1">
                              <Mail size={14} />
                              Email
                            </Button>
                          </RenewalEmailDialog>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleCustomerClick(renewal.customerId, renewal.partnerId)}
                        >
                          <Eye size={14} />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BulkRenewalEmailDialog
        renewals={selectedRenewalObjects}
        customers={customers}
        partners={partners}
        users={users}
        open={bulkEmailOpen}
        onOpenChange={setBulkEmailOpen}
      />

      <CustomerDetailDialog
        customer={selectedCustomer}
        partner={selectedPartner}
        products={products}
        users={users}
        open={customerDetailOpen}
        onOpenChange={setCustomerDetailOpen}
      />
    </div>
  );
};

export default Renewals;
