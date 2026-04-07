import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Partner, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import UserAssignmentSelect from './UserAssignmentSelect';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import { Checkbox } from './ui/checkbox';
import { useFieldArray } from 'react-hook-form';
import { ArrowLeft, Plus, X, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Label } from '@radix-ui/react-label';

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

const feedbackStatusOptions = [
  { value: 'call-back', label: 'Call Back' },
  { value: 'email', label: 'Email' },
  { value: 'followup', label: 'Followup' },
  { value: 'interested', label: 'Interested' },
  { value: 'nc', label: 'NC' },
  { value: 'not-interested', label: 'Not Interested' },
  { value: 'price-challenge', label: 'Price challenge' },
  { value: 'whatsapp', label: 'Whatsapp' },
  { value: 'linkedin', label: 'Linkedin' },
  { value: 'presentation-call', label: 'Presentation Call' },
] as const;

const cityOptions = [
  // Tier 1
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

  // Tier 2
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
  { value: 'davangere', label: 'Davangere' },
  { value: 'kozhikode', label: 'Kozhikode' },
  { value: 'kurnool', label: 'Kurnool' },
  { value: 'rajahmundry', label: 'Rajahmundry' },
  { value: 'bokaro', label: 'Bokaro' },
  { value: 'south-dumdum', label: 'South Dumdum' },
  { value: 'bellary', label: 'Bellary' },
  { value: 'patiala', label: 'Patiala' },
  { value: 'agartala', label: 'Agartala' },
  { value: 'bhagalpur', label: 'Bhagalpur' },
  { value: 'muzaffarnagar', label: 'Muzaffarnagar' },
  { value: 'bhatpara', label: 'Bhatpara' },
  { value: 'panihati', label: 'Panihati' },
  { value: 'latur', label: 'Latur' },
  { value: 'dhule', label: 'Dhule' },
  { value: 'rohtak', label: 'Rohtak' },
  { value: 'korba', label: 'Korba' },
  { value: 'bhilwara', label: 'Bhilwara' },
  { value: 'berhampur', label: 'Berhampur' },
  { value: 'muzaffarpur', label: 'Muzaffarpur' },
  { value: 'ahmednagar', label: 'Ahmednagar' },
  { value: 'mathura', label: 'Mathura' },
  { value: 'kollam', label: 'Kollam' },
  { value: 'avadi', label: 'Avadi' },
  { value: 'kadapa', label: 'Kadapa' },
  { value: 'kamarhati', label: 'Kamarhati' },
  { value: 'sambalpur', label: 'Sambalpur' },
  { value: 'bilaspur', label: 'Bilaspur' },
  { value: 'shahjahanpur', label: 'Shahjahanpur' },
  { value: 'satara', label: 'Satara' },
  { value: 'thrissur', label: 'Thrissur' },
  { value: 'alwar', label: 'Alwar' },
  { value: 'akola', label: 'Akola' },
  { value: 'hisar', label: 'Hisar' },
  { value: 'panipat', label: 'Panipat' },
  { value: 'karnal', label: 'Karnal' },
  { value: 'farrukhabad', label: 'Farrukhabad' },
  { value: 'sagar', label: 'Sagar' },
  { value: 'ratlam', label: 'Ratlam' },
  { value: 'imphal', label: 'Imphal' },
  { value: 'anantapur', label: 'Anantapur' },
  { value: 'arrah', label: 'Arrah' },
  { value: 'karimnagar', label: 'Karimnagar' },
  { value: 'etawah', label: 'Etawah' },
  { value: 'bharatpur', label: 'Bharatpur' },
  { value: 'begusarai', label: 'Begusarai' },
  { value: 'new-delhi', label: 'New Delhi' },
  { value: 'chhapra', label: 'Chhapra' },
  { value: 'kadapa', label: 'Kadapa' },
  { value: 'ramagundam', label: 'Ramagundam' },
  { value: 'pali', label: 'Pali' },
  { value: 'vizianagaram', label: 'Vizianagaram' },
  { value: 'katihar', label: 'Katihar' },
  { value: 'hardwar', label: 'Hardwar' },
  { value: 'sonipat', label: 'Sonipat' },
  { value: 'nagercoil', label: 'Nagercoil' },
  { value: 'thanjavur', label: 'Thanjavur' },
  { value: 'hapur', label: 'Hapur' },
  { value: 'naihati', label: 'Naihati' },
  { value: 'secunderabad', label: 'Secunderabad' },
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

const partnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  specialization: z.string().min(2, 'Specialization is required').optional().or(z.literal('')),
  identity: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one identity.',
  }),
  paymentTerms: z.enum(['net-15', 'net-30', 'net-45', 'net-60', 'net-90', 'annual-in-advance', 'monthly', 'quarterly', 'half-yearly']).optional().or(z.literal('')),
  zone: z.array(z.string()).optional(),
  stageOwnerId: z.string().optional(),
  partner_tag: z.array(z.string()).optional(),
  partner_type: z.enum(['silver', 'gold']),
  source_of_partner: z.string().optional(),
  designation: z.string().optional().or(z.literal('')),
  partner_status: z.enum(['activate_portal', 'on_hold'], {
    required_error: "Partner status is required.",
  }),
  city: z.string().optional(),
  vertical: z.string().optional(),
  contacts: z.array(z.object({
    contactName: z.string().min(1, 'Contact name is required.'),
    contactDesignation: z.string().optional().or(z.literal('')),
    contactNumber: z.string().optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
    contactLinkedinURL: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  })).optional(),
  interactions: z.array(z.object({
    isrId: z.string().min(1, 'ISR is required.'),
    contactPerson: z.string().min(1, 'Contact person is required.'),
    designation: z.string().optional().or(z.literal('')),
    contactNumber: z.string().optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
    feedback_status: z.string().optional(),
    feedback_notes: z.string().optional(),
    feedback_timestamp: z.string().optional(),
    status: z.enum(['freshfollowup-connected', 'followup-not-connected', 'presentation', 'feedback'], {
      required_error: "Status is required.",
    }),
  })).optional(),

});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface AddPartnerFormProps {
  users: User[];
  onSuccess: () => void;
  onCancel: () => void;
}

