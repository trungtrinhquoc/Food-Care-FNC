import { useState, useMemo, useCallback, lazy, Suspense } from "react";
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
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
const SubscriptionRemindersTab = lazy(() => import("./SubscriptionRemindersAdminPage"));

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
  { value: "reminders", label: "Email Nhắc Nhở", icon: MessageSquare },
] as const;

// Loading fallback component
const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    <span className="ml-2 text-gray-600">Đang tải...</span>
  </div>
);

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-orange-200 via-orange-100/200 to-white border-r border-orange-200 shadow-xl transition-all duration-300 z-40 ${sidebarOpen ? "w-64" : "w-20"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-500">
            {sidebarOpen ? (
              <>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  Food & Care
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-orange-100 rounded-lg transition-colors mx-auto"
              >
                <Menu className="w-5 h-5 text-orange-600" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleTabChange(value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${selectedTab === value
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/30 scale-105"
                  : "text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:shadow-md"
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${selectedTab === value ? "text-white" : "text-gray-500"}`} />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-orange-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:shadow-md transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <div className="min-h-screen py-8">
          <div className="container mx-auto px-4">
            {/* Header */}
            <header className="mb-8 bg-gradient-to-r from-white to-orange-50 rounded-2xl p-6 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Admin Dashboard</h1>
              </div>
              <p className="text-gray-600 ml-15">Quản lý và thống kê hệ thống Food & Care</p>
            </header>

            {/* Tab Content */}
            <div className="space-y-6">
              <Suspense fallback={<TabLoader />}>
                {/* Overview Tab */}
                {selectedTab === "overview" && (
                  <div>
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
                  </div>
                )}

                {/* Products Tab */}
                {selectedTab === "products" && (
                  <div>
                    <ProductsTab />
                  </div>
                )}

                {/* Orders Tab */}
                {selectedTab === "orders" && (
                  <div>
                    <OrdersTab />
                  </div>
                )}

                {/* Customers Tab */}
                {selectedTab === "customers" && (
                  <div>
                    <CustomersTab />
                  </div>
                )}

                {/* Users Tab */}
                {selectedTab === "users" && (
                  <div>
                    <UsersTab />
                  </div>
                )}

                {/* Reviews Tab */}
                {selectedTab === "reviews" && (
                  <div>
                    <ReviewsTab />
                  </div>
                )}

                {/* Suppliers Tab */}
                {selectedTab === "suppliers" && (
                  <div>
                    <SuppliersTab />
                  </div>
                )}

                {/* Zalo Tab */}
                {selectedTab === "zalo" && (
                  <div>
                    <ZaloTab />
                  </div>
                )}

                {/* Subscription Reminders Tab */}
                {selectedTab === "reminders" && (
                  <div>
                    <SubscriptionRemindersTab />
                  </div>
                )}
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
