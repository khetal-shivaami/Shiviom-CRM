import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, PlusCircle, XCircle, Search, X } from 'lucide-react';
import { Partner, Customer } from '../types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface MapCustomersDialogProps {
  partners: Partner[];
  customers: Customer[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const MapCustomersDialog = ({ partners, customers, open, onOpenChange, onSuccess }: MapCustomersDialogProps) => {
  const { toast } = useToast();
    const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [mappedCustomers, setMappedCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

    const logCrmAction = async (actiontype: string, details: string) => {
        if (!user?.id) {
            console.error("User ID not available for logging CRM action.");
            return;
        }
        try {
            const formData = new FormData();
            formData.append('userid', user.id);
            formData.append('actiontype', actiontype);
            formData.append('path', 'Map Customers Dialog');
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
            // We probably don't want to show a toast for a background logging failure
        }
    };
  useEffect(() => {
    const fetchAvailableCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const response = await fetch(API_ENDPOINTS.GET_RESELLER_CUSTOEMRS_LIST_ONCRM, {
          method: 'POST', // Assuming POST based on other API calls
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result)
        if (!result.success || !result.data || !result.data.data_result) {
          throw new Error('Invalid API response structure for available customers.');
        }

        const allCustomers: Customer[] = result.data.data_result.map((c: any) => ({
          id: c.cust_id,
          name: c.customer_name || c.customer_domainname,
          email: c.customer_emailid || '',
          phone: c.customer_contact_number || '',
          company: c.customer_company_name || c.customer_domainname,
          domainName: c.customer_domainname,
          partnerId: c.reseller_id,
          createdAt: new Date(c.created_on),
          status: 'active', // Default value
          value: 0, // Default value
        }));

        // Filter for customers that are not assigned to any reseller
        setAvailableCustomers(allCustomers);

      } catch (error: any) {
        toast({ title: "Error fetching available customers", description: error.message, variant: "destructive",duration: 2000 });
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    if (open) {
      fetchAvailableCustomers();
      setMappedCustomers([]);
      setSelectedPartnerId(null);
      setSearch('');
    }
  }, [open, toast]);

  const filteredAvailableCustomers = useMemo(() => {
    if (!search) return availableCustomers;
    return availableCustomers.filter(c =>
      c.domainName?.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableCustomers, search]);

  const handleSelectCustomer = (customer: Customer) => {
    setAvailableCustomers(prev => prev.filter(c => c.id !== customer.id));
    setMappedCustomers(prev => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleUnselectCustomer = (customer: Customer) => {
    setMappedCustomers(prev => prev.filter(c => c.id !== customer.id));
    setAvailableCustomers(prev => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleMapCustomers = async () => {
    if (!selectedPartnerId) {
      toast({ title: "No Partner Selected", description: "Please select a partner to map customers to.", variant: "destructive",duration: 2000 });
      return;
    }
    if (mappedCustomers.length === 0) {
      toast({ title: "No Customers Selected", description: "Please select at least one customer to map.", variant: "destructive",duration: 2000 });
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the selected partner object to access its properties
      const selectedPartnerObject = partners.find(p => p.id === selectedPartnerId);
      if (!selectedPartnerObject) {
        throw new Error("Could not find the selected partner details.");
      }
      const portalResellerId = selectedPartnerObject.id;
      const customerIds = mappedCustomers.map(c => c.id);

      // As requested, printing the IDs to the console
      console.log("Selected Partner's portal_reseller_id from Supabase:", portalResellerId);
      console.log("Selected Customer IDs (cust_id):", customerIds);

      const payload = {
        reseller_id: portalResellerId, // Using portal_reseller_id for the API call
        customer_id: customerIds,
      };

      const response = await fetch(API_ENDPOINTS.MAP_CUSTOMER_PARTNER_ONCRM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to map customers.');
      }

      toast({
        title: "Success",
        description: `${mappedCustomers.length} customer(s) have been mapped successfully.`,
        duration: 2000,
      });
      onSuccess();
         const logDetails = `Mapped ${mappedCustomers.length} customer(s) to partner ID ${portalResellerId}.`;
            await logCrmAction("Map Customers", logDetails);
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to map customers: ${error.message}`, variant: "destructive",duration: 2000, });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Map Customers to Partner</DialogTitle>
          <DialogDescription>Select a partner and assign unmapped customers to them.</DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between">
                {selectedPartner ? selectedPartner.name : "Select a partner..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search partner by name, email, or company..." />
                <CommandList className="max-h-[250px]">
                  <CommandEmpty>No partner found.</CommandEmpty>
                  <CommandGroup>
                    {partners.map((partner) => (
                      <CommandItem
                        key={partner.id}
                        value={`${partner.name} ${partner.email} ${partner.company}`}
                        onSelect={() => {
                          setSelectedPartnerId(partner.id);
                          setPopoverOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedPartnerId === partner.id ? "opacity-100" : "opacity-0")} />
                        {partner.name} ({partner.company})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-grow overflow-hidden">
          {/* Left Panel: Available Customers */}
          <div className="border rounded-lg flex flex-col">
            <div className="p-2 border-b">
              <h3 className="font-semibold">All Domains ({filteredAvailableCustomers.length})</h3>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search domains..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 pr-8" />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearch('')}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="flex-grow max-h-80">
              {isLoadingCustomers ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading available customers...
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredAvailableCustomers.map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                      <span className="text-sm">{customer.domainName}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSelectCustomer(customer)}>
                        <PlusCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel: Mapped Customers */}
          <div className="border rounded-lg flex flex-col">
            <div className="p-2 border-b">
              <h3 className="font-semibold">Customers to Map ({mappedCustomers.length})</h3>
            </div>
            <ScrollArea className="flex-grow">
              <div className="p-2 space-y-1">
                {mappedCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center p-4">Select customers from the left panel to add them here.</p>
                ) : (
                  mappedCustomers.map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <span className="text-sm">{customer.domainName || customer.name}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUnselectCustomer(customer)}>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMapCustomers} disabled={isSubmitting || mappedCustomers.length === 0 || !selectedPartnerId}>
            {isSubmitting ? 'Mapping...' : `Map ${mappedCustomers.length} Customer(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};