import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Layout and section components
import { SupplierLayout } from '../../components/supplier/SupplierLayout';
import { OverviewSection } from '../../components/supplier/OverviewSection';
import { RevenueSection } from '../../components/supplier/RevenueSection';
import { ReviewsSection } from '../../components/supplier/ReviewsSection';
import { OrdersSection } from '../../components/supplier/OrdersSection';
import { ProductsSection } from '../../components/supplier/ProductsSection';
import { SettingsSection } from '../../components/supplier/SettingsSection';
import { ReportsSection } from '../../components/supplier/ReportsSection';
import { SupplierShipmentManager } from '../../components/supplier/SupplierShipmentManager';
import { RegistrationSection } from '../../components/supplier/RegistrationSection';

// APIs
import {
  profileApi,
  productsApi,
  ordersApi,
  statsApi,
  type SupplierProfile,
  type SupplierProduct,
  type SupplierOrder,
  type SupplierStats,
  type UpdateProfileRequest,
} from '../../services/supplier/supplierApi';

export default function SupplierDashboardPage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to 'overview'
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Data states
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);

  // Profile form state
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({});

  // Sync URL query params with activeTab state
  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes (for sidebar navigation)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  // Check authentication
  useEffect(() => {
    if (!user || user.role !== 'supplier') {
      logout();
    }
  }, [user, logout]);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    loadProfile();
    loadStats();
    loadOrders();
    loadProducts();
  };

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await profileApi.getProfile();
      setProfile(data);
      setProfileForm({
        name: data.name,
        contactEmail: data.contactEmail,
        phone: data.phone,
        address: data.address,
        contactPerson: data.contactPerson,
        taxCode: data.taxCode,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await statsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        averageOrderValue: 0,
        fulfillmentRate: 0,
        onTimeDeliveryRate: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await productsApi.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      await loadStats();
      toast.success('Đã cập nhật trạng thái đơn hàng');
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updated = await profileApi.updateProfile(profileForm);
      setProfile(updated);
      toast.success('Đã cập nhật thông tin');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Không thể cập nhật thông tin');
    }
  };

  // Calculate badges for sidebar
  const badges = {
    orders: stats?.pendingOrders || 0,
    products: stats?.lowStockProducts || 0,
  };

  // Auth check
  if (!user || user.role !== 'supplier') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Render active section
  const renderSection = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewSection
            stats={stats}
            orders={orders}
            loadingStats={loadingStats}
            loadingOrders={loadingOrders}
            onViewOrder={(order) => handleTabChange('orders')}
            onConfirmOrder={(orderId) => handleUpdateOrderStatus(orderId, 'confirmed')}
            onRejectOrder={(orderId) => handleUpdateOrderStatus(orderId, 'cancelled')}
            onViewAllOrders={() => handleTabChange('orders')}
          />
        );

      case 'orders':
        return (
          <OrdersSection
            orders={orders}
            loading={loadingOrders}
            onUpdateStatus={handleUpdateOrderStatus}
            onRefresh={loadOrders}
          />
        );

      case 'products':
        return (
          <ProductsSection
            products={products}
            loading={loadingProducts}
            lowStockCount={stats?.lowStockProducts || 0}
            onRefresh={loadProducts}
          />
        );

      case 'registration':
        return <RegistrationSection />;

      case 'revenue':
        return <RevenueSection loading={loadingStats} />;

      case 'reviews':
        return <ReviewsSection loading={false} />;

      case 'delivery':
        return (
          <SupplierShipmentManager
            onRefreshStats={loadStats}
          />
        );

      case 'reports':
        return <ReportsSection />;

      case 'settings':
        return (
          <SettingsSection
            profile={profile}
            profileForm={profileForm}
            loading={loadingProfile}
            onUpdateForm={setProfileForm}
            onSave={handleUpdateProfile}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SupplierLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      badges={badges}
    >
      <div className="p-6 lg:p-8">
        {renderSection()}
      </div>
    </SupplierLayout>
  );
}
