import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; 
import { Progress } from '@/components/ui/progress';
import { Search, UserPlus, Filter, CheckCircle, Clock, AlertCircle, Eye, Users, FileText, Handshake, Shield, PenTool, Trophy, Link, KeyRound, X, Edit, Calendar as CalendarIcon, RotateCcw, ChevronsUpDown, Loader2, History, Share2, Globe } from 'lucide-react';
import { DateRange, DayPicker } from 'react-day-picker';
import { Partner, User, OnboardingStage, PartnerOnboardingData } from '@/types';
import AddPartnerForm from '@/components/AddPartnerForm';
import PartnerOnboardingDetail from '@/components/PartnerOnboardingDetail';
import { EditPartnerDialog } from '@/components/EditPartnerDialog';
import { PartnerStageEditForm } from '@/components/PartnerStageEditForm';
import { useTaskManager } from '@/hooks/useTaskManager';
import TaskNavigationBanner from '@/components/TaskNavigationBanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import { cn } from '@/lib/utils';
import { AddPartnerDomainDialog } from './AddPartnerDomainDialog';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface PartnerOnboardingProps {
  users: User[];
  onNavigateToTasks?: (partnerId?: string) => void;
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
interface EnhancedPartner extends Partner {
  onboarding: PartnerOnboardingData;
}

const PartnerOnboarding = ({ users, onNavigateToTasks }: PartnerOnboardingProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [presetDateRange, setPresetDateRange] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [editingPartner, setEditingPartner] = useState<EnhancedPartner | null>(null);
  const [partnersData, setPartnersData] = useState<EnhancedPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const [isShareAccessOpen, setIsShareAccessOpen] = useState(false);
  const [sharePartnerPopoverOpen, setSharePartnerPopoverOpen] = useState(false);
  const [selectedPartnerForAccess, setSelectedPartnerForAccess] = useState<string | null>(null);
  const [isSendingAccess, setIsSendingAccess] = useState(false);
  const [invitationHistory, setInvitationHistory] = useState<InvitationHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isShareDocsOpen, setIsShareDocsOpen] = useState(false);
  const [isSendingDocs, setIsSendingDocs] = useState(false);
  const [selectedPartnerForDocs, setSelectedPartnerForDocs] = useState<string | null>(null);
  const [shareDocsPopoverOpen, setShareDocsPopoverOpen] = useState(false);
  const [isAddDomainModalOpen, setIsAddDomainModalOpen] = useState(false);
  const [documentsToShare, setDocumentsToShare] = useState({
    kycForm: false,
    resellerAgreement: false,
  });
  const { getOnboardingTasks } = useTaskManager();

  const stageConfig = {
    'outreach': { title: 'Outreach', icon: Users, color: 'bg-blue-500' },
    'product-overview': { title: 'Product Overview', icon: FileText, color: 'bg-purple-500' },
    'partner-program': { title: 'Partner Program', icon: Handshake, color: 'bg-green-500' },
    'portal-activation': { title: 'Portal Activation', icon: KeyRound, color: 'bg-cyan-500' },
    'agreement': { title: 'Agreement', icon: PenTool, color: 'bg-orange-500' }, // Corrected order
    'kyc': { title: 'KYC', icon: Shield, color: 'bg-yellow-500' }, // Corrected order
    'onboarded': { title: 'Onboarded', icon: Trophy, color: 'bg-emerald-500' }
  };

  // Generate mock onboarding data with 7-stage system
  const generateMockOnboardingData = (partner: Partner, dbStage?: OnboardingStage): PartnerOnboardingData => {
    const stages: OnboardingStage[] = ['outreach', 'product-overview', 'partner-program', 'portal-activation', 'agreement', 'kyc', 'onboarded']; // Corrected order
    
    // Use the database stage if provided and valid, otherwise pick a random one as a fallback.
    const currentStage = dbStage && stages.includes(dbStage) 
      ? dbStage 
      : stages[Math.floor(Math.random() * stages.length)];

    const currentStageIndex = stages.indexOf(currentStage);
      const progress = Math.round(((currentStageIndex + 1) / stages.length) * 100);
    
    return {
      currentStage,
      overallProgress: progress,
      completionPercentage: progress,
      startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      expectedCompletionDate: new Date(Date.now() + Math.random() * 20 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      stages: Object.fromEntries(
        stages.map((stage, index) => [
          stage,
          {
            stage,
            status: index < currentStageIndex ? 'completed' : 
                   index === currentStageIndex ? (Math.random() > 0.3 ? 'in-progress' : 'blocked') : 'pending',
            startedAt: index <= currentStageIndex ? new Date(Date.now() - (stages.length - index) * 3 * 24 * 60 * 60 * 1000) : undefined,
            completedAt: index < currentStageIndex ? new Date(Date.now() - (stages.length - index - 1) * 3 * 24 * 60 * 60 * 1000) : undefined,
            assignedTo: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'][Math.floor(Math.random() * 4)],
            tasks: [
              { id: `${stage}-1`, title: `${stageConfig[stage].title} Task 1`, completed: index < currentStageIndex, required: true },
              { id: `${stage}-2`, title: `${stageConfig[stage].title} Task 2`, completed: index < currentStageIndex, required: true },
              { id: `${stage}-3`, title: `${stageConfig[stage].title} Task 3`, completed: false, required: false }
            ]
          }
        ])
      ) as Record<OnboardingStage, any>
    };
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
      formData.append('path', 'Partner Onboarding');
      formData.append('details', details);

      const response = await fetch(API_ENDPOINTS.STORE_INSERT_CRM_LOGS, {
        method: 'POST',
        body: formData,
      });
      console.log(response)
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
    if (isShareAccessOpen) {
      fetchInvitationHistory();
    } else {
      setSelectedPartnerForAccess(null);
      setSelectedAgreement('');
    }
  }, [isShareAccessOpen]);

  const parseJsonSafe = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        // Handles JSON strings like '["value1", "value2"]' or '"value1"'
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch (e) {
        // Fallback for non-JSON strings (e.g., comma-separated "value1,value2" or a single "value1")
        return value.split(',').map(s => s.trim());
      }
    }
    return [];
  };

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      let allPartners: any[] = [];
      const CHUNK_SIZE = 1000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * CHUNK_SIZE;
        const to = from + CHUNK_SIZE - 1;

        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

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

      const enhancedPartners: EnhancedPartner[] = allPartners.map((p: any) => {
        const partnerBase: Omit<Partner, 'onboarding'> = {
          id: p.id,
          name: p.name,
          email: p.email,
          company: p.company,
          phone: p.contact_number,
          specialization: p.specialization,          
          identity: parseJsonSafe(p.identity),
          status: p.status,
          agreementSigned: p.agreement_signed,
          agreementDate: p.agreement_date ? new Date(p.agreement_date) : undefined,
          productTypes: p.product_types || [],
          paymentTerms: p.payment_terms,
          zone: parseJsonSafe(p.zone),
          partner_tag: parseJsonSafe(p.partner_tag),
          assignedUserIds: p.assigned_user_ids || [],
          createdAt: new Date(p.created_at),
          customersCount: p.customers_count || 0,
          newRevenue: p.new_revenue || 0,
          renewalRevenue: p.renewal_revenue || 0,
          totalValue: p.total_value || 0,
          portal_reseller_id: p.portal_reseller_id,
          stage_owner: p.stage_owner,
          contact_number: p.contact_number,
          contacts: p.contacts,
        };

        const onboardingData = p.onboarding_data ? { ...p.onboarding_data, currentStage: p.onboarding_stage } : generateMockOnboardingData(partnerBase as Partner, p.onboarding_stage);
        return { ...partnerBase, onboarding: onboardingData };
      });
      setPartnersData(enhancedPartners);

    } catch (error: any) {
      toast({ title: "Error fetching partners", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1); 
  }, [searchTerm, stageFilter, ownerFilter, dateRange, presetDateRange]);

  useEffect(() => {
    const now = new Date();
    switch (presetDateRange) {
      case 'last-7-days':
        setDateRange({ from: subDays(now, 6), to: now });
        break;
      case 'last-30-days':
        setDateRange({ from: subDays(now, 29), to: now });
        break;
      case 'this-month':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'last-month':
        const lastMonth = subDays(startOfMonth(now), 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'this-year':
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case 'all':
        setDateRange(undefined);
        break;
      case 'custom':
        // Do nothing, wait for user to select a custom range
        break;
      default:
        setDateRange(undefined);
    }
  }, [presetDateRange]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStageFilter('all');
    setOwnerFilter('all');
    setPresetDateRange('all'); // This will also clear dateRange via its useEffect
  };

  const handlePartnerUpdate = async (updatedPartner: EnhancedPartner) => {
    if (!updatedPartner.onboarding) {
      toast({
        title: "Update Error",
        description: "No onboarding data found for this partner.",
        variant: "destructive",
      });
      return;
    }

    const newStage = updatedPartner.onboarding.currentStage;
    const partnerId = updatedPartner.id;

    // Find the original partner to get the 'from' stage
    const originalPartner = partnersData.find(p => p.id === partnerId);
    if (!originalPartner || !originalPartner.onboarding) {
      toast({
        title: "Update Error",
        description: "Could not find original partner data to track stage change.",
        variant: "destructive",
      });
      return;
    }
    const fromStage = originalPartner.onboarding.currentStage;

    // If stage hasn't changed, do nothing.
    if (fromStage === newStage) {
      return;
    }

    // Optimistically update the UI
    setPartnersData(prev => 
      prev.map(p => 
        p.id === partnerId 
          ? updatedPartner
          : p
      )
    );

    // Persist the change to the database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('partners')
        .update({ onboarding_stage: newStage })
        .eq('id', partnerId);

      if (error) throw error;

      // Insert into partner_stage_changes table
      const { error: insertError } = await supabase
        .from('partner_stage_changes')
        .insert({
          partner_id: partnerId,
          from_stage: fromStage,
          to_stage: newStage,
          changed_by: user.id,
          portal_reseller_id: originalPartner.portal_reseller_id || null,
        })
        .select(); // Ensure the insert operation is executed and returns data

      if (insertError) throw insertError;

      // Log success and show toast
      const successLogDetails = `Successfully changed partner ${updatedPartner.name} (ID: ${partnerId}) stage from ${fromStage} to ${newStage}.`;
      await logCrmAction("Update Partner Onboarding Stage", successLogDetails);
      toast({ title: "Stage Updated", description: `Partner stage changed to ${stageConfig[newStage].title}.` });
      await fetchPartners(); // Reload the partner list

    } catch (error: any) {
       await logCrmAction("Update Partner Onboarding Stage", `Failed to change partner ${updatedPartner.name} stage from ${fromStage} to ${newStage}. Error: ${error.message}`);
      toast({ title: "Database Update Failed", description: `Could not save stage for ${updatedPartner.name}. ${error.message}`, variant: "destructive" });
      // Optional: Revert UI change by refetching data
      fetchPartners();
    }
  };

  const handleAddPartnerSuccess = () => {
    setShowAddForm(false);
    fetchPartners();
  };

  const handleEditPartner = (partner: EnhancedPartner) => {
    setEditingPartner(partner);
  };

  const getStageIcon = (stage: OnboardingStage) => {
    const config = stageConfig[stage];
    const IconComponent = config.icon;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStageStatus = (partner: EnhancedPartner) => {
    const currentStageData = partner.onboarding.stages[partner.onboarding.currentStage];
    return currentStageData.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const filteredPartners = partnersData.filter(partner => {
    // Exclude 'onboarded' partners from the default "All Stages" view.
    // They will only appear if the 'onboarded' filter is explicitly selected.
    if (stageFilter === 'all' && partner.onboarding.currentStage === 'onboarded') {
      return false;
    }

    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || partner.onboarding.currentStage === stageFilter;
    const matchesOwner = ownerFilter === 'all' || 
                         (ownerFilter === 'unassigned' && !partner.stage_owner) ||
                         partner.stage_owner === ownerFilter;

    let matchesDate = true;
    if (dateRange?.from) {
      const partnerDate = new Date(partner.createdAt);
      const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
      // Set time to end of day for 'to' date to include all records on that day
      toDate.setHours(23, 59, 59, 999);
      
      matchesDate = partnerDate >= dateRange.from && partnerDate <= toDate;
    }

    return matchesSearch && matchesStage && matchesOwner && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPartners.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPartners.slice(indexOfFirstRecord, indexOfLastRecord);

  const paginationControls = (
    <div className="flex items-center justify-between">
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
  );
  const statsData = [
    {
      title: 'Total Partners',
      value: partnersData.length,
      color: 'text-blue-600',
      icon: Users
    },
    {
      title: 'Outreach',
      value: partnersData.filter(p => p.onboarding.currentStage === 'outreach').length,
      color: 'text-blue-600',
      icon: Users
    },
    {
      title: 'Product Overview',
      value: partnersData.filter(p => p.onboarding.currentStage === 'product-overview').length,
      color: 'text-purple-600',
      icon: FileText
    },
    {
      title: 'Partner Program',
      value: partnersData.filter(p => p.onboarding.currentStage === 'partner-program').length,
      color: 'text-green-600',
      icon: Handshake
    },
    {
      title: 'Portal Activation',
      value: partnersData.filter(p => p.onboarding.currentStage === 'portal-activation').length,
      color: 'text-cyan-600',
      icon: KeyRound
    },
    {
      title: 'Agreement',
      value: partnersData.filter(p => p.onboarding.currentStage === 'agreement').length,
      color: 'text-orange-600',
      icon: PenTool
    },
    {
      title: 'KYC',
      value: partnersData.filter(p => p.onboarding.currentStage === 'kyc').length,
      color: 'text-yellow-600',
      icon: Shield
    },
    
    {
      title: 'Onboarded',
      value: partnersData.filter(p => p.onboarding.currentStage === 'onboarded').length,
      color: 'text-emerald-600',
      icon: Trophy
    }
  ];

  const avgProgress = filteredPartners.length > 0 
    ? Math.round(filteredPartners.reduce((sum, p) => sum + p.onboarding.overallProgress, 0) / filteredPartners.length)
    : 0;

  const partnersForDocs = partnersData.filter(p => 
    p.onboarding.currentStage === 'onboarded' || p.onboarding.currentStage === 'kyc'
  );

  const handleShareDocuments = async () => {
    if (!selectedPartnerForDocs) {
      toast({ title: "No Partner Selected", description: "Please select a partner to share documents with.", variant: "destructive" });
      return;
    }
    const partner = partnersData.find(p => p.id === selectedPartnerForDocs);
    if (!partner) {
      toast({ title: "Partner Not Found", description: "The selected partner could not be found.", variant: "destructive" });
      return;
    }
    if (documentsToShare.resellerAgreement && !selectedAgreement) {
      toast({ title: "No Agreement Selected", description: "Please select a reseller service agreement.", variant: "destructive" });
      return;
    }

    setIsSendingDocs(true);
    try {
      const selectedDocs: string[] = [];
      if (documentsToShare.kycForm) {
        selectedDocs.push('KYC Form');
      }
      if (documentsToShare.resellerAgreement) {
        selectedDocs.push('Reseller Agreement');
      }

      const payload = {
        userEmail: partner.email,
        documents: selectedDocs,
        agreement_name: documentsToShare.resellerAgreement ? selectedAgreement : null,
      };

      const response = await fetch(API_ENDPOINTS.SEND_RESELLER_ACCOUNT_DOCUMENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send documents.');
      }

      toast({ title: "Documents Sent", description: `Selected documents have been sent to ${partner.email}.` });
      const logDetails = `Successfully sent documents (${selectedDocs.join(', ')}) to partner ${partner.name} (${partner.email}).`;
      await logCrmAction("Share Documents", logDetails);

      setIsShareDocsOpen(false);
      setSelectedPartnerForDocs(null);
      setDocumentsToShare({ kycForm: false, resellerAgreement: false });

    } catch (error: any) {
      toast({ title: "Error Sending Documents", description: error.message, variant: "destructive" });
      const logDetails = `Failed to send documents to partner ${partner.name} (${partner.email}). Error: ${error.message}`;
      await logCrmAction("Share Documents Fail", logDetails);
    } finally {
      setIsSendingDocs(false);
    }
  };

  const handleSendAccess = async () => {
    if (!selectedPartnerForAccess) {
      toast({ title: "No Partner Selected", description: "Please select a partner to send access.", variant: "destructive" });
      return;
    }
    if (!selectedAgreement) {
      toast({ title: "No Agreement Selected", description: "Please select a reseller service agreement.", variant: "destructive" });
      return;
    }
    const partner = partnersData.find(p => p.id === selectedPartnerForAccess);
    if (!partner || !partner.email) {
      toast({ title: "Partner Not Found", description: "Could not find the selected partner's details or email.", variant: "destructive" });
      return;
    }

    setIsSendingAccess(true);
    try {
      const response = await fetch(API_ENDPOINTS.SEND_RESELLER_LOGIN_DETAILS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reseller_email: partner.email,
          agreement_name: selectedAgreement
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send portal access email.');
      }

      toast({
        title: "Access Sent",
        description: `Portal access details have been sent to ${partner.email}.`,
      });

      const logDetails = `Successfully sent portal access link to partner ${partner.name} (${partner.email}).`;
      await logCrmAction("Share Portal Access", logDetails);

      // Update partner stage to 'portal-activation' if not already there or past it
      const stageOrder: OnboardingStage[] = ['outreach', 'product-overview', 'partner-program', 'portal-activation', 'agreement', 'kyc', 'onboarded'];
      const currentStageIndex = stageOrder.indexOf(partner.onboarding.currentStage);
      const portalActivationStageIndex = stageOrder.indexOf('portal-activation');

      if (currentStageIndex < portalActivationStageIndex) {
        const updatedPartner: EnhancedPartner = {
          ...partner,
          onboarding: { ...partner.onboarding, currentStage: 'portal-activation' }
        };
        // This function handles UI update, DB persistence, and logging
        await handlePartnerUpdate(updatedPartner);
      }
      await fetchInvitationHistory(); // Refresh history after sending

      setIsShareAccessOpen(false);
      setSelectedPartnerForAccess(null); // Reset selection
    } catch (error: any) {
      toast({ title: "Error Sending Access", description: error.message, variant: "destructive" });
      if (partner) {
        const logDetails = `Failed to send portal access to partner ${partner.name} (${partner.email}). Error: ${error.message}`;
        await logCrmAction("Share Portal Access Fail", logDetails);
      }
    } finally {
      setIsSendingAccess(false);
    }
  };

  if (selectedPartner) {
    return (
      <PartnerOnboardingDetail
        partner={selectedPartner}
        users={users}
        onBack={() => setSelectedPartner(null)}
        onNavigateToTasks={onNavigateToTasks}
      />
    );
  }

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <AddPartnerForm 
          users={users}
          onSuccess={handleAddPartnerSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {editingPartner && (
        <EditPartnerDialog
          partner={editingPartner}
          users={users}
          open={!!editingPartner}
          onOpenChange={(isOpen) => !isOpen && setEditingPartner(null)}
          onSuccess={() => {
            setEditingPartner(null);
            fetchPartners();
          }}
          onLogAction={logCrmAction}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Partner Onboarding</h2>
          <p className="text-muted-foreground">
            Track and manage partner onboarding process
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
          <Button onClick={() => setIsAddDomainModalOpen(true)}>
            <Globe className="h-4 w-4 mr-2" />
            Add Partner Domain
          </Button>
          <Button onClick={() => setIsShareAccessOpen(true)}>
            <Link className="h-4 w-4 mr-2" />
            Share Portal Access
          </Button>
          <Button onClick={() => setIsShareDocsOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Documents
          </Button>
        </div>
      </div>

      {/* Show banner for partners with onboarding tasks */}
      {filteredPartners.length > 0 && (
        <TaskNavigationBanner
          onboardingTasks={filteredPartners.flatMap(partner => getOnboardingTasks(partner.id))}
          onNavigateToTasks={() => onNavigateToTasks?.()}
          showOnPartnerOnboarding={true}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-9 gap-4">
        {statsData.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgProgress}%</div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
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
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="outreach">Outreach</SelectItem>
                <SelectItem value="product-overview">Product Overview</SelectItem>
                <SelectItem value="partner-program">Partner Program</SelectItem>
                <SelectItem value="portal-activation">Portal Activation</SelectItem>
                <SelectItem value="agreement">Agreement</SelectItem> 
                <SelectItem value="kyc">KYC</SelectItem>
                <SelectItem value="onboarded">Onboarded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-[200px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Select value={presetDateRange} onValueChange={setPresetDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                onClick={handleResetFilters}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              {presetDateRange === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="pb-4">
            {paginationControls}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead>Progress</TableHead>                
                <TableHead>Stage Owner</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading partners...
                  </TableCell>
                </TableRow>
              ) : currentRecords.map((partner) => {
                  const currentStageData = partner.onboarding.stages[partner.onboarding.currentStage];
                  const stageConfig = {
                    'outreach': { title: 'Outreach', icon: Users },
                    'product-overview': { title: 'Product Overview', icon: FileText },
                    'partner-program': { title: 'Partner Program', icon: Handshake },
                    'portal-activation': { title: 'Portal Activation', icon: KeyRound },
                    'agreement': { title: 'Agreement', icon: PenTool },
                    'kyc': { title: 'KYC', icon: Shield },
                    'onboarded': { title: 'Onboarded', icon: Trophy }
                  };
                  
                  return (
                    <TableRow 
                      key={partner.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{partner.name}</div>
                          <div className="text-sm text-muted-foreground">{partner.company}</div>
                          <div className="text-xs text-muted-foreground">{partner.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStageIcon(partner.onboarding.currentStage)}
                          <div>
                            <div className="font-medium text-sm">
                              {stageConfig[partner.onboarding.currentStage].title}
                            </div>
                            {/* <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(currentStageData.status)} text-white border-0`}
                            >
                              {currentStageData.status.replace('-', ' ')}
                            </Badge> */}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{partner.onboarding.overallProgress}%</div>
                          <Progress value={partner.onboarding.overallProgress} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {partner.stage_owner 
                            ? (users.find(u => u.id === partner.stage_owner)?.name || 'Unknown Owner') 
                            : 'Unassigned'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {partner.createdAt.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {partner.onboarding.lastActivity.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-2">
                          <PartnerStageEditForm partner={partner} onUpdate={handlePartnerUpdate} />
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPartner(partner)}
                            title="Edit Partner Details"
                          >
                            <Edit className="h-4 w-4" />
                          </Button> */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPartner(partner)}
                            title="Edit Partner Details"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Show onboarding tasks for this partner
                              const tasks = getOnboardingTasks(partner.id);
                              console.log(`${tasks.length} onboarding tasks for ${partner.name}`);
                            }}
                            title="View related tasks"
                          >
                            <Link className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <div className="pt-4">
            {paginationControls}
          </div>
        </CardContent>
      </Card>
         <AddPartnerDomainDialog
        open={isAddDomainModalOpen}
        onOpenChange={setIsAddDomainModalOpen}
      />       
      <Dialog open={isShareAccessOpen} onOpenChange={setIsShareAccessOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Share Portal Access</DialogTitle>
            <DialogDescription>
              Select a partner to send them their portal access link.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Popover open={sharePartnerPopoverOpen} onOpenChange={setSharePartnerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={sharePartnerPopoverOpen} className="w-full justify-between">
                  {selectedPartnerForAccess
                    ? partnersData.find(p => p.id === selectedPartnerForAccess)?.name
                    : "Select a partner..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search by name or email..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty>No partner found.</CommandEmpty>
                    <CommandGroup>
                      {partnersData.map((partner) => (
                        <CommandItem
                          key={partner.id}
                          value={`${partner.name} ${partner.email}`}
                          onSelect={() => {
                            setSelectedPartnerForAccess(partner.id);
                            setSharePartnerPopoverOpen(false);
                          }}
                        >
                          <CheckCircle className={cn("mr-2 h-4 w-4", selectedPartnerForAccess === partner.id ? "opacity-100" : "opacity-0")} />
                          {partner.name} ({partner.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
          <div className="mt-6">
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
                  ) : invitationHistory.filter(item => 
                      (item.reseller_name || '').toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      (item.reseller_email || '').toLowerCase().includes(historySearchTerm.toLowerCase())
                    ).length > 0 ? (
                    invitationHistory
                      .filter(item => 
                        (item.reseller_name || '').toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                        (item.reseller_email || '').toLowerCase().includes(historySearchTerm.toLowerCase())
                      )
                      .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.reseller_name || 'N/A'}</TableCell>
                        <TableCell>{item.reseller_email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "border-transparent",
                            item.agreement_doc_status === 'Yes' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100/80' 
                              : 'bg-red-100 text-red-800 hover:bg-red-100/80'
                          )}>
                            {item.agreement_doc_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(item.invitation_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No invitation history found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareAccessOpen(false)} disabled={isSendingAccess}>Cancel</Button>
            <Button onClick={handleSendAccess} disabled={isSendingAccess || !selectedPartnerForAccess || !selectedAgreement}>
              {isSendingAccess && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDocsOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedPartnerForDocs(null);
          setDocumentsToShare({ kycForm: false, resellerAgreement: false });
          setSelectedAgreement('');
        }
        setIsShareDocsOpen(open);
      }
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Documents</DialogTitle>
            <DialogDescription>
              Select a partner from the KYC or Onboarded stage to share documents with.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Popover open={shareDocsPopoverOpen} onOpenChange={setShareDocsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={shareDocsPopoverOpen} className="w-full justify-between">
                  {selectedPartnerForDocs
                    ? partnersForDocs.find(p => p.id === selectedPartnerForDocs)?.name
                    : "Select a partner..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search by name, email, company..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty>No eligible partner found.</CommandEmpty>
                    <CommandGroup heading="Select Partner (KYC/Onboarded)">
                      {partnersForDocs.map((partner) => (
                        <CommandItem
                          key={partner.id}
                          value={`${partner.name} ${partner.email} ${partner.company}`}
                          onSelect={() => {
                            setSelectedPartnerForDocs(partner.id);
                            setShareDocsPopoverOpen(false);
                          }}
                        >
                          <CheckCircle className={cn("mr-2 h-4 w-4", selectedPartnerForDocs === partner.id ? "opacity-100" : "opacity-0")} />
                          {partner.name} ({partner.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <div className="grid gap-4 pt-4">
              <h4 className="text-sm font-medium">Select documents to share:</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kycForm"
                  checked={documentsToShare.kycForm}
                  onCheckedChange={(checked) =>
                    setDocumentsToShare((prev) => ({ ...prev, kycForm: !!checked }))
                  }
                />
                <Label htmlFor="kycForm" className="font-normal cursor-pointer">KYC Form</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="resellerAgreement"
                  checked={documentsToShare.resellerAgreement}
                  onCheckedChange={(checked) => {
                    setDocumentsToShare((prev) => ({ ...prev, resellerAgreement: !!checked }));
                    if (!checked) {
                      setSelectedAgreement('');
                    }
                  }}
                />
                <Label htmlFor="resellerAgreement" className="font-normal cursor-pointer">Reseller Service Agreement</Label>
              </div>
            </div>
            {documentsToShare.resellerAgreement && (
              <div className="mt-4">
                <Label htmlFor="agreement-type-docs">Reseller Service Agreement</Label>
                <Select value={selectedAgreement} onValueChange={setSelectedAgreement}>
                  <SelectTrigger id="agreement-type-docs" className="w-full">
                    <SelectValue placeholder="Select Agreement Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reseller Service Agreement- Shiviom Cloud LLP-15 days">Reseller Service Agreement- Shiviom Cloud LLP-15 days</SelectItem>
                    <SelectItem value="Reseller Service Agreement- Shiviom Cloud LLP-30 days">Reseller Service Agreement- Shiviom Cloud LLP-30 days</SelectItem>
                    <SelectItem value="Reseller Service Agreement- Shiviom Cloud LLP-Due date">Reseller Service Agreement- Shiviom Cloud LLP-Due date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDocsOpen(false)} disabled={isSendingDocs}>Cancel</Button>
            <Button onClick={handleShareDocuments} disabled={isSendingDocs || !selectedPartnerForDocs || (!documentsToShare.kycForm && !documentsToShare.resellerAgreement) || (documentsToShare.resellerAgreement && !selectedAgreement)}>
              {isSendingDocs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerOnboarding;
