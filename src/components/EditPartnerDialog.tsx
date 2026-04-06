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
import { useFieldArray } from 'react-hook-form';
import { Badge, Plus, X, Edit } from 'lucide-react';
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

const interactionStatusOptions = [
  { value: 'freshfollowup-connected', label: 'Fresh Follow-up - Connected' },
  { value: 'followup-not-connected', label: 'Follow-up - Not Connected' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'feedback', label: 'Feedback' },
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
const partnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  identity: z.array(z.string()).optional(),
  zone: z.array(z.string()).optional(),
  paymentTerms: z.string().optional(),
  assignedUserIds: z.array(z.string()).optional(),
  productTypes: z.array(z.string()).optional(),
  partner_program: z.string().optional(),
  stage_owner: z.string().optional(),
  partner_tag: z.array(z.string()).optional(),
  partner_type: z.string().optional(),
  source_of_partner: z.string().optional(),
  designation: z.string().optional(),
  contacts: z.array(z.object({
    contactName: z.string().min(1, 'Contact name is required.'),
    contactDesignation: z.string().optional().or(z.literal('')),
    contactNumber: z.string().optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  })).optional(),
  interactions: z.array(z.object({
    isrId: z.string().min(1, 'ISR is required.'),
    contactPerson: z.string().min(1, 'Contact person is required.'),
    designation: z.string().optional().or(z.literal('')),
    contactNumber: z.string().optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
    status: z.enum(['freshfollowup-connected', 'followup-not-connected', 'presentation', 'feedback'], {
      required_error: "Status is required.",
    }),
  })).optional(),
  feedback_status: z.string().optional(),
  feedback_notes: z.string().optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

export const EditPartnerDialog = ({ partner, users, open, onOpenChange, onSuccess }: EditPartnerDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);

  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [contactData, setContactData] = useState({
    contactName: '', contactDesignation: '', contactNumber: '', contactEmail: '',
  });
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingInteractionIndex, setEditingInteractionIndex] = useState<number | null>(null);
  const [interactionData, setInteractionData] = useState({
    isrId: '', contactPerson: '', status: 'freshfollowup-connected' as const, designation: '', contactNumber: '', contactEmail: '',
  });

  const defaultContactValue = {
    contactName: '', contactDesignation: '', contactNumber: '', contactEmail: ''
  };

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
      update(editingContactIndex, contactData);
      setEditingContactIndex(null);
    } else {
      append(contactData);
    }
    setContactData(defaultContactValue);
    setIsContactFormOpen(false);
  };

  const defaultInteractionValue = {
    isrId: '',
    contactPerson: '',
    designation: '',
    contactNumber: '',
    contactEmail: '',
    status: 'freshfollowup-connected' as const,
  };

  const handleAddOrUpdateInteraction = () => {
    if (!interactionData.isrId || !interactionData.contactPerson) {
      toast({ title: 'Error', description: 'ISR and Contact Person are required.', variant: 'destructive' });
      return;
    }
    if (interactionData.contactEmail && !z.string().email().safeParse(interactionData.contactEmail).success) {
      toast({ title: 'Invalid interaction email.', variant: 'destructive' });
      return;
    }

    if (editingInteractionIndex !== null) {
      interactionFieldArray.update(editingInteractionIndex, interactionData);
      setEditingInteractionIndex(null);
    } else {
      interactionFieldArray.append(interactionData);
    }
    setInteractionData(defaultInteractionValue);
    setIsInteractionFormOpen(false);
  };
  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    // We will set default values in the useEffect hook when partner data is available.
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
    name: "contacts",
  });

  const interactionFieldArray = useFieldArray({
    control: form.control,
    name: "interactions",
  });
  const handleEditContact = (index: number) => {
    const contacts = form.getValues().contacts;
    if (contacts && contacts[index]) {
        setContactData(contacts[index]);
        setEditingContactIndex(index);
        setIsContactFormOpen(true);
    }
  };

  const handleEditInteraction = (index: number) => {
    const interactions = form.getValues().interactions;
    if (interactions && interactions[index]) {
      setInteractionData(interactions[index]);
      setIsInteractionFormOpen(true);
      setEditingInteractionIndex(index);
    }
  };

  useEffect(() => {
    if (partner) {
      const contacts = typeof partner.contacts === 'string'
        ? (() => {
            try {
              return JSON.parse(partner.contacts);
            } catch (e) { return []; }
          })()
        : (Array.isArray(partner.contacts) ? partner.contacts : []);
      const interactions = typeof partner.interactions === 'string'
        ? (() => {
            try {
              // It's possible partner.interactions is an empty string or not a valid JSON array.
              const parsed = partner.interactions ? JSON.parse(partner.interactions) : [];
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) { return []; }
          })()
        : (Array.isArray(partner.interactions) ? partner.interactions : []);
      
      const feedbackData = typeof partner.feedback === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(partner.feedback);
              // Ensure it's an array
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) { return []; }
          })()
        : (Array.isArray(partner.feedback) ? partner.feedback : []);
      
      // To ensure the history view updates correctly, we'll set it in the state.
      // We also reverse it here for display purposes so the latest is at the top.
      setFeedbackHistory(feedbackData);

      // The form fields should be for adding NEW feedback, so we'll clear them.
      const latestFeedback = feedbackData.length > 0 ? feedbackData[feedbackData.length - 1] : null;
      
      form.reset({
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        company: partner.company,
        specialization: partner.specialization,
        identity: parseJsonSafe(partner.identity),
        zone: parseJsonSafe(partner.zone),
        paymentTerms: partner.paymentTerms,
        assignedUserIds: partner.assignedUserIds || [],
        productTypes: partner.productTypes || [],
        partner_program: partner.partner_program,
        stage_owner: partner.stage_owner || 'none',
        partner_tag: parseJsonSafe(partner.partner_tag),
        partner_type: partner.partner_type || 'silver',
        source_of_partner: partner.source_of_partner || 'webinar',
        designation: partner.designation || '',
        contacts: contacts,
        interactions: interactions,
        // Clear the fields for adding new feedback. The history is shown below.
        feedback_status: '',
        feedback_notes: '',
      });
    }
  }, [partner, form]);


  const handleAssignedUserChange = (userId: string, checked: boolean) => {
    setFormData(prev => {
      const currentIds = prev.assignedUserIds || [];
      const newIds = checked
        ? [...currentIds, userId]
        : currentIds.filter(id => id !== userId);
      return { ...prev, assignedUserIds: newIds };
    });
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
      console.error("Error logging CRM action:", error.message);
    }
  };
  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    try {
      // Get existing feedback history
      const existingFeedback = typeof partner.feedback === 'string'
        ? (JSON.parse(partner.feedback) || [])
        : (Array.isArray(partner.feedback) ? partner.feedback : []);

      let updatedFeedbackHistory = [...existingFeedback];

      // If new feedback is provided, add it to the history
      if (data.feedback_status) {
        const newFeedbackEntry = {
            status: data.feedback_status,
            notes: data.feedback_notes || '',
            timestamp: new Date().toISOString(),
        };
        updatedFeedbackHistory.unshift(newFeedbackEntry);
      }

      const feedbackToSave = updatedFeedbackHistory.length > 0 ? JSON.stringify(updatedFeedbackHistory) : null;

      const { error } = await supabase
        .from('partners')
        .update({
          name: data.name,
          email: data.email,
          contact_number: data.phone,
          company: data.company,
          specialization: data.specialization,
          identity: data.identity && data.identity.length > 0 ? JSON.stringify(data.identity) : null,
          zone: data.zone && data.zone.length > 0 ? JSON.stringify(data.zone) : null,
          payment_terms: data.paymentTerms,
          assigned_user_ids: data.assignedUserIds,
          product_types: data.productTypes,
          partner_program: data.partner_program,
          stage_owner: data.stage_owner === 'none' ? null : data.stage_owner,
          partner_tag: data.partner_tag && data.partner_tag.length > 0 ? JSON.stringify(data.partner_tag) : null,
          partner_type: data.partner_type,
          source_of_partner: data.source_of_partner,
          designation: data.designation,
          contacts: data.contacts && data.contacts.length > 0 ? JSON.stringify(data.contacts) : null,
          interactions: data.interactions && data.interactions.length > 0 ? JSON.stringify(data.interactions) : null,
          feedback: feedbackToSave,
        })
        .eq('id', partner.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Partner details have been updated successfully.",
      });
      const logDetails = `Updated partner details for partner ${partner.name} (ID: ${partner.portal_reseller_id}).`;
      await logCrmAction("Update Partner Details", logDetails);


      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userOptions = users.map(u => ({ value: u.id, label: u.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Partner: {partner.name}</DialogTitle>
          <DialogDescription>Update the details for this partner.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormField control={form.control} name="specialization" render={({ field }) => (
                <FormItem><Label>Specialization</Label><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="partner_program" render={({ field }) => (
                <FormItem><Label>Partner Program</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Referal Partner">Referral Partner</SelectItem><SelectItem value="Commited Partner">Committed Partner</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                <FormItem><Label>Payment Terms</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Payment Terms" /></SelectTrigger></FormControl><SelectContent><SelectItem value="annual-in-advance">Annual in Advance</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="half-yearly">Half Yearly</SelectItem><SelectItem value="net-15">Net 15</SelectItem><SelectItem value="net-30">Net 30</SelectItem><SelectItem value="net-45">Net 45</SelectItem><SelectItem value="net-60">Net 60</SelectItem><SelectItem value="net-90">Net 90</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="stage_owner" render={({ field }) => (
                <FormItem><Label>Stage Owner</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a stage owner" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Unassigned</SelectItem>{users.map((user) => (<SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="partner_type" render={({ field }) => (
                <FormItem><Label>Partner Type</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="silver">Silver</SelectItem><SelectItem value="gold">Gold</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="source_of_partner" render={({ field }) => (
                <FormItem><Label>Source of Partner</Label><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a source" /></SelectTrigger></FormControl><SelectContent>{sourceOfPartnerOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="identity" render={({ field }) => (
              <FormItem>
                <Label>Partner Identity</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md">
                  {identityOptions.map((item) => (
                    <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={field.value?.includes(item.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), item.id])
                            : field.onChange(field.value?.filter((value) => value !== item.id));
                        }}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md">
                  {zoneOptions.map((item) => (
                    <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={field.value?.includes(item.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), item.id])
                            : field.onChange(field.value?.filter((value) => value !== item.id));
                        }}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md">
                  {partnerTagOptions.map((item) => (
                    <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={field.value?.includes(item.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), item.id])
                            : field.onChange(field.value?.filter((value) => value !== item.id));
                        }}
                      />
                      <Label className="font-normal">{item.label}</Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* Additional Contacts Section */}
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 border p-4 rounded-md">
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
                      <div className="flex items-end gap-2">
                        <Button type="button" onClick={handleAddOrUpdateContact}>{editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}</Button>
                        {editingContactIndex !== null && (<Button type="button" variant="outline" onClick={() => { setEditingContactIndex(null); setContactData(defaultContactValue); setIsContactFormOpen(false); }}>Cancel</Button>)}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* Interactions Section */}
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
                        <TableHead>Status</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interactionFieldArray.fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>{users.find(u => u.id === form.watch(`interactions.${index}.isrId`))?.name || 'N/A'}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactPerson`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.status`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.designation`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactNumber`)}</TableCell>
                          <TableCell>{form.watch(`interactions.${index}.contactEmail`)}</TableCell>
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

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="feedback_status" render={({ field }) => (
                    <FormItem>
                      <Label>Add New Feedback Status</Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select feedback status" /></SelectTrigger></FormControl>
                        <SelectContent>{feedbackStatusOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="feedback_notes" render={({ field }) => (<FormItem className="md:col-span-2"><Label>Add New Feedback Notes</Label><FormControl><Textarea placeholder="Enter feedback notes" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                {feedbackHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Feedback History</h4>
                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                      <div className="space-y-4">
                        {feedbackHistory.map((entry, index) => (
                          <div key={index} className={`p-3 rounded-lg text-sm space-y-2 ${index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-muted/50'}`}>
                            <div className="flex justify-between items-start">
                              <p className="font-semibold capitalize text-sm">
                                {entry.status.replace(/-/g, ' ')}
                              </p>
                              <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-muted-foreground whitespace-pre-wrap">{entry.notes || 'No notes provided.'}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
