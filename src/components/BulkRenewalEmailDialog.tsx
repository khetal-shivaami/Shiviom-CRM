import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Renewal, Customer, Partner, User, Product } from '../types';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, X } from 'lucide-react';

interface SubscriptionDetail {
  skuName: string;
  plan: string;
  usedSeats: string;
  maxSeats: string;
}

interface BulkRenewalEmailDialogProps {
  renewals: Renewal[];
  customers: Customer[];
  partners: Partner[];
  products: Product[];
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BulkRenewalEmailDialog = ({
  renewals,
  customers,
  partners,
  products,
  users,
  open,
  onOpenChange,
}: BulkRenewalEmailDialogProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  // Common email states
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [primaryCC, setPrimaryCC] = useState('');
  const [additionalCCs, setAdditionalCCs] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [selectedRenewalIds, setSelectedRenewalIds] = useState<string[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<Record<string, SubscriptionDetail[]>>({});
  const defaultHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Renewal Notification</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f6f9fc; margin:0; padding:0; }
    .container { max-width:700px; background-color:#fff; margin:40px auto; padding:30px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);}
    .header { text-align:center; border-bottom:1px solid #ddd; padding-bottom:20px; }
    .header img { max-width:140px; margin-bottom:10px; }
    .header h2 { margin:0; color:#333; }
    .content { padding:20px 0; color:#444; line-height:1.6; }
    table { width:100%; border-collapse:collapse; margin-top:15px; }
    table th, table td { border:1px solid #ddd; padding:8px; text-align:left; font-size:14px; }
    table th { background-color:#f2f2f2; color:#333; }
    .section-title { margin-top:30px; font-weight:bold; color:#333; }
    .note { font-size:14px; color:#666; margin-top:15px; }
    .footer { font-size:13px; color:#999; text-align:center; margin-top:30px; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <img src="https://storage.googleapis.com/shiviom-website-content/company_logo/shiviom.png" alt="Shiviom Logo" />
    <h2>Renewal Notification</h2>
  </div>
  <div class="content">
    <p>Dear Sir/Madam,</p>
    <p>Greetings from <strong>Shiviom</strong>. We appreciate your business and look forward to serving you more.</p>
    <p>This is to inform you that one or more licenses associated with your account are set to expire soon. Please review the renewal details below.</p>
    <p class="section-title">Account Information</p>
    <table>
      <thead>
        <tr>
          <th>Domain Name</th>
          <th>Licenses</th>
          <th>Product Name</th>
          <th>Renewal Date</th>
        </tr>
      </thead>
      <tbody>
        {product_details}
      </tbody>
    </table>
    <p class="section-title">Company Details (Please Verify & Confirm)</p>
    <p class="note">
      Request you to check the below company details and confirm the same.
      In case of any change, please update and write back to us.
      <strong>Invoice once issued will not be revised.</strong>
    </p>
    <table>
      <tbody>
        <tr><th>Company Name</th><td>{company_name}</td></tr>
        <tr><th>Company Billing Address</th><td>Please provide this detail</td></tr>
        <tr><th>GST No</th><td>Please provide this detail</td></tr>
        <tr><th>Contact Person Name</th><td>Please provide this detail</td></tr>
        <tr><th>Contact No</th><td>{contact_no}</td></tr>
        <tr><th>Email ID</th><td>{email_id}</td></tr>
        <tr><th>Payment / Credit Term</th><td>100% advance before renewal</td></tr>
        <tr><th>Subscription</th><td>Yearly commitment</td></tr>
      </tbody>
    </table>
    <p>Send us the confirmation once payment is made. <strong>Email confirmation is mandatory</strong> to continue services.</p>
    <p>Visit our website <a href="https://www.shiviom.com" target="_blank">www.shiviom.com</a> to explore cloud-based products suitable for your organisation.</p>
    <p class="section-title">Terms & Conditions</p>
    <ul class="note">
      <li>Google price change effective from March 2025 may apply to renewals.</li>
      <li>Suspended accounts will be renewed at revised prices as per Google policy.</li>
      <li>Advance payment is mandatory for renewals.</li>
      <li>Support charges of Rs. 1000 per domain are applicable.</li>
      <li>Transfer Token required if admin access is blocked or 2-step verification is enabled.</li>
      <li>Google billing emails can be ignored; renewals are handled by us.</li>
      <li>Auto-suspended services will lose data after 60 days as per Google policy.</li>
      <li>We also deal with Microsoft services. Visit <strong>axima.in</strong>.</li>
      <li>To avail discounted price: Admin Console → Manage Users → Billing → License Settings → Turn off Auto-Licensing.</li>
    </ul>
    <p>Best regards,<br/>Shiviom Renewal Team</p>
  </div>
  <div class="footer">
    © 2025 Shiviom Cloud LLP. All rights reserved.
  </div>
</div>
</body>
</html>`;


  const partner = useMemo(() => {
    if (!renewals.length) return null;
    return partners.find(p => p.id === renewals[0].partnerId);
  }, [renewals, partners]);


  useEffect(() => {
    if (open && partner) {
      const initializeDialog = async () => {
        // Fetch subscription details for all relevant customers
        const customerIds = [...new Set(renewals.map(r => r.customerId))];
        const details: Record<string, SubscriptionDetail[]> = {};
        if (partner.portal_reseller_id) {
          const promises = customerIds.map(async (customerId) => {
            const formData = new FormData();
            formData.append('cust_id', customerId);
            formData.append('reseller_id', partner.portal_reseller_id);

            try {
              const response = await fetch(API_ENDPOINTS.GET_RESELLER_DOMAIN_SUBSCRIPTIONDETAILS, {
                method: 'POST',
                body: formData,
              });
              if (response.ok) {
                const result = await response.json();
                if (result.success && result.data?.subscription_details) {
                  details[customerId] = result.data.subscription_details;
                }
              }
            } catch (e) {
              console.error(`Failed to fetch subscription details for customer ${customerId}`, e);
            }
          });
          await Promise.all(promises);
        }
        setSubscriptionDetails(details);

        // Set initial selected renewals, excluding 'FREE' plans
        const initialSelectedIds = renewals.filter(renewal => {
          const product = products.find(p => p.id === renewal.productId);
          const customerSubs = details[renewal.customerId];
          if (!customerSubs || !product) return true; // Default to select if details are missing

          const subDetail = customerSubs.find(s => s.skuName === product.name);
          return subDetail?.plan?.toUpperCase() !== 'FREE';
        }).map(r => r.id);
        setSelectedRenewalIds(initialSelectedIds);

        // Set other initial states
        const assignedEmployee = users.find(u => u.id === partner?.assignedUserIds?.[0]);
        setPrimaryCC(assignedEmployee?.email || '');
        setAdditionalCCs([]);
        setCcInput('');
        setSubject(`Renewal Notification for ${partner?.company || 'your account'}`);
      };

      initializeDialog();
    } else if (!open) {
      // Reset state when dialog closes
      setSubscriptionDetails({});
      setSelectedRenewalIds([]);
    }
  }, [open, renewals, partner, users, products]);

  useEffect(() => {
    if (!open || !partner) return;

    const selectedRenewals = renewals.filter(r => selectedRenewalIds.includes(r.id));

    const productDetailsHtml = selectedRenewals.map(renewal => {
      const customer = customers.find(c => c.id === renewal.customerId);
      const product = products.find(p => p.id === renewal.productId);
      const customerSubs = subscriptionDetails[renewal.customerId];
      const subDetail = customerSubs?.find(s => s.skuName === product?.name);

      let licenseCount = 'N/A';
      if (subDetail) {
        if (subDetail.plan?.toUpperCase() === 'FLEXIBLE') {
          licenseCount = subDetail.usedSeats;
        } else if (subDetail.plan?.toUpperCase() === 'ANNUAL') {
          licenseCount = subDetail.maxSeats;
        }
      }
      return `
        <tr>
          <td>${customer?.domainName || 'N/A'}</td>
          <td>${licenseCount}</td>
          <td>${product?.name || 'N/A'}</td>
          <td>${renewal.renewalDate.toLocaleDateString()}</td>
        </tr>
      `;
    }).join('');

    const finalBody = defaultHtmlTemplate
      .replace('{product_details}', productDetailsHtml)
      .replace('{company_name}', partner.company || 'N/A')
      .replace('{contact_no}', partner.phone || 'N/A')
      .replace('{email_id}', partner.email || 'N/A');

    setBody(finalBody);
  }, [selectedRenewalIds, open, renewals, customers, products, partner, defaultHtmlTemplate, subscriptionDetails]);

  const handleAddCC = () => {
    if (ccInput && ccInput.includes('@') && !additionalCCs.includes(ccInput)) {
      setAdditionalCCs(prev => [...prev, ccInput]);
      setCcInput('');
    }
  };

  const handleRemoveCC = (email: string) => {
    setAdditionalCCs(prev => prev.filter(cc => cc !== email));
  };

  const handleSendAll = async () => {
    setIsLoading(true);
    try {
      if (!partner) throw new Error("Partner not found");

      const allCCs = [primaryCC, ...additionalCCs, user?.email].filter(Boolean);

      const payload = {
        to: partner.email,
        cc: allCCs,
        subject: subject,
        body: body,
        renewalIds: selectedRenewalIds, // Sending an array of IDs
        templateUsed: 'Bulk HTML Template',
      };

      const response = await fetch(API_ENDPOINTS.SEND_BULK_RENEWAL_NOTIFICATION_FRMCRM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });


      try {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send email.');
        }

        toast({
          title: 'Email Sent Successfully',
          description: `Bulk renewal notification sent to ${partner.name}.`,
        });
      }
      catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
      onOpenChange(false);
    }
    catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerDomain = (customerId: string) =>
    customers.find((c) => c.id === customerId)?.domainName || 'Unknown';

  const handleRenewalSelectionChange = (renewalId: string, isSelected: boolean) => {
    setSelectedRenewalIds(prev =>
      isSelected ? [...prev, renewalId] : prev.filter(id => id !== renewalId)
    );
  };

  const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRenewalIds(renewals.map(r => r.id));
    } else {
      setSelectedRenewalIds([]);
    }
  };

  const areAllSelected = renewals.length > 0 && selectedRenewalIds.length === renewals.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Send Bulk Renewal Notifications</DialogTitle>
          <DialogDescription>
            Select an email template for each renewal. You can review and send them all at once.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 max-h-[70vh]">
          {/* Left Side: Configuration */}
          <div className="space-y-4 md:col-span-3">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="primary-cc">Primary CC</Label>
                <Input id="primary-cc" value={primaryCC} onChange={(e) => setPrimaryCC(e.target.value)} />
              </div>

            </div>
            <div>
              <Label>Additional CCs</Label>
              <div className="flex gap-2">
                <Input
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  placeholder="Add email..."
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCC(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddCC}>Add</Button>
              </div>
            </div>
            {additionalCCs.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {additionalCCs.map(email => (
                  <Badge key={email} variant="secondary">
                    {email}
                    <button onClick={() => handleRemoveCC(email)} className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="select-all-renewals" checked={areAllSelected} onCheckedChange={handleSelectAllChange} />
                <Label htmlFor="select-all-renewals" className="text-sm font-medium">Select All Products ({selectedRenewalIds.length} / {renewals.length})</Label>
              </div>
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {renewals.map(renewal => (
                    <div key={renewal.id} className="flex items-center space-x-2">
                      <Checkbox id={`renewal-${renewal.id}`} checked={selectedRenewalIds.includes(renewal.id)} onCheckedChange={(checked) => handleRenewalSelectionChange(renewal.id, !!checked)} />
                      <Label htmlFor={`renewal-${renewal.id}`} className="text-sm font-normal">{getCustomerDomain(renewal.customerId)} - {products.find(p => p.id === renewal.productId)?.name}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          {/* Right Side: Preview */}
          <div className="space-y-2 md:col-span-7">
            <Label>Email Preview</Label>
            <div className="border rounded-md h-[55vh] overflow-hidden">
              <iframe srcDoc={body} className="w-full h-full" title="Email Preview" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendAll} disabled={isLoading || selectedRenewalIds.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              `Send Email (${selectedRenewalIds.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkRenewalEmailDialog;