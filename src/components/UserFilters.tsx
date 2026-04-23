
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface UserFiltersProps {
  onRoleFilter: (role: string) => void;
  onStatusFilter: (status: string) => void;
  onDepartmentFilter: (department: string) => void;
}

const UserFilters = ({ onRoleFilter, onStatusFilter, onDepartmentFilter }: UserFiltersProps) => {
  const roles = ['admin', 'manager', 'assistant-manager', 'team-leader', 'fsr', 'bde','isr'];
  const departments = ['Administration', 'Sales', 'Field Sales', 'Business Development', 'Marketing', 'Operations'];

  const getRoleDisplayName = (role: string) => {
    const names = {
      admin: 'Admin',
      manager: 'Manager',
      'assistant-manager': 'Assistant Manager',
      'team-leader': 'Team Leader',
      fsr: 'FSR',
      bde: 'BDE',
    };
    return names[role as keyof typeof names] || role;
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-muted-foreground" />
          <h3 className="font-medium">Filter Users</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Role</label>
            <Select onValueChange={onRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select onValueChange={onStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Department</label>
            <Select onValueChange={onDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserFilters;