const interactionStatusOptions = [
  { value: 'freshfollowup-connected', label: 'Fresh Follow-up - Connected' },
  { value: 'followup-not-connected', label: 'Follow-up - Not Connected' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'feedback', label: 'Feedback' },
] as const;

const countries = [
  { name: 'India', code: 'IN', dial_code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧' },
  { name: 'Australia', code: 'AU', dial_code: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦' },
  { name: 'Germany', code: 'DE', dial_code: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dial_code: '+33', flag: '🇫🇷' },
  { name: 'Japan', code: 'JP', dial_code: '+81', flag: '🇯🇵' },
  { name: 'Singapore', code: 'SG', dial_code: '+65', flag: '🇸🇬' },
  { name: 'United Arab Emirates', code: 'AE', dial_code: '+971', flag: '🇦🇪' },
];

const AddPartnerForm = ({ users, onSuccess, onCancel }: AddPartnerFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState('+91');
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
      specialization: '',
      identity: [],
      paymentTerms: 'net-30',
      zone: [],
      stageOwnerId: '',
      partner_tag: [],
      partner_type: 'silver',
      source_of_partner: 'webinar',
      designation: '',
      partner_status: undefined,
      city: undefined,
      vertical: undefined,
      contacts: [],
      interactions: [],
    },
  });

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
      console.error("User ID not available for logging CRM action.");
      return;
    }
    try {
      const logFormData = new FormData();
      logFormData.append('userid', user.id);
      logFormData.append('actiontype', actiontype);
      logFormData.append('path', 'Add Partner Form');
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

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    try {

      // The database schema uses snake_case for column names.
      const newPartnerData = {
        name: data.name,
        email: data.email,
        contact_number: data.phone ? `${countryCode}${data.phone}` : undefined,
        company: data.company,
        specialization: data.specialization,
        identity: data.identity && data.identity.length > 0 ? JSON.stringify(data.identity) : undefined,
        payment_terms: data.paymentTerms,
        zone: data.zone && data.zone.length > 0 ? JSON.stringify(data.zone) : undefined,
        assigned_user_ids: assignedUserIds.length > 0 ? assignedUserIds : undefined,
        partner_tag: data.partner_tag && data.partner_tag.length > 0 ? JSON.stringify(data.partner_tag) : undefined,
        stage_owner: data.stageOwnerId === 'none' ? undefined : data.stageOwnerId,
        partner_type: data.partner_type,
        source_of_partner: data.source_of_partner,
        designation: data.designation,
        partner_status: data.partner_status,
        city: data.city || null,
        vertical: data.vertical || null,
        contacts: data.contacts && data.contacts.length > 0 ? JSON.stringify(data.contacts) : undefined,
        interactions: data.interactions && data.interactions.length > 0 ? JSON.stringify(data.interactions) : undefined,
      };

      const { error } = await supabase.from('partners').insert([newPartnerData]);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Partner has been added successfully.',
      });
      const logDetails = `Added new partner: ${data.name} (${data.email}).`;
      await logCrmAction("Add Partner", logDetails);
      form.reset();
      setAssignedUserIds([]);
      contactsFieldArray.replace([]); // Reset contacts field array too
      if (error) {
        throw error;
      }

      interactionsFieldArray.replace([]); // Reset interactions field array
      onSuccess();
    } catch (error) {
      console.error('Error adding partner:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to add partner. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactsFieldArray = useFieldArray({
    control: form.control,
    name: 'contacts',
  });

  const interactionsFieldArray = useFieldArray({
    control: form.control,
    name: 'interactions',
  });

  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [contactData, setContactData] = useState({
    contactName: '', contactDesignation: '', contactNumber: '', contactEmail: '', contactLinkedinURL: '',
  });

  const handleAddOrUpdateContact = () => {
    if (!contactData.contactName) {
      toast({ title: 'Error', description: 'Contact name is required.', variant: 'destructive' });
      return;
    }
    if (contactData.contactEmail && !z.string().email().safeParse(contactData.contactEmail).success) {
      toast({ title: 'Invalid contact email.', variant: 'destructive' });
      return;
    }

    if (editingContactIndex !== null) {
      contactsFieldArray.update(editingContactIndex, contactData);
      setEditingContactIndex(null);
    } else {
      contactsFieldArray.append(contactData);
    }
    setContactData({ contactName: '', contactDesignation: '', contactNumber: '', contactEmail: '', contactLinkedinURL: '' });
  };

  const [editingInteractionIndex, setEditingInteractionIndex] = useState<number | null>(null);
  const [interactionData, setInteractionData] = useState({
    isrId: '',
    contactPerson: '',
    status: 'freshfollowup-connected' as const,
    designation: '',
    contactNumber: '',
    contactEmail: '',
    feedback_status: '',
    feedback_notes: '',
    feedback_timestamp: '',
  });

  const handleAddOrUpdateInteraction = () => {
    if (!interactionData.isrId || !interactionData.contactPerson) {
      toast({ title: 'Error', description: 'ISR and Contact Person are required.', variant: 'destructive' });
      return;
    }
    if (interactionData.contactEmail && !z.string().email().safeParse(interactionData.contactEmail).success) {
      toast({ title: 'Invalid interaction email.', variant: 'destructive' });
      return;
    }

    const interactionWithTimestamp = { ...interactionData };
    // Add timestamp only if feedback is being provided
    if (interactionData.feedback_status || interactionData.feedback_notes) {
      interactionWithTimestamp.feedback_timestamp = new Date().toISOString();
    }

    if (editingInteractionIndex !== null) {
      interactionsFieldArray.update(editingInteractionIndex, interactionWithTimestamp);
      setEditingInteractionIndex(null);
    } else {
      interactionsFieldArray.append(interactionWithTimestamp);
    }
    // Reset form to default values
    setInteractionData(defaultInteractionValue);
  };
  const handleEditContact = (index: number) => {
    setContactData(form.getValues().contacts[index]);
    setEditingContactIndex(index);
  };
  // Default empty contact object for appending
  const defaultContactValue = {
    contactName: '', contactDesignation: '', contactNumber: '', contactEmail: ''

  };

  const handleEditInteraction = (index: number) => {
    setInteractionData(form.getValues().interactions[index]);
    setEditingInteractionIndex(index);
  };

  // Default empty interaction object for appending
  const defaultInteractionValue = {
    isrId: '',
    contactPerson: '',
    designation: '',
    contactNumber: '',
    contactEmail: '',
    feedback_status: '',
    feedback_notes: '',
    feedback_timestamp: '',
    status: 'freshfollowup-connected' as const,
  };

  const watchedFeedbackStatus = form.watch('feedback_status');

  return (
    <Card className="w-full max-w-8xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Add New Partner</CardTitle>
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Onboarding
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter partner name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="partner@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <div className="flex items-start gap-2">
                    <Select onValueChange={setCountryCode} defaultValue={countryCode}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(c => (
                          <SelectItem key={c.code} value={c.dial_code}>
                            {c.flag} {c.dial_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormControl>
                      <Input type="tel" placeholder="Enter phone number" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl> 
                      <Input placeholder="e.g., E-commerce, Healthcare" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="stageOwnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage Owner</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user to own the stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>This user will be responsible for the partner's onboarding stage.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CEO, Sales Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partner_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select partner status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="activate_portal">Activate Portal</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vertical"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vertical</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a vertical" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {verticalOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
              control={form.control}
              name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a city" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
            />
            </div>
            
            <FormField
              control={form.control}
              name="identity"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Partner Identity</FormLabel>
                    <FormDescription>
                      Select one or more identities that apply to this partner.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {identityOptions.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="identity"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="net-15">Net 15</SelectItem>
                        <SelectItem value="net-30">Net 30</SelectItem>
                        <SelectItem value="net-45">Net 45</SelectItem>
                        <SelectItem value="net-60">Net 60</SelectItem>
                        <SelectItem value="net-90">Net 90</SelectItem>
                        <SelectItem value="annual-in-advance">Annual in Advance</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="half-yearly">Half Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
              control={form.control}
              name="partner_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="silver">Silver partner</SelectItem>
                      <SelectItem value="gold">Gold partner</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="source_of_partner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source of Partner</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a source" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceOfPartnerOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             <FormField
              control={form.control}
              name="zone"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Zone (Optional)</FormLabel>
                    <FormDescription>
                      Select the zones this partner operates in.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {zoneOptions.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="zone"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        (field.value || [])?.filter(
                                          (value) => value !== item.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            

            <FormField
              control={form.control}
              name="partner_tag"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Partner Tags</FormLabel>
                    <FormDescription>
                      Select tags that apply to this partner.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {partnerTagOptions.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="partner_tag"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        (field.value || [])?.filter(
                                          (value) => value !== item.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                Assigned Users
              </label>
              <UserAssignmentSelect
                users={users}
                assignedUserIds={assignedUserIds}
                onAssignmentChange={setAssignedUserIds}
                maxAssignments={3}
                allowedRoles={['fsr', 'team-leader', 'bde']}
              />
            </div>
            
            {/* Additional Contacts Section */}
            <Card className="mt-6">
            <CardHeader><CardTitle className="text-lg">Additional Contacts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {contactsFieldArray.fields.length > 0 && (
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
                    {contactsFieldArray.fields.map((field, index) => (
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
                          <Button type="button" variant="destructive" size="icon" onClick={() => contactsFieldArray.remove(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input placeholder="John Doe" value={contactData.contactName} onChange={e => setContactData(d => ({...d, contactName: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input placeholder="Sales Manager" value={contactData.contactDesignation} onChange={e => setContactData(d => ({...d, contactDesignation: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input type="tel" placeholder="+91-9876543210" value={contactData.contactNumber} onChange={e => setContactData(d => ({...d, contactNumber: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" placeholder="contact@example.com" value={contactData.contactEmail} onChange={e => setContactData(d => ({...d, contactEmail: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input type="url" placeholder="https://linkedin.com/in/..." value={contactData.contactLinkedinURL} onChange={e => setContactData(d => ({...d, contactLinkedinURL: e.target.value}))} />
                </div>
                <div className="flex items-end gap-2 md:col-start-3">
                  <Button type="button" onClick={handleAddOrUpdateContact}>
                    {editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}
                  </Button>
                  {editingContactIndex !== null && (
                    <Button type="button" variant="outline" onClick={() => { setEditingContactIndex(null); setContactData(defaultContactValue); }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Interactions Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Interactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interactionsFieldArray.fields.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ISR</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Feedback Status</TableHead>
                        <TableHead>Feedback Notes</TableHead>
                        <TableHead>Feedback Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interactionsFieldArray.fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>{users.find(u => u.id === form.watch(`interactions.${index}.isrId`))?.name || 'N/A'}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactPerson`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.status`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.designation`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactNumber`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactEmail`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.feedback_status`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.feedback_notes`)}</TableCell>
                          <TableCell>
                            {form.watch(`interactions.${index}.feedback_timestamp`) ? new Date(form.watch(`interactions.${index}.feedback_timestamp`)).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleEditInteraction(index)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="destructive" size="icon" onClick={() => interactionsFieldArray.remove(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md">
                  <div className="space-y-2">
                    <Label>ISR</Label>
                    <Select value={interactionData.isrId} onValueChange={value => setInteractionData(d => ({ ...d, isrId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select ISR" /></SelectTrigger>
                      <SelectContent>
                        {users.filter(u => ['fsr', 'bde', 'team-leader'].includes(u.role)).map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input placeholder="Jane Smith" value={interactionData.contactPerson} onChange={e => setInteractionData(d => ({ ...d, contactPerson: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={interactionData.status} onValueChange={value => setInteractionData(d => ({ ...d, status: value as any }))}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {interactionStatusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                    <Select value={interactionData.feedback_status} onValueChange={value => setInteractionData(d => ({ ...d, feedback_status: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select feedback status" /></SelectTrigger>
                      <SelectContent>
                        {feedbackStatusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {interactionData.feedback_status && (
                    <div className="space-y-2">
                      <Label>Feedback Notes</Label>
                      <Input
                        placeholder="Enter feedback notes"
                        value={interactionData.feedback_notes}
                        onChange={e => setInteractionData(d => ({ ...d, feedback_notes: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="flex items-end gap-2 col-span-full md:col-span-3 justify-end">
                    <Button type="button" onClick={handleAddOrUpdateInteraction}>
                      {editingInteractionIndex !== null ? 'Update Interaction' : 'Add Interaction'}
                    </Button>
                    {editingInteractionIndex !== null && (
                      <Button type="button" variant="outline" onClick={() => { setEditingInteractionIndex(null); setInteractionData(defaultInteractionValue); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Partner'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddPartnerForm;

/*
This is a high-level overview of the changes:

1.  **State for Interaction Form**:
    *   `editingInteractionIndex`: Keeps track of the interaction being edited.
    *   `interactionData`: Holds the data for the add/edit interaction form.

2.  **UI Transformation**:
    *   The repeated `FormField` blocks for interactions are replaced with a single `<Table>` that displays all added interactions.
    *   Each row in the table now has an "Edit" and "Delete" button.
    *   A new form, controlled by the `interactionData` state, is placed below the table for adding or editing interactions.

3.  **Handler Functions**:
    *   `handleAddOrUpdateInteraction`: Validates and adds a new interaction or updates an existing one in the `react-hook-form` state.
    *   `handleEditInteraction`: Populates the editing form with the data of the selected interaction.

This refactoring provides a much cleaner and more intuitive way for users to manage the list of interactions.
*/
