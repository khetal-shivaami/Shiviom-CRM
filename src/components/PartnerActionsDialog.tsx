import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Partner } from '../types';
import { Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api'
import { useAuth } from '@/contexts/AuthContext';


interface PartnerActionsDialogProps {
  partner: Partner;
  onSuccess: () => void;
}

export const PartnerActionsDialog = ({ partner, onSuccess }: PartnerActionsDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive'>(partner.status as 'active' | 'inactive');
  const [reason, setReason] = useState('');
  const [creditOption, setCreditOption] = useState<'credit' | 'non-credit'>('credit');

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
      console.error("User ID not available for logging CRM action.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('userid', user.id);
      formData.append('actiontype', actiontype);
      formData.append('path', 'Partner Actions Dialog');
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
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('reseller_id', partner.portal_reseller_id);
    formData.append('status', status);

    if (status === 'active') {
      formData.append('creditoption', creditOption);
    } else {
      formData.append('reason', reason);
    }

    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_RESELLER_ACCOUNT_FRM_CRM, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update partner status.');
      }

       const { error: supabaseError } = await supabase
        .from('partners')
        .update({ status: status })
        .eq('portal_reseller_id', partner.portal_reseller_id);

      if (supabaseError) {
        throw new Error(`CRM updated, but failed to save to database: ${supabaseError.message}`);
      }
      let logDetails = `Updated partner ${partner.name} (ID: ${partner.portal_reseller_id}) status to ${status}`;
      if (status === 'active') logDetails += ` with credit option: ${creditOption}`;
      else logDetails += ` with reason: ${reason}`;
      await logCrmAction("Update Partner Status", logDetails);
      toast({
        title: "Success",
        description: "Partner details have been updated successfully.",
      });
      onSuccess();
      setIsOpen(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit size={16} className="mr-1" />
          Actions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actions for {partner.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup
              value={status}
              onValueChange={(value: 'active' | 'inactive') => setStatus(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active">Activate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="inactive" />
                <Label htmlFor="inactive">Deactivate</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Reason Textarea */}
          {status === 'inactive' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Deactivation</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>
          )}

          {/* Credit Option */}
          {status === 'active' && (
            <div className="space-y-2">
              <Label>Credit Option</Label>
              <RadioGroup value={creditOption} onValueChange={(value: 'credit' | 'non-credit') => setCreditOption(value)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit">Credit Reseller</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non-credit" id="non-credit" />
                  <Label htmlFor="non-credit">Non-Credit Reseller</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};