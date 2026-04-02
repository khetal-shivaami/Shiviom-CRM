
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Users, Edit2 } from 'lucide-react';
import { Product } from '../types';
import PlanManagementDialog from './PlanManagementDialog';
import ProductForm from './ProductForm';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onDataRefresh: () => void;
}

const ProductDetail = ({ product, onBack, onDataRefresh }: ProductDetailProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    console.log(product.name);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    onDataRefresh();
  };

  const getBillingBadgeColor = (billing: string) => {
    switch (billing) {
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'yearly': return 'bg-purple-100 text-purple-800';
      case 'one-time': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Safely handle plans - ensure it's an array before sorting
  const plans = Array.isArray(product.plans) ? product.plans : [];
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);
  const isInactive = product.status === 'inactive';

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Edit Product</h2>
          <Button variant="outline" onClick={handleCancelEdit}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Details
          </Button>
        </div>
        <ProductForm productToEdit={product} onSuccess={handleEditSuccess} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Products
        </Button>
        <Button onClick={handleEditClick}>
          <Edit2 size={16} className="mr-2" /> Edit Details
        </Button>
      </div>

      {/* Product Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ExternalLink size={16} />
                  <a 
                    href={`https://${product.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {product.website}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{product.customersCount} customers</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(product.status)}>
                {product.status}
              </Badge>
              <Badge variant="outline">{product.category}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{product.description}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Added on {product.createdAt.toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available Plans ({plans.length})</h2>
          <PlanManagementDialog
            product={product}
            onSuccess={onDataRefresh}
            trigger={
              <Button
                variant="outline"
                disabled={isInactive}
              >
                <Edit2 size={14} className="mr-2" />
                Manage Plans
              </Button>
            }
          />
        </div>
        {plans.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No plans available for this product.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.isPopular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      ₹{plan.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {plan.renewalPrice && plan.renewalPrice !== plan.price && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">(renews at ₹{plan.renewalPrice.toFixed(2)})</span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">per user</span>
                    <Badge className={getBillingBadgeColor(plan.billing)} variant="secondary">
                      {plan.billing}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Per user pricing for {plan.billing} billing
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
