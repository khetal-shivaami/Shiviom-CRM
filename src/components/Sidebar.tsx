import { LayoutDashboard, Users, Tag, Plus, Package, UserCheck, FileText, RefreshCw, Settings, Mail, ChevronDown, Upload, Building, UserPlus, LogOut, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from '@/components/NotificationCenter';
import { mockTasks } from '@/utils/mockTasks';
import { mockRenewals } from '@/utils/mockRenewals';
import { mockCustomers, mockPartners } from '@/utils/mockData';
import { useSearchParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { profile, signOut, isAdmin } = useAuth();
  const [, setSearchParams] = useSearchParams();

  const handleSignOut = async () => {
    await signOut();
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'crm', 
      label: 'CRM', 
      icon: Building,
      subItems: [
        { id: 'customer-management', label: 'Customer Management', icon: Users },
        { id: 'partner-onboarding', label: 'Partner Onboarding', icon: UserPlus },
      ]
    },
    { id: 'partners', label: 'Partners', icon: Tag },
    { 
      id: 'products', 
      label: 'Products', 
      icon: Package,
      subItems: [
        { id: 'products', label: 'View Products' },
        ...(isAdmin ? [{ id: 'add-product', label: 'Add Product', icon: Plus }] : []),
      ]
    },
    { id: 'tasks', label: 'Task Management', icon: CheckSquare },
    { id: 'renewals', label: 'Renewals', icon: RefreshCw },
    { id: 'reports', label: 'Reports', icon: FileText },
    ...(isAdmin ? [{
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      subItems: [
        { id: 'user-hierarchy', label: 'User Hierarchy', icon: UserCheck },
        { id: 'email-templates', label: 'Email Templates', icon: Mail },
        { id: 'import-data', label: 'Import Data', icon: Upload },
      ]
    }] : []),
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-screen p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-foreground">Shiviom</h1>
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
          © 2024 CRM System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Sidebar;