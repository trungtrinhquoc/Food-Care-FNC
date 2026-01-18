import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  BarChart3,
  ShoppingCart,
  Package,
  MessageSquare,
  Box,
  Star,
  UserCog,
  Users,
  Loader2,
} from "lucide-react";

// Hooks
import { useDashboardStats } from "../hooks/useDashboardStats";

// Lazy load tab components for better performance
const OverviewTab = lazy(() => import("./admin/OverviewTab").then(m => ({ default: m.OverviewTab })));
const ProductsTab = lazy(() => import("./admin/ProductsTab").then(m => ({ default: m.ProductsTab })));
const OrdersTab = lazy(() => import("./admin/OrdersTab").then(m => ({ default: m.OrdersTab })));
const SuppliersTab = lazy(() => import("./admin/SuppliersTab").then(m => ({ default: m.SuppliersTab })));
const ZaloTab = lazy(() => import("./admin/ZaloTab").then(m => ({ default: m.ZaloTab })));
const ReviewsTab = lazy(() => import("./admin/ReviewsTab").then(m => ({ default: m.ReviewsTab })));
const UsersTab = lazy(() => import("./admin/UsersTab").then(m => ({ default: m.UsersTab })));
const CustomersTab = lazy(() => import("./admin/CustomersTab").then(m => ({ default: m.CustomersTab })));

// Tab configuration
const TABS = [
  { value: "overview", label: "Tổng quan", icon: BarChart3 },
  { value: "products", label: "Sản phẩm", icon: Box },
  { value: "orders", label: "Đơn hàng", icon: ShoppingCart },
  { value: "customers", label: "Khách hàng", icon: Users },
  { value: "users", label: "Người dùng", icon: UserCog },
  { value: "reviews", label: "Đánh giá", icon: Star },
  { value: "suppliers", label: "NCC", icon: Package },
  { value: "zalo", label: "Zalo", icon: MessageSquare },
] as const;

// Loading fallback component
const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    <span className="ml-2 text-gray-600">Đang tải...</span>
  </div>
);

export default function AdminDashboardPage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Dashboard stats from API - only fetches when needed
  const { stats, revenueData, isLoading: statsLoading, error: statsError } = useDashboardStats();

  // Memoized stats object to prevent unnecessary re-renders
  const formattedStats = useMemo(() => {
    if (!stats) return null;
    return {
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      totalCustomers: stats.totalCustomers,
      totalProducts: stats.totalProducts,
      monthlyGrowth: stats.monthlyGrowth,
      activeSubscriptions: stats.pendingOrders,
    };
  }, [stats]);

  // Memoized revenue data
  const formattedRevenueData = useMemo(() => 
    revenueData.map(r => ({ month: r.month, revenue: r.revenue })),
    [revenueData]
  );

  // Memoized tab change handler
  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Quản lý và thống kê hệ thống Food & Care</p>
        </header>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}>
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            {/* Overview Tab */}
            <TabsContent value="overview">
              {statsLoading ? (
                <TabLoader />
              ) : statsError ? (
                <div className="text-center py-20 text-red-500">
                  <p>Lỗi: {statsError}</p>
                </div>
              ) : formattedStats ? (
                <OverviewTab
                  stats={formattedStats}
                  revenueData={formattedRevenueData}
                  totalProducts={formattedStats.totalProducts}
                />
              ) : null}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <ProductsTab />
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <OrdersTab />
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers">
              <CustomersTab />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <ReviewsTab />
            </TabsContent>

            {/* Suppliers Tab */}
            <TabsContent value="suppliers">
              <SuppliersTab />
            </TabsContent>

            {/* Zalo Tab */}
            <TabsContent value="zalo">
              <ZaloTab />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </div>
  );
}
