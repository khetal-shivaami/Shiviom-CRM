import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddonFormProps {
  onSuccess: () => void;
}

const AddonForm = ({ onSuccess }: AddonFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    category: 'Services', // Default category for add-ons
    description: '',
    price: '',
  });

  const categories = [
    'Support',
    'Migration',
    'Implementation',
    'Training',
    'Consulting',
    'Services',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.description || !formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const addonToInsert = {
        name: formData.name,
        website: formData.website || '',
        category: formData.category,
        description: formData.description,
        status: 'active',
        price: parseFloat(formData.price),
        plans: [], // Add-ons typically don't have complex plans
        product_type: 'add_on_service', // This is the key difference
      };

      const { error } = await supabase.from('products').insert([addonToInsert]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Add-on service created successfully!",
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error creating add-on", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Add-on Service</CardTitle>
        <CardDescription>Add-ons are services like support, migration, or training that can be attached to main products in a quotation.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Premium Support Package" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Default Price (₹) *</Label>
            <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="e.g., 499.00" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter a clear description of the service" rows={3} required />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Service...' : 'Add Service'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddonForm;