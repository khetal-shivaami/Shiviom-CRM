import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, XCircle, User, Calendar, CreditCard, Package, Building, View, Mail, Phone, MapPin, Star, Users, Search, X, ChevronsRight, Briefcase, Percent, History, StickyNote, ChevronDown, Handshake, FileText as FileTextIcon, Edit, MessageSquare, Loader2, Activity, AlertTriangle, Send, ExternalLink, Eye, Upload, Shield, PlusCircle, Link, Plus, Share } from 'lucide-react';
import { Partner, Customer, Product, User as UserType, PartnerComment, PartnerNote, AccountManager } from '../types';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { API_ENDPOINTS } from '@/config/api';
import { Checkbox } from "@/components/ui/checkbox";
import { EditPartnerDialog } from './EditPartnerDialog';
import { supabase } from '@/integrations/supabase/client';
import RenewalEmailDialog from './RenewalEmailDialog';
import { useAuth } from '@/contexts/AuthContext';
interface PartnerDetailsProps {
  partner: Partner;
  products: Product[];
  users: UserType[];
  onBack: () => void;
  isDialogView?: boolean;
}

interface SubscriptionDetail {
  skuName: string;
  status: string;
  plan: string;
  usedSeats: string;
  maxSeats: string;
  renewal_date: string;
  price: string | null;
  renewal_price?: string | null;
  billing_frequency: string | null;
  subscriptionId: string;
  customerId: string;
}

interface DiscountHistoryItem {
  discount_in: string;
  updated_on: string;
}
interface ProductDetail {
  oem: string;
  product: string;
  user_count: string;
}

interface DRCase {
  case_id: string;
  case_name: string;
  customer_name: string;
  customer_emailid: string;
  reseller_id: string;
  additional_information: string;
  currently_using_products: string;
  cust_id: string;
  created_date: string;
  domain_name: string;
  status: string;
  plan_type: string;
  plan_duration: string;
  quotation_request: any;
  case_type: string;
  data_migration: string;
  prod_details: ProductDetail[];
  priority: string;
  customer_contact_number: string;
}
interface QuotationProductDetail {
  skuname: string;
  usercount: string;
  actual_sku_price: string;
  shivaami_price: string;
  price: string;
  shivaamisubtotal: string;
  product_name: string;
  oem_name: string;
}

interface Quotation {
  quotation_id: string;
  customer_name: string;
  domain_name: string;
  plan_type: string;
  plan_duration: string;
  final_price_wto_gst: string;
  final_price_wt_gst: string;
  reseller_email: string;
  reseller_id: string;
  cust_id: string;
  created_date: string;
  case_id: string;
  reseller_name: string;
  discount: string;
  discount_amt: string | null;
  quotation_expiry: string;
  case_name: string;
  order_status: string;
  concatenated_products: QuotationProductDetail[];
}

interface AddedProduct {
  id: number;
  oemName: string;
  productName: string;
  skuName: string;
  purchaseType: string; // 'new' or 'renewal'
  skuId: string; // Added skuId
  licenseCount: number | '';
  skuDiscount: number;
  prodDiscount: string;
  listPrice: string;
  shivaamiPrice: string;
  subtotal: string;
}
interface PartnerRenewal {
  r_id: number;
  reseller_id: string;
  subscriptionId: string;
  skuid: string;
  plan: string;
  resellerDomain: string;
  customerDomain: string;
  domainPrice: string | null;
  customerId: string;
  usedSeats: string;
  maxSeats: string;
  status: string;
  billingMethod: string;
  startdate: string;
  renewaldate: string; // This seems to be a string date
  createdon: string; // This is a datetime string
  updated_time: string | null;
  active: string;
  renewal_date: string; // YYYY-MM-DD
  skuName: string;
  created_date: string; // YYYY-MM-DD
  google_renewal_date: string; // DD-MM-YYYY
  shivaami_renewal_date: string; // YYYY-MM-DD
  price: string;
  billing_frequency: string;
  revenue_amt: string;
  shiviom_reseller_id: string;
  shiviom_customer_id: string;
  customer_name?: string; // Manually added for display
  customer_domainname?: string; // Manually added for display
}
interface FetchedProductDiscount {
  sku_id: any;
  portal_prod_id: any;
  productId: string; // crm_prod_id
  product_name: string; // This is actually the SKU name from the API
  discount: number; // Normal discount
  renewal_discount: number;
  prod_id: string;
  crm_prod_id: string;
  skuName: string
}

interface GroupedProductCategory {
  product_name: string;
  skus: { sku_name: string; total_usercount: string; }[];
  total_users: number;
}

interface Task {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'follow-up' | 'meeting' | 'document-review' | 'approval' | 'negotiation' | 'onboarding' | 'support' | 'renewal' | 'other';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assigned_to: string;
  assigned_by: string;
  portal_customer_id: string | null;
  customer_domain: string | null;
  partner_id: string | null;
  portal_reseller_id: string;
  due_date: string | null;
  is_onboarding_task: boolean;
  assignee_name?: string;
  assignee_email?: string;
}

interface KBArticle {
  id: string;
  doc_name: string;
  doc_url: string;
}

interface LicenseHistoryItem {
  subscription_id: string;
  sku_name: string;
  added_licenses: string;
  previous_licenses: string;
  new_total_licenses: string;
  created_on: string;
  created_by: string;
}

interface InvoiceHistoryItem {
  invoice_no: string;
  invoice_date: string;
  plan_name: string;
  invoice_status: string;
  invoice_pdf_link: string;
}

const partnerTagOptions = [
  { id: 'asirt', label: 'ASIRT' },
  { id: 'isoda', label: 'ISODA' },
  { id: 'iamcp', label: 'IAMCP' },
  { id: 'bni', label: 'BNI' },
  { id: 'microsoft-direct-reseller', label: 'Microsoft Direct reseller' },
  { id: 'google-direct-reseller', label: 'Google Direct reseller' },
  { id: 'demanding', label: 'Demanding' },
  { id: 'badwords', label: 'Badwords' },
  { id: 'smb', label: 'SMB' },
  { id: 'mid-market', label: 'Mid-market' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'gov-business', label: 'GOV Business' },
  { id: 'office-in-usa', label: 'Office in USA' },
  { id: 'office-in-europe', label: 'Office in Europe' },
  { id: 'office-in-aus', label: 'Office in AUS' },
  { id: 'office-in-south-asia', label: 'Office in South Asia' },
  { id: 'office-in-africa', label: 'Office in Africa' },
  { id: 'office-in-dubai', label: 'Office in Dubai' },
] as const;

const sourceOfPartnerOptions = [
  { value: 'webinar', label: 'Webinar' },
  { value: 'event', label: 'Event' },
  { value: 'referral', label: 'Referral' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'whatsapp-campaign', label: 'Whatsapp Campaign' },
  { value: 'email-campaign', label: 'Email Campaign' },
  { value: 'shivaami', label: 'Shivaami' },
  { value: 'axima', label: 'Axima' },
  { value: 'management', label: 'Management' },
] as const;


const allCustomerColumns = [
  { id: 'customerName', label: 'Customer Name', isToggleable: false, defaultVisible: true },
  { id: 'domainName', label: 'Customer Domain', isToggleable: true, defaultVisible: true },
  { id: 'company', label: 'Company', isToggleable: true, defaultVisible: true },
  { id: 'processStage', label: 'Process Stage', isToggleable: true, defaultVisible: true },
  { id: 'products', label: 'Products', isToggleable: true, defaultVisible: false },
  { id: 'status', label: 'Status', isToggleable: true, defaultVisible: true },
  { id: 'value', label: 'Value', isToggleable: true, defaultVisible: false },
  { id: 'created', label: 'Created', isToggleable: true, defaultVisible: true },
];

