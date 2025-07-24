import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building2, MapPin, Calendar, Users, Package } from 'lucide-react';
import { Customer, Partner, Product, User as UserType } from '../types';

interface CustomerDetailDialogProps {
  customer: Customer | null;
  partner?: Partner;
  products: Product[];
  users: UserType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerDetailDialog = ({ 
  customer, 
  partner, 
  products, 
  users, 
  open, 
  onOpenChange 
}: CustomerDetailDialogProps) => {
  if (!customer) return null;

  const assignedUsers = customer.assignedUserIds 
    ? users.filter(u => customer.assignedUserIds?.includes(u.id))
    : [];

  const customerProducts = customer.productIds 
    ? products.filter(p => customer.productIds?.includes(p.id))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} />
            Customer Details - {customer.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 size={18} />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{customer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground">{customer.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{customer.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Zone</p>
                    <p className="text-sm text-muted-foreground">{customer.zone || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">{customer.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Process</p>
                  <Badge variant="outline">{customer.process}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Value</p>
                  <p className="text-lg font-bold">₹{customer.value.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Information */}
          {partner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Partner Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Partner Name</p>
                    <p className="text-sm text-muted-foreground">{partner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground">{partner.company}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{partner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Specialization</p>
                    <p className="text-sm text-muted-foreground">{partner.specialization || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Users */}
          {assignedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users size={18} />
                  Assigned Users ({assignedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products */}
          {customerProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package size={18} />
                  Products ({customerProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerProducts.map((product) => (
                    <div key={product.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-2">{product.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailDialog;