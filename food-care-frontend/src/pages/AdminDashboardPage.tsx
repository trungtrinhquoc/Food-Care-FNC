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
  CheckCircle,
  Warehouse,
  Ticket,
  HardHat,
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
const ApprovalsTab = lazy(() => import("./admin/ApprovalsTab").then(m => ({ default: m.ApprovalsTab })));
const WarehousesTab = lazy(() => import("./admin/WarehousesTab").then(m => ({ default: m.WarehousesTab })));
const StaffManagementTab = lazy(() => import("./admin/StaffManagementTab").then(m => ({ default: m.StaffManagementTab })));
const SubscriptionsTab = lazy(() => import("./admin/SubscriptionsTab").then(m => ({ default: m.SubscriptionsTab })));
const AdminCouponsPage = lazy(() => import("./admin/AdminCouponsPage"));

// Tab configuration
const TABS = [
  { value: "overview", label: "Tổng quan", icon: BarChart3 },
  { value: "products", label: "Sản phẩm", icon: Box },
  { value: "orders", label: "Đơn hàng", icon: ShoppingCart },
  { value: "customers", label: "Khách hàng", icon: Users },
  { value: "users", label: "Người dùng", icon: UserCog },
  { value: "reviews", label: "Đánh giá", icon: Star },
  { value: "suppliers", label: "NCC", icon: Package },
  { value: "warehouses", label: "Kho hàng", icon: Warehouse },
  { value: "staff-mgmt", label: "Nhân viên", icon: HardHat },
  { value: "subscriptions", label: "Gói Đăng ký", icon: CheckCircle },
  { value: "coupons", label: "Mã giảm giá", icon: Ticket },
  { value: "approvals", label: "Phê duyệt", icon: CheckCircle },
  { value: "zalo", label: "Zalo", icon: MessageSquare },
] as const;

// Loading fallback component
const TabLoader = () => (
  <div className="flex items-center justify-center py-10">
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
      pendingOrders: stats.pendingOrders,
      lowStockProducts: stats.lowStockProducts,
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
    <div className="min-h-screen bg-slate-50 flex text-sm text-slate-800 antialiased font-sans">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-sm transition-transform duration-300 z-40 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
          w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 h-[72px]">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              Food & Care
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleTabChange(value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${selectedTab === value
                  ? "bg-orange-50 text-orange-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${selectedTab === value ? "text-orange-600" : "text-slate-400"}`} />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all min-w-0 duration-300 lg:ml-64 pt-4 lg:pt-0`}>
        <div className="min-h-screen pb-6">
          {/* Mobile Header Bar */}
          <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 h-[72px] flex items-center mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="ml-3 text-lg font-bold text-slate-800">Food & Care</h1>
          </div>

          <div className="container mx-auto px-4 lg:px-6 lg:pt-6">
            {/* Header */}
            <header className="mb-6 bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200 sticky top-0 lg:top-6 z-20">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              </div>
              <p className="text-slate-500 text-sm ml-13">Quản lý và thống kê hệ thống Food & Care</p>
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
                      <div className="text-center py-10 text-red-500">
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

                {/* Warehouses Tab */}
                {selectedTab === "warehouses" && (
                  <div>
                    <WarehousesTab />
                  </div>
                )}

                {/* Staff Management Tab */}
                {selectedTab === "staff-mgmt" && (
                  <div>
                    <StaffManagementTab />
                  </div>
                )}

                {/* Subscriptions Tab */}
                {selectedTab === "subscriptions" && (
                  <div>
                    <SubscriptionsTab />
                  </div>
                )}

                {/* Coupons Tab */}
                {selectedTab === "coupons" && (
                  <div>
                    <AdminCouponsPage />
                  </div>
                )}

                {/* Approvals Tab */}
                {selectedTab === "approvals" && (
                  <div>
                    <ApprovalsTab />
                  </div>
                )}

                {/* Zalo Tab */}
                {selectedTab === "zalo" && (
                  <div>
                    <ZaloTab />
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