const PartnerDetails = ({ partner, products, users, onBack, isDialogView = false }: PartnerDetailsProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [partnerCustomers, setPartnerCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [processFilter, setProcessFilter] = useState<string[]>(['all']);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDomainDetailView, setIsDomainDetailView] = useState(false);
  const [selectedCustomerForSub, setSelectedCustomerForSub] = useState<Customer | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetail[]>([]);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [drCases, setDrCases] = useState<DRCase[]>([]);
  const [drCurrentPage, setDrCurrentPage] = useState(1);
  const [drCaseSearchTerm, setDrCaseSearchTerm] = useState('');
  const [drStatusFilter, setDrStatusFilter] = useState('all');
  const [drCaseTypeFilter, setDrCaseTypeFilter] = useState('all');
  const [drDateFilter, setDrDateFilter] = useState('all');
  const [selectedDrCase, setSelectedDrCase] = useState<DRCase | null>(null); // This will now be used for the modal
  const [isDrCaseSplitView, setIsDrCaseSplitView] = useState(false);
  const [isLoadingDrCases, setIsLoadingDrCases] = useState(true);
  const [isRejectDrCaseDialogOpen, setIsRejectDrCaseDialogOpen] = useState(false);
  const [drCaseRejectionReason, setDrCaseRejectionReason] = useState('');
  const [selectedDrCaseForAction, setSelectedDrCaseForAction] = useState<DRCase | null>(null);
  const [comments, setComments] = useState<PartnerComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [discountHistory, setDiscountHistory] = useState<DiscountHistoryItem[]>([]);
  const [isDiscountHistoryLoading, setIsDiscountHistoryLoading] = useState(true);
  const [notes, setNotes] = useState<PartnerNote[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const drRecordsPerPage = 5;
  const [productTypesOpen, setProductTypesOpen] = useState(false);
  const [auxiliaryDataOpen, setAuxiliaryDataOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [drCasesOpen, setDrCasesOpen] = useState(false);
  const [partnerState, setPartnerState] = useState<Partner>(partner);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  const parseJsonSafe = (value: any): string[] => {
    if (!value) return [];
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
  const initialPartnerState: Partner = { 
    ...partner, 
    identity: parseJsonSafe(partner.identity), 
    zone: parseJsonSafe(partner.zone), 
    partner_tag: parseJsonSafe(partner.partner_tag), 
    partner_type: partner.partner_type || 'silver', 
    source_of_partner: partner.source_of_partner,
    contacts: partner.contacts, // Ensure contacts are passed through
    interactions: partner.interactions, // Ensure interactions are passed through
    feedback: (() => {
      if (typeof partner.feedback === 'string') {
        try { return JSON.parse(partner.feedback); } catch (e) { return []; }
      }
      // Ensure it's always an array
      return Array.isArray(partner.feedback) ? partner.feedback : [];
    })(),
  };

  const [isLoadingQuotations, setIsLoadingQuotations] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isQuotationSplitView, setIsQuotationSplitView] = useState(false);
  const [quotationSearchTerm, setQuotationSearchTerm] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('all');
  const [quotationCurrentPage, setQuotationCurrentPage] = useState(1);
  const quotationsPerPage = 5;
  const [quotationsOpen, setQuotationsOpen] = useState(false);
  const [isRejectQuotationDialogOpen, setIsRejectQuotationDialogOpen] = useState(false);
  const [quotationRejectionReason, setQuotationRejectionReason] = useState('');
  const [selectedQuotationForAction, setSelectedQuotationForAction] = useState<Quotation | null>(null);
  const [additionalContactsOpen, setAdditionalContactsOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // KYC and Documents state
  const [kycDetails, setKycDetails] = useState<any | null>(null);
  const [isKycLoading, setIsKycLoading] = useState(true);
  const [isKycDetailModalOpen, setIsKycDetailModalOpen] = useState(false);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [docViewerUrl, setDocViewerUrl] = useState<string | null>(null);
  const [docViewerTitle, setDocViewerTitle] = useState('');
  // State for Renewals
  const [renewals, setRenewals] = useState<PartnerRenewal[]>([]);
  const [isLoadingRenewals, setIsLoadingRenewals] = useState(true);
  const [renewalSearchTerm, setRenewalSearchTerm] = useState('');
  const [renewalStatusFilter, setRenewalStatusFilter] = useState('all');
  const [renewalCurrentPage, setRenewalCurrentPage] = useState(1);
  const [renewalsOpen, setRenewalsOpen] = useState(false);

  // State for License History
  const [licenseHistoryOpen, setLicenseHistoryOpen] = useState(false);
  const [isLoadingLicenseHistory, setIsLoadingLicenseHistory] = useState(false);
  const [licenseHistoryDetails, setLicenseHistoryDetails] = useState<LicenseHistoryItem[] | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [isLicenseHistoryDetailView, setIsLicenseHistoryDetailView] = useState(false);
  const [licenseHistoryCustomerPage, setLicenseHistoryCustomerPage] = useState(1);
  const licenseHistoryCustomersPerPage = 8; // 2 rows of 4
  const [licenseHistoryDetailsPage, setLicenseHistoryDetailsPage] = useState(1);
  const licenseHistoryDetailsPerPage = 5;

  // State for Invoice History
  const [invoiceHistoryOpen, setInvoiceHistoryOpen] = useState(false);
  const [isLoadingInvoiceHistory, setIsLoadingInvoiceHistory] = useState(false);
  const [invoiceHistoryDetails, setInvoiceHistoryDetails] = useState<InvoiceHistoryItem[] | null>(null);
  const [selectedCustomerForInvoiceHistory, setSelectedCustomerForInvoiceHistory] = useState<Customer | null>(null);
  const [isInvoiceHistoryDetailView, setIsInvoiceHistoryDetailView] = useState(false);
  const [invoiceHistoryCustomerPage, setInvoiceHistoryCustomerPage] = useState(1);
  const invoiceHistoryCustomersPerPage = 8; // 2 rows of 4
  const [invoiceHistoryDetailsPage, setInvoiceHistoryDetailsPage] = useState(1);
  const invoiceHistoryDetailsPerPage = 5;

  const [kycDocsOpen, setKycDocsOpen] = useState(false);
  const [isGenerateQuotationDialogOpen, setIsGenerateQuotationDialogOpen] = useState(false);
  const [isEditingPartnerProgram, setIsEditingPartnerProgram] = useState(false);
  const [isEditingAccountManager, setIsEditingAccountManager] = useState(false);
  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  // State for Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskCurrentPage, setTaskCurrentPage] = useState(1);
  const [isLoadingAccountManagers, setIsLoadingAccountManagers] = useState(false);
  const [quotationType, setQuotationType] = useState('new'); // 'new' or 'renewal'
  const [isEditing, setIsEditing] = useState(false);
  const [renewalManagersFromProfiles, setRenewalManagersFromProfiles] = useState<UserType[]>([]);
  const [isLoadingRenewalManagers, setIsLoadingRenewalManagers] = useState(true);
  const [isEditingRenewalManager, setIsEditingRenewalManager] = useState(false);
  // State for Share KB Modal
  const [isShareKbModalOpen, setIsShareKbModalOpen] = useState(false);
  const [kbSearchTerm, setKbSearchTerm] = useState('');
  const [kbArticles, setKbArticles] = useState<Record<string, KBArticle[]>>({}); // Keyed by portal_prod_id
  const [isLoadingKb, setIsLoadingKb] = useState<Record<string, boolean>>({}); // Loading state per product
  const [selectedKbDocs, setSelectedKbDocs] = useState<KBArticle[]>([]);
  const [isSharingKb, setIsSharingKb] = useState(false);

  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    type: 'other' as 'follow-up' | 'meeting' | 'document-review' | 'approval' | 'negotiation' | 'onboarding' | 'support' | 'renewal' | 'other',
    customerId: 'none',
    dueDate: '',
    assignedTo: ''
  });
  useEffect(() => {
    const fetchRenewalManagers = async () => {
      setIsLoadingRenewalManagers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role') // Fetch firstname and lastname separately
          .eq('role', 'renewal-bde'); // Fetch users with 'renewal-bde' role from profiles table

        if (error) throw error;
        // Concatenate firstname and lastname to create a 'name' field for UserType compatibility
        const formattedManagers = data.map(profile => ({
          ...profile,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        })) as UserType[];
        setRenewalManagersFromProfiles(formattedManagers);
      } catch (error: any) {
        toast({ title: "Error fetching Renewal Managers", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingRenewalManagers(false);
      }
    };
    fetchRenewalManagers();
  }, [toast]);
  const tasksPerPage = 5;

  // Effect to resolve renewal manager name if only ID is available
  useEffect(() => {
    console.log("partnerState",partnerState)
    if (partnerState.renewal_manager_id && !partnerState.renewal_manager_name && renewalManagersFromProfiles.length > 0) {
      const assignedManager = renewalManagersFromProfiles.find(
        (manager) => manager.id === partnerState.renewal_manager_id
      );
      console.log("asdas",assignedManager)
      if (assignedManager) {
        
        setPartnerState((prev) => ({
          ...prev,
          renewal_manager_name: assignedManager.name,
        }));
      }
    }
  }, [partnerState.renewal_manager_id, partnerState.renewal_manager_name, renewalManagersFromProfiles]);
  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      type: 'other',
      customerId: 'none',
      dueDate: '',
      assignedTo: ''
    });
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.assignedTo) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title and assign the task to a user.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingTask(true);

    const selectedCustomer = partnerCustomers.find(c => c.id === newTask.customerId);
    const assignedToUser = users.find(user => user.id === newTask.assignedTo);

    const taskToInsert = {
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      type: newTask.type,
      status: 'pending',
      assigned_to: newTask.assignedTo,
      assigned_to_email: assignedToUser?.email || null,
      assignee_name: assignedToUser?.name || null,
      assigned_by: user?.id,
      assigned_by_email: user?.email,
      assigned_by_name: user?.user_metadata?.first_name || user?.email,
      portal_customer_id: newTask.customerId === 'none' ? null : newTask.customerId,
      customer_domain: selectedCustomer?.domainName || null,
      partner_id: (partnerState as any).crm_id || null,
      partner_name: partnerState.name || null,
      partner_email: partnerState.email || null,
      partner_company: partnerState.company || null,
      partner_phnnumber: partnerState.phone || null,
      portal_reseller_id: partnerState.portal_reseller_id || null,
      due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
      is_onboarding_task: newTask.type === 'onboarding',
    };

    const taskToInsert_insupabase = {
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      type: newTask.type,
      status: 'pending',
      assigned_to: newTask.assignedTo,
      assigned_by: user?.id,
      portal_customer_id: newTask.customerId === 'none' ? null : newTask.customerId,
      customer_domain: selectedCustomer?.domainName || null,
      partner_id: (partnerState as any).crm_id || null,
      portal_reseller_id: partnerState.portal_reseller_id || null,
      due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
      is_onboarding_task: newTask.type === 'onboarding',
      partner_id: (partnerState as any).id || null,
    };
    console.log(partnerState)
    try {
      const { error } = await supabase.from('tasks').insert(taskToInsert_insupabase);

      if (error) throw error;

      toast({
        title: 'Task Created',
        description: 'The new task has been added successfully.',
      });
      setIsCreateTaskDialogOpen(false);
      resetNewTaskForm();
      fetchTasks(); // Refetch tasks after creating a new one

      const creatorName = user?.email || 'Unknown User';
      const logDetails = `User "${creatorName}" created new task: "${newTask.title}" for partner ${partnerState.name}`;
      await logCrmAction("Create Task", logDetails);

      try {
        await fetch(API_ENDPOINTS.SEND_TASK_NOTIFICATION_FRMCRM, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskToInsert),
        });
      } catch (e) {
        console.error("Notification failed", e);
      }

    } catch (error: any) {
      toast({
        title: 'Error Creating Task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const fetchKbArticles = async (portalProdId: string) => {
    if (!portalProdId || kbArticles[portalProdId]) {
      // Don't fetch if no ID or if already fetched
      return;
    }

    setIsLoadingKb(prev => ({ ...prev, [portalProdId]: true }));
    try {
      const formData = new FormData();
      formData.append('prod_id', portalProdId);

      const response = await fetch(API_ENDPOINTS.GET_KNOWLEDGEBASE_DOCS, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setKbArticles(prev => ({ ...prev, [portalProdId]: result.data }));
      } else {
        setKbArticles(prev => ({ ...prev, [portalProdId]: [] })); // Set empty array on failure or no data
        console.warn(result.message || 'No knowledge base articles found.');
      }
    } catch (error: any) {
      toast({
        title: "Error fetching Knowledge Base",
        description: error.message,
        variant: "destructive",
      });
      setKbArticles(prev => ({ ...prev, [portalProdId]: [] })); // Also set empty on catch
    } finally {
      setIsLoadingKb(prev => ({ ...prev, [portalProdId]: false }));
    }
  };

  const handleShareSelectedKb = async () => {
    if (selectedKbDocs.length === 0) {
      toast({
        title: "No articles selected",
        description: "Please select at least one knowledge base article to share.",
        variant: "destructive",
      });
      return;
    }

    setIsSharingKb(true);
    try {
      console.log("Sharing these KB articles with partner:", partner.email, selectedKbDocs);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Knowledge Base Shared", description: `${selectedKbDocs.length} article(s) have been shared with ${partner.name}.` });
      const logDetails = `Shared ${selectedKbDocs.length} KB articles with partner ${partner.name}. Articles: ${selectedKbDocs.map(d => d.doc_name).join(', ')}`;
      await logCrmAction("Share Knowledge Base", logDetails);
      setIsShareKbModalOpen(false);
      setSelectedKbDocs([]);
    } catch (error: any) {
      toast({ title: "Error Sharing", description: error.message, variant: "destructive" });
    } finally {
      setIsSharingKb(false);
    }
  };

  // State for Generate Quotation Modal
  // State for Product-wise Discounts
  const [productDiscountsOpen, setProductDiscountsOpen] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState('');
  const [newDiscountValue, setNewDiscountValue] = useState<number | ''>('');
  const [renewalDiscountValue, setRenewalDiscountValue] = useState<number | ''>('');
  const [addedProductDiscounts, setAddedProductDiscounts] = useState<
    { productId: string; productName: string; new_discount: number; renewal_discount: number; portal_prod_id: string | null; }[]
  >([]);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [isSavingDiscounts, setIsSavingDiscounts] = useState(false);
  const [isDiscountsLoading, setIsDiscountsLoading] = useState(true);
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);
  const [fetchedProductDiscounts, setFetchedProductDiscounts] = useState<FetchedProductDiscount[]>([]);
  const [productData, setProductData] = useState<Record<string, Record<string, string[]>>>({});
  const [isProductDataLoading, setIsProductDataLoading] = useState(false);
  const [selectedQuotationCustomer, setSelectedQuotationCustomer] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [planType, setPlanType] = useState('yearly');
  const [planDuration, setPlanDuration] = useState<number | ''>(1);
  const [selectedOem, setSelectedOem] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedSkuId, setSelectedSkuId] = useState(''); // New state for SKU ID
  const [licenseCount, setLicenseCount] = useState<number | ''>('');
  const [skuDiscount, setSkuDiscount] = useState<number | ''>('');
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [partnerConditions, setPartnerConditions] = useState('');
  const [customerConditions, setCustomerConditions] = useState('');
  const [isLoadingConditions, setIsLoadingConditions] = useState(false);
  const [quotationFor, setQuotationFor] = useState('customer');
  const [isGeneratingQuotation, setIsGeneratingQuotation] = useState(false);
  const [quotationExpiry, setQuotationExpiry] = useState('');

  const renewalsPerPage = 5;

  // State for Renewal Details split-view
  const [isRenewalDetailView, setIsRenewalDetailView] = useState(false);
  const [selectedRenewalForDetail, setSelectedRenewalForDetail] = useState<PartnerRenewal | null>(null);

  // State for Renewal Comments
  const [renewalComments, setRenewalComments] = useState<PartnerComment[]>([]);
  const [isRenewalCommentsLoading, setIsRenewalCommentsLoading] = useState(false);
  const [newRenewalComment, setNewRenewalComment] = useState('');
  const [isSubmittingRenewalComment, setIsSubmittingRenewalComment] = useState(false);

  // State for Renewal Suspension
  const [isSuspendRenewalDialogOpen, setIsSuspendRenewalDialogOpen] = useState(false);
  const [renewalToSuspend, setRenewalToSuspend] = useState<PartnerRenewal | null>(null);
  const [renewalSuspensionReason, setRenewalSuspensionReason] = useState('');
  const [isSuspendingRenewal, setIsSuspendingRenewal] = useState(false);


  const [documentUrls, setDocumentUrls] = useState<{ resellerAgreement: string; kycSignedForm: string; }>({
    resellerAgreement: '',
    kycSignedForm: '',
  });
  const [isDocsLoading, setIsDocsLoading] = useState(true);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        setAllProducts(data as Product[]);
      } catch (error: any) {
        toast({
          title: "Error fetching products",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchAllProducts();
  }, [toast]);

  // Fetch product data for SKU-wise discount dropdowns
  useEffect(() => {
    const fetchProductDataForDiscounts = async () => {
      setIsProductDataLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.GET_PRODUCT_DATA_ONCRM, { // Using the correct endpoint from api.ts
          method: 'GET',
        });
 
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          setProductData(result.data);
        } else {
          setProductData({});
          console.warn(result.message || 'No product data found for discounts.');
        }
      } catch (error: any) {
        toast({
          title: "Error fetching product data",
          description: error.message,
          variant: "destructive",
        });
        setProductData({});
      } finally {
        setIsProductDataLoading(false);
      }
    };
    fetchProductDataForDiscounts();
  }, [toast]);

  useEffect(() => {
    console.log("Partner Details Prop:", partner);
  }, [partner]);

  useEffect(() => {
    const fetchDialogData = async () => {
      setIsProductDataLoading(true);
      setIsLoadingConditions(true);

      try {
        const [productDataRes, partnerCondRes, customerCondRes] = await Promise.all([ // Renamed productRes to productDataRes
          fetch(API_ENDPOINTS.GET_PRODUCT_DATA_ONCRM, {
            method: 'GET',
          }),
          fetch(API_ENDPOINTS.GET_RESELLER_CONDITIONS_ONCRM, {
            method: 'POST',
          }),
          fetch(API_ENDPOINTS.GET_CUSTOMER_CONDITIONS_ONCRM, {
            method: 'POST',
          })
        ]);

        // Process Product Data
        const productResult = await productDataRes.json();
        if (productResult.success) {
          setProductData(productResult.data);
        } else {
          throw new Error(productResult.message || "Failed to fetch product data");
        }

        // Process Partner Conditions
        const partnerResult = await partnerCondRes.json();
        if (partnerResult.success && Array.isArray(partnerResult.data)) {
          const conditionsText = partnerResult.data
            .map((item: { resellers_conditions: string }, index: number) => `${index + 1}. ${item.resellers_conditions.replace(/\r/g, '')}`)
            .join('\n');
          setPartnerConditions(conditionsText);
          console.log(partnerConditions)
        }

        // Process Customer Conditions
        const customerResult = await customerCondRes.json();
        if (customerResult.success && Array.isArray(customerResult.data)) {
          const conditionsText = customerResult.data
            .map((item: { conditions: string }, index: number) => `${index + 1}. ${item.conditions.replace(/\r/g, '')}`)
            .join('\n');
          setCustomerConditions(conditionsText);
          console.log(customerConditions)
        }
      } catch (error: any) {
        console.error("Failed to fetch dialog data", error);
        toast({ title: "Error", description: `Could not load data for quotation: ${error.message}`, variant: "destructive" });
      } finally {
        setIsProductDataLoading(false);
        setIsLoadingConditions(false);
      }
    };

    if (isGenerateQuotationDialogOpen) {
      fetchDialogData();
    }
  }, [isGenerateQuotationDialogOpen, toast]);

  const fetchProductDiscounts = async () => {
    if (!partner.portal_reseller_id) {
      setIsDiscountsLoading(false);
      return;
    }
    setIsDiscountsLoading(true);
    try {
      const formData = new FormData();
      formData.append('portal_reseller_id', partner.portal_reseller_id);

      const response = await fetch(API_ENDPOINTS.GET_SKUWISE_DISCOUNT_ONCRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      console.log("api", result)
      if (result.success && Array.isArray(result.data)) {
        const mappedDiscounts: FetchedProductDiscount[] = result.data.map((item: any) => ({ // Corrected mapping
          productId: item.crm_prod_id, // Map API's crm_prod_id to interface's productId
          skuName: item.product_name, // Map API's product_name to interface's skuName
          discount: item.discount, // Normal discount
          renewal_discount: item.renewal_discount,
          sku_id: item.sku_id || '', // Assuming API might return sku_id, default to empty
          prod_id: item.prod_id,
          crm_prod_id: item.crm_prod_id, // Keep crm_prod_id for consistency if needed
          total_usercount: item.total_usercount || '', // Assuming API might return total_usercount
          skuName: item.sku_name,
        }));
        setFetchedProductDiscounts(mappedDiscounts);
      } else {
        setFetchedProductDiscounts([]);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching product discounts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDiscountsLoading(false);
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
      formData.append('path', 'Partner Details');
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
    const fetchAccountManagers = async () => {
      setIsLoadingAccountManagers(true);
      try {
        const response = await fetch(API_ENDPOINTS.GET_ACCOUNT_MGR_NAMES_ONCRM);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && result.data?.data_result) {
          setAccountManagers(result.data.data_result);
        } else {
          setAccountManagers([]);
          throw new Error(result.message || "Failed to fetch account managers.");
        }
      } catch (error: any) {
        toast({
          title: "Error fetching Account Managers",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingAccountManagers(false);
      }
    };
    fetchAccountManagers();
  }, [toast]);

  const recordsPerPage = 5; // Max 5 rows per page
  const assignedUsers = users.filter(u => partner.assignedUserIds?.includes(u.id));

  const uniqueCaseTypes = useMemo(() => {
    const types = new Set(drCases.map(c => c.case_type).filter(Boolean));
    return Array.from(types);
  }, [drCases]);

  const uniqueQuotationStatuses = useMemo(() => {
    const statuses = new Set(quotations.map(q => q.order_status).filter(Boolean));
    return Array.from(statuses);
  }, [quotations]);

  const filteredDrCases = useMemo(() => {
    return drCases.filter(drCase => {
      const searchTerm = drCaseSearchTerm.toLowerCase();
      const searchMatch = !searchTerm || (
        drCase.domain_name?.toLowerCase().includes(searchTerm) ||
        drCase.customer_name?.toLowerCase().includes(searchTerm) ||
        drCase.case_name?.toLowerCase().includes(searchTerm) ||
        drCase.case_type?.toLowerCase().includes(searchTerm)
      );

      const statusMatch = drStatusFilter === 'all' || drCase.status === drStatusFilter;

      const caseTypeMatch = drCaseTypeFilter === 'all' || drCase.case_type === drCaseTypeFilter;

      let dateMatch = true;
      if (drDateFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const caseDate = new Date(drCase.created_date);
        caseDate.setHours(0, 0, 0, 0);

        const daysDiff = (today.getTime() - caseDate.getTime()) / (1000 * 3600 * 24);

        switch (drDateFilter) {
          case 'last-7-days':
            if (daysDiff < 0 || daysDiff > 7) dateMatch = false;
            break;
          case 'last-30-days':
            if (daysDiff < 0 || daysDiff > 30) dateMatch = false;
            break;
          case 'last-90-days':
            if (daysDiff < 0 || daysDiff > 90) dateMatch = false;
            break;
        }
      }

      return searchMatch && statusMatch && caseTypeMatch && dateMatch;
    });
  }, [drCases, drCaseSearchTerm, drStatusFilter, drCaseTypeFilter, drDateFilter]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter(quotation => {
      const searchTerm = quotationSearchTerm.toLowerCase();
      const searchMatch = !searchTerm || (
        quotation.domain_name?.toLowerCase().includes(searchTerm) ||
        quotation.customer_name?.toLowerCase().includes(searchTerm) ||
        quotation.quotation_id?.toLowerCase().includes(searchTerm)
      );
      const statusMatch = quotationStatusFilter === 'all' || quotation.order_status === quotationStatusFilter;
      return searchMatch && statusMatch;
    });
  }, [quotations, quotationSearchTerm, quotationStatusFilter]);

  const filteredRenewals = useMemo(() => {
    return renewals.filter(renewal => {
      const searchTerm = renewalSearchTerm.toLowerCase();
      const searchMatch = !searchTerm ||
        renewal.customerDomain?.toLowerCase().includes(searchTerm) ||
        renewal.skuName.toLowerCase().includes(searchTerm);
      const statusMatch = renewalStatusFilter === 'all' || renewal.status === renewalStatusFilter;
      return searchMatch && statusMatch;
    });
  }, [renewals, renewalSearchTerm, renewalStatusFilter]);
  // Filter customers by process stage

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchTerm = taskSearchTerm.toLowerCase();
      const searchMatch = !searchTerm ||
        task.title.toLowerCase().includes(searchTerm) ||
        task.customer_domain?.toLowerCase().includes(searchTerm) ||
        task.assignee_name?.toLowerCase().includes(searchTerm) ||
        task.assignee_email?.toLowerCase().includes(searchTerm);

      const statusMatch = taskStatusFilter === 'all' || task.status === taskStatusFilter;
      const priorityMatch = taskPriorityFilter === 'all' || task.priority === taskPriorityFilter;

      return searchMatch && statusMatch && priorityMatch;
    });
  }, [tasks, taskSearchTerm, taskStatusFilter, taskPriorityFilter]);

  const fetchTasks = async () => {
    if (!partner.portal_reseller_id) return;
    console.log(partner.id)
    setIsLoadingTasks(true);
    try {
      const { data, error } = await supabase.from('tasks').select('*, assignee:assigned_to(first_name, email)').eq('partner_id', partner.id).order('created_at', { ascending: false });
      if (error) throw error;
      const formattedTasks = data.map((t: any) => ({ ...t, assignee_name: t.assignee?.name, assignee_email: t.assignee?.email }));
      setTasks(formattedTasks);
    } catch (error: any) {
      toast({ title: "Error fetching tasks", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const filteredCustomers = partnerCustomers.filter(customer => {
    const processMatch = processFilter.includes('all') || processFilter.includes(customer.process);
    const searchMatch = !customerSearchTerm ||
      customer.domainName?.toLowerCase().includes(customerSearchTerm.toLowerCase());
    return processMatch && searchMatch;
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    allCustomerColumns.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultVisible }), {})
  );

  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
    setVisibleColumns(prev => ({ ...prev, [columnId]: isVisible }));
  };

  // Pagination logic for customers
  const totalPages = Math.ceil(filteredCustomers.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentCustomerRecords = filteredCustomers.slice(indexOfFirstRecord, indexOfLastRecord);

  // Pagination logic for DR Cases
  const totalDrPages = Math.ceil(filteredDrCases.length / drRecordsPerPage);
  const indexOfLastDrRecord = drCurrentPage * drRecordsPerPage;
  const indexOfFirstDrRecord = indexOfLastDrRecord - drRecordsPerPage;
  const currentDrCaseRecords = filteredDrCases.slice(indexOfFirstDrRecord, indexOfLastDrRecord);

  // Pagination logic for Quotations
  const totalQuotationPages = Math.ceil(filteredQuotations.length / quotationsPerPage);
  const indexOfLastQuotationRecord = quotationCurrentPage * quotationsPerPage;
  const indexOfFirstQuotationRecord = indexOfLastQuotationRecord - quotationsPerPage;
  const currentQuotationRecords = filteredQuotations.slice(indexOfFirstQuotationRecord, indexOfLastQuotationRecord);

  // Pagination logic for Tasks
  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const indexOfLastTaskRecord = taskCurrentPage * tasksPerPage;
  const indexOfFirstTaskRecord = indexOfLastTaskRecord - tasksPerPage;
  const currentTaskRecords = filteredTasks.slice(indexOfFirstTaskRecord, indexOfLastTaskRecord);

  // Pagination logic for Renewals
  const totalRenewalPages = Math.ceil(filteredRenewals.length / renewalsPerPage);
  const indexOfLastRenewalRecord = renewalCurrentPage * renewalsPerPage;
  const indexOfFirstRenewalRecord = indexOfLastRenewalRecord - renewalsPerPage;
  const currentRenewalRecords = filteredRenewals.slice(indexOfFirstRenewalRecord, indexOfLastRenewalRecord);

  // Pagination logic for license history customers
  const totalLicenseHistoryCustomerPages = Math.ceil(partnerCustomers.length / licenseHistoryCustomersPerPage);
  const indexOfLastLicenseHistoryCustomer = licenseHistoryCustomerPage * licenseHistoryCustomersPerPage;
  const indexOfFirstLicenseHistoryCustomer = indexOfLastLicenseHistoryCustomer - licenseHistoryCustomersPerPage;
  const currentLicenseHistoryCustomers = partnerCustomers.slice(indexOfFirstLicenseHistoryCustomer, indexOfLastLicenseHistoryCustomer);

  // Pagination logic for license history details
  const filteredLicenseHistoryDetails = licenseHistoryDetails || [];
  const totalLicenseHistoryDetailsPages = Math.ceil(filteredLicenseHistoryDetails.length / licenseHistoryDetailsPerPage);
  const indexOfLastLicenseHistoryDetail = licenseHistoryDetailsPage * licenseHistoryDetailsPerPage;
  const indexOfFirstLicenseHistoryDetail = indexOfLastLicenseHistoryDetail - licenseHistoryDetailsPerPage;
  const currentLicenseHistoryDetails = filteredLicenseHistoryDetails.slice(indexOfFirstLicenseHistoryDetail, indexOfLastLicenseHistoryDetail);

  // Pagination logic for invoice history customers
  const totalInvoiceCustomerPages = Math.ceil(partnerCustomers.length / invoiceHistoryCustomersPerPage);
  const indexOfLastInvoiceCustomer = invoiceHistoryCustomerPage * invoiceHistoryCustomersPerPage;
  const indexOfFirstInvoiceCustomer = indexOfLastInvoiceCustomer - invoiceHistoryCustomersPerPage;
  const currentInvoiceCustomers = partnerCustomers.slice(indexOfFirstInvoiceCustomer, indexOfLastInvoiceCustomer);

  // Pagination logic for invoice history details
  const filteredInvoiceDetails = invoiceHistoryDetails || [];
  const totalInvoiceDetailsPages = Math.ceil(filteredInvoiceDetails.length / invoiceHistoryDetailsPerPage);
  const indexOfLastInvoiceDetail = invoiceHistoryDetailsPage * invoiceHistoryDetailsPerPage;
  const indexOfFirstInvoiceDetail = indexOfLastInvoiceDetail - invoiceHistoryDetailsPerPage;
  const currentInvoiceDetails = filteredInvoiceDetails.slice(indexOfFirstInvoiceDetail, indexOfLastInvoiceDetail);
  const handleAddComment = async () => {
    if (!newComment.trim() || !user) {
      toast({ title: "Comment cannot be empty", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);
    try {
      const creatorName = (profile?.first_name || profile?.last_name) ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : user.email;
      const { error } = await supabase.from('partner_comments').insert({
        partner_id: partner.id,
        portal_reseller_id: partner.portal_reseller_id,
        partner_name: partner.name,
        comment: newComment,
        created_by_name: creatorName,
        created_by: user.id,
      });

      if (error) throw error;

      toast({ title: "Comment Added", description: "Your comment has been saved." });
      setNewComment('');
      // Refetch comments
      const { data } = await supabase.from('partner_comments').select('*').eq('portal_reseller_id', partner.portal_reseller_id).order('created_at', { ascending: false });
      setComments((data || []).map(c => ({ ...c, created_at: new Date(c.created_at) })) as unknown as PartnerComment[]);

    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  useEffect(() => {
    const fetchPartnerCustomers = async () => {
      if (!partner.email) {
        toast({ title: "Error", description: "Partner email is missing.", variant: "destructive" });
        setIsLoadingCustomers(false);
        return;
      }
      setIsLoadingCustomers(true);
      try {
        const formData = new FormData();
        formData.append('reseller_email', partner.email);

        const response = await fetch(API_ENDPOINTS.GET_CUSTOMER_LIST_OF_RESELLER_CRM, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log(result)
        if (!result.success || !result.data || !result.data.data_result) {
          throw new Error('Invalid API response structure');
        }

        const apiCustomers = result.data.data_result;
        const mappedCustomers: Customer[] = apiCustomers.map((c: any) => ({
          id: c.cust_id,
          name: c.customer_name || 'N/A',
          email: c.customer_emailid || '',
          phone: c.customer_contact_number || '',
          company: c.customer_company_name || c.customer_domainname,
          domainName: c.customer_domainname,
          status: 'active', // Default value
          process: 'won', // Default value
          partnerId: partner.id,
          productIds: [], // Default value
          createdAt: new Date(c.created_on),
          value: 0, // Default value
          google_custid: c.googlecust_id,
          zoho_id: c.zohocontact_id
        }));
        setPartnerCustomers(mappedCustomers);
      } catch (error: any) {
        toast({ title: "Error fetching partner's customers", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchPartnerCustomers();
  }, [partner.id, partner.email, toast]);

  useEffect(() => {
    const fetchDrCases = async () => {
      if (!partner.email) {
        setIsLoadingDrCases(false);
        return;
      }
      setIsLoadingDrCases(true);
      try {
        const formData = new FormData();
        formData.append('reseller_email', partner.email);

        const response = await fetch(API_ENDPOINTS.GET_RESELLER_CASES_LIST_ONCRM, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data && result.data.data_result) {
          setDrCases(result.data.data_result);
        } else {
          setDrCases([]);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching DR Cases",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingDrCases(false);
      }
    };

    fetchDrCases();
  }, [partner.email, toast]);

  useEffect(() => {
    const fetchQuotations = async () => {
      if (!partner.email) {
        setIsLoadingQuotations(false);
        return;
      }
      setIsLoadingQuotations(true);
      try {
        const formData = new FormData();
        formData.append('reseller_email', partner.email);

        const response = await fetch(API_ENDPOINTS.GET_CUSTOMER_QUOTATION_LIST_ONCRM, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data && result.data.data_result) {
          setQuotations(result.data.data_result);
          console.log(result.data.data_result)
        } else {
          setQuotations([]);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching Quotations",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingQuotations(false);
      }
    };
    fetchQuotations();
  }, [partner.email, toast]);

  useEffect(() => {
    const fetchPartnerAuxiliaryData = async () => {
      if (!partner.portal_reseller_id) {
        setIsCommentsLoading(false);
        setIsDiscountHistoryLoading(false);
        setIsNotesLoading(false);
        return;
      }

      // Fetch Comments
      setIsCommentsLoading(true);
      supabase.from('partner_comments').select('*').eq('portal_reseller_id', partner.portal_reseller_id).order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            toast({ title: "Error fetching comments", description: error.message, variant: "destructive" });
            setComments([]);
          } else {
            setComments((data || []).map(c => ({ ...c, created_at: new Date(c.created_at) })) as unknown as PartnerComment[]);
          }
          setIsCommentsLoading(false);
        });

      // Fetch Discount History
      setIsDiscountHistoryLoading(true);
      const discountFormData = new FormData();
      discountFormData.append('reseller_id', partner.portal_reseller_id);
      fetch(API_ENDPOINTS.GET_RESELLER_DISCOUNT_LIST_ONCRM, { method: 'POST', body: discountFormData })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data?.data_result) {
            setDiscountHistory(result.data.data_result);
          } else {
            setDiscountHistory([]);
            if (!result.success && result.message) throw new Error(result.message);
          }
        })
        .catch(error => {
          console.error("Could not fetch discount history:", error.message);
          setDiscountHistory([]);
        })
        .finally(() => setIsDiscountHistoryLoading(false));

      // Fetch Notes
      setIsNotesLoading(true);
      supabase.from('partner_notes').select('*').eq('portal_reseller_id', partner.portal_reseller_id).order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            toast({ title: "Error fetching notes", description: error.message, variant: "destructive" });
            setNotes([]);
          } else {
            setNotes((data || []).map(n => ({ ...n, created_at: new Date(n.created_at) })) as unknown as PartnerNote[]);
          }
          setIsNotesLoading(false);
        });
    };

    fetchPartnerAuxiliaryData();
  }, [partner.portal_reseller_id, toast]);

  useEffect(() => {
    const fetchRenewals = async () => {
      if (!partner.email) {
        setIsLoadingRenewals(false);
        return;
      }
      setIsLoadingRenewals(true);
      try {
        const formData = new FormData();
        formData.append('reselleremail', partner.email);

        const response = await fetch(API_ENDPOINTS.GET_RESELLERRENEWAL_DETAILS, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setRenewals(result.data);
        } else {
          setRenewals([]);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching Renewals",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingRenewals(false);
      }
    };
    fetchRenewals();
  }, [partner.email, toast]);
  const submitDrCaseAction = async (drCase: DRCase, status: 'Accepted' | 'Rejected', reason: string) => {
    try {
      const formData = new FormData();
      formData.append('caseid', drCase.case_id);
      formData.append('casestatus', status);
      formData.append('reseller_email', partner.email);
      formData.append('domainname', drCase.domain_name);
      if (reason) {
        formData.append('reason', reason);
      }

      const response = await fetch(API_ENDPOINTS.UPDATE_CASESTATUS_ONCRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update case status.');
      }

      toast({
        title: `Case ${status}`,
        description: `Case ${drCase.case_id} has been successfully updated.`,
      });

      // Update local state to reflect the change
      setDrCases(prevCases => prevCases.map(c =>
        c.case_id === drCase.case_id ? { ...c, status: status } : c
      ));

      // Log the action
      const logDetails = `DR Case ${drCase.case_id} (${drCase.case_name}) for partner ${partner.name} was ${status}. ${reason ? `Reason: ${reason}` : ''}`;
      await logCrmAction(`DR Case ${status}`, logDetails);

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update case status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDrCaseAction = (drCase: DRCase, action: 'accept' | 'reject') => {
    setSelectedDrCaseForAction(drCase);
    if (action === 'reject') {
      setIsRejectDrCaseDialogOpen(true);
    } else {
      submitDrCaseAction(drCase, 'Accepted', '');
    }
  };

  const fetchDocuments = async () => {
    if (!partner.portal_reseller_id) {
      setIsDocsLoading(false);
      return;
    }
    setIsDocsLoading(true);
    try {
      const formData = new FormData();
      formData.append('portal_reseller_id', partner.portal_reseller_id);

      const response = await fetch(API_ENDPOINTS.GET_DOCS_ON_CRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const result = await response.json();
      if (result.success && result.file_data) {
        setDocumentUrls({
          resellerAgreement: result.file_data.resellerAgreement || '',
          kycSignedForm: result.file_data.kycSignedForm || '',
        });
      } else {
        setDocumentUrls({ resellerAgreement: '', kycSignedForm: '' });
      }
    } catch (error: any) {
      toast({ title: "Error fetching documents", description: error.message, variant: "destructive" });
      setDocumentUrls({ resellerAgreement: '', kycSignedForm: '' });
    } finally {
      setIsDocsLoading(false);
    }
  };

  const fetchKycDetails = async () => {
    if (!partner.portal_reseller_id) {
      setIsKycLoading(false);
      return;
    }
    setIsKycLoading(true);
    try {
      const formData = new FormData();
      formData.append('reseller_id', partner.portal_reseller_id);

      const response = await fetch(API_ENDPOINTS.GET_RESELLER_KYC_DETAILS_CRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result.success && result.data && result.data.data_result && result.data.data_result.length > 0) {
        setKycDetails(result.data.data_result[0]);
        // Update partner state with city and state from KYC
        const kycData = result.data.data_result[0];
        setPartnerState(prevState => ({
          ...prevState,
          // Prioritize office address, fallback to registered address, then to existing state
          city: kycData.pr_city || kycData.city || prevState.city,
          state: kycData.pr_state || kycData.state || prevState.state,
        }));
      } else {
        setKycDetails(null);
      }
    } catch (error: any) {
      toast({ title: "Error fetching KYC details", description: error.message, variant: "destructive" });
      setKycDetails(null);
    } finally {
      setIsKycLoading(false);
    }
  };

  useEffect(() => {
    if (partner.portal_reseller_id) {
      fetchKycDetails();
      fetchDocuments();
      fetchProductDiscounts();
      fetchTasks();
    }
  }, [partner.portal_reseller_id, toast]);
  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [processFilter, customerSearchTerm]);

  useEffect(() => {
    // Reset DR cases to first page when search term or filters change
    setDrCurrentPage(1);
  }, [drCaseSearchTerm, drStatusFilter, drCaseTypeFilter, drDateFilter]);

  useEffect(() => {
    // Reset Quotations to first page when search term or filters change
    setQuotationCurrentPage(1);
  }, [quotationSearchTerm, quotationStatusFilter]);

  useEffect(() => {
    // Reset Tasks to first page when search term or filters change
    setTaskCurrentPage(1);
  }, [quotationSearchTerm, quotationStatusFilter]);

  useEffect(() => {
    // Reset Renewals to first page when search term or filters change
    setRenewalCurrentPage(1);
  }, [renewalSearchTerm, renewalStatusFilter]);

  const handleConfirmRejection = async () => {
    if (selectedDrCaseForAction && drCaseRejectionReason.trim()) {
      await submitDrCaseAction(selectedDrCaseForAction, 'Rejected', drCaseRejectionReason);
      setIsRejectDrCaseDialogOpen(false);
      setDrCaseRejectionReason('');
    }
  };

  const fetchSubscriptionDetails = async (customerId: string, resellerId: string) => {
    setIsSubscriptionLoading(true);
    setSubscriptionDetails([]);
    try {
      const formData = new FormData();
      formData.append('cust_id', customerId);
      formData.append('reseller_id', resellerId);

      const response = await fetch(API_ENDPOINTS.GET_RESELLER_DOMAIN_SUBSCRIPTIONDETAILS, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.subscription_details) {
        setSubscriptionDetails(result.data.subscription_details);
      } else {
        setSubscriptionDetails([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch subscription details: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  const handleCustomerRowClick = (customer: Customer) => {
    if (partner.portal_reseller_id) {
      setSelectedCustomerForSub(customer);
      setIsDomainDetailView(true);
      fetchSubscriptionDetails(customer.id, partner.portal_reseller_id);
    } else {
      toast({ title: "Missing Information", description: "This partner does not have a portal reseller ID.", variant: "destructive" });
    }
  };

  const handleDomainListItemClick = (customer: Customer) => {
    if (partner.portal_reseller_id) {
      setSelectedCustomerForSub(customer);
      fetchSubscriptionDetails(customer.id, partner.portal_reseller_id);
    } else {
      toast({
        title: "Missing Information",
        description: "This partner does not have a portal reseller ID to fetch subscription data.",
        variant: "destructive"
      });
    }
  };

  const openDocViewer = (url: string, title: string) => {
    setDocViewerUrl(url);
    setDocViewerTitle(title);
    setIsDocViewerOpen(true);
  };

  const handleCloseDomainDetailView = () => {
    setIsDomainDetailView(false);
    setSelectedCustomerForSub(null);
    setSubscriptionDetails([]);
    setCustomerSearchTerm(''); // Reset search term for the domain list
  };

  // Calculate statistics
  const prospects = partnerCustomers.filter(c => ['prospect', 'demo', 'poc', 'negotiating'].includes(c.process));
  const purchased = partnerCustomers.filter(c => ['won', 'deployment'].includes(c.process));
  const lost = partnerCustomers.filter(c => c.process === 'lost');
  const conversionRate = partnerCustomers.length > 0 ? Math.round((purchased.length / partnerCustomers.length) * 100) : 0;

  // Individual stage counts for detailed filtering
  const stageCounts = {
    prospect: partnerCustomers.filter(c => c.process === 'prospect').length,
    demo: partnerCustomers.filter(c => c.process === 'demo').length,
    poc: partnerCustomers.filter(c => c.process === 'poc').length,
    negotiating: partnerCustomers.filter(c => c.process === 'negotiating').length,
    won: partnerCustomers.filter(c => c.process === 'won').length,
    deployment: partnerCustomers.filter(c => c.process === 'deployment').length,
    lost: partnerCustomers.filter(c => c.process === 'lost').length,
  };

  // Quick filter functions
  const setQuickFilter = (filterType: string) => {
    switch (filterType) {
      case 'all':
        setProcessFilter(['all']);
        break;
      case 'prospects':
        setProcessFilter(['prospect', 'demo', 'poc', 'negotiating']);
        break;
      case 'purchased':
        setProcessFilter(['won', 'deployment']);
        break;
      case 'lost':
        setProcessFilter(['lost']);
        break;
      case 'active-pipeline':
        setProcessFilter(['prospect', 'demo', 'poc', 'negotiating']);
        break;
      default:
        setProcessFilter([filterType]);
    }
  };

  const toggleStageFilter = (stage: string) => {
    if (processFilter.includes('all')) {
      setProcessFilter([stage]);
      return;
    }

    if (processFilter.includes(stage)) {
      const newFilter = processFilter.filter(f => f !== stage);
      setProcessFilter(newFilter.length === 0 ? ['all'] : newFilter);
    } else {
      setProcessFilter([...processFilter, stage]);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const getPaymentTermsColor = (terms: string) => {
    switch (terms) {
      case 'annual-in-advance': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'quarterly': return 'bg-cyan-100 text-cyan-800';
      case 'half-yearly': return 'bg-teal-100 text-teal-800';
      case 'net-15': return 'bg-lime-100 text-lime-800';
      case 'net-30': return 'bg-yellow-100 text-yellow-800';
      case 'net-45': return 'bg-amber-100 text-amber-800';
      case 'net-60': return 'bg-orange-100 text-orange-800';
      case 'net-90': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTermsLabel = (terms: string) => {
    switch (terms) {
      case 'annual-in-advance': return 'Annual in Advance';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'half-yearly': return 'Half Yearly';
      case 'net-15': return 'Net 15';
      case 'net-30': return 'Net 30';
      case 'net-45': return 'Net 45';
      case 'net-60': return 'Net 60';
      case 'net-90': return 'Net 90';
      default: return terms;
    }
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'north': return 'bg-blue-100 text-blue-800';
      case 'east': return 'bg-green-100 text-green-800';
      case 'west': return 'bg-orange-100 text-orange-800';
      case 'south': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIdentityLabel = (identity: string) => {
    switch (identity) {
      case 'web-app-developer': return 'Web/App Developer';
      case 'system-integrator': return 'System Integrator';
      case 'managed-service-provider': return 'Managed Service Provider';
      case 'digital-marketer': return 'Digital Marketer';
      case 'cyber-security': return 'Cyber Security';
      case 'cloud-hosting': return 'Cloud Hosting';
      case 'web-hosting': return 'Web Hosting';
      case 'hardware': return 'Hardware';
      case 'cloud-service-provider': return 'Cloud Service Provider';
      case 'microsoft-partner': return 'Microsoft Partner';
      case 'aws-partner': return 'AWS Partner';
      case 'it-consulting': return 'IT Consulting';
      case 'freelance': return 'Freelance';
      default: return identity;
    }
  };

  const getIdentityColor = (identity: string) => {
    switch (identity) {
      case 'web-app-developer': return 'bg-blue-100 text-blue-800';
      case 'system-integrator': return 'bg-green-100 text-green-800';
      case 'managed-service-provider': return 'bg-purple-100 text-purple-800';
      case 'digital-marketer': return 'bg-orange-100 text-orange-800';
      case 'cyber-security': return 'bg-red-100 text-red-800';
      case 'cloud-hosting': return 'bg-cyan-100 text-cyan-800';
      case 'web-hosting': return 'bg-indigo-100 text-indigo-800';
      case 'hardware': return 'bg-gray-100 text-gray-800';
      case 'cloud-service-provider': return 'bg-sky-100 text-sky-800';
      case 'microsoft-partner': return 'bg-blue-100 text-blue-800';
      case 'aws-partner': return 'bg-yellow-100 text-yellow-800';
      case 'it-consulting': return 'bg-emerald-100 text-emerald-800';
      case 'freelance': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPartnerTagLabel = (tagId: string) => {
    const tag = partnerTagOptions.find(t => t.id === tagId);
    return tag ? tag.label : tagId;
  };

  const getSourceOfPartnerLabel = (sourceId?: string) => {
    if (!sourceId) return 'Not Set';
    const source = sourceOfPartnerOptions.find(s => s.value === sourceId);
    return source ? source.label : sourceId;
  };

  const getProcessStageColor = (process: string) => {
    switch (process) {
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'demo': return 'bg-blue-100 text-blue-800';
      case 'poc': return 'bg-indigo-100 text-indigo-800';
      case 'negotiating': return 'bg-orange-100 text-orange-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'deployment': return 'bg-emerald-100 text-emerald-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessStageLabel = (process: string) => {
    switch (process) {
      case 'prospect': return 'Prospect';
      case 'demo': return 'Demo';
      case 'poc': return 'POC';
      case 'negotiating': return 'Negotiating';
      case 'won': return 'Won';
      case 'deployment': return 'Deployment';
      case 'lost': return 'Lost';
      default: return process;
    }
  };

  const getAssignedUserNames = (userIds?: string[]) => {
    if (!userIds || userIds.length === 0) return 'Unassigned';
    return userIds
      .map(id => users.find(u => u.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getDrCaseStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'Pending':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'void':
      case 'cancelled':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssigneeName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unassigned';
  };
  const getRenewalStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'due': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'renewed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'due': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'renewed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'upcoming': return <Clock size={16} className="text-blue-600" />;
      case 'due': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'overdue': return <XCircle size={16} className="text-red-600" />;
      case 'renewed': return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled': return <XCircle size={16} className="text-gray-600" />;
      case 'suspended': return <AlertTriangle size={16} className="text-orange-600" />;
      case 'active': return <Activity size={16} className="text-green-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };


  const getDaysUntilRenewal = (renewalDateStr: string) => {
    if (!renewalDateStr) return null;
    // Assuming renewal_date is in 'YYYY-MM-DD' format
    const renewalDate = new Date(renewalDateStr);
    const today = new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const getQuotationOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Pending':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'Expired':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const fetchRenewalComments = async (renewalId: string) => {
    setIsRenewalCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('renewal_comments')
        .select('*')
        .eq('renewal_id', renewalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRenewalComments((data || []).map(c => ({ ...c, created_at: new Date(c.created_at) })) as unknown as PartnerComment[]);
    } catch (error: any) {
      toast({ title: "Error fetching renewal comments", description: error.message, variant: "destructive" });
    } finally {
      setIsRenewalCommentsLoading(false);
    }
  };

  const handleAddRenewalComment = async () => {
    if (!newRenewalComment.trim() || !user || !selectedRenewalForDetail) return;

    setIsSubmittingRenewalComment(true);
    try {
      const creatorName = user.email; // Simplified for now

      const { data, error } = await supabase
        .from('renewal_comments')
        .insert({
          renewal_id: selectedRenewalForDetail.subscriptionId,
          comment: newRenewalComment,
          created_by_id: user.id,
          created_by_name: creatorName,
        })
        .select();

      if (error) throw error;

      setRenewalComments(prev => [{ ...data[0], created_at: new Date(data[0].created_at) } as unknown as PartnerComment, ...prev]);
      setNewRenewalComment('');
      toast({ title: "Comment added successfully" });
    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingRenewalComment(false);
    }
  };

  const handleSuspendRenewal = async () => {
    if (!renewalToSuspend || !renewalSuspensionReason.trim() || !user) return;
    setIsSuspendingRenewal(true);
    try {
      const { error } = await supabase.from('renewal_suspensions').insert({
        renewal_id: renewalToSuspend.subscriptionId,
        reason: renewalSuspensionReason,
        suspended_by: user.id,
      });
      if (error) throw error;
      toast({ title: "Renewal Suspension Logged", description: "The renewal suspension has been recorded." });
      setIsSuspendRenewalDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error Suspending Renewal", description: error.message, variant: "destructive" });
    } finally {
      setIsSuspendingRenewal(false);
    }
  };

  const fetchLicenseHistory = async (customerId: string) => {
    if (!user?.email) {
      toast({ title: "Authentication error", description: "User email not found.", variant: "destructive" });
      return;
    }
    setIsLoadingLicenseHistory(true);
    setLicenseHistoryDetails(null); // Reset previous details
    try {

      const response = await fetch(API_ENDPOINTS.GET_DOMAIN_LICENCE_ADDED_HISTORY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: customerId, email: user.email, }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result)
      if (result.success && Array.isArray(result.data.domains)) {
        setLicenseHistoryDetails(result.data.domains);
      } else {
        setLicenseHistoryDetails([]); // Set to empty array if no history
        toast({ title: "No History Found", description: result.message || "No license history found for this customer." });
      }
    } catch (error: any) {
      toast({
        title: "Error Fetching License History",
        description: error.message,
        variant: "destructive",
      });
      setLicenseHistoryDetails([]);
    } finally {
      setIsLoadingLicenseHistory(false);
    }
  };

  const fetchInvoiceHistory = async (domainName: string) => {
    if (!user?.email) {
      toast({ title: "Authentication error", description: "User email not found.", variant: "destructive" });
      return;
    }
    setIsLoadingInvoiceHistory(true);
    setInvoiceHistoryDetails(null); // Reset previous details
    try {
      const response = await fetch(API_ENDPOINTS.GET_INVOICE_HISTORY_ONCRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain_name: domainName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("invocie", result)
      if (result.success && result.data && Array.isArray(result.data.domains)) {
        setInvoiceHistoryDetails(result.data.domains);
      } else {
        setInvoiceHistoryDetails([]); // Set to empty array if no history
        toast({ title: "No History Found", description: result.message || "No invoice history found for this customer." });
      }
    } catch (error: any) {
      toast({
        title: "Error Fetching Invoice History",
        description: error.message,
        variant: "destructive",
      });
      setInvoiceHistoryDetails([]);
    } finally {
      setIsLoadingInvoiceHistory(false);
    }
  };

  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Pending':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'Expired':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const handleMarkTaskComplete = async (task: Task) => {
    if (task.status === 'completed') return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', task.id);

      if (error) throw error;

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === task.id ? { ...t, status: 'completed' } : t))
      );

      toast({
        title: 'Task Completed',
        description: `Task "${task.title}" has been marked as complete.`,
      });

      const logDetails = `Task "${task.title}" for partner ${partnerState.name} was marked as complete.`;
      await logCrmAction("Mark Task Complete", logDetails);

    } catch (error: any) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
    }
  };

  const handlePartnerProgramChange = async (newProgram: string) => {
    if (!partnerState.portal_reseller_id) {
      toast({
        title: "Error",
        description: "Partner portal ID is missing. Cannot update program.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('reseller_id', partnerState.portal_reseller_id);
      formData.append('partner_program', newProgram);

      const response = await fetch(API_ENDPOINTS.UPDATE_RESELLER_PARTNERPROGRAM_ONCRM, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update partner program in CRM.');
      }

      // Also update the partner_program in the Supabase partners table
      const { error: supabaseError } = await supabase
        .from('partners')
        .update({ partner_program: newProgram })
        .eq('id', partnerState.id);

      if (supabaseError) {
        // Log this error, but don't block the user since the primary CRM update succeeded.
        console.error('Supabase update failed:', supabaseError);
        toast({ title: "DB Sync Warning", description: `CRM updated, but local DB sync failed: ${supabaseError.message}`, variant: "destructive" });
      }

      // Update local state to reflect the change immediately
      setPartnerState(prevState => ({ ...prevState, partner_program: newProgram }));
      toast({
        title: "Success",
        description: "Partner program has been updated.",
      });
      setIsEditingPartnerProgram(false); // Exit edit mode on success

      // Log the action
      const logDetails = `Partner program for ${partnerState.name} (ID: ${partnerState.portal_reseller_id}) changed to ${newProgram}.`;
      await logCrmAction("Update Partner Program", logDetails);

    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAccountManagerChange = async (newManagerId: string) => {
    if (!partnerState.portal_reseller_id) {
      toast({
        title: "Error",
        description: "Partner portal ID is missing. Cannot update account manager.",
        variant: "destructive",
      });
      return;
    }

    const selectedManager = accountManagers.find(m => m.admin_id === newManagerId);
    if (!selectedManager) return;

    try {
      // 1. Update CRM via API
      const formData = new FormData();
      formData.append('reseller_id', partnerState.portal_reseller_id);
      formData.append('admin_id', selectedManager.admin_id);

      const response = await fetch(API_ENDPOINTS.UPDATE_RESELLER_ACCOUNTMANAGER_ONCRM, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update account manager in CRM.');
      }

      // 2. Update Supabase 'partners' table
      const updatesForSupabase = {
        admin_id: selectedManager.admin_id,
        assigned_manager: selectedManager.admin_name,
        account_mgr_zone: selectedManager.region,
      };

      const { error: supabaseError } = await supabase
        .from('partners')
        .update(updatesForSupabase)
        .eq('id', partnerState.id);

      if (supabaseError) {
        console.error('Supabase update for account manager failed:', supabaseError);
        toast({ title: "DB Sync Warning", description: `CRM updated, but local DB sync failed: ${supabaseError.message}`, variant: "destructive" });
      }

      // 3. Update local component state
      setPartnerState(prevState => ({ ...prevState, admin_id: selectedManager.admin_id, assigned_manager: selectedManager.admin_name, account_mgr_zone: selectedManager.region }));
      toast({
        title: "Success",
        description: "Account Manager has been updated.",
      });
      setIsEditingAccountManager(false);

      // Log the action
      const logDetails = `Account manager for ${partnerState.name} (ID: ${partnerState.portal_reseller_id}) changed from ${partnerState.assigned_manager} to ${selectedManager.admin_name}.`;
      await logCrmAction("Update Account Manager", logDetails);

    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleRenewalManagerChange = async (newManagerId: string) => {
    if (!partnerState.portal_reseller_id) {
      toast({
        title: "Error",
        description: "Partner portal ID is missing. Cannot update renewal manager.",
        variant: "destructive",
      });
      return;
    }

    const selectedManager = renewalManagersFromProfiles.find(m => m.id === newManagerId);
    if (!selectedManager) {
      toast({
        title: "Error",
        description: "Selected renewal manager not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Update Supabase 'partners' table
      const updatesForSupabase = {
        renewal_manager_id: selectedManager.id,
        renewal_manager_name: selectedManager.name,
      };

      const { error: supabaseError } = await supabase
        .from('partners')
        .update(updatesForSupabase)
        .eq('id', partnerState.id);

      if (supabaseError) {
        console.error('Supabase update for renewal manager failed:', supabaseError);
        throw new Error(`Failed to update renewal manager in local DB: ${supabaseError.message}`);
      }

      // 2. (Optional) If there's a CRM API for this, call it here.
      // For now, we're only updating Supabase as per the prompt.
      // If a CRM API exists, it would look similar to UPDATE_RESELLER_ACCOUNTMANAGER_ONCRM
      // and would be the primary source of truth.

      // 3. Update local component state
      setPartnerState(prevState => ({
        ...prevState,
        renewal_manager_id: selectedManager.id,
        renewal_manager_name: selectedManager.name
      }));
      toast({
        title: "Success",
        description: "Renewal Manager has been updated.",
      });
      setIsEditingRenewalManager(false);

      // Log the action
      const logDetails = `Renewal manager for ${partnerState.name} (ID: ${partnerState.portal_reseller_id}) changed to ${selectedManager.name}.`;
      await logCrmAction("Update Renewal Manager", logDetails);

    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  };

  const submitQuotationAction = async (quotation: Quotation, status: 'Accepted' | 'Rejected', reason: string) => {
    try {
      if (!partnerState.portal_reseller_id) {
        throw new Error("Partner's Reseller ID is missing.");
      }

      const formData = new FormData();
      formData.append('reseller_id', partnerState.portal_reseller_id);
      formData.append('quotation_id', quotation.quotation_id);
      formData.append('quotation_status', status);
      // Per requirement, pass blank for accept, and the reason for reject.
      formData.append('quotation_reason', reason);

      const response = await fetch(API_ENDPOINTS.UPDATE_QUOTATION_STATUS_ONCRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update quotation status.');
      }

      toast({
        title: `Quotation ${status}`,
        description: `Quotation ${quotation.quotation_id} has been successfully updated.`,
      });

      // Update local state to reflect the change
      setQuotations(prevQuotations => prevQuotations.map(q =>
        q.quotation_id === quotation.quotation_id ? { ...q, order_status: status } : q // Assuming order_status reflects the update
      ));

      // Log the action
      const logDetails = `Quotation ${quotation.quotation_id} for customer ${quotation.customer_name} was ${status} by partner ${partnerState.name}. ${reason ? `Reason: ${reason}` : ''}`;
      await logCrmAction(`Quotation ${status}`, logDetails);

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update quotation status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleQuotationAction = (quotation: Quotation, action: 'accept' | 'reject') => {
    setSelectedQuotationForAction(quotation);
    if (action === 'reject') {
      setIsRejectQuotationDialogOpen(true);
    } else {
      // Assuming 'quotation_status' should be 'Accepted'
      // The API should handle what 'order_status' becomes.
      submitQuotationAction(quotation, 'Accepted', '');
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    // To refresh the data, we can call onBack() to go to the list which will refetch,
    // or we can have a dedicated refresh function passed in.
    // For now, let's assume going back is the desired behavior to see the updated list.
    onBack();
  };

  const handleConfirmQuotationRejection = async () => {
    if (selectedQuotationForAction && quotationRejectionReason.trim()) {
      await submitQuotationAction(selectedQuotationForAction, 'Rejected', quotationRejectionReason);
      setIsRejectQuotationDialogOpen(false);
      setQuotationRejectionReason('');
    }
  };

  const resetProductForm = () => {
    setSelectedOem('');
    setSelectedProduct('');
    setSelectedSku('');
    setSelectedSkuId(''); // Clear selected SKU ID
    setLicenseCount('');
    setSkuDiscount('');
    setEditingProductId(null);
  };

  const handleRemoveProduct = (productId: number) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
    if (editingProductId === productId) {
      resetProductForm();
      setEditingProductId(null); // Ensure editingProductId is cleared
    }
  };

  const handleAddProductToQuotation = async () => {
    if (!selectedSku || !licenseCount || planDuration === '') {
      toast({ title: "Missing Information", description: "Please fill all required product fields.", variant: "destructive" });
      return;
    }
    setIsPriceLoading(true);
    try {
      // Find the product to get its ID
      const skuDetail = skusForProduct.find(s => s.sku_name === selectedSku);
      const currentSkuId = skuDetail?.sku_id || '';
      // Find the specific SKU discount from fetchedProductDiscounts. Match by sku_id
      const skuDiscountEntry = fetchedProductDiscounts.find(d => d.sku_id === currentSkuId);
      let discountToApply = 0;
      if (skuDiscountEntry) { discountToApply = quotationType === 'renewal' ? skuDiscountEntry.renewal_discount || 0 : skuDiscountEntry.discount || 0; }
      console.log(discountToApply, quotationType)
      const formData = new FormData();
      formData.append('skuname', selectedSku);
      formData.append('partnerdiscount', 0);
      formData.append('plantype', planType);
      formData.append('planduration', String(planDuration));
      formData.append('usercount', String(licenseCount));
      formData.append('skudiscount', String(discountToApply)); // Use the SKU-wise discount
      formData.append('quotationType', quotationType);
      formData.append('portal_reseller_id', partnerState.portal_reseller_id);
      formData.append('sku_id', currentSkuId);

      const response = await fetch(API_ENDPOINTS.GET_SKUPRICE_ONCRM, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log(result)
      if (result.success) {
        const newProduct: AddedProduct = {
          id: Date.now(), // simple unique id
          oemName: selectedOem,
          productName: selectedProduct,
          skuName: selectedSku,
          skuId: currentSkuId, // Store skuId
          purchaseType: result.data.in_quottype,
          licenseCount: licenseCount,
          skuDiscount: discountToApply, // Store the applied SKU discount
          prodDiscount: result.data.pr_proddiscount,
          listPrice: result.data.pr_skuprice,
          shivaamiPrice: result.data.pr_shivaamiprice,
          subtotal: result.data.shivaamisubtotal,
        };
        setAddedProducts(prev => [...prev, newProduct]);
        resetProductForm();
      } else {
        throw new Error(result.message || "Failed to get price.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: `Could not add product: ${error.message}`, variant: "destructive" });
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleEditProduct = (productId: number) => {
    const productToEdit = addedProducts.find(p => p.id === productId);
    if (productToEdit) {
      setEditingProductId(productId);
      setSelectedOem(productToEdit.oemName);
      setSelectedProduct(productToEdit.productName); // This will trigger re-rendering of SKU select
      setSelectedSku(productToEdit.skuName);
      setSelectedSkuId(productToEdit.skuId); // Set skuId
      setLicenseCount(productToEdit.licenseCount);
      // Set discount values for editing if needed
      const skuDiscountEntry = fetchedProductDiscounts.find(d => d.sku_id === productToEdit.skuId);
      if (skuDiscountEntry) {
        setNewDiscountValue(skuDiscountEntry.discount);
        setRenewalDiscountValue(skuDiscountEntry.renewal_discount);
      }
      // if (productToEdit.oemName === 'Google Workspace') {
      //   setSkuDiscount(productToEdit.skuDiscount);
      // }
    }
  };

  const handleUpdateProduct = async () => {
    console.log(editingProductId,selectedSku,licenseCount,planDuration,partnerState.partner_discount)
    if (!editingProductId || !selectedSku || !licenseCount || planDuration === '') {
      toast({ title: "Missing Information", description: "Please fill all required product fields.", variant: "destructive" });
      return;
    }
    setIsPriceLoading(true);
    try {
      // Find the product to get its ID
      const skuDetail = skusForProduct.find(s => s.sku_name === selectedSku);
      const currentSkuId = skuDetail?.sku_id || '';
      // Find the specific SKU discount from fetchedProductDiscounts. Match by sku_id
      const skuDiscountEntry = fetchedProductDiscounts.find(d => d.sku_id === currentSkuId);
      let discountToApply = 0;
      if (skuDiscountEntry) { discountToApply = quotationType === 'renewal' ? skuDiscountEntry.renewal_discount || 0 : skuDiscountEntry.discount || 0; }
      console.log(discountToApply, quotationType)
      const formData = new FormData();
      formData.append('skuname', selectedSku);
      formData.append('partnerdiscount', 0);
      formData.append('plantype', planType);
      formData.append('planduration', String(planDuration));
      formData.append('usercount', String(licenseCount));
      formData.append('skudiscount', String(discountToApply)); // Use the SKU-wise discount
      formData.append('quotationType', quotationType);
      formData.append('portal_reseller_id', partnerState.portal_reseller_id);
      formData.append('sku_id', currentSkuId);

      const response = await fetch(API_ENDPOINTS.GET_SKUPRICE_ONCRM, { method: 'POST', body: formData });
      const result = await response.json();

      if (result.success) {
        const updatedProduct = {
          id: editingProductId,
          oemName: selectedOem,
          productName: selectedProduct,
          skuName: selectedSku,
          skuId: currentSkuId, // Store skuId
          purchaseType: result.data.in_quottype,
          licenseCount: licenseCount,
          prodDiscount: result.data.pr_proddiscount, // This comes from API
          skuDiscount: discountToApply, // Store the applied SKU discount
          listPrice: result.data.pr_skuprice,
          shivaamiPrice: result.data.pr_shivaamiprice,
          subtotal: result.data.shivaamisubtotal,
        };
        setAddedProducts(prev => prev.map(p => p.id === editingProductId ? updatedProduct : p));
        resetProductForm();
      } else {
        throw new Error(result.message || "Failed to get price.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: `Could not update product: ${error.message}`, variant: "destructive" });
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleQuotationCustomerChange = (customerId: string) => {
    setSelectedQuotationCustomer(customerId);
    const customer = partnerCustomers.find(c => c.id === customerId);
    setSelectedDomain(customer?.domainName || '');
  };

  const oems = Object.keys(productData);
  const productsForOem = selectedOem && productData[selectedOem] ? Object.keys(productData[selectedOem]) : [];
  const skusForProduct = selectedOem && selectedProduct ? productData[selectedOem][selectedProduct] : [];

  const quotationTotals = useMemo(() => {
    const subtotal = addedProducts.reduce((acc, p) => acc + (p.subtotal || 0), 0);
    const gst = subtotal * 0.18;
    const grandTotal = subtotal + gst;
    return { subtotal, gst, grandTotal };
  }, [addedProducts]);

  const handleGenerateQuotation = async () => {
    if (!selectedQuotationCustomer || !quotationFor || !quotationExpiry) {
      toast({
        title: "Missing Information",
        description: "Customer, Quotation For, and Expiry Date are mandatory fields.",
        variant: "destructive",
      });
      return;
    }


    const customerDetails = partnerCustomers.find(c => c.id === selectedQuotationCustomer);

    const quotationData = {
      partner: {
        id: partnerState.id,
        name: partnerState.name,
        email: partnerState.email,
        portal_reseller_id: partnerState.portal_reseller_id,
        partner_discount: 0,
      },
      customer: {
        id: selectedQuotationCustomer,
        name: customerDetails?.name,
        domain: selectedDomain,
      },
      plan: {
        type: planType,
        duration: planDuration,
      },
      products: addedProducts,
      totals: quotationTotals,
      terms: {
        partner: partnerConditions,
        customer: customerConditions,
      },
      quotationFor: quotationFor,
      expiryDate: quotationExpiry,
      // Assuming 'new' is the default type when generating from this component
      quotationType: quotationType,
    };

    setIsGeneratingQuotation(true);
    try {
      const response = await fetch(API_ENDPOINTS.SEND_QUOTATION_BYADMIN_ONCRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to generate quotation.');
      }

      toast({ title: "Success", description: "Quotation has been generated and sent successfully." });
      setIsGenerateQuotationDialogOpen(false); // Close dialog on success

      // Log the action
      const logDetails = `Generated a ${quotationType} quotation for customer ${customerDetails?.name} (${selectedDomain}) on behalf of partner ${partnerState.name}.`;
      await logCrmAction("Generate Quotation", logDetails);

    } catch (error: any) {
      toast({ title: "Error", description: `Could not generate quotation: ${error.message}`, variant: "destructive" });
    } finally {
      setIsGeneratingQuotation(false);
    }
  };

  const handleAddProductDiscount = async () => {
    if (!selectedSku || (newDiscountValue === '' && renewalDiscountValue === '')) {
      toast({ title: "Missing Information", description: "Please select an SKU and provide at least one discount value.", variant: "destructive" });
      return;
    }
    console.log(selectedOem)
    const productInfo = allProducts.find(p => p.name === selectedOem);
    if (!productInfo) {
      toast({ title: "Error", description: "Selected product not found.", variant: "destructive" });
      return;
    }

    setIsSubmittingDiscount(true);
    try {
      const newDiscountItem: FetchedProductDiscount = {
        productId: productInfo.id, // Map productInfo.id to productId
        skuName: selectedSku, // Map selectedSku to skuName
        discount: newDiscountValue === '' ? 0 : Number(newDiscountValue),
        renewal_discount: renewalDiscountValue === '' ? 0 : Number(renewalDiscountValue),
        sku_id: selectedSkuId, // Use selectedSkuId if available
        prod_id: productInfo.portal_prod_id || '',
        crm_prod_id: productInfo.id, // Keep crm_prod_id for consistency
        total_usercount: '', // Default or derive if needed
        product_name: selectedProduct
      };

      // Check if this SKU already has a discount configured
      const existingDiscount = fetchedProductDiscounts.find(d => d.productId === newDiscountItem.productId && d.skuName === newDiscountItem.skuName);
      if (existingDiscount) {
        toast({ title: "Duplicate Entry", description: "A discount for this SKU already exists. Please edit the existing one.", variant: "warning" });
        setIsSubmittingDiscount(false);
        return;
      }

      const payload = {
        partnerId: partner.id,
        partnerEmail: partner.email,
        portal_reseller_id: partner.portal_reseller_id,
        action_type: 'add_product',
        discounts: [
          { // Payload for API
            crm_prod_id: newDiscountItem.crm_prod_id,
            product_name: newDiscountItem.product_name, // Use skuName from newDiscountItem
            discount: newDiscountItem.discount,
            renewal_discount: newDiscountItem.renewal_discount,
            prod_id: newDiscountItem.prod_id,
            sku_id: newDiscountItem.sku_id, // Add sku_id
            skuName: newDiscountItem.skuName, // Add skuName explicitly if API expects it separately from product_name
          }
        ],
      };

      console.log('Adding Product Discount Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(API_ENDPOINTS.STORE_SKUWISE_DISCOUNT_ONCRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save product discounts.');
      }

      await fetchProductDiscounts(); // Refetch the list of discounts
      toast({ title: "Success", description: "Product discounts have been saved." });
      handleCancelEditDiscount(); // Reset form state

      // Log the action
      const logDetails = `Added product-specific discount for partner ${partner.name} (ID: ${partner.portal_reseller_id}). Discount: ${JSON.stringify(payload.discounts, null, 2)}`;
      await logCrmAction("Update Product-wise Discounts", logDetails);

    } catch (error: any) {
      toast({
        title: "Error Saving Discounts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleUpdateProductDiscount = async () => {
    if (!editingDiscountId || !selectedSku || (newDiscountValue === '' && renewalDiscountValue === '')) {
      toast({ title: "Missing Information", description: "Please select an SKU and provide at least one discount value.", variant: "destructive" });
      return;
    }
    const productInfo = allProducts.find(p => p.name === selectedProduct && p.oem === selectedOem);
    if (!productInfo) {
      toast({ title: "Error", description: "Selected product not found.", variant: "destructive" });
      return;
    }

    setIsSubmittingDiscount(true);
    try {
      const updatedDiscountItem: FetchedProductDiscount = {
        productId: productInfo.id, // Map productInfo.id to productId
        skuName: selectedSku, // Map selectedSku to skuName
        discount: newDiscountValue === '' ? 0 : Number(newDiscountValue),
        renewal_discount: renewalDiscountValue === '' ? 0 : Number(renewalDiscountValue),
        sku_id: selectedSkuId, // Use selectedSkuId if available
        prod_id: productInfo.portal_prod_id || '',
        crm_prod_id: productInfo.id, // Keep crm_prod_id for consistency
      };

      const payload = {
        partnerId: partner.id,
        partnerEmail: partner.email,
        portal_reseller_id: partner.portal_reseller_id,
        action_type: 'update_product',
        discounts: [
          { // Payload for API
            crm_prod_id: updatedDiscountItem.crm_prod_id,
            product_name: productInfo.name, // Use skuName from updatedDiscountItem
            discount: updatedDiscountItem.discount,
            renewal_discount: updatedDiscountItem.renewal_discount,
            prod_id: updatedDiscountItem.prod_id,
            sku_id: selectedSkuId, // Add sku_id
            skuName: updatedDiscountItem.skuName,
          }
        ],
      };

      console.log('Updating Product Discount Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(API_ENDPOINTS.STORE_SKUWISE_DISCOUNT_ONCRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update product discounts.');
      }

      await fetchProductDiscounts();
      toast({ title: "Success", description: "Product discounts have been updated." });
      handleCancelEditDiscount();
    } catch (error: any) {
      toast({ title: "Error Updating Discounts", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleEditDiscount = (crmProdId: string, skuName: string) => {
    // Correctly find the discount to edit from the fetched list
    const discountToEdit = fetchedProductDiscounts.find(d => d.crm_prod_id === crmProdId && d.skuName === skuName);
    if (discountToEdit) {
      setEditingDiscountId(`${crmProdId}-${skuName}`);
      // Need to find the OEM and Product name from allProducts based on productId
      const fullProduct = allProducts.find(p => p.id === crmProdId);
      if (fullProduct) {
        setSelectedOem(fullProduct.oem);
        setSelectedProduct(fullProduct.name);
        setSelectedSku(discountToEdit.skuName); // skuName in discountItem is the SKU name
        // Find the corresponding sku_id from productData
        const skuDetail = productData[fullProduct.oem]?.[fullProduct.name]?.find(
          (sku) => sku.sku_name === discountToEdit.skuName
        );
        setSelectedSkuId(skuDetail?.sku_id || '');
      }
      setNewDiscountValue(discountToEdit.discount); // Use 'discount' for new_discount
      setRenewalDiscountValue(discountToEdit.renewal_discount);
    }
  };

  const handleCancelEditDiscount = () => {
    setEditingDiscountId(null);
    setSelectedProductForDiscount('');
    setSelectedOem('');
    setSelectedProduct('');
    setSelectedSku('');
    setSelectedSkuId(''); // Clear selected SKU ID
    setNewDiscountValue('');
    setRenewalDiscountValue('');
  };
  const handleRemoveDiscount = async (crmProdId: string, skuName: string) => {
    const discountToRemove = fetchedProductDiscounts.find(d => d.crm_prod_id === crmProdId && d.skuName === skuName);

    if (!discountToRemove) {
      toast({ title: "Error", description: "Could not find the discount to remove.", variant: "destructive" });
      return;
    }

    setIsSubmittingDiscount(true);
    try {
      const payload = {
        partnerId: partner.id,
        partnerEmail: partner.email,
        portal_reseller_id: partner.portal_reseller_id,
        action_type: 'remove_product',
        discounts: [ // Payload for API
          {
            crm_prod_id: discountToRemove.crm_prod_id,
            product_name: discountToRemove.skuName,
            discount: discountToRemove.discount,
            renewal_discount: discountToRemove.renewal_discount,
            prod_id: discountToRemove.prod_id,
            sku_id: discountToRemove.sku_id,
            skuName: discountToRemove.skuName,
          }
        ],
      };
      const response = await fetch(API_ENDPOINTS.STORE_SKUWISE_DISCOUNT_ONCRM, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(payload), });
      const result = await response.json();
      if (!response.ok || !result.success) { throw new Error(result.message || 'Failed to remove product discount.'); }
      await fetchProductDiscounts();
      toast({ title: "Success", description: `Discount for ${skuName} has been removed.` });
      if (editingDiscountId === crmProdId) { handleCancelEditDiscount(); }
    } catch (error: any) { toast({ title: "Error Removing Discount", description: error.message, variant: "destructive", }); } finally { setIsSubmittingDiscount(false); }
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-6 -mr-6">
      {/* Header */}
      {isDialogView ? (
        <div className="flex items-center gap-4 sticky top-0 bg-background py-4 z-10">
          {/* The dialog's close button will handle this */}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft size={16} />Back to Partners</Button>
          <div className="flex gap-2">
            {/* <Button onClick={() => setIsShareKbModalOpen(true)} className="gap-2" variant="outline">
              <Share size={16} /> Share Knowledge Base
            </Button> */}
            <Button onClick={() => setIsCreateTaskDialogOpen(true)} className="gap-2" variant="outline">
              <Plus size={16} /> Create Task
            </Button>
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit size={16} /> Edit Partner
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{partnerState.name}</h2>
          <p className="text-muted-foreground">{partnerState.company}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail size={14} />
            <a href={`mailto:${partnerState.email}`} className="hover:underline">{partnerState.email}</a>
          </div>
          {partnerState.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} />
              <span>{partner.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Partner Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => setIsEditing(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building size={20} className="text-indigo-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Partner Identity</p>
                      <p className="font-medium">{partnerState.identity.length} selected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <ScrollArea className={cn("max-h-40", partnerState.identity.length > 4 && "h-40")}>
                <div className="space-y-2 p-2">
                  <p className="font-semibold">Selected Identities:</p>
                  {partnerState.identity.map((id) => (
                    <div key={id} className="flex items-center gap-2">
                      <Building size={14} />
                      <Badge className={getIdentityColor(id)} variant="secondary">
                        {getIdentityLabel(id)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* The global partner discount card is commented out as the focus is on SKU-wise discounts.
        <Card className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Percent size={20} className="text-teal-600" />
              <div>
                <p className="text-sm text-muted-foreground">Partner Current Discount</p>
                <p className="font-medium">{partnerState.partner_discount != null ? `${partnerState.partner_discount}%` : 'Not Set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        */}
        <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => setIsEditing(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star size={20} className="text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="font-medium">{partnerState.specialization}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => setIsEditing(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-rose-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Zone</p>
                      <p className="font-medium">
                        {partnerState.zone?.length ? `${partnerState.zone.length} selected` : 'Not Set'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <ScrollArea className={cn("max-h-40", (partnerState.zone?.length || 0) > 4 && "h-40")}>
                <div className="space-y-2 p-2">
                  <p className="font-semibold">Selected Zones:</p>
                  {partnerState.zone?.map((zone) => (
                    <div key={zone} className="flex items-center gap-2">
                      <MapPin size={14} />
                      <Badge className={getZoneColor(zone)} variant="secondary">{zone.charAt(0).toUpperCase() + zone.slice(1)}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Partner Since</p>
                <p className="font-medium">{partnerState.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className={documentUrls.resellerAgreement ? "text-green-600" : (partnerState.agreementSigned ? "text-green-600" : "text-red-600")} />
              <div>
                <p className="text-sm text-muted-foreground">Agreement</p>
                <p className="font-medium">
                  {documentUrls.resellerAgreement
                    ? 'Submitted'
                    : (partnerState.agreementSigned ? 'Signed' : 'Pending')
                  }
                </p>
                {partnerState.agreementDate && (
                  <p className="text-xs text-muted-foreground">
                    {partnerState.agreementDate.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => setIsEditing(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <Badge className={getPaymentTermsColor(partnerState.paymentTerms)}>
                  {getPaymentTermsLabel(partnerState.paymentTerms)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User size={20} className="text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Assigned Users</p>
                <p className="font-medium">{getAssignedUserNames(partnerState.assignedUserIds)}</p>
                {assignedUsers.length > 0 && (
                  <p className="text-xs text-muted-foreground">{assignedUsers.length} user(s)</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Product Types</p>
                <p className="font-medium">{partnerState.productTypes.length}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield size={20} className={kycDetails?.kyc_status === 'Approved' ? "text-green-600" : "text-yellow-600"} />
              <div>
                <p className="text-sm text-muted-foreground">KYC Status</p>
                {isKycLoading ? (
                  <p className="font-medium text-xs">Loading...</p>
                ) : (
                  <p className="font-medium">
                    {kycDetails?.kyc_status || 'Pending'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Handshake size={20} className="text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Partner Program</p>
                {isEditingPartnerProgram ? (
                  <div className="flex items-center gap-2">
                    <Select value={partnerState.partner_program || ''} onValueChange={handlePartnerProgramChange}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Select Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Referal Partner">Referral Partner</SelectItem>
                        <SelectItem value="Commited Partner">Committed Partner</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditingPartnerProgram(false)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{partnerState.partner_program || 'Not Set'}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingPartnerProgram(true)}>
                      <Edit size={14} className="text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User size={20} className="text-fuchsia-600" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Manager</p>
                {isEditingAccountManager ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={partnerState.admin_id || ''}
                      onValueChange={handleAccountManagerChange}
                      disabled={isLoadingAccountManagers}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder={isLoadingAccountManagers ? "Loading..." : "Select Manager"} />
                      </SelectTrigger>
                      <SelectContent>
                        {accountManagers.map(manager => (
                          <SelectItem key={manager.admin_id} value={manager.admin_id}>{`${manager.admin_name} - ${manager.region}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditingAccountManager(false)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{partnerState.assigned_manager || 'Not Assigned'}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingAccountManager(true)}><Edit size={14} className="text-muted-foreground" /></Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User size={20} className="text-pink-600" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Renewal Manager</p>
                {isEditingRenewalManager ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={partnerState.renewal_manager_id || ''}
                      onValueChange={handleRenewalManagerChange}
                      disabled={isLoadingRenewalManagers || renewalManagersFromProfiles.length === 0}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder={isLoadingRenewalManagers ? "Loading managers..." : (renewalManagersFromProfiles.length === 0 ? "No managers" : "Select Manager")} />
                      </SelectTrigger>
                      <SelectContent>
                        {renewalManagersFromProfiles.map(manager => (
                          <SelectItem key={manager.id} value={manager.id}>{manager.name} - {manager.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditingRenewalManager(false)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{partnerState.renewal_manager_name || 'Not Assigned'}</p>
                    {profile?.role === 'admin' && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingRenewalManager(true)}><Edit size={14} className="text-muted-foreground" /></Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => setIsEditing(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Briefcase size={20} className="text-cyan-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Partner Tags</p>
                      <p className="font-medium">
                        {partnerState.partner_tag?.length ? `${partnerState.partner_tag.length} selected` : 'Not Set'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <ScrollArea className={cn("max-h-40", (partnerState.partner_tag?.length || 0) > 4 && "h-40")}>
                <div className="space-y-2 p-2">
                  <p className="font-semibold">Selected Tags:</p>
                  {partnerState.partner_tag?.map((tagId) => (
                    <Badge key={tagId} variant="secondary" className="mr-1 mb-1">{getPartnerTagLabel(tagId)}</Badge>
                  ))}
                </div>
              </ScrollArea>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => setIsEditing(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star size={20} className={partnerState.partner_type === 'gold' ? "text-yellow-500" : "text-slate-500"} />
              <div>
                <p className="text-sm text-muted-foreground">Partner Type</p>
                <p className="font-medium capitalize">
                  {partnerState.partner_type ? `${partnerState.partner_type} partner` : 'Not Set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => setIsEditing(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link size={20} className="text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Source of Partner</p>
                <p className="font-medium">
                  {getSourceOfPartnerLabel(partnerState.source_of_partner)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">
                  {partnerState.city || 'Not Set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">State</p>
                <p className="font-medium">
                  {partnerState.state || 'Not Set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="transition-all hover:shadow-md cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Prospects</p>
                <p className="font-medium">{prospects.length}</p>
                <p className="text-xs text-muted-foreground">In pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Purchased</p>
                <p className="font-medium">{purchased.length}</p>
                <p className="text-xs text-muted-foreground">{conversionRate}% conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle size={20} className="text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Lost</p>
                <p className="font-medium">{lost.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-gray-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="font-medium">{partnerCustomers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Briefcase size={20} className="text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">DR Cases</p>
                <p className="font-medium">{drCases.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* KYC & Documents */}
      <Collapsible
        open={kycDocsOpen}
        onOpenChange={setKycDocsOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setKycDocsOpen(!kycDocsOpen)}>
            <CardTitle>KYC & Documents</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", kycDocsOpen && "rotate-180")} />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* KYC Details Card */}
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg"><Shield size={18} /> KYC Details</CardTitle>
                      {kycDetails && (
                        <Badge className={cn("mt-2", kycDetails.kyc_status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}>
                          {kycDetails.kyc_status}
                        </Badge>
                      )}
                    </div>
                    {kycDetails && (
                      <Button variant="outline" size="sm" onClick={() => { setIsKycDetailModalOpen(true); logCrmAction("View KYC Details", `Viewed complete KYC details for partner ${partner.name} (ID: ${partner.portal_reseller_id})`); }}>
                        <Eye className="mr-2 h-4 w-4" /> View All Details
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isKycLoading ? (
                      <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin mr-2" />Loading...</div>
                    ) : kycDetails ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Secondary Contact Name</span><span className="font-medium">{kycDetails.secondary_contact_name || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Secondary Contact Email</span><span className="font-medium">{kycDetails.secondary_contact_email || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Secondary Contact Number</span><span className="font-medium">{kycDetails.secondary_contact_number || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Account Contact Name</span><span className="font-medium">{kycDetails.account_contact_name || 'N/A'}</span></div>

                        <div className="flex justify-between"><span className="text-muted-foreground">Account Contact Email</span><span className="font-medium">{kycDetails.account_contact_email || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Account Contact Number</span><span className="font-medium">{kycDetails.account_contact_number || 'N/A'}</span></div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-muted-foreground">KYC details not provided.</div>
                    )}
                  </CardContent>
                </Card>
                {/* Documents Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><FileTextIcon size={18} /> Uploaded Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isDocsLoading ? (
                      <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin mr-2" />Loading...</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">Reseller Agreement</h4>
                            <p className="text-sm text-muted-foreground">The signed partnership agreement.</p>
                          </div>
                          {documentUrls.resellerAgreement ? (
                            <Button variant="outline" size="sm" onClick={() => openDocViewer(documentUrls.resellerAgreement, 'Reseller Agreement')}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Button>
                          ) : (
                            <Badge variant="secondary">Not Uploaded</Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">KYC Signed Form</h4>
                            <p className="text-sm text-muted-foreground">The final signed KYC verification form.</p>
                          </div>
                          {documentUrls.kycSignedForm ? (
                            <Button variant="outline" size="sm" onClick={() => openDocViewer(documentUrls.kycSignedForm, 'KYC Signed Form')}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Button>
                          ) : (
                            <Badge variant="secondary">Not Uploaded</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      {/* Tasks */}
      <Collapsible
        open={tasksOpen}
        onOpenChange={setTasksOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setTasksOpen(!tasksOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", tasksOpen && "rotate-180")} />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={taskSearchTerm}
                    onChange={(e) => setTaskSearchTerm(e.target.value)}
                    className="pl-8 pr-8 w-48"
                  />
                  {taskSearchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setTaskSearchTerm('')}
                    ><X className="h-4 w-4 text-muted-foreground" /></Button>
                  )}
                </div>
                <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isLoadingTasks ? (
                <div className="flex items-center justify-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading Tasks...</span></div>
              ) : filteredTasks.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentTaskRecords.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{task.assignee_name || getAssigneeName(task.assigned_to)}</TableCell>
                          <TableCell>{task.customer_domain || 'N/A'}</TableCell>
                          <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell><Badge className={cn("capitalize", getTaskPriorityColor(task.priority))}>{task.priority}</Badge></TableCell>
                          <TableCell><Badge className={cn("capitalize", getTaskStatusColor(task.status))}>{task.status}</Badge></TableCell>
                          <TableCell>
                            {task.status !== 'completed' && task.status !== 'cancelled' && (
                              <TooltipProvider>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkTaskComplete(task)}><CheckCircle className="h-4 w-4 text-green-600" /></Button></TooltipTrigger><TooltipContent><p>Mark as Complete</p></TooltipContent></Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing <strong>{indexOfFirstTaskRecord + 1}</strong> to <strong>{Math.min(indexOfLastTaskRecord, filteredTasks.length)}</strong> of <strong>{filteredTasks.length}</strong> tasks.
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setTaskCurrentPage(p => Math.max(p - 1, 1))} disabled={taskCurrentPage === 1}>Previous</Button>
                      <span className="text-sm text-muted-foreground">Page {taskCurrentPage} of {totalTaskPages > 0 ? totalTaskPages : 1}</span>
                      <Button variant="outline" size="sm" onClick={() => setTaskCurrentPage(p => Math.min(p + 1, totalTaskPages))} disabled={taskCurrentPage === totalTaskPages || totalTaskPages === 0}>Next</Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mb-2" />
                  <p>No tasks found for this partner.</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Product-wise Discounts */}
      <Collapsible
        open={productDiscountsOpen}
        onOpenChange={setProductDiscountsOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setProductDiscountsOpen(!productDiscountsOpen)}>
            <CardTitle>Product-wise Discounts</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", productDiscountsOpen && "rotate-180")} />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">{editingDiscountId ? 'Edit Product Discount' : 'Add New Product Discount'}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {isProductDataLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />Loading product options...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>OEM</Label>
                          <Select value={selectedOem} onValueChange={v => {
                            setSelectedOem(v);
                            setSelectedProduct('');
                            setSelectedSku('');
                          }}>
                            <SelectTrigger><SelectValue placeholder="Select OEM" /></SelectTrigger>
                            <SelectContent>
                              {oems.map(oem => <SelectItem key={oem} value={oem}>{oem}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Product</Label>
                          <Select value={selectedProduct} onValueChange={v => { setSelectedProduct(v); setSelectedSku(''); }} disabled={!selectedOem}>
                            <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                            <SelectContent>{productsForOem.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>SKU (ID)</Label>
                          <Select value={selectedSku} onValueChange={(v) => {
                            setSelectedSku(v); // v is sku_name
                            const skuObj = skusForProduct.find(s => s.sku_name === v);
                            setSelectedSkuId(skuObj?.sku_id || '');
                          }} disabled={!selectedProduct}>
                            <SelectTrigger><SelectValue placeholder="Select SKU" /></SelectTrigger>
                            <SelectContent>
                              {skusForProduct.map(sku => <SelectItem key={sku.sku_id} value={sku.sku_name}>{sku.sku_name} ({sku.sku_id})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="new-discount">Discount (%)</Label>
                            <Input
                              id="new-discount"
                              type="number"
                              min="0"
                              step="0.1" // Allow decimal input
                              value={newDiscountValue}
                              onChange={e => setNewDiscountValue(e.target.value === '' ? '' : Math.max(0, Math.min(100, parseFloat(e.target.value))))}
                              placeholder="e.g., 10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="renewal-discount">Renewal Discount (%)</Label>
                            <Input
                              id="renewal-discount"
                              type="number"
                              min="0"
                              step="0.1" // Allow decimal input
                              value={renewalDiscountValue}
                              onChange={e => setRenewalDiscountValue(e.target.value === '' ? '' : Math.max(0, Math.min(100, parseFloat(e.target.value))))}
                              placeholder="e.g., 5"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end">
                      {editingDiscountId && (
                        <Button variant="outline" onClick={handleCancelEditDiscount}>Cancel Edit</Button>
                      )}
                      <Button
                        onClick={editingDiscountId ? handleUpdateProductDiscount : handleAddProductDiscount}
                        disabled={isSubmittingDiscount || !selectedSku || (newDiscountValue === '' && renewalDiscountValue === '')}
                      >
                        {isSubmittingDiscount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingDiscountId ? 'Update Discount' : 'Add Discount'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Display existing product discounts */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Configured Product Discounts</CardTitle></CardHeader>
                  <CardContent>
                    {isDiscountsLoading ? (
                      <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin mr-2" />Loading discounts...</div>
                    ) : fetchedProductDiscounts.length > 0 ? (
                      <ScrollArea className="h-60 w-full rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Discount (%)</TableHead>
                              <TableHead>Renewal Discount (%)</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fetchedProductDiscounts.map((discountItem) => {
                              const fullProduct = allProducts.find(p => p.id === discountItem.productId);
                              const productName = allProducts.find(p => p.id === discountItem.crm_prod_id)?.name || 'N/A';

                              return (
                                <TableRow key={`${discountItem.crm_prod_id}-${discountItem.skuName}`}>
                                  <TableCell>{productName}</TableCell>
                                  <TableCell className="font-medium">{discountItem.skuName}</TableCell>
                                  <TableCell>{discountItem.discount}%</TableCell>
                                  <TableCell>{discountItem.renewal_discount}%</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => handleEditDiscount(discountItem.crm_prod_id, discountItem.skuName)} title="Edit">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleRemoveDiscount(discountItem.crm_prod_id, discountItem.skuName)} title="Remove">
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                        <Percent className="h-8 w-8 mb-2" />
                        <p>No product-wise discounts configured.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Product Types */}
      <Collapsible
        open={productTypesOpen}
        onOpenChange={(isOpen) => {
          setProductTypesOpen(isOpen);
        }}
        className="w-full"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
            <CardTitle>Product Categories</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", productTypesOpen && "rotate-180")} />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            {/* Product Categories section removed as it was not part of the request and the user wants SKU-wise discount. */}
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Additional Contacts */}
      <Collapsible
        open={additionalContactsOpen}
        onOpenChange={setAdditionalContactsOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setAdditionalContactsOpen(!additionalContactsOpen)}>
            <CardTitle>Additional Contacts ({additionalContacts.length})</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", additionalContactsOpen && "rotate-180")} />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {additionalContacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additionalContacts.map((contact: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{contact.contactName}</TableCell>
                        <TableCell>{contact.contactDesignation || 'N/A'}</TableCell>
                        <TableCell>{contact.contactEmail ? <a href={`mailto:${contact.contactEmail}`} className={cn(buttonVariants({ variant: "link" }), "p-0")}>{contact.contactEmail}</a> : 'N/A'}</TableCell>
                        <TableCell>{contact.contactNumber || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-sm text-muted-foreground">No additional contacts available.</p>}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      {/* Comments, Discount History, and Notes */}
      <Collapsible
        open={auxiliaryDataOpen}
        onOpenChange={setAuxiliaryDataOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setAuxiliaryDataOpen(!auxiliaryDataOpen)}>
            {/* <CardTitle>Comments & Discounts</CardTitle> */}
            <CardTitle>Comments</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", auxiliaryDataOpen && "rotate-180")} />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comments Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare size={18} /> Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-60 pr-3">
                      {isCommentsLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="animate-spin mr-2" />Loading...</div>
                      ) : comments.length > 0 ? (
                        <div className="space-y-3">
                          {comments.map(comment => (
                            <div key={comment.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium">{comment.created_by_name || 'User'}</span>
                                <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                              </div>
                              <p className="whitespace-pre-wrap text-muted-foreground">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : <div className="flex items-center justify-center h-full text-muted-foreground">No comments found.</div>}
                    </ScrollArea>
                    <div className="mt-4 pt-4 border-t">
                      <Label htmlFor="new-comment" className="mb-2 block">Add a comment</Label>
                      <Textarea
                        id="new-comment"
                        placeholder="Type your comment here..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        disabled={isSubmittingComment}
                      />
                      <Button onClick={handleAddComment} disabled={isSubmittingComment || !newComment.trim()} className="mt-2" size="sm">{isSubmittingComment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</> : 'Post Comment'}</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Discount History Card */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <History size={18} /> Discount History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-60 pr-3">
                      {isDiscountHistoryLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="animate-spin mr-2" />Loading...</div>
                      ) : discountHistory.length > 0 ? (
                        <div className="space-y-2">
                          {discountHistory.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                              <span className="font-semibold">{item.discount_in}%</span>
                              <span className="text-muted-foreground">{new Date(item.updated_on).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : <div className="flex items-center justify-center h-full text-muted-foreground">No discount history.</div>}
                    </ScrollArea>
                  </CardContent>
                </Card> */}

                {/* Notes Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <StickyNote size={18} /> Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-60 pr-3">
                      {isNotesLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="animate-spin mr-2" />Loading...</div>
                      ) : <div className="flex items-center justify-center h-full text-muted-foreground">No notes found.</div>}
    
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>




      {/* Partner's Customers */}
      <Collapsible
        open={customersOpen}
        onOpenChange={setCustomersOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setCustomersOpen(!customersOpen)}>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>
                  Partner's Customers ({filteredCustomers.length} of {partnerCustomers.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <View size={16} className="mr-2" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allCustomerColumns.filter(c => c.isToggleable).map(column => (
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
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                      <ChevronDown className={cn("h-4 w-4 transition-transform", customersOpen && "rotate-180")} />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by domain name..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {customerSearchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setCustomerSearchTerm('')}
                    ><X className="h-4 w-4 text-muted-foreground" /></Button>
                  )}
                </div>

                {/* Quick Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={processFilter.includes('all') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuickFilter('all')}
                  >
                    All ({partnerCustomers.length})
                  </Button>
                  <Button
                    variant={processFilter.length === 4 && processFilter.includes('prospect') && processFilter.includes('demo') && processFilter.includes('poc') && processFilter.includes('negotiating') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuickFilter('prospects')}
                  >
                    All Prospects ({prospects.length})
                  </Button>
                  <Button
                    variant={processFilter.length === 2 && processFilter.includes('won') && processFilter.includes('deployment') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuickFilter('purchased')}
                  >
                    Purchased ({purchased.length})
                  </Button>
                  <Button
                    variant={processFilter.length === 1 && processFilter.includes('lost') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuickFilter('lost')}
                  >
                    Lost ({lost.length})
                  </Button>
                  <Button
                    variant={processFilter.length === 4 && processFilter.includes('prospect') && processFilter.includes('demo') && processFilter.includes('poc') && processFilter.includes('negotiating') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuickFilter('active-pipeline')}
                  >
                    Active Pipeline ({prospects.length})
                  </Button>
                </div>

                {/* Individual Stage Filters */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-muted-foreground self-center">Individual Stages:</span>
                  {Object.entries(stageCounts).map(([stage, count]) => (
                    <Button
                      key={stage}
                      variant={processFilter.includes(stage) && !processFilter.includes('all') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleStageFilter(stage)}
                      className="gap-1"
                    >
                      <Badge className={getProcessStageColor(stage)} variant="secondary">
                        {getProcessStageLabel(stage)}
                      </Badge>
                      ({count})
                    </Button>
                  ))}
                </div>

                {/* Active Filter Display */}
                {!processFilter.includes('all') && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Active filters:</span>
                    <div className="flex gap-1">
                      {processFilter.map(stage => (
                        <Badge key={stage} className={getProcessStageColor(stage)} variant="secondary">
                          {getProcessStageLabel(stage)}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProcessFilter(['all'])}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
              {isDomainDetailView ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                  {/* Left Pane: Domain List */}
                  <div className="md:col-span-1 flex flex-col h-full border-r pr-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Domains ({partnerCustomers.length})</h3>
                      <Button variant="ghost" size="sm" onClick={handleCloseDomainDetailView}>
                        <X className="h-4 w-4 mr-1" /> Close
                      </Button>
                    </div>
                    <div className="overflow-y-auto space-y-2 pr-2 max-h-[400px]">
                      {partnerCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleDomainListItemClick(customer)}
                          className={cn(
                            "p-2 border rounded-md text-sm cursor-pointer transition-colors flex justify-between items-center",
                            selectedCustomerForSub?.id === customer.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
                          )}
                        >
                          <span>{customer.domainName}</span>
                          {selectedCustomerForSub?.id === customer.id && <ChevronsRight className="h-4 w-4" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Right Pane: Subscription Details */}
                  <div className="md:col-span-2 flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-4">Subscription Details for {selectedCustomerForSub?.domainName}</h3>
                    <div className="overflow-y-auto pr-2 max-h-[400px]">
                      {isSubscriptionLoading ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading...</span></div>
                      ) : subscriptionDetails.length > 0 ? (
                        <div className="space-y-4">
                          {subscriptionDetails.map((sub, index) => (
                            <Card key={index}>
                              <CardHeader><CardTitle className="flex justify-between items-center text-base"><span>{sub.skuName}</span><Badge variant={sub.status === 'ACTIVE' ? 'default' : 'destructive'}>{sub.status}</Badge></CardTitle></CardHeader>
                              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-muted-foreground">Plan</p><p className="font-medium">{sub.plan}</p></div>
                                <div><p className="text-muted-foreground">Price</p><p className="font-medium">{sub.price ? `₹${sub.price}` : 'N/A'}</p></div>
                                {sub.renewal_price && sub.renewal_price !== sub.price && (
                                  <div>
                                    <p className="text-muted-foreground">Renewal Price</p><p className="font-medium">₹{sub.renewal_price}</p>
                                  </div>
                                )}
                                <div><p className="text-muted-foreground">Seats</p><p className="font-medium">{sub.usedSeats || 'N/A'} / {sub.maxSeats || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground">Billing</p><p className="font-medium">{sub.billing_frequency || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground">Renewal</p><p className="font-medium">{new Date(sub.renewal_date).toLocaleDateString()}</p></div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">No subscription details found.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {allCustomerColumns.map(col => visibleColumns[col.id] && <TableHead key={col.id}>{col.label}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCustomers ? (
                      <TableRow>
                        <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length} className="h-24 text-center">Loading customers...</TableCell>
                      </TableRow>
                    ) : filteredCustomers.length > 0 ? (
                      currentCustomerRecords.map((customer) => (
                        <TableRow key={customer.id} onClick={() => handleCustomerRowClick(customer)} className="cursor-pointer">
                          {visibleColumns.customerName && <TableCell className="font-medium">{customer.name}</TableCell>}
                          {visibleColumns.domainName && <TableCell>{customer.domainName}</TableCell>}
                          {visibleColumns.company && <TableCell>{customer.company}</TableCell>}
                          {visibleColumns.processStage && (<TableCell><Badge className={getProcessStageColor(customer.process)}>{getProcessStageLabel(customer.process)}</Badge></TableCell>)}
                          {visibleColumns.products && (
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {customer.productIds?.map((productId) => (<Badge key={productId} variant="outline" className="text-xs">{getProductName(productId)}</Badge>)) || 'None'}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.status && (<TableCell><Badge className={getCustomerStatusColor(customer.status)}>{customer.status}</Badge></TableCell>)}
                          {visibleColumns.value && <TableCell>${customer.value.toLocaleString()}</TableCell>}
                          {visibleColumns.created && <TableCell>{customer.createdAt.toLocaleDateString()}</TableCell>}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length} className="h-24 text-center">No customers found for this partner.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      {/* Pagination Controls - only show in main table view */}
      {!isDomainDetailView && (
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
      )}
      {/* DR Cases */}
      <Collapsible
        open={drCasesOpen}
        onOpenChange={setDrCasesOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setDrCasesOpen(!drCasesOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle>DR Cases ({filteredDrCases.length})</CardTitle>
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", drCasesOpen && "rotate-180")} />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases..."
                    value={drCaseSearchTerm}
                    onChange={(e) => setDrCaseSearchTerm(e.target.value)}
                    className="pl-8 pr-8 w-48"
                  />
                  {drCaseSearchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setDrCaseSearchTerm('')}
                    ><X className="h-4 w-4 text-muted-foreground" /></Button>
                  )}
                </div>
                <Select value={drStatusFilter} onValueChange={setDrStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={drCaseTypeFilter} onValueChange={setDrCaseTypeFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Case Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Case Types</SelectItem>
                    {uniqueCaseTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={drDateFilter} onValueChange={setDrDateFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Date Range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                    <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                    <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isDrCaseSplitView && selectedDrCase ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden max-h-[80vh]">
                  {/* Left Pane: DR Case List */}
                  <div className="md:col-span-1 flex flex-col h-full border-r pr-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">DR Cases ({filteredDrCases.length})</h3>
                      <Button variant="ghost" size="sm" onClick={() => { setIsDrCaseSplitView(false); setSelectedDrCase(null); }}>
                        <X className="h-4 w-4 mr-1" /> Close
                      </Button>
                    </div>
                    <div className="overflow-y-auto space-y-2 pr-2 max-h-[400px]">
                      {filteredDrCases.map((drCase) => (
                        <div
                          key={drCase.case_id}
                          onClick={() => setSelectedDrCase(drCase)}
                          className={cn(
                            "p-2 border rounded-md text-sm cursor-pointer transition-colors flex justify-between items-center",
                            selectedDrCase?.case_id === drCase.case_id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
                          )}
                        >
                          <div>
                            <p className="font-medium">{drCase.case_id}</p>
                            <p className="text-xs">{drCase.domain_name}</p>
                          </div>
                          {selectedDrCase?.case_id === drCase.case_id && <ChevronsRight className="h-4 w-4" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Right Pane: DR Case Details */}
                  <div className="md:col-span-2 flex flex-col h-full">
                    <div className="max-h-[50vh] pr-6">
                      <div className="space-y-6 py-4">
                        {/* Main Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Case Information: {selectedDrCase.case_name}</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-4 text-sm">
                            <div className="space-y-1"><Label className="text-muted-foreground">Customer</Label><p className="font-medium">{selectedDrCase.customer_name}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Customer Domain</Label><p className="font-medium">{selectedDrCase.domain_name}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Customer Email</Label><p className="font-medium">{selectedDrCase.customer_emailid}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Priority</Label><p className="font-medium capitalize">{selectedDrCase.priority}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Contact</Label><p className="font-medium">{selectedDrCase.customer_contact_number}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Status</Label><p><Badge className={cn("capitalize", getDrCaseStatusColor(selectedDrCase.status))}>{selectedDrCase.status}</Badge></p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Case Type</Label><p className="font-medium">{selectedDrCase.case_type}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Registration Date</Label><p className="font-medium">{new Date(selectedDrCase.created_date).toLocaleDateString()}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Plan Type</Label><p className="font-medium">{selectedDrCase.plan_type}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Plan Duration</Label><p className="font-medium">{selectedDrCase.plan_duration}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Data Migration</Label><p className="font-medium">{selectedDrCase.data_migration}</p></div>
                          </CardContent>
                        </Card>

                        {/* Product Details */}
                        <Card>
                          <CardHeader><CardTitle className="text-lg">Products Requested ({selectedDrCase.prod_details.length})</CardTitle></CardHeader>
                          <CardContent>
                            {selectedDrCase.prod_details.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>

                                    <TableHead>OEM</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">License Count</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedDrCase.prod_details.map((prod, index) => (
                                    <TableRow key={index}>

                                      <TableCell>{prod.oem}</TableCell>
                                      <TableCell className="font-medium">{prod.product}</TableCell>
                                      <TableCell className="text-right">{prod.user_count}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : <p className="text-sm text-muted-foreground">No specific products listed in this case.</p>}
                          </CardContent>
                        </Card>

                        {/* Additional Information */}
                        <Card>
                          <CardHeader><CardTitle className="text-lg">Additional Information</CardTitle></CardHeader>
                          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedDrCase.additional_information || "No additional information provided."}</p></CardContent>
                        </Card>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                      {(selectedDrCase.status === 'Pending' || selectedDrCase.status === 'Rejected') && (
                        <Button variant="outline" onClick={() => handleDrCaseAction(selectedDrCase, 'accept')} title="Accept"><CheckCircle className="h-5 w-5 text-green-600 mr-2" /> Accept</Button>
                      )}
                      {(selectedDrCase.status === 'Pending' || selectedDrCase.status === 'Accepted') && (
                        <Button variant="destructive" onClick={() => handleDrCaseAction(selectedDrCase, 'reject')} title="Reject"><XCircle className="h-5 w-5 mr-2" /> Reject</Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                {isLoadingDrCases ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading DR Cases...</span>
                  </div>
                ) : filteredDrCases.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case ID</TableHead>
                        <TableHead>Domain Name</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Reg. Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Case Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentDrCaseRecords.map((drCase) => (
                        <TableRow key={drCase.case_id} onClick={() => {
                          setSelectedDrCase(drCase);
                          setIsDrCaseSplitView(true); 
                        }} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{drCase.case_id}</TableCell>
                          <TableCell className="font-medium">{drCase.domain_name}</TableCell>
                          <TableCell>{drCase.customer_name}</TableCell>
                          <TableCell>{new Date(drCase.created_date).toLocaleDateString()}</TableCell>
                          <TableCell><Badge className={cn("capitalize", getDrCaseStatusColor(drCase.status))}>{drCase.status}</Badge></TableCell>
                          <TableCell>{drCase.case_type}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              {(drCase.status === 'Pending' || drCase.status === 'Rejected') && (
                                <Button variant="ghost" size="icon" onClick={() => handleDrCaseAction(drCase, 'accept')} title="Accept">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </Button>
                              )}
                              {(drCase.status === 'Pending' || drCase.status === 'Accepted') && (
                                <Button variant="ghost" size="icon" onClick={() => handleDrCaseAction(drCase, 'reject')} title="Reject">
                                  <XCircle className="h-5 w-5 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground"><Briefcase className="h-8 w-8 mb-2" /><p>No DR cases found.</p></div>
                )}
                {filteredDrCases.length > drRecordsPerPage && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing <strong>{indexOfFirstDrRecord + 1}</strong> to <strong>{Math.min(indexOfLastDrRecord, filteredDrCases.length)}</strong> of <strong>{filteredDrCases.length}</strong> cases.
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDrCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={drCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {drCurrentPage} of {totalDrPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDrCurrentPage(prev => Math.min(prev + 1, totalDrPages))}
                        disabled={drCurrentPage === totalDrPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{filteredDrCases.length > 0 ? indexOfFirstDrRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastDrRecord, filteredDrCases.length)}</strong> of <strong>{filteredDrCases.length}</strong> cases.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={drCurrentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {drCurrentPage} of {totalDrPages > 0 ? totalDrPages : 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrCurrentPage(prev => Math.min(prev + 1, totalDrPages))}
            disabled={drCurrentPage === totalDrPages || totalDrPages === 0}
          >
            Next
          </Button>
        </div>
      </div>
      {/* Quotations */}
      <Collapsible
        open={quotationsOpen}
        onOpenChange={setQuotationsOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setQuotationsOpen(!quotationsOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle>Quotations ({filteredQuotations.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsGenerateQuotationDialogOpen(true); }}>
                  <FileTextIcon size={16} className="mr-2" /> Generate Quotation
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", quotationsOpen && "rotate-180")} />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quotations..."
                    value={quotationSearchTerm}
                    onChange={(e) => setQuotationSearchTerm(e.target.value)}
                    className="pl-8 pr-8 w-48"
                  />
                  {quotationSearchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setQuotationSearchTerm('')}
                    ><X className="h-4 w-4 text-muted-foreground" /></Button>
                  )}
                </div>
                <Select value={quotationStatusFilter} onValueChange={setQuotationStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueQuotationStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <>
                {isLoadingQuotations ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading Quotations...</span>
                  </div>
                ) : filteredQuotations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quotation ID</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Customer Domain</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead>Quotation Status</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead>Price (with GST)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentQuotationRecords.map((quotation) => (
                        <TableRow key={quotation.quotation_id} onClick={() => {
                          setSelectedQuotation(quotation);
                          setIsQuotationSplitView(true);
                        }} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{quotation.quotation_id}</TableCell>
                          <TableCell>{quotation.customer_name}</TableCell>
                          <TableCell>{quotation.domain_name}</TableCell>
                          <TableCell>{new Date(quotation.created_date).toLocaleDateString()}</TableCell>
                          <TableCell><Badge className={cn("capitalize", getQuotationStatusColor(quotation.quotation_status))}>{quotation.quotation_status}</Badge></TableCell>
                          <TableCell><Badge className={cn("capitalize", getQuotationOrderStatusColor(quotation.order_status))}>{quotation.order_status}</Badge></TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {quotation.quotation_status === 'Pending' && (
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleQuotationAction(quotation, 'accept')} title="Accept">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleQuotationAction(quotation, 'reject')} title="Reject">
                                  <XCircle className="h-5 w-5 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>₹{parseFloat(quotation.final_price_wt_gst).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                 
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground"><FileTextIcon className="h-8 w-8 mb-2" /><p>No quotations found.</p></div>
                )}
              </>
              {isQuotationSplitView && selectedQuotation && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                  {/* Left Pane: Quotation List */}
                  <div className="md:col-span-1 flex flex-col h-full border-r pr-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Quotations ({filteredQuotations.length})</h3>
                      <Button variant="ghost" size="sm" onClick={() => { setIsQuotationSplitView(false); setSelectedQuotation(null); }}>
                        <X className="h-4 w-4 mr-1" /> Close
                      </Button>
                    </div>
                    <div className="overflow-y-auto space-y-2 pr-2 max-h-[400px]">
                      {filteredQuotations.map((quotation) => (
                        <div
                          key={quotation.quotation_id}
                          onClick={() => setSelectedQuotation(quotation)}
                          className={cn(
                            "p-2 border rounded-md text-sm cursor-pointer transition-colors flex justify-between items-center",
                            selectedQuotation?.quotation_id === quotation.quotation_id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
                          )}
                        >
                          <div>
                            <p className="font-medium">{quotation.quotation_id}</p>
                            <p className="text-xs">{quotation.customer_name}</p>
                          </div>
                          {selectedQuotation?.quotation_id === quotation.quotation_id && <ChevronsRight className="h-4 w-4" />}
                        </div>
                      ))}
                    </div>
                  </div>
                   {/* Right Pane: Quotation Details */}
                  <div className="md:col-span-2 flex flex-col h-full">
                    <ScrollArea className="max-h-[70vh] pr-6">
                      <div className="space-y-6 py-4">
                        <Card>
                          <CardHeader><CardTitle className="text-lg">Quotation Information: {selectedQuotation.quotation_id}</CardTitle></CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-4 text-sm">
                            <div className="space-y-1"><Label className="text-muted-foreground">Customer</Label><p className="font-medium">{selectedQuotation.customer_name}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Customer Domain</Label><p className="font-medium">{selectedQuotation.domain_name}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Quotation Status</Label><p><Badge className={cn("capitalize", getQuotationStatusColor(selectedQuotation.quotation_status))}>{selectedQuotation.quotation_status}</Badge></p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Order Status</Label><p><Badge className={cn("capitalize", getQuotationOrderStatusColor(selectedQuotation.order_status))}>{selectedQuotation.order_status}</Badge></p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Created Date</Label><p className="font-medium">{new Date(selectedQuotation.created_date).toLocaleString()}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Expiry Date</Label><p className="font-medium">{new Date(selectedQuotation.quotation_expiry).toLocaleString()}</p></div>
                            {/* <div className="space-y-1"><Label className="text-muted-foreground">Partner Discount</Label><p className="font-medium">{selectedQuotation.discount || 'N/A'}</p></div> */}
                            <div className="space-y-1"><Label className="text-muted-foreground">Price (excl. GST)</Label><p className="font-medium">₹{parseFloat(selectedQuotation.final_price_wto_gst).toLocaleString('en-IN')}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground">Price (incl. GST)</Label><p className="font-medium">₹{parseFloat(selectedQuotation.final_price_wt_gst).toLocaleString('en-IN')}</p></div>
                          </CardContent>
                        </Card>
                        {selectedQuotation.quotation_status === 'Pending' && (
                          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button variant="outline" onClick={() => handleQuotationAction(selectedQuotation, 'accept')} title="Accept"><CheckCircle className="h-5 w-5 text-green-600 mr-2" /> Accept</Button>
                            <Button variant="destructive" onClick={() => handleQuotationAction(selectedQuotation, 'reject')} title="Reject"><XCircle className="h-5 w-5 mr-2" /> Reject</Button>
                          </div>
                        )}


                        <Card>
                          <CardHeader><CardTitle className="text-lg">Products in Quotation ({selectedQuotation.concatenated_products.length})</CardTitle></CardHeader>
                          <CardContent>
                            {selectedQuotation.concatenated_products.length > 0 ? (
                              <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead className="text-center">Users</TableHead><TableHead className="text-right">SKU Price</TableHead><TableHead className="text-right">Product Discount(%)</TableHead><TableHead className="text-right">Shiviom Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader><TableBody>{selectedQuotation.concatenated_products.map((prod, index) => (<TableRow key={index}><TableCell><div className="font-medium">{prod.product_name}</div><div className="text-xs text-muted-foreground">{prod.oem_name}</div></TableCell><TableCell>{prod.skuname}</TableCell><TableCell className="text-center">{prod.usercount}</TableCell><TableCell className="text-right">₹{parseFloat(prod.actual_sku_price).toLocaleString('en-IN')}</TableCell><TableCell className="text-right">{parseFloat(prod.product_discount).toFixed(1)}%</TableCell><TableCell className="text-right">₹{parseFloat(prod.shivaami_price).toLocaleString('en-IN')}</TableCell><TableCell className="text-right">₹{parseFloat(prod.price).toLocaleString('en-IN')}</TableCell><TableCell className="text-right font-medium">₹{parseFloat(prod.shivaamisubtotal).toLocaleString('en-IN')}</TableCell></TableRow>))}</TableBody></Table>
                            ) : <p className="text-sm text-muted-foreground">No products listed.</p>}
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{filteredQuotations.length > 0 ? indexOfFirstQuotationRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastQuotationRecord, filteredQuotations.length)}</strong> of <strong>{filteredQuotations.length}</strong> quotations.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuotationCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={quotationCurrentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {quotationCurrentPage} of {totalQuotationPages > 0 ? totalQuotationPages : 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuotationCurrentPage(prev => Math.min(prev + 1, totalQuotationPages))}
            disabled={quotationCurrentPage === totalQuotationPages || totalQuotationPages === 0}
          >
            Next
          </Button>
        </div>
      </div>

   
      {/* Renewal Details */}
      <Collapsible
        open={renewalsOpen}
        onOpenChange={setRenewalsOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setRenewalsOpen(!renewalsOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle>Renewal Details ({filteredRenewals.length})</CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", renewalsOpen && "rotate-180")} />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent><CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by domain or product..."
                  value={renewalSearchTerm}
                  onChange={(e) => setRenewalSearchTerm(e.target.value)}
                  className="pl-8 pr-8 w-64"
                />
                {renewalSearchTerm && (
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setRenewalSearchTerm('')}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <Select value={renewalStatusFilter} onValueChange={setRenewalStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isRenewalDetailView && selectedRenewalForDetail ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Left Pane: Domain List */}
                <div className="md:col-span-1 flex flex-col h-full border-r pr-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Domains ({filteredRenewals.length})</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsRenewalDetailView(false)}>
                      <X className="h-4 w-4 mr-1" /> Close
                    </Button>
                  </div>
                  <ScrollArea className="overflow-y-auto space-y-2 pr-2 max-h-[400px]">
                    {filteredRenewals.map((renewal) => (
                      <div
                        key={renewal.subscriptionId}
                        onClick={() => {
                          setSelectedRenewalForDetail(renewal);
                          fetchRenewalComments(renewal.subscriptionId);
                        }}
                        className={cn(
                          "p-2 border rounded-md text-sm cursor-pointer transition-colors flex justify-between items-center",
                          selectedRenewalForDetail?.r_id === renewal.r_id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
                        )}
                      >
                        <div>
                          <p className="font-medium">{renewal.customerDomain}</p>
                          <p className="text-xs opacity-80">{renewal.skuName}</p>
                        </div>
                        {selectedRenewalForDetail?.subscriptionId === renewal.subscriptionId && <ChevronsRight className="h-4 w-4" />}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                {/* Right Pane: Renewal Details */}
                <div className="md:col-span-2 flex flex-col h-full">
                  <h3 className="text-lg font-semibold mb-4">Details for {selectedRenewalForDetail.customerDomain}</h3>
                  <ScrollArea className="overflow-y-auto pr-2 max-h-[60vh]">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center text-base">
                          <span>{selectedRenewalForDetail.skuName}</span>
                          <Badge className={getStatusColor(selectedRenewalForDetail.status)}>
                            {selectedRenewalForDetail.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><p className="text-muted-foreground">Customer Domain</p><p className="font-medium">{selectedRenewalForDetail.customerDomain}</p></div>
                        <div><p className="text-muted-foreground">Plan</p><p className="font-medium">{selectedRenewalForDetail.plan}</p></div>
                        <div><p className="text-muted-foreground">Seats</p><p className="font-medium">{selectedRenewalForDetail.usedSeats || 'N/A'} / {selectedRenewalForDetail.maxSeats || 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">Price</p><p className="font-medium">{selectedRenewalForDetail.price ? `₹${selectedRenewalForDetail.price}` : 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">Revenue Amount</p><p className="font-medium">₹{selectedRenewalForDetail.revenue_amt}</p></div>
                        <div><p className="text-muted-foreground">Billing</p><p className="font-medium">{selectedRenewalForDetail.billing_frequency || 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">Google Renewal Date</p><p className="font-medium">{selectedRenewalForDetail.google_renewal_date}</p></div>
                        <div><p className="text-muted-foreground">Shivaami Renewal Date</p><p className="font-medium">{new Date(selectedRenewalForDetail.shivaami_renewal_date).toLocaleDateString()}</p></div>
                        <div><p className="text-muted-foreground">Subscription ID</p><p className="font-medium">{selectedRenewalForDetail.subscriptionId}</p></div>
                        <div><p className="text-muted-foreground">Customer ID</p><p className="font-medium">{selectedRenewalForDetail.customerId}</p></div>
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="mt-4">
                      <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
                      <CardContent className="flex gap-2">
                        <RenewalEmailDialog
                          renewal={{
                            id: selectedRenewalForDetail.subscriptionId,
                            customerId: selectedRenewalForDetail.customerId,
                            partnerId: selectedRenewalForDetail.reseller_id,
                            productId: selectedRenewalForDetail.skuid,
                            renewalDate: new Date(selectedRenewalForDetail.shivaami_renewal_date),
                            contractValue: parseFloat(selectedRenewalForDetail.revenue_amt),
                            status: selectedRenewalForDetail.status,
                          }}
                          customer={partnerCustomers.find(c => c.id === selectedRenewalForDetail.customerId) || { id: selectedRenewalForDetail.customerId, name: selectedRenewalForDetail.customer_name || '', domainName: selectedRenewalForDetail.customerDomain || '' } as Customer}
                          partner={partnerState}
                          products={products}
                          assignedEmployee={users.find(u => partnerState.assignedUserIds?.includes(u.id))}
                        >
                          <Button variant="outline" size="sm" className="gap-1"><Mail size={14} /> Email</Button>
                        </RenewalEmailDialog>
                        <Button variant="outline" size="sm" className="gap-1"><Phone size={14} /> Call</Button>
                        <Button variant="destructive" size="sm" className="gap-1" onClick={() => { setRenewalToSuspend(selectedRenewalForDetail); setIsSuspendRenewalDialogOpen(true); }}>
                          <AlertTriangle size={14} /> Suspend
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Comments */}
                    <Card className="mt-4">
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare size={16} /> Comments</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {isRenewalCommentsLoading ? (
                              <div className="flex items-center justify-center h-24 text-muted-foreground"><Loader2 className="animate-spin mr-2" />Loading comments...</div>
                            ) : renewalComments.length > 0 ? (
                              renewalComments.map(comment => (
                                <div key={comment.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium">{comment.created_by_name || 'User'}</span>
                                    <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-muted-foreground">{comment.comment}</p>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center justify-center h-24 text-muted-foreground">No comments yet.</div>
                            )}
                          </div>
                          <div className="space-y-2 border-t pt-4">
                            <Label htmlFor="new-renewal-comment">Add a comment</Label>
                            <Textarea id="new-renewal-comment" placeholder="Type your comment here..." value={newRenewalComment} onChange={(e) => setNewRenewalComment(e.target.value)} rows={3} />
                            <Button onClick={handleAddRenewalComment} disabled={isSubmittingRenewalComment || !newRenewalComment.trim()} size="sm">
                              {isSubmittingRenewalComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <Send size={14} className="mr-2" /> Post Comment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollArea>
                </div>
              </div>
            ) : isLoadingRenewals ? (
              <div className="flex items-center justify-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading Renewals...</span></div>
            ) : filteredRenewals.length > 0 ? (
              <>
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{filteredRenewals.length > 0 ? indexOfFirstRenewalRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastRenewalRecord, filteredRenewals.length)}</strong> of <strong>{filteredRenewals.length}</strong> renewals.
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setRenewalCurrentPage(p => Math.max(p - 1, 1))} disabled={renewalCurrentPage === 1}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {renewalCurrentPage} of {totalRenewalPages > 0 ? totalRenewalPages : 1}</span>
                    <Button variant="outline" size="sm" onClick={() => setRenewalCurrentPage(p => Math.min(p + 1, totalRenewalPages))} disabled={renewalCurrentPage === totalRenewalPages || totalRenewalPages === 0}>Next</Button>
                  </div>
                </div>
                <Table><TableHeader><TableRow><TableHead>Customer Domain</TableHead><TableHead>Product</TableHead><TableHead title="Google Renewal Date">GRD</TableHead><TableHead title="Shivaami Renewal Date">SRD</TableHead><TableHead>Days Left</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{currentRenewalRecords.map((renewal) => {
                  const daysLeft = getDaysUntilRenewal(renewal.shivaami_renewal_date);
                  return (
                    <TableRow key={renewal.subscriptionId} onClick={() => {
                      setSelectedRenewalForDetail(renewal);
                      setIsRenewalDetailView(true);
                      fetchRenewalComments(renewal.subscriptionId);
                    }} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{renewal.customerDomain || 'N/A'}</TableCell>
                      <TableCell>{renewal.skuName}</TableCell>
                      <TableCell>{renewal.google_renewal_date}</TableCell>
                      <TableCell>{new Date(renewal.shivaami_renewal_date).toLocaleDateString()}</TableCell>
                      <TableCell>{daysLeft !== null ? (<span className={`font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>{daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} days`}</span>) : 'N/A'}</TableCell>
                      <TableCell><div className="flex items-center gap-2">{getStatusIcon(renewal.status)}<Badge className={getStatusColor(renewal.status)}>{renewal.status}</Badge></div></TableCell>
                    </TableRow>
                  );
                })}</TableBody></Table>
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{filteredRenewals.length > 0 ? indexOfFirstRenewalRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastRenewalRecord, filteredRenewals.length)}</strong> of <strong>{filteredRenewals.length}</strong> renewals.
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setRenewalCurrentPage(p => Math.max(p - 1, 1))} disabled={renewalCurrentPage === 1}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {renewalCurrentPage} of {totalRenewalPages > 0 ? totalRenewalPages : 1}</span>
                    <Button variant="outline" size="sm" onClick={() => setRenewalCurrentPage(p => Math.min(p + 1, totalRenewalPages))} disabled={renewalCurrentPage === totalRenewalPages || totalRenewalPages === 0}>Next</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-muted-foreground"><FileTextIcon className="h-8 w-8 mb-2" /><p>No renewal details found for this partner.</p></div>
            )}
          </CardContent></CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Domain Add License History */}
      <Collapsible
        open={licenseHistoryOpen}
        onOpenChange={setLicenseHistoryOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setLicenseHistoryOpen(!licenseHistoryOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle>Domain Add License History</CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", licenseHistoryOpen && "rotate-180")} />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {isLicenseHistoryDetailView && selectedCustomerForHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                  {/* Left Pane: Customer List */}
                  <div className="md:col-span-1 flex flex-col h-full border-r pr-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Customers ({partnerCustomers.length})</h3>
                      <Button variant="ghost" size="sm" onClick={() => setIsLicenseHistoryDetailView(false)}>
                        <X className="h-4 w-4 mr-1" /> Close
                      </Button>
                    </div>
                    <ScrollArea className="overflow-y-auto space-y-2 pr-2 max-h-[400px]">
                      {partnerCustomers.map((customer) => (
                        <div
                          key={customer.google_custid}
                          onClick={() => {
                            setSelectedCustomerForHistory(customer);
                            fetchLicenseHistory(customer.google_custid);
                            setLicenseHistoryDetailsPage(1);
                          }}
                          className={cn(
                            "p-2 border rounded-md text-sm cursor-pointer transition-colors flex justify-between items-center",
                            selectedCustomerForHistory?.google_custid === customer.google_custid ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
                          )}
                        >
                          <div>
                            <p className="font-medium">{customer.domainName}</p>
                            <p className="text-xs opacity-80">{customer.name}</p>
                          </div>
                          {selectedCustomerForHistory?.id === customer.google_custid && <ChevronsRight className="h-4 w-4" />}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  {/* Right Pane: License History Details */}
                  <div className="md:col-span-2 flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-4">History for {selectedCustomerForHistory.domainName}</h3>
                    <ScrollArea className="overflow-y-auto pr-2 max-h-[60vh]">
                      {isLoadingLicenseHistory ? (
                        <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading History...</span></div>
                      ) : filteredLicenseHistoryDetails && filteredLicenseHistoryDetails.length > 0 ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>SKU Name</TableHead>
                                <TableHead>Added</TableHead>
                                <TableHead>Added Date</TableHead>
                                <TableHead>Zoho InvoiceID</TableHead>
                                <TableHead>Order Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentLicenseHistoryDetails.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{item.skuid}</TableCell>
                                  <TableCell className="text-green-600 font-medium">+{item.numberOfUser}</TableCell>
                                  <TableCell>{new Date(item.transactionExecutionDate).toLocaleString()}</TableCell>
                                  <TableCell>{item.zohoinvoiceid}</TableCell>
                                  <TableCell>{item?.order_amount != null ? `₹${Number(item.order_amount).toLocaleString('en-IN')}` : 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {filteredLicenseHistoryDetails.length > licenseHistoryDetailsPerPage && (
                            <div className="flex items-center justify-between pt-4">
                              <div className="text-sm text-muted-foreground">
                                Showing <strong>{indexOfFirstLicenseHistoryDetail + 1}</strong> to <strong>{Math.min(indexOfLastLicenseHistoryDetail, filteredLicenseHistoryDetails.length)}</strong> of <strong>{filteredLicenseHistoryDetails.length}</strong> entries.
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setLicenseHistoryDetailsPage(p => Math.max(p - 1, 1))} disabled={licenseHistoryDetailsPage === 1}>Previous</Button>
                                <span className="text-sm text-muted-foreground">Page {licenseHistoryDetailsPage} of {totalLicenseHistoryDetailsPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setLicenseHistoryDetailsPage(p => Math.min(p + 1, totalLicenseHistoryDetailsPages))} disabled={licenseHistoryDetailsPage === totalLicenseHistoryDetailsPages}>Next</Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <History className="h-8 w-8 mb-2" />
                          <p>No license history found for this customer.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Select a customer to view their license addition history.</p>
                  {isLoadingCustomers ? (
                    <div className="flex items-center justify-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading Customers...</span></div>
                  ) : partnerCustomers.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {currentLicenseHistoryCustomers.map((customer) => (
                          <Card
                            key={customer.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setSelectedCustomerForHistory(customer);
                              setIsLicenseHistoryDetailView(true);
                              fetchLicenseHistory(customer.google_custid);
                              setLicenseHistoryDetailsPage(1); // Reset page
                            }}
                          >
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="bg-muted p-3 rounded-full"><Building size={20} className="text-muted-foreground" /></div>
                              <div><p className="font-semibold">{customer.domainName}</p><p className="text-sm text-muted-foreground">{customer.name}</p></div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {partnerCustomers.length > licenseHistoryCustomersPerPage && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing <strong>{indexOfFirstLicenseHistoryCustomer + 1}</strong> to <strong>{Math.min(indexOfLastLicenseHistoryCustomer, partnerCustomers.length)}</strong> of <strong>{partnerCustomers.length}</strong> customers.
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setLicenseHistoryCustomerPage(p => Math.max(p - 1, 1))} disabled={licenseHistoryCustomerPage === 1}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {licenseHistoryCustomerPage} of {totalLicenseHistoryCustomerPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setLicenseHistoryCustomerPage(p => Math.min(p + 1, totalLicenseHistoryCustomerPages))} disabled={licenseHistoryCustomerPage === totalLicenseHistoryCustomerPages}>Next</Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground"><Users className="h-8 w-8 mb-2" /><p>No customers found for this partner.</p></div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Invoice History */}
      <Collapsible
        open={invoiceHistoryOpen}
        onOpenChange={setInvoiceHistoryOpen}
        className="w-full"
      >
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setInvoiceHistoryOpen(!invoiceHistoryOpen)}>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice History</CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", invoiceHistoryOpen && "rotate-180")} />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {isInvoiceHistoryDetailView && selectedCustomerForInvoiceHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                  {/* Left Pane: Customer List */}
                  <div className="md:col-span-1 flex flex-col h-full border-r pr-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Customers ({partnerCustomers.length})</h3>
                      <Button variant="ghost" size="sm" onClick={() => setIsInvoiceHistoryDetailView(false)}>
                        <X className="h-4 w-4 mr-1" /> Close
                      </Button>
                    </div>
                    <ScrollArea className="overflow-y-auto space-y-2 pr-2 max-h-[400px]">
                      {partnerCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomerForInvoiceHistory(customer);
                            fetchInvoiceHistory(customer.domainName);
                            setInvoiceHistoryDetailsPage(1);
                          }}
                          className={cn(
                            "p-2 border rounded-md text-sm cursor-pointer transition-colors flex justify-between items-center",
                            selectedCustomerForInvoiceHistory?.id === customer.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
                          )}
                        >
                          <div>
                            <p className="font-medium">{customer.domainName}</p>
                            <p className="text-xs opacity-80">{customer.name}</p>
                          </div>
                          {selectedCustomerForInvoiceHistory?.id === customer.id && <ChevronsRight className="h-4 w-4" />}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  {/* Right Pane: Invoice History Details */}
                  <div className="md:col-span-2 flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-4">Invoice History for {selectedCustomerForInvoiceHistory.domainName}</h3>
                    <ScrollArea className="overflow-y-auto pr-2 max-h-[60vh]">
                      {isLoadingInvoiceHistory ? (
                        <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading History...</span></div>
                      ) : currentInvoiceDetails && currentInvoiceDetails.length > 0 ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>SKU Name</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentInvoiceDetails.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{item.invoice_no}</TableCell>
                                  <TableCell>{new Date(item.invoice_date).toLocaleDateString()}</TableCell>
                                  <TableCell><Badge variant="outline">{item.plan_name}</Badge></TableCell><TableCell><Badge className={cn("capitalize", getInvoiceStatusColor(item.invoice_status))}>{item.invoice_status}</Badge></TableCell>

                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {filteredInvoiceDetails.length > invoiceHistoryDetailsPerPage && (
                            <div className="flex items-center justify-between pt-4">
                              <div className="text-sm text-muted-foreground">
                                Showing <strong>{indexOfFirstInvoiceDetail + 1}</strong> to <strong>{Math.min(indexOfLastInvoiceDetail, filteredInvoiceDetails.length)}</strong> of <strong>{filteredInvoiceDetails.length}</strong> entries.
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setInvoiceHistoryDetailsPage(p => Math.max(p - 1, 1))} disabled={invoiceHistoryDetailsPage === 1}>Previous</Button>
                                <span className="text-sm text-muted-foreground">Page {invoiceHistoryDetailsPage} of {totalInvoiceDetailsPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setInvoiceHistoryDetailsPage(p => Math.min(p + 1, totalInvoiceDetailsPages))} disabled={invoiceHistoryDetailsPage === totalInvoiceDetailsPages}>Next</Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <History className="h-8 w-8 mb-2" />
                          <p>No invoice history found for this customer.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Select a customer to view their invoice history.</p>
                  {isLoadingCustomers ? (
                    <div className="flex items-center justify-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading Customers...</span></div>
                  ) : partnerCustomers.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {currentInvoiceCustomers.map((customer) => (
                          <Card
                            key={customer.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setSelectedCustomerForInvoiceHistory(customer);
                              setIsInvoiceHistoryDetailView(true);
                              fetchInvoiceHistory(customer.domainName);
                              setInvoiceHistoryDetailsPage(1); // Reset page
                            }}
                          >
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="bg-muted p-3 rounded-full"><Building size={20} className="text-muted-foreground" /></div>
                              <div><p className="font-semibold">{customer.domainName}</p><p className="text-sm text-muted-foreground">{customer.name}</p></div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {partnerCustomers.length > invoiceHistoryCustomersPerPage && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing <strong>{indexOfFirstInvoiceCustomer + 1}</strong> to <strong>{Math.min(indexOfLastInvoiceCustomer, partnerCustomers.length)}</strong> of <strong>{partnerCustomers.length}</strong> customers.
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setInvoiceHistoryCustomerPage(p => Math.max(p - 1, 1))} disabled={invoiceHistoryCustomerPage === 1}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {invoiceHistoryCustomerPage} of {totalInvoiceCustomerPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setInvoiceHistoryCustomerPage(p => Math.min(p + 1, totalInvoiceCustomerPages))} disabled={invoiceHistoryCustomerPage === totalInvoiceCustomerPages}>Next</Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground"><Users className="h-8 w-8 mb-2" /><p>No customers found for this partner.</p></div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Renewal Detail Split View */}
      {/* This dialog is no longer needed as it's integrated into the split view */}
      {/* {isRenewalDetailView && selectedRenewalForDetail && ( ... )} */}

      {/* DR Case Rejection Dialog */}
      <Dialog open={isRejectDrCaseDialogOpen} onOpenChange={setIsRejectDrCaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting case: {selectedDrCaseForAction?.case_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="sr-only">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              value={drCaseRejectionReason}
              onChange={(e) => setDrCaseRejectionReason(e.target.value)}
              placeholder="Provide a clear reason for rejection..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDrCaseDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmRejection} disabled={!drCaseRejectionReason.trim()}>Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quotation Rejection Dialog */}
      <Dialog open={isRejectQuotationDialogOpen} onOpenChange={setIsRejectQuotationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting quotation: {selectedQuotationForAction?.quotation_id}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="quotation-rejection-reason" className="sr-only">Rejection Reason</Label>
            <Textarea
              id="quotation-rejection-reason"
              value={quotationRejectionReason}
              onChange={(e) => setQuotationRejectionReason(e.target.value)}
              placeholder="Provide a clear reason for rejection..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectQuotationDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmQuotationRejection} disabled={!quotationRejectionReason.trim()}>Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Partner Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Partner: {partner.name}</DialogTitle>
            <DialogDescription>Update the details for this partner.</DialogDescription>
          </DialogHeader>
          <EditPartnerDialog partner={initialPartnerState} users={users} open={isEditing} onOpenChange={setIsEditing} onSuccess={handleEditSuccess} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renewal Suspension Dialog */}
      <Dialog open={isSuspendRenewalDialogOpen} onOpenChange={setIsSuspendRenewalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Renewal</DialogTitle>
            <DialogDescription>
              Provide a reason for suspending the renewal for {renewalToSuspend?.customerDomain}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="renewal-suspension-reason">Reason for Suspension</Label>
            <Textarea
              id="renewal-suspension-reason"
              value={renewalSuspensionReason}
              onChange={(e) => setRenewalSuspensionReason(e.target.value)}
              placeholder="e.g., Customer requested to postpone, budget constraints..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendRenewalDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspendRenewal} disabled={isSuspendingRenewal || !renewalSuspensionReason.trim()}>
              {isSuspendingRenewal ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={isDocViewerOpen} onOpenChange={setIsDocViewerOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{docViewerTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow rounded-lg overflow-hidden">
            {docViewerUrl && (
              <iframe src={docViewerUrl} className="w-full h-full border-0" title={docViewerTitle} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* KYC Details Modal */}
      <Dialog open={isKycDetailModalOpen} onOpenChange={setIsKycDetailModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Complete KYC Details</DialogTitle>
            <DialogDescription>
              Full response data for the partner's KYC information.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-1">
            {kycDetails ? (
              <Tabs defaultValue="basic-details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic-details">Basic Details</TabsTrigger>
                  <TabsTrigger value="business-details">Business Details</TabsTrigger>
                  <TabsTrigger value="address-details">Address Details</TabsTrigger>
                  <TabsTrigger value="bank-details">Bank Details</TabsTrigger>
                </TabsList>

                <TabsContent value="basic-details" className="mt-4">
                  <Card>
                    <CardContent className="pt-6 space-y-1">
                      <KycDetailRowSimple label="Company Category" value={kycDetails.companycategory} />
                      {kycDetails.companycategory === 'Pvt. Ltd.' ? (
                        <>
                          <KycDetailRowSimple label="Owner Full Name" value={kycDetails.owner_full_name} />
                          <KycDetailRowSimple label="Owner Email" value={kycDetails.owner_email} />
                          <KycDetailRowSimple label="Secondary Contact Name" value={kycDetails.secondary_contact_name} />
                          <KycDetailRowSimple label="Secondary Contact Email" value={kycDetails.secondary_contact_email} />
                          <KycDetailRowSimple label="Secondary Contact Number" value={kycDetails.secondary_contact_number} />
                          <KycDetailRowSimple label="Account Contact Name" value={kycDetails.account_contact_name} />
                          <KycDetailRowSimple label="Account Contact Email" value={kycDetails.account_contact_email} />
                          <KycDetailRowSimple label="Account Contact Number" value={kycDetails.account_contact_number} />
                        </>
                      ) : (
                        <>
                          <KycDetailRowSimple label="Owner Full Name" value={kycDetails.owner_full_name} />
                          <KycDetailRowSimple label="Owner Email" value={kycDetails.owner_email} />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="business-details" className="mt-4">
                  <Card>
                    <CardContent className="pt-6 space-y-1">
                      <KycDetailRowSimple label="Udyog Adhar Number" value={kycDetails.udyog_adhar_number} />
                      <KycDetailRowSimple label="MSME Number" value={kycDetails.msme_number} />
                      <KycDetailRowSimple label="PAN Number" value={kycDetails.pan_number} />
                      <KycDetailRowSimple label="GST Number" value={kycDetails.gst_number} />
                      <KycDetailRowSimple label="TAN Number" value={kycDetails.tan_number} />
                      <KycDocumentRowSimple label="Uploaded PAN Card" url={kycDetails.documents?.find((d: any) => d.panCard)?.panCard} openDocViewer={openDocViewer} />
                      <KycDocumentRowSimple label="Uploaded GST Certificate" url={kycDetails.documents?.find((d: any) => d.gstcertificate)?.gstcertificate} openDocViewer={openDocViewer} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="address-details" className="mt-4">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div><h4 className="font-medium text-sm mb-2">Office Address</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{kycDetails.pr_officeaddress || 'Not Provided'}</p>{(kycDetails.pr_city || kycDetails.pr_state || kycDetails.pr_pincode) && (<p className="text-sm text-muted-foreground mt-1">{kycDetails.pr_city && <span>{kycDetails.pr_city}, </span>}{kycDetails.pr_state && <span>{kycDetails.pr_state} - </span>}{kycDetails.pr_pincode && <span>{kycDetails.pr_pincode}</span>}</p>)}</div>
                      <div className="border-t pt-4"><h4 className="font-medium text-sm mb-2">Registered Address</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{kycDetails.address || 'Not Provided'}</p>{(kycDetails.city || kycDetails.state || kycDetails.pincode) && (<p className="text-sm text-muted-foreground mt-1">{kycDetails.city && <span>{kycDetails.city}, </span>}{kycDetails.state && <span>{kycDetails.state} - </span>}{kycDetails.pincode && <span>{kycDetails.pincode}</span>}</p>)}</div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bank-details" className="mt-4">
                  <Card>
                    <CardContent className="pt-6 space-y-1">
                      <KycDetailRowSimple label="Account Holder Name" value={kycDetails.account_holder_name} />
                      <KycDetailRowSimple label="Bank Name" value={kycDetails.bank_name} />
                      <KycDetailRowSimple label="Account Number" value={kycDetails.acc_number} />
                      <KycDetailRowSimple label="IFSC Code" value={kycDetails.ifsc_code} />
                      <KycDocumentRowSimple label="Uploaded Cancelled Cheque" url={kycDetails.documents?.find((d: any) => d.cancelCheque)?.cancelCheque} openDocViewer={openDocViewer} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <p>No details to display.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Quotation Dialog */}
      <Dialog open={isGenerateQuotationDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // Reset state on close
          setAddedProducts([]);
          setQuotationType('');
          setSelectedQuotationCustomer('');
          resetProductForm();
          setPartnerConditions('');
          setCustomerConditions('');
          setSelectedDomain('');
          setQuotationFor('');
          setQuotationExpiry('');
          setAddedProducts([])
          setSelectedSkuId(''); // Clear selected SKU ID on dialog close

        }
        setIsGenerateQuotationDialogOpen(open);
      }}>
        <DialogContent className="max-w-screen-2xl">
          <DialogHeader>
            <DialogTitle>Generate New Quotation</DialogTitle>
            <DialogDescription>
              Fill in the details below to generate a new quotation for this partner.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="py-4 space-y-6 pr-6">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="quotation-type">Quotation Type</Label>
                  <Select value={quotationType} onValueChange={(value) => setQuotationType(value)}>
                    <SelectTrigger id="quotation-type">
                      <SelectValue placeholder="Select quotation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Case</SelectItem>
                      <SelectItem value="renewal">Renewal Case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer-for-quotation">Select Customer</Label>
                  <Select value={selectedQuotationCustomer} onValueChange={handleQuotationCustomerChange}>
                    <SelectTrigger id="customer-for-quotation">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerCustomers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.domainName})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="domain-for-quotation">Domain</Label>
                  <Input id="domain-for-quotation" value={selectedDomain} disabled />
                </div>
                <div>
                  <Label htmlFor="plan-type">Plan Type</Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger id="plan-type"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="plan-duration">Contract Duration</Label>
                  <Input id="plan-duration" type="number" min="1" value={planDuration} onChange={e => setPlanDuration(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))} placeholder="e.g. 1 (in years)" />
                </div>
                {/* <div>
                  <Label htmlFor="partner-discount">Partner Discount (%)</Label>
                  <Input id="partner-discount" value={partnerState.partner_discount ?? 0} disabled />
                </div> */}
              </div>


              <Card>
                <CardHeader><CardTitle className="text-base">{editingProductId ? 'Edit Product' : 'Add Product'}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {isProductDataLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading product options...</div> :
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div><Label>OEM</Label><Select value={selectedOem} onValueChange={(v) => {
                        setSelectedOem(v);
                        setSelectedProduct('');
                        setSelectedSku('');
                        setSelectedSkuId(''); // Clear SKU ID
                      }}><SelectTrigger><SelectValue placeholder="Select OEM" /></SelectTrigger><SelectContent>{oems.map(oem => <SelectItem key={oem} value={oem}>{oem}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Product</Label><Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setSelectedSku(''); setSelectedSkuId(''); }} disabled={!selectedOem}><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger><SelectContent>{productsForOem.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>SKU (ID)</Label><Select value={selectedSku} onValueChange={(v) => {
                        setSelectedSku(v); // v is sku_name
                        const skuObj = skusForProduct.find(s => s.sku_name === v);
                        setSelectedSkuId(skuObj?.sku_id || '');
                        setSelectedSkuId(skuObj?.portal_sku_id || '');
                      }} disabled={!selectedProduct}>
                        <SelectTrigger><SelectValue placeholder="Select SKU" /></SelectTrigger>
                        <SelectContent>{skusForProduct.map(sku => <SelectItem key={sku.sku_id} value={sku.sku_name}>{sku.sku_name} ({sku.sku_id})</SelectItem>)}</SelectContent>
                      </Select></div>
                      <div><Label htmlFor="license-count">License Count</Label><Input id="license-count" type="number" min="1" value={licenseCount} onChange={e => setLicenseCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))} placeholder="e.g., 10" /></div>
                      {/* {selectedOem === 'Google Workspace' && (
                        <div><Label htmlFor="sku-discount">SKU Discount (%)</Label><Input id="sku-discount" type="number" min="0" max="100" value={skuDiscount} onChange={e => setSkuDiscount(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="e.g., 5" /></div>
                      )} */}
                      <div className="flex gap-2">
                        <Button onClick={editingProductId ? handleUpdateProduct : handleAddProductToQuotation} disabled={isPriceLoading || !selectedSku || !licenseCount} className="w-full">
                          {isPriceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingProductId ? 'Update' : 'Add'}
                        </Button>
                        {editingProductId && <Button variant="outline" onClick={resetProductForm} className="w-full">Cancel</Button>}
                      </div>
                    </div>
                  }
                  {/* Display existing/fetched discounts */}
                  {isDiscountsLoading ? (
                    <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin mr-2" />Loading existing discounts...</div>
                  ) : fetchedProductDiscounts.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Configured Product Discounts</CardTitle></CardHeader>
                      <CardContent>
                        <ScrollArea className="h-40 w-full rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU (ID)</TableHead>
                                <TableHead>New Discount (%)</TableHead>
                                <TableHead>Renewal Discount (%)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fetchedProductDiscounts.map((discountItem) => {
                                const fullProduct = allProducts.find(p => p.id === discountItem.crm_prod_id);
                                const productName = fullProduct?.name || 'N/A';
                                const skuDetail = productData[fullProduct?.oem || '']?.[fullProduct?.name || '']?.find(
                                  (sku: any) => sku.sku_name === discountItem.skuName
                                );
                                const skuId = skuDetail?.sku_id || '';

                                return (
                                  <TableRow key={discountItem.crm_prod_id}>
                                    <TableCell>{productName}</TableCell>
                                    <TableCell className="font-medium">{discountItem.skuName} {skuId && `(${skuId})`}</TableCell>
                                    <TableCell>{discountItem.discount}%</TableCell>
                                    <TableCell>{discountItem.renewal_discount}%</TableCell>

                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>




              {addedProducts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Quotation Items</h4>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>OEM</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Purchase Type</TableHead>
                      <TableHead>Licenses</TableHead>
                      <TableHead>Prod Discount (%)</TableHead>
                      {/* <TableHead>SKU Disc. %</TableHead> */}
                      {quotationType === 'new' ? <>
                        <TableHead>List Price</TableHead>
                        <TableHead>Shiviom Price</TableHead>
                      </> : <>
                        <TableHead>Renewal List Price</TableHead>
                        <TableHead>Renewal Shiviom Price</TableHead>
                      </>}
                      <TableHead>Subtotal</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {addedProducts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.oemName}</TableCell>
                          <TableCell>{p.productName}</TableCell>
                          <TableCell>{p.skuName}</TableCell>
                          <TableCell className="capitalize">{p.purchaseType}</TableCell>
                          <TableCell>{p.licenseCount}</TableCell>
                          <TableCell>{p.prodDiscount}%</TableCell>
                          {/* <TableCell>{p.skuDiscount}%</TableCell> */}
                          <TableCell>₹{p.listPrice?.toLocaleString()}</TableCell>
                          <TableCell>₹{p.shivaamiPrice?.toLocaleString()}</TableCell>
                          <TableCell>₹{p.subtotal?.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProduct(p.id)} disabled={!!editingProductId}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveProduct(p.id)}><X className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-4" />
                  <div className="flex justify-end mt-2">
                    <div className="flex  mt-6">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm w-full max-w-sm ml-auto mr-32">

                        <span className="text-muted-foreground text-right">
                          Subtotal
                        </span>
                        <span className="font-medium text-right">
                          ₹{quotationTotals.subtotal.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>

                        <span className="text-muted-foreground text-right">
                          GST (18%)
                        </span>
                        <span className="font-medium text-right">
                          ₹{quotationTotals.gst.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>

                        <span className="col-span-2 border-t my-1"></span>

                        <span className="font-semibold text-base text-right">
                          Grand Total
                        </span>
                        <span className="font-semibold text-base text-right">
                          ₹{quotationTotals.grandTotal.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>

                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
            {isLoadingConditions ? (
              <div className="flex items-center justify-center p-4 border rounded-md bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading Terms & Conditions...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="partner-conditions" className="mb-2 block">Partner/Reseller Terms & Conditions</Label>
                  <Textarea id="partner-conditions" value={partnerConditions} onChange={(e) => setPartnerConditions(e.target.value)} rows={6} placeholder="Enter partner conditions, one per line..." />
                </div>
                <div>
                  <Label htmlFor="customer-conditions" className="mb-2 block">Customer Terms & Conditions</Label>
                  <Textarea id="customer-conditions" value={customerConditions} onChange={(e) => setCustomerConditions(e.target.value)} rows={6} placeholder="Enter customer conditions, one per line..." />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quotation-for">Quotation For</Label>
                <Select value={quotationFor} onValueChange={setQuotationFor}>
                  <SelectTrigger id="quotation-for">
                    <SelectValue placeholder="Select who this is for" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quotation-expiry">Quotation Expiry Date</Label>
                <Input id="quotation-expiry" type="date" value={quotationExpiry} onChange={e => setQuotationExpiry(e.target.value)} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateQuotationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateQuotation} disabled={addedProducts.length === 0 || isGeneratingQuotation || !selectedQuotationCustomer || !quotationExpiry}>
              {isGeneratingQuotation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Quotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Knowledge Base Dialog */}
      <Dialog open={isShareKbModalOpen} onOpenChange={(isOpen) => {
        setIsShareKbModalOpen(isOpen);
        if (!isOpen) {
          setSelectedKbDocs([]); // Reset on close
          setKbSearchTerm('');
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Share Knowledge Base</DialogTitle>
            <DialogDescription>
              Select products to expand and choose articles to share with the partner.
            </DialogDescription>
          </DialogHeader>
          <div className="relative my-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={kbSearchTerm}
              onChange={(e) => setKbSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="max-h-[60vh] pr-4">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              onValueChange={(value) => {
                if (value) {
                  fetchKbArticles(value); // value is the portal_prod_id
                }
              }}
            >
              {allProducts
                .filter(p => p.name.toLowerCase().includes(kbSearchTerm.toLowerCase()) && p.portal_prod_id)
                .map(product => (
                  <AccordionItem value={product.portal_prod_id!} key={product.id}>
                    <AccordionTrigger>{product.name} <span className="text-sm text-muted-foreground ml-2">({product.oem})</span></AccordionTrigger>
                    <AccordionContent>
                      {isLoadingKb[product.portal_prod_id!] ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading articles...
                        </div>
                      ) : kbArticles[product.portal_prod_id!] && kbArticles[product.portal_prod_id!].length > 0 ? (
                        <div className="space-y-2 pl-4">
                          {kbArticles[product.portal_prod_id!].map((doc) => (
                            <div key={doc.id} className="flex items-center space-x-3">
                              <Checkbox
                                id={`kb-doc-${doc.id}`}
                                checked={selectedKbDocs.some(selected => selected.id === doc.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedKbDocs(prev => [...prev, doc]);
                                  } else {
                                    setSelectedKbDocs(prev => prev.filter(selected => selected.id !== doc.id));
                                  }
                                }}
                              />
                              <label htmlFor={`kb-doc-${doc.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                <a href={doc.doc_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">{doc.doc_name} <ExternalLink className="inline-block h-3 w-3 ml-1" /></a>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (<div className="text-sm text-muted-foreground text-center p-4">No knowledge base articles found for this product.</div>)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareKbModalOpen(false)}>Cancel</Button>
            <Button onClick={handleShareSelectedKb} disabled={isSharingKb || selectedKbDocs.length === 0}>
              {isSharingKb && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Share {selectedKbDocs.length > 0 ? `(${selectedKbDocs.length})` : ''} Article(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskDialogOpen} onOpenChange={(open) => {
        setIsCreateTaskDialogOpen(open);
        if (!open) resetNewTaskForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task for {partnerState.name}</DialogTitle>
            <DialogDescription>Add a new task associated with this partner.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Enter task description"
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-type">Task Type</Label>
                <Select value={newTask.type} onValueChange={(value: any) => setNewTask({ ...newTask, type: value })}>
                  <SelectTrigger id="task-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="document-review">Document Review</SelectItem>
                    <SelectItem value="approval">Approval</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-customer">Customer</Label>
                <Select
                  value={newTask.customerId}
                  onValueChange={(value) => setNewTask({ ...newTask, customerId: value })}
                >
                  <SelectTrigger id="task-customer">
                    <SelectValue placeholder="Select customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Customer</SelectItem>
                    {partnerCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.domainName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-assignedTo">Assign To *</Label>
                <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}>
                  <SelectTrigger id="task-assignedTo">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="task-dueDate">Due Date</Label>
              <Input
                id="task-dueDate"
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={isCreatingTask}>
              {isCreatingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const KycDetailRowSimple = ({ label, value }: { label: string, value?: string | null }) => (
  <div className="flex justify-between items-center py-2 border-b last:border-b-0">
    <Label className="text-sm text-muted-foreground">{label}</Label>
    <span className="text-sm font-medium text-right">{value || <span className="text-muted-foreground">Not Provided</span>}</span>
  </div>
);

const KycDocumentRowSimple = ({ label, url, openDocViewer }: { label: string, url?: string | null, openDocViewer: (url: string, title: string) => void }) => (
  <div className="flex justify-between items-center py-2 border-b last:border-b-0">
    <Label className="text-sm text-muted-foreground">{label}</Label>
    {url ? (
      <Button variant="link" className="p-0 h-auto text-sm font-medium" onClick={() => openDocViewer(url, label)}>
        <ExternalLink size={14} className="mr-1" /> View Document
      </Button>
    ) : (
      <span className="text-sm text-muted-foreground">
        Not Uploaded
      </span>
    )}
  </div>
);

export default PartnerDetails;
