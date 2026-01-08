import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, Users, Package, MessageSquare, Send, Calendar, IndianRupee, Loader2, Info, UserCheck, Users2, FileText, Repeat, ShieldCheck, ChevronDown, History, Edit, X } from 'lucide-react';
import { Customer, Partner, Product, User as UserType, Renewal, RenewalComment } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_ENDPOINTS } from '@/config/api';

interface CustomerDetailDialogProps {
  customer: Customer | null;
  renewals: Renewal[];
  partner: Partner | null;
  products: Product[];
  users: UserType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

interface RenewalHistoryItem {
  plan: string;
  skuName: string;
  shivaami_renewal_date: string;
  price: string;
  usedSeats?: string; // Assuming these are part of the history item from the API response
  maxSeats?: string; // Assuming these are part of the history item from the API response
}

const CustomerDetailDialog = ({ 
  customer, 
  renewals,
  partner, 
  products, 
  users, 
  open, 
  onOpenChange 
}: CustomerDetailDialogProps) => {
  const { user, profile } = useAuth();
  if (!customer) return null;

  const { toast } = useToast();
  const [comments, setComments] = useState<RenewalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetail[]>([]);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [activeRenewalForComments, setActiveRenewalForComments] = useState<Renewal | null>(null);
  const [openProductCards, setOpenProductCards] = useState<string[]>([]);
  const [renewalHistory, setRenewalHistory] = useState<RenewalHistoryItem[]>([]);
  const [openHistorySections, setOpenHistorySections] = useState<string[]>([]);
  const [isEditingMargin, setIsEditingMargin] = useState(false);
  const [partnerMargin, setPartnerMargin] = useState<string>('');
  const [isSavingMargin, setIsSavingMargin] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchComments = async () => {
    if (!activeRenewalForComments) return;
    try {
      const { data, error } = await supabase
        .from('renewal_comments')
        .select('*')
        .eq('renewal_id', activeRenewalForComments.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data.map(c => ({ ...c, created_at: new Date(c.created_at) })));
    } catch (error: any) {
      toast({ title: "Error fetching comments", description: error.message, variant: "destructive" });
    }
  };

  const fetchSubscriptionDetails = async () => {
    if (!renewals.length || !customer || !partner?.portal_reseller_id) return;
    
    setIsSubscriptionLoading(true);
    setSubscriptionDetails([]);
    try {
      const formData = new FormData();
      formData.append('cust_id', customer.id);
      formData.append('reseller_id', partner.portal_reseller_id);

      const response = await fetch(API_ENDPOINTS.GET_RESELLER_DOMAIN_SUBSCRIPTIONDETAILS, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      console.log(result)
      if (result.success && result.data?.subscription_details) {
        setSubscriptionDetails(result.data.subscription_details);
      } else {
        setSubscriptionDetails([]);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching subscription details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  const fetchRenewalHistory = async () => {
    if (!customer?.domainName || !user?.email) return;

    setIsHistoryLoading(true);
    setRenewalHistory([]);
    try {
      const payload = {
        domain_name: customer.domainName,
        email: user.email,
      };

      const response = await fetch(API_ENDPOINTS.GET_DOMAIN_RENEWAL_HISTORY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      console.log(result)
      if (result.success && result.data?.domains) {
        setRenewalHistory(result.data.domains);
      } else {
        setRenewalHistory([]);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching renewal history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchPartnerMargin = async () => {
    if (!partner?.portal_reseller_id) return;

    try {
      const { data, error } = await supabase
        .from('partners')
        .select('margin')
        .eq('portal_reseller_id', partner.portal_reseller_id)
        .single();

      if (error) throw error;

      if (data && data.margin !== null) {
        setPartnerMargin(data.margin.toString());
      } else {
        setPartnerMargin('');
      }
    } catch (error: any) {
      // Silently fail or show a non-intrusive toast
      console.error("Error fetching partner margin:", error.message);
    }
  };

  useEffect(() => {
    if (open && renewals.length > 0) {
      fetchRenewalHistory();
      setOpenProductCards([]); // Default all to collapsed
      setOpenHistorySections([]);
    } else {
      setIsEditingMargin(false);
      setPartnerMargin('');
      setIsSavingMargin(false);
      // Reset state when dialog closes or there are no renewals
      setActiveRenewalForComments(null);
      setComments([]);
      setOpenProductCards([]);
      setOpenHistorySections([]);
      setRenewalHistory([]);
    }

    if (open && partner) {
      fetchPartnerMargin();
    }
    if (open && renewals.length > 0) {
      setActiveRenewalForComments(renewals[0]);
      fetchSubscriptionDetails();
    }

  }, [open, renewals, customer, partner]);

  useEffect(() => {
    if (activeRenewalForComments) {
      fetchComments();
    }
  }, [activeRenewalForComments]);

  const handleSavePartnerMargin = async () => {
    if (!partner) return;
    console.log(partner)
    setIsSavingMargin(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({ margin: parseFloat(partnerMargin) || 0 })
        .eq('portal_reseller_id', partner.portal_reseller_id);

      if (error) throw error;

      toast({ title: "Partner margin updated successfully!" });
      setIsEditingMargin(false);
      // You might want to refetch the partner data on the parent component
      // to reflect the change everywhere.
    } catch (error: any) {
      toast({ title: "Error updating margin", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingMargin(false);
    }
  };


  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !activeRenewalForComments) return;

    setIsSubmitting(true);
    try {
      const creatorName = (profile?.first_name || profile?.last_name) 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : user.email;

      const { data, error } = await supabase
        .from('renewal_comments')
        .insert({
          renewal_id: activeRenewalForComments.id,
          comment: newComment,
          created_by_id: user.id,
          created_by_name: creatorName,
        })
        .select();

      if (error) throw error;

      setComments(prev => [ { ...data[0], created_at: new Date(data[0].created_at) }, ...prev]);
      setNewComment('');
      toast({ title: "Comment added successfully" });
    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignedUsers = customer.assignedUserIds 
    ? users.filter(u => customer.assignedUserIds?.includes(u.id))
    : [];

  const customerProducts = customer.productIds 
    ? products.filter(p => customer.productIds?.includes(p.id))
    : [];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getSubscriptionStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const groupedRenewalHistory = useMemo(() => {
    return renewalHistory.reduce((acc, item) => {
      if (!acc[item.skuName]) {
        acc[item.skuName] = [];
      }
      acc[item.skuName].push(item);
      return acc;
    }, {} as Record<string, RenewalHistoryItem[]>);
  }, [renewalHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <br></br>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={20} />
              <span>Customer Details :- {customer.domainName || customer.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className={cn("h-2.5 w-2.5 rounded-full", getStatusDotColor(customer.status))} />
              <span className="capitalize text-muted-foreground">{customer.status}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Partner Information */}
          {partner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Partner Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm font-medium">Partner Name</p>
                    <p className="text-sm text-muted-foreground">{partner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Partner Company</p>
                    <p className="text-sm text-muted-foreground">{partner.company}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{partner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{partner.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Specialization</p>
                    <p className="text-sm text-muted-foreground">{partner.specialization || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Partner Margin</p>
                    {isEditingMargin ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={partnerMargin}
                          onChange={(e) => setPartnerMargin(e.target.value)}
                          className="h-8 w-24"
                          placeholder="e.g. 10"
                        />
                        <Button size="sm" onClick={handleSavePartnerMargin} disabled={isSavingMargin}>
                          {isSavingMargin ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditingMargin(false)} className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{partnerMargin ? `${partnerMargin}%` : 'Not set'}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingMargin(true)}><Edit size={14} /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Renewal Details */}
          <div className="space-y-4">
            {renewals.map((renewal) => {
              const renewalProduct = products.find(p => p.id === renewal.productId);
              const subDetails = subscriptionDetails.find(sub => sub.skuName === renewalProduct?.name || products.find(p => p.name === sub.skuName)?.id === renewal.productId);
              const historyForProduct = renewalProduct ? groupedRenewalHistory[renewalProduct.name] || [] : [];

              const isOpen = openProductCards.includes(renewal.id);
              const isHistoryOpen = openHistorySections.includes(renewal.id);

              return (
                <Collapsible key={renewal.id} open={isOpen} onOpenChange={() => setOpenProductCards(prev => isOpen ? prev.filter(id => id !== renewal.id) : [...prev, renewal.id])}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package size={18} />
                            {renewalProduct?.name || 'Unknown Product'}
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={cn("capitalize", getSubscriptionStatusColor(renewal.status))}>
                              {renewal.status}
                            </Badge>
                            <ChevronDown size={20} className={cn("transform transition-transform", isOpen && "rotate-180")} />
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-start gap-3">
                            <IndianRupee size={18} className="text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Price</p>
                              <p className="text-muted-foreground font-semibold">₹{renewal.price.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Calendar size={18} className="text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Shivaami Renewal Date</p>
                              <p className="text-muted-foreground font-semibold">{renewal.shivaamiRenewalDate?.toLocaleDateString() || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Calendar size={18} className="text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Google Renewal Date</p>
                              <p className="text-muted-foreground font-semibold">{renewal.googleRenewalDate?.toLocaleDateString() || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <IndianRupee size={18} className="text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Total Value</p>
                              <p className="text-muted-foreground font-semibold">
                                {subDetails?.revenue_amt != null ? `₹${Number(subDetails.revenue_amt).toLocaleString('en-IN')}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      {isSubscriptionLoading ? (
                        <CardFooter>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading subscription details...
                          </div>
                        </CardFooter>
                      ) : subDetails ? (
                        <CardFooter className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
                          <div className="flex items-start gap-3">
                            <Repeat size={18} className="text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Billing Frequency</p>
                              <p className="text-muted-foreground">{subDetails.billing_frequency}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FileText size={18} className="text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Plan</p>
                              <p className="text-muted-foreground">{subDetails.plan}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Users2 size={18} className="text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Used Seats</p>
                              <p className="text-muted-foreground">{subDetails.usedSeats}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <UserCheck size={18} className="text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Max Seats</p>
                              <p className="text-muted-foreground">{subDetails.maxSeats}</p>
                            </div>
                          </div>
                        </CardFooter>
                      ) : (
                        <CardFooter>
                          <p className="text-sm text-muted-foreground">No additional subscription details found for this product.</p>
                        </CardFooter>
                      )}
                      {isHistoryLoading ? (
                        <CardFooter>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading renewal history...
                          </div>
                        </CardFooter>
                      ) : historyForProduct.length > 0 && (
                        <CardFooter className="border-t pt-4">
                          <Collapsible open={isHistoryOpen} onOpenChange={() => setOpenHistorySections(prev => isHistoryOpen ? prev.filter(id => id !== renewal.id) : [...prev, renewal.id])} className="w-full">
                            <CollapsibleTrigger asChild>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 cursor-pointer">
                                <History size={16} className="text-muted-foreground" />
                                Renewal History
                                <ChevronDown size={16} className={cn("transform transition-transform", isHistoryOpen && "rotate-180")} />
                              </h4>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="w-full text-xs max-h-48 overflow-y-auto mt-2">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left font-medium p-2">Date</th>
                                      <th className="text-left font-medium p-2">Plan</th>
                                      <th className="text-left font-medium p-2">SKU Name</th>
                                      <th className="text-left font-medium p-2">Licence Count</th>
                                      <th className="text-left font-medium p-2">Price</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {historyForProduct.map((item, index) => (
                                      <tr key={index} className="border-b last:border-b-0">
                                        <td className="p-2 text-muted-foreground">{item.shivaami_renewal_date}</td>
                                        <td className="p-2 text-muted-foreground">{item.plan}</td>
                                        <td className="p-2 text-muted-foreground">{item.skuName}</td>
                                        <td className="p-2 text-muted-foreground">
                                          {item.plan?.toLowerCase() === 'ANNUAL' ? item.maxSeats : item.usedSeats}
                                        </td>
                                        <td className="p-2 text-muted-foreground">{item.price || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </CardFooter>
                      )}
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          
          {/* Assigned Users */}
          {assignedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users size={18} />
                  Assigned Users ({assignedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products */}
          {customerProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package size={18} />
                  Products ({customerProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerProducts.map((product) => (
                    <div key={product.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-2">{product.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Renewal Comments */}
          {renewals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare size={18} />
                  Renewal Comments
                </CardTitle>
                <CardDescription>
                  Comments for: <strong>{products.find(p => p.id === activeRenewalForComments?.productId)?.name || '...'}</strong>
                  <br></br>
                  <br></br>
                  {renewals.length > 1 && (
                    <Select value={activeRenewalForComments?.id} onValueChange={(renewalId) => setActiveRenewalForComments(renewals.find(r => r.id === renewalId) || null)}>
                      <SelectTrigger className="w-auto h-auto p-1 text-xs ml-2">
                        <SelectValue placeholder="Change Product" />
                      </SelectTrigger>
                      <SelectContent>{renewals.map(r => <SelectItem key={r.id} value={r.id}>{products.find(p => p.id === r.productId)?.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Comment History (Left Side) */}
                  <div className="md:col-span-2 space-y-3 max-h-72 overflow-y-auto pr-4 border-r">
                    {comments.length > 0 ? comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{comment.created_by_name || 'User'}</span>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-muted-foreground">{comment.comment}</p>
                      </div>
                    )) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No comments yet.
                      </div>
                    )}
                  </div>

                  {/* Add Comment (Right Side) */}
                  <div className="space-y-3">
                    <Label htmlFor="new-comment">Add a comment</Label>
                    <Textarea
                      id="new-comment"
                      placeholder="Type your comment here..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()} className="w-full">
                      <Send size={16} className="mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailDialog;