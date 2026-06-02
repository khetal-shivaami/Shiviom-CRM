import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, View, X, FilterX, Link, Loader2, History, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Partner, Customer, Product, User } from '../types';
import PartnerDetails from './PartnerDetails';
import PartnerTableHeader from './PartnerTableHeader';
import PartnerTableFilters from './PartnerTableFilters';
import PartnerTableRow from './PartnerTableRow';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { MapCustomersDialog } from './MapCustomersDialog';
import { PartnerCommentsDialog } from './PartnerCommentsDialog';
import { identityOptions, paymentTermOptions, partnerTagOptions, partnerTypeOptions, sourceOfPartnerOptions, zoneOptions, statusOptions, partnerProgramOptions } from './PartnerTableFilters';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface PartnerTableProps {
  customers: Customer[];
  products: Product[];
  users: User[];

}

interface InvitationHistoryItem {
  id: number;
  exist_invite_id: string;
  reseller_name: string;
  reseller_email: string;
  agreement_doc_status: string;
  invitation_date: string;
  reseller_id: string;
}

const allColumns = [
  { id: 'partnerName', label: 'Partner Name', isToggleable: false, defaultVisible: true },
  { id: 'company', label: 'Partner Company', isToggleable: true, defaultVisible: true },
  { id: 'email', label: 'Partner Email', isToggleable: true, defaultVisible: true },
  { id: 'contact', label: 'Partner Contact', isToggleable: true, defaultVisible: true },
  { id: 'identity', label: 'Identity', isToggleable: true, defaultVisible: false },
  { id: 'partnerProgram', label: 'Partner Program', isToggleable: true, defaultVisible: true },
  { id: 'zone', label: 'Zone', isToggleable: true, defaultVisible: false },
  { id: 'agreement', label: 'Agreement', isToggleable: true, defaultVisible: false },
  { id: 'paymentTerms', label: 'Payment Terms', isToggleable: true, defaultVisible: false },
  { id: 'productTypes', label: 'Product Types', isToggleable: true, defaultVisible: false },
  { id: 'assignedEmployee', label: 'Assigned Employee', isToggleable: true, defaultVisible: true },
  { id: 'customers', label: 'Customers', isToggleable: true, defaultVisible: true },
  { id: 'newRevenue', label: 'New Revenue', isToggleable: true, defaultVisible: false },
  { id: 'renewalRevenue', label: 'Renewal Revenue', isToggleable: true, defaultVisible: false },
  { id: 'totalRevenue', label: 'Total Revenue', isToggleable: true, defaultVisible: true },
  { id: 'partnerDiscount', label: 'Partner Discount', isToggleable: true, defaultVisible: false },
  { id: 'designation', label: 'Designation', isToggleable: true, defaultVisible: false },
  { id: 'status', label: 'Status', isToggleable: false, defaultVisible: true },
  { id: 'partnerTags', label: 'Partner Tags', isToggleable: true, defaultVisible: false },
  { id: 'partnerType', label: 'Partner Type', isToggleable: true, defaultVisible: false },
  { id: 'sourceOfPartner', label: 'Source', isToggleable: true, defaultVisible: false },
  { id: 'city', label: 'City', isToggleable: true, defaultVisible: false },
  { id: 'state', label: 'State', isToggleable: true, defaultVisible: false },
  { id: 'renewalManagerName', label: 'Renewal Manager Name', isToggleable: true, defaultVisible: false },
  { id: 'renewalManagerId', label: 'Renewal Manager ID', isToggleable: true, defaultVisible: false },

];

