
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats } from '@/utils/api';
import { useDataManager } from '@/components/DataManager';
import SidebarComponent from '@/components/Sidebar';
import TabContentRenderer from '@/components/TabContentRenderer';
import { DashboardManager, defaultDashboards } from '@/components/DashboardManager';
import { Customer, Partner, Product, User, Renewal, DashboardStats as StatsType, Dashboard } from '@/types';
import MobileLayout from '@/components/MobileLayout';
import MobileNavigation from '@/components/MobileNavigation';
import MobileDashboardStats from '@/components/MobileDashboardStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [dashboards, setDashboards] = useState<Dashboard[]>(defaultDashboards);
  const [activeDashboard, setActiveDashboard] = useState(dashboards[0].id);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const {
    customers,
    partners,
    products,
    users,
    renewals,
    handleCustomerAdd,
    handleCustomerUpdate,
    handleBulkAction,
    handleCustomerImport,
    handlePartnerAdd,
    handleProductAdd,
    handleProductImport,
    handleProductPriceUpdate,
    handleProductStatusChange,
    handleProductBulkStatusChange,
    handleProductUpdate,
    handleUserAdd,
    handleUserUpdate,
    handleUserBulkStatusChange
  } = useDataManager();

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleDataChange = (dataType: 'users' | 'customers' | 'partners' | 'products') => {
    // Invalidate the query for the specific data type to trigger a refetch
    queryClient.invalidateQueries({ queryKey: [dataType] });
  };

  const { data: stats, isLoading, isError } = useQuery<StatsType>({
    queryKey: ['dashboardStats', timeframe, customDateRange],
    queryFn: () => getDashboardStats(timeframe, customDateRange),
  });

  const currentDashboard = dashboards.find(dashboard => dashboard.id === activeDashboard) || dashboards[0];

  const filteredCustomers = customers.filter(customer => {
    if (!currentDashboard.filters) return true;

    if (currentDashboard.filters.partnerIds && currentDashboard.filters.partnerIds.length > 0) {
      const partnerIds = currentDashboard.filters.partnerIds;
      if (!customer.partnerId || !partnerIds.includes(customer.partnerId)) {
        return false;
      }
    }

    if (currentDashboard.filters.productIds && currentDashboard.filters.productIds.length > 0) {
      const productIds = currentDashboard.filters.productIds;
      if (!customer.productIds || customer.productIds.length === 0) {
        return false;
      }

      const hasAnyProduct = customer.productIds.some(productId => productIds.includes(productId));
      if (!hasAnyProduct) {
        return false;
      }
    }

    return true;
  });

  const filteredRenewals = renewals.filter(renewal => {
    if (!currentDashboard.filters) return true;

    if (currentDashboard.filters.partnerIds && currentDashboard.filters.partnerIds.length > 0) {
      const partnerIds = currentDashboard.filters.partnerIds;
      if (!renewal.partnerId || !partnerIds.includes(renewal.partnerId)) {
        return false;
      }
    }

    if (currentDashboard.filters.productIds && currentDashboard.filters.productIds.length > 0) {
      const productIds = currentDashboard.filters.productIds;
      if (!renewal.productId || !productIds.includes(renewal.productId)) {
        return false;
      }
    }

    return true;
  });

  const handleCreateDashboard = (name: string, description?: string) => {
    DashboardManager.createDashboard(name, setDashboards, description);
  };

  const handleCreateAndCustomize = (name: string, description?: string) => {
    DashboardManager.createDashboard(name, setDashboards, description);
    // Find the newly created dashboard and set it as active
    const newDashboard = dashboards.find(d => d.name === name);
    if (newDashboard) {
      setActiveDashboard(newDashboard.id);
    }
    // The dashboard edit dialog will be opened in the DashboardFilters component
  };

  const handleUpdateDashboard = (dashboardId: string, updates: Partial<Dashboard>) => {
    DashboardManager.updateDashboard(dashboardId, updates, setDashboards);
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    DashboardManager.deleteDashboard(dashboardId, setDashboards, setActiveDashboard, dashboards);
  };

  const sidebarContent = (
    <MobileNavigation 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    />
  );

  const renderMobileContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="space-y-4">
          <div className="px-4 pt-4">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Overview of your business metrics</p>
          </div>
          <MobileDashboardStats stats={stats} />
          <div className="px-4">
            <TabContentRenderer
              activeTab={activeTab}
              currentDashboard={currentDashboard}
              timeframe={timeframe}
              customDateRange={customDateRange}
              dashboards={dashboards}
              activeDashboard={activeDashboard}
              filteredCustomers={filteredCustomers}
              filteredRenewals={filteredRenewals}
              stats={stats}
              customers={customers}
              partners={partners}
              products={products}
              users={users}
              renewals={renewals}
              onTimeframeChange={setTimeframe}
              onCustomDateChange={setCustomDateRange}
              onDashboardChange={setActiveDashboard}
              onCreateDashboard={handleCreateDashboard}
              onCreateAndCustomize={handleCreateAndCustomize}
              onUpdateDashboard={handleUpdateDashboard}
              onDeleteDashboard={handleDeleteDashboard}
              onCustomerAdd={handleCustomerAdd}
              onCustomerUpdate={handleCustomerUpdate}
              onBulkAction={handleBulkAction}
              onCustomerImport={handleCustomerImport}
              onProductAdd={handleProductAdd}
              onProductImport={handleProductImport}
              onProductPriceUpdate={handleProductPriceUpdate}
              onProductStatusChange={handleProductStatusChange}
              onProductBulkStatusChange={handleProductBulkStatusChange}
              onProductUpdate={handleProductUpdate}
              onPartnerAdd={handlePartnerAdd}
              onUserAdd={handleUserAdd}
              onUserUpdate={handleUserUpdate}
              onUserBulkStatusChange={handleUserBulkStatusChange}
              onUsersChange={() => handleDataChange('users')}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <TabContentRenderer
          activeTab={activeTab}
          currentDashboard={currentDashboard}
          timeframe={timeframe}
          customDateRange={customDateRange}
          dashboards={dashboards}
          activeDashboard={activeDashboard}
          filteredCustomers={filteredCustomers}
          filteredRenewals={filteredRenewals}
          stats={stats}
          customers={customers}
          partners={partners}
          products={products}
          users={users}
          renewals={renewals}
          onTimeframeChange={setTimeframe}
          onCustomDateChange={setCustomDateRange}
          onDashboardChange={setActiveDashboard}
          onCreateDashboard={handleCreateDashboard}
          onCreateAndCustomize={handleCreateAndCustomize}
          onUpdateDashboard={handleUpdateDashboard}
          onDeleteDashboard={handleDeleteDashboard}
          onCustomerAdd={handleCustomerAdd}
          onCustomerUpdate={handleCustomerUpdate}
          onBulkAction={handleBulkAction}
          onCustomerImport={handleCustomerImport}
          onProductAdd={handleProductAdd}
          onProductImport={handleProductImport}
          onProductPriceUpdate={handleProductPriceUpdate}
          onProductStatusChange={handleProductStatusChange}
          onProductBulkStatusChange={handleProductBulkStatusChange}
          onProductUpdate={handleProductUpdate}
          onPartnerAdd={handlePartnerAdd}
          onUserAdd={handleUserAdd}
          onUserUpdate={handleUserUpdate}
          onUserBulkStatusChange={handleUserBulkStatusChange}
          onUsersChange={() => handleDataChange('users')}
        />
      </div>
    );
  };

  if (isMobile) {
    return (
      <MobileLayout sidebar={sidebarContent}>
        {renderMobileContent()}
      </MobileLayout>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SidebarComponent activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset className="flex-1">
          <main className="p-6">
            <TabContentRenderer
              activeTab={activeTab}
              currentDashboard={currentDashboard}
              timeframe={timeframe}
              customDateRange={customDateRange}
              dashboards={dashboards}
              activeDashboard={activeDashboard}
              filteredCustomers={filteredCustomers}
              filteredRenewals={filteredRenewals}
              stats={stats}
              customers={customers}
              partners={partners}
              products={products}
              users={users}
              renewals={renewals}
              onTimeframeChange={setTimeframe}
              onCustomDateChange={setCustomDateRange}
              onDashboardChange={setActiveDashboard}
              onCreateDashboard={handleCreateDashboard}
              onCreateAndCustomize={handleCreateAndCustomize}
              onUpdateDashboard={handleUpdateDashboard}
              onDeleteDashboard={handleDeleteDashboard}
              onCustomerAdd={handleCustomerAdd}
              onCustomerUpdate={handleCustomerUpdate}
              onBulkAction={handleBulkAction}
              onCustomerImport={handleCustomerImport}
              onProductAdd={handleProductAdd}
              onProductImport={handleProductImport}
              onProductPriceUpdate={handleProductPriceUpdate}
              onProductStatusChange={handleProductStatusChange}
              onProductBulkStatusChange={handleProductBulkStatusChange}
              onProductUpdate={handleProductUpdate}
              onPartnerAdd={handlePartnerAdd}
              onUserAdd={handleUserAdd}
              onUserUpdate={handleUserUpdate}
              onUserBulkStatusChange={handleUserBulkStatusChange}
              onUsersChange={() => handleDataChange('users')}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
