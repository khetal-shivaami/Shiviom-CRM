
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Edit, Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client'; 
import { Partner, Product, Customer, Plan } from '../types';
import { cn } from '@/lib/utils';
import { DealProduct } from '@/types/dealProduct';

interface CustomerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CustomerForm = ({ onSuccess, onCancel }: CustomerFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    customer_domain: '',
    partnerId: '',
    value: '',
    zone: '',
  });

  // State for new vs existing prospect
  const [prospectType, setProspectType] = useState('new'); // 'new' or 'existing'
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [isExistingCustomersLoading, setIsExistingCustomersLoading] = useState(false);
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState('');
  // State for deal/product configuration
  const [caseType, setCaseType] = useState('');
  const [contractDuration, setContractDuration] = useState('');
  const [planType, setPlanType] = useState('Yearly');
  const [planDuration, setPlanDuration] = useState<number | ''>(1);
  const [selectedOem, setSelectedOem] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [licenseCount, setLicenseCount] = useState<number | ''>('');
  const [addedMainProducts, setAddedMainProducts] = useState<DealProduct[]>([]);
  const [addedAddons, setAddedAddons] = useState<DealProduct[]>([]);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [caseID, setCaseID] = useState('');
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);
  // State for inline price editing of addons
  const [editingAddonPriceId, setEditingAddonPriceId] = useState<number | null>(null);
  const [currentEditingAddonPrice, setCurrentEditingAddonPrice] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const partnersPromise = supabase.from('partners').select('id, name, company, portal_reseller_id, partner_discount, email').eq('onboarding_stage', 'onboarded');
        const productsPromise = supabase.from('products').select('id, name, category, plans, product_type, status, price');

        const [partnersResult, productsResponse] = await Promise.all([
          partnersPromise,
          productsPromise,
        ]);

        if (partnersResult.error) throw new Error(`Supabase error: ${partnersResult.error.message}`);
        setPartners(partnersResult.data || []);
        
        if (productsResponse.error) throw new Error(`Supabase error: ${productsResponse.error.message}`);
        const allProducts = productsResponse.data || [];
        const mainProducts = allProducts.filter(p => p.product_type === 'main_product');
        const addonProducts = allProducts.filter(p => p.product_type === 'add_on_service' && p.status === 'active');
        setProducts(mainProducts as Product[]);
        setAddons(addonProducts as Product[]);

      } catch (error: any) {
        toast({
          title: 'Error fetching data',
          description: error.message || 'Could not load partners and products for the form.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Effect to handle dependent dropdowns for editing
  useEffect(() => {
    if (editingProductId) {
      const productToEdit = addedMainProducts.find(p => p.id === editingProductId);
      if (productToEdit && selectedOem === productToEdit.oemName) {
        setSelectedProduct(productToEdit.productName);
      }
    }
  }, [selectedOem, editingProductId, addedMainProducts]);

  useEffect(() => {
    if (editingProductId) {
      const productToEdit = addedMainProducts.find(p => p.id === editingProductId);
      const product = products.find(p => p.category === selectedOem && p.name === selectedProduct);
      const plan = product?.plans?.find(pl => pl.name === productToEdit?.skuName);
      if (plan) setSelectedSku(plan.id);
    }
  }, [selectedProduct, editingProductId, addedMainProducts, products, selectedOem]);
  // Effect to fetch existing customers when partner changes for 'existing' prospect type
  useEffect(() => {
    const allAddedProducts = [...addedMainProducts, ...addedAddons];
    const fetchExistingCustomers = async () => {
      if (prospectType !== 'existing' || !formData.partnerId) {
        setExistingCustomers([]);
        return;
      }
      
      const selectedPartner = partners.find(p => p.id === formData.partnerId);
      console.log(selectedPartner)
      if (!selectedPartner || !selectedPartner.email) {
        toast({ title: "Partner email not found", variant: "destructive" });
        return;
      }

      setIsExistingCustomersLoading(true);
      try {
        const apiFormData = new FormData();
        apiFormData.append('reseller_email', selectedPartner.email);

        const response = await fetch(API_ENDPOINTS.GET_CUSTOMER_LIST_OF_RESELLER_CRM, {
          method: 'POST',
          body: apiFormData,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        if (result.success && result.data?.data_result) {
          setExistingCustomers(result.data.data_result);
        } else {
          setExistingCustomers([]);
          throw new Error(result.message || 'Failed to fetch customers for this partner.');
        }
      } catch (error: any) {
        toast({
          title: "Error fetching existing customers",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsExistingCustomersLoading(false);
      }
    };

    fetchExistingCustomers();
  }, [prospectType, formData.partnerId, partners, toast]);

  const handleExistingCustomerSelect = (customerId: string) => {
    setSelectedExistingCustomerId(customerId);
    const customer = existingCustomers.find(c => c.cust_id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        name: customer.customer_name || '',
        email: customer.customer_emailid || '',
        phone: customer.customer_contact_number || '',
        company: customer.customer_company_name || customer.customer_domainname || '',
        customer_domain: customer.customer_domainname || '',
      }));
    }
  };

  useEffect(() => {
    const totalValue = [...addedMainProducts, ...addedAddons].reduce((acc, product) => acc + (product.shivaamisubtotal || 0), 0);
    setFormData(prevFormData => ({
      ...prevFormData,
      value: String(Math.round(totalValue))
    }));
  }, [addedMainProducts, addedAddons]);

  const zones = [
    { value: 'north', label: 'North' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
    { value: 'south', label: 'South' },
  ];

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

  const handleAddProduct = async () => {
    if (!selectedSku || !licenseCount || planDuration === '' || !selectedOem || !selectedProduct) {
      toast({ title: "Missing Information", description: "Please select a category, product, SKU, license count, and plan duration.", variant: "destructive" });
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
    const shivaamiSubtotal = shivaamiPrice * Number(licenseCount) * (Number(planDuration));

    const newProduct: DealProduct = { 
      id: Date.now(), 
      oemName: selectedOem, 
      productName: selectedProduct, 
      skuName: plan.name, 
      licenseCount: licenseCount, 
      planType: planType,
      planDuration: planDuration,
      pr_skuprice: listPrice,
      pr_shivaamiprice: shivaamiPrice,
      product_type: 'main_product',
      shivaamisubtotal: shivaamiSubtotal,
      skuDiscount: 0,
      portal_sku_id: plan.portal_sku_id || '',
    };
    setAddedMainProducts(prev => [...prev, newProduct]);
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
      product_type: 'add_on_service',
      shivaamisubtotal: addonDetails.price,
    };
    setAddedAddons(prev => [...prev, newAddonProduct]);
    toast({ title: "Add-on Added", description: `"${addonDetails.name}" has been added to the deal.` });
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId || !selectedSku || !licenseCount || planDuration === '') {
      toast({ title: "Missing Information", description: "Please fill all required product fields to update.", variant: "destructive" });
      return;
    }
    setIsPriceLoading(true);
    try {
      const apiFormData = new FormData();
      const partner = partners.find(p => p.id === formData.partnerId);
      const partnerDiscount = partner?.partner_discount ?? 0;
      const plan = skusForProduct.find(p => p.id === selectedSku);

      if (!plan) throw new Error("Selected plan not found.");

      const listPrice = plan.price;
      const shivaamiPrice = listPrice * (1 - (partnerDiscount / 100));
      const shivaamiSubtotal = shivaamiPrice * Number(licenseCount) * (Number(planDuration));

      const updatedProduct: DealProduct = { 
          id: editingProductId, oemName: selectedOem, productName: selectedProduct, 
          skuName: plan.name, licenseCount: licenseCount, planType: planType,
          planDuration: planDuration, 
          pr_skuprice: listPrice, 
          pr_shivaamiprice: shivaamiPrice, 
          product_type: 'main_product',
          shivaamisubtotal: shivaamiSubtotal,
          skuDiscount: 0,
          portal_sku_id: plan.portal_sku_id || '',
      };
      setAddedMainProducts(prev => prev.map(p => p.id === editingProductId ? updatedProduct : p));
      resetProductForm();
    } catch (error: any) {
      toast({ title: "Error", description: `Could not update product: ${error.message}`, variant: "destructive" });
    } finally { setIsPriceLoading(false); }
  };
  
  const handleEditProduct = (productId: number) => {
    const productToEdit = addedMainProducts.find(p => p.id === productId);
    if (productToEdit) {
      setEditingProductId(productId);
      setSelectedOem(productToEdit.oemName);
      setLicenseCount(productToEdit.licenseCount);
      setPlanType(productToEdit.planType);
      setPlanDuration(productToEdit.planDuration);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setAddedMainProducts(prev => prev.filter(p => p.id !== productId));
    setAddedAddons(prev => prev.filter(p => p.id !== productId));
    if (editingProductId === productId) resetProductForm();
  };

  const handleEditAddonPrice = (addon: DealProduct) => {
    setEditingAddonPriceId(addon.id);
    setCurrentEditingAddonPrice(addon.pr_shivaamiprice);
  };

  const handleSaveAddonPrice = (addonId: number) => {
    const newPrice = Number(currentEditingAddonPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid price.", variant: "destructive" });
      return;
    }
    setAddedAddons(prev => prev.map(addon => 
      addon.id === addonId 
        ? { ...addon, pr_shivaamiprice: newPrice, pr_skuprice: newPrice, shivaamisubtotal: newPrice } 
        : addon
    ));
    setEditingAddonPriceId(null);
    setCurrentEditingAddonPrice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.name || !formData.email || !formData.company || !formData.customer_domain) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const selectedPartner = formData.partnerId ? partners.find(p => p.id === formData.partnerId) : null;

    const allDealProducts = [...addedMainProducts, ...addedAddons];

    const customerToInsert = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      customer_domain: formData.customer_domain,
      status: 'pending',
      process: 'prospect',
      partner_id: formData.partnerId || null,
      case_type: caseType,
      partner_portal_id: selectedPartner ? selectedPartner.portal_reseller_id : null,
      // Storing detailed product/deal info in a JSONB column `deal_products`
      deal_products: allDealProducts.length > 0 ? allDealProducts : null,
      value: parseInt(formData.value) || 0,
      zone: formData.zone || null,
      contract_duration: contractDuration || null,
      portal_case_id: caseID,
    };

    console.log('Submitting Customer Data:', JSON.stringify(customerToInsert, null, 2));
    
    const { error } = await supabase.from('customers').insert([customerToInsert]).select();

    if (error) {
      toast({
        title: "Error adding customer",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: "Success",
        description: "Customer added successfully!",
      });

      // No need to set isSubmitting to false here, as the component will unmount on success.

      const logDetails = `Added new customer ${customerToInsert.name} (Email: ${customerToInsert.email}, Domain: ${customerToInsert.customer_domain})`;
      // await logCrmAction("Add Partner", logDetails); // This seems to be a copy-paste error, should be "Add Customer" or "Add Deal"
      onSuccess();
    }
  };

  return (
    <Card className="max-w-8xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle></CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-3 w-6">
            <X className="h-2 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prospect-type">Prospect Type</Label>
              <Select value={prospectType} onValueChange={(value) => {
                setProspectType(value);
                // Reset customer fields when switching
                setFormData(prev => ({ ...prev, name: '', email: '', phone: '', company: '', customer_domain: '' }));
                setSelectedExistingCustomerId('');
              }}>
                <SelectTrigger id="prospect-type">
                  <SelectValue placeholder="Select prospect type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Customer Prospect</SelectItem>
                  <SelectItem value="existing">Existing Customer Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner">Assign Partner</Label>
              <Select value={formData.partnerId} onValueChange={(value) => setFormData({ ...formData, partnerId: value })} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} - {partner.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {prospectType === 'existing' && (
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="existing-customer">Select Existing Customer</Label>
                <Select 
                  value={selectedExistingCustomerId} 
                  onValueChange={handleExistingCustomerSelect} 
                  disabled={!formData.partnerId || isExistingCustomersLoading}
                >
                  <SelectTrigger id="existing-customer">
                    <SelectValue placeholder={isExistingCustomersLoading ? "Loading customers..." : "Select a customer domain"} />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCustomers.map((customer) => (
                      <SelectItem key={customer.cust_id} value={customer.cust_id}>
                        {customer.customer_domainname} ({customer.customer_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter customer name" required  />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email address" required  />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Customer Domain *</Label>
              <Input id="customer_domain" value={formData.customer_domain} onChange={(e) => setFormData({ ...formData, customer_domain: e.target.value })} placeholder="Enter customer domain" required  />
            </div>
              <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone number"  />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Enter company name" required disabled={prospectType === 'existing'} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="case-type">Case Type</Label>
              <Select value={caseType} onValueChange={setCaseType}>
                <SelectTrigger id="case-type">
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_case">New Case</SelectItem>
                  <SelectItem value="renewal_case">Renewal Case</SelectItem>
                  <SelectItem value="upgrade_case">Upgrade Case</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select value={formData.zone} onValueChange={(value) => setFormData({ ...formData, zone: value })} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-duration">Contract Duration</Label>
              <Select value={contractDuration} onValueChange={setContractDuration}>
                <SelectTrigger id="contract-duration">
                  <SelectValue placeholder="Select Contract Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_year">1 Year</SelectItem>
                  <SelectItem value="2_year">2 Year</SelectItem>
                  <SelectItem value="3_year">3 Year</SelectItem>
                  <SelectItem value="5_year">5 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Expected Value (₹)</Label>
              <Input
                id="value"
                type="text"
                value={Number(formData.value).toLocaleString('en-IN')}
                readOnly
                disabled
                placeholder="Enter expected value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-type">Plan Type</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger id="plan-type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Yearly">Yearly</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-duration">Plan Duration (Yrs)</Label>
              <Input id="plan-duration" type="number" min="1" value={planDuration} onChange={e => setPlanDuration(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))} />
            </div>

          </div>

          {/* Deal Products Section */}
          <Card>
            <CardHeader><CardTitle className="text-base">{editingProductId ? 'Edit Product' : 'Add Product to Deal'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading product options...</div> :
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="grid grid-cols-4 gap-4 col-span-full">
                    <div><Label>Product Category</Label><Select value={selectedOem} onValueChange={v => { setSelectedOem(v); setSelectedProduct(''); setSelectedSku(''); }}><SelectTrigger><SelectValue placeholder="Select Product Category" /></SelectTrigger><SelectContent>{oems.map(oem => <SelectItem key={oem} value={oem}>{oem}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Product</Label><Select value={selectedProduct} onValueChange={v => { setSelectedProduct(v); setSelectedSku(''); }} disabled={!selectedOem}><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger><SelectContent>{productsForOem.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>SKU</Label><Select value={selectedSku} onValueChange={setSelectedSku} disabled={!selectedProduct}><SelectTrigger><SelectValue placeholder="Select SKU" /></SelectTrigger><SelectContent>{skusForProduct.map(sku => <SelectItem key={sku.id} value={sku.id}>{sku.name} - ₹{sku.price}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="license-count">License Count</Label><Input id="license-count" type="number" min="1" value={licenseCount} onChange={e => setLicenseCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))} placeholder="e.g., 10" /></div>
                  </div>
                  
                  <div className="flex gap-2 col-span-full justify-end">
                    {editingProductId && <Button variant="outline" onClick={resetProductForm}>Cancel</Button>}
                    <Button type="button" onClick={editingProductId ? handleUpdateProduct : handleAddProduct} disabled={isPriceLoading || !selectedSku || !licenseCount}>
                      {isPriceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingProductId ? 'Update Product' : 'Add Product'}
                    </Button>
                  </div>
                </div>
              }
            </CardContent>
          </Card>

          {/* Add-on Service Section - Alternative Design */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add-on Services</CardTitle>
              <CardDescription>Quickly add pre-configured services like support or implementation.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAddons ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading add-on services...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {addons.map(addon => {
                    const isAdded = addedAddons.some(p => p.productName === addon.name);
                    return (
                      <Card key={addon.id} className={cn("flex flex-col h-22", isAdded && "bg-muted/50")}>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">{addon.name}</CardTitle></CardHeader>
                        <CardContent className="flex-grow"><p className="text-xs text-muted-foreground">{addon.description}</p></CardContent>
                        <CardFooter className="flex justify-between items-c9enter pt-2">
                          <span className="font-semibold">₹{addon.price?.toLocaleString('en-IN')}</span>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleAddAddon(addon)} disabled={isAdded}>
                            {isAdded ? 'Added' : <><PlusCircle size={14} className="mr-2" /> Add</>}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {(addedMainProducts.length > 0 || addedAddons.length > 0) && (
            <div>
              <h4 className="font-medium mb-2">Deal Items ({addedMainProducts.length + addedAddons.length})</h4>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Licenses</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {[...addedMainProducts, ...addedAddons].map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.productName}</div>
                          <div className="text-xs text-muted-foreground">{p.skuName}</div>
                        </TableCell>
                        <TableCell>{p.licenseCount}</TableCell>
                        <TableCell>{p.planType} ({p.planDuration} Yr)</TableCell>
                        <TableCell>
                          {editingAddonPriceId === p.id && p.product_type === 'add_on_service' ? (
                            <Input
                              type="number"
                              value={currentEditingAddonPrice}
                              onChange={(e) => setCurrentEditingAddonPrice(e.target.value === '' ? '' : Number(e.target.value))}
                              onBlur={() => handleSaveAddonPrice(p.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveAddonPrice(p.id)}
                              className="h-8 w-24"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              ₹{p.pr_shivaamiprice?.toLocaleString('en-IN')}
                              {p.product_type === 'add_on_service' && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditAddonPrice(p)}><Edit className="h-3 w-3" /></Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>₹{p.shivaamisubtotal?.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {p.product_type === 'main_product' && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProduct(p.id)} disabled={!!editingProductId}><Edit className="h-4 w-4" /></Button>
                            )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveProduct(p.id)}><X className="h-4 w-4" /></Button>
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
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : 'Add Prospect'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomerForm;
