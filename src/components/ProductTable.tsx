
import { useState, useMemo } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '../types';
import ProductTableHeader from './ProductTableHeader';
import ProductTableRow from './ProductTableRow';
import ProductDetail from './ProductDetail';
import ProductForm from './ProductForm';
import { useAuth } from '@/contexts/AuthContext';

interface ProductTableProps {
  products: Product[];
  onPriceUpdate?: (productId: string, newPrice: number) => void;
  onStatusChange?: (productId: string, newStatus: 'active' | 'inactive') => void;
  onBulkStatusChange?: (productIds: string[], newStatus: 'active' | 'inactive') => void;
  onBulkImport?: (products: Product[]) => void;
  onProductUpdate?: (productId: string, updates: Partial<Product>) => void;
  onAddProduct?: (product: Product) => void;
}

const ProductTable = ({ products, onPriceUpdate, onStatusChange, onBulkStatusChange, onBulkImport, onProductUpdate, onAddProduct }: ProductTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { isAdmin, profile } = useAuth();

  // Get current user role from auth context
  const currentUserRole = profile?.role || 'user';

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

  const handleStatusToggle = (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    console.log('Status toggle called for product:', productId, 'from', currentStatus, 'to', newStatus);
    onStatusChange?.(productId, newStatus as 'active' | 'inactive');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
  };

  const handleProductUpdate = (productId: string, updates: Partial<Product>) => {
    const updatedProduct = { ...updates, lastEdited: new Date() };
    onProductUpdate?.(productId, updatedProduct);
  };

  const handleAddProduct = (product: Product) => {
    onAddProduct?.(product);
    setShowAddForm(false);
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  // Dummy handlers for removed bulk functionality
  const handleSelect = (productId: string) => {
    // No longer used since bulk actions are removed
  };

  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={handleBackToList} onProductUpdate={handleProductUpdate} />;
  }

  if (showAddForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Add New Product</h2>
          <Button variant="outline" onClick={handleCancelAdd}>
            Back to Products
          </Button>
        </div>
        <ProductForm onProductAdd={handleAddProduct} />
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
          onBulkImport={onBulkImport}
          onAddProduct={handleShowAddForm}
        />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Software Name</TableHead>
                <TableHead>Plans</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active Customers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Last Edited</TableHead>
                {isAdmin && <TableHead>Status Toggle</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  currentUserRole={currentUserRole}
                  isSelected={false}
                  onSelect={handleSelect}
                  onStatusToggle={handleStatusToggle}
                  onProductClick={handleProductClick}
                  onProductUpdate={handleProductUpdate}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductTable;
