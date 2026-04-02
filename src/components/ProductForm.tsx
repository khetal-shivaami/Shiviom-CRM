import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep this line
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Product } from '../types';

interface ProductFormProps {
  onSuccess: () => void;
  productToEdit?: Product;
}

const ProductForm = ({ onSuccess, productToEdit }: ProductFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [oems, setOems] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingOems, setIsLoadingOems] = useState(true);
  const [selectedOemId, setSelectedOemId] = useState('');
  const [isAddingNewOem, setIsAddingNewOem] = useState(false);
  const [newOemName, setNewOemName] = useState('');
  const [oemProducts, setOemProducts] = useState<string[]>([]);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [isLoadingOemProducts, setIsLoadingOemProducts] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [features, setFeatures] = useState<{ name: string; description: string }[]>([]);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefitDescription, setNewBenefitDescription] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    category: '',
    description: '',
    short_description: '',
  });

  useEffect(() => {
    const fetchAndSetProductData = async () => {
      if (productToEdit) {
        // Initial setup from productToEdit
        setFormData({
          name: productToEdit.name,
          website: productToEdit.website,
          category: productToEdit.category,
          description: productToEdit.description,
          short_description: (productToEdit as any).short_description || '',
        });
        setNewProductName(productToEdit.name);
        setTags((productToEdit as any).tags || []);
        setFeatures((productToEdit as any).features || []);
        setBenefits((productToEdit as any).benefits || []);
        setIsAddingNewOem(false); // Ensure these are false when editing
        setIsAddingNewProduct(false); // Ensure these are false when editing

        // Find the OEM ID if OEMs are already loaded
        const oem = oems.find(o => o.name === productToEdit.oem);
        if (oem) {
          setSelectedOemId(oem.id);
        }

        // Fetch OEM details to populate description, short_description, category, tags, features, benefits
        try {
          const requestBody = new FormData();
          requestBody.append('oem_name', productToEdit.name);

          const response = await fetch(API_ENDPOINTS.GET_OEM_DETAILS, {
            method: 'POST',
            body: requestBody,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (result.success && result.prod_data && Array.isArray(result.prod_data.oem_data_result) && result.prod_data.oem_data_result.length > 0) {
            const oemDetails = result.prod_data.oem_data_result[0];

            setFormData(prev => ({
              ...prev,
              category: oemDetails.product_category || prev.category,
              description: oemDetails.oem_description || prev.description,
              short_description: oemDetails.oem_shortdesc || prev.short_description,
            }));

            if (oemDetails.prod_tagging) {
              setTags(oemDetails.prod_tagging.split(',').map((tag: string) => tag.trim()));
            }
            if (oemDetails.features) {
              setFeatures(oemDetails.features);
            }
            if (oemDetails.benefits) {
              setBenefits(oemDetails.benefits);
            }
          } else {
            toast({ title: "Warning", description: "Could not fetch detailed OEM information for the product.", variant: "default" });
          }
        } catch (error: any) {
          toast({ title: "Error fetching OEM details", description: error.message, variant: "destructive" });
        }
      }
    };
    if (productToEdit && oems.length > 0) {
      fetchAndSetProductData();
    } else if (productToEdit && !oems.length && !isLoadingOems) {
        setFormData({
          name: productToEdit.name,
          website: productToEdit.website,
          category: productToEdit.category,
          description: productToEdit.description,
          short_description: (productToEdit as any).short_description || '',
        });
        setNewProductName(productToEdit.name);
        setTags((productToEdit as any).tags || []);
        setFeatures((productToEdit as any).features || []);
        setBenefits((productToEdit as any).benefits || []);
        setIsAddingNewOem(false);
        setIsAddingNewProduct(false);
    }
  }, [productToEdit, oems, isLoadingOems, toast]);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const { data, error } = await supabase
          .from('products_category')
          .select('category_name')
          .order('category_name', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          const categoryNames = data
            .map(item => item.category_name)
            .filter((name): name is string => !!name);
          setCategories(categoryNames);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching categories",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [toast]);

  useEffect(() => {
    const fetchOems = async () => {
      setIsLoadingOems(true);
      try {
        const response = await fetch(API_ENDPOINTS.GET_OEM_LIST_ONCRM, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && Array.isArray(result.data.data_result)) {
          const oemData = result.data.data_result.map((item: any) => ({ id: item.oem_id, name: item.oem_name }))
            .filter((oem: any): oem is { id: string; name: string } => !!oem.id && !!oem.name);
          const uniqueOems = Array.from(new Map(oemData.map(oem => [oem.id, oem])).values());
          setOems(uniqueOems.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          throw new Error(result.message || "Invalid API response structure for OEMs.");
        }
      } catch (error: any) {
        toast({
          title: "Error fetching OEMs",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingOems(false);
      }
    };

    fetchOems();
  }, [toast]);

  useEffect(() => {
    const fetchProductsForOem = async () => {
      if (!selectedOemId) {
        setOemProducts([]);
        return;
      }
      setIsLoadingOemProducts(true);
      setOemProducts([]);
      setIsAddingNewProduct(false);
      setNewProductName('');
      setFormData(prev => ({ ...prev, name: '' })); // Reset product selection
      try {
        const requestBody = new FormData();
        requestBody.append('oem_id', selectedOemId);

        const response = await fetch(API_ENDPOINTS.GET_PRODUCT_LIST_ONCRM, {
          method: 'POST',
          body: requestBody,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.prod_data && Array.isArray(result.prod_data.product_data_result)) {
          const productNames = result.prod_data.product_data_result
            .map((item: any) => item.product_name)
            .filter((name: any): name is string => !!name);
          setOemProducts(productNames.sort());
        } else {
          throw new Error(result.message || "Invalid API response for products.");
        }
      } catch (error: any) {
        toast({ title: "Error fetching products", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingOemProducts(false);
      }
    };

    fetchProductsForOem();
  }, [selectedOemId, toast]);

  const handleOemChange = (value: string) => {
    if (value === '__add_new__') {
      setIsAddingNewOem(true);
      setSelectedOemId('');
      // When adding a new OEM, we must also add a new product.
      setIsAddingNewProduct(true);
      setFormData(prev => ({ ...prev, name: '' }));
    } else {
      setIsAddingNewOem(false);
      setSelectedOemId(value);
      // Reset new product state when selecting an existing OEM
      setIsAddingNewProduct(false);
      setNewProductName('');
    }
  };

  const handleProductChange = (value: string) => {
    if (value === '__add_new_product__') {
      setIsAddingNewProduct(true);
      setFormData(prev => ({ ...prev, name: '' }));
    } else {
      setIsAddingNewProduct(false);
      setNewProductName('');
      setFormData(prev => ({ ...prev, name: value }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleAddFeature = () => {
    if (newFeatureName.trim() !== '' && newFeatureDescription.trim() !== '') {
      setFeatures([...features, { name: newFeatureName.trim(), description: newFeatureDescription.trim() }]);
      setNewFeatureName('');
      setNewFeatureDescription('');
    } else {
      toast({
        title: "Missing Feature Details",
        description: "Please provide both a name and description for the feature.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFeature = (indexToRemove: number) => {
    setFeatures(features.filter((_, index) => index !== indexToRemove));
  };

  const handleAddBenefit = () => {
    if (newBenefitDescription.trim() !== '') {
      setBenefits([...benefits, newBenefitDescription.trim()]);
      setNewBenefitDescription('');
    } else {
      toast({
        title: "Missing Benefit Description",
        description: "Please provide a description for the benefit.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBenefit = (indexToRemove: number) => {
    setBenefits(benefits.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedOemObject = oems.find(oem => oem.id === selectedOemId);
    const finalOemName = productToEdit ? productToEdit.name : (isAddingNewOem ? newOemName.trim() : selectedOemObject?.name);
    const finalProductName = productToEdit ? newProductName.trim() : (isAddingNewProduct ? newProductName.trim() : formData.name);

    // Conditional validation based on whether we are adding a new product or editing/selecting an existing one
    if (isAddingNewProduct && !productToEdit) {
      if (!finalProductName || !formData.website || !formData.category || !formData.short_description || !formData.description || !finalOemName) {
        toast({ title: "Error", description: "Please fill in all required fields, including OEM, Product Name, and descriptions.", variant: "destructive" });
        return;
      }
    } else if (!productToEdit && (!finalProductName || !finalOemName)) { // For existing product selection or editing
      toast({ title: "Selection Missing", description: "Please select an OEM and a Product.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const productToInsert = {
        name:  finalProductName,
        website: formData.website,
        category: formData.category,
        short_description: formData.short_description,
        description: formData.description,
        oem: finalOemName,
        tags: tags,
        status: 'active',
        features: features, // Add features
        benefits: benefits, // Add benefits
        plans: [],
        product_type: 'main_product',
      };

      const productToLog = {
        ...productToInsert,
        features: JSON.stringify(features),
        benefits: JSON.stringify(benefits),
        tags: tags.join(','),
      };

      if (productToEdit) {
        // UPDATE LOGIC
        console.log("Product details to be updated in CRM:", JSON.stringify({ ...productToLog, id: productToEdit.portal_prod_id }, null, 2));

        // TODO: Implement actual CRM Update API call here.
        // Example:
        const updateCrmResponse = await fetch(API_ENDPOINTS.UPDATE_OEM_DETAILS_ONCRM, {
          method: 'POST', // or PUT
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...productToLog, id: productToEdit.portal_prod_id }),
        });
        const crmResult = await updateCrmResponse.json();
        if (!updateCrmResponse.ok || !crmResult.success) {
          throw new Error(crmResult.message || 'Failed to update product in CRM.');
        }

        // Supabase Update
        const { error: supabaseError } = await supabase
          .from('products')
          .update({
            name: productToInsert.name,
            website: productToInsert.website,
            category: productToInsert.category,
            // short_description: productToInsert.short_description,
            description: productToInsert.description,
            // oem: productToInsert.oem,
            tags: productToInsert.tags,
            // features: productToInsert.features,
            // benefits: productToInsert.benefits,
          })
          .eq('id', productToEdit.id);

        if (supabaseError) {
          throw new Error(`Supabase update failed: ${supabaseError.message}`);
        }

        toast({ title: "Success", description: "Product updated successfully!" });
        onSuccess();

      } else {
        // CREATE LOGIC
        console.log("Product details to be inserted in CRM:", JSON.stringify(productToLog, null, 2));

        // 1. Store data in CRM via API first
        const crmResponse = await fetch(API_ENDPOINTS.CERATE_NEW_PRODUCT_DETAILS_ONCRM, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productToLog),
        });

        const crmResult = await crmResponse.json();

        if (!crmResponse.ok || !crmResult.success) {
          throw new Error(crmResult.message || 'Failed to create product in CRM.');
        }

        if (!crmResult.prod_data) {
          throw new Error('CRM API did not return a product ID.');
        }
        
        const productForSupabase = {
          name: finalOemName,
          website: formData.website,
          category: formData.category,
          short_description: formData.short_description,
          description: formData.description,
          // oem: finalProductName,
          tags: tags,
          status: 'active',
          plans: [],
          product_type: 'main_product',
          portal_prod_id: crmResult.prod_data, // Add the prod_id from CRM response
        };

        // 2. If CRM is successful, store in Supabase only if it's not a new product being defined in the form
        if (isAddingNewProduct) {
          const { error: supabaseError } = await supabase.from('products').insert([productForSupabase]);
          if (supabaseError) {
            throw new Error(`CRM product created, but Supabase insert failed: ${supabaseError.message}`);
          }
        }

        toast({ title: "Success", description: "Product added successfully!" });
        onSuccess();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>{productToEdit ? 'Edit OEM' : 'Add New OEM'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="oem">OEM *</Label>
              {productToEdit ? (
                <Input
                  id="oem"
                  value={productToEdit.name}
                  disabled
                  className="bg-muted"
                />
              ) : (
                <>
                  <Select value={selectedOemId} onValueChange={handleOemChange} disabled={isLoadingOems}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingOems ? "Loading OEMs..." : "Select an OEM"} />
                    </SelectTrigger>
                    <SelectContent>
                      {oems.map((oem) => (
                        <SelectItem key={oem.id} value={oem.id}>{oem.name}</SelectItem>
                      ))}
                      <SelectItem value="__add_new__">
                        <span className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add New OEM</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isAddingNewOem && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="new-oem">New OEM Name *</Label>
                      <Input id="new-oem" value={newOemName} onChange={(e) => setNewOemName(e.target.value)} placeholder="Enter new OEM name" required />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              {/* <Label htmlFor="name">Select Product *</Label>
              <Select
                value={isAddingNewProduct ? '__add_new_product__' : formData.name}
                onValueChange={handleProductChange}
                disabled={!selectedOemId || isLoadingOemProducts || isAddingNewOem}
              >
                <SelectTrigger id="name">
                  <SelectValue placeholder={isLoadingOemProducts ? "Loading products..." : "Select a product"} />
                </SelectTrigger>
                <SelectContent>
                  {!isLoadingOemProducts && oemProducts.map((productName) => (
                    <SelectItem key={productName} value={productName}>
                      {productName}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add_new_product__">
                    <span className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" /> Add New Product
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {isAddingNewProduct && ( */}
              {!productToEdit && (
                <div className="pt-1 pl-2 space-y-1">
                  <Label htmlFor="new-product-name">New Product Name *</Label>
                  <Input
                    id="new-product-name"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Enter new product name"
                    required
                    disabled={!!productToEdit}
                  />
                </div>
                )}
              {/* )} */}
              
            </div>
            {/* {!productToEdit && (
              <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name *</Label>
                    <Input id="product-name" value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Enter product name"
                      required />
              </div>
            )} */}

            <div className="space-y-2">
              <Label htmlFor="website">Website *</Label>
              <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="example.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData?.category || productToEdit?.category} onValueChange={(value) => setFormData({ ...formData, category: value })} disabled={isLoadingCategories}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="short_description">Short Description *</Label>
              <Input id="short_description" value={formData.short_description|| productToEdit?.oem_shortdesc} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} placeholder="Enter a one-line summary of the product" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter product description" rows={3} required />
            </div>
            <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tags">Product Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Type a tag and press Enter"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>Add Tag</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                  <button type="button" className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => handleRemoveTag(index)}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="features">Features</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                id="new-feature-name"
                value={newFeatureName}
                onChange={(e) => setNewFeatureName(e.target.value)}
                placeholder="Feature Name"
              />
              <Input
                id="new-feature-description"
                value={newFeatureDescription}
                onChange={(e) => setNewFeatureDescription(e.target.value)}
                placeholder="Feature Description"
                className="md:col-span-1"
              />
              <Button type="button" variant="outline" onClick={handleAddFeature}>Add Feature</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {feature.name}: {feature.description}
                  <button type="button" className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => handleRemoveFeature(index)}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
            {features.length === 0 && (
              <p className="text-sm text-muted-foreground">Add one or more features for this product.</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="benefits">Benefits</Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-benefit-description"
                value={newBenefitDescription}
                onChange={(e) => setNewBenefitDescription(e.target.value)}
                placeholder="Benefit Description"
              />
              <Button type="button" variant="outline" onClick={handleAddBenefit}>Add Benefit</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {benefit}
                  <button type="button" className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => handleRemoveBenefit(index)}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
            {benefits.length === 0 && (
              <p className="text-sm text-muted-foreground">Add one or more benefits for this product.</p>
            )}
          </div>
        </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can add pricing plans after creating the product using the "Manage Plans" button in the products table.
            </p>
          </div>

          {/* Changed button to be small and positioned at the bottom right */}
          <div className="flex justify-end pt-6">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (productToEdit ? 'Updating...' : 'Adding...') : (productToEdit ? 'Update Product' : 'Add Product')}
          </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;