import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Mail, Phone, Building, MapPin, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Customer, Partner, Product, User } from '../types';
import CustomerDetail from './CustomerDetail';
import { DateRangePicker } from './DateRangePicker';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface CustomerViewProps {
  products: Product[];
  users: User[];
}

const CustomerView = ({ 
  products, 
  users,
}: CustomerViewProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState(10);
  const recordsPerPage = 20;
  const [partnerPopoverOpen, setPartnerPopoverOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setProgress(prev => (prev >= 95 ? 95 : prev + 5));
      }, 200);
      return () => clearInterval(timer);
    } else {
      setProgress(100);
    }
  }, [loading]);

  useEffect(() => {
    // Reset to first page when search term changes
    setCurrentPage(1);
  }, [searchTerm, partnerFilter, dateRange]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user || !profile) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch partners from Supabase
        const { data: partnersData, error: partnersError } = await supabase
          .from('partners')
          .select('*');

        if (partnersError) {
          throw partnersError;
        }
        setPartners(partnersData || []);
        const localPartners = partnersData || [];

        // Fetch customers from CRM API
        const customerFormData = new FormData();
        customerFormData.append('user_id', user.id);
        customerFormData.append('role', profile.role);

        const response = await fetch(API_ENDPOINTS.GET_RESELLER_CUSTOEMRS_LIST_ONCRM, {
          method: 'POST',
          body: customerFormData,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success || !result.data || !result.data.data_result) {
          throw new Error('Invalid API response structure for customers.');
        }

        const apiCustomers = result.data.data_result;
        const partnerIdMap = new Map(localPartners.map(p => [p.portal_reseller_id, p.id]));

        const transformedData: Customer[] = apiCustomers.map((c: any) => {
          const supabasePartnerId = c.reseller_id ? partnerIdMap.get(c.reseller_id) : undefined;
          return {
            id: c.cust_id,
            name: c.company_name || 'N/A',
            email: c.customer_emailid || '',
            phone: c.customer_contact_number || '',
            company: c.customer_company_name || c.customer_domainname || 'N/A',
            resellerName: c.reseller_name || '',
            domainName: c.customer_domainname,
            partnerId: supabasePartnerId,
            createdAt: new Date(c.created_on),
            status: 'active',
            process: 'won',
            value: 0,
            productIds: [],
            assignedUserIds: [],
          };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setCustomers(transformedData);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [toast, user, profile]);

  const getPartnerName = (partnerId?: string) => {
    if (!partners) {
      return '...';
    }
    const partner = partners.find((p) => p.id === partnerId);
    return partner ? partner.name : 'Unassigned';
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const partnerMatch = partnerFilter === 'all' || customer.partnerId === partnerFilter;

      const dateMatch = !dateRange?.from || (
        customer.createdAt >= dateRange.from &&
        (!dateRange.to || customer.createdAt <= new Date(new Date(dateRange.to).setHours(23, 59, 59, 999)))
      );

      const searchTermLower = searchTerm.toLowerCase();
      const partnerName = getPartnerName(customer.partnerId);

      const searchMatch = searchTerm === '' ||
                           customer.name.toLowerCase().includes(searchTermLower) ||
                           customer.email.toLowerCase().includes(searchTermLower) ||
                           customer.company.toLowerCase().includes(searchTermLower) ||
                           customer.resellerName.toLowerCase().includes(searchTermLower) ||
                           (customer.domainName && customer.domainName.toLowerCase().includes(searchTermLower)) ||
                           partnerName.toLowerCase().includes(searchTermLower);

      return partnerMatch && dateMatch && searchMatch;
    });
  }, [customers, searchTerm, partnerFilter, dateRange, partners]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentCustomerRecords = filteredCustomers.slice(indexOfFirstRecord, indexOfLastRecord);


  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleBackToList = () => {
    setSelectedCustomer(null);
  };

  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    // Update the list of customers
    setCustomers(prev => prev.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    
    // Update the selected customer to reflect changes immediately in the detail view
    setSelectedCustomer(updatedCustomer);
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
    total: filteredCustomers.length,
    totalValue: filteredCustomers.reduce((sum, customer) => sum + customer.value, 0),
    activeProducts: new Set(filteredCustomers.flatMap(c => c.productIds || [])).size,
    avgValue: filteredCustomers.length > 0 ? filteredCustomers.reduce((sum, customer) => sum + customer.value, 0) / filteredCustomers.length : 0
  };

  const paginationControls = (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        Showing <strong>{filteredCustomers.length > 0 ? indexOfFirstRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastRecord, filteredCustomers.length)}</strong> of <strong>{filteredCustomers.length}</strong> customers.
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
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Loading customer data...</p>
        <Progress value={progress} className="w-1/2" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading customers: {error}</div>;
  }

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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, domain, partner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover open={partnerPopoverOpen} onOpenChange={setPartnerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={partnerPopoverOpen}
                  className="w-full md:w-[200px] justify-between"
                >
                  {partnerFilter === 'all'
                    ? "All Partners"
                    : partners.find((partner) => partner.id === partnerFilter)?.name || "Select partner..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search partner..." />
                  <CommandList>
                    <CommandEmpty>No partner found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setPartnerFilter("all");
                          setPartnerPopoverOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", partnerFilter === "all" ? "opacity-100" : "opacity-0")} />
                        All Partners
                      </CommandItem>
                      {partners.map((partner) => (
                        <CommandItem
                          key={partner.id}
                          value={partner.name}
                          onSelect={() => {
                            setPartnerFilter(partner.id);
                            setPartnerPopoverOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", partnerFilter === partner.id ? "opacity-100" : "opacity-0")} />
                          {partner.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Customers ({filteredCustomers.length} of {customers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginationControls}
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
              {currentCustomerRecords.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <Building size={16} className="text-muted-foreground" />
                        {customer.domainName}
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
                      Partner: {customer.resellerName || getPartnerName(customer.partnerId)}
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
          {paginationControls}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerView;