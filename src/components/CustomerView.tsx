import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Mail, Phone, Building, MapPin } from 'lucide-react';
import { Customer, Partner, Product, User } from '../types';
import CustomerDetail from './CustomerDetail';

interface CustomerViewProps {
  customers: Customer[];
  partners: Partner[];
  products: Product[];
  users: User[];
  onCustomerUpdate?: (customerId: string, updates: Partial<Customer>) => void;
}

const CustomerView = ({ 
  customers, 
  partners, 
  products, 
  users,
  onCustomerUpdate
}: CustomerViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter for customers only (won or deployment)
  const customersList = useMemo(() => {
    return customers.filter(customer => 
      customer.process === 'won' || customer.process === 'deployment'
    );
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customersList.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.company.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [customersList, searchTerm]);

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleBackToList = () => {
    setSelectedCustomer(null);
  };

  const handleCustomerUpdate = (customerId: string, updates: Partial<Customer>) => {
    const updatedCustomer = { ...updates, lastEdited: new Date() };
    onCustomerUpdate?.(customerId, updatedCustomer);
  };

  const getPartnerName = (partnerId?: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : 'Unassigned';
  };

  const getProductNames = (productIds?: string[]) => {
    if (!productIds || productIds.length === 0) return 'None';
    return productIds
      .map(id => products.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getAssignedUserNames = (userIds?: string[]) => {
    if (!userIds || userIds.length === 0) return 'Unassigned';
    return userIds
      .map(id => users.find(u => u.id === id)?.name)
      .filter(Boolean)
      .join(', ');
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

  const stats = {
    total: customersList.length,
    totalValue: customersList.reduce((sum, customer) => sum + customer.value, 0),
    activeProducts: new Set(customersList.flatMap(c => c.productIds || [])).size,
    avgValue: customersList.length > 0 ? customersList.reduce((sum, customer) => sum + customer.value, 0) / customersList.length : 0
  };

  if (selectedCustomer) {
    return (
      <CustomerDetail 
        customer={selectedCustomer} 
        partners={partners}
        products={products}
        users={users}
        onBack={handleBackToList} 
        onCustomerUpdate={handleCustomerUpdate} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-muted-foreground">View and manage your customer relationships</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString('en-IN')}</div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
            <p className="text-sm text-muted-foreground">Active Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">₹{stats.avgValue.toLocaleString('en-IN')}</div>
            <p className="text-sm text-muted-foreground">Avg. Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Customers ({filteredCustomers.length} of {customersList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Details</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Account Manager</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Contract Value</TableHead>
                <TableHead>Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <Building size={16} className="text-muted-foreground" />
                        {customer.company}
                      </div>
                      <div className="text-sm text-muted-foreground">{customer.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-muted-foreground" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-muted-foreground" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {getAssignedUserNames(customer.assignedUserIds)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Partner: {getPartnerName(customer.partnerId)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm">{getProductNames(customer.productIds)}</div>
                  </TableCell>
                  <TableCell>
                    {customer.zone ? (
                      <Badge className={getZoneColor(customer.zone)}>
                        <MapPin size={12} className="mr-1" />
                        {customer.zone.charAt(0).toUpperCase() + customer.zone.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{customer.value.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.createdAt.toLocaleDateString()}
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

export default CustomerView;