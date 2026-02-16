import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Partner, Customer } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, X, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@radix-ui/react-label';
import { useAuth } from '@/contexts/AuthContext';

interface AddPartnerDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPartnerDomainDialog = ({ open, onOpenChange }: AddPartnerDomainDialogProps) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCustomerDomainDialogOpen, setIsAddCustomerDomainDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerCustomers, setPartnerCustomers] = useState<Customer[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newDomainPrice, setNewDomainPrice] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async (partner: Partner) => {
    if (!partner.email) {
      toast({ title: "Error", description: "Selected partner has no email.", variant: "destructive" });
      return;
    }
    console.log(`Fetching customers for partner: ${partner.email}`);
    setIsCustomersLoading(true);
    setPartnerCustomers([]);
    try {
      const formData = new FormData();
      formData.append('reseller_email', partner.email);

      const response = await fetch(API_ENDPOINTS.GET_CUSTOMER_LIST_OF_RESELLER_CRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data?.data_result) {
        const mappedCustomers: Customer[] = result.data.data_result.map((c: any) => ({
          id: c.cust_id || c.customer_domainname, // Use cust_id or domainname as ID
          name: c.customer_name || 'N/A',
          email: c.customer_emailid || '',
          phone: c.customer_contact_number || '',
          company: c.customer_company_name || c.customer_domainname,
          domainName: c.customer_domainname,
          createdAt: c.created_on ? new Date(c.created_on) : new Date(),
          status: 'active',
          process: 'won',
          value: 0,
        }));
        setPartnerCustomers(mappedCustomers);
      } else {
        setPartnerCustomers([]);
        toast({ title: "Info", description: result.message || "No customers found for this partner.", variant: "default" });
      }
    } catch (error: any) {
      toast({ title: "Error fetching customers", description: error.message, variant: "destructive" });
    } finally {
      setIsCustomersLoading(false);
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
      formData.append('path', 'Add Partner Domain Dialog');
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

  useEffect(() => {
    if (open) {
      const fetchPartners = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('partners').select('*');
        if (error) {
          console.error('Error fetching partners:', error);
          toast({ title: "Error", description: "Failed to fetch partners.", variant: "destructive" });
          setPartners([]); // Ensure partners is empty on error
        } else {
          setPartners(data as Partner[]);
        }
        setIsLoading(false);
      };
      fetchPartners();
    }
 else {
      // Reset state when dialog closes
      setSearchTerm('');
      setSelectedPartner(null);
      setIsAddCustomerDomainDialogOpen(false); // Close add domain dialog
      setPartnerCustomers([]);
      setNewDomainName('');
      setNewCustomerName('');
      setNewCustomerEmail('');
      setNewDomainPrice('');
    }
  }, [open, toast]);

  useEffect(() => {
    if (selectedPartner) {
      fetchCustomers(selectedPartner);
    }
  }, [selectedPartner]);

  const handleAddCustomerDomain = async () => {
    if (!selectedPartner) {
      toast({ title: "Error", description: "No partner selected.", variant: "destructive" });
      return;
    }
    if (!newDomainName.trim()) {
      toast({ title: "Error", description: "Domain name cannot be empty.", variant: "destructive" });
      return;
    }

    setIsCustomersLoading(true); // Use this to show loading for the add action
    try {
      const customerToInsert = {
        name: newCustomerName.trim() || ``,
        email: newCustomerEmail.trim() || ``, // Default email
        company: newDomainName.trim(), // Default company to domain name
        customer_domain: newDomainName.trim(),
        partner_id: selectedPartner.portal_reseller_id,
        value: Number(newDomainPrice) || 0,
        reseller_email: selectedPartner.email,
      };

      const response = await fetch(API_ENDPOINTS.STORE_PARTNER_DOMAIN_ONCRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerToInsert),
      });

      const result = await response.json();
      console.log(result);
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to add customer domain.');
      }

      const logDetails = `Added new domain "${newDomainName}" for partner ${selectedPartner.name} (ID: ${selectedPartner.portal_reseller_id}).`;
      await logCrmAction("Add Partner Domain", logDetails);

      toast({ title: "Success", description: `Domain "${newDomainName}" added for ${selectedPartner.name}.` });
      setIsAddCustomerDomainDialogOpen(false);
      setNewDomainName('');
      setNewCustomerEmail('');
      setNewDomainPrice('');
      await fetchCustomers(selectedPartner);
    } catch (error: any) {
      toast({ title: "Error adding domain", description: error.message, variant: "destructive" });
    } finally {
      setIsCustomersLoading(false);
      setNewCustomerName(''); // Reset customer name even on error

    }
  };

  const filteredPartners = partners.filter(partner => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      partner.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      partner.company.toLowerCase().includes(lowerCaseSearchTerm) ||
      partner.email.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [partners, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Partner Domains</DialogTitle>
          <DialogDescription>
            Select a partner to view their associated customer domains.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
          {/* Left Pane: Partner List and Search */}
          <div className="md:col-span-1 flex flex-col h-full border-r pr-4 overflow-hidden">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-8"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <ScrollArea className="flex-grow">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPartners.map((partner) => (
                    <div
                      key={partner.id}
                      onClick={() => setSelectedPartner(partner)}
                      className={cn(
                        "p-3 border rounded-md cursor-pointer transition-colors",
                        selectedPartner?.id === partner.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <p className="font-semibold">{partner.name}</p>
                      <p className="text-sm">{partner.company}</p>
                      <p className="text-xs opacity-80">{partner.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Pane: Customer Details */}
          <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {selectedPartner ? `Customers of ${selectedPartner.name}` : 'Select a Partner'}
            </h3>
            {selectedPartner && (
              <Button size="sm" onClick={() => setIsAddCustomerDomainDialogOpen(true)} className="gap-1">
                <PlusCircle className="h-4 w-4" /> Add Domain
              </Button>
            )}
            </div>
            <ScrollArea className="flex-grow">
              {isCustomersLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading customers...</span>
                </div>
              ) : !selectedPartner ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a partner from the left to view their customers.
                </div>
              ) : partnerCustomers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.domainName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No customers found for this partner.
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* Add Customer Domain Dialog */}
      <Dialog open={isAddCustomerDomainDialogOpen} onOpenChange={setIsAddCustomerDomainDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Domain for {selectedPartner?.name}</DialogTitle>
            <DialogDescription>
              Enter the details for the new customer domain.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain-name">Domain Name *</Label>
              <Input
                id="domain-name"
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                placeholder="e.g., example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Customer Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="e.g., john.doe@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-price">Price</Label>
              <Input
                id="domain-price"
                type="number"
                value={newDomainPrice}
                onChange={(e) => setNewDomainPrice(e.target.value)}
                placeholder="e.g., 5000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddCustomerDomainDialogOpen(false)} disabled={isCustomersLoading}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddCustomerDomain} disabled={isCustomersLoading || !newDomainName.trim()}>
              {isCustomersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};