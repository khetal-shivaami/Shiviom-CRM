
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProductPlan } from '../types';

interface ProductPlansCellProps {
  plans: ProductPlan[];
}

const ProductPlansCell = ({ plans }: ProductPlansCellProps) => {
  const getBillingBadgeColor = (billing: string) => {
    switch (billing) {
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'yearly': return 'bg-purple-100 text-purple-800';
      case 'one-time': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!plans || plans.length === 0) {
    return <span className="text-muted-foreground">No plans available</span>;
  }

  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);
  
  return (
    <div className="space-y-3">
      {sortedPlans.map((plan) => (
        <Card key={plan.id} className={`overflow-hidden ${plan.isPopular ? 'border-primary' : ''}`}>
          {plan.isPopular && (
            <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1">
              MOST POPULAR
            </div>
          )}
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <h5 className="font-semibold">{plan.name}</h5>
              <Badge className={getBillingBadgeColor(plan.billing)} variant="secondary">
                {plan.billing}
              </Badge>
            </div>
            <p className="text-xl font-bold mt-1">₹{plan.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">/ user</span></p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductPlansCell;
