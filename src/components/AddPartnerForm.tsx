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
import { ArrowLeft, Plus, X } from 'lucide-react';

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

  // Default empty contact object for appending
  const defaultContactValue = {
    contactName: '', contactDesignation: '', contactNumber: '', contactEmail: ''

  };

  // Default empty interaction object for appending
  const defaultInteractionValue = {
    isrId: '',
    contactPerson: '',
    designation: '',
    contactNumber: '',
    contactEmail: '',
    status: 'freshfollowup-connected' as const,
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
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
              <CardHeader>
                <CardTitle className="text-lg">Additional Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactsFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 border p-4 rounded-md relative">
                    <FormField
                      control={form.control}
                      name={`contacts.${index}.contactName`}
                      render={({ field: contactField }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...contactField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`contacts.${index}.contactDesignation`}
                      render={({ field: contactField }) => (
                        <FormItem>
                          <FormLabel>Designation</FormLabel>
                          <FormControl>
                            <Input placeholder="Sales Manager" {...contactField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`contacts.${index}.contactNumber`}
                      render={({ field: contactField }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+91-9876543210" {...contactField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`contacts.${index}.contactEmail`}
                      render={({ field: contactField }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@example.com" {...contactField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-1 flex items-end justify-start md:justify-end">
                      <Button type="button" variant="destructive" size="icon" onClick={() => contactsFieldArray.remove(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => contactsFieldArray.append(defaultContactValue)}>
                  <Plus className="mr-2 h-4 w-4" /> Add More Contact
                </Button>
              </CardContent>
            </Card>

            {/* Interactions Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Add Interactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interactionsFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 border p-4 rounded-md relative">
                    <FormField
                      control={form.control}
                      name={`interactions.${index}.isrId`}
                      render={({ field: interactionField }) => (
                        <FormItem>
                          <FormLabel>ISR</FormLabel>
                          <Select onValueChange={interactionField.onChange} defaultValue={interactionField.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select ISR" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.filter(u => ['fsr', 'bde', 'team-leader'].includes(u.role)).map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`interactions.${index}.contactPerson`}
                      render={({ field: interactionField }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl><Input placeholder="Jane Smith" {...interactionField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`interactions.${index}.status`}
                      render={({ field: interactionField }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={interactionField.onChange} defaultValue={interactionField.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {interactionStatusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`interactions.${index}.designation`}
                      render={({ field: interactionField }) => (
                        <FormItem>
                          <FormLabel>Designation</FormLabel>
                          <FormControl><Input placeholder="Manager" {...interactionField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`interactions.${index}.contactNumber`}
                      render={({ field: interactionField }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl><Input type="tel" placeholder="+91..." {...interactionField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`interactions.${index}.contactEmail`}
                      render={({ field: interactionField }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl><Input type="email" placeholder="person@example.com" {...interactionField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end justify-start">
                      <Button type="button" variant="destructive" size="icon" onClick={() => interactionsFieldArray.remove(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => interactionsFieldArray.append(defaultInteractionValue)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Interaction
                </Button>
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
