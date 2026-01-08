
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label as ShadcnLabel } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Edit2, Trash2, Plus, Save } from 'lucide-react';
import { Product, ProductPlan } from '../types';
import { supabase } from '@/integrations/supabase/client';

interface PlanManagementDialogProps {
  product: Product;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

const PlanManagementDialog = ({ product, trigger, onSuccess }: PlanManagementDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductPlan | null>(null);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    renewalPrice: '',
    billing: 'monthly' as 'monthly' | 'yearly' | 'one-time',
    isPopular: false,
    currency: 'inr' as 'inr' | 'usd',
    dollarPrice: '',
    dollarValue: '',
    portal_sku_id: '',
  });

  useEffect(() => {
    if (formData.currency === 'usd') {
      const dollarPrice = parseFloat(formData.dollarPrice);
      const dollarValue = parseFloat(formData.dollarValue);

      if (!isNaN(dollarPrice) && !isNaN(dollarValue) && dollarPrice > 0 && dollarValue > 0) {
        const inrPrice = dollarPrice * dollarValue;
        setFormData(prev => ({ ...prev, price: inrPrice.toFixed(2) }));
      }
    }
  }, [formData.dollarPrice, formData.dollarValue, formData.currency]);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      renewalPrice: '',
      billing: 'monthly',
      isPopular: false,
      currency: 'inr',
      dollarPrice: '',
      dollarValue: '',
      portal_sku_id: '',
    });
    setEditingPlan(null);
    setIsAddingPlan(false);
  };

  const handleEditPlan = (plan: ProductPlan) => {
    // If clicking edit on the plan that's already being edited, close the form.
    if (editingPlan?.id === plan.id) {
      resetForm();
      return;
    }
    setEditingPlan(plan); // Set the plan to be edited
    setIsAddingPlan(false); // Ensure the top-level "Add" form is hidden
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      renewalPrice: plan.renewalPrice?.toString() ?? '',
      billing: plan.billing as 'monthly' | 'yearly' | 'one-time',
      isPopular: plan.isPopular || false,
      portal_sku_id: plan.portal_sku_id || '',
      currency: plan.currency || 'inr',
      dollarPrice: '', // Reset for edit
      dollarValue: '', // Reset for edit
    });
  };

  const handleSavePlan = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields. name and price is required.",
        variant: "destructive",
      });
      return;
    }
    let finalPrice = parseFloat(formData.price);
    let finalRenewalPrice: number | undefined;

    if (formData.currency === 'usd') {
      if (!formData.dollarPrice || !formData.dollarValue) {
        toast({
          title: "Error",
          description: "Please provide Dollar Price and Dollar Value for converting.",
          variant: "destructive",
        });
        return;
      }
      finalPrice = parseFloat(formData.dollarPrice) * parseFloat(formData.dollarValue);
      if (formData.renewalPrice) {
        finalRenewalPrice = parseFloat(formData.renewalPrice) * parseFloat(formData.dollarValue);
      }
    } else {
      finalPrice = parseFloat(formData.price)
      finalRenewalPrice = formData.renewalPrice ? parseFloat(formData.renewalPrice) : undefined;
    }
    
    setIsSubmitting(true);

    const planData: ProductPlan = {
      id: editingPlan ? editingPlan.id : Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      // price: finalPrice,
      renewalPrice: formData.renewalPrice ? parseFloat(formData.renewalPrice) : undefined,
      currency: formData.currency ,
      billing: formData.billing,
      isPopular: formData.isPopular,
      portal_sku_id: formData.portal_sku_id,
    };

    const currentPlans = Array.isArray(product.plans) ? product.plans : [];
    let updatedPlans;

    if (editingPlan) {
      updatedPlans = currentPlans.map(plan => 
        plan.id === editingPlan.id ? planData : plan
      );
    } else {
      updatedPlans = [...currentPlans, planData];
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ plans: updatedPlans, last_edited_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Plan ${editingPlan ? 'updated' : 'added'} successfully!`,
      });
      
      onSuccess();
      resetForm();
    } catch (error: any) {
      toast({ title: "Error saving plan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const currentPlans = Array.isArray(product.plans) ? product.plans : [];
    const updatedPlans = currentPlans.filter(plan => plan.id !== planId);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ plans: updatedPlans, last_edited_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) throw error;
      toast({ title: "Success", description: "Plan deleted successfully!" });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error deleting plan", description: error.message, variant: "destructive" });
    }
  };

  const getBillingBadgeColor = (billing: string) => {
    switch (billing) {
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'yearly': return 'bg-purple-100 text-purple-800';
      case 'one-time': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const plans = Array.isArray(product.plans) ? product.plans : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Plans for {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Plan Button */}
          {!isAddingPlan && !editingPlan && (
            <Button onClick={() => { setIsAddingPlan(true); setEditingPlan(null); }}>
              <Plus size={16} className="mr-2" />
              Add New Plan
            </Button>
          )}

          {/* Add/Edit Plan Form */}
          {isAddingPlan && !editingPlan && (
            <Card>
              <CardHeader>
                <CardTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter plan name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal_sku_id">Portal SKU ID</Label>
                    <Input
                      id="portal_sku_id"
                      value={formData.portal_sku_id}
                      onChange={(e) => setFormData({ ...formData, portal_sku_id: e.target.value })}
                      placeholder="Enter Portal SKU ID"
                    />
                  </div>
                  <div>
                      <Label htmlFor="currency">Currency</Label>
                       <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value as  'inr' | 'usd'})}>
                         <SelectTrigger id="currency">
                           <SelectValue placeholder="Select currency" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="inr">INR</SelectItem>
                           <SelectItem value="usd">USD</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                  

                   {formData.currency === 'usd' && (
                    <>
                    <div className="space-y-2">
                         <Label htmlFor="dollarValue">Current Dollar Value *</Label>
                         <Input
                           id="dollarValue"
                           type="number"
                           min={0}
                           step="0.01"
                           value={formData.dollarValue}
                           onChange={(e) => setFormData({ ...formData, dollarValue: e.target.value })}
                           placeholder="Enter current dollar value"
                         />
                       </div>
                      <div className="space-y-2">
                         <Label htmlFor="dollarPrice">Dollar Price *</Label>
                         <Input
                           id="dollarPrice"
                           type="number"
                           min={0}
                           step="0.01"
                           value={formData.dollarPrice}
                           onChange={(e) => setFormData({ ...formData, dollarPrice: e.target.value })}
                           placeholder="Enter dollar price"
                         />
                       </div>
                       
                    </>
                   )}
                   <div className="space-y-2">
                    <Label htmlFor="price">Price per User (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      // disabled={formData.currency === 'usd'}
                      min={0}
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="Enter price per user"
                      step="0.01"
                      min="0"
                    />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="renewal-price">Renewal Price per User (₹)</Label>
                    <Input
                      id="renewal-price"
                      type="number"
                      // disabled={formData.currency === 'usd'}
                      min={0}
                      step="0.01"
                      value={formData.renewalPrice}
                      onChange={(e) => setFormData({ ...formData, renewalPrice: e.target.value })}
                      value={formData.renewalPrice}
                      onChange={(e) => setFormData({ ...formData, renewalPrice: e.target.value })}
                      placeholder="Optional: if different from new price"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="billing">Billing Cycle *</Label>
                  <Select value={formData.billing} onValueChange={(value: 'monthly' | 'yearly' | 'one-time') => setFormData({ ...formData, billing: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>

                

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPopular"
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                  />
                  <Label htmlFor="isPopular">Mark as Popular Plan</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSavePlan} disabled={isSubmitting}>
                    <Save size={16} className="mr-2" />
                    {isSubmitting ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Add Plan')}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Plans */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing Plans ({plans.length})</h3>
            {plans.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No plans available. Add your first plan above.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {plans.map((plan) => {
                  const isCurrentlyEditing = editingPlan?.id === plan.id;
                  return (
                    <div key={plan.id}>
                      <Card className={`relative transition-shadow hover:shadow-md ${plan.isPopular ? 'ring-2 ring-blue-500' : ''} ${isCurrentlyEditing ? 'ring-2 ring-primary' : ''}`}>
                        {plan.isPopular && (
                          <div className="absolute -top-3 left-4">
                            <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                          </div>
                        )}
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{plan.name}</h4>
                                <Badge className={getBillingBadgeColor(plan.billing)} variant="secondary">
                                  {plan.billing}
                                </Badge>
                              </div>
                              <div className="text-2xl font-bold">
                                ₹{plan.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                {plan.renewalPrice && plan.renewalPrice !== plan.price && (
                                  <span className="text-base font-normal text-muted-foreground ml-2">
                                    (Renews at ₹{plan.renewalPrice.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPlan(plan)}
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePlan(plan.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {isCurrentlyEditing && (
                        <Card className="mt-4 border-primary">
                          <CardHeader>
                            <CardTitle>Edit Plan: {plan.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Re-using the form logic here. This could be extracted to a sub-component for cleanliness. */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2"><Label htmlFor="name-edit">Plan Name *</Label><Input id="name-edit" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter plan name" /></div>
                              <div className="space-y-2"><Label htmlFor="portal_sku_id-edit">Portal SKU ID</Label><Input id="portal_sku_id-edit" value={formData.portal_sku_id} onChange={(e) => setFormData({ ...formData, portal_sku_id: e.target.value })} placeholder="Enter Portal SKU ID" /></div>
                              <div className="space-y-2">
                                <Label htmlFor="currency-edit">Currency</Label>
                                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value as 'inr' | 'usd' })}>
                                  <SelectTrigger id="currency-edit"><SelectValue placeholder="Select currency" /></SelectTrigger>
                                  <SelectContent><SelectItem value="inr">INR</SelectItem><SelectItem value="usd">USD</SelectItem></SelectContent>
                                </Select>
                              </div>
                              {formData.currency === 'usd' && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="dollarValue-edit">Current Dollar Value *</Label>
                                    <Input id="dollarValue-edit" type="number" min={0} step="0.01" value={formData.dollarValue} onChange={(e) => setFormData({ ...formData, dollarValue: e.target.value })} placeholder="Enter current dollar value" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="dollarPrice-edit">Dollar Price *</Label>
                                    <Input id="dollarPrice-edit" type="number" min={0} step="0.01" value={formData.dollarPrice} onChange={(e) => setFormData({ ...formData, dollarPrice: e.target.value })} placeholder="Enter dollar price" />
                                  </div>
                                </>
                              )}
                              <div className="space-y-2"><Label htmlFor="price-edit">New Price per User (₹) *</Label><Input id="price-edit" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Enter price per user" step="0.01" min="0" /></div>
                              <div className="space-y-2"><Label htmlFor="renewal-price-edit">Renewal Price per User (₹)</Label><Input id="renewal-price-edit" type="number" value={formData.renewalPrice} onChange={(e) => setFormData({ ...formData, renewalPrice: e.target.value })} placeholder="Optional: if different from new price" step="0.01" min="0" /></div>
                              <div className="space-y-2"><Label htmlFor="billing-edit">Billing Cycle *</Label><Select value={formData.billing} onValueChange={(value: 'monthly' | 'yearly' | 'one-time') => setFormData({ ...formData, billing: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem><SelectItem value="one-time">One-time</SelectItem></SelectContent></Select></div>
                            </div>
                            
                            <div className="flex items-center space-x-2"><Switch id="isPopular-edit" checked={formData.isPopular} onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })} /><Label htmlFor="isPopular-edit">Mark as Popular Plan</Label></div>
                            <div className="flex gap-2">
                              <Button onClick={handleSavePlan} disabled={isSubmitting}><Save size={16} className="mr-2" />{isSubmitting ? 'Saving...' : 'Update Plan'}</Button>
                              <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanManagementDialog;
