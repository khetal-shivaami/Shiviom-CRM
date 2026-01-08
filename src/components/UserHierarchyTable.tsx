import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { Users, Edit, UserPlus, Download, Filter, Settings2, Key, Trash2, History } from 'lucide-react';
import { User } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import AddUserDialog from './AddUserDialog';
import AdminPasswordResetDialog from './AdminPasswordResetDialog';
import RoleManagementDialog from './RoleManagementDialog';
import UserLogsDialog from './UserLogsDialog'; // Import the new dialog
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserHierarchyTableProps {
  users: User[];
  onStatusChange?: (userId: string, newStatus: 'active' | 'inactive') => Promise<void>;
  onBulkStatusChange?: (userIds: string[], newStatus: 'active' | 'inactive') => Promise<void>;
  onUserUpdate?: (userId: string, updates: Partial<User>) => Promise<void>;
  onDataChange: () => void; // Callback to tell parent to refetch data
}

interface EditingUser {
  id: string;
  name: string;
  role: string;
  reportingTo?: string;
}

const UserHierarchyTable = ({ users, onStatusChange, onBulkStatusChange, onUserUpdate, onDataChange }: UserHierarchyTableProps) => {
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showInactive, setShowInactive] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [logsUser, setLogsUser] = useState<User | null>(null); // State for user logs
  const { toast } = useToast();
  
  const { isAdmin } = useAuth();
  const { roles: availableRoles, getRoleColor, getRoleDisplayName, getActiveRoleNames } = useRoles();

  useEffect(() => {
    // Sync filteredUsers with the users prop whenever it changes.
    setFilteredUsers(users);
  }, [users]);

  // Additional security check
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access user hierarchy management.</p>
        </div>
      </div>
    );
  }

  const roles = getActiveRoleNames();

  const getRoleBadgeStyle = (roleName: string) => {
    const color = getRoleColor(roleName);
    return {
      backgroundColor: color,
      color: 'white',
      border: 'none'
    };
  };

  const getReportingToName = (reportingToId?: string) => {
    if (!reportingToId) return 'N/A';
    const reportingUser = users.find(u => u.id === reportingToId);
    return reportingUser ? reportingUser.name : 'Unknown';
  };

  const handleRoleFilter = (role: string) => {
    if (role === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === role));
    }
  };

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.status === status));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === displayUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayUsers.map(user => user.id));
    }
  };

  const handleDeleteUsers = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('user_id', userIds);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${userIds.length} user profile(s) deleted successfully.`,
      });
      onDataChange(); // Refresh the user list
      setSelectedUsers([]);
    } catch (error: any) {
      console.error('Error deleting user profiles:', error);
      toast({
        title: 'Error Deleting Users',
        description: error.message || 'An unexpected error occurred while deleting users.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSingleUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${userName}? This action cannot be undone.`)) {
      return;
    }

    // The user deletion logic should be handled entirely by a secure Edge Function.
    // The function should:
    // 1. Use the service_role key to get admin privileges.
    // 2. Re-assign or nullify dependencies (e.g., tasks, reports).
    // 3. Delete the user from `auth.users` using `supabase.auth.admin.deleteUser(userId)`.
    // 4. The `profiles` table and other dependent tables should have `ON DELETE CASCADE`
    //    or `ON DELETE SET NULL` on their foreign key constraints to handle cleanup automatically.
    try {
      // Call the Edge Function to securely delete the user.
      const { error: functionError } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (functionError) throw new Error(functionError.message);

      toast({
        title: 'Success',
        description: `User ${userName} has been permanently deleted.`,
      });
      onDataChange(); // Refresh the user list
    } catch (error: any) {
      console.error('Error deleting user profile:', error);
      toast({
        title: 'Error Deleting User',
        description: error.message || 'An unexpected error occurred while deleting the user.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'activate':
        await onBulkStatusChange?.(selectedUsers, 'active');
        onDataChange();
        break;
      case 'deactivate':
        await onBulkStatusChange?.(selectedUsers, 'inactive');
        onDataChange();
        break;
      case 'export':
        console.log('Exporting users:', selectedUsers);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to permanently delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
          await handleDeleteUsers(selectedUsers);
        }
        break;
    }
    setSelectedUsers([]);
  };

  const exportUsers = () => {
    console.log('Exporting users:', filteredUsers);
  };

  const handleEditStart = (user: User) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      role: user.role,
      reportingTo: user.reportingTo
    });
  };

  const handleEditCancel = () => {
    setEditingUser(null);
  };

  const handleEditSave = async () => {
    if (editingUser && editingUser.name.trim()) {
      await onUserUpdate?.(editingUser.id, {
        name: editingUser.name.trim(),
        role: editingUser.role as User['role'],
        reportingTo: editingUser.reportingTo === 'none' ? undefined : editingUser.reportingTo
      });
      setEditingUser(null);
      onDataChange();
    }
  };

  const handleUserAdd = async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    phone?: string;
    reportingTo?: string;
  }) => {
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    // const generateStrongPassword = (length = 12) => {
    //   const lower = 'abcdefghijklmnopqrstuvwxyz';
    //   const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    //   const numbers = '0123456789';
    //   const all = lower + upper + numbers;
    //   let password = lower[Math.floor(Math.random() * lower.length)] + upper[Math.floor(Math.random() * upper.length)] + numbers[Math.floor(Math.random() * numbers.length)];
    //   for (let i = 3; i < length; i++) password += all[Math.floor(Math.random() * all.length)];
    //   return password.split('').sort(() => 0.5 - Math.random()).join('');
    // };
    // const newPassword = generateStrongPassword();
    // const newUserData = { ...userData, password: newPassword };
    const currentYear = new Date().getFullYear();
    const newPassword = `${userData.firstName}@${currentYear}`;
    const newUserData = { ...userData, password: newPassword };

    // Find the name of the user they are reporting to for the email template
    const reportingToUser = users.find(u => u.id === newUserData.reportingTo);
    const reportingToName = reportingToUser ? reportingToUser.name : 'N/A';
    
    try {
      // Step 1: Create the user in Supabase Auth. This will trigger the `handle_new_user` function
      // to create a corresponding profile.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            first_name: newUserData.firstName,
            last_name: newUserData.lastName,
            full_name: `${newUserData.firstName} ${newUserData.lastName}`, // Pass full name
            role: getRoleDisplayName(newUserData.role), // Pass role display name
            reporting_to_name: reportingToName, // Pass manager's name
            user_email: newUserData.email, // Pass user's email
            temporary_password: newUserData.password, // Pass password to be used in email template
          },
          // Note: If email confirmation is enabled in your project, the user will receive a confirmation email.
          // The edge function might have been configured to bypass this.
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed: no user returned.");

      // Step 2: Update the newly created profile with additional details like role, department, etc.
      // The `handle_new_user` trigger has already created the basic profile.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: newUserData.role,
          department: newUserData.department,
          phone: newUserData.phone,
          reporting_to: newUserData.reportingTo || null,
        })
        .eq('user_id', authData.user.id)
        .select()
        .single();

      if (profileError) {
        // If updating the profile fails, the auth user might be left without a full profile.
        // The edge function approach can handle this more atomically.
        console.error("User created in auth, but failed to update profile:", profileError);
        throw new Error(`User was created, but updating the profile failed: ${profileError.message}`);
      }

      toast({
        title: "User Created Successfully",
        description: `An account for ${newUserData.email} has been created. The temporary password is: ${newUserData.password}`,
        duration: 10000, // Keep the toast longer so the password can be copied
      });
      onDataChange(); // Refresh the user list
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({ title: "Error", description: error.message || "Failed to create user.", variant: "destructive" });
    }
  };

  const displayUsers = showInactive ? filteredUsers : filteredUsers.filter(user => user.status === 'active');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users size={24} />
              User Hierarchy ({displayUsers.length} users)
            </CardTitle>
            <div className="flex items-center gap-2">
              <RoleManagementDialog />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter size={16} className="mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Filter by Role
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleRoleFilter('all')}>
                        All roles
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {roles.map((role) => (
                        <DropdownMenuItem key={role} onClick={() => handleRoleFilter(role)}>
                          {getRoleDisplayName(role)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Filter by Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleStatusFilter('all')}>
                        All statuses
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusFilter('active')}>
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusFilter('inactive')}>
                        Inactive
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 size={16} />
                    View Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowInactive(!showInactive)}>
                    {showInactive ? 'Hide' : 'Show'} Inactive Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCompactView(!compactView)}>
                    {compactView ? 'Detailed' : 'Compact'} View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowHierarchy(!showHierarchy)}>
                    {showHierarchy ? 'Hide' : 'Show'} Hierarchy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportUsers}>
                    <Download size={16} className="mr-2" />
                    Export Users
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {selectedUsers.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedUsers.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      Activate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      Deactivate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                      Export Selected
                    </DropdownMenuItem>
                    {/* <DropdownMenuSeparator /> */}
                    {/* <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600">
                      Delete Selected
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <AddUserDialog users={users} onUserAdd={handleUserAdd} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedUsers.length === displayUsers.length && displayUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                {!compactView && <TableHead>Email</TableHead>}
                <TableHead>Role</TableHead>
                {showHierarchy && <TableHead>Reporting To</TableHead>}
                <TableHead>Status</TableHead>
                {!compactView && <TableHead>Last Login</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {editingUser && editingUser.id === user.id ? (
                      <Input
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                      />
                    ) : (
                      user.name
                    )}
                  </TableCell>
                  {!compactView && <TableCell>{user.email}</TableCell>}
                  <TableCell>
                    {editingUser && editingUser.id === user.id ? (
                      <Select
                        value={editingUser.role}
                        onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleDisplayName(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                     ) : (
                       <Badge style={getRoleBadgeStyle(user.role)} variant="secondary">
                         {getRoleDisplayName(user.role)}
                       </Badge>
                     )}
                  </TableCell>
                  {showHierarchy && (
                    <TableCell>
                      {editingUser && editingUser.id === user.id ? (
                        <Select
                          value={editingUser.reportingTo || 'none'}
                          onValueChange={(value) => setEditingUser({ ...editingUser, reportingTo: value === 'none' ? undefined : value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {users
                              .filter(u => u.id !== user.id)
                              .map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        getReportingToName(user.reportingTo)
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      {onStatusChange && (
                        <Switch
                          checked={user.status === 'active'}
                          onCheckedChange={(checked) => onStatusChange(user.id, checked ? 'active' : 'inactive')}
                        />
                      )}
                    </div>
                  </TableCell>
                  {!compactView && (
                    <TableCell>
                      {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingUser && editingUser.id === user.id ? (
                        <>
                          <Button size="sm" onClick={handleEditSave}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleEditCancel}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStart(user)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogsUser(user)}
                            title="View User Logs"
                          >
                            <History size={16} />
                          </Button>
                          {/* {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPasswordResetUser(user)}
                              title="Reset Password"
                            >
                              <Key size={16} />
                            </Button>
                          )} */}
                          {/* <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSingleUser(user.id, user.name)}
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </Button> */}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {passwordResetUser && (
        <AdminPasswordResetDialog
          open={true}
          onOpenChange={(open) => !open && setPasswordResetUser(null)}
          userId={passwordResetUser.id}
          userEmail={passwordResetUser.email}
          userName={passwordResetUser.name}
        />
      )}

      {logsUser && (
        <UserLogsDialog
          open={!!logsUser}
          onOpenChange={(open) => !open && setLogsUser(null)}
          user={logsUser}
        />
      )}
    </div>
  );
};

export default UserHierarchyTable;
