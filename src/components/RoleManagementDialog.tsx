import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Plus, Edit, Trash2, Save, X, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  hierarchy_level: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface AppModule {
  id: string;
  module_key: string;
  display_name: string;
  parent_key: string | null;
}

interface EditingRole {
  id?: string;
  name: string;
  display_name: string;
  description: string;
  color: string;
  hierarchy_level: number;
  selectedModuleIds: Set<string>;
}

const RoleManagementDialog = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<AppModule[]>([]);
  const [editingRole, setEditingRole] = useState<EditingRole | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    fetchModules();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('hierarchy_level', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    }
  };

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .order('display_name', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch application modules",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setEditingRole({
      name: '',
      display_name: '',
      description: '',
      color: '#6b7280',
      hierarchy_level: 0,
      selectedModuleIds: new Set(),
    });
    setIsAddingNew(true);
  };

  const handleEdit = async (role: Role) => {
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select('module_key')
      .eq('role', role.name);

    if (error) {
      toast({ title: "Error", description: "Failed to fetch role permissions.", variant: "destructive" });
      return;
    }

    const permissionKeys = new Set(permissions.map(p => p.module_key));
    const selectedModuleIds = modules
      .filter(m => permissionKeys.has(m.module_key))
      .map(m => m.id);

    setEditingRole({
      id: role.id,
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      color: role.color,
      hierarchy_level: role.hierarchy_level,
      selectedModuleIds: new Set(selectedModuleIds),
    });
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    if (!editingRole || !editingRole.name.trim() || !editingRole.display_name.trim()) {
      toast({
        title: "Error",
        description: "Role name and display name are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let roleId = editingRole.id;

    try {
      if (isAddingNew) {
        const { data, error } = await supabase
          .from('roles')
          .insert({
            name: editingRole.name.toLowerCase().replace(/\s+/g, '-'),
            display_name: editingRole.display_name,
            description: editingRole.description || null,
            color: editingRole.color,
            hierarchy_level: editingRole.hierarchy_level
          })
          .select('id')
          .single();

        if (error) throw error;
        roleId = data.id;
        toast({
          title: "Success",
          description: "Role created successfully",
        });
      } else {
        const { error } = await supabase
          .from('roles')
          .update({
            display_name: editingRole.display_name,
            description: editingRole.description || null,
            color: editingRole.color,
            hierarchy_level: editingRole.hierarchy_level
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
      }

      // Update permissions
      const roleName = editingRole.name.toLowerCase().replace(/\s+/g, '-');
      if (roleName) {
        // First, delete existing permissions for this role name
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', roleName);

        if (deleteError) throw deleteError;

        // Then, insert the new permissions
        const selectedModuleKeys = modules
          .filter(m => editingRole.selectedModuleIds.has(m.id))
          .map(m => m.module_key);

        const permissionsToInsert = selectedModuleKeys.map(moduleKey => ({
          role: roleName,
          module_key: moduleKey,
        }));

        if (permissionsToInsert.length > 0) {
          const { error: insertError } = await supabase.from('role_permissions').insert(permissionsToInsert);
          if (insertError) throw insertError;
        }
      }

      await fetchRoles();
      setEditingRole(null);
      setIsAddingNew(false);
    } catch (error: any) {
      console.error('Error saving role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
    setIsAddingNew(false);
  };

  const handleToggleActive = async (role: Role) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ active: !role.active })
        .eq('id', role.id);

      if (error) throw error;
      
      await fetchRoles();
      toast({
        title: "Success",
        description: `Role ${role.active ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error toggling role status:', error);
      toast({
        title: "Error",
        description: "Failed to update role status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.name === 'admin') {
      toast({
        title: "Error",
        description: "Cannot delete the admin role",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', role.id);

      if (error) throw error;
      
      await fetchRoles();
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role. Make sure no users are assigned to this role.",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = (moduleId: string, checked: boolean) => {
    if (!editingRole) return;
    const newSelection = new Set(editingRole.selectedModuleIds);
    if (checked) {
      newSelection.add(moduleId);
    } else {
      newSelection.delete(moduleId);
    }
    setEditingRole({ ...editingRole, selectedModuleIds: newSelection });
  };

  const parentModules = useMemo(() => modules.filter(m => !m.parent_key), [modules]);
  const moduleMap = useMemo(() => {
    const map = new Map<string, AppModule[]>();
    modules.forEach(module => {
      if (module.parent_key) {
        if (!map.has(module.parent_key)) map.set(module.parent_key, []);
        map.get(module.parent_key)!.push(module);
      }
    });
    return map;
  }, [modules]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Manage Roles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Role Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure user roles, permissions, and hierarchy levels.
            </p>
            {!editingRole && (
              <Button onClick={handleAddNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add New Role
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Partition: Form or Placeholder */}
            <div className="space-y-4">
              {editingRole ? (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-4">
                    {isAddingNew ? 'Add New Role' : `Edit Role: ${editingRole.display_name}`}
                  </h4>
                  <div className="space-y-4">
                    {/* Role Details */}
                    <div>
                      <Label htmlFor="name">Role Name (unique key)</Label>
                      <Input
                        id="name"
                        value={editingRole.name}
                        onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                        placeholder="e.g., manager"
                        disabled={!isAddingNew}
                      />
                    </div>
                    <div>
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={editingRole.display_name}
                        onChange={(e) => setEditingRole({ ...editingRole, display_name: e.target.value })}
                        placeholder="e.g., Manager"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={editingRole.description}
                        onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                        placeholder="Role description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="color"
                            type="color"
                            value={editingRole.color}
                            onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={editingRole.color}
                            onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                            placeholder="#6b7280"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="hierarchy_level">Hierarchy Level</Label>
                        <Input
                          id="hierarchy_level"
                          type="number"
                          value={editingRole.hierarchy_level}
                          onChange={(e) => setEditingRole({ ...editingRole, hierarchy_level: parseInt(e.target.value) || 0 })}
                          placeholder="0-100"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                    {/* Permissions */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Module Permissions
                      </Label>
                      <div className="p-3 mt-2 border rounded-md max-h-48 overflow-y-auto space-y-2 bg-background">
                        {parentModules.map(parent => (
                          <div key={parent.id}>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`module-${parent.id}`}
                                checked={editingRole.selectedModuleIds.has(parent.id)}
                                onCheckedChange={(checked) => handlePermissionChange(parent.id, !!checked)}
                              />
                              <Label htmlFor={`module-${parent.id}`} className="font-medium">{parent.display_name}</Label>
                            </div>
                            {moduleMap.has(parent.module_key) && (
                              <div className="pl-6 mt-2 space-y-2">
                                {moduleMap.get(parent.module_key)!.map(child => (
                                  <div key={child.id} className="flex items-center space-x-2">
                                    <Checkbox id={`module-${child.id}`} checked={editingRole.selectedModuleIds.has(child.id)} onCheckedChange={(checked) => handlePermissionChange(child.id, !!checked)} />
                                    <Label htmlFor={`module-${child.id}`}>{child.display_name}</Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSave} disabled={isLoading}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/50 h-full flex flex-col items-center justify-center text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">Role Management</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select a role from the list to edit its permissions, or create a new role.
                  </p>
                </div>
              )}
            </div>

            {/* Right Partition: Roles Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id} className={editingRole?.id === role.id ? 'bg-muted' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            style={{ backgroundColor: role.color, color: 'white' }}
                            variant="secondary"
                          >
                            {role.display_name}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{role.description || 'No description'}</div>
                      </TableCell>
                      <TableCell>{role.hierarchy_level}</TableCell>
                      <TableCell>
                        <Badge variant={role.active ? 'default' : 'secondary'}>
                          {role.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role).catch(console.error)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(role)}
                          >
                            {role.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          {role.name !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(role)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleManagementDialog;