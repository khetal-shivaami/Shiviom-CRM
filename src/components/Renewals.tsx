import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle, Clock, XCircle, Phone, Mail, Filter, ChevronDown, Users, Download, Send, Trash2, Edit, UserIcon, Eye, X, MessageSquare, Loader2, Activity, RotateCcw, PlusCircle, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Renewal, Customer, Partner, Product, User, RenewalComment } from '../types';
import RenewalEmailDialog from './RenewalEmailDialog';
import BulkRenewalEmailDialog from './BulkRenewalEmailDialog';
import CustomerDetailDialog from './CustomerDetailDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const Renewals = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Data states
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [grdMonthFilter, setGrdMonthFilter] = useState('all');
  const [srdMonthFilter, setSrdMonthFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [presetDateRange, setPresetDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection states
  const [selectedRenewals, setSelectedRenewals] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Dialog states
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedRenewalsForCustomer, setSelectedRenewalsForCustomer] = useState<Renewal[]>([]);

  // Row-level comment states
  const [expandedRenewalId, setExpandedRenewalId] = useState<string | null>(null);
  const [renewalComments, setRenewalComments] = useState<RenewalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Suspension dialog states
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [renewalToSuspend, setRenewalToSuspend] = useState<Renewal | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);

  // State for Create Task
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    type: 'other' as 'follow-up' | 'meeting' | 'document-review' | 'approval' | 'negotiation' | 'onboarding' | 'support' | 'renewal' | 'other',
    customerId: 'none',
    partnerId: 'none',
    dueDate: '',
    assignedTo: ''
  });

  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      type: 'other',
      customerId: 'none',
      partnerId: 'none',
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

    const selectedCustomer = customers.find(c => c.id === newTask.customerId);
    const selectedPartner = partners.find(p => p.id === newTask.partnerId);
    const assignedToUser = users.find(u => u.id === newTask.assignedTo);

    const taskToInsert = {
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      type: newTask.type,
      status: 'pending',
      assigned_to: newTask.assignedTo,
      assigned_by: user?.id,
      portal_customer_id: newTask.customerId === 'none' ? null : newTask.customerId,
      customer_domain: selectedCustomer?.domainName || null,
      partner_id: selectedPartner?.id || null,
      portal_reseller_id: selectedPartner?.portal_reseller_id || null,
      due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
      is_onboarding_task: newTask.type === 'onboarding',
    };

    try {
      const { error } = await supabase.from('tasks').insert(taskToInsert);
      if (error) throw error;

      toast({ title: 'Task Created', description: 'The new task has been added successfully.' });
      setIsCreateTaskDialogOpen(false);
      resetNewTaskForm();
      // You might want to add notification logic here if needed
    } catch (error: any) {
      toast({ title: 'Error Creating Task', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingTask(false);
    }
  };

  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setProgress(prev => (prev >= 95 ? 95 : prev + 5));
      }, 200);
      return () => clearInterval(timer);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.GET_RENEWAL_CRMDATA);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success || !result.overall_renewal_data) {
          throw new Error(result.message || "Failed to fetch renewal data.");
        }

        const rawData = result.overall_renewal_data;

        const renewalsMap = new Map<string, Renewal>();
        const customersMap = new Map<string, Customer>();
        const partnersMap = new Map<string, Partner>();
        const productsMap = new Map<string, Product>();

        rawData.forEach((item: any) => {
          // Use subscriptionId as a unique key for renewal if available, otherwise fallback
          const renewalId = item.subscriptionId || `${item.cust_id}-${item.skuid}-${item.renewal_date}`;

          // Create or update Partner
          if (item.reseller_id && !partnersMap.has(item.reseller_id)) {
            partnersMap.set(item.reseller_id, {
              id: item.reseller_id,
              portal_reseller_id: item.reseller_id,
              name: item.reseller_name || 'Direct',
              email: item.reseller_email,
              phone: item.phone_number,
              company: item.company_name,
              partner_program: item.partner_program,
              // Default values for required fields
              specialization: 'N/A',
              identity: 'system-integrator',
              customersCount: 0,
              newRevenue: 0,
              renewalRevenue: 0,
              totalValue: 0,
              status: 'active',
              createdAt: new Date(),
              agreementSigned: false,
              productTypes: [],
              paymentTerms: 'net-30',
            });
          }

          // Create or update Customer
          if (item.cust_id && !customersMap.has(item.cust_id)) {
            customersMap.set(item.cust_id, {
              id: item.cust_id,
              name: item.customer_name || item.customer_company_name || 'Unknown Customer',
              email: item.customer_emailid,
              phone: item.customer_contact_number,
              company: item.customer_company_name,
              domainName: item.customer_domainname,
              partnerId: item.reseller_id,
              // Default values
              status: 'active',
              createdAt: new Date(),
              value: 0,
            });
          }

          // Create or update Product
          if (item.skuid && !productsMap.has(item.skuid)) {
            productsMap.set(item.skuid, {
              id: item.skuid,
              name: item.skuName,
              // Default values
              website: '',
              category: 'SaaS',
              description: '',
              status: 'active',
              customersCount: 0,
              plans: [],
              createdAt: new Date(),
            });
          }

          // Create Renewal
          renewalsMap.set(renewalId, {
            id: renewalId,
            customerId: item.cust_id,
            partnerId: item.reseller_id,
            productId: item.skuid,
            renewalDate: new Date(item.shivaami_renewal_date || item.renewal_date), // Keep shivaami_renewal_date as primary for logic
            googleRenewalDate: item.renewal_date ? new Date(item.renewal_date) : undefined,
            shivaamiRenewalDate: item.shivaami_renewal_date ? new Date(item.shivaami_renewal_date) : undefined,
            contractValue: parseFloat(item.revenue_amt || item.price || 0),
            status: item.status,
            notificationSent: false,
            price: parseFloat( item.price || 0),
          });
        });

        setRenewals(Array.from(renewalsMap.values()));
        setCustomers(Array.from(customersMap.values()));
        setPartners(Array.from(partnersMap.values()));
        setProducts(Array.from(productsMap.values()));

      } catch (error: any) {
        toast({
          title: "Error fetching renewals",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [statusFilter, partnerFilter, productFilter, dateFilter, searchTerm, grdMonthFilter, srdMonthFilter, presetDateRange, dateRange]);

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
    }
  }, [presetDateRange]);

  const getCustomerDomain = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.domainName || 'Unknown Customer';
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

  const availableGrdMonths = useMemo(() => {
    const months = new Set<string>();
    renewals.forEach(r => {
      if (r.googleRenewalDate) {
        const month = r.googleRenewalDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        months.add(month);
      }
    });
    return Array.from(months).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [renewals]);

  const availableSrdMonths = useMemo(() => {
    const months = new Set<string>();
    renewals.forEach(r => {
      if (r.shivaamiRenewalDate) {
        const month = r.shivaamiRenewalDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        months.add(month);
      }
    });
    return Array.from(months).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [renewals]);


  const filteredRenewals = useMemo(() => {
    return renewals.filter(renewal => {
      // Status filter
      if (statusFilter !== 'all' && renewal.status.toLowerCase() !== statusFilter) return false;
      
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

      // GRD Month filter
      if (grdMonthFilter !== 'all' && renewal.googleRenewalDate) {
        const renewalMonth = renewal.googleRenewalDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (renewalMonth !== grdMonthFilter) return false;
      }

      // SRD Month filter
      if (srdMonthFilter !== 'all' && renewal.shivaamiRenewalDate) {
        const renewalMonth = renewal.shivaamiRenewalDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (renewalMonth !== srdMonthFilter) return false;
      }

      
      // Search filter
      if (searchTerm) {
        const customerDomain = getCustomerDomain(renewal.customerId).toLowerCase();
        const partnerName = getPartnerName(renewal.partnerId).toLowerCase();
        const productName = getProductName(renewal.productId).toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        if (!customerDomain.includes(searchLower) && 
            !partnerName.includes(searchLower) && 
            !productName.includes(searchLower)) {
          return false;
        }
      }
      
      // Custom Date Range filter on renewalDate
      if (dateRange?.from) {
        const renewalDate = new Date(renewal.renewalDate);
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
        toDate.setHours(23, 59, 59, 999);
        if (!(renewalDate >= dateRange.from && renewalDate <= toDate)) {
          return false;
        }
      }
      return true;
    });
  }, [renewals, statusFilter, partnerFilter, productFilter, dateFilter, searchTerm, grdMonthFilter, srdMonthFilter, dateRange]);
  
  const groupedAndFilteredRenewals = useMemo(() => {
    const grouped: { [customerId: string]: Renewal[] } = {};
    filteredRenewals.forEach(renewal => {
      if (!grouped[renewal.customerId]) {
        grouped[renewal.customerId] = [];
      }
      grouped[renewal.customerId].push(renewal);
    });
    return Object.values(grouped);
  }, [filteredRenewals]);

  // Pagination logic
  const totalPages = Math.ceil(groupedAndFilteredRenewals.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = groupedAndFilteredRenewals.slice(indexOfFirstRecord, indexOfLastRecord);

  const getFirstAssignedEmployee = (partnerId: string) => {
    if (!partnerId) return undefined;
    const assignedEmployees = getAssignedEmployees(partnerId);
    return assignedEmployees.length > 0 ? assignedEmployees[0] : undefined;
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

  const getDaysUntilRenewal = (renewalDate: Date) => {
    const today = new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
    return `${diffInDays}d ago`;
  };

  const fetchComments = async (renewalId: string) => {
    try {
      const { data, error } = await supabase
        .from('renewal_comments')
        .select('*')
        .eq('renewal_id', renewalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRenewalComments(data.map(c => ({ ...c, created_at: new Date(c.created_at) })));
    } catch (error: any) {
      toast({ title: "Error fetching comments", description: error.message, variant: "destructive" });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !expandedRenewalId) return;

    setIsSubmittingComment(true);
    try {
      const creatorName = (profile?.first_name || profile?.last_name) 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : user.email;

      const { data, error } = await supabase
        .from('renewal_comments')
        .insert({
          renewal_id: expandedRenewalId,
          comment: newComment,
          created_by_id: user.id,
          created_by_name: creatorName,
        })
        .select();

      if (error) throw error;

      setRenewalComments(prev => [ { ...data[0], created_at: new Date(data[0].created_at) }, ...prev]);
      setNewComment('');
      toast({ title: "Comment added successfully" });
    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleComments = (renewalId: string) => {
    const newExpandedId = expandedRenewalId === renewalId ? null : renewalId;
    setExpandedRenewalId(newExpandedId);
    if (newExpandedId) {
      fetchComments(newExpandedId);
    } else {
      setRenewalComments([]);
      setNewComment('');
    }
  };

  const handleOpenSuspendDialog = (renewal: Renewal) => {
    setRenewalToSuspend(renewal);
    setIsSuspendDialogOpen(true);
    setSuspensionReason('');
  };

  const handleSuspendRenewal = async () => {
    if (!renewalToSuspend || !suspensionReason.trim() || !user) {
      toast({
        title: 'Error',
        description: 'Missing information to suspend renewal.',
        variant: 'destructive',
      });
      return;
    }

    setIsSuspending(true);
    try {
      // 1. Insert into renewal_suspensions table
      const { error: suspensionError } = await supabase
        .from('renewal_suspensions')
        .insert({
          renewal_id: renewalToSuspend.id,
          reason: suspensionReason,
          suspended_by: user.id,
        });

      if (suspensionError) throw suspensionError;

      // 2. TODO: Update renewal status in the 'renewals' table to 'suspended'
      // This part is commented out as the update logic for renewals table is not in this component.
      // You would call a prop like `onRenewalUpdate(renewalToSuspend.id, { status: 'suspended' })`

      toast({ title: "Renewal Suspended", description: "The renewal has been marked as suspended." });
      setIsSuspendDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error Suspending Renewal", description: error.message, variant: "destructive" });
    } finally {
      setIsSuspending(false);
    }
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

  const handleCustomerClick = (customerRenewals: Renewal[]) => {
    const firstRenewal = customerRenewals[0];
    const customer = customers.find(c => c.id === firstRenewal.customerId);
    const partner = partners.find(p => p.id === firstRenewal.partnerId);
    setSelectedCustomer(customer || null);
    setSelectedPartner(partner || null);
    setSelectedRenewalsForCustomer(customerRenewals);
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
    const dataToExport = selectedRenewalObjects.map(renewal => {
      const customer = getCustomer(renewal.customerId);
      const daysLeft = getDaysUntilRenewal(renewal.renewalDate);

      return {
        'Customer': getCustomerDomain(renewal.customerId),
        'Partner': getPartnerName(renewal.partnerId),
        'Product': getProductName(renewal.productId),
        'Renewal Date': renewal.renewalDate.toLocaleDateString(),
        'Days Left': daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : 
                     daysLeft === 0 ? 'Due today' : 
                     `${daysLeft} days`,
        'Contract Value': renewal.contractValue,
        'Status': renewal.status,
        'Last Contact': renewal.lastContactDate ? renewal.lastContactDate.toLocaleDateString() : 'No contact',
        'Customer Email': customer?.email,
        'Customer Phone': customer?.phone,
        'Assigned Employee': getFirstAssignedEmployee(renewal.partnerId)?.name || 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Renewals");
    XLSX.writeFile(workbook, "selected_renewals.xlsx");
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPartnerFilter('all');
    setProductFilter('all');
    setDateFilter('all');
    setGrdMonthFilter('all');
    setSrdMonthFilter('all');
    setSearchTerm('');
    setPresetDateRange('all');
  };

  const handleExportAll = () => {
    const dataToExport = filteredRenewals.map(renewal => {
      const customer = getCustomer(renewal.customerId);
      const daysLeft = getDaysUntilRenewal(renewal.renewalDate);

      return {
        'Customer': getCustomerDomain(renewal.customerId),
        'Partner': getPartnerName(renewal.partnerId),
        'Product': getProductName(renewal.productId),
        'Renewal Date': renewal.renewalDate.toLocaleDateString(),
        'Days Left': daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : 
                     daysLeft === 0 ? 'Due today' : 
                     `${daysLeft} days`,
        'Contract Value': renewal.contractValue,
        'Status': renewal.status,
        'Last Contact': renewal.lastContactDate ? renewal.lastContactDate.toLocaleDateString() : 'No contact',
        'Customer Email': customer?.email,
        'Customer Phone': customer?.phone,
        'Assigned Employee': getFirstAssignedEmployee(renewal.partnerId)?.name || 'N/A'
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Renewals");
    XLSX.writeFile(workbook, "filtered_renewals.xlsx");
  };
  const totalValue = filteredRenewals.reduce((sum, renewal) => sum + renewal.contractValue, 0);
  const urgentRenewals = renewals.filter(r => r.status === 'due' || r.status === 'overdue').length;

  const paginationControls = (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        Showing <strong>{groupedAndFilteredRenewals.length > 0 ? indexOfFirstRecord + 1 : 0}</strong> to <strong>{Math.min(indexOfLastRecord, groupedAndFilteredRenewals.length)}</strong> of <strong>{groupedAndFilteredRenewals.length}</strong> customers.
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Loading renewal data...</p>
        <Progress value={progress} className="w-1/2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2" title="Total Renewals">
              <div>
                <p className="text-sm text-muted-foreground">Total Renewals</p>
                <p className="text-2xl font-bold">{renewals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2" title="Urgent Renewals (Due or Overdue)">
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
            <div className="flex items-center gap-2" title="Renewed Contracts">
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
            <div className="flex items-center gap-2" title="Total Value of Filtered Renewals">
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
                <div className="relative">
                  <Input
                    placeholder="Search customers, partners, products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pr-8"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchTerm('')}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
                <Button variant="outline" className="gap-2" onClick={handleExportAll}>
                  <Download size={16} />
                  Export All
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setIsCreateTaskDialogOpen(true)}>
                  <Plus size={16} />
                  Create Task
                </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
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
                        <SelectItem value="suspended">Suspended</SelectItem>
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

                  <div>
                    <label className="text-sm font-medium mb-2 block">GRD Month</label>
                    <Select value={grdMonthFilter} onValueChange={setGrdMonthFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All GRD Months" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All GRD Months</SelectItem>
                        {availableGrdMonths.map((month) => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">SRD Month</label>
                    <Select value={srdMonthFilter} onValueChange={setSrdMonthFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All SRD Months" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All SRD Months</SelectItem>
                        {availableSrdMonths.map((month) => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-full flex flex-wrap items-end gap-4 pt-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Renewal Date Range</label>
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
                        {presetDateRange === 'custom' && (
                          <div className="flex items-center space-x-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-[200px] justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange?.from ? format(dateRange.from, "LLL dd, y") : <span>Start date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={dateRange?.from}
                                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                  disabled={{ after: dateRange?.to }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <span className="text-muted-foreground">-</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-[200px] justify-start text-left font-normal", !dateRange?.to && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange?.to ? format(dateRange.to, "LLL dd, y") : <span>End date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={dateRange?.to}
                                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                  disabled={{ before: dateRange?.from }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="gap-2"
                    >
                      <RotateCcw size={16} />
                      Reset All
                    </Button>
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
          {paginationControls}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRenewals.length === filteredRenewals.length && filteredRenewals.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Customer Domain</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Next Renewal Date</TableHead>
                <TableHead>Days Until Next</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Overall Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((customerRenewals) => {
                const firstRenewal = customerRenewals[0];
                const customer = getCustomer(firstRenewal.customerId);
                const partner = getPartner(firstRenewal.partnerId);
                const assignedEmployee = getFirstAssignedEmployee(firstRenewal.partnerId);
                const isSelected = customerRenewals.every(r => selectedRenewals.includes(r.id));

                const nextRenewalDate = new Date(Math.min(...customerRenewals.map(r => r.renewalDate.getTime())));
                const daysLeft = getDaysUntilRenewal(nextRenewalDate);
                const totalContractValue = customerRenewals.reduce((sum, r) => sum + r.contractValue, 0);
                const statuses = customerRenewals.map(r => r.status.toLowerCase());
                let overallStatus = 'upcoming';
                if (statuses.includes('overdue')) overallStatus = 'overdue';
                else if (statuses.includes('due')) overallStatus = 'due';
                else if (statuses.every(s => s === 'renewed')) overallStatus = 'renewed';
                else if (statuses.every(s => s === 'cancelled')) overallStatus = 'cancelled';
                else if (statuses.every(s => s === 'suspended')) overallStatus = 'suspended';
                
                return (
                  <TableRow key={firstRenewal.customerId} className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const renewalIds = customerRenewals.map(r => r.id);
                          if (checked) {
                            setSelectedRenewals(prev => [...prev, ...renewalIds.filter(id => !prev.includes(id))]);
                          } else {
                            setSelectedRenewals(prev => prev.filter(id => !renewalIds.includes(id)));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-left"
                        onClick={() => handleCustomerClick(customerRenewals)}
                      >
                        {customer?.domainName || getCustomerDomain(firstRenewal.customerId)}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customerRenewals.length} Product(s)</Badge>
                    </TableCell>
                    <TableCell>{getPartnerName(firstRenewal.partnerId)}</TableCell>
                    <TableCell>{nextRenewalDate.toLocaleDateString()}</TableCell>
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
                    <TableCell>₹{totalContractValue.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(overallStatus)}
                        <Badge className={getStatusColor(overallStatus)}>
                          {overallStatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {firstRenewal.lastContactDate ? 
                        firstRenewal.lastContactDate.toLocaleDateString() : 
                        'No contact'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {customer && partner && (
                          <RenewalEmailDialog
                            renewal={firstRenewal} // Still might need a primary renewal for context
                            customer={customer}
                            partner={partner}
                            products={products}
                            assignedEmployee={assignedEmployee}
                          >
                            <Button variant="outline" size="sm" className="gap-1" title='Mail'>
                              <Mail size={14} />
                              
                            </Button>
                          </RenewalEmailDialog>
                        )}
                        {profile?.role === 'admin' && (
                          <Button variant="destructive" size="sm" className="gap-1" onClick={() => handleOpenSuspendDialog(firstRenewal)}>
                            {/* Using AlertTriangle as a stand-in for a suspend/pause icon */}
                            <AlertTriangle size={14} />
                            Suspend
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRenewals.map((renewal) => (
                expandedRenewalId === renewal.id && (
                  <TableRow key={`${renewal.id}-comments`} className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={10} className="p-0">
                      <div className="p-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <MessageSquare size={18} />
                              Renewal Comments for {getCustomerDomain(renewal.customerId)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Comment History (Left Side) */}
                              <div className="md:col-span-2 space-y-3 max-h-72 overflow-y-auto pr-4 border-r">
                                {renewalComments.length > 0 ? renewalComments.map(comment => (
                                  <div key={comment.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="font-medium">{comment.created_by_name || 'User'}</span>
                                      <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-muted-foreground">{comment.comment}</p>
                                  </div>
                                )) : (
                                  <div className="flex items-center justify-center h-full text-muted-foreground">No comments yet.</div>
                                )}
                              </div>
                              {/* Add Comment (Right Side) */}
                              <div className="space-y-3">
                                <Label htmlFor="new-comment">Add a comment</Label>
                                <Textarea id="new-comment" placeholder="Type your comment here..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={4} />
                                <Button onClick={handleAddComment} disabled={isSubmittingComment || !newComment.trim()} className="w-full">
                                  <Send size={16} className="mr-2" />
                                  Post Comment
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ))}
            </TableBody>
          </Table>
          {paginationControls}
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
        renewals={selectedRenewalsForCustomer}
        partner={selectedPartner}
        products={products}
        users={users}
        open={customerDetailOpen}
        onOpenChange={setCustomerDetailOpen}
      />

      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Renewal</DialogTitle>
            <DialogDescription>
              Provide a reason for suspending the renewal for {renewalToSuspend && getCustomerDomain(renewalToSuspend.customerId)}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="suspension-reason">Reason for Suspension</Label>
            <Textarea
              id="suspension-reason"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="e.g., Customer requested to postpone, budget constraints..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspendRenewal} disabled={isSuspending || !suspensionReason.trim()}>
              {isSuspending ? 'Suspending...' : 'Confirm Suspension'}
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
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task and associate it with a partner or customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  <SelectTrigger id="task-priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
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
                  <SelectTrigger id="task-type"><SelectValue placeholder="Select type" /></SelectTrigger>
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
                <Label htmlFor="task-partner">Partner</Label>
                <Select value={newTask.partnerId} onValueChange={(value) => setNewTask({ ...newTask, partnerId: value })}>
                  <SelectTrigger id="task-partner"><SelectValue placeholder="Select partner (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Partner</SelectItem>
                    {partners.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-customer">Customer</Label>
                <Select value={newTask.customerId} onValueChange={(value) => setNewTask({ ...newTask, customerId: value })}>
                  <SelectTrigger id="task-customer"><SelectValue placeholder="Select customer (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Customer</SelectItem>
                    {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.domainName}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-assignedTo">Assign To *</Label>
                <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}>
                  <SelectTrigger id="task-assignedTo"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-dueDate">Due Date</Label>
                <Input id="task-dueDate" type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
              </div>
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
export default Renewals;
/*

const RenewalTableRow = ({ renewal, isSelected, onSelect, onCustomerClick, onToggleComments, isExpanded }: any) => {
  const { getCustomerName, getPartnerName, getProductName, getDaysUntilRenewal, getStatusIcon, getStatusColor, getCustomer, getPartner, getFirstAssignedEmployee } = useRenewalRowData();
  
  const daysLeft = getDaysUntilRenewal(renewal.renewalDate);
  const customer = getCustomer(renewal.customerId);
  const partner = getPartner(renewal.partnerId);
  const assignedEmployee = getFirstAssignedEmployee(renewal.partnerId);

  return (
    <TableRow className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''} ${isExpanded ? 'bg-primary/10' : ''}`}>
      <TableCell><Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(renewal.id, checked as boolean)} /></TableCell>
      <TableCell className="font-medium"><Button variant="link" className="p-0 h-auto font-medium text-left" onClick={() => onCustomerClick(renewal)}>{getCustomerName(renewal.customerId)}</Button></TableCell>
      <TableCell>{getPartnerName(renewal.partnerId)}</TableCell>
      <TableCell>{getProductName(renewal.productId)}</TableCell>
      <TableCell>{renewal.renewalDate.toLocaleDateString()}</TableCell>
      <TableCell>
        <span className={`font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
          {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} days`}
        </span>
      </TableCell>
      <TableCell>₹{renewal.contractValue.toLocaleString('en-IN')}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {getStatusIcon(renewal.status)}
          <Badge className={getStatusColor(renewal.status)}>{renewal.status}</Badge>
        </div>
      </TableCell>
      <TableCell>{renewal.lastContactDate ? renewal.lastContactDate.toLocaleDateString() : 'No contact'}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => onToggleComments(renewal.id)}><MessageSquare size={14} /> Comments</Button>
          {customer && partner && (
            <RenewalEmailDialog renewal={renewal} customer={customer} partner={partner} assignedEmployee={assignedEmployee}>
              <Button variant="outline" size="sm" className="gap-1"><Mail size={14} /> Email</Button>
            </RenewalEmailDialog>
          )}
          <Button variant="outline" size="sm" className="gap-1" onClick={() => onCustomerClick(renewal)}><Eye size={14} /> View</Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const useRenewalRowData = () => {
  // This is a placeholder. In a real app, you'd lift the functions from Renewals component
  // or pass them down via context to avoid prop drilling if this component was in a separate file.
  // For this example, we'll assume the functions are available.
  // The main logic is now inside the Renewals component directly.
  return {} as any;
}*/
