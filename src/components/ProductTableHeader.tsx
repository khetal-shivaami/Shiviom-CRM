
import { useState } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { Product } from '../types';
import BulkImportDialog from './BulkImportDialog';
import ProductTableFilters from './ProductTableFilters';
import AddCategoryDialog from './AddCategoryDialog';
import KnowledgeHubDialog from './KnowledgeHubDialog';

interface ProductTableHeaderProps {
  products: Product[];
  filteredProducts: Product[];
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  currentUserRole: string;
  onSearchChange: (value: string) => void;
  onStatusFilter: (status: string) => void;
  onCategoryFilter: (category: string) => void;
  isKnowledgeHubOpen: boolean;
  onKnowledgeHubOpenChange: (isOpen: boolean) => void;
  selectedProductForKb: Product | null;
  onBulkImport?: (products: Product[]) => void;
  onAddAddon?: () => void;
  onAddProduct?: () => void;
  onProductUpdate?: (productId: string, updates: Partial<Product>) => void;
  onCategoryAdded?: () => void;
}

const ProductTableHeader = ({
  products,
  filteredProducts,
  searchTerm,
  statusFilter,
  categoryFilter,
  currentUserRole,
  onSearchChange,
  onStatusFilter,
  onCategoryFilter,
  isKnowledgeHubOpen,
  onKnowledgeHubOpenChange,
  selectedProductForKb,
  onBulkImport,
  onAddAddon,
  onAddProduct,
  onProductUpdate,
  onCategoryAdded,
}: ProductTableHeaderProps) => {
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);

  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>
          Product Details ({filteredProducts.length} of {products.length})
        </CardTitle>
        <div className="flex items-center gap-2">          
          {currentUserRole === 'admin' && (onAddProduct || onAddAddon || onCategoryAdded) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} />
                  Add New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCategoryAdded && <DropdownMenuItem onClick={() => setIsAddCategoryDialogOpen(true)}>Add New Category</DropdownMenuItem>}
                {onAddProduct && <DropdownMenuItem onClick={onAddProduct}>Add Product</DropdownMenuItem>}
                {onAddAddon && <DropdownMenuItem onClick={onAddAddon}>Add Add-on Service</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {currentUserRole === 'admin' && onBulkImport && (
            <BulkImportDialog
              type="products"
              onImport={onBulkImport}
            />
          )}
          
          <ProductTableFilters
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onStatusFilter={onStatusFilter}
            onCategoryFilter={onCategoryFilter}
          />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full md:w-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search software products by name, website, category, or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      {onCategoryAdded && (
        <AddCategoryDialog
          open={isAddCategoryDialogOpen}
          onOpenChange={setIsAddCategoryDialogOpen}
          onSuccess={onCategoryAdded}
        />
      )}
      <KnowledgeHubDialog
        product={selectedProductForKb}
        currentUserRole={currentUserRole}
        open={isKnowledgeHubOpen}
        onOpenChange={onKnowledgeHubOpenChange}
        onUpdateKnowledgeBase={(productId, knowledgeBase) => onProductUpdate?.(productId, { knowledgeBase })}
      />
    </CardHeader>
  );
};

export default ProductTableHeader;
