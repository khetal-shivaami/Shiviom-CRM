import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Loader2, FileText as FileTextIcon, ChevronsRight, CheckCircle, XCircle, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Partner, Customer } from '../types';
import { supabase } from '@/integrations/supabase/client';

interface AccountManager {
  admin_id: string;
  admin_name: string;
  region: string;
}

interface QuotationProductDetail {
  skuname: string;
  usercount: string;
  actual_sku_price: string;
  purchaseType: string;
  shivaami_price: string;
  price: string;
  shivaamisubtotal: string;
  product_name: string;
  oem_name: string;
}

interface Quotation {
  quotation_id: string;
  customer_name: string;
  domain_name: string;
  plan_type: string;
  plan_duration: string;
  final_price_wto_gst: number | string;
  final_price_wt_gst: number | string;
  reseller_email: string;
  reseller_id: string;
  cust_id: string;
  created_date: string;
  case_id: string;
  reseller_name: string;
  discount: string;
  discount_amt: string | number | null;
  quotation_expiry: string;
  case_name: string;
  order_status: string;
  quotation_status: string;
  quotation_rejection_reason: string | null;
  concatenated_products: QuotationProductDetail[];
}

interface AddedProduct {
  id: number;
  oemName: string;
  productName: string;
  skuName: string;
  purchaseType: string; // 'new' or 'renewal'
  licenseCount: number | '';
  skuDiscount: number;
  prodDiscount: string;
  listPrice: string;
  shivaamiPrice: string;
  subtotal: string;
}
export interface Product {
  id: string;
  name: string;
  website: string;
  category: string;
  description: string;
  status: 'active' | 'inactive';
  customersCount: number;
  plans: ProductPlan[];
  createdAt: Date;
  lastEdited?: Date;
  // Legacy price field for backward compatibility
  price?: number;
  portal_prod_id?: string
}

