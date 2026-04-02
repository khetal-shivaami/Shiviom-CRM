import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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

export const EditPartnerDialog = ({ partner, users, open, onOpenChange, onSuccess }: EditPartnerDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Partner>>({});

  useEffect(() => {
    if (partner) {
      setFormData({
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
      });
    }
  }, [partner]);

  const handleInputChange = (field: keyof Partner, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelectChange = (field: 'identity' | 'zone' | 'partner_tag', value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = (prev[field] as string[]) || [];
      const newValues = checked
        ? [...currentValues, value]
        : currentValues.filter(item => item !== value);
      return { ...prev, [field]: newValues };
    });
  };

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
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          name: formData.name,
          email: formData.email,
          contact_number: formData.phone,
          company: formData.company,
          specialization: formData.specialization,
          identity: formData.identity && (formData.identity as string[]).length > 0 ? JSON.stringify(formData.identity) : null,
          zone: formData.zone && (formData.zone as string[]).length > 0 ? JSON.stringify(formData.zone) : null,
          payment_terms: formData.paymentTerms,
          assigned_user_ids: formData.assignedUserIds,
          product_types: formData.productTypes,
          partner_program: formData.partner_program,
          stage_owner: formData.stage_owner === 'none' ? null : formData.stage_owner,
          partner_tag: formData.partner_tag && (formData.partner_tag as string[]).length > 0 ? JSON.stringify(formData.partner_tag) : null,
          partner_type: formData.partner_type,
          source_of_partner: formData.source_of_partner,
          designation: formData.designation,
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
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Partner: {partner.name}</DialogTitle>
          <DialogDescription>Update the details for this partner.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Partner Name</Label>
              <Input id="name" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={formData.company || ''} onChange={(e) => handleInputChange('company', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" value={formData.designation || ''} onChange={(e) => handleInputChange('designation', e.target.value)} placeholder="e.g., CEO, Sales Manager" />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" value={formData.designation || ''} onChange={(e) => handleInputChange('designation', e.target.value)} placeholder="e.g., CEO, Sales Manager" />
            </div> */}
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input id="specialization" value={formData.specialization || ''} onChange={(e) => handleInputChange('specialization', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partnerProgram">Partner Program</Label>
            <Select value={formData.partner_program} onValueChange={(value) => handleInputChange('partner_program', value)}>
              <SelectTrigger id="partnerProgram">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Referal Partner">Referral Partner</SelectItem>
                <SelectItem value="Commited Partner">Committed Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Select value={formData.paymentTerms} onValueChange={(value) => handleInputChange('paymentTerms', value)}>
              <SelectTrigger id="paymentTerms"><SelectValue placeholder="Select Payment Terms"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="annual-in-advance">Annual in Advance</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="half-yearly">Half Yearly</SelectItem>
                <SelectItem value="net-15">Net 15</SelectItem>
                <SelectItem value="net-30">Net 30</SelectItem>
                <SelectItem value="net-45">Net 45</SelectItem>
                <SelectItem value="net-60">Net 60</SelectItem>
                <SelectItem value="net-90">Net 90</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stageOwner">Stage Owner</Label>
            <Select
              value={formData.stage_owner || 'none'}
              onValueChange={(value) => handleInputChange('stage_owner', value)}
            >
              <SelectTrigger id="stageOwner">
                <SelectValue placeholder="Select a stage owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This user is responsible for the partner's current onboarding stage.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="partnerType">Partner Type</Label>
            <Select value={formData.partner_type} onValueChange={(value) => handleInputChange('partner_type', value)}>
              <SelectTrigger id="partnerType">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gold">Gold partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceOfPartner">Source of Partner</Label>
            <Select value={formData.source_of_partner} onValueChange={(value) => handleInputChange('source_of_partner', value)}>
              <SelectTrigger id="sourceOfPartner">
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {sourceOfPartnerOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>
          <div className="space-y-2">
            <Label>Partner Identity</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md">
              {identityOptions.map((item) => (
                <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                  <Checkbox
                    id={`identity-${item.id}`}
                    checked={(formData.identity as string[])?.includes(item.id)}
                    onCheckedChange={(checked) => handleMultiSelectChange('identity', item.id, !!checked)}
                  />
                  <Label htmlFor={`identity-${item.id}`} className="font-normal">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Zone (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md">
              {zoneOptions.map((item) => (
                <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                  <Checkbox
                    id={`zone-${item.id}`}
                    checked={(formData.zone as string[])?.includes(item.id)}
                    onCheckedChange={(checked) => handleMultiSelectChange('zone', item.id, !!checked)}
                  />
                  <Label htmlFor={`zone-${item.id}`} className="font-normal">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Partner Tags</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md">
              {partnerTagOptions.map((item) => (
                <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                  <Checkbox
                    id={`partner_tag-${item.id}`}
                    checked={(formData.partner_tag as string[])?.includes(item.id)}
                    onCheckedChange={(checked) => handleMultiSelectChange('partner_tag', item.id, !!checked)}
                  />
                  <Label htmlFor={`partner_tag-${item.id}`} className="font-normal">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Assigned Employees</Label>
            <ScrollArea className="h-40 w-full rounded-md border p-4">
              <div className="space-y-2">
                {userOptions.map(option => (
                  <div key={option.value} className="flex flex-row items-start space-x-3 space-y-0">
                    <Checkbox
                      id={`user-${option.value}`}
                      checked={(formData.assignedUserIds || []).includes(option.value)}
                      onCheckedChange={(checked) => handleAssignedUserChange(option.value, !!checked)}
                    />
                    <Label htmlFor={`user-${option.value}`} className="font-normal">{option.label}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="space-y-2">
            <Label htmlFor="productTypes">Product Types (comma-separated)</Label>
            <Textarea id="productTypes" value={(formData.productTypes || []).join(', ')} onChange={(e) => handleInputChange('productTypes', e.target.value.split(',').map(s => s.trim()))} />
          </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
