import DashboardStats from '@/components/DashboardStats';
import DashboardFilters from '@/components/DashboardFilters';
import CustomerChart from '@/components/CustomerChart';
import CustomerTable from '@/components/CustomerTable';
import CustomerForm from '@/components/CustomerForm';
import PartnerTable from '@/components/PartnerTable';
import ProductTable from '@/components/ProductTable';
import ProductForm from '@/components/ProductForm';
import Renewals from '@/components/Renewals';
import UserHierarchyTable from '@/components/UserHierarchyTable';
import Reports from '@/components/Reports';
import Settings from '@/components/Settings';
import ImportData from '@/components/ImportData';
import CustomerManagement from '@/components/CustomerManagement';
import PartnerOnboarding from '@/components/PartnerOnboarding';
import TaskManagement from '@/components/TaskManagement';
import { Customer, Partner, Product, User, Renewal, DashboardStats as StatsType } from '@/types';
import { Dashboard } from './DashboardManager';
import { useAuth } from '@/contexts/AuthContext';

interface TabContentRendererProps {
  activeTab: string;
  currentDashboard: Dashboard;
  timeframe: 'monthly' | 'yearly' | 'custom';
  customDateRange?: { from: Date; to: Date };
  dashboards: Dashboard[];
  activeDashboard: string;
  filteredCustomers: Customer[];
  filteredRenewals: Renewal[];
  stats?: StatsType;
  customers: Customer[];
  partners: Partner[];
  products: Product[];
  users: User[];
  renewals: Renewal[];
  onTimeframeChange: (timeframe: 'monthly' | 'yearly' | 'custom') => void;
  onCustomDateChange: (dateRange: { from: Date; to: Date }) => void;
  onDashboardChange: (dashboardId: string) => void;
  onCreateDashboard: (name: string, description?: string) => void;
  onCreateAndCustomize: (name: string, description?: string) => void;
  onUpdateDashboard: (dashboardId: string, updates: Partial<Dashboard>) => void;
  onDeleteDashboard: (dashboardId: string) => void;
  onCustomerAdd: (customer: Customer) => void;
  onCustomerUpdate: (customerId: string, updates: Partial<Customer>) => void;
  onBulkAction: (customerIds: string[], action: string) => void;
  onCustomerImport: (customers: Customer[]) => void;
  onPartnerAdd: (partner: Partner) => void;
  onProductAdd: (product: Product) => void;
  onProductImport: (products: Product[]) => void;
  onProductPriceUpdate: (productId: string, newPrice: number) => void;
  onProductStatusChange: (productId: string, newStatus: 'active' | 'inactive') => void;
  onProductBulkStatusChange: (productIds: string[], newStatus: 'active' | 'inactive') => void;
  onProductUpdate: (productId: string, updates: Partial<Product>) => void;
  onUserAdd?: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  onUserUpdate?: (userId: string, updates: Partial<User>) => Promise<void>;
  onUserBulkStatusChange?: (userIds: string[], status: 'active' | 'inactive') => Promise<void>;
}