const Quotations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [resellerFilter, setResellerFilter] = useState('all');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [valueRange, setValueRange] = useState({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isSplitView, setIsSplitView] = useState(false);
  const recordsPerPage = 10;
  const [isRejectQuotationDialogOpen, setIsRejectQuotationDialogOpen] = useState(false);
  const [quotationRejectionReason, setQuotationRejectionReason] = useState('');
  const [selectedQuotationForAction, setSelectedQuotationForAction] = useState<Quotation | null>(null);


  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerCustomers, setPartnerCustomers] = useState<Customer[]>([]);
  const [isGenerateQuotationDialogOpen, setIsGenerateQuotationDialogOpen] = useState(false);

  // State for Generate Quotation Modal
  const [quotationType, setQuotationType] = useState('new'); // 'new' or 'renewal'
  const [productData, setProductData] = useState<Record<string, Record<string, string[]>>>({});
  const [isProductDataLoading, setIsProductDataLoading] = useState(false);
  const [selectedQuotationPartner, setSelectedQuotationPartner] = useState<string>('');
  const [selectedQuotationCustomer, setSelectedQuotationCustomer] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [planType, setPlanType] = useState('Yearly');
  const [planDuration, setPlanDuration] = useState<number | ''>(1);
  const [selectedOem, setSelectedOem] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [licenseCount, setLicenseCount] = useState<number | ''>('');
  const [skuDiscount, setSkuDiscount] = useState<number | ''>('');
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [partnerConditions, setPartnerConditions] = useState('');
  const [customerConditions, setCustomerConditions] = useState('');
  const [isLoadingConditions, setIsLoadingConditions] = useState(false);
  const [quotationFor, setQuotationFor] = useState('customer');
  const [isGeneratingQuotation, setIsGeneratingQuotation] = useState(false);
  const [quotationExpiry, setQuotationExpiry] = useState('');
  const [isLoadingPartnerCustomers, setIsLoadingPartnerCustomers] = useState(false);
  const [addons, setAddons] = useState<any[]>([]);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState('');

  // State for product-specific discounts
  const [fetchedProductDiscounts, setFetchedProductDiscounts] = useState<{ productId: string; productName: string; discount: number; }[]>([]);
  const [isDiscountsLoading, setIsDiscountsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchAllQuotations = async () => {
      setIsLoading(true);
      try {
        // We send an empty POST request to fetch all quotations, as per the assumed API behavior.
        const response = await fetch(API_ENDPOINTS.GET_ALLQUOTATION_ONCRM, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data?.data_result) {
          setQuotations(result.data.data_result);
        } else {
          setQuotations([]);
          throw new Error(result.message || "Failed to fetch quotations.");
        }
      } catch (error: any) {
        toast({
          title: "Error Fetching Quotations",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllQuotations();
  }, [toast]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase.from('partners').select('*').eq('onboarding_stage', 'onboarded');
        if (error) throw error;
        setPartners(data as Partner[]);
      } catch (error: any) {
        toast({ title: "Error fetching partners", description: error.message, variant: "destructive" });
      }
    };
    fetchPartners();
  }, [toast]);

  useEffect(() => {
    const fetchDialogData = async () => {
      setIsProductDataLoading(true);
      setIsLoadingConditions(true);

      try {
        const [productRes, partnerCondRes, customerCondRes] = await Promise.all([
          fetch(API_ENDPOINTS.GET_PRODUCT_DATA_ONCRM, { method: 'GET' }),
          fetch(API_ENDPOINTS.GET_RESELLER_CONDITIONS_ONCRM, { method: 'POST' }),
          fetch(API_ENDPOINTS.GET_CUSTOMER_CONDITIONS_ONCRM, { method: 'POST' })
        ]);

        const productResult = await productRes.json();
        if (productResult.success) setProductData(productResult.data);
        else throw new Error(productResult.message || "Failed to fetch product data");

        const partnerResult = await partnerCondRes.json();
        if (partnerResult.success && Array.isArray(partnerResult.data)) {
          const conditionsText = partnerResult.data.map((item: { resellers_conditions: string }, index: number) => `${index + 1}. ${item.resellers_conditions.replace(/\r/g, '')}`).join('\n');
          setPartnerConditions(conditionsText);
        }

        const customerResult = await customerCondRes.json();
        if (customerResult.success && Array.isArray(customerResult.data)) {
          const conditionsText = customerResult.data.map((item: { conditions: string }, index: number) => `${index + 1}. ${item.conditions.replace(/\r/g, '')}`).join('\n');
          setCustomerConditions(conditionsText);
        }
      } catch (error: any) {
        console.error("Failed to fetch dialog data", error);
        toast({ title: "Error", description: `Could not load data for quotation: ${error.message}`, variant: "destructive" });
      } finally {
        setIsProductDataLoading(false);
        setIsLoadingConditions(false);
      }
    };

    const fetchAddons = async () => {
      setIsLoadingAddons(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price')
          .eq('product_type', 'add_on_service')
          .eq('status', 'active');
        if (error) throw error;
        setAddons(data || []);
      } catch (error: any) {
        toast({ title: "Error fetching add-ons", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingAddons(false);
      }
    };

    if (isGenerateQuotationDialogOpen) {
      fetchDialogData();
      fetchAddons();
    }
  }, [isGenerateQuotationDialogOpen, toast]);

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
      console.error("User ID not available for logging CRM action.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('userid', user.id);
      formData.append('actiontype', actiontype);
      formData.append('path', 'Quotations');
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

  const submitQuotationAction = async (quotation: Quotation, status: 'Accepted' | 'Rejected', reason: string) => {
    try {
      if (!quotation.reseller_id) {
        throw new Error("Quotation's Reseller ID is missing.");
      }

      const formData = new FormData();
      formData.append('reseller_id', quotation.reseller_id);
      formData.append('quotation_id', quotation.quotation_id);
      formData.append('quotation_status', status);
      formData.append('quotation_reason', reason);

      const response = await fetch(API_ENDPOINTS.UPDATE_QUOTATION_STATUS_ONCRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update quotation status.');
      }

      toast({
        title: `Quotation ${status}`,
        description: `Quotation ${quotation.quotation_id} has been successfully updated.`,
      });

      const logDetails = `Quotation ${quotation.quotation_id} for customer ${quotation.customer_name} was ${status.toLowerCase()}${status === 'Rejected' ? ` with reason: ${reason}` : ''}.`;
      await logCrmAction(`Quotation ${status}`, logDetails);

      // Update local state to reflect the change
      const updatedQuotation = { ...quotation, quotation_status: status, quotation_rejection_reason: reason };
      setQuotations(prevQuotations => prevQuotations.map(q =>
        q.quotation_id === quotation.quotation_id ? updatedQuotation : q
      ));
      if (selectedQuotation?.quotation_id === quotation.quotation_id) {
        setSelectedQuotation(updatedQuotation);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update quotation status: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsRejectQuotationDialogOpen(false);
      setQuotationRejectionReason('');
      setSelectedQuotationForAction(null);
    }
  };

  const fetchPartnerCustomers = async (partnerEmail: string) => {
    if (!partnerEmail) return;
    setIsLoadingPartnerCustomers(true);
    setPartnerCustomers([]);
    try {
      const formData = new FormData();
      formData.append('reseller_email', partnerEmail);
      const response = await fetch(API_ENDPOINTS.GET_CUSTOMER_LIST_OF_RESELLER_CRM, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success || !result.data?.data_result) throw new Error('Invalid API response for customers');
      const mappedCustomers: Customer[] = result.data.data_result.map((c: any) => ({
        id: c.cust_id, name: c.customer_name || 'N/A', email: c.customer_emailid || '',
        domainName: c.customer_domainname, company: c.customer_company_name || c.customer_domainname,
      }));
      setPartnerCustomers(mappedCustomers);
    } catch (error: any) {
      toast({ title: "Error fetching partner's customers", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingPartnerCustomers(false);
    }
  };

  const resetProductForm = () => {
    setSelectedOem(''); setSelectedProduct(''); setSelectedSku('');
    setLicenseCount(''); setSkuDiscount(''); setEditingProductId(null);
  };

  const handleRemoveProduct = (productId: number) => {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
    if (editingProductId === productId) resetProductForm();
  };

  const handleAddProductToQuotation = async () => {
    const partner = partners.find(p => p.id === selectedQuotationPartner);
    if (!selectedSku || !licenseCount || planDuration === '' || !partner || partner.partner_discount == null) {
      toast({ title: "Missing Information", description: "Please select a partner and fill all required product fields.", variant: "destructive" });
      return;
    }
    setIsPriceLoading(true);
    try {
       // Find the product to get its ID
      const productInfo = allProducts.find(p => p.name === selectedProduct);
      const productDiscountInfo = productInfo ? fetchedProductDiscounts.find(d => d.productId === productInfo.id) : undefined;
      console.log(productDiscountInfo)
      let discountToApply = 0;
      if (productDiscountInfo) {
        if (quotationType === 'renewal') {
          discountToApply = productDiscountInfo.renewal_discount || 0;
        } else { // 'new' or default
          discountToApply = productDiscountInfo.discount || 0;
        }
      }
      const formData = new FormData();
      formData.append('skuname', selectedSku);
      formData.append('partnerdiscount', 0);
      formData.append('plantype', planType);
      formData.append('planduration', String(planDuration));
      formData.append('usercount', String(licenseCount));
      formData.append('skudiscount', String(discountToApply || 0));
      formData.append('quotationType', quotationType);
      formData.append('portal_reseller_id', partner.portal_reseller_id);

      const response = await fetch(API_ENDPOINTS.GET_SKUPRICE_ONCRM, { method: 'POST', body: formData });
      const result = await response.json();
      console.log(result)
      if (result.success) {
        const newProduct : AddedProduct = { 
          id: Date.now(), 
          oemName: selectedOem, 
          productName: selectedProduct, 
          skuName: selectedSku, 
          purchaseType: result.data.in_quottype,
          licenseCount: licenseCount, 
          skuDiscount: discountToApply || 0, 
          prodDiscount: result.data.pr_proddiscount,
          listPrice: result.data.pr_skuprice, 
          shivaamiPrice: result.data.pr_shivaamiprice, 
          subtotal: result.data.shivaamisubtotal };
        setAddedProducts(prev => [...prev, newProduct]);
        resetProductForm();
      } else { throw new Error(result.message || "Failed to get price."); }
    } catch (error: any) {
      toast({ title: "Error", description: `Could not add product: ${error.message}`, variant: "destructive" });
    } finally { setIsPriceLoading(false); }
  };

  const fetchProductDiscounts = async (portalResellerId: string) => {
    if (!portalResellerId) {
      setFetchedProductDiscounts([]);
      return;
    }
    setIsDiscountsLoading(true);
    try {
      const formData = new FormData();
      formData.append('portal_reseller_id', portalResellerId);

      const response = await fetch(API_ENDPOINTS.GET_SKUWISE_DISCOUNT_ONCRM, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const mappedDiscounts = result.data.map((item: any) => ({
          productId: item.crm_prod_id,
          productName: item.product_name,
          discount: item.discount,
          renewal_discount: item.renewal_discount,
        }));
        setFetchedProductDiscounts(mappedDiscounts);
      } else {
        setFetchedProductDiscounts([]);
      }
    } catch (error: any) {
      toast({ title: "Error fetching product discounts", description: error.message, variant: "destructive" });
    } finally {
      setIsDiscountsLoading(false);
    }
  };
  const handleEditProduct = (productId: number) => {
    const productToEdit = addedProducts.find(p => p.id === productId);
    if (productToEdit) {
      setEditingProductId(productId);
      setSelectedOem(productToEdit.oemName);
      // The following might need slight adjustments if product/SKU data structure changes
      setSelectedProduct(productToEdit.productName);
      setSelectedSku(productToEdit.skuName);
      setLicenseCount(productToEdit.licenseCount);
      // Only set discount if OEM is Google Workspace
      if (productToEdit.oemName === 'Google Workspace') {
        setSkuDiscount(productToEdit.skuDiscount);
      }
    }
  };

  const handleUpdateProduct = async () => {
    const partner = partners.find(p => p.id === selectedQuotationPartner);
    if (!editingProductId || !selectedSku || !licenseCount || planDuration === '' || !partner || partner.partner_discount == null) {
      toast({ title: "Missing Information", description: "Please fill all required product fields to update.", variant: "destructive" });
      return;
    }
    setIsPriceLoading(true);
    try {
      // Find the product to get its ID
      const productInfo = allProducts.find(p => p.name === selectedProduct);
      const productDiscountInfo = productInfo ? fetchedProductDiscounts.find(d => d.productId === productInfo.id) : undefined;
      console.log(productDiscountInfo)
      let discountToApply = 0;
      if (productDiscountInfo) {
        if (quotationType === 'renewal') {
          discountToApply = productDiscountInfo.renewal_discount || 0;
        } else { // 'new' or default
          discountToApply = productDiscountInfo.discount || 0;
        }
      }
      const formData = new FormData();
      formData.append('skuname', selectedSku);
      formData.append('partnerdiscount', String(partner.partner_discount));
      formData.append('plantype', planType);
      formData.append('planduration', String(planDuration));
      formData.append('usercount', String(licenseCount));
      formData.append('skudiscount', String(discountToApply || 0));
      formData.append('quotationType', quotationType);
      formData.append('portal_reseller_id', partner.portal_reseller_id);

      const response = await fetch(API_ENDPOINTS.GET_SKUPRICE_ONCRM, { method: 'POST', body: formData });
      const result = await response.json();

      if (result.success) {
        const updatedProduct = { 
          id: editingProductId, 
          oemName: selectedOem, 
          productName: selectedProduct, 
          skuName: selectedSku, 
          purchaseType: result.data.in_quottype,
          licenseCount: licenseCount, 
          skuDiscount: skuDiscount || 0, 
          prodDiscount: result.data.pr_proddiscount,
          listPrice: result.data.pr_skuprice, 
          shivaamiPrice: result.data.pr_shivaamiprice, 
          subtotal: result.data.shivaamisubtotal 
        };
        setAddedProducts(prev => prev.map(p => p.id === editingProductId ? updatedProduct : p));
        resetProductForm();
      } else {
        throw new Error(result.message || "Failed to get price.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: `Could not update product: ${error.message}`, variant: "destructive" });
    } finally { setIsPriceLoading(false); }
  };

  const handleAddAddonToQuotation = () => {
    if (!selectedAddon) {
      toast({ title: "No Add-on Selected", description: "Please select an add-on service to add.", variant: "destructive" });
      return;
    }
    const addonDetails = addons.find(a => a.id === selectedAddon);
    if (!addonDetails) return;

    // Add-ons are treated as products with a fixed price and quantity of 1
    const newAddonProduct = {
      id: `addon-${Date.now()}`,
      oemName: 'Shivaami', // Or derive from addon if available
      productName: addonDetails.name,
      skuName: addonDetails.name, // Use name as SKU for simplicity
      licenseCount: 1,
      skuDiscount: 0,
      listPrice: addonDetails.price,
      shivaamiPrice: addonDetails.price, // Assuming no partner discount on these
      subtotal: addonDetails.price,
    };
    setAddedProducts(prev => [...prev, newAddonProduct]);
    setSelectedAddon(''); // Reset selection
  };

  const handleQuotationPartnerChange = async (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) {
      toast({ title: "Partner not found", variant: "destructive" });
      return;
    }
    setSelectedQuotationPartner(partner.id);
    setSelectedQuotationCustomer('');
    setSelectedDomain('');
    setPartnerCustomers([]); // Clear previous customers
    setFetchedProductDiscounts([]); // Clear previous discounts
    if (partner.portal_reseller_id) {
      await fetchProductDiscounts(partner.portal_reseller_id);
    }
    await fetchPartnerCustomers(partner.email);
  };

  const handleQuotationCustomerChange = (customerId: string) => {
    setSelectedQuotationCustomer(customerId);
    const customer = partnerCustomers.find(c => c.id === customerId);
    setSelectedDomain(customer?.domainName || '');
  };

  const handleQuotationAction = (quotation: Quotation, action: 'accept' | 'reject') => {
    setSelectedQuotationForAction(quotation);
    if (action === 'reject') {
      setIsRejectQuotationDialogOpen(true);
    } else {
      submitQuotationAction(quotation, 'Accepted', '');
    }
  };

  const handleGenerateQuotation = async () => {
    if (!selectedQuotationCustomer || !quotationFor || !quotationExpiry) {
      toast({
        title: "Missing Information",
        description: "Customer, Quotation For, and Expiry Date are mandatory fields.",
        variant: "destructive",
      });
      return;
    }


    const partnerDetails = partners.find(p => p.id === selectedQuotationPartner);
    const customerDetails = partnerCustomers.find(c => c.id === selectedQuotationCustomer);

    const quotationData = {
      partner: {
        id: partnerDetails?.id,
        name: partnerDetails?.name,
        email: partnerDetails?.email,
        portal_reseller_id: partnerDetails?.portal_reseller_id,
        partner_discount: partnerDetails?.partner_discount,
      },
      customer: {
        id: selectedQuotationCustomer,
        name: customerDetails?.name,
        domain: selectedDomain,
      },
      plan: {
        type: planType,
        duration: planDuration,
      },
      products: addedProducts,
      totals: quotationTotals,
      terms: {
        partner: partnerConditions,
        customer: customerConditions,
      },
      quotationFor: quotationFor,
      expiryDate: quotationExpiry,
      quotationType: quotationType,
    };

    setIsGeneratingQuotation(true);
    try {
      const response = await fetch(API_ENDPOINTS.SEND_QUOTATION_BYADMIN_ONCRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to generate quotation.');
      }

      toast({ title: "Success", description: "Quotation has been generated and sent successfully." });
      setIsGenerateQuotationDialogOpen(false); // Close dialog on success

      // Log the action
      const logDetails = `Generated a ${quotationType} quotation for customer ${customerDetails?.name} (${selectedDomain}) on behalf of partner ${partnerDetails?.name}.`;
      await logCrmAction("Generate Quotation", logDetails);
    } catch (error: any) {
      toast({ title: "Error", description: `Could not generate quotation: ${error.message}`, variant: "destructive" });
    } finally {
      setIsGeneratingQuotation(false);
    }
  };

  const handleConfirmQuotationRejection = async () => {
    if (selectedQuotationForAction && quotationRejectionReason.trim()) {
      await submitQuotationAction(selectedQuotationForAction, 'Rejected', quotationRejectionReason);
    }
  };
  const oems = Object.keys(productData);
  const productsForOem = selectedOem ? Object.keys(productData[selectedOem] || {}) : [];
  const skusForProduct = selectedOem && selectedProduct ? productData[selectedOem]?.[selectedProduct] || [] : [];

  const quotationTotals = useMemo(() => {
    const subtotal = addedProducts.reduce((acc, p) => acc + (p.subtotal || 0), 0);
    const gst = subtotal * 0.18;
    const grandTotal = subtotal + gst;
    return { subtotal, gst, grandTotal };
  }, [addedProducts]);

  const selectedPartnerForQuotation = partners.find(p => p.id === selectedQuotationPartner);

  const uniqueOrderStatuses = useMemo(() => {
    const statuses = new Set(quotations.map(q => q.order_status).filter(Boolean));
    return Array.from(statuses);
  }, [quotations]);

  const uniqueQuotationStatuses = useMemo(() => {
    const statuses = new Set(quotations.map(q => q.quotation_status).filter(Boolean));
    return Array.from(statuses);
  }, [quotations]);

  const uniqueResellers = useMemo(() => {
    const resellers = new Set(quotations.map(q => q.reseller_name).filter(Boolean));
    return Array.from(resellers).sort();
  }, [quotations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orderStatusFilter, resellerFilter, quotationStatusFilter, dateFilter, valueRange]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const search = searchTerm.toLowerCase();
      const searchMatch = !search ||
        q.quotation_id.toLowerCase().includes(search) ||
        q.customer_name.toLowerCase().includes(search) ||
        q.domain_name.toLowerCase().includes(search);

      const orderStatusMatch = orderStatusFilter === 'all' || q.order_status === orderStatusFilter;
      const resellerMatch = resellerFilter === 'all' || q.reseller_name === resellerFilter;
      const quotationStatusMatch = quotationStatusFilter === 'all' || q.quotation_status === quotationStatusFilter;

      const minVal = parseFloat(valueRange.min);
      const maxVal = parseFloat(valueRange.max);
      const price = parseFloat(String(q.final_price_wt_gst));
      const valueMatch =
        (isNaN(minVal) || price >= minVal) &&
        (isNaN(maxVal) || price <= maxVal);

      let dateMatch = true;
      if (dateFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const caseDate = new Date(q.created_date);
        caseDate.setHours(0, 0, 0, 0);
        const daysDiff = (today.getTime() - caseDate.getTime()) / (1000 * 3600 * 24);

        switch (dateFilter) {
          case 'last-7-days':
            dateMatch = daysDiff >= 0 && daysDiff <= 7;
            break;
          case 'last-30-days':
            dateMatch = daysDiff >= 0 && daysDiff <= 30;
            break;
          case 'last-90-days':
            dateMatch = daysDiff >= 0 && daysDiff <= 90;
            break;
        }
      }

      return searchMatch && orderStatusMatch && resellerMatch && quotationStatusMatch && valueMatch && dateMatch;
    });
  }, [quotations, searchTerm, orderStatusFilter, resellerFilter, quotationStatusFilter, valueRange, dateFilter]);

  const totalPages = Math.ceil(filteredQuotations.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredQuotations.slice(indexOfFirstRecord, indexOfLastRecord);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRowClick = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsSplitView(true);
  };

  const renderMainContent = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Quotations ({filteredQuotations.length})</CardTitle>
          {/* <Button onClick={() => setIsGenerateQuotationDialogOpen(true)}>
            <FileTextIcon size={16} className="mr-2" /> Create New Quotation
          </Button> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, customer, domain, or reseller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <Select value={resellerFilter} onValueChange={setResellerFilter}>
            <SelectTrigger><SelectValue placeholder="Filter by Reseller" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resellers</SelectItem>
              {uniqueResellers.map(reseller => <SelectItem key={reseller} value={reseller}>{reseller}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={quotationStatusFilter} onValueChange={setQuotationStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Filter by Quotation Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quotation Statuses</SelectItem>
              {uniqueQuotationStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueOrderStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger><SelectValue placeholder="Filter by Date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-90-days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 col-span-2 lg:col-span-1">
            <Input type="number" placeholder="Min Value" value={valueRange.min} onChange={e => setValueRange(prev => ({ ...prev, min: e.target.value }))} />
            <span className="text-muted-foreground">-</span>
            <Input type="number" placeholder="Max Value" value={valueRange.max} onChange={e => setValueRange(prev => ({ ...prev, max: e.target.value }))} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Quotation Status</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((q) => (
                  <TableRow key={q.quotation_id} onClick={() => handleRowClick(q)} className="cursor-pointer">
                    <TableCell className="font-medium">{q.quotation_id}</TableCell>
                    <TableCell>
                      <div>{q.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{q.domain_name}</div>
                    </TableCell>
                    <TableCell>{q.reseller_name}</TableCell>
                    <TableCell>{new Date(q.created_date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge className={cn("capitalize", getQuotationStatusColor(q.quotation_status))}>{q.quotation_status}</Badge></TableCell>
                    <TableCell><Badge className={cn("capitalize", getOrderStatusColor(q.order_status))}>{q.order_status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">₹{parseFloat(q.final_price_wt_gst).toLocaleString('en-IN')}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {q.quotation_status === 'Pending' && (
                        <div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => handleQuotationAction(q, 'accept')} title="Accept"><CheckCircle className="h-5 w-5 text-green-600" /></Button><Button variant="ghost" size="icon" onClick={() => handleQuotationAction(q, 'reject')} title="Reject"><XCircle className="h-5 w-5 text-red-600" /></Button></div>
                      )}
                      {q.quotation_status === 'Rejected' && (
                        <Button variant="ghost" size="icon" onClick={() => handleQuotationAction(q, 'accept')} title="Accept"><CheckCircle className="h-5 w-5 text-green-600" /></Button>
                      )}
                      {q.quotation_status === 'Accepted' && (
                        <Button variant="ghost" size="icon" onClick={() => handleQuotationAction(q, 'reject')} title="Reject"><XCircle className="h-5 w-5 text-red-600" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{indexOfFirstRecord + 1}</strong> to <strong>{Math.min(indexOfLastRecord, filteredQuotations.length)}</strong> of <strong>{filteredQuotations.length}</strong> quotations.
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                <span>Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderDetailView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
      <div className="md:col-span-1 flex flex-col h-full border-r pr-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quotations ({filteredQuotations.length})</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsSplitView(false)}><X className="h-4 w-4 mr-1" /> Close</Button>
        </div>
        <ScrollArea className="overflow-y-auto space-y-2 pr-2 max-h-[calc(100vh-200px)]">
          {filteredQuotations.map((q) => (
            <div key={q.quotation_id} onClick={() => setSelectedQuotation(q)} className={cn("p-2 border rounded-md text-sm cursor-pointer", selectedQuotation?.quotation_id === q.quotation_id ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
              <p className="font-medium">{q.quotation_id}</p>
              <p className="text-xs">{q.customer_name}</p>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="md:col-span-2 flex flex-col h-full">
        {selectedQuotation && (
          <ScrollArea className="max-h-[calc(100vh-150px)] pr-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Details for {selectedQuotation.quotation_id}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1"><Label>Customer</Label><p>{selectedQuotation.customer_name}</p></div>
                  <div className="space-y-1"><Label>Domain</Label><p>{selectedQuotation.domain_name}</p></div>
                  <div className="space-y-1"><Label>Reseller</Label><p>{selectedQuotation.reseller_name}</p></div>
                  <div className="space-y-1"><Label>Created</Label><p>{new Date(selectedQuotation.created_date).toLocaleString()}</p></div>
                  <div className="space-y-1"><Label>Expires</Label><p>{new Date(selectedQuotation.quotation_expiry).toLocaleString()}</p></div>
                  <div className="space-y-1"><Label>Quotation Status</Label><p><Badge className={cn(getQuotationStatusColor(selectedQuotation.quotation_status))}>{selectedQuotation.quotation_status}</Badge></p></div>
                  <div className="space-y-1"><Label>Order Status</Label><p><Badge className={cn(getOrderStatusColor(selectedQuotation.order_status))}>{selectedQuotation.order_status}</Badge></p></div>
                  {/* <div className="space-y-1"><Label>Discount</Label><p>{selectedQuotation.discount || 'N/A'}</p></div> */}
                  <div className="space-y-1"><Label>Total (included GST 18%)</Label><p className="font-bold">₹{parseFloat(selectedQuotation.final_price_wt_gst).toLocaleString('en-IN')}</p></div>
                </CardContent>
                {selectedQuotation.quotation_status === 'Pending' && (
                  <div className="flex justify-end gap-2 p-4 border-t">
                    <Button variant="outline" onClick={() => handleQuotationAction(selectedQuotation, 'accept')} title="Accept"><CheckCircle className="h-5 w-5 text-green-600 mr-2" /> Accept</Button>
                    <Button variant="destructive" onClick={() => handleQuotationAction(selectedQuotation, 'reject')} title="Reject"><XCircle className="h-5 w-5 mr-2" /> Reject</Button>
                  </div>
                )}
                {selectedQuotation.quotation_status === 'Rejected' && (
                  <div className="flex justify-end gap-2 p-4 border-t"><Button variant="outline" onClick={() => handleQuotationAction(selectedQuotation, 'accept')} title="Accept"><CheckCircle className="h-5 w-5 text-green-600 mr-2" /> Accept</Button></div>
                )}
                {selectedQuotation.quotation_status === 'Accepted' && (
                  <div className="flex justify-end gap-2 p-4 border-t"><Button variant="destructive" onClick={() => handleQuotationAction(selectedQuotation, 'reject')} title="Reject"><XCircle className="h-5 w-5 mr-2" /> Reject</Button></div>
                )}
              </Card>
              <Card>
                <CardHeader><CardTitle>Products ({selectedQuotation.concatenated_products.length})</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU Name</TableHead><TableHead>Users</TableHead><TableHead>Purchase Type</TableHead><TableHead>List Price</TableHead><TableHead>Product Discount(%)</TableHead><TableHead>Shiviom Price</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedQuotation.concatenated_products.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.product_name}</TableCell>
                          <TableCell>{p.skuname}</TableCell>
                          <TableCell>{p.usercount}</TableCell>
                          <TableCell>{p.purchaseType}</TableCell>
                          <TableCell>{p.actual_sku_price}</TableCell>
                          <TableCell>{p.product_discount || 'N/A'}%</TableCell>
                          <TableCell>{p.shivaami_price}</TableCell>
                          <TableCell className="text-right">₹{parseFloat(p.shivaamisubtotal).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end mt-4">
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2">
                        <span>Total Subtotal</span>
                        <span>
                          ₹{selectedQuotation.concatenated_products.reduce((sum, p) => sum + parseFloat(p.shivaamisubtotal), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isSplitView ? renderDetailView() : renderMainContent()}

      {/* Quotation Rejection Dialog */}
      <Dialog open={isRejectQuotationDialogOpen} onOpenChange={setIsRejectQuotationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting quotation: {selectedQuotationForAction?.quotation_id}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="quotation-rejection-reason" className="sr-only">Rejection Reason</Label>
            <Textarea
              id="quotation-rejection-reason"
              value={quotationRejectionReason}
              onChange={(e) => setQuotationRejectionReason(e.target.value)}
              placeholder="Provide a clear reason for rejection..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectQuotationDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmQuotationRejection} disabled={!quotationRejectionReason.trim()}>Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Quotation Dialog */}
      <Dialog open={isGenerateQuotationDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddedProducts([]); setQuotationType('new'); setSelectedQuotationPartner(''); setSelectedQuotationCustomer('');
          resetProductForm(); setPartnerConditions(''); setCustomerConditions('');
          setSelectedDomain(''); setQuotationFor('customer'); setQuotationExpiry('');
        }
        setIsGenerateQuotationDialogOpen(open);
      }}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle>Generate New Quotation</DialogTitle>
            <DialogDescription>Fill in the details below to generate a new quotation.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="py-4 space-y-6 pr-6">
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                <Label htmlFor="quotation-type">Quotation Type</Label>
                <Select value={quotationType} onValueChange={(value) => setQuotationType(value)}>
                  <SelectTrigger id="quotation-type">
                    <SelectValue placeholder="Select quotation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Case</SelectItem>
                    <SelectItem value="renewal">Renewal Case</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div>
                  <Label htmlFor="partner-for-quotation">Select Partner</Label>
                  <Select value={selectedQuotationPartner} onValueChange={handleQuotationPartnerChange}>
                    <SelectTrigger id="partner-for-quotation"><SelectValue placeholder="Select a partner" /></SelectTrigger>
                    <SelectContent>
                      {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.company})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer-for-quotation">Select Customer</Label>
                  <Select value={selectedQuotationCustomer} onValueChange={handleQuotationCustomerChange} disabled={!selectedQuotationPartner || isLoadingPartnerCustomers}>
                    <SelectTrigger id="customer-for-quotation">
                      <SelectValue placeholder={isLoadingPartnerCustomers ? "Loading..." : "Select a customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!isLoadingPartnerCustomers && partnerCustomers.length === 0 ? (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                          No customers found for this partner.
                        </div>
                      ) : (
                        partnerCustomers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.domainName})</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label htmlFor="plan-type">Plan Type</Label><Select value={planType} onValueChange={setPlanType}><SelectTrigger id="plan-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Yearly">Yearly</SelectItem></SelectContent></Select></div>
                <div><Label htmlFor="plan-duration">Plan Duration</Label><Input id="plan-duration" type="number" min="1" value={planDuration} onChange={e => setPlanDuration(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))} /></div>
                {/* <div><Label htmlFor="partner-discount">Partner Discount (%)</Label><Input id="partner-discount" value={selectedPartnerForQuotation?.partner_discount ?? 'N/A'} disabled /></div> */}
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">{editingProductId ? 'Edit Product' : 'Add Product'}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {isProductDataLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading product options...</div> :
                    <div className={cn("grid grid-cols-1 gap-4", selectedOem === 'Google Workspace' ? 'md:grid-cols-4' : 'md:grid-cols-4')}>
                      <div><Label>OEM</Label><Select value={selectedOem} onValueChange={v => {
                        setSelectedOem(v);
                        setSelectedProduct('');
                        setSelectedSku('');
                        if (v !== 'Google Workspace') {
                          setSkuDiscount(''); // Reset discount if not Google Workspace
                        }
                      }}><SelectTrigger><SelectValue placeholder="Select OEM" /></SelectTrigger><SelectContent>{oems.map(oem => <SelectItem key={oem} value={oem}>{oem}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Product</Label><Select value={selectedProduct} onValueChange={v => { setSelectedProduct(v); setSelectedSku(''); }} disabled={!selectedOem}><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger><SelectContent>{productsForOem.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>SKU</Label><Select value={selectedSku} onValueChange={setSelectedSku} disabled={!selectedProduct}><SelectTrigger><SelectValue placeholder="Select SKU" /></SelectTrigger><SelectContent>{skusForProduct.map(sku => <SelectItem key={sku} value={sku}>{sku}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label htmlFor="license-count">License Count</Label><Input id="license-count" type="number" min="1" value={licenseCount} onChange={e => setLicenseCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))} placeholder="e.g., 10" /></div>
                      {/* {selectedOem === 'Google Workspace' && (
                        <div><Label htmlFor="sku-discount">SKU Discount (%)</Label><Input id="sku-discount" type="number" min="0" max="100" value={skuDiscount} onChange={e => setSkuDiscount(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="e.g., 5" /></div>
                      )} */}
                      <div className="flex gap-2">
                        <Button onClick={editingProductId ? handleUpdateProduct : handleAddProductToQuotation} disabled={isPriceLoading || !selectedSku || !licenseCount} className="w-full">
                          {isPriceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingProductId ? 'Update' : 'Add'}
                        </Button>
                        {editingProductId && <Button variant="outline" onClick={resetProductForm} className="w-full">Cancel</Button>}
                      </div>
                    </div>
                  }
                  {/* Display existing/fetched discounts */}
                  {isDiscountsLoading ? (
                    <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin mr-2" />Loading existing discounts...</div>
                  ) : fetchedProductDiscounts.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Configured Product Discounts</CardTitle></CardHeader>
                      <CardContent>
                        <ScrollArea className="h-40 w-full rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU (ID)</TableHead>
                                <TableHead>New Discount (%)</TableHead>
                                <TableHead>Renewal Discount (%)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fetchedProductDiscounts.map((discountItem) => {
                                const fullProduct = allProducts.find(p => p.id === discountItem.crm_prod_id);
                                const productName = fullProduct?.name || 'N/A';
                                const skuDetail = productData[fullProduct?.oem || '']?.[fullProduct?.name || '']?.find(
                                  (sku: any) => sku.sku_name === discountItem.skuName
                                );
                                const skuId = skuDetail?.sku_id || '';

                                return (
                                  <TableRow key={discountItem.crm_prod_id}>
                                    <TableCell>{productName}</TableCell>
                                    <TableCell className="font-medium">{discountItem.skuName} {skuId && `(${skuId})`}</TableCell>
                                    <TableCell>{discountItem.discount}%</TableCell>
                                    <TableCell>{discountItem.renewal_discount}%</TableCell>

                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader><CardTitle className="text-base">Add Add-on Service</CardTitle></CardHeader>
                <CardContent>
                  {isLoadingAddons ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading add-on services...</div> :
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label>Service</Label>
                        <Select value={selectedAddon} onValueChange={setSelectedAddon}>
                          <SelectTrigger><SelectValue placeholder="Select an add-on service" /></SelectTrigger>
                          <SelectContent>
                            {addons.map(addon => <SelectItem key={addon.id} value={addon.id}>{addon.name} (₹{addon.price})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddAddonToQuotation} disabled={!selectedAddon} className="self-end">Add Service</Button>
                    </div>
                  }
                </CardContent>
              </Card> */}

              {addedProducts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Quotation Items</h4>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>OEM</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Purchase Type</TableHead>
                      <TableHead>Licenses</TableHead>
                      <TableHead>Prod Disc. %</TableHead>
                      {/* <TableHead>SKU Disc. %</TableHead> */}
                      {quotationType === 'new' ? <>
                        <TableHead>List Price</TableHead>
                        <TableHead>Shiviom Price</TableHead>
                      </> : <>
                        <TableHead>Renewal List Price</TableHead>
                        <TableHead>Renewal Shiviom Price</TableHead>
                      </>}
                      <TableHead>Subtotal</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {addedProducts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.oemName}</TableCell>
                          <TableCell>{p.productName}</TableCell><TableCell>{p.skuName}</TableCell>
                          <TableCell className="capitalize">{p.purchaseType}</TableCell>
                          <TableCell>{p.licenseCount}</TableCell><TableCell>{p.prodDiscount}%</TableCell>
                          <TableCell>₹{p.listPrice?.toLocaleString('en-IN')}</TableCell><TableCell>₹{p.shivaamiPrice?.toLocaleString('en-IN')}</TableCell>
                          <TableCell>₹{p.subtotal?.toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProduct(p.id)} disabled={!!editingProductId}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveProduct(p.id)}><X className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end mt-4">
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{quotationTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (18%)</span><span className="font-medium">₹{quotationTotals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2"><span>Grand Total</span><span>₹{quotationTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {isLoadingConditions ? (
              <div className="flex items-center justify-center p-4 border rounded-md bg-muted/50"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading Terms & Conditions...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label htmlFor="partner-conditions" className="mb-2 block">Partner/Reseller Terms & Conditions</Label><Textarea id="partner-conditions" value={partnerConditions} onChange={(e) => setPartnerConditions(e.target.value)} rows={6} placeholder="Enter partner conditions, one per line..." /></div>
                <div><Label htmlFor="customer-conditions" className="mb-2 block">Customer Terms & Conditions</Label><Textarea id="customer-conditions" value={customerConditions} onChange={(e) => setCustomerConditions(e.target.value)} rows={6} placeholder="Enter customer conditions, one per line..." /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <Label htmlFor="quotation-for">Quotation For</Label>
                <Select value={quotationFor} onValueChange={setQuotationFor}>
                  <SelectTrigger id="quotation-for"><SelectValue placeholder="Select who this is for" /></SelectTrigger>
                  <SelectContent><SelectItem value="Reseller">Reseller</SelectItem><SelectItem value="Customer">Customer</SelectItem><SelectItem value="Both">Both</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="quotation-expiry">Quotation Expiry Date</Label><Input id="quotation-expiry" type="date" value={quotationExpiry} onChange={e => setQuotationExpiry(e.target.value)} /></div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateQuotationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateQuotation} disabled={addedProducts.length === 0 || isGeneratingQuotation || !selectedQuotationCustomer || !quotationExpiry}>
              {isGeneratingQuotation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Quotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quotations;