const PartnerTable = ({ customers, products, users }: PartnerTableProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customersFilter, setCustomersFilter] = useState(0);
  const [revenueFilter, setRevenueFilter] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [], identity: [], paymentTerms: [], partnerTags: [], partnerType: [], source: [], zone: [], partnerProgram: [], state: [], city: []
  });

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMapCustomersOpen, setIsMapCustomersOpen] = useState(false);
  const [isShareAccessDialogOpen, setIsShareAccessDialogOpen] = useState(false);
  const [selectedPartnerForAccess, setSelectedPartnerForAccess] = useState<Partner | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState('');
  const [isSendingAccess, setIsSendingAccess] = useState(false);
  const [invitationHistory, setInvitationHistory] = useState<InvitationHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const recordsPerPage = 10;


  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    allColumns.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultVisible }), {})
  );

  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
    setVisibleColumns(prev => ({ ...prev, [columnId]: isVisible }));
  };

  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    setActiveFilters(newFilters);
  };

  const resetAllFilters = () => {
    setActiveFilters({ status: [], identity: [], paymentTerms: [], partnerTags: [], partnerType: [], source: [], zone: [], partnerProgram: [], state: [], city: [] });
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
      formData.append('path', 'Partner Table');
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

  const fetchInvitationHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.GET_EXISTING_RESELLERLOGIN_INVITATION_DETAILS, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch invitation history.');
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setInvitationHistory(result.data);
      } else {
        setInvitationHistory([]);
        if (!result.success) {
          throw new Error(result.message || 'API returned an error for invitation history.');
        }
      }
    } catch (error: any) {
      toast({ title: "Error Fetching History", description: error.message, variant: "destructive" });
      setInvitationHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isShareAccessDialogOpen) {
      fetchInvitationHistory();
    } else {
      setSelectedPartnerForAccess(null);
      setSelectedAgreement('');
    }
  }, [isShareAccessDialogOpen]);

  const handleShareAccessClick = (partner: Partner) => {
    setSelectedPartnerForAccess(partner);
    setIsShareAccessDialogOpen(true);
  };

  const handleSendAccess = async () => {
    if (!selectedPartnerForAccess) {
      toast({ title: "No Partner Selected", variant: "destructive" });
      return;
    }
    if (!selectedAgreement) {
      toast({ title: "No Agreement Selected", description: "Please select a reseller service agreement.", variant: "destructive" });
      return;
    }
    if (!selectedPartnerForAccess.email) {
      toast({ title: "Partner Email Not Found", variant: "destructive" });
      return;
    }

    setIsSendingAccess(true);
    try {
      const response = await fetch(API_ENDPOINTS.SEND_RESELLER_LOGIN_DETAILS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reseller_email: selectedPartnerForAccess.email, agreement_name: selectedAgreement, sender_email: user?.email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) { throw new Error(result.message || 'Failed to send portal access email.'); }
      toast({ title: "Access Sent", description: `Portal access details have been sent to ${selectedPartnerForAccess.email}.` });
      logCrmAction("Share Portal Access", `Successfully sent portal access link to partner ${selectedPartnerForAccess.name} (${selectedPartnerForAccess.email}).`);
      await fetchInvitationHistory();
      setIsShareAccessDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error Sending Access", description: error.message, variant: "destructive" });
      logCrmAction("Share Portal Access Fail", `Failed to send portal access to partner ${selectedPartnerForAccess.name} (${selectedPartnerForAccess.email}). Error: ${error.message}`);
    } finally {
      setIsSendingAccess(false);
    }
  };

  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      const searchMatch = searchTerm === '' || 
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.company.toLowerCase().includes(searchTerm.toLowerCase());

      const customersMatch = partner.customersCount >= customersFilter;
      const revenueMatch = partner.totalValue >= revenueFilter;

      // Multi-select filter logic
      const statusMatch = activeFilters.status.length === 0 || activeFilters.status.includes(partner.status);
      const identityMatch = activeFilters.identity.length === 0 || (Array.isArray(partner.identity) && partner.identity.some(id => activeFilters.identity.includes(id)));
      const paymentTermsMatch = activeFilters.paymentTerms.length === 0 || activeFilters.paymentTerms.includes(partner.paymentTerms);
      const partnerTagsMatch = activeFilters.partnerTags.length === 0 || (Array.isArray(partner.partner_tag) && partner.partner_tag.some(tag => activeFilters.partnerTags.includes(tag)));
      const partnerTypeMatch = activeFilters.partnerType.length === 0 || (partner.partner_type && activeFilters.partnerType.includes(partner.partner_type));
      const sourceMatch = activeFilters.source.length === 0 || (partner.source_of_partner && activeFilters.source.includes(partner.source_of_partner));
      const zoneMatch = activeFilters.zone.length === 0 || (Array.isArray(partner.zone) && partner.zone.some(z => activeFilters.zone.includes(z)));
      const partnerProgramMatch = activeFilters.partnerProgram.length === 0 || (partner.partner_program && activeFilters.partnerProgram.includes(partner.partner_program));
      
      // City and State filter logic
      const stateMatch = activeFilters.state.length === 0 || (partner.state && activeFilters.state.includes(partner.state));
      const cityMatch = activeFilters.city.length === 0 || (partner.city && activeFilters.city.includes(partner.city));

      return searchMatch && customersMatch && revenueMatch && statusMatch && identityMatch && paymentTermsMatch && partnerTagsMatch && partnerTypeMatch && sourceMatch && zoneMatch && partnerProgramMatch && stateMatch && cityMatch;
    });
  }, [partners, searchTerm, customersFilter, revenueFilter, activeFilters]);

  const allStates = useMemo(() => {
    const states = new Set(partners.map(p => p.state).filter(Boolean));
    return Array.from(states).sort();
  }, [partners]);
  const allCities = useMemo(() => {
    const cities = new Set(partners.map(p => p.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [partners]);

  const allFilterOptions = [
    ...statusOptions, ...identityOptions, ...paymentTermOptions, ...partnerTagOptions,
    ...partnerTypeOptions, ...sourceOfPartnerOptions, ...zoneOptions, ...partnerProgramOptions
  ];
  const filterOptionMap = new Map(allFilterOptions.map(opt => [opt.value, opt.label]));

  const getFilterLabel = (value: string) => {
    return filterOptionMap.get(value) || value;
  };

  const ActiveFiltersDisplay = () => {
    const activeFilterEntries = Object.entries(activeFilters).flatMap(([key, values]) =>
      values.map(value => ({ key, value }))
    );

    if (activeFilterEntries.length === 0) {
      return null;
    }

    const handleRemoveFilter = (key: string, value: string) => {
      setActiveFilters(prev => ({
        ...prev,
        [key]: prev[key].filter(v => v !== value),
      }));
    };

    return (
      <div className="flex items-center flex-wrap gap-2 pt-4">
        <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
        {activeFilterEntries.map(({ key, value }) => (
          <Badge key={`${key}-${value}`} variant="secondary" className="flex items-center gap-1">
            {getFilterLabel(value)}
            <button onClick={() => handleRemoveFilter(key, value)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
              <X size={12} />
            </button>
          </Badge>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={resetAllFilters}
          className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
        >
          <FilterX size={14} /> Reset All
        </Button>
      </div>
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPartners.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPartners.slice(indexOfFirstRecord, indexOfLastRecord);

  const visibleColumnCount = 2 + Object.values(visibleColumns).filter(v => v).length; // 2 for checkbox and actions

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, customersFilter, revenueFilter, activeFilters]);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      // Fetch all customers from CRM to calculate counts
      const customerResponse = await fetch(API_ENDPOINTS.GET_RESELLER_CUSTOEMRS_LIST_ONCRM, {
        method: 'POST',
      });
      if (!customerResponse.ok) {
        // Don't block partner loading if this fails, just log it.
        console.error(`Failed to fetch customer counts: ${customerResponse.status}`);
      }
      const customerResult = await customerResponse.json();
      let customerCounts: Record<string, number> = {};
      if (customerResult.success && customerResult.data?.data_result) {
        const apiCustomers = customerResult.data.data_result;
        customerCounts = apiCustomers.reduce((acc: Record<string, number>, customer: any) => {
          if (customer.reseller_id) {
            acc[customer.reseller_id] = (acc[customer.reseller_id] || 0) + 1;
          }
          return acc;
        }, {});
      }

      let allPartners: any[] = [];
      const CHUNK_SIZE = 1000;
      let page = 0;
      let hasMore = true;

      // Get the logged-in user's session
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      console.log(userData)
      const currentUser = userData.user;
      const userRole = currentUser?.user_metadata?.role; // Assuming role is stored in user_metadata
      const currentUserId = currentUser?.id;
      const currentUserName = currentUser?.user_metadata?.full_name;

      while (hasMore) {
        const from = page * CHUNK_SIZE;
        const to = from + CHUNK_SIZE - 1;

        let query = supabase
          .from('partners')
          .select('*')
          .eq('onboarding_stage', 'onboarded')
          .order('created_at', { ascending: false })
          .range(from, to);
        console.log(userRole)
        // Conditional filtering based on user role
        if (userRole === 'Renewal' && currentUserId) {
          query = query.eq('renewal_manager_id', currentUserId);
          // Add your additional condition here. For example, to filter by a specific status:
          // query = query.eq('status', 'active');
        }

        const { data, error } = await query;


        if (error) throw error;

        if (data) {
          allPartners = [...allPartners, ...data];
        }

        if (!data || data.length < CHUNK_SIZE) {
          hasMore = false;
        } else {
          page++;
        }
      }

      const parseJsonArray = (value: any): string[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        }
        return [];
      };

      const mappedPartners: Partner[] = allPartners.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.contact_number,
        company: p.company,
        specialization: p.specialization,
        identity: parseJsonArray(p.identity),
        status: p.status,
        agreementSigned: p.agreement_signed,
        agreementDate: p.agreement_date ? new Date(p.agreement_date) : undefined,
        productTypes: p.product_types || [],
        paymentTerms: p.payment_terms || 'net-30', // Defaulting to 'net-30' if null
        zone: parseJsonArray(p.zone),
        assignedUserIds: p.assigned_user_ids || [],
        createdAt: new Date(p.created_at),
        customersCount: customerCounts[p.portal_reseller_id] || p.customers_count || 0,
        newRevenue: p.new_revenue || 0,
        renewalRevenue: p.renewal_revenue || 0,
        totalValue: p.total_value || 0,
        portal_reseller_id: p.portal_reseller_id,
        partner_discount: p.partner_discount,
        contact_number: p.contact_number,
        partner_program: p.partner_program,
        onboarding: p.onboarding_data ? { ...p.onboarding_data, currentStage: p.onboarding_stage } : undefined,
        assigned_manager: p.assigned_manager,
        partner_tag: parseJsonArray(p.partner_tag),
        partner_type: p.partner_type,
        source_of_partner: p.source_of_partner,
        city: p.city,
        state: p.state,
        renewal_manager_name: p.renewal_manager_name,
        renewal_manager_id: p.renewal_manager_id,
        designation: p.designation,
        interactions: parseJsonArray(p.interactions),
        contacts: parseJsonArray(p.contacts),
      }));
      
      setPartners(mappedPartners);
      console.log(partners)
    } catch (error: any) {
      toast({ title: "Error fetching partners", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []); // Removed `customers` dependency as partner data is now self-contained in Supabase

  const handleActionSuccess = () => {
    // Refetch partners to reflect the changes made in the dialog
    fetchPartners();
  };
  const handleMapSuccess = fetchPartners;

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartners(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPartners.length === filteredPartners.length) {
      setSelectedPartners([]);
    } else {
      setSelectedPartners(filteredPartners.map(partner => partner.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    // TODO: This needs to be implemented with the new API
    toast({
      title: "Action Not Implemented",
      description: "Bulk actions via the API are not yet configured.",
      variant: "destructive",
    });
  };

  const handleBulkExport = () => {
    if (selectedPartners.length === 0) {
      toast({
        title: "No partners selected",
        description: "Please select partners to export.",
        variant: "destructive",
      });
      return;
    }

    const partnersToExport = partners.filter(p => selectedPartners.includes(p.id));

    const dataToExport = partnersToExport.map(partner => ({
      'Partner Name': partner.name,
      'Company': partner.company,
      'Email': partner.email,
      'Phone': partner.phone,
      'Identity': partner.identity,
      'Partner Program': partner.partner_program,
      'Specialization': partner.specialization,
      'Zone': partner.zone,
      'Status': partner.status,
      'Customers': partner.customersCount,
      'Total Revenue': partner.totalValue,
      'Partner Discount': partner.partner_discount,
      'Payment Terms': partner.paymentTerms,
      'Agreement Signed': partner.agreementSigned ? 'Yes' : 'No',
      'Created At': partner.createdAt.toLocaleDateString(),
      'Assigned Users': users.filter(u => partner.assignedUserIds?.includes(u.id)).map(u => u.name).join(', ') || 'Unassigned',
      'Renewal Manager Name': partner.renewalManagerName,
      'Renewal Manager ID': partner.renewalManagerId,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Partners");
    XLSX.writeFile(workbook, "partners_export.xlsx");

    toast({ title: "Export Successful", description: `${partnersToExport.length} partners have been exported.` });
  };

  const handleBulkImport = async (importedData: any[]) => {
    if (!importedData || importedData.length === 0) {
        toast({ title: "No Data", description: "No data to import.", variant: "destructive" });
        return;
    }

    try {
        const partnersToInsert = importedData.map(p => ({
            name: p.name,
            email: p.email,
            company: p.company,
            contact_number: p.phone, // Assuming 'phone' from CSV maps to 'contact_number'
            specialization: p.specialization,
            identity: p.identity,
            status: p.status || 'active',
            agreement_signed: p.agreementSigned,
            product_types: p.productTypes,
            payment_terms: p.paymentTerms,
            zone: p.zone,
            partner_tag: p.partner_tag,
            onboarding_stage: 'onboarded', // Set default onboarding stage
        }));

        const { error } = await supabase.from('partners').insert(partnersToInsert);

        if (error) {
            throw error;
        }

        toast({
            title: "Import Successful",
            description: `${importedData.length} partners have been imported successfully.`,
        });

        fetchPartners(); // Refresh the partner list
    } catch (error: any) {
        toast({
            title: "Import Failed",
            description: error.message || "An error occurred during the bulk import.",
            variant: "destructive",
        });
    }
  };

  if (selectedPartner) {
    return (
      <PartnerDetails
        partner={selectedPartner}
        products={products}
        users={users}
        onBack={() => setSelectedPartner(null)}
        isDialogView={false}
      />
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <PartnerTableHeader
            filteredCount={filteredPartners.length}
            totalCount={partners.length}
            selectedCount={selectedPartners.length}
            onBulkImport={handleBulkImport}
            onMapCustomers={() => setIsMapCustomersOpen(true)}
            onBulkAction={handleBulkAction}
            onBulkExport={handleBulkExport}
          />
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search partners by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
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
            </div>
            <div className="flex items-center gap-2">
              <PartnerTableFilters 
                filters={activeFilters} 
                onFilterChange={handleFilterChange} 
                stateOptions={allStates.map(s => ({ value: s, label: s }))}
                cityOptions={allCities.map(c => ({ value: c, label: c }))}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <View size={16} className="mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allColumns.filter(c => c.isToggleable).map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={visibleColumns[column.id]}
                      onCheckedChange={(value) => handleColumnVisibilityChange(column.id, !!value)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
          </div>
          <ActiveFiltersDisplay />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between pb-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredPartners.length > 0 ? indexOfFirstRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastRecord, filteredPartners.length)}</strong> of <strong>{filteredPartners.length}</strong> partners.
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedPartners.length === filteredPartners.length && filteredPartners.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {allColumns.map(col => visibleColumns[col.id] && <TableHead key={col.id}>{col.label}</TableHead>)}
                {/* <TableHead>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
             {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnCount}
                    className="h-24 text-center"
                  >
                    Loading partners...
                  </TableCell>
                </TableRow>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((partner) => (
                  <PartnerTableRow
                    key={partner.id}
                    partner={partner}
                    users={users}
                    visibleColumns={visibleColumns}
                    isSelected={selectedPartners.includes(partner.id)}
                    onSelect={handleSelectPartner}
                    onViewDetails={setSelectedPartner}
                    onActionSuccess={handleActionSuccess}
                    onShareAccess={handleShareAccessClick}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnCount}
                    className="h-24 text-center"
                  >
                    No partner is onboarded till now.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredPartners.length > 0 ? indexOfFirstRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastRecord, filteredPartners.length)}</strong> of <strong>{filteredPartners.length}</strong> partners.
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
      <MapCustomersDialog
        partners={partners}

        customers={customers}
        open={isMapCustomersOpen}
        onOpenChange={setIsMapCustomersOpen}
        onSuccess={handleMapSuccess}
      />
      <Dialog open={isShareAccessDialogOpen} onOpenChange={setIsShareAccessDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Share Portal Access for {selectedPartnerForAccess?.name}</DialogTitle>
            <DialogDescription>
              Select an agreement to send portal access to {selectedPartnerForAccess?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mt-4">
              <Label htmlFor="agreement-type">Reseller Service Agreement</Label>
              <Select value={selectedAgreement} onValueChange={setSelectedAgreement}>
                <SelectTrigger id="agreement-type" className="w-full">
                  <SelectValue placeholder="Select Agreement Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reseller Service Agreement- Shiviom Cloud LLP-15 days">Reseller Service Agreement- Shiviom Cloud LLP-15 days</SelectItem>
                  <SelectItem value="Reseller Service Agreement- Shiviom Cloud LLP-30 days">Reseller Service Agreement- Shiviom Cloud LLP-30 days</SelectItem>
                  <SelectItem value="Reseller Service Agreement- Shiviom Cloud LLP-Due date">Reseller Service Agreement- Shiviom Cloud LLP-Due date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2 flex items-center">
              <History className="mr-2 h-5 w-5" />
              Invitation History
            </h4>
            <div className="relative my-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Partner Email</TableHead>
                    <TableHead>Agreement Sent</TableHead>
                    <TableHead>Invitation Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isHistoryLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />Loading history...</TableCell></TableRow>
                  ) : invitationHistory.filter(item => (item.reseller_name || '').toLowerCase().includes(historySearchTerm.toLowerCase()) || (item.reseller_email || '').toLowerCase().includes(historySearchTerm.toLowerCase())).length > 0 ? (
                    invitationHistory.filter(item => (item.reseller_name || '').toLowerCase().includes(historySearchTerm.toLowerCase()) || (item.reseller_email || '').toLowerCase().includes(historySearchTerm.toLowerCase())).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.reseller_name || 'N/A'}</TableCell>
                        <TableCell>{item.reseller_email || 'N/A'}</TableCell>
                        <TableCell><Badge className={item.agreement_doc_status === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{item.agreement_doc_status}</Badge></TableCell>
                        <TableCell>{new Date(item.invitation_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (<TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No invitation history found.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          </div> */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareAccessDialogOpen(false)} disabled={isSendingAccess}>Cancel</Button>
            <Button onClick={handleSendAccess} disabled={isSendingAccess || !selectedPartnerForAccess || !selectedAgreement}>{isSendingAccess && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send Access</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default PartnerTable;