const TabContentRenderer = ({
  activeTab,
  currentDashboard,
  timeframe,
  customDateRange,
  dashboards,
  activeDashboard,
  filteredCustomers,
  filteredRenewals,
  stats,
  customers,
  partners,
  products,
  users,
  renewals,
  onTimeframeChange,
  onCustomDateChange,
  onDashboardChange,
  onCreateDashboard,
  onCreateAndCustomize,
  onUpdateDashboard,
  onDeleteDashboard,
  onCustomerAdd,
  onCustomerUpdate,
  onBulkAction,
  onCustomerImport,
  onProductAdd,
  onProductImport,
  onProductPriceUpdate,
  onProductStatusChange,
  onProductBulkStatusChange,
  onProductUpdate,
  onPartnerAdd,
  onUserAdd,
  onUserUpdate,
  onUserBulkStatusChange
}: TabContentRendererProps) => {
  const { isAdmin, profile } = useAuth();
  // Wrapper functions to match CustomerTable's expected signatures
  const handleStatusChange = (customerId: string, newStatus: 'active' | 'inactive' | 'pending') => {
    onCustomerUpdate(customerId, { status: newStatus });
  };

  const handleBulkStatusChange = (customerIds: string[], action: string) => {
    onBulkAction(customerIds, action);
  };

  const handleUserUpdate = async (userId: string, updates: Partial<User>) => {
    if (onUserUpdate) {
      try {
        await onUserUpdate(userId, updates);
      } catch (error) {
        console.error('Error updating user:', error);
      }
    } else {
      console.log('Updating user:', userId, updates);
    }
  };

  const handleUserStatusChange = async (userId: string, newStatus: 'active' | 'inactive') => {
    await handleUserUpdate(userId, { status: newStatus });
  };

  const handleUserBulkStatusChange = async (userIds: string[], newStatus: 'active' | 'inactive') => {
    if (onUserBulkStatusChange) {
      try {
        await onUserBulkStatusChange(userIds, newStatus);
      } catch (error) {
        console.error('Error bulk updating users:', error);
      }
    } else {
      // Fallback to individual updates
      for (const userId of userIds) {
        await handleUserUpdate(userId, { status: newStatus });
      }
    }
  };

  const handleUserAdd = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (onUserAdd) {
      try {
        await onUserAdd(userData);
      } catch (error) {
        console.error('Error adding user:', error);
      }
    } else {
      console.log('Adding new user:', userData);
    }
  };

  switch (activeTab) {
    case 'dashboard':
      return (
        <div className="space-y-6">
          <DashboardFilters 
            timeframe={timeframe} 
            onTimeframeChange={onTimeframeChange}
            customDateRange={customDateRange}
            onCustomDateChange={onCustomDateChange}
            dashboards={dashboards}
            activeDashboard={activeDashboard}
            onDashboardChange={onDashboardChange}
            onCreateDashboard={onCreateDashboard}
            onCreateAndCustomize={onCreateAndCustomize}
            onUpdateDashboard={onUpdateDashboard}
            onDeleteDashboard={onDeleteDashboard}
            customers={customers}
            partners={partners}
            products={products}
          />
          {currentDashboard.widgets.showStats && <DashboardStats stats={stats} />}
          {currentDashboard.widgets.showChart && <CustomerChart customers={filteredCustomers} partners={partners} />}
          {currentDashboard.widgets.showRenewals && <Renewals renewals={filteredRenewals} customers={customers} partners={partners} products={products} />}
          {currentDashboard.widgets.showCustomerTable && (
            <div className="space-y-6">
              <CustomerTable 
                customers={customers} 
                partners={partners} 
                products={products}
                users={users}
                onStatusChange={handleStatusChange}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkImport={onCustomerImport}
              />
            </div>
          )}
        </div>
      );
    case 'customer-management':
      return (
        <CustomerManagement 
          customers={customers} 
          partners={partners} 
          products={products}
          users={users}
          onCustomerUpdate={onCustomerUpdate}
          onBulkAction={onBulkAction}
          onCustomerAdd={onCustomerAdd}
        />
      );
    case 'partner-onboarding':
      return <PartnerOnboarding partners={partners} users={users} onPartnerAdd={onPartnerAdd} />;
    case 'tasks':
      return <TaskManagement customers={customers} partners={partners} users={users} currentUserId={profile?.user_id} />;
    case 'partners':
      return (
        <div className="space-y-6">
          <PartnerTable partners={partners} customers={customers} products={products} users={users} />
        </div>
      );
    case 'products':
      return (
        <div className="space-y-6">
          <ProductTable 
            products={products} 
            onPriceUpdate={onProductPriceUpdate}
            onStatusChange={onProductStatusChange}
            onBulkStatusChange={onProductBulkStatusChange}
            onBulkImport={onProductImport}
            onProductUpdate={onProductUpdate}
            onAddProduct={() => window.location.hash = '?tab=add-product'}
          />
        </div>
      );
    case 'add-product':
      return <ProductForm onProductAdd={onProductAdd} />;
    case 'renewals':
      return <Renewals renewals={renewals} customers={customers} partners={partners} products={products} />;
    case 'user-hierarchy':
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
      return (
        <div className="space-y-6">
          <UserHierarchyTable 
            users={users}
            onStatusChange={handleUserStatusChange}
            onBulkStatusChange={handleUserBulkStatusChange}
            onUserUpdate={handleUserUpdate}
            onUserAdd={handleUserAdd}
          />
        </div>
      );
    case 'reports':
      return <Reports customers={customers} partners={partners} products={products} users={users} />;
    case 'settings':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold">Settings</h3>
            <p className="text-muted-foreground">Configure your application settings</p>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Select a settings option from the sidebar to get started.</p>
          </div>
        </div>
      );
    case 'email-templates':
      return <Settings />;
    case 'import-data':
      return (
        <ImportData 
          onCustomerImport={onCustomerImport}
          onProductImport={onProductImport}
        />
      );
    default:
      return (
        <div className="space-y-6">
          <DashboardStats stats={stats} />
          <CustomerChart customers={customers} partners={partners} />
        </div>
      );
  }
};

export default TabContentRenderer;
