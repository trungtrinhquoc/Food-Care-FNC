import { useState, useEffect } from 'react';
import { Package, ShoppingCart, TrendingUp, Users, Settings as SettingsIcon, Star, Bell, Truck } from 'lucide-react';
import { SupplierSidebar } from './SupplierSidebar';
import { KPICards } from './KPICards';
import { OrderFulfillmentWorkflow } from './OrderFulfillmentWorkflow';
import { AdvancedOrderManagement } from './AdvancedOrderManagement';
import { FulfillmentAlerts } from './FulfillmentAlerts';
import { OperationalCharts } from './OperationalCharts';
import { OperationalReportsTab } from './OperationalReportsTab';
import { QuickActions } from './QuickActions';
import { ProductManagement } from './ProductManagement';
import { RevenueReports } from './RevenueReports';
import { ReviewManagement } from './ReviewManagement';
import { DeliveryConfirmationTab } from './DeliveryConfirmationTab';
import { 
  useOrders, 
  useUpdateOrderStatus, 
  useAddShipping, 
  useCancelOrder, 
  useBulkConfirmOrders,
  useKPIs, 
  useFulfillmentMetrics, 
  useAlerts, 
  useDismissAlert 
} from '../../hooks/useSupplierDataNew';
import type { Order, OrderStatus, Alert as AlertType } from '../../types/supplier';

type TabType = 'overview' | 'orders' | 'products' | 'revenue' | 'reviews' | 'delivery' | 'reports' | 'settings';

interface SupplierDashboardProps {
  activeTab?: string;
  onNavigate?: (page: string) => void;
}

export function SupplierDashboard({ activeTab: externalActiveTab, onNavigate }: SupplierDashboardProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('overview');
  const activeTab = (externalActiveTab as TabType) || internalActiveTab;
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // React Query hooks
  const { data: orders = [], refetch: refetchOrders, isLoading: ordersLoading } = useOrders();
  const { data: metrics, isLoading: metricsLoading } = useKPIs();
  const { data: fulfillmentMetrics, isLoading: fulfillmentLoading } = useFulfillmentMetrics();
  const { data: alerts = [] } = useAlerts();
  
  const updateStatusMutation = useUpdateOrderStatus();
  const addShippingMutation = useAddShipping();
  const cancelOrderMutation = useCancelOrder();
  const bulkConfirmMutation = useBulkConfirmOrders();
  const dismissAlertMutation = useDismissAlert();

  const handleLogout = () => {
    // Clear any local storage or session data
    localStorage.removeItem('supplierAuth');
    sessionStorage.clear();
    
    // Navigate back to home page
    if (onNavigate) {
      onNavigate('home');
    } else {
      // Fallback to reload if onNavigate is not provided
      window.location.reload();
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleCancelOrder = (orderId: string, reason: string) => {
    cancelOrderMutation.mutate({ orderId, reason });
  };

  const handleAddShipping = (orderId: string, trackingNumber: string, carrier: string) => {
    addShippingMutation.mutate({ orderId, trackingNumber, carrier });
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlertMutation.mutate({ alertId });
  };

  const handleViewOrder = (orderId: string) => {
    setInternalActiveTab('orders');
  };

  const handleConfirmAllNew = () => {
    const newOrderIds = orders.filter((o: Order) => o.status === 'pending').map((o: Order) => o.id);
    if (newOrderIds.length > 0) {
      bulkConfirmMutation.mutate({ orderIds: newOrderIds });
    }
  };

  const handlePrintPackingSlips = () => {
    const confirmedOrders = orders.filter((o: Order) => o.status === 'confirmed' || o.status === 'processing');
    console.log('Printing packing slips for:', confirmedOrders);
    alert(`In phiếu giao cho ${confirmedOrders.length} đơn hàng`);
  };

  const handleExportShippingReport = () => {
    const shippingOrders = orders.filter((o: Order) => o.status === 'shipped');
    console.log('Exporting shipping report for:', shippingOrders);
    alert(`Xuất báo cáo cho ${shippingOrders.length} đơn hàng đang giao`);
  };

  const handleRefreshData = () => {
    refetchOrders();
    setLastUpdated(new Date());
    alert('Đã cập nhật dữ liệu mới nhất');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            break;
          case 'p':
            e.preventDefault();
            handlePrintPackingSlips();
            break;
          case 'r':
            e.preventDefault();
            handleRefreshData();
            break;
          case 'e':
            e.preventDefault();
            handleExportShippingReport();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [orders]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SupplierSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setInternalActiveTab(tab as TabType)}
        badges={{
          orders: metrics?.pendingOrders || 0,
          reviews: 3,
          products: 2,
        }}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Header Bar */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {activeTab === 'overview' && 'Tổng quan'}
                  {activeTab === 'orders' && 'Quản lý đơn hàng'}
                  {activeTab === 'products' && 'Quản lý sản phẩm'}
                  {activeTab === 'revenue' && 'Báo cáo doanh thu'}
                  {activeTab === 'reviews' && 'Quản lý đánh giá'}
                  {activeTab === 'delivery' && 'Xác nhận giao hàng'}
                  {activeTab === 'reports' && 'Báo cáo vận hành'}
                  {activeTab === 'settings' && 'Cài đặt'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Cập nhật: {lastUpdated.toLocaleString('vi-VN')}
                </p>
              </div>

              {/* Notification bell */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-gray-600" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-6 lg:px-8 py-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Loading state */}
              {(metricsLoading || fulfillmentLoading) && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* KPI Cards */}
              {!metricsLoading && metrics && <KPICards metrics={metrics} />}

              {/* Quick Actions */}
              {!metricsLoading && metrics && (
                <QuickActions
                  newOrdersCount={metrics?.pendingOrders}
                  onConfirmAllNew={handleConfirmAllNew}
                  onPrintPackingSlips={handlePrintPackingSlips}
                  onExportShippingReport={handleExportShippingReport}
                  onRefreshData={handleRefreshData}
                />
              )}

              {/* Alerts */}
              {alerts.length > 0 && (
                <FulfillmentAlerts
                  alerts={alerts}
                  onDismiss={handleDismissAlert}
                  onViewOrder={handleViewOrder}
                />
              )}

              {/* Sample Workflow for newest order */}
              {orders.length > 0 && orders[0].status !== 'cancelled' && orders[0].status !== 'delivered' && (
                <div>
                  <h3 className="font-semibold mb-3">Quy trình xử lý mẫu</h3>
                  <OrderFulfillmentWorkflow currentStatus={orders[0].status} />
                </div>
              )}

              {/* Operational Charts */}
              {!fulfillmentLoading && fulfillmentMetrics && <OperationalCharts metrics={fulfillmentMetrics} />}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Alerts at top of orders page */}
              {alerts.length > 0 && (
                <FulfillmentAlerts
                  alerts={alerts}
                  onDismiss={handleDismissAlert}
                  onViewOrder={handleViewOrder}
                />
              )}

              {/* Order Management Panel */}
              <AdvancedOrderManagement
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                onCancelOrder={handleCancelOrder}
                onAddShipping={handleAddShipping}
              />
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <ProductManagement />
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <RevenueReports />
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <ReviewManagement />
          )}

          {/* Delivery Tab */}
          {activeTab === 'delivery' && (
            <DeliveryConfirmationTab
              orders={orders}
              onConfirmDelivery={handleUpdateOrderStatus}
            />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <OperationalReportsTab
              orders={orders}
            />
          )}

          {/* Settings Tab - Placeholder */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg border p-12 text-center">
              <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Cài đặt</h3>
              <p className="text-gray-600 mb-4">Tính năng đang được phát triển</p>
              <p className="text-sm text-gray-500">
                Cấu hình thông tin cửa hàng, phương thức thanh toán, và các tùy chọn khác
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}