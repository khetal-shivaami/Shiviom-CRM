import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, PlusCircle, ChevronsUpDown, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Partner, Customer } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS } from '@/config/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionForLicense {
  id: string;
  skuName: string;
  domainName: string;
  plan: string;
  usedSeats: string;
  maxSeats: string;
  status: string;
  renewalDate?: Date;
  custId: string;
  resellerName?: string; // Add resellerName
  resellerEmail?: string; // Add resellerEmail
  resellerType?: string; // Add resellerType
}

const AddLicense: React.FC = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionForLicense[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [domainSearch, setDomainSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [openPartnerPopover, setOpenPartnerPopover] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionForLicense | null>(null);
  const [isAddLicenseModalOpen, setIsAddLicenseModalOpen] = useState(false);
  const [licensesToAdd, setLicensesToAdd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const RECORDS_PER_PAGE = 10;

  // Fetch partners on component mount
  useEffect(() => {
    const fetchPartners = async () => {
      setIsLoadingPartners(true);
      try {
        let allPartners: Partner[] = [];
        const CHUNK_SIZE = 1000; // Supabase default limit
        let from = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('partners')
            .select('id, name, company, email, portal_reseller_id')
            .range(from, from + CHUNK_SIZE - 1);

          if (error) throw error;

          if (data) {
            allPartners = [...allPartners, ...data];
          }

          if (!data || data.length < CHUNK_SIZE) {
            hasMore = false;
          } else {
            from += data.length;
          }
        }
        setPartners(allPartners as Partner[]);
      } catch (error: any) {
        toast({ title: "Error fetching partners", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingPartners(false);
      }
    };
    fetchPartners();
  }, [toast]);

  const fetchSubscriptions = async (params: { partnerEmail?: string; domainName?: string }) => {
    if (!params.partnerEmail && !params.domainName) {
      setSubscriptions([]);
      setShowResults(false);
      return;
    }

    setIsLoadingCustomers(true);
    setShowResults(true); // Show the results card with loading indicator
    try {
      let apiUrl = '';
      const formData = new FormData();
      if (params.partnerEmail) {
        formData.append('reseller_email', params.partnerEmail);
        apiUrl = API_ENDPOINTS.GET_DOMAIN_LIST_OF_RESELLER_ADDLICENSE_ONCRM;
      }
      if (params.domainName) {
        formData.append('domain_name', params.domainName);
        apiUrl = API_ENDPOINTS.GET_DOMAIN_OF_RESELLER_ADDLICENSE_ONCRM; // Use the specified API for domain search
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });


      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success || !result.data || result.data.length === 0) {
        setSubscriptions([]);
        if (params.domainName) { // Only show "not found" for explicit domain searches
          toast({ title: "Not Found", description: result.message || "No subscription found for the given domain.", variant: "default" });
        }
        return;
      }

      const apiSubscriptions = result.data;
      const mappedSubscriptions: SubscriptionForLicense[] = apiSubscriptions.map((sub: any) => ({
        id: sub.subscriptionid,
        custId: sub.domainname || sub.subscription_details?.customerDomain,
        skuName: sub.subscription_details?.skuName || 'N/A',
        domainName: sub.domainname || sub.subscription_details?.customerDomain,
        plan: sub.subscription_details?.plan || 'N/A',
        usedSeats: sub.subscription_details?.usedSeats || 'N/A',
        maxSeats: sub.subscription_details?.maxSeats || 'N/A',
        status: sub.subscription_details?.status || 'UNKNOWN',
        renewalDate: sub.subscription_details?.shivaami_renewal_date ? new Date(sub.subscription_details.shivaami_renewal_date) : undefined,
        resellerName: sub.reseller_details?.reseller_name || 'N/A', // Map reseller name
        resellerEmail: sub.reseller_details?.reseller_email || 'N/A', // Map reseller email
        resellerType: sub.reseller_details?.reseller_type || 'N/A', // Map reseller email
      }));
      setSubscriptions(mappedSubscriptions);
    } catch (error: any) {
      toast({ title: "Error fetching subscriptions", description: error.message, variant: "destructive" });
      setSubscriptions([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleDomainSearch = () => {
    if (domainSearch.trim()) {
      setSelectedPartnerId(null);
      fetchSubscriptions({ domainName: domainSearch.trim() });
    }
  };

  // Fetch customers when a partner is selected
  useEffect(() => {
    const selectedPartner = partners.find(p => p.id === selectedPartnerId);
    if (selectedPartner?.email) {
      setDomainSearch(''); // clear domain search
      fetchSubscriptions({ partnerEmail: selectedPartner.email });
    } else {
      // This part is tricky. If I just cleared the partner to do a domain search, I don't want to hide results.
      if (!domainSearch.trim()) { // Only hide if domain search is also empty
        setSubscriptions([]);
        setShowResults(false);
      }
    }
  }, [selectedPartnerId, partners]);

  useEffect(() => {
    // Reset to first page when search term or partner changes
    setCurrentPage(1);
  }, [customerSearchTerm, selectedPartnerId]);

  const filteredPartnersForSelect = useMemo(() => {
    if (!partnerSearch) return partners;
    return partners.filter(partner =>
      partner.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      partner.company.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      partner.email.toLowerCase().includes(partnerSearch.toLowerCase())
    );
  }, [partners, partnerSearch]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub =>
      sub.domainName?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      sub.skuName.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [subscriptions, customerSearchTerm]);

  const totalPages = Math.ceil(filteredSubscriptions.length / RECORDS_PER_PAGE);
  const paginatedSubscriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredSubscriptions.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [filteredSubscriptions, currentPage]);

  const handleAddLicenseClick = (subscriptionId: string) => {
    const sub = subscriptions.find(s => s.id === subscriptionId);
    if (sub) {
      setSelectedSubscription(sub);
      setIsAddLicenseModalOpen(true);
      setLicensesToAdd(''); // Reset on open
    }
  };

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
      console.error("User ID not available for logging CRM action.");
      return;
    }
    try {
      const logFormData = new FormData();
      logFormData.append('userid', user.id);
      logFormData.append('actiontype', actiontype);
      logFormData.append('path', 'Add License');
      logFormData.append('details', details);

      const response = await fetch(API_ENDPOINTS.STORE_INSERT_CRM_LOGS, {
        method: 'POST',
        body: logFormData,
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ message: `CRM log API request failed with status ${response.status}` }));
        throw new Error(errorResult.message);
      }
    } catch (error: any) {
      console.error("Error logging CRM action:", error.message);
    }
  };

  const handleConfirmAddLicense = async () => {
    if (licensesToAdd === '' || Number(licensesToAdd) <= 0) {
      toast({ title: "Invalid quantity", description: "Please enter a valid number of licenses to add.", variant: "destructive" });
      return;
    }
    if (!selectedSubscription) {
      toast({ title: "No Subscription Selected", description: "Please select a subscription to add licenses to.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('subscription_id', selectedSubscription.id);
      formData.append('customer_id', selectedSubscription.custId);
      const seats = selectedSubscription.plan.toLowerCase().includes('annual')
        ? selectedSubscription.maxSeats
        : selectedSubscription.usedSeats;
      formData.append('seats', seats);
      formData.append('plan_name', selectedSubscription.plan);
      formData.append('domain_name', selectedSubscription.domainName);
      formData.append('added_seats', licensesToAdd);
      if (user?.email) {
        formData.append('user_emailid', user.email);
      }
      if (profile) {
        const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        formData.append('user_name', userName || user?.email || 'Unknown User');
      }

      const response = await fetch(API_ENDPOINTS.ADDGOOGLELICENSE_ONCRM, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to add licenses.');
      }

      const logDetails = `Added ${licensesToAdd} license(s) for domain ${selectedSubscription.domainName}.`;
      await logCrmAction("Add Google License", logDetails);

      toast({
        title: "Licenses Requested",
        description: `Request to add ${licensesToAdd} license(s) for ${selectedSubscription.domainName} has been submitted successfully.`,
      });
      setIsAddLicenseModalOpen(false);

      // Reload the subscriptions list after a successful license addition
      if (selectedPartnerId) {
        const partner = partners.find(p => p.id === selectedPartnerId);
        if (partner?.email) {
          fetchSubscriptions({ partnerEmail: partner.email });
        }
      } else if (domainSearch.trim()) {
        fetchSubscriptions({ domainName: domainSearch.trim() });
      }
    } catch (error: any) {
      toast({
        title: "Error Adding License",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add License</CardTitle>
          <p className="text-muted-foreground">Select a partner or search by domain to view subscriptions and add licenses.</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            <div className="space-y-2">
              <label htmlFor="partner-select" className="text-sm font-medium">Search by Partner</label>
              <div className="flex items-center gap-2">
                <Popover open={openPartnerPopover} onOpenChange={setOpenPartnerPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPartnerPopover}
                      className="w-full justify-between"
                      disabled={isLoadingPartners}
                    >
                      {selectedPartnerId
                        ? partners.find((partner) => partner.id === selectedPartnerId)?.name
                        : (isLoadingPartners ? "Loading partners..." : "Select a partner")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search partner by name, company, or email..." onValueChange={setPartnerSearch} />
                      <CommandEmpty>No partner found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {filteredPartnersForSelect.map((partner) => (
                            <CommandItem
                              key={partner.id}
                              value={`${partner.name} ${partner.company} ${partner.email}`}
                              onSelect={() => {
                                setSelectedPartnerId(partner.id);
                                setDomainSearch('');
                                setOpenPartnerPopover(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPartnerId === partner.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div>{partner.name} ({partner.company})</div>
                                <div className="text-xs text-muted-foreground">{partner.email}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedPartnerId && (
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedPartnerId(null); }} title="Clear selection">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="domain-search" className="text-sm font-medium">Search by Domain</label>
              <div className="flex items-center gap-2">
                <Input
                  id="domain-search"
                  placeholder="e.g., example.com"
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDomainSearch(); }}
                />
                {domainSearch && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setDomainSearch(''); setShowResults(false); setSubscriptions([]); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={handleDomainSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle>
              Subscriptions
              {!isLoadingCustomers && subscriptions.length > 0 && (
                <span className="text-muted-foreground font-normal text-base ml-2">
                  ({customerSearchTerm ? `${filteredSubscriptions.length} of ` : ''}{subscriptions.length})
                </span>
              )}
            </CardTitle>
            <div className="relative mt-2 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by domain or customer name..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCustomers ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading domains...</span>
              </div>
            ) : filteredSubscriptions.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain Name</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Used Seats</TableHead>
                      <TableHead>Max Seats</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Renewal Date</TableHead>
                      <TableHead>Reseller Name</TableHead> {/* New column */}
                      <TableHead>Reseller EmailID</TableHead> {/* New column */}
                      <TableHead>Domain Type</TableHead> {/* New column */}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubscriptions.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.domainName}</TableCell>
                        <TableCell>{sub.skuName}</TableCell>
                        <TableCell>{sub.plan}</TableCell>
                        <TableCell>{sub.usedSeats}</TableCell>
                        <TableCell>{sub.maxSeats}</TableCell>
                        <TableCell>{sub.status}</TableCell>
                        <TableCell>{sub.renewalDate ? sub.renewalDate.toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{sub.resellerName}</TableCell> {/* Display reseller name */}
                        <TableCell>{sub.resellerEmail}</TableCell> {/* Display reseller email */}
                        <TableCell>{sub.resellerType}</TableCell> {/* Display reseller typr */}
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleAddLicenseClick(sub.id)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add License
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No subscriptions found for this partner.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSubscription && (
        <Dialog open={isAddLicenseModalOpen} onOpenChange={setIsAddLicenseModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add License</DialogTitle>
              <DialogDescription>
                {selectedSubscription.plan.toLowerCase().includes('flexible')
                  ? 'Adding licenses is not applicable for flexible plans.'
                  : 'Add more licenses for the selected subscription.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Product</Label>
                <Input value={selectedSubscription.skuName} readOnly className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Plan</Label>
                <Input value={selectedSubscription.plan} readOnly className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Domain</Label>
                <Input value={selectedSubscription.domainName} readOnly className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Total Licenses</Label>
                <Input
                  value={selectedSubscription.plan.toLowerCase().includes('annual') ? selectedSubscription.maxSeats : selectedSubscription.usedSeats}
                  readOnly
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="licenses-to-add" className="text-right">Add License</Label>
                <Input
                  id="licenses-to-add"
                  type="number"
                  value={licensesToAdd}
                  onChange={(e) => setLicensesToAdd(e.target.value)}
                  className="col-span-3"
                  min="1"
                  disabled={selectedSubscription.plan.toLowerCase().includes('flexible')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsAddLicenseModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleConfirmAddLicense} disabled={selectedSubscription.plan.toLowerCase().includes('flexible') || licensesToAdd === '' || Number(licensesToAdd) <= 0 || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AddLicense;