import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Partner } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { supabase } from '@/integrations/supabase/client';
import { Percent, History, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

import { useAuth } from '@/contexts/AuthContext';
interface DiscountHistoryItem {
  discount_in: string;
  updated_on: string;
}

interface AddPartnerDiscountDialogProps {
  partner: Partner;
  onSuccess: () => void;
  children: React.ReactNode;
}

export const AddPartnerDiscountDialog = ({ partner, onSuccess, children }: AddPartnerDiscountDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discount, setDiscount] = useState('');
  const [history, setHistory] = useState<DiscountHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
        console.error("User ID not available for logging CRM action.");
        return;
    }
    try {
        const formData = new FormData();
        formData.append('userid', user.id);
        formData.append('actiontype', actiontype);
        formData.append('path', 'Add Partner Discount Dialog');
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

  const fetchDiscountHistory = async () => {
    if (!partner.portal_reseller_id) return;
    setIsHistoryLoading(true);
    try {
      const formData = new FormData();
      formData.append('reseller_id', partner.portal_reseller_id);

      const response = await fetch(API_ENDPOINTS.GET_RESELLER_DISCOUNT_LIST_ONCRM, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data?.data_result) {
        setHistory(result.data.data_result);
      } else {
        setHistory([]);
        if (!result.success && result.message) {
          throw new Error(result.message);
        }
      }
    } catch (error: any) {
      // Don't show a toast for history, as it might just be empty.
      console.error("Could not fetch discount history:", error.message);
      setHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiscountHistory();
      // Pre-fill with existing discount if available
      setDiscount(partner.partner_discount?.toString() || '');
    }
  }, [isOpen, partner]);
  
  const handleSubmit = async () => {
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue)) {
      toast({
        title: "Error",
        description: "Please enter a valid number for the discount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update CRM via API
      const formData = new FormData();
      if (partner.portal_reseller_id) {
        formData.append('reseller_id', partner.portal_reseller_id);
      } else {
        throw new Error("Partner does not have a portal_reseller_id.");
      }
      formData.append('discount_value', discountValue.toString());
      console.log(formData)
      const response = await fetch(API_ENDPOINTS.ADD_RESELLER_DISCOUNT_ONCRM, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to add discount to CRM.');
      }

      // 2. Update Supabase database
      const { error: supabaseError } = await supabase
        .from('partners')
        .update({ partner_discount: discountValue })
        .eq('id', partner.id);

      if (supabaseError) {
        // Note: This could lead to data inconsistency if the CRM call succeeds but Supabase fails.
        // A more robust solution might involve a transactional approach on the backend.
        throw new Error(`CRM updated, but failed to save to database: ${supabaseError.message}`);
      }

      toast({
        title: "Success",
        description: "Discount added successfully.",
      });
      onSuccess();
      setDiscount('');
      const logDetails = `Set discount to ${discountValue}% for partner ${partner.name} (ID: ${partner.portal_reseller_id}).`;
      await logCrmAction("Add/Update Partner Discount", logDetails);
      await fetchDiscountHistory(); // Refresh history list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Discount for {partner.name}</DialogTitle>
          <DialogDescription>
            Enter the discount percentage for this partner.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="e.g., 10"
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center">
              <History className="mr-2 h-4 w-4" />
              Discount History
            </h4>
            <ScrollArea className="h-40 w-full rounded-md border p-2">
              {isHistoryLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading history...</span>
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                      <span className="font-semibold">{item.discount_in}%</span>
                      <span className="text-muted-foreground">
                        {new Date(item.updated_on).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No discount history found.
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Discount'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};