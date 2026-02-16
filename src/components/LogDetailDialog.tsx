import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import React from 'react';
import {
  LicTransaction,
  ApiLogDetail,
  ExternalApiLogDetail,
  LoginLogDetail,
} from './Transactions';

interface LogDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logType: 'licTransaction' | 'apiLog' | 'externalApiLog' | 'loginLog' | null;
  logData: LicTransaction | ApiLogDetail | ExternalApiLogDetail | LoginLogDetail | null;
}

const LogDetailDialog: React.FC<LogDetailDialogProps> = ({ isOpen, onClose, logType, logData }) => {
  if (!logData || !logType) {
    return null;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'ACTIVE':
      case 'COMPLETED':
        return 'default'; // Green-ish
      case 'FAILED':
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive'; // Red-ish
      case 'PENDING':
      case 'IN-PROGRESS':
        return 'secondary'; // Yellow-ish or neutral
      default:
        return 'outline'; // Default neutral
    }
  };

  const renderDetails = () => {
    switch (logType) {
      case 'licTransaction':
        const lic = logData as LicTransaction;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="col-span-full text-lg font-semibold border-b pb-2 mb-2">Transaction Information</div>
            <div><Label>Transaction ID</Label><p className="text-sm font-medium">{lic.tid || 'N/A'}</p></div>
            <div><Label>Status</Label><Badge variant={getStatusBadgeVariant(lic.status)}>{lic.status || 'N/A'}</Badge></div>
            {/* <div><Label>Merchant Order ID</Label><p className="text-sm font-medium">{lic.merchant_order_id || 'N/A'}</p></div> */}
            {/* <div><Label>Payment ID</Label><p className="text-sm font-medium">{lic.paymentid || 'N/A'}</p></div> */}
            <div><Label>Order Amount</Label><p className="text-sm font-medium">{lic.order_amount ? `₹${parseFloat(lic.order_amount).toLocaleString('en-IN')}` : 'N/A'}</p></div>
            <div><Label>Payment Mode</Label><p className="text-sm font-medium">{lic.paymentmode || 'N/A'}</p></div>
            <div><Label>Product Info</Label><p className="text-sm font-medium">{lic.product_info || 'N/A'}</p></div>
            <div><Label>Plan Name</Label><p className="text-sm font-medium">{lic.skuid || 'N/A'}</p></div>
            <div><Label>Domain Name</Label><p className="text-sm font-medium">{lic.domainname || 'N/A'}</p></div>
            <div><Label>Number of Users</Label><p className="text-sm font-medium">{lic.numberOfUser || 'N/A'}</p></div>
            <div><Label>Execution Date</Label><p className="text-sm font-medium">{lic.transactionExecutionDate ? new Date(lic.transactionExecutionDate).toLocaleString() : 'N/A'}</p></div>
            <div><Label>Transaction For</Label><p className="text-sm font-medium">{lic.transactionFor || 'N/A'}</p></div>
            <div><Label>Created By</Label><p className="text-sm font-medium">{lic.reseller_name || 'N/A'}</p></div>
            <div><Label>Created On</Label><p className="text-sm font-medium">{lic.createdon ? new Date(lic.createdon.replace(/(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})/, '$3-$2-$1T$4:$5:$6')).toLocaleString() : 'N/A'}</p></div>
            {/* <div><Label>Created From</Label><p className="text-sm font-medium">{lic.createdFrom || 'N/A'}</p></div> */}

            <div className="col-span-full text-lg font-semibold border-b pb-2 mb-2 mt-4">Associated IDs</div>
            {/* <div><Label>Customer ID</Label><p className="text-sm font-medium">{lic.customer_id || 'N/A'}</p></div> */}
            <div><Label>Subscription ID</Label><p className="text-sm font-medium">{lic.subscription_id || 'N/A'}</p></div>
            {/* <div><Label>Zoho Invoice ID</Label><p className="text-sm font-medium">{lic.zohoinvoiceid || 'N/A'}</p></div> */}
            <div><Label>Zoho Invoice Number</Label><p className="text-sm font-medium">{lic.zoho_invoice_number || 'N/A'}</p></div>
            {/* <div><Label>Invoice Type</Label><p className="text-sm font-medium">{lic.invoice_type || 'N/A'}</p></div> */}
            <div><Label>Cust ID</Label><p className="text-sm font-medium">{lic.cust_id || 'N/A'}</p></div>
            <div><Label>Reseller ID</Label><p className="text-sm font-medium">{lic.reseller_id || 'N/A'}</p></div>

            {/* <div className="col-span-full text-lg font-semibold border-b pb-2 mb-2 mt-4">Sync Statuses</div>
            <div><Label>Sync Status 1</Label><Badge variant={getStatusBadgeVariant(lic.sync_status)}>{lic.sync_status || 'N/A'}</Badge></div>
            <div><Label>Sync Status 2</Label><Badge variant={getStatusBadgeVariant(lic.sync_status2)}>{lic.sync_status2 || 'N/A'}</Badge></div>
            <div><Label>Sync Status 3</Label><Badge variant={getStatusBadgeVariant(lic.sync_status3)}>{lic.sync_status3 || 'N/A'}</Badge></div>
            <div><Label>Sync Status 4</Label><Badge variant={getStatusBadgeVariant(lic.sync_status4)}>{lic.sync_status4 || 'N/A'}</Badge></div>
            <div><Label>Sync Status 5</Label><Badge variant={getStatusBadgeVariant(lic.sync_status5)}>{lic.sync_status5 || 'N/A'}</Badge></div>
            <div><Label>Cron</Label><p className="text-sm font-medium">{lic.cron || 'N/A'}</p></div> */}
          </div>
        );
      case 'apiLog':
        const api = logData as ApiLogDetail;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div><Label>ID</Label><p className="text-sm font-medium">{api.ID || 'N/A'}</p></div>
            <div><Label>API Name</Label><p className="text-sm font-medium">{api.api_name || 'N/A'}</p></div>
            <div><Label>Datetime</Label><p className="text-sm font-medium">{api.datetime ? new Date(api.datetime).toLocaleString() : 'N/A'}</p></div>
            <div><Label>Flag</Label><p className="text-sm font-medium">{api.flag || 'N/A'}</p></div>
            <div><Label>API Status Code</Label><p className="text-sm font-medium">{api.api_status_code || 'N/A'}</p></div>
            <div><Label>Message</Label><p className="text-sm font-medium">{api.message || 'N/A'}</p></div>
            <div><Label>Error</Label><p className="text-sm font-medium">{api.error || 'N/A'}</p></div>
            <div><Label>IP Address</Label><p className="text-sm font-medium">{api.ip_address || 'N/A'}</p></div>
            <div className="col-span-full"><Label>Input Parameter</Label><p className="text-sm font-medium break-all bg-muted p-2 rounded-md">{api.input_parameter || 'N/A'}</p></div>
          </div>
        );
      case 'externalApiLog':
        const extApi = logData as ExternalApiLogDetail;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div><Label>ID</Label><p className="text-sm font-medium">{extApi.id || 'N/A'}</p></div>
            <div><Label>Created At</Label><p className="text-sm font-medium">{extApi.created_at ? new Date(extApi.created_at).toLocaleString() : 'N/A'}</p></div>
            <div><Label>URL</Label><p className="text-sm font-medium break-all">{extApi.url || 'N/A'}</p></div>
            <div><Label>Response Status</Label><p className="text-sm font-medium">{extApi.response_status || 'N/A'}</p></div>
            <div><Label>IP</Label><p className="text-sm font-medium">{extApi.ip || 'N/A'}</p></div>
            <div><Label>Reseller ID</Label><p className="text-sm font-medium">{extApi.reseller_id || 'N/A'}</p></div>
            <div><Label>Reseller Email</Label><p className="text-sm font-medium">{extApi.reseller_email || 'N/A'}</p></div>
            <div className="col-span-full"><Label>Request</Label><p className="text-sm font-medium break-all bg-muted p-2 rounded-md">{extApi.request || 'N/A'}</p></div>
            <div className="col-span-full"><Label>Response</Label><p className="text-sm font-medium break-all bg-muted p-2 rounded-md">{extApi.response || 'N/A'}</p></div>
          </div>
        );
      case 'loginLog':
        const login = logData as LoginLogDetail;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div><Label>ID</Label><p className="text-sm font-medium">{login.id || 'N/A'}</p></div>
            <div><Label>Email</Label><p className="text-sm font-medium">{login.email || 'N/A'}</p></div>
            <div><Label>Datetime</Label><p className="text-sm font-medium">{login.datetime ? new Date(login.datetime).toLocaleString() : 'N/A'}</p></div>
            <div><Label>Role</Label><p className="text-sm font-medium">{login.role || 'N/A'}</p></div>
          </div>
        );
      default:
        return <p>No details available.</p>;
    }
  };

  const getDialogTitle = () => {
    switch (logType) {
      case 'licTransaction': return 'License Transaction Details';
      case 'apiLog': return 'Internal API Log Details';
      case 'externalApiLog': return 'External API Log Details';
      case 'loginLog': return 'Login Log Details';
      default: return 'Log Details';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Detailed information for the selected log entry.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4 -mx-4"> {/* Added padding to the content inside scroll area */}
          <div className="px-4">
            {renderDetails()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LogDetailDialog;
