import { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Product } from '../types';
import ProductTableHeader from './ProductTableHeader';
import ProductTableRow from './ProductTableRow';
import ProductDetail from './ProductDetail';
import ProductForm from './ProductForm';
import AddonForm from './AddonForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// The component is now self-contained and does not require props for data management.
interface ProductTableProps {}

const ProductTable = ({}: ProductTableProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { isAdmin, profile } = useAuth();
  const [isKnowledgeHubOpen, setIsKnowledgeHubOpen] = useState(false);
  const [selectedProductForKb, setSelectedProductForKb] = useState<Product | null>(null);
  const { toast } = useToast();

  // Get current user role from auth context
  const currentUserRole = profile?.role || 'user';

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = data.map((p: any) => ({
        id: p.id,
        oem: p.oem,
        name: p.name,
        website: p.website,
        category: p.category,
        description: p.description,
        status: p.status,
        customersCount: p.customers_count || 0,
        plans: p.plans || [],
        createdAt: new Date(p.created_at),
        product_type: p.product_type || 'main_product',
        knowledgeBase: p.knowledge_base || [],
        lastEdited: p.last_edited_at ? new Date(p.last_edited_at) : undefined,
        portal_prod_id: p.portal_prod_id,
      }));
      setProducts(mappedProducts);
    } catch (error: any) {
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // When products list is updated, find the currently selected product and update its state
    // to ensure the detail view gets the latest data.
    if (selectedProduct) {
      const updatedSelectedProduct = products.find(p => p.id === selectedProduct.id);
      if (updatedSelectedProduct) {
        // Avoid infinite loop by checking if data is actually different.
        if (JSON.stringify(selectedProduct) !== JSON.stringify(updatedSelectedProduct)) {
          setSelectedProduct(updatedSelectedProduct);
        }
      } else {
        // The product might have been deleted, so go back to the list.
        setSelectedProduct(null);
      }
    }
  }, [products, selectedProduct]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchMatch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === 'all' || product.status === statusFilter;
      const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
      
      return searchMatch && statusMatch && categoryMatch;
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  const handleStatusToggle = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus, last_edited_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status updated successfully' });
      await fetchProducts();
    }
  };

  const handleSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
  };

  const handleProductUpdate = async (productId: string, updates: Partial<Product>) => {
    const dbUpdates: { [key: string]: any } = { ...updates, last_edited_at: new Date().toISOString() };
    delete dbUpdates.createdAt;
    delete dbUpdates.lastEdited;
    if ('customersCount' in dbUpdates) {
        dbUpdates.customers_count = dbUpdates.customersCount;
        delete dbUpdates.customersCount;
    }
    if ('knowledgeBase' in dbUpdates) {
        dbUpdates.knowledge_base = dbUpdates.knowledgeBase;
        delete dbUpdates.knowledgeBase;
    }

    const { error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', productId);

    if (error) {
      toast({ title: 'Error updating product', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product updated successfully' });
      await fetchProducts();
      // Close the dialog if it's open for the updated product
      if (isKnowledgeHubOpen && selectedProductForKb?.id === productId) {
        const updatedProduct = products.find(p => p.id === productId);
        setSelectedProductForKb(updatedProduct || null);
      }
    }
  };

  const handleAddSuccess = async () => {
    setShowAddForm(false);
    await fetchProducts();
  };

  const handleBulkImport = async (importedProducts: any[]) => {
    const productsToInsert = importedProducts.map(p => ({
      name: p.name,
      website: p.website,
      category: p.category,
      description: p.description,
      status: p.status || 'active',
      plans: p.plans ? (typeof p.plans === 'string' ? JSON.parse(p.plans) : p.plans) : [],
    }));

    const { error } = await supabase.from('products').insert(productsToInsert);

    if (error) {
      toast({ title: 'Error importing products', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Import successful', description: `${importedProducts.length} products imported.` });
      await fetchProducts();
    }
  };

  const handleAddonSuccess = async () => {
    setShowAddonForm(false);
    await fetchProducts();
  };

  const handleCategoryAdded = async () => {
    // Refetch products to ensure all related data (including categories in forms) is up-to-date.
    await fetchProducts();
  };

  const handleKnowledgeHubClick = (product: Product) => {
    setSelectedProductForKb(product);
    setIsKnowledgeHubOpen(true);
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  const handleShowAddonForm = () => {
    setShowAddonForm(true);
    setShowAddForm(false); // Ensure only one form is open
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'inactive') => {
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus, last_edited_at: new Date().toISOString() })
      .in('id', selectedProducts);

    if (error) {
      toast({ title: 'Error updating products', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Bulk status update successful' });
      setSelectedProducts([]);
      await fetchProducts();
    }
  };

  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={handleBackToList} onDataRefresh={fetchProducts} />;
  }

  if (showAddonForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Add New Add-on Service</h2>
          <Button variant="outline" onClick={() => setShowAddonForm(false)}>
            Back to Products
          </Button>
        </div>
        <AddonForm onSuccess={handleAddonSuccess} />
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Add New OEM</h2>
          <Button variant="outline" onClick={handleCancelAdd}>
            Back to Products
          </Button>
        </div>
        <ProductForm onSuccess={handleAddSuccess} />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <ProductTableHeader
          products={products}
          filteredProducts={filteredProducts}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          currentUserRole={currentUserRole}
          onSearchChange={setSearchTerm}
          onStatusFilter={setStatusFilter}
          onCategoryFilter={setCategoryFilter}
          onBulkImport={handleBulkImport}
          onAddAddon={handleShowAddonForm}
          onAddProduct={handleShowAddForm}
          onProductUpdate={handleProductUpdate}
          onCategoryAdded={handleCategoryAdded}
          isKnowledgeHubOpen={isKnowledgeHubOpen}
          onKnowledgeHubOpenChange={setIsKnowledgeHubOpen}
          selectedProductForKb={selectedProductForKb}
        />
        <CardContent>
          {isAdmin && selectedProducts.length > 0 && (
            <div className="flex items-center gap-2 p-4 border-b bg-muted/50">
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('inactive')}>
                    Set Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && (
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                      disabled={filteredProducts.length === 0}
                    />
                  </TableHead>
                )}
                <TableHead>OEM</TableHead>
                <TableHead>Available Plans</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active Customers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Last Edited</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                <TableHead>Knowledge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={isAdmin ? 11 : 9} className="h-24 text-center">Loading products...</TableCell></TableRow>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    currentUserRole={currentUserRole}
                    isSelected={selectedProducts.includes(product.id)}
                    onSelect={handleSelect}
                    onStatusToggle={handleStatusToggle}
                    onProductClick={handleProductClick}
                    onKnowledgeHubClick={handleKnowledgeHubClick}
                    onProductUpdate={handleProductUpdate}
                  />
                ))
              ) : (
                <TableRow><TableCell colSpan={isAdmin ? 12 : 10} className="h-24 text-center">No products found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductTable;
