
import { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Customer, Partner, Product, User } from '../types';
import CustomerTableHeader from './CustomerTableHeader';
import CustomerTableFilters from './CustomerTableFilters';
import CustomerTableRow from './CustomerTableRow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerTableProps {
  partners: Partner[];
  products: Product[];
  users: User[];
}

const CustomerTable = ({ 
  partners, 
  products, 
  users,
}: CustomerTableProps) => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processFilter, setProcessFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [valueFilter, setValueFilter] = useState(0);
  const [zoneFilter, setZoneFilter] = useState('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      if (data) {
        const transformedData: Customer[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone,
          company: item.company,
          status: item.status,
          process: item.process,
          value: item.value,
          zone: item.zone,
          partnerId: item.partner_id,
          productIds: item.product_ids,
          assignedUserIds: item.assigned_user_ids,
          createdAt: new Date(item.created_at),
          lastEdited: item.last_edited ? new Date(item.last_edited) : undefined,
        }));
        setCustomers(transformedData);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching customers:", err);
      toast({ title: "Error", description: "Failed to load customer data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchMatch = searchTerm === '' || 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === 'all' || customer.status === statusFilter;
      const processMatch = processFilter === 'all' || customer.process === processFilter;
      const partnerMatch = 
        partnerFilter === 'all' || 
        (partnerFilter === 'unassigned' && !customer.partnerId) ||
        customer.partnerId === partnerFilter;
      const valueMatch = customer.value >= valueFilter;
      const zoneMatch = zoneFilter === 'all' || customer.zone === zoneFilter;
      
      return searchMatch && statusMatch && processMatch && partnerMatch && valueMatch && zoneMatch;
    });
  }, [customers, searchTerm, statusFilter, processFilter, partnerFilter, valueFilter, zoneFilter]);

  const handleStatusToggle = async (customerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const { error } = await supabase
      .from('customers')
      .update({ status: newStatus })
      .eq('id', customerId);

    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    } else {
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, status: newStatus as Customer['status'] } : c
      ));
      toast({ title: 'Status updated successfully' });
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(customer => customer.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCustomers.length === 0) return;
    
    const statusMap: { [key: string]: Customer['status'] } = {
      'activate': 'active',
      'deactivate': 'inactive',
      'pending': 'pending'
    };

    const newStatus = statusMap[action];
    if (!newStatus) return;

    const { error } = await supabase
      .from('customers')
      .update({ status: newStatus })
      .in('id', selectedCustomers);

    if (error) {
      toast({ title: 'Error updating statuses', description: error.message, variant: 'destructive' });
    } else {
      setCustomers(prev => prev.map(c => 
        selectedCustomers.includes(c.id) ? { ...c, status: newStatus } : c
      ));
      toast({ title: 'Bulk status update successful' });
    }
    setSelectedCustomers([]);
  };

  const handleBulkImport = async (importedData: any[]) => {
    const customersToInsert = importedData.map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      status: c.status || 'pending',
      value: c.value || 0,
      zone: c.zone || null,
      partner_id: c.partnerId || null,
      product_ids: c.productIds || null,
    }));

    const { error } = await supabase.from('customers').insert(customersToInsert);

    if (error) {
      toast({ title: 'Error importing customers', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Import successful', description: `${importedData.length} customers imported.` });
      fetchCustomers(); // Refetch data
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CustomerTableHeader
            filteredCount={filteredCustomers.length}
            totalCount={customers.length}
            selectedCount={selectedCustomers.length}
            onBulkImport={handleBulkImport}
            onBulkAction={handleBulkAction}
          />
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <CustomerTableFilters
              partners={partners}
              products={products}
              onStatusFilter={setStatusFilter}
              onProcessFilter={setProcessFilter}
              onPartnerFilter={setPartnerFilter}
              onZoneFilter={setZoneFilter}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-red-500">
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.map((customer) => (
                  <CustomerTableRow
                    key={customer.id}
                    customer={customer}
                    partners={partners}
                    products={products}
                    users={users}
                    isSelected={selectedCustomers.includes(customer.id)}
                    onSelect={handleSelectCustomer}
                    onStatusToggle={handleStatusToggle}
                  />
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerTable;
