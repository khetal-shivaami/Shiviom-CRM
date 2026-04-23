import { useState, useEffect } from 'react';
import {
  // useForm,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Partner, User } from '../types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFieldArray, Controller } from 'react-hook-form';
import { Badge, Plus, X, Edit, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface EditPartnerDialogProps {
  partner: Partner;
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onLogAction?: (actiontype: string, details: string) => Promise<void>;
}

const identityOptions = [
  { id: 'web-app-developer', label: 'Web App Developer' },
  { id: 'system-integrator', label: 'System Integrator' },
  { id: 'managed-service-provider', label: 'Managed Service Provider' },
  { id: 'digital-marketer', label: 'Digital Marketer' },
  { id: 'cyber-security', label: 'Cyber Security' },
  { id: 'cloud-hosting', label: 'Cloud Hosting' },
  { id: 'web-hosting', label: 'Web Hosting' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'cloud-service-provider', label: 'Cloud Service Provider' },
  { id: 'microsoft-partner', label: 'Microsoft Partner' },
  { id: 'aws-partner', label: 'AWS Partner' },
  { id: 'it-consulting', label: 'IT Consulting' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'software-reseller', label: 'Software Reseller' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'other', label: 'Other' },
  { value: 'food-beverages-manufacturing', label: 'Food & Beverages Manufacturing' },
  { value: 'food-beverages-retail', label: 'Food & Beverages Retail' },
  { value: 'hospital-healthcare', label: 'Hospital & Healthcare' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'business-professional-services', label: 'Business & Professional Services' },
  { value: 'construction', label: 'Construction' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'retail-consumer', label: 'Retail & Consumer' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'solar', label: 'Solar' },
  { value: 'fmcg', label: 'FMCG' },
  { value: 'e-commerce', label: 'E - commerce' },
  { value: 'wholesale-building-materials', label: 'Wholesale Building Materials' },
  { value: 'media', label: 'Media' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'it', label: 'IT' },
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'startup', label: 'Startup' },
  { value: 'automobile-industry', label: 'Automobile industry' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'import-export', label: 'Import & Export' },
  { value: 'software-services', label: 'Software & services' },
  { value: 'digital-industries', label: 'Digital Industries' },
  { value: 'bpo', label: 'BPO' },
  { value: 'kpo', label: 'KPO' },
] as const;

const zoneOptions = [
  { id: 'north', label: 'North' },
  { id: 'east', label: 'East' },
  { id: 'west', label: 'West' },
  { id: 'south', label: 'South' },
] as const;

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

// const interactionStatusOptions = [
//   { value: 'freshfollowup-connected', label: 'Fresh Follow-up - Connected' },
//   { value: 'followup-not-connected', label: 'Follow-up - Not Connected' },
//   { value: 'presentation', label: 'Presentation' },
//   { value: 'feedback', label: 'Feedback' },
// ] as const;

const feedbackStatusOptions = [
  { value: 'call-back', label: 'Call Back' },
  { value: 'email', label: 'Email' },
  { value: 'followup', label: 'Followup' },
  { value: 'interested', label: 'Interested' },
  { value: 'invalid', label: 'Invalid' },
  { value: 'nc', label: 'NC' },
  { value: 'not-interested', label: 'Not Interested' },
  { value: 'price-challenge', label: 'Price challenge' },
  { value: 'whatsapp', label: 'Whatsapp' },
  { value: 'linkedin', label: 'Linkedin' },
  { value: 'freshfollowup-connected', label: 'Fresh Follow-up - Connected' },
  { value: 'followup-not-connected', label: 'Follow-up - Not Connected' },
  { value: 'qc', label: 'QC' },
  { value: 'qc-pending', label: 'QC-Pending' },
  { value: 'qc-qualified', label: 'QC-Qualified' },
  { value: 'qc-notqualified', label: 'QC-NotQualified' },
] as const;

const sourceOfLeadOptions = [
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Referral' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
  { value: 'cold-call', label: 'Cold Call' },
] as const;

const followupFeedbackStatuses = ['freshfollowup-connected', 'followup-not-connected', 'followup'] as const;

const cityOptions = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'hyderabad', label: 'Hyderabad' },
  { value: 'ahmedabad', label: 'Ahmedabad' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'kolkata', label: 'Kolkata' },
  { value: 'surat', label: 'Surat' },
  { value: 'pune', label: 'Pune' },
  { value: 'jaipur', label: 'Jaipur' },
  { value: 'lucknow', label: 'Lucknow' },
  { value: 'kanpur', label: 'Kanpur' },
  { value: 'nagpur', label: 'Nagpur' },
  { value: 'indore', label: 'Indore' },
  { value: 'thane', label: 'Thane' },
  { value: 'bhopal', label: 'Bhopal' },
  { value: 'visakhapatnam', label: 'Visakhapatnam' },
  { value: 'pimpri-chinchwad', label: 'Pimpri-Chinchwad' },
  { value: 'patna', label: 'Patna' },
  { value: 'vadodara', label: 'Vadodara' },
  { value: 'ghaziabad', label: 'Ghaziabad' },
  { value: 'ludhiana', label: 'Ludhiana' },
  { value: 'agra', label: 'Agra' },
  { value: 'nashik', label: 'Nashik' },
  { value: 'faridabad', label: 'Faridabad' },
  { value: 'meerut', label: 'Meerut' },
  { value: 'rajkot', label: 'Rajkot' },
  { value: 'kalyan-dombivali', label: 'Kalyan-Dombivali' },
  { value: 'vasai-virar', label: 'Vasai-Virar' },
  { value: 'varanasi', label: 'Varanasi' },
  { value: 'srinagar', label: 'Srinagar' },
  { value: 'aurangabad', label: 'Aurangabad' },
  { value: 'dhanbad', label: 'Dhanbad' },
  { value: 'amritsar', label: 'Amritsar' },
  { value: 'navi-mumbai', label: 'Navi Mumbai' },
  { value: 'prayagraj', label: 'Prayagraj (Allahabad)' },
  { value: 'ranchi', label: 'Ranchi' },
  { value: 'howrah', label: 'Howrah' },
  { value: 'coimbatore', label: 'Coimbatore' },
  { value: 'jabalpur', label: 'Jabalpur' },
  { value: 'gwalior', label: 'Gwalior' },
  { value: 'vijayawada', label: 'Vijayawada' },
  { value: 'jodhpur', label: 'Jodhpur' },
  { value: 'madurai', label: 'Madurai' },
  { value: 'raipur', label: 'Raipur' },
  { value: 'kota', label: 'Kota' },
  { value: 'guwahati', label: 'Guwahati' },
  { value: 'chandigarh', label: 'Chandigarh' },
  { value: 'solapur', label: 'Solapur' },
  { value: 'hubli-dharwad', label: 'Hubli-Dharwad' },
  { value: 'bareilly', label: 'Bareilly' },
  { value: 'moradabad', label: 'Moradabad' },
  { value: 'mysore', label: 'Mysore' },
  { value: 'gurgaon', label: 'Gurgaon' },
  { value: 'aligarh', label: 'Aligarh' },
  { value: 'jalandhar', label: 'Jalandhar' },
  { value: 'tiruchirappalli', label: 'Tiruchirappalli' },
  { value: 'bhubaneswar', label: 'Bhubaneswar' },
  { value: 'salem', label: 'Salem' },
  { value: 'mira-bhayandar', label: 'Mira-Bhayandar' },
  { value: 'thiruvananthapuram', label: 'Thiruvananthapuram' },
  { value: 'bhiwandi', label: 'Bhiwandi' },
  { value: 'saharanpur', label: 'Saharanpur' },
  { value: 'gorakhpur', label: 'Gorakhpur' },
  { value: 'guntur', label: 'Guntur' },
  { value: 'bikaner', label: 'Bikaner' },
  { value: 'amravati', label: 'Amravati' },
  { value: 'noida', label: 'Noida' },
  { value: 'jamshedpur', label: 'Jamshedpur' },
  { value: 'bhilai', label: 'Bhilai' },
  { value: 'warangal', label: 'Warangal' },
  { value: 'cuttack', label: 'Cuttack' },
  { value: 'firozabad', label: 'Firozabad' },
  { value: 'kochi', label: 'Kochi' },
  { value: 'bhavnagar', label: 'Bhavnagar' },
  { value: 'dehradun', label: 'Dehradun' },
  { value: 'durgapur', label: 'Durgapur' },
  { value: 'asansol', label: 'Asansol' },
  { value: 'nanded', label: 'Nanded' },
  { value: 'kolhapur', label: 'Kolhapur' },
  { value: 'ajmer', label: 'Ajmer' },
  { value: 'gulbarga', label: 'Gulbarga' },
  { value: 'jamnagar', label: 'Jamnagar' },
  { value: 'ujjain', label: 'Ujjain' },
  { value: 'loni', label: 'Loni' },
  { value: 'siliguri', label: 'Siliguri' },
  { value: 'jhansi', label: 'Jhansi' },
  { value: 'ulhasnagar', label: 'Ulhasnagar' },
  { value: 'nellore', label: 'Nellore' },
  { value: 'jammu', label: 'Jammu' },
  { value: 'sangli-miraj-kupwad', label: 'Sangli-Miraj & Kupwad' },
  { value: 'belgaum', label: 'Belgaum' },
  { value: 'mangaluru', label: 'Mangaluru' },
  { value: 'ambattur', label: 'Ambattur' },
  { value: 'tirunelveli', label: 'Tirunelveli' },
  { value: 'malegaon', label: 'Malegaon' },
  { value: 'gaya', label: 'Gaya' },
  { value: 'jalgaon', label: 'Jalgaon' },
  { value: 'udaipur', label: 'Udaipur' },
  { value: 'maheshtala', label: 'Maheshtala' },
  { value: 'tiruppur', label: 'Tiruppur' },
  { value: 'other', label: 'Other' }
] as const;

