import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types/customer';
import { Partner, Product, User, Plan } from '../types';
import CustomerBasicInfoForm from './CustomerBasicInfoForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import CustomerStatusForm from './CustomerStatusForm';
import CustomerAssignmentForm from './CustomerAssignmentForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Edit, X, Save, Plus, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DealProduct } from '@/types/dealProduct';
import { cn } from '@/lib/utils';

interface CustomerEditDialogProps {
  customer: Customer | null;
  partners: Partner[];
  products: Product[];
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCustomer: Customer) => void;
}

const CustomerEditDialog = ({ 
  customer, 
  partners: initialPartners, 
  users,
  isOpen, 
  onClose, 
  onSuccess 
}: CustomerEditDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const currentUserProfile = useMemo(() => users.find(u => u.id === user?.id), [users, user]);
  const isSalesRole = useMemo(() => !!currentUserProfile && ['isr', 'fsr', 'bde'].includes(currentUserProfile.role), [currentUserProfile]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    customer_domain: '',
    partnerId: '',
    value: '',
    zone: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    process: 'prospect' as 'prospect' | 'demo' | 'poc' | 'negotiating' | 'lost' | 'won' | 'deployment',
    caseType: '',
    contractDuration: ''
  });
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Product[]>([]);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);

  // State for deal/product configuration
  const [planType, setPlanType] = useState('Yearly');
  const [planDuration, setPlanDuration] = useState<number | ''>(1);
  const [selectedOem, setSelectedOem] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [licenseCount, setLicenseCount] = useState<number | ''>('');
  const [addedProducts, setAddedProducts] = useState<DealProduct[]>([]);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  console.log(customer)
  useEffect(() => {
    if (customer) {
      // If deal_products exists and is an array, use it. Otherwise, initialize as empty.
      const initialDealProducts = customer.deal_products && Array.isArray(customer.deal_products)
        ? customer.deal_products.map((p: any) => ({ ...p, id: p.id || Date.now() + Math.random() })) // Ensure ID exists
        : [];
      setAddedProducts(initialDealProducts);

      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        customer_domain: customer.customer_domain,
        partnerId: customer.partnerId || '',
        value: customer.value.toString(),
        zone: customer.zone || '',
        status: customer.status,
        process: customer.process || 'prospect',
        caseType: customer.case_type || '',
        contractDuration: customer.contract_duration || ''
      });
      const existingAssignment = customer.assignedUserIds?.[0];
      if (existingAssignment) {
        setAssignedUserId(existingAssignment);
      } else if (isSalesRole && currentUserProfile) {
        setAssignedUserId(currentUserProfile.id);
      } else {
        setAssignedUserId('none');
      }
    }
  }, [customer, isSalesRole, currentUserProfile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      setIsLoading(true);
      try {
        const productsPromise = supabase.from('products').select('id, name, category, plans, product_type, status, price, description');
        const { data, error } = await productsPromise;
        if (error) throw error;
        const allProducts = data || [];
        const mainProducts = allProducts.filter(p => p.product_type === 'main_product');
        const addonProducts = allProducts.filter(p => p.product_type === 'add_on_service' && p.status === 'active');
        setProducts(mainProducts as Product[]);
        setAddons(addonProducts as Product[]);
      } catch (error: any) {
        console.error("Error fetching products/addons:", error);
        toast({ title: 'Error fetching products', description: error.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen, toast]);

  useEffect(() => {
    const totalValue = addedProducts.reduce((acc, product) => acc + (product.shivaamisubtotal || 0), 0);
    setFormData(prevFormData => ({
      ...prevFormData,
      value: String(Math.round(totalValue))
    }));
  }, [addedProducts]);

  // Effects to handle dependent dropdowns for editing
  useEffect(() => {
    if (editingProductId) {
      const productToEdit = addedProducts.find(p => p.id === editingProductId);
      if (productToEdit && selectedOem === productToEdit.oemName) {
        setSelectedProduct(productToEdit.productName);
      }
    }
  }, [selectedOem, editingProductId, addedProducts]);

  useEffect(() => {
    if (editingProductId) {
      const productToEdit = addedProducts.find(p => p.id === editingProductId);
      // Ensure we have the correct product list for the selected OEM before finding the plan
      const product = products.find(p => p.category === selectedOem && p.name === selectedProduct);
      const plan = product?.plans?.find(pl => pl.name === productToEdit?.skuName);
      if (plan) setSelectedSku(plan.id);
    }
  }, [selectedProduct, editingProductId, addedProducts, products, selectedOem]);

  // Derived state for product dropdowns
  const oems = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);
  const productsForOem = useMemo(() => 
    products.filter(p => p.category === selectedOem).map(p => p.name), 
    [products, selectedOem]
  );
  const skusForProduct = useMemo(() => {
    const product = products.find(p => p.category === selectedOem && p.name === selectedProduct);
    return product?.plans || [];
  }, [products, selectedOem, selectedProduct]);

  const resetProductForm = () => {
    setSelectedOem(''); setSelectedProduct(''); setSelectedSku('');
    setLicenseCount(''); setEditingProductId(null);
  };
  
  const handleAddOrUpdateProduct = async () => {
    if (!selectedSku || !licenseCount || planDuration === '') {
      toast({ title: "Missing Information", description: "Please select a SKU, license count, and plan duration.", variant: "destructive" });
      return;
    }
    
    const partner = partners.find(p => p.id === formData.partnerId);
    const partnerDiscount = partner?.partner_discount ?? 0;
    const plan = skusForProduct.find(p => p.id === selectedSku);

    if (!plan) {
      toast({ title: "Error", description: "Selected plan not found.", variant: "destructive" });
      return;
    }

    const listPrice = plan.price;
    const shivaamiPrice = listPrice * (1 - (partnerDiscount / 100));
    const shivaamiSubtotal = shivaamiPrice * Number(licenseCount) * (Number(planDuration)*12);

    const productData: DealProduct = {
      id: editingProductId || Date.now(), 
      oemName: selectedOem, 
      productName: selectedProduct, 
      skuName: plan.name, 
      licenseCount: licenseCount, 
      planType: planType,
      planDuration: planDuration,
      pr_skuprice: listPrice,
      pr_shivaamiprice: shivaamiPrice,
      shivaamisubtotal: shivaamiSubtotal,
      skuDiscount: 0, // Defaulting, can be adjusted
      portal_sku_id: plan.portal_sku_id || '',
    };
  
    if (editingProductId) {
      setAddedProducts(prev => prev.map(p => p.id === editingProductId ? productData : p));
    } else {
      setAddedProducts(prev => [...prev, productData]);
    }
    resetProductForm();
  };

  const handleAddAddon = (addonDetails: Product) => {
    if (!addonDetails || addonDetails.price == null) {
      toast({ title: "Add-on Error", description: "Selected add-on details or price not found.", variant: "destructive" });
      return;
    }

    const newAddonProduct: DealProduct = {
      id: Date.now() + Math.random(), // Ensure unique ID
      productName: addonDetails.name,
      skuName: addonDetails.name, // For add-ons, SKU name can be the product name
      licenseCount: 1, // Add-ons are typically a single item
      planType: 'One-time', // Or adjust as needed
      planDuration: 0, // Not applicable for one-time
      pr_shivaamiprice: addonDetails.price,
      pr_skuprice: addonDetails.price,
      shivaamisubtotal: addonDetails.price,
    };

    setAddedProducts(prev => [...prev, newAddonProduct]);
    toast({ title: "Add-on Added", description: `"${addonDetails.name}" has been added to the deal.` });
  };

  
  const handleEditProduct = (productId: number) => {
    const productToEdit = addedProducts.find(p => p.id === productId);
    if (productToEdit) {
      setEditingProductId(productId);
      setSelectedOem(productToEdit.oemName);
      setLicenseCount(productToEdit.licenseCount);
      setPlanType(productToEdit.planType);
      setPlanDuration(productToEdit.planDuration);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
    if (editingProductId === productId) resetProductForm();
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      logFormData.append('path', 'Customer Edit Dialog');
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || !formData.name || !formData.email || !formData.company) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const assignedUser = users.find(u => u.id === assignedUserId);

    const updatesForSupabase = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      customer_domain: formData.customer_domain,
      status: formData.status,
      process: formData.process,
      partner_id: formData.partnerId || null,
      deal_products: addedProducts.length > 0 ? addedProducts : null,
      case_type: formData.caseType || null,
      value: parseInt(formData.value) || 0,
      contract_duration: formData.contractDuration || null,
      zone: formData.zone || null,
      assigned_user_ids: assignedUserId && assignedUserId !== 'none' ? [assignedUserId] : null,
      assigned_manager: assignedUser ? assignedUser.name : null,
      last_edited_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .update(updatesForSupabase)
      .eq('id', customer.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error updating customer",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      const transformedData: Customer = {
        ...data,
        partnerId: data.partner_id,
        deal_products: data.deal_products,
        assignedUserIds: data.assigned_user_ids,
        assigned_manager: data.assigned_manager,
        contract_duration: data.contract_duration,
        createdAt: new Date(data.created_at),
        lastEdited: data.last_edited_at ? new Date(data.last_edited_at) : undefined,
      };
      toast({
        title: "Success",
        description: "Customer updated successfully!",
      });
      const logDetails = `Updated details for customer ${customer.name} (ID: ${customer.id}).`;
       await logCrmAction("Update Customer", logDetails);
      onSuccess(transformedData);
      onClose();
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CustomerBasicInfoForm 
            formData={formData} 
            onChange={handleFormChange} 
          />

          <CustomerStatusForm 
            formData={formData} 
            onChange={handleFormChange} 
          />

          <CustomerAssignmentForm 
            formData={formData} 
            onChange={handleFormChange} 
          />
          
          <div>
            <Label htmlFor="assigned-user">Assigned User</Label>
            <Select value={assignedUserId} onValueChange={setAssignedUserId} disabled={isSalesRole}>
                <SelectTrigger id="assigned-user">
                    <SelectValue placeholder="Select assigned user" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users
                    .filter((u) => ['fsr', 'team-leader', 'bde', 'isr'].includes(u.role))
                    .map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.name}-{user.role.toLocaleUpperCase()}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          {/* Plan Details Section */}
          <Card>
            <CardHeader><CardTitle className="text-base">Plan Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label htmlFor="plan-type">Plan Type</Label><Select value={planType} onValueChange={setPlanType}><SelectTrigger id="plan-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Yearly">Yearly</SelectItem></SelectContent></Select></div>
                <div><Label htmlFor="plan-duration">Plan Duration (Yrs)</Label><Input id="plan-duration" type="number" min="1" value={planDuration} onChange={e => setPlanDuration(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))} /></div>
                <div>
                  <Label htmlFor="contract-duration">Contract Duration</Label>
                  <Select value={formData.contractDuration} onValueChange={(value) => handleFormChange('contractDuration', value)}>
                    <SelectTrigger id="contract-duration">
                      <SelectValue placeholder="Select Contract Period" />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="1_year">1 Year</SelectItem><SelectItem value="2_year">2 Year</SelectItem><SelectItem value="3_year">3 Year</SelectItem><SelectItem value="5_year">5 Year</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Deal Products Section */}
          <Card>
            <CardHeader><CardTitle className="text-base">{editingProductId ? 'Edit Product' : 'Add Product to Deal'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading product options...</div> :
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 col-span-full">
                    <div><Label>Product Category</Label><Select value={selectedOem} onValueChange={v => { setSelectedOem(v); setSelectedProduct(''); setSelectedSku(''); }}><SelectTrigger><SelectValue placeholder="Select Product Category" /></SelectTrigger><SelectContent>{oems.map(oem => <SelectItem key={oem} value={oem}>{oem}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Product</Label><Select value={selectedProduct} onValueChange={v => { setSelectedProduct(v); setSelectedSku(''); }} disabled={!selectedOem}><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger><SelectContent>{productsForOem.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>SKU</Label><Select value={selectedSku} onValueChange={setSelectedSku} disabled={!selectedProduct}><SelectTrigger><SelectValue placeholder="Select SKU" /></SelectTrigger><SelectContent>{skusForProduct.map(sku => <SelectItem key={sku.id} value={sku.id}>{sku.name} - ₹{sku.price}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="license-count">License Count</Label><Input id="license-count" type="number" min="1" value={licenseCount} onChange={e => setLicenseCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))} placeholder="e.g., 10" /></div>
                  </div>
                  
                  <div className="flex gap-2 col-span-full justify-end">
                    {editingProductId && <Button variant="outline" type="button" onClick={resetProductForm}>Cancel Edit</Button>}
                    <Button type="button" onClick={handleAddOrUpdateProduct} disabled={isPriceLoading || !selectedSku || !licenseCount || !planDuration}>
                      {isPriceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingProductId ? <><Save size={16} className="mr-2" />Update Product</> : <><Plus size={16} className="mr-2" />Add Product</>}
                    </Button>
                  </div>
                </div>
              }
            </CardContent>
          </Card>

          {/* Add-on Service Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add-on Services</CardTitle>
              <CardDescription>Quickly add pre-configured services like support or implementation.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAddons ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading add-on services...</div> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {addons.map(addon => {
                    const isAdded = addedProducts.some(p => p.productName === addon.name);
                    return (
                      <Card key={addon.id} className={cn("flex flex-col h-22", isAdded && "bg-muted/50")}>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">{addon.name}</CardTitle></CardHeader>
                        <CardContent className="flex-grow"><p className="text-xs text-muted-foreground">{addon.description}</p></CardContent>
                        <CardFooter className="flex justify-between items-center pt-2">
                          <span className="font-semibold">₹{addon.price?.toLocaleString('en-IN')}</span>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleAddAddon(addon)} disabled={isAdded}>
                            {isAdded ? 'Added' : <><PlusCircle size={14} className="mr-2" /> Add</>}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              }
            </CardContent>
          </Card>

          {addedProducts.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Deal Items ({addedProducts.length})</h4>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Licenses</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {addedProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.productName}</div>
                          <div className="text-xs text-muted-foreground">{p.skuName}</div>
                        </TableCell>
                        <TableCell>{p.licenseCount}</TableCell>
                        <TableCell>{p.planType} ({p.planDuration} Yr)</TableCell>
                        <TableCell>₹{p.shivaamisubtotal?.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 items-center">
                            {p.product_type === 'main_product' && (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProduct(p.id)} disabled={!!editingProductId}><Edit className="h-4 w-4" /></Button>
                            )}
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveProduct(p.id)}><X className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save size={16} className="mr-2" /> Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerEditDialog;
