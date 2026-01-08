import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Customer } from '@/types';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SubscriptionDetail {
  skuName: string;
  status: string;
  plan: string;
  usedSeats: string;
  maxSeats: string;
  renewal_date: string;
  price: string | null;
  renewal_price?: string | null;
  billing_frequency: string | null;
}

interface PartnerDomainsDialogProps {
  customers: Customer[];
  partnerId: string;
  trigger: React.ReactNode;
}

export const PartnerDomainsDialog = ({ customers, partnerId, trigger }: PartnerDomainsDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetail[]>([]);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const { toast } = useToast();

  const filteredCustomers = (customers || []).filter(customer =>
    customer.domainName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // When the dialog opens with customers, select the first one automatically
    if (customers && customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    // When search term changes, update the selection if the current one is filtered out
    const selectedCustomerIsVisible = filteredCustomers.some(c => c.id === selectedCustomerId);

    if (!selectedCustomerIsVisible) {
      if (filteredCustomers.length > 0) {
        // If there are search results, select the first one
        setSelectedCustomerId(filteredCustomers[0].id);
      } else {
        // If no search results, clear the selection
        setSelectedCustomerId(null);
      }
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchSubscriptionDetails(selectedCustomerId, partnerId);
    } else {
      setSubscriptionDetails([]);
    }
  }, [selectedCustomerId, partnerId]);

  const fetchSubscriptionDetails = async (customerId: string, resellerId: string) => {
    setIsSubscriptionLoading(true);
    setSubscriptionDetails([]);
    try {
      const formData = new FormData();
      formData.append('cust_id', customerId);
      formData.append('reseller_id', resellerId);

      const response = await fetch(API_ENDPOINTS.GET_RESELLER_DOMAIN_SUBSCRIPTIONDETAILS, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.subscription_details) {
        setSubscriptionDetails(result.data.subscription_details);
      } else {
        setSubscriptionDetails([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch subscription details: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  const handleDomainClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  return (
    <Dialog onOpenChange={(open) => {
      // Reset state when the dialog is closed
      if (!open) {
        setSearchTerm('');
        setSelectedCustomerId(null);
        setSubscriptionDetails([]);
      }
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader className="mb-4">
          <DialogTitle>Associated Domains ({customers.length})</DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg p-4 flex-grow overflow-hidden"> {/* New container with border and padding */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
            {/* Left Pane: Domain List */}
            <div className="md:col-span-1 flex flex-col h-full border-r">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCustomerId(null);
                    }}
                  >
                    <X size={16} className="text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="overflow-y-auto space-y-2 pr-4 max-h-[600px]">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleDomainClick(customer.id)}
                      className={cn(
                        "p-2 border rounded-md text-sm cursor-pointer transition-colors",
                        selectedCustomerId === customer.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
                      )}
                    >
                      {customer.domainName}
                    </div>
                  ))
                ) : (
                  <p className="w-full text-center text-muted-foreground pt-10">
                    No domains found matching your search.
                  </p>
                )}
              </div>
            </div>

            {/* Right Pane: Subscription Details */}
            <div className="md:col-span-2 flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
              <div className="overflow-y-auto pr-2 max-h-[600px]">
                {isSubscriptionLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading details...</span>
                  </div>
                ) : !selectedCustomerId ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-center px-4">
                    {searchTerm && filteredCustomers.length === 0
                      ? "No domains found for your search."
                      : "Select a domain from the left to view its subscriptions."}
                  </div>
                ) : subscriptionDetails.length > 0 ? (
                  <div className="space-y-4">
                    {subscriptionDetails.map((sub, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex justify-between items-center text-base">
                            <span>{sub.skuName}</span>
                            <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'destructive'}>
                              {sub.status}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Plan</p>
                            <p className="font-medium">{sub.plan}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Seats</p>
                            <p className="font-medium">{sub.usedSeats || 'N/A'} / {sub.maxSeats || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium">{sub.price ? `₹${sub.price}` : 'N/A'}</p>
                          </div>
                          {sub.renewal_price && sub.renewal_price !== sub.price && (
                            <div>
                              <p className="text-muted-foreground">Renewal Price</p>
                              <p className="font-medium">₹{sub.renewal_price}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground">Billing</p>
                            <p className="font-medium">{sub.billing_frequency || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Renewal Date</p>
                            <p className="font-medium">{new Date(sub.renewal_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Subscription ID</p>
                            <p className="font-medium">{sub.subscriptionId}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Customer ID</p>
                            <p className="font-medium">{sub.customerId}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No subscription details found for this domain.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};