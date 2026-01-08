import { useState, Fragment } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, Info, Copy, Loader2 } from 'lucide-react';
import { User } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { useRoles } from '@/hooks/useRoles';

interface AddUserDialogProps {
  users: User[];
  onUserAdd: (userData: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    phone?: string;
    reportingTo?: string;
  }) => Promise<void>;
}

const AddUserDialog = ({ users, onUserAdd }: AddUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '' as User['role'],
    reportingTo: '',
    department: ''
  });
  const { toast } = useToast();
  const { getActiveRoleNames, getRoleDisplayName } = useRoles();

  const roles = getActiveRoleNames();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.role || !formData.department.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if email already exists
    if (users.some(user => user.email.toLowerCase() === formData.email.toLowerCase())) {
      toast({
        title: "Email Already Exists",
        description: "A user with this email already exists.",
        variant: "destructive",
      });
      return;
    }

    const userData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      reportingTo: formData.reportingTo === 'none' ? undefined : formData.reportingTo,
      department: formData.department.trim()
    };

    setIsSubmitting(true);
    try {
      await onUserAdd(userData);
      // The password is now generated in the parent, so we can't show it here.
      // The parent component (UserHierarchyTable) is responsible for showing the success toast with the password.
      // We will just close this dialog and reset the form.
      // To keep a success dialog, we would need the parent to pass the generated password back,
      // but the toast notification in the parent already handles this.
      // setNewlyCreatedUser(userData); 
      setOpen(false); // Close the add user dialog
    } catch (error) {
      // Error is handled by the parent component which shows a toast.
      console.error("Failed to add user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setNewlyCreatedUser(null);
    // Also reset submitting state if the dialog is closed manually
    setIsSubmitting(false);
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '' as User['role'],
      reportingTo: '',
      department: ''
    });
  };

  return (
    <Fragment>
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) handleSuccessDialogClose(); }}>
        <DialogTrigger asChild>
          <Button size="sm">
            <UserPlus size={16} className="mr-2" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription className="flex items-start gap-2 pt-2">
              <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground">
                A secure password will be automatically generated for the new user. It will be displayed in a notification upon successful creation.
              </span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as User['role'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportingTo">Reporting To</Label>
              <Select
                value={formData.reportingTo || 'none'}
                onValueChange={(value) => setFormData({ ...formData, reportingTo: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </Fragment>
  );
};

export default AddUserDialog;