const verticalOptions = [
  { value: 'food-beverages-manufacturing', label: 'Food & Beverages Manufacturing' },
  { value: 'food-beverages-retail', label: 'Food & Beverages Retail' },
  { value: 'hospital-healthcare', label: 'Hospital & Healthcare' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'business-professional-services', label: 'Business & Professional Services' },
  { value: 'construction', label: 'Construction' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'retail-consumer', label: 'Retail & Consumer' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'solar', label: 'Solar' },
  { value: 'fmcg', label: 'FMCG' },
  { value: 'e-commerce', label: 'E - commerce' },
  { value: 'wholesale-building-materials', label: 'Wholesale Building Materials' },
  { value: 'media', label: 'Media' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'it', label: 'IT' },
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'startup', label: 'Startup' },
  { value: 'automobile-industry', label: 'Automobile industry' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'import-export', label: 'Import & Export' },
  { value: 'software-services', label: 'Software & services' },
  { value: 'digital-industries', label: 'Digital Industries' },
  { value: 'bpo', label: 'BPO' },
  { value: 'kpo', label: 'KPO' },
] as const;

const parseJsonSafe = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return value.split(',').map(s => s.trim());
    }
  }
  return [];
};

const partnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  identity: z.array(z.string()).optional(),
  zone: z.array(z.string()).optional(),
  paymentTerms: z.string().optional(),
  assignedUserId: z.string().optional(),
  productTypes: z.array(z.string()).optional(),
  partner_program: z.string().optional(),
  stage_owner: z.string().optional(),
  partner_tag: z.array(z.string()).optional(),
  partner_type: z.string().optional(),
  source_of_partner: z.string().optional(),
  designation: z.string().optional(),
  city: z.string().optional(),
  vertical: z.string().optional(),
  contacts: z.array(z.object({
    contactName: z.string().optional().or(z.literal('')),
    contactDesignation: z.string().optional().or(z.literal('')),
    contactNumber: z.string().optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
    contactLinkedinURL: z.string().url({ message: 'Invalid URL' }).optional().or(z.literal('')),
  })).optional(),
  interactions: z.array(z.object({
    isrId: z.string().optional().or(z.literal('')),
    contactPerson: z.string().optional().or(z.literal('')),
    productName: z.string().optional().or(z.literal('')),
    designation: z.string().optional().or(z.literal('')),
    contactNumber: z.string().optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
    status: z.enum(['freshfollowup-connected', 'followup-not-connected', 'presentation', 'feedback'])
      .optional(),
    source_of_lead: z.string().optional(),
    followup_date: z.string().optional(),
    feedback_status: z.string().optional(),
    feedback_notes: z.string().optional(),
    feedback_timestamp: z.string().optional(),
  })).optional(),
  feedback_status: z.string().optional(),
  feedback_notes: z.string().optional(),
});
console.log(partnerSchema)
type PartnerFormData = z.infer<typeof partnerSchema>;

type ContactFormValue = {
  contactName: string;
  contactDesignation: string;
  contactNumber: string;
  contactEmail: string;
  contactLinkedinURL: string;
};

type InteractionFormValue = {
  isrId: string;
  contactPerson: string;
  productName: string;
  designation: string;
  contactNumber: string;
  contactEmail: string;
  status: 'freshfollowup-connected' | 'followup-not-connected' | 'presentation' | 'feedback';
  source_of_lead: string;
  followup_date: string;
  feedback_status: string;
  feedback_notes: string;
  feedback_timestamp: string;
};

const normalizeInteractionForStorage = (interaction: InteractionFormValue) => {
  const legacyProductName = (interaction as InteractionFormValue & { product_name?: string }).product_name;
  return {
    ...interaction,
    productName: interaction.productName || legacyProductName || '',
    product_name: interaction.productName || legacyProductName || '',
    designation: interaction.designation || '',
    source_of_lead: interaction.source_of_lead || '',
    followup_date: interaction.followup_date || '',
  };
};

export const EditPartnerDialog = ({ partner, users, open, onOpenChange, onSuccess }: EditPartnerDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = users.find(u => u.id === user?.id);
  const isSalesRole = currentUser && ['isr', 'fsr', 'bde'].includes(currentUser.role);
  const isIsrRole = currentUser?.role === 'isr';

  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [contactData, setContactData] = useState<ContactFormValue>({
    contactName: '', contactDesignation: '', contactNumber: '', contactEmail: '', contactLinkedinURL: '',
  });
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingInteractionIndex, setEditingInteractionIndex] = useState<number | null>(null);
  const [interactionData, setInteractionData] = useState<InteractionFormValue>({
    isrId: '',
    contactPerson: '',
    productName: '',
    status: 'presentation',
    designation: '',
    contactNumber: '',
    contactEmail: '',
    source_of_lead: '',
    followup_date: '',
    feedback_status: '',
    feedback_notes: '',
    feedback_timestamp: '',
  });

  const defaultInteractionValue: InteractionFormValue = {
    isrId: '',
    contactPerson: '',
    productName: '',
    designation: '',
    contactNumber: '',
    contactEmail: '',
    status: 'presentation' as const,
    source_of_lead: '',
    followup_date: '',
    feedback_status: '',
    feedback_notes: '',
    feedback_timestamp: '',
  };

  const defaultContactValue: ContactFormValue = {
    contactName: '', contactDesignation: '', contactNumber: '', contactEmail: '', contactLinkedinURL: '',
  };

  const handleAddOrUpdateContact = () => {
    if (contactData.contactEmail && !z.string().email().safeParse(contactData.contactEmail).success) {
      toast({ title: 'Invalid contact email.', variant: 'destructive' });
      return;
    }
    if (editingContactIndex !== null) {
      update(editingContactIndex, contactData);
      setEditingContactIndex(null);
    } else {
      append(contactData);
    }
    setContactData(defaultContactValue);
    setIsContactFormOpen(false);
  };

  const handleAddOrUpdateInteraction = () => {
    if (interactionData.contactEmail && !z.string().email().safeParse(interactionData.contactEmail).success) {
      toast({ title: 'Invalid interaction email.', variant: 'destructive' });
      return;
    }

    const selectedContact = (form.getValues().contacts || []).find(
      contact => contact.contactName === interactionData.contactPerson
    );

    const interactionWithTimestamp = normalizeInteractionForStorage({
      ...interactionData,
      designation: selectedContact?.contactDesignation || interactionData.designation,
      contactNumber: selectedContact?.contactNumber || interactionData.contactNumber,
      contactEmail: selectedContact?.contactEmail || interactionData.contactEmail,
      followup_date: followupFeedbackStatuses.includes(interactionData.feedback_status as typeof followupFeedbackStatuses[number])
        ? interactionData.followup_date
        : '',
    });

    if (
      followupFeedbackStatuses.includes(interactionData.feedback_status as typeof followupFeedbackStatuses[number]) &&
      !interactionWithTimestamp.followup_date
    ) {
      toast({ title: 'Error', description: 'Follow-up date is required for selected feedback status.', variant: 'destructive' });
      return;
    }

    if (interactionData.feedback_status || interactionData.feedback_notes) {
      interactionWithTimestamp.feedback_timestamp = new Date().toISOString();
    }

    if (editingInteractionIndex !== null) {
      interactionFieldArray.update(editingInteractionIndex, interactionWithTimestamp);
      setEditingInteractionIndex(null);
    } else {
      interactionFieldArray.prepend(interactionWithTimestamp);
    }
    setInteractionData(defaultInteractionValue);
    setIsInteractionFormOpen(false);
  };

  useEffect(() => {
    if (isIsrRole && currentUser && isInteractionFormOpen) {
      setInteractionData(d => ({ ...d, isrId: currentUser.id }));
    }
  }, [isIsrRole, currentUser, isInteractionFormOpen]);

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      contacts: [],
      interactions: [],
      feedback_status: '',
      feedback_notes: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'contacts',
  });

  const interactionFieldArray = useFieldArray({
    control: form.control,
    name: 'interactions',
  });

  const handleEditContact = (index: number) => {
    const contacts = form.getValues().contacts;
    if (contacts && contacts[index]) {
      setContactData({
        contactName: contacts[index].contactName || '',
        contactDesignation: contacts[index].contactDesignation || '',
        contactNumber: contacts[index].contactNumber || '',
        contactEmail: contacts[index].contactEmail || '',
        contactLinkedinURL: contacts[index].contactLinkedinURL || '',
      });
      setEditingContactIndex(index);
      setIsContactFormOpen(true);
    }
  };

  const handleEditInteraction = (index: number) => {
    const interactions = form.getValues().interactions;
    if (interactions && interactions[index]) {
      setInteractionData({
        isrId: interactions[index].isrId || '',
        contactPerson: interactions[index].contactPerson || '',
        productName: interactions[index].productName || (interactions[index] as any).product_name || '',
        designation: interactions[index].designation || '',
        contactNumber: interactions[index].contactNumber || '',
        contactEmail: interactions[index].contactEmail || '',
        status: interactions[index].status || 'presentation',
        source_of_lead: (interactions[index] as any).source_of_lead || '',
        followup_date: (interactions[index] as any).followup_date || '',
        feedback_status: interactions[index].feedback_status || '',
        feedback_notes: interactions[index].feedback_notes || '',
        feedback_timestamp: interactions[index].feedback_timestamp || '',
      });
      setIsInteractionFormOpen(true);
      setEditingInteractionIndex(index);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .not('portal_prod_id', 'is', null)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts((data || []).filter((item): item is { id: string; name: string } => !!item?.id && !!item?.name));
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (partner) {
      const partnerData = partner as any;

      const contacts = typeof partnerData.contacts === 'string'
        ? (() => {
          try {
            return JSON.parse(partnerData.contacts);
          } catch {
            return [];
          }
        })()
        : (Array.isArray(partnerData.contacts) ? partnerData.contacts : []);

      const interactions = typeof partnerData.interactions === 'string'
        ? (() => {
          try {
            const parsed = partnerData.interactions ? JSON.parse(partnerData.interactions) : [];
            const mapped = Array.isArray(parsed)
              ? parsed.map((item: any) => ({
                  ...item,
                  productName: item.productName || item.product_name || '',
                  product_name: item.productName || item.product_name || '',
                  designation: item.designation || '',
                  feedback_timestamp: item.feedback_timestamp || '',
                }))
              : [];
            mapped.sort((a, b) => {
              if (!a.feedback_timestamp && !b.feedback_timestamp) return 0;
              if (!a.feedback_timestamp) return 1;
              if (!b.feedback_timestamp) return -1;
              return new Date(b.feedback_timestamp).getTime() - new Date(a.feedback_timestamp).getTime();
            });
            return mapped;
          } catch {
            return [];
          }
        })()
        : (Array.isArray(partnerData.interactions) ? partnerData.interactions : []);

      const feedbackData = typeof partnerData.feedback === 'string'
        ? (() => {
          try {
            const parsed = JSON.parse(partnerData.feedback);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
        : (Array.isArray(partnerData.feedback) ? partnerData.feedback : []);

      setFeedbackHistory(feedbackData);

      form.reset({
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        company: partner.company,
        specialization: partner.specialization || '',
        identity: parseJsonSafe(partner.identity),
        zone: parseJsonSafe(partner.zone),
        paymentTerms: partner.paymentTerms,
        assignedUserId: isIsrRole && currentUser
          ? currentUser.id
          : (partnerData.assignedUserId ?? partnerData.assigned_user_id ?? ''),
        productTypes: parseJsonSafe(partnerData.productTypes ?? partnerData.product_types),
        partner_program: partnerData.partner_program,
        stage_owner: partnerData.stage_owner || 'none',
        partner_tag: parseJsonSafe(partnerData.partner_tag),
        partner_type: partnerData.partner_type || 'silver',
        source_of_partner: partnerData.source_of_partner || 'webinar',
        designation: partnerData.designation || '',
        city: partnerData.city || '',
        vertical: partnerData.vertical || '',
        contacts,
        interactions,
        feedback_status: '',
        feedback_notes: '',
      });
    }
  }, [partner, form, isIsrRole, currentUser]);

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
      console.error('User ID not available for logging CRM action.');
      return;
    }
    try {
      const logFormData = new FormData();
      logFormData.append('userid', user.id);
      logFormData.append('actiontype', actiontype);
      logFormData.append('path', 'Edit Partner Dialog');
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
      console.error('Error logging CRM action:', error.message);
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      title: "Validation Error",
      description: "Please check the form for errors. Required fields might be missing or some values are invalid.",
      variant: "destructive",
    });
  };

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    try {
      // CRM Update
      const crmFormData = new FormData();
      if (partner.portal_reseller_id) {
        crmFormData.append('reseller_id', partner.portal_reseller_id);
      }
      crmFormData.append('reseller_name', data.name);
      crmFormData.append('reseller_email', data.email);
      crmFormData.append('reseller_companyname', data.company);
      crmFormData.append('reseller_contactnumber', data.phone || '');

      const crmResponse = await fetch(API_ENDPOINTS.UPDATE_RESELLER_DETAILS_ONCRM, {
        method: 'POST',
        body: crmFormData,
      });

      if (!crmResponse.ok) {
        const errorResult = await crmResponse.json().catch(() => ({ message: `CRM update API request failed with status ${crmResponse.status}` }));
        throw new Error(errorResult.message || 'Failed to update partner details in CRM.');
      }

      console.log('Save changes button clicked. Submitting data:', data);
      console.log(data)
      const partnerData = partner as any;
      const assignedUser = users.find(u => u.id === data.assignedUserId);
      const existingFeedback = typeof partnerData.feedback === 'string'
        ? (JSON.parse(partnerData.feedback) || [])
        : (Array.isArray(partnerData.feedback) ? partnerData.feedback : []);

      let updatedFeedbackHistory = [...existingFeedback];

      if (data.feedback_status) {
        updatedFeedbackHistory.unshift({
          status: data.feedback_status,
          notes: data.feedback_notes || '',
          timestamp: new Date().toISOString(),
        });
      }

      const feedbackToSave = updatedFeedbackHistory.length > 0 ? JSON.stringify(updatedFeedbackHistory) : null;
      console.log(assignedUser, assignedUser?.name);
      const { error } = await supabase
        .from('partners')
        .update({
          name: data.name,
          email: data.email,
          contact_number: data.phone,
          company: data.company,
          specialization: data.specialization || '',
          identity: data.identity && data.identity.length > 0 ? JSON.stringify(data.identity) : null,
          zone: data.zone && data.zone.length > 0 ? JSON.stringify(data.zone) : null,
          payment_terms: data.paymentTerms,
          // assigned_user_id: data.assignedUserId === 'none' ? null : data.assignedUserId,
          // assigned_user_ids: data.assignedUserId === 'none' ? null : [data.assignedUserId],
          assigned_manager: assignedUser ? assignedUser.name : null,
          product_types: data.productTypes,
          product_types: data.productTypes && data.productTypes.length > 0 ? JSON.stringify(data.productTypes) : null,
          partner_program: data.partner_program,
          stage_owner: data.stage_owner === 'none' ? null : data.stage_owner,
          partner_tag: data.partner_tag && data.partner_tag.length > 0 ? JSON.stringify(data.partner_tag) : null,
          partner_type: data.partner_type,
          source_of_partner: data.source_of_partner,
          designation: data.designation,
          city: data.city,
          vertical: data.vertical,
          contacts: data.contacts && data.contacts.length > 0 ? JSON.stringify(data.contacts) : null,
          interactions: data.interactions && data.interactions.length > 0
            ? JSON.stringify(data.interactions.map(interaction => normalizeInteractionForStorage(interaction as InteractionFormValue)))
            : null,
          feedback: feedbackToSave,
        })
        .eq('id', partner.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Partner details have been updated successfully.',
      });
      await logCrmAction('Update Partner Details', `Updated partner details for partner ${partner.name} (ID: ${partner.portal_reseller_id}).`);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Partner: {partner.name}</DialogTitle>
          <DialogDescription>Update the details for this partner.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4" noValidate>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><Label>Partner Name</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem><Label>Company</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><Label>Email</Label><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><Label>Phone</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="designation" render={({ field }) => (
                <FormItem><Label>Designation</Label><FormControl><Input placeholder="e.g., CEO, Sales Manager" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {/* <FormField control={form.control} name="specialization" render={({ field }) => (
                <FormItem><Label>Specialization</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} /> */}
              <FormField control={form.control} name="partner_program" render={({ field }) => (
                <FormItem><Label>Partner Program</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Referal Partner">Referral Partner</SelectItem><SelectItem value="Commited Partner">Committed Partner</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              
              <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                <FormItem><Label>Payment Terms</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Payment Terms" /></SelectTrigger></FormControl><SelectContent><SelectItem value="annual-in-advance">Annual in Advance</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="half-yearly">Half Yearly</SelectItem><SelectItem value="net-15">Net 15</SelectItem><SelectItem value="net-30">Net 30</SelectItem><SelectItem value="net-45">Net 45</SelectItem><SelectItem value="net-60">Net 60</SelectItem><SelectItem value="net-90">Net 90</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="stage_owner" render={({ field }) => (
                <FormItem><Label>Stage Owner</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a stage owner" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Unassigned</SelectItem>{users.map((user) => (<SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="partner_type" render={({ field }) => (
                <FormItem><Label>Partner Type</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="silver">Silver Partner</SelectItem><SelectItem value="gold">Gold Partner</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="source_of_partner" render={({ field }) => (
                <FormItem><Label>Source of Partner</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a source" /></SelectTrigger></FormControl><SelectContent>{sourceOfPartnerOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <Label>City</Label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>{cityOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {/* <FormField control={form.control} name="vertical" render={({ field }) => (
                <FormItem>
                  <Label>Vertical</Label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a vertical" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>{verticalOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} /> */}
            </div>

            <FormField control={form.control} name="identity" render={({ field }) => (
              <FormItem>
                <Label>Partner Identity</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md mt-2">
                  {identityOptions.map((item) => (
                    <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={field.value?.includes(item.id)}
                        onCheckedChange={(checked) => checked
                          ? field.onChange([...(field.value || []), item.id])
                          : field.onChange(field.value?.filter((value) => value !== item.id))}
                      />
                      <Label className="font-normal">{item.label}</Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="zone" render={({ field }) => (
              <FormItem>
                <Label>Zone (Optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md mt-2">
                  {zoneOptions.map((item) => (
                    <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={field.value?.includes(item.id)}
                        onCheckedChange={(checked) => checked
                          ? field.onChange([...(field.value || []), item.id])
                          : field.onChange(field.value?.filter((value) => value !== item.id))}
                      />
                      <Label className="font-normal">{item.label}</Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="partner_tag" render={({ field }) => (
              <FormItem>
                <Label>Partner Tags</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md mt-2">
                  {partnerTagOptions.map((item) => (
                    <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={field.value?.includes(item.id)}
                        onCheckedChange={(checked) => checked
                          ? field.onChange([...(field.value || []), item.id])
                          : field.onChange(field.value?.filter((value) => value !== item.id))}
                      />
                      <Label className="font-normal">{item.label}</Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <FormField
              control={form.control}
              name="assignedUserId"
              render={({ field }) => (
                <FormItem>
                  <Label>Assigned User</Label>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || 'none'}
                    disabled={isIsrRole}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assigned user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isIsrRole && currentUser ? (
                        <SelectItem key={currentUser.id} value={currentUser.id}>
                          {currentUser.name}-{currentUser.role.toLocaleUpperCase()}
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {users.filter((u) => u.role === 'isr' || u.role === 'fsr' || u.role === 'bde').map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}-{u.role.toLocaleUpperCase()}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card className="mt-6">
              <CardHeader><CardTitle className="text-lg">Additional Contacts</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {fields.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>LinkedIn</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>{form.watch(`contacts.${index}.contactName`)}</TableCell>
                          <TableCell>{form.watch(`contacts.${index}.contactDesignation`)}</TableCell>
                          <TableCell>{form.watch(`contacts.${index}.contactNumber`)}</TableCell>
                          <TableCell>{form.watch(`contacts.${index}.contactEmail`)}</TableCell>
                          <TableCell>{form.watch(`contacts.${index}.contactLinkedinURL`)}</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleEditContact(index)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <Collapsible open={isContactFormOpen} onOpenChange={setIsContactFormOpen}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" onClick={() => {
                      if (!isContactFormOpen) {
                        setEditingContactIndex(null);
                        setContactData(defaultContactValue);
                      }
                      setIsContactFormOpen(!isContactFormOpen);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md">
                      <div className="space-y-2">
                        <Label>Contact Name</Label>
                        <Input placeholder="John Doe" value={contactData.contactName} onChange={e => setContactData(d => ({ ...d, contactName: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input placeholder="Sales Manager" value={contactData.contactDesignation} onChange={e => setContactData(d => ({ ...d, contactDesignation: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input type="tel" placeholder="+91-9876543210" value={contactData.contactNumber} onChange={e => setContactData(d => ({ ...d, contactNumber: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input type="email" placeholder="contact@example.com" value={contactData.contactEmail} onChange={e => setContactData(d => ({ ...d, contactEmail: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>LinkedIn URL</Label>
                        <Input type="url" placeholder="https://linkedin.com/in/..." value={contactData.contactLinkedinURL} onChange={e => setContactData(d => ({ ...d, contactLinkedinURL: e.target.value }))} />
                      </div>
                      <div className="flex items-end gap-2 md:col-start-3">
                        <Button type="button" onClick={handleAddOrUpdateContact}>{editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}</Button>
                        {editingContactIndex !== null && (<Button type="button" variant="outline" onClick={() => { setEditingContactIndex(null); setContactData(defaultContactValue); setIsContactFormOpen(false); }}>Cancel</Button>)}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Interactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interactionFieldArray.fields.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ISR</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Source of Lead</TableHead>
                        <TableHead>FeedBack Status</TableHead>
                        <TableHead>Follow-up Date</TableHead>
                        <TableHead>Feedback Notes</TableHead>
                        <TableHead>Feedback Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interactionFieldArray.fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>{users.find(u => u.id === form.watch(`interactions.${index}.isrId`))?.name || 'N/A'}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactPerson`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.productName`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.designation`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactNumber`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactEmail`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.source_of_lead`) || 'N/A'}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.feedback_status`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.followup_date`) || 'N/A'}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.feedback_notes`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.feedback_timestamp`) ? new Date(form.watch(`interactions.${index}.feedback_timestamp`)).toLocaleString() : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleEditInteraction(index)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="destructive" size="icon" onClick={() => interactionFieldArray.remove(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <Collapsible open={isInteractionFormOpen} onOpenChange={setIsInteractionFormOpen}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" onClick={() => {
                      if (!isInteractionFormOpen) {
                        setEditingInteractionIndex(null);
                        setInteractionData(defaultInteractionValue);
                      }
                      setIsInteractionFormOpen(!isInteractionFormOpen);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Interaction
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-md">
                      <div className="space-y-2">
                        <Label>ISR</Label>
                        <Select
                          value={interactionData.isrId}
                          onValueChange={value => setInteractionData(d => ({ ...d, isrId: value }))}
                          disabled={isIsrRole}
                        >
                          <SelectTrigger><SelectValue placeholder="Select ISR" /></SelectTrigger>
                          <SelectContent>
                            {isIsrRole && currentUser ? (
                              <SelectItem key={currentUser.id} value={currentUser.id}>
                                {currentUser.name}-{currentUser.role.toLocaleUpperCase()}
                              </SelectItem>
                            ) : (
                              users.filter(u => ['isr', 'fsr', 'bde'].includes(u.role)).map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}-{user.role.toLocaleUpperCase()}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Select
                          value={interactionData.contactPerson}
                          onValueChange={value => {
                            const selectedContact = (form.getValues().contacts || []).find(contact => contact.contactName === value);
                            setInteractionData(d => ({
                              ...d,
                              contactPerson: value,
                              designation: selectedContact?.contactDesignation || '',
                              contactNumber: selectedContact?.contactNumber || '',
                              contactEmail: selectedContact?.contactEmail || '',
                            }));
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select contact person" /></SelectTrigger>
                          <SelectContent>
                            {(form.watch('contacts') || []).map((contact, index) => (
                              <SelectItem key={`${contact.contactName}-${index}`} value={contact.contactName}>
                                {contact.contactName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select value={interactionData.productName} onValueChange={value => setInteractionData(d => ({ ...d, productName: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.name}>{product.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Source of Lead</Label>
                        <Select value={interactionData.source_of_lead} onValueChange={value => setInteractionData(d => ({ ...d, source_of_lead: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select source of lead" /></SelectTrigger>
                          <SelectContent>
                            {sourceOfLeadOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input placeholder="Manager" value={interactionData.designation} onChange={e => setInteractionData(d => ({ ...d, designation: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input type="tel" placeholder="+91..." value={interactionData.contactNumber} onChange={e => setInteractionData(d => ({ ...d, contactNumber: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input type="email" placeholder="person@example.com" value={interactionData.contactEmail} onChange={e => setInteractionData(d => ({ ...d, contactEmail: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Feedback Status</Label>
                        <Select
                          value={interactionData.feedback_status}
                          onValueChange={value =>
                            setInteractionData(d => ({
                              ...d,
                              feedback_status: value,
                              followup_date: followupFeedbackStatuses.includes(value as typeof followupFeedbackStatuses[number]) ? d.followup_date : '',
                            }))
                          }
                        >
                          <SelectTrigger><SelectValue placeholder="Select feedback status" /></SelectTrigger>
                          <SelectContent>
                            {feedbackStatusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {followupFeedbackStatuses.includes(interactionData.feedback_status as typeof followupFeedbackStatuses[number]) && (
                        <div className="space-y-2">
                          <Label>Follow-up Date</Label>
                          <Input
                            type="date"
                            value={interactionData.followup_date}
                            onChange={e => setInteractionData(d => ({ ...d, followup_date: e.target.value }))}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Feedback Notes</Label>
                        <Input
                          placeholder="Enter feedback notes"
                          value={interactionData.feedback_notes}
                          onChange={e => setInteractionData(d => ({ ...d, feedback_notes: e.target.value }))} />
                      </div>
                      <div className="flex items-end gap-2 col-span-full md:col-span-2 justify-end">
                        <Button type="button" onClick={handleAddOrUpdateInteraction}>
                          {editingInteractionIndex !== null ? 'Update Interaction' : 'Add Interaction'}
                        </Button>
                        {editingInteractionIndex !== null && (
                          <Button type="button" variant="outline" onClick={() => { setEditingInteractionIndex(null); setInteractionData(defaultInteractionValue); setIsInteractionFormOpen(false); }}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPartnerDialog;
