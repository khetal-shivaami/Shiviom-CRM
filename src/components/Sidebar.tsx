import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Users, Tag, Plus, Package, UserCheck, FileText, RefreshCw, Settings, Mail, ChevronDown, Upload, Building, UserPlus, LogOut, CheckSquare, FileBarChart, Ticket, Rocket, KeyRound, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import NotificationCenter from '@/components/NotificationCenter';
import { mockTasks } from '@/utils/mockTasks';
import { mockRenewals } from '@/utils/mockRenewals';
import { mockCustomers, mockPartners } from '@/utils/mockData'; 
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { profile, signOut } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [, setSearchParams] = useSearchParams();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!profile || profile.role === 'admin') {
        setIsLoadingPermissions(false);
        return;
      }

      setIsLoadingPermissions(true);
      try {
        const { data, error } = await supabase.rpc('get_user_module_permissions', { p_user_id: profile.user_id });
        if (error) throw error;
        setPermissions(data || []);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        setPermissions([]);
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchPermissions();
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordError(`Error updating password: ${error.message}`);
      } else {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        setIsChangePasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.actionUrl) {
      // Parse the URL to extract tab and other params
      const url = new URL(notification.actionUrl, window.location.origin);
      const tab = url.searchParams.get('tab');
      const taskId = url.searchParams.get('taskId');
      const customerId = url.searchParams.get('customerId');
      const partnerId = url.searchParams.get('partnerId');
      const renewalId = url.searchParams.get('renewalId');
      
      // Update search params
      const params = new URLSearchParams();
      if (tab) params.set('tab', tab);
      if (taskId) params.set('taskId', taskId);
      if (customerId) params.set('customerId', customerId);
      if (partnerId) params.set('partnerId', partnerId);
      if (renewalId) params.set('renewalId', renewalId);
      
      setSearchParams(params);
      
      // Change tab if needed
      if (tab && tab !== activeTab) {
        onTabChange(tab);
      }
    }
  };

  const menuItems = useMemo(() => {
    const allMenuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'partners', label: 'Partners', icon: Tag },
      { id: 'customers', label: 'Customers', icon: Users },
      { 
        id: 'crm', 
        label: 'CRM', 
        icon: Building,
        subItems: [
          { id: 'partner-prospects', label: 'Partner Prospects', icon: Users },
          { id: 'partner-onboarding', label: 'Partner Onboarding', icon: UserPlus },
        ]
      },
      { id: 'tasks', label: 'Task Management', icon: CheckSquare },
      { id: 'renewals', label: 'Renewals', icon: RefreshCw },
      { id: 'quotations', label: 'Quotations', icon: FileBarChart },
      { id: 'zoho-tickets', label: 'Zoho Tickets', icon: Ticket },
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'deployment', label: 'Deployment', icon: Rocket },
      {
        id: 'settings', 
        label: 'Settings', 
        icon: Settings,
        subItems: [
          { id: 'user-hierarchy', label: 'User Hierarchy', icon: UserCheck },
          { id: 'email-templates', label: 'Email Templates', icon: Mail },
          { id: 'import-data', 'label': 'Import Data', icon: Upload },
        ]
      },
    ];

    if (isLoadingPermissions) return [];
    if (profile?.role === 'admin') return allMenuItems;

    return allMenuItems.map(item => {
      if (item.subItems) {
        const permittedSubItems = item.subItems.filter(sub => permissions.includes(sub.id));
        if (permittedSubItems.length > 0) {
          return { ...item, subItems: permittedSubItems };
        }
        return null;
      }
      return permissions.includes(item.id) ? item : null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [permissions, isLoadingPermissions, profile?.role]);

  return (
    <div className="w-64 bg-card border-r border-border h-screen p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
            <img src="https://storage.googleapis.com/shiviom-website-content/company_logo/shiviom.png" alt="Shiviom Logo" className="h-15 w-60" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <NotificationCenter
              tasks={mockTasks}
              renewals={mockRenewals}
              customers={mockCustomers}
              partners={mockPartners}
              userRole={profile?.role || 'user'}
              userId={profile?.user_id || ''}
              onNotificationClick={handleNotificationClick}
            />
          </div>
          {profile && (
            <Badge variant="outline" className="text-xs">
              {profile.role}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Customer & Partner Management</p>
      </div>
      
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActiveOrSubActive = activeTab === item.id || (hasSubItems && item.subItems?.some(sub => sub.id === activeTab));
          
          return (
            <div key={item.id}>
              {hasSubItems ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                        isActiveOrSubActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronDown size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <DropdownMenuItem
                          key={subItem.id}
                          onClick={() => onTabChange(subItem.id)}
                          className={cn(
                            "flex items-center space-x-3 cursor-pointer",
                            activeTab === subItem.id && "bg-primary/10 text-primary"
                          )}
                        >
                          {SubIcon && <SubIcon size={16} />}
                          <span>{subItem.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info and logout section */}
      <div className="pt-4 border-t border-border space-y-2">
        {profile && (
          <div className="px-4 py-2 text-sm">
            <p className="font-medium">{profile.first_name} {profile.last_name}</p>
            <p className="text-muted-foreground text-xs">{profile.email}</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
        <p className="text-xs text-muted-foreground px-4">
          <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setIsChangePasswordOpen(true)}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your new password below. Make sure it's a strong one!
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-password" className="text-right">
                    New Password
                  </Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirm-password" className="text-right">
                    Confirm Password
                  </Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="col-span-3" />
                </div>
                {passwordError && (
                  <p className="col-span-4 text-sm text-red-500">{passwordError}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleChangePassword} disabled={isSavingPassword}>
                  {isSavingPassword && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </p>
        <p className="text-xs text-muted-foreground px-4">
          © 2024 CRM System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Sidebar;