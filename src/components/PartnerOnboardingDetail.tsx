import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, User, Building, Mail, Phone, PlusCircle, CheckCircle, Clock, AlertCircle, Check, X, FileText, ExternalLink, Loader2, XCircle, Eye, Upload, Star, CreditCard, MapPin, Tag, Link as LinkIcon, Award, Users as UsersIcon, Plus } from 'lucide-react';
import { Partner, User as UserType, Customer, Task, PartnerNote } from '@/types';
import PartnerOnboardingStageTimeline from './PartnerOnboardingStageTimeline';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast'; 
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS } from '@/config/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PartnerDomainsDialog } from './PartnerDomainsDialog';
import { useTaskManager } from '@/hooks/useTaskManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { PartnerComment } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type VerificationStatus = 'pending' | 'accepted' | 'rejected';

interface KycVerificationState {
  pan_number: VerificationStatus;
  gst_number: VerificationStatus;
  tan_number: VerificationStatus;
  panCardurl: VerificationStatus;
  gstcertificateurl: VerificationStatus;
  cancelChequeurl: VerificationStatus;
}

interface PartnerOnboardingDetailProps {
  partner: Partner;
  users: UserType[];
  onBack: () => void;
  onNavigateToTasks?: (partnerId?: string) => void;
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'outreach': return 'bg-blue-100 text-blue-800';
    case 'product-overview': return 'bg-purple-100 text-purple-800';
    case 'partner-program': return 'bg-green-100 text-green-800';
    case 'portal-activation': return 'bg-cyan-100 text-cyan-800';
    case 'kyc': return 'bg-yellow-100 text-yellow-800';
    case 'agreement': return 'bg-orange-100 text-orange-800';
    case 'onboarded': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-800';
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
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
};

