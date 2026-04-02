
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProductPlansCell from './ProductPlansCell';
import { BookOpen } from 'lucide-react';
import { Product } from '../types';
import { cn } from '@/lib/utils';

interface ProductTableRowProps {
  product: Product;
  currentUserRole: string;
  isSelected: boolean;
  onSelect: (productId: string) => void;
  onStatusToggle: (productId: string, currentStatus: string) => void;
  onProductClick: (product: Product) => void;
  onKnowledgeHubClick: (product: Product) => void;
  onProductUpdate?: (productId: string, updates: Partial<Product>) => void;
}

const ProductTableRow = ({ product, currentUserRole, isSelected, onSelect, onStatusToggle, onProductClick, onKnowledgeHubClick, onProductUpdate }: ProductTableRowProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, input, a, [role="switch"]')) {
      return;
    }
    onProductClick(product);
  };

  const handleOemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(product.oem);
    onProductClick(product);
  };

  const plans = Array.isArray(product.plans) ? product.plans : [];
  const isInactive = product.status === 'inactive';

  return (
    <TableRow 
      className={`hover:bg-muted/50 cursor-pointer ${isInactive ? 'opacity-60' : ''}`} 
      onClick={handleRowClick}
    >
      {currentUserRole === 'admin' && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onSelect(product.id)}
            disabled={isInactive}
            className={isInactive ? 'cursor-not-allowed' : ''}
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        <div className={`font-semibold ${isInactive ? 'text-muted-foreground' : ''}`} >
          {product.name}
          {isInactive && <span className="ml-2 text-xs text-red-600">(Inactive)</span>}
        </div>
        {product.oem && (
          <div className="text-xs text-muted-foreground hover:underline" onClick={handleOemClick}>
            by {product.oem}
          </div>
        )}
      </TableCell>
      <TableCell>
        {plans.length > 1 ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-left" onClick={(e) => e.stopPropagation()}>
                {plans.length} plans available
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80" 
              onClick={(e) => e.stopPropagation()}
              side="top"
              align="start"
            >
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Available Plans</h4>
                <p className="text-sm text-muted-foreground">
                  All pricing plans for {product.name}.
                </p>
              </div>
              <ScrollArea className={cn("mt-4 max-h-72", plans.length > 3 && "h-72")}>
                <div className="pr-4">
                  <ProductPlansCell plans={plans} />
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-muted-foreground text-sm">No plans available</span>
        )}
      </TableCell>
      <TableCell>
        <a 
          href={`https://${product.website}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {product.website}
        </a>
      </TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell className="max-w-xs truncate">{product.description}</TableCell>
      <TableCell>{product.customersCount}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(product.status)}>
          {product.status}
        </Badge>
      </TableCell>
      <TableCell>{product.createdAt.toLocaleDateString()}</TableCell>
      <TableCell>
        {product.lastEdited ? (
          <div className="text-sm">
            <div>{product.lastEdited.toLocaleDateString()}</div>
            <div className="text-muted-foreground text-xs">
              {product.lastEdited.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Never</span>
        )}
      </TableCell>
      {currentUserRole === 'admin' && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={product.status === 'active'}
            onCheckedChange={() => onStatusToggle(product.id, product.status)}
          />
        </TableCell>
      )}
      {/* This cell was added previously and is correct. */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onKnowledgeHubClick(product)}>
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default ProductTableRow;
