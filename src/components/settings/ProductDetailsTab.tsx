import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Package, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductDetails {
  id: string;
  name: string;
  website: string;
  category: string;
  description: string;
  price: number;
  status: 'active' | 'inactive';
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface ProductDetailsTabProps {
  products: ProductDetails[];
  setProducts: (products: ProductDetails[]) => void;
  categories: ProductCategory[];
  isAdmin?: boolean;
}

const ProductDetailsTab = ({ products, setProducts, categories, isAdmin = false }: ProductDetailsTabProps) => {
  const [editingProduct, setEditingProduct] = useState<ProductDetails | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    website: '',
    category: '',
    description: '',
    price: 0
  });

  const { toast } = useToast();

  const handleCreateProduct = () => {
    if (!productFormData.name.trim() || !productFormData.website.trim() || !productFormData.category || !productFormData.description.trim() || productFormData.price <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const newProduct: ProductDetails = {
      id: Date.now().toString(),
      name: productFormData.name,
      website: productFormData.website,
      category: productFormData.category,
      description: productFormData.description,
      price: productFormData.price,
      status: 'active'
    };

    setProducts([...products, newProduct]);
    setProductFormData({ name: '', website: '', category: '', description: '', price: 0 });
    setIsCreatingProduct(false);
    
    toast({
      title: "Success",
      description: "Product created successfully",
    });
  };

  const handleUpdateProduct = () => {
    if (!editingProduct || !productFormData.name.trim() || !productFormData.website.trim() || !productFormData.category || !productFormData.description.trim() || productFormData.price <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setProducts(products.map(product => 
      product.id === editingProduct.id 
        ? { ...product, name: productFormData.name, website: productFormData.website, category: productFormData.category, description: productFormData.description, price: productFormData.price }
        : product
    ));
    
    setEditingProduct(null);
    setProductFormData({ name: '', website: '', category: '', description: '', price: 0 });
    
    toast({
      title: "Success",
      description: "Product updated successfully",
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(product => product.id !== productId));
    toast({
      title: "Success",
      description: "Product deleted successfully",
    });
  };

  const handleToggleProductStatus = (productId: string) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, status: product.status === 'active' ? 'inactive' : 'active' }
        : product
    ));
    
    toast({
      title: "Success",
      description: "Product status updated successfully",
    });
  };

  const startEditingProduct = (product: ProductDetails) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      website: product.website,
      category: product.category,
      description: product.description,
      price: product.price
    });
    setIsCreatingProduct(false);
  };

  const cancelProductEditing = () => {
    setEditingProduct(null);
    setIsCreatingProduct(false);
    setProductFormData({ name: '', website: '', category: '', description: '', price: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Product Form - Only show for admins */}
      {isAdmin && (isCreatingProduct || editingProduct) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProduct ? 'Edit Product' : 'Create New Product'}</CardTitle>
            <CardDescription>
              Manage OEM details and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="e.g., Azure Active Directory"
              />
            </div>
            
            <div>
              <Label htmlFor="product-website">Website</Label>
              <Input
                id="product-website"
                value={productFormData.website}
                onChange={(e) => setProductFormData({ ...productFormData, website: e.target.value })}
                placeholder="e.g., azure.microsoft.com"
              />
            </div>
            
            <div>
              <Label htmlFor="product-category">Category</Label>
              <Select value={productFormData.category} onValueChange={(value) => setProductFormData({ ...productFormData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => cat.isActive).map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                rows={3}
                placeholder="Describe this product..."
              />
            </div>
            
            <div>
              <Label htmlFor="product-price">Price ($)</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                value={productFormData.price}
                onChange={(e) => setProductFormData({ ...productFormData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
              <Button variant="outline" onClick={cancelProductEditing}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Product Button - Only show for admins */}
      {isAdmin && !isCreatingProduct && !editingProduct && (
        <Button onClick={() => setIsCreatingProduct(true)} className="gap-2">
          <Package size={16} />
          Add New OEM
        </Button>
      )}

      {/* Products List */}
      <div className="space-y-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {product.name}
                    <Badge variant={product.status === 'active' ? "default" : "secondary"}>
                      {product.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{product.category} - ${product.price.toFixed(2)}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                  <a 
                    href={`https://${product.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {product.website}
                  </a>
                </div>
                {/* Admin Controls - Only show for admins */}
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditingProduct(product)}
                      className="gap-1"
                    >
                      <Edit2 size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleProductStatus(product.id)}
                    >
                      {product.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductDetailsTab;