const getKycStatusColor = (status: string) => {
  switch (status) {
    case 'Approved': return 'bg-green-100 text-green-800';
    case 'Pending': return 'bg-orange-100 text-orange-800';
    case 'Rejected':
    case 'Permanently Rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getIdentityLabel = (identity: string) => {
  const labels: { [key: string]: string } = {
    'web-app-developer': 'Web App Developer',
    'system-integrator': 'System Integrator',
    'managed-service-provider': 'Managed Service Provider',
    'digital-marketer': 'Digital Marketer',
    'cyber-security': 'Cyber Security',
    'cloud-hosting': 'Cloud Hosting',
    'web-hosting': 'Web Hosting',
    'hardware': 'Hardware',
    'cloud-service-provider': 'Cloud Service Provider',
    'microsoft-partner': 'Microsoft Partner',
    'aws-partner': 'AWS Partner',
    'it-consulting': 'IT Consulting',
    'freelance': 'Freelance',
  };
  return labels[identity] || identity;
};

const getPartnerTagLabel = (tagId: string) => {
  const labels: { [key: string]: string } = {
    'asirt': 'ASIRT', 'isoda': 'ISODA', 'iamcp': 'IAMCP', 'bni': 'BNI',
    'microsoft-direct-reseller': 'Microsoft Direct reseller',
    'google-direct-reseller': 'Google Direct reseller',
    'demanding': 'Demanding', 'badwords': 'Badwords', 'smb': 'SMB',
    'mid-market': 'Mid-market', 'enterprise': 'Enterprise',
    'gov-business': 'GOV Business', 'office-in-usa': 'Office in USA',
    'office-in-europe': 'Office in Europe', 'office-in-aus': 'Office in AUS',
    'office-in-south-asia': 'Office in South Asia',
    'office-in-africa': 'Office in Africa', 'office-in-dubai': 'Office in Dubai',
  };
  return labels[tagId] || tagId;
};

const getSourceOfPartnerLabel = (sourceId?: string) => {
  if (!sourceId) return 'Not Set';
  const labels: { [key: string]: string } = {
    'webinar': 'Webinar', 'event': 'Event', 'referral': 'Referral', 'inbound': 'Inbound', 'outbound': 'Outbound',
    'whatsapp-campaign': 'Whatsapp Campaign', 'email-campaign': 'Email Campaign', 'shivaami': 'Shivaami', 'axima': 'Axima', 'management': 'Management',
  };
  return labels[sourceId] || sourceId;
};

const PartnerOnboardingDetail = ({ partner, users, onBack, onNavigateToTasks }: PartnerOnboardingDetailProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { tasks, loading: tasksLoading } = useTaskManager();
  const [partnerTasks, setPartnerTasks] = useState<Task[]>([]);
  const [partnerCustomers, setPartnerCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [kycDetails, setKycDetails] = useState<any | null>(null);
  const [isKycLoading, setIsKycLoading] = useState(true);
  const [kycVerification, setKycVerification] = useState<KycVerificationState>({
    pan_number: 'pending',
    gst_number: 'pending',
    tan_number: 'pending',
    panCardurl: 'pending',
    gstcertificateurl: 'pending',
    cancelChequeurl: 'pending',
  });
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionType, setRejectionType] = useState<'reject' | 'permanently-reject' | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [docViewerUrl, setDocViewerUrl] = useState<string | null>(null);
  const [docViewerTitle, setDocViewerTitle] = useState('');
  const [notes, setNotes] = useState<PartnerNote[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [comments, setComments] = useState<PartnerComment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUploading, setIsUploading] = useState<'agreement' | 'kyc' | null>(null);
  const [partnerState, setPartnerState] = useState<Partner>(partner);
  const [isKycDetailModalOpen, setIsKycDetailModalOpen] = useState(false);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const agreementFileRef = useRef<HTMLInputElement>(null);
  const kycFileRef = useRef<HTMLInputElement>(null);
  const [documentUrls, setDocumentUrls] = useState<{ resellerAgreement: string; kycSignedForm: string; }>({
    resellerAgreement: '',
    kycSignedForm: '',
  });
  const [isDocsLoading, setIsDocsLoading] = useState(true);
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
  const customersPerPage = 10;
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isMapCustomerModalOpen, setIsMapCustomerModalOpen] = useState(false);
  const [selectedCustomerForMapping, setSelectedCustomerForMapping] = useState<Customer | null>(null);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [selectedPartnerForMapping, setSelectedPartnerForMapping] = useState('');
  const [isMappingCustomer, setIsMappingCustomer] = useState(false);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');


  // State for Create Task
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

    try {
      const { error } = await supabase.from('tasks').insert(taskToInsert_insupabase);

      if (error) throw error;

      toast({
        title: 'Task Created',
        description: 'The new task has been added successfully.',
      });
      setIsCreateTaskDialogOpen(false);
      resetNewTaskForm();
      
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

  const handleMarkTaskComplete = async (task: Task) => {
    if (task.status === 'completed' || task.status === 'cancelled') return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', task.id);

      if (error) throw error;

      // Update local state to reflect the change immediately
      setPartnerTasks(prevTasks =>
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

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
      console.error("User ID not available for logging CRM action.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('userid', user.id);
      formData.append('actiontype', actiontype);
      formData.append('path', 'Partner Onboarding Detail');
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


  // Generate mock onboarding data based on the 6-stage system
  const mockOnboardingData = {
    currentStage: 'kyc' as const,
    overallProgress: 65,
    startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    expectedCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    stages: {
      'outreach': {
        stage: 'outreach' as const,
        status: 'completed' as const,
        startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        assignedTo: 'John Doe',
        tasks: [
          { id: '1', title: 'Initial contact made', completed: true, required: true },
          { id: '2', title: 'Lead qualification completed', completed: true, required: true },
          { id: '3', title: 'Discovery call scheduled', completed: true, required: false }
        ]
      },
      'product-overview': {
        stage: 'product-overview' as const,
        status: 'completed' as const,
        startedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        assignedTo: 'Jane Smith',
        tasks: [
          { id: '4', title: 'Product demo conducted', completed: true, required: true },
          { id: '5', title: 'Feature walkthrough completed', completed: true, required: true },
          { id: '6', title: 'Use case discussion', completed: true, required: false }
        ]
      },
      'partner-program': {
        stage: 'partner-program' as const,
        status: 'completed' as const,
        startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        assignedTo: 'Mike Johnson',
        tasks: [
          { id: '7', title: 'Program benefits explained', completed: true, required: true },
          { id: '8', title: 'Requirements reviewed', completed: true, required: true },
          { id: '9', title: 'Partner tier determined', completed: true, required: true }
        ]
      },
      'portal-activation': {
        stage: 'portal-activation' as const,
        status: 'completed' as const,
        startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        assignedTo: 'Admin Team',
        tasks: [
          { id: 'pa1', title: 'Create portal account', completed: true, required: true },
          { id: 'pa2', title: 'Send login credentials', completed: true, required: true },
          { id: 'pa3', title: 'Initial login confirmed', completed: true, required: false }
        ]
      },
      'kyc': {
        stage: 'kyc' as const,
        status: 'in-progress' as const,
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        assignedTo: 'Sarah Wilson',
        tasks: [
          { id: '10', title: 'Business license verification', completed: true, required: true },
          { id: '11', title: 'Tax documentation submitted', completed: true, required: true },
          { id: '12', title: 'Reference checks', completed: false, required: true },
          { id: '13', title: 'Compliance review', completed: false, required: true }
        ]
      },
      'agreement': {
        stage: 'agreement' as const,
        status: 'pending' as const,
        assignedTo: 'Legal Team',
        tasks: [
          { id: '14', title: 'Contract template prepared', completed: false, required: true },
          { id: '15', title: 'Terms negotiation', completed: false, required: true },
          { id: '16', title: 'Digital signature', completed: false, required: true }
        ]
      },
      'onboarded': {
        stage: 'onboarded' as const,
        status: 'pending' as const,
        assignedTo: 'Onboarding Team',
        tasks: [
          { id: '17', title: 'System access setup', completed: false, required: true },
          { id: '18', title: 'Training completed', completed: false, required: true },
          { id: '19', title: 'First transaction', completed: false, required: false }
        ]
      }
    }
  };

  const onboardingData = partnerState.onboarding || mockOnboardingData;

  useEffect(() => {
    console.log("Partner details:", partner);
    if (partner.portal_reseller_id) {
      localStorage.setItem('portal_reseller_id', partner.portal_reseller_id);
    }
    if (partner.email) {
      localStorage.setItem('reseller_email', partner.email);
    }

    // Cleanup function on component unmount
    return () => {
      localStorage.removeItem('portal_reseller_id');
      localStorage.removeItem('reseller_email');
    };
  }, [partner.portal_reseller_id, partner.email]);

  useEffect(() => {
    if (tasks && partner) {
      const filtered = tasks.filter(task => task.partnerId === partner.id);
      setPartnerTasks(filtered);
    }
  }, [tasks, partner]);

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!partner.id) return;
      setIsNotesLoading(true);
      try {
        const { data, error } = await supabase
          .from('partner_notes')
          .select('*')
          .eq('portal_reseller_id', partner.portal_reseller_id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setNotes((data || []).map(n => ({ ...n, created_at: new Date(n.created_at) })) as unknown as PartnerNote[]);
      } catch (error: any) {
        toast({ title: "Error fetching notes", description: error.message, variant: "destructive" });
      } finally {
        setIsNotesLoading(false);
      }
    };

    const fetchPartnerComments = async () => {
      if (!partner.id) return;
      setIsCommentsLoading(true);
      try {
        const { data, error } = await supabase
          .from('partner_comments')
          .select('*')
          .eq('portal_reseller_id', partner.portal_reseller_id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setComments((data || []).map(c => ({ ...c, created_at: new Date(c.created_at) })) as unknown as PartnerComment[]);
      } catch (error: any) {
        toast({ title: "Error fetching comments", description: error.message, variant: "destructive" });
      } finally {
        setIsCommentsLoading(false);
      }
    };

    fetchPartnerData();
    fetchPartnerComments();
  }, [partner.id, partner.portal_reseller_id, toast]);

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


  const handleAddNote = async () => {
    if (!newNote.trim() || !user) {
      toast({ title: "Note cannot be empty", variant: "destructive" });
      return;
    }
    setIsSubmittingNote(true);
    try {
      const creatorName = (profile?.first_name || profile?.last_name) ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'User';
      const { error } = await supabase.from('partner_notes').insert({
        partner_id: partner.id,
        portal_reseller_id: partner.portal_reseller_id,
        note: newNote,
        creatername: creatorName,
        stage: onboardingData.currentStage,
        created_by: user.id,
        created_at_stage: onboardingData.currentStage,
      });

      if (error) throw error;

      toast({ title: "Note Added", description: "Your note has been saved." });

      const logDetails = `Added note for partner ${partner.name} (ID: ${partner.portal_reseller_id}). Note content: ${newNote}`;
      await logCrmAction("Add Partner Note", logDetails);
      setNewNote('');
      // Refetch notes
      const { data } = await supabase
        .from('partner_notes')
        .select('*')
        .eq('portal_reseller_id', partner.portal_reseller_id)
        .order('created_at', { ascending: false });
      setNotes(data?.map(n => ({ ...n, created_at: new Date(n.created_at) })) as unknown as PartnerNote[] || []);
    } catch (error: any) {
      toast({ title: "Error adding note", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) {
      toast({ title: "Comment cannot be empty", variant: "destructive" });
      return;
    }
    setIsSubmittingNote(true); // Reuse submitting state
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
      setComments(data?.map(c => ({ ...c, created_at: new Date(c.created_at) })) as unknown as PartnerComment[] || []);

    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingNote(false); // Reuse submitting state
    }
  };

  const handleFileUpload = async (file: File, stage: 'agreement' | 'kyc', docType: 'resellerAgreement' | 'kycSignedForm') => {
    const portalResellerId = localStorage.getItem('portal_reseller_id');
    const partnerEmailID = localStorage.getItem('reseller_email');
    if (!file || !portalResellerId) {
      toast({
        title: "Cannot Upload",
        description: "Partner information is missing. The partner must have a portal reseller ID and be selected.",
        variant: "destructive",
      });
      return;
    }

    const uploaderName = (profile?.first_name || profile?.last_name)
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : user?.email || 'Unknown User';

    setIsUploading(docType === 'resellerAgreement' ? 'agreement' : 'kyc');

    try {
      const formData = new FormData();
      formData.append('portal_reseller_id', portalResellerId);
      formData.append('doctype', docType);
      formData.append(docType, file, file.name); // Use docType as the key for the file
      formData.append('uploaded_by', uploaderName);
      formData.append('reseller_email', partnerEmailID );
      const response = await fetch(API_ENDPOINTS.UPLOAD_PARTNER_DOCUMENT_CRM, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || (result.success !== undefined && !result.success)) {
        throw new Error(result.message || 'File upload failed via API.');
      }

      // After successful upload, refetch the document URLs to update the view
      await fetchDocuments();

      const logDetails = `Uploaded ${docType} for partner ${partner.name} (ID: ${portalResellerId}).`;
      await logCrmAction("Upload Partner Document", logDetails);

      toast({
        title: "Upload Successful",
        description: `${docType === 'resellerAgreement' ? 'Reseller Agreement' : 'KYC Signed Form'} has been uploaded via CRM.`,
      });

      // Clear the file from state
      if (docType === 'resellerAgreement') {
        setAgreementFile(null);
        if (agreementFileRef.current) {
          agreementFileRef.current.value = '';
        }
      } else {
        setKycFile(null);
        if (kycFileRef.current) {
          kycFileRef.current.value = '';
        }
      }

    } catch (error: any) {
      const logDetails = `Failed to upload ${docType} for partner ${partner.name} (ID: ${portalResellerId}). Error: ${error.message}`;
      await logCrmAction("Upload Partner Document Fail", logDetails);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during file upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };

  useEffect(() => {
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

    fetchKycDetails();
    // Also fetch documents when partner context is available
    if (partner.portal_reseller_id) {
      fetchDocuments();
    }
  }, [partner.portal_reseller_id, toast]);

  useEffect(() => {
    const fetchPartnerCustomers = async () => {
      if (!partner.email) {
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
        console.log("result",result)
        if (!result.success || !result.data || !result.data.data_result) {
          throw new Error('Invalid API response structure');
        }

        const apiCustomers = result.data.data_result;
        console.log("asdasdas",apiCustomers)
        const mappedCustomers: Customer[] = apiCustomers.map((c: any) => ({
          id: c.cust_id,
          domainName: c.customer_domainname,
          name: c.customer_name || c.customer_domainname,
          email: c.customer_emailid || '',
          phone: c.customer_contact_number || '',
          company: c.customer_company_name || c.customer_domainname,
          status: 'active',
          process: 'won',
          partnerId: partner.id,
          createdAt: new Date(c.created_on),
          value: 0,
        }));
        setPartnerCustomers(mappedCustomers);
      } catch (error: any) {
        toast({ title: "Error fetching partner's customers", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchPartnerCustomers();
    setCustomerCurrentPage(1);
  }, [partner.email, toast]);

  useEffect(() => {
    setCustomerCurrentPage(1);
  }, [customerSearchTerm]);

  const openMapCustomerModal = async (customer: Customer) => {
    setSelectedCustomerForMapping(customer);
    setSelectedPartnerForMapping('');
    setPartnerSearchTerm('');
    setIsMapCustomerModalOpen(true);

    if (allPartners.length === 0) {
      setIsLoadingPartners(true);
      try {
        const { data: partnersData, error } = await supabase
          .from('partners')
          .select('id, portal_reseller_id, name, company, email');

        if (error) throw error;

        if (partnersData) {
          const mappedPartners: Partner[] = partnersData.map((p) => ({
            id: p.id,
            portal_reseller_id: p.portal_reseller_id,
            name: p.name,
            company: p.company || p.name,
            email: p.email,
            contact_number: '', status: 'active', onboarding_stage: '', created_at: '', // Dummy data for type compliance
          }));
          setAllPartners(mappedPartners);
        } else {
          throw new Error('Could not parse partners list');
        }
      } catch (error: any) {
        toast({ title: "Error fetching partners", description: error.message, variant: "destructive" });
        setIsMapCustomerModalOpen(false);
      } finally {
        setIsLoadingPartners(false);
      }
    }
  };

  const handleMapCustomer = async () => {
    if (!selectedCustomerForMapping || !selectedPartnerForMapping) {
      toast({ title: "Selection missing", description: "Please select a partner to map the customer to.", variant: "destructive" });
      return;
    }

    setIsMappingCustomer(true);
    try {
      const formData = new FormData();
      formData.append('cust_id', selectedCustomerForMapping.id);
      formData.append('portal_reseller_id', selectedPartnerForMapping);

      const response = await fetch(API_ENDPOINTS.MAP_SINGLE_CUSTOMER_TO_RESELLER_ONCRM, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to map customer.');
      }

      toast({ title: 'Customer Mapped', description: `${selectedCustomerForMapping.domainName} has been successfully mapped.` });

      // Remove the customer from the current partner's list as it has been re-mapped
      setPartnerCustomers(prev => prev.filter(c => c.id !== selectedCustomerForMapping.id));
      setIsMapCustomerModalOpen(false);
    } catch (error: any) {
      toast({ title: 'Error Mapping Customer', description: error.message, variant: 'destructive' });
    } finally {
      setIsMappingCustomer(false);
    }
  };

  const getTaskStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTaskPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const handleVerificationChange = (field: keyof KycVerificationState, status: VerificationStatus) => {
    setKycVerification(prev => ({ ...prev, [field]: status }));
  };

  const handleRejectClick = (type: 'reject' | 'permanently-reject') => {
    setRejectionType(type);
    setIsRejectDialogOpen(true);
  };

  const handleKycAction = async (status: 'Approved' | 'Rejected' | 'Permanently Rejected', reason: string = '') => {
    setIsSubmittingKyc(true);
    try {
      const payload = {
        buttonStatus: status,
        reason,
        pannumber: kycVerification.pan_number,
        panCard: kycVerification.panCardurl,
        gstnumber: kycVerification.gst_number,
        gstcertificate: kycVerification.gstcertificateurl,
        tannumber: kycVerification.tan_number,
        cancelCheque: kycVerification.cancelChequeurl,
        registration_id: kycDetails?.registration_id,
        reseller_id: partner.portal_reseller_id,
      };

      const response = await fetch(API_ENDPOINTS.VERIFY_KYC_DETAILS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to submit KYC status: ${status}`);
      }

      toast({ title: `KYC ${status}`, description: "The action has been recorded." });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setRejectionType(null);
      onBack();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while submitting KYC status.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectionReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    const status = rejectionType === 'reject' ? 'Rejected' : 'Permanently Rejected';
    await handleKycAction(status, rejectionReason);
  };

  const handleApprove = async () => {
    await handleKycAction('Approved');
  };

  const openDocViewer = (url: string, title: string) => {
    setDocViewerUrl(url);
    setDocViewerTitle(title);
    setIsDocViewerOpen(true);
  };

  const filteredCustomers = partnerCustomers.filter(customer =>
    customer.domainName.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const paginatedCustomers = filteredCustomers.slice(
    (customerCurrentPage - 1) * customersPerPage,
    customerCurrentPage * customersPerPage
  );
  const totalCustomerPages = Math.ceil(filteredCustomers.length / customersPerPage);


  const VerificationControls = ({ field }: { field: keyof KycVerificationState }) => (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant={kycVerification[field] === 'accepted' ? 'default' : 'outline'}
        className={cn("h-6 w-6", kycVerification[field] === 'accepted' && "bg-green-500 hover:bg-green-600")}
        onClick={() => handleVerificationChange(field, 'accepted')}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={kycVerification[field] === 'rejected' ? 'destructive' : 'outline'}
        className="h-6 w-6"
        onClick={() => handleVerificationChange(field, 'rejected')}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  const KycDetailRowSimple = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <span className="text-sm font-medium text-right">{value || <span className="text-muted-foreground">Not Provided</span>}</span>
    </div>
  );

  const KycDocumentRowSimple = ({ label, url }: { label: string, url?: string | null }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {url ? (
        <Button variant="link" className="p-0 h-auto text-sm font-medium" onClick={() => openDocViewer(url, label)}>
          <ExternalLink size={14} className="mr-1"/> View Document
        </Button>
      ) : (
        <span className="text-sm text-muted-foreground">
          Not Uploaded
        </span>
      )}
    </div>
  );

  const KycDetailRow = ({ label, value, verificationField }: { label: string, value?: string | null, verificationField?: keyof KycVerificationState }) => (
    <div className="flex justify-between items-center py-2 border-b">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-right">{value || <span className="text-muted-foreground">Not Provided</span>}</span>
        {verificationField && <VerificationControls field={verificationField} />}
      </div>
    </div>
  );

  const KycDocumentRow = ({ label, url, verificationField }: { label: string, url?: string | null, verificationField: keyof KycVerificationState }) => (
    <div className="flex justify-between items-center py-2 border-b">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-4">
        {url ? (
          <Button variant="link" className="p-0 h-auto text-sm font-medium" onClick={() => openDocViewer(url, label)}>
            <ExternalLink size={14} className="mr-1"/> View Document
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            Not Uploaded
          </span>
        )}
        <VerificationControls field={verificationField} />
      </div>
    </div>
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{partner.name} - Onboarding</h2>
            <p className="text-muted-foreground">Detailed onboarding progress and management</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateTaskDialogOpen(true)} className="gap-2" variant="outline">
          <Plus size={16} /> Create Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Partner Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{partner.company}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{partner.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{partner.contact_number}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Started: {onboardingData.startedAt.toLocaleDateString()}</span>
              </div>
              {onboardingData.expectedCompletionDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Expected: {onboardingData.expectedCompletionDate.toLocaleDateString()}</span>
                </div>
              )}
              <div className="pt-2">
                <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                  {partner.status}
                </Badge>
              </div>
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-start space-x-2">
                  <Star className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Specialization</p>
                    <p className="text-sm">{partner.specialization || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Terms</p>
                    <p className="text-sm">{partner.paymentTerms || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="text-sm">{getSourceOfPartnerLabel(partner.source_of_partner)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Partner Type</p>
                    <p className="text-sm capitalize">{partner.partner_type || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Identities</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {partner.identity?.map((id: string) => <Badge key={id} variant="secondary">{getIdentityLabel(id)}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Zones</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {partner.zone?.map((z: string) => <Badge key={z} variant="secondary" className="capitalize">{z}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1">{partner.partner_tag?.map((tag: string) => <Badge key={tag} variant="outline">{getPartnerTagLabel(tag)}</Badge>)}</div>
                </div>
              </div>
            </CardContent>
        </Card>

        {/* KYC Verification Card */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>KYC Verification</CardTitle>
              {kycDetails && kycDetails.registration_id && kycDetails.gst_number && (
                <Badge className={cn("mt-2", getKycStatusColor(kycDetails.kyc_status))}>
                  {kycDetails.kyc_status}
                </Badge>
              )}
            </div>
            {kycDetails && kycDetails.registration_id && kycDetails.gst_number && (
              <Button variant="outline" size="sm" onClick={() => {
                setIsKycDetailModalOpen(true);
                logCrmAction("View KYC Details", `Viewed complete KYC details for partner ${partner.name} (ID: ${partner.portal_reseller_id})`);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Complete Details
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isKycLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading KYC Details...</span>
              </div>
            ) : kycDetails?.kyc_status === 'Approved' ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p className="font-semibold">KYC Details Already Verified</p>
                <p className="text-sm text-muted-foreground">No further action is required for KYC.</p>
              </div>
            ) : kycDetails && kycDetails.registration_id && kycDetails.gst_number ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-md">Tax Information</h4>
                    <KycDetailRow label="PAN Number" value={kycDetails.pan_number} verificationField="pan_number" />
                    <KycDetailRow label="GST Number" value={kycDetails.gst_number} verificationField="gst_number" />
                    <KycDetailRow label="TAN Number" value={kycDetails.tan_number} verificationField="tan_number" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-md">Bank Details</h4>
                    <KycDetailRow label="Account Holder" value={kycDetails.account_holder_name} />
                    <KycDetailRow label="Bank Name" value={kycDetails.bank_name} />
                    <KycDetailRow label="Account Number" value={kycDetails.acc_number} />
                    <KycDetailRow label="IFSC Code" value={kycDetails.ifsc_code} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-md">Uploaded Documents</h4>
                    <KycDocumentRow label="PAN Card" url={kycDetails.documents?.find((d: any) => d.panCard)?.panCard} verificationField="panCardurl" />
                    <KycDocumentRow label="GST Certificate" url={kycDetails.documents?.find((d: any) => d.gstcertificate)?.gstcertificate} verificationField="gstcertificateurl" />
                    <KycDocumentRow label="Cancelled Cheque" url={kycDetails.documents?.find((d: any) => d.cancelCheque)?.cancelCheque} verificationField="cancelChequeurl" />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="default" onClick={handleApprove} className="bg-green-600 hover:bg-green-700" disabled={isSubmittingKyc}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleRejectClick('reject')} disabled={isSubmittingKyc}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button variant="destructive" className="bg-red-800 hover:bg-red-900" onClick={() => handleRejectClick('permanently-reject')} disabled={isSubmittingKyc}>
                      <XCircle className="mr-2 h-4 w-4" /> Permanently Reject
                    </Button>
                  </div>
                </div>
              ) : (
              <div className="text-center py-10 text-muted-foreground">
                KYC details not provided by the partner.
              </div>
            )}
          </CardContent>
        </Card>

        
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs
            defaultValue="timeline"
            className="space-y-4"
            onValueChange={(value) => {
              if (value === 'comments') {
                logCrmAction("View Partner Comments", `Viewed comments for partner ${partner.name} (ID: ${partner.portal_reseller_id})`);
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              {/* <TabsTrigger value="tasks">Tasks</TabsTrigger> */}
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-6">
              <PartnerOnboardingStageTimeline
                stages={onboardingData.stages}
                currentStage={onboardingData.currentStage}
                stageOwnerId={partnerState.stage_owner}
                users={users}
              />

              {/* Related Tasks */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Related Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            ) : partnerTasks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{getUserName(task.assigned_to)}</TableCell>
                      <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell><Badge className={cn("capitalize", getTaskPriorityColor(task.priority))}>{task.priority}</Badge></TableCell>
                      <TableCell><Badge className={cn("capitalize", getTaskStatusColor(task.status))}>{task.status}</Badge></TableCell>
                      <TableCell>
                          {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkTaskComplete(task)}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Mark as Complete</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No tasks found for this partner.</p>
                {/* <Button onClick={() => onNavigateToTasks?.(partner.id)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Task
                </Button> */}
              </div>
            )}
          </CardContent>
          </Card>

              {/* Partner's Customers */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Partner's Customers</CardTitle>
                    {partnerCustomers.length > 0 && (
                      <div className="relative max-w-xs">
                        <Input
                          placeholder="Search by domain..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          className="pr-8"
                        />
                        {customerSearchTerm && (
                          <X
                            className="absolute top-1/2 right-2 h-5 w-5 -translate-y-1/2 cursor-pointer text-muted-foreground"
                            onClick={() => setCustomerSearchTerm('')}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingCustomers ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading Customers...</span>
                    </div>
                  ) : partnerCustomers.length > 0 ? (
                    filteredCustomers.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Domain</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCustomers.map((customer) => (
                            <TableRow
                              key={customer.id}
                              onClick={() => openMapCustomerModal(customer)}
                              className="cursor-pointer hover:bg-muted/50"
                            >
                              <TableCell className="font-medium">{customer.name}</TableCell>
                              <TableCell>{customer.domainName}</TableCell>
                              <TableCell>{customer.email}</TableCell>
                              <TableCell>{customer.phone}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {totalCustomerPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 pt-4">
                          <span className="text-sm text-muted-foreground">
                            Page {customerCurrentPage} of {totalCustomerPages}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => setCustomerCurrentPage(p => p - 1)} disabled={customerCurrentPage === 1}>
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setCustomerCurrentPage(p => p + 1)} disabled={customerCurrentPage >= totalCustomerPages}>
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No customers found matching your search.</p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No customers found for this partner.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>All Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.values(onboardingData.stages).flatMap(stage => 
                      stage.tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <input 
                              type="checkbox" 
                              checked={task.completed}
                              readOnly
                              className="rounded"
                            />
                            <div>
                              <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-sm text-muted-foreground">{task.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {task.required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                            <Badge variant="secondary">{onboardingData.stages[Object.keys(onboardingData.stages).find(key => onboardingData.stages[key as keyof typeof onboardingData.stages].tasks.includes(task))! as keyof typeof onboardingData.stages].stage}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage and upload required documents for the onboarding process.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isDocsLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading Documents...</span>
                    </div>
                  ) : (
                    <>
                      {/* Reseller Agreement */}
                      <div className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">Reseller Agreement</h4>
                            <p className="text-sm text-muted-foreground">The signed partnership agreement.</p>
                          </div>
                          <Badge variant={documentUrls.resellerAgreement ? 'default' : 'secondary'}>{documentUrls.resellerAgreement ? 'Uploaded' : 'Not Uploaded'}</Badge>
                        </div>
                        <div className="mt-4">
                          {documentUrls.resellerAgreement ? (
                            <Button variant="outline" size="sm" onClick={() => openDocViewer(documentUrls.resellerAgreement, 'Reseller Agreement')}>
                              <Eye className="mr-2 h-4 w-4" /> View Agreement
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input ref={agreementFileRef} type="file" className="max-w-xs" onChange={(e) => setAgreementFile(e.target.files ? e.target.files[0] : null)} />
                              <Button
                                size="sm"
                                onClick={() => agreementFile && handleFileUpload(agreementFile, 'agreement', 'resellerAgreement')}
                                disabled={!agreementFile || isUploading === 'agreement'}
                              >
                                {isUploading === 'agreement' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* KYC Signed Form */}
                      <div className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">KYC Signed Form</h4>
                            <p className="text-sm text-muted-foreground">The final signed KYC verification form.</p>
                          </div>
                          <Badge variant={documentUrls.kycSignedForm ? 'default' : 'secondary'}>{documentUrls.kycSignedForm ? 'Uploaded' : 'Not Uploaded'}</Badge>
                        </div>
                        <div className="mt-4">
                          {documentUrls.kycSignedForm ? (
                            <Button variant="outline" size="sm" onClick={() => openDocViewer(documentUrls.kycSignedForm, 'KYC Signed Form')}>
                              <Eye className="mr-2 h-4 w-4" /> View KYC Form
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input ref={kycFileRef} type="file" className="max-w-xs" onChange={(e) => setKycFile(e.target.files ? e.target.files[0] : null)} />
                              <Button
                                size="sm"
                                onClick={() => kycFile && handleFileUpload(kycFile, 'kyc', 'kycSignedForm')}
                                disabled={!kycFile || isUploading === 'kyc'}
                              >
                                {isUploading === 'kyc' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes &amp; Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-note">Add a new note</Label>
                    <Textarea
                      id="new-note"
                      placeholder="Add a note about this partner's onboarding..."
                      rows={4}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      disabled={isSubmittingNote}
                    />
                  </div>
                  <Button onClick={handleAddNote} disabled={isSubmittingNote || !newNote.trim()}>
                    {isSubmittingNote ? 'Adding Note...' : 'Add Note'}
                  </Button>
                  
                  <div className="space-y-3 mt-6 max-h-96 overflow-y-auto pr-2">
                    {isNotesLoading ? (
                      <p className="text-muted-foreground">Loading notes...</p>
                    ) : notes.length > 0 ? (
                      notes.map(note => (
                        <div key={note.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{note.creatername || 'User'}</span>
                              {note.stage && (
                                <Badge className={cn("text-xs capitalize border-none", getStageColor(note.stage))}>
                                  {note.stage.replace('-', ' ')}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(note.created_at)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No notes yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-comment">Add a new comment</Label>
                    <Textarea
                      id="new-comment"
                      placeholder="Add a general comment about this partner..."
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={isSubmittingNote}
                    />
                  </div>
                  <Button onClick={handleAddComment} disabled={isSubmittingNote || !newComment.trim()}>
                    {isSubmittingNote ? 'Adding Comment...' : 'Add Comment'}
                  </Button>
                  
                  <div className="space-y-3 mt-6 max-h-96 overflow-y-auto pr-2">
                    {isCommentsLoading ? (
                      <p className="text-muted-foreground">Loading comments...</p>
                    ) : comments.length > 0 ? (
                      comments.map(comment => (
                        <div key={comment.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{comment.created_by_name || 'User'}</span>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No comments yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for {rejectionType === 'reject' ? 'rejecting' : 'permanently rejecting'} this partner's KYC.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="sr-only">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., PAN card is not legible, GST number mismatch..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isSubmittingKyc}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmRejection} disabled={isSubmittingKyc}>{isSubmittingKyc ? 'Submitting...' : 'Submit Rejection'}</Button>
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
                      <KycDocumentRowSimple
                        label="Uploaded PAN Card"
                        url={kycDetails.documents?.find((d: any) => d.panCard)?.panCard}
                      />
                      <KycDocumentRowSimple
                        label="Uploaded GST Certificate"
                        url={kycDetails.documents?.find((d: any) => d.gstcertificate)?.gstcertificate}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="address-details" className="mt-4">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Office Address</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{kycDetails.pr_officeaddress || 'Not Provided'}</p>
                        {(kycDetails.pr_city || kycDetails.pr_state || kycDetails.pr_pincode) && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {kycDetails.pr_city && <span>{kycDetails.pr_city}, </span>}
                                {kycDetails.pr_state && <span>{kycDetails.pr_state} - </span>}
                                {kycDetails.pr_pincode && <span>{kycDetails.pr_pincode}</span>}
                            </p>
                        )}
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-2">Registered Address</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{kycDetails.address || 'Not Provided'}</p>
                        {(kycDetails.city || kycDetails.state || kycDetails.pincode) && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {kycDetails.city && <span>{kycDetails.city}, </span>}
                                {kycDetails.state && <span>{kycDetails.state} - </span>}
                                {kycDetails.pincode && <span>{kycDetails.pincode}</span>}
                            </p>
                        )}
                      </div>
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
                      <KycDocumentRowSimple
                        label="Uploaded Cancelled Cheque"
                        url={kycDetails.documents?.find((d: any) => d.cancelCheque)?.cancelCheque}
                      />
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
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea 
                id="task-description"
                placeholder="Enter task description"
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({...newTask, priority: value})}>
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
                <Select value={newTask.type} onValueChange={(value: any) => setNewTask({...newTask, type: value})}>
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
                  onValueChange={(value) => setNewTask({...newTask, customerId: value})}
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
                <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({...newTask, assignedTo: value})}>
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
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
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

      {/* Map Customer Modal */}
      <Dialog open={isMapCustomerModalOpen} onOpenChange={setIsMapCustomerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Customer to another Partner</DialogTitle>
            <DialogDescription>
              Re-assign customer <span className="font-semibold">{selectedCustomerForMapping?.domainName}</span> to a different partner.
            </DialogDescription>
          </DialogHeader>
          {isLoadingPartners ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading partners...</span>
            </div>
          ) : (
            <div className="py-4 space-y-2">
              <Label htmlFor="partner-search">Select a Partner</Label>
              <div className="relative">
                <Input
                  id="partner-search"
                  placeholder="Search by name or company..."
                  value={partnerSearchTerm}
                  onChange={(e) => setPartnerSearchTerm(e.target.value)}
                  className="pr-8"
                />
                {partnerSearchTerm && (
                  <X className="absolute top-1/2 right-2 h-5 w-5 -translate-y-1/2 cursor-pointer text-muted-foreground" onClick={() => setPartnerSearchTerm('')} />
                )}
              </div>

              <div className="rounded-md border max-h-52 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner Name</TableHead>
                      <TableHead>Company</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPartners
                      .filter(p => p.portal_reseller_id !== partner.portal_reseller_id)
                      .filter(p =>
                        p.name.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
                        (p.company || '').toLowerCase().includes(partnerSearchTerm.toLowerCase())
                      ).map(p => (
                      <TableRow
                        key={p.id}
                        onClick={() => setSelectedPartnerForMapping(p.portal_reseller_id!)}
                        className={cn(
                          "cursor-pointer",
                          selectedPartnerForMapping === p.portal_reseller_id && "bg-muted hover:bg-muted"
                        )}
                      >
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.company}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMapCustomerModalOpen(false)} disabled={isMappingCustomer}>Cancel</Button>
            <Button onClick={handleMapCustomer} disabled={isMappingCustomer || !selectedPartnerForMapping || isLoadingPartners}>
              {isMappingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Map Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerOnboardingDetail;