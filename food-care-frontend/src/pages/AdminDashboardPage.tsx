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
  Home,
  CheckCircle,
  Ticket,
  AlertCircle,
  Store,
  DollarSign,
  Percent,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Hooks
import { useDashboardStats } from "../hooks/useDashboardStats";

// ── Lazy-load all tab components ──────────────────────────────────────────────
const OverviewTab       = lazy(() => import("./admin/OverviewTab").then(m => ({ default: m.OverviewTab })));
const ProductsTab       = lazy(() => import("./admin/ProductsTab").then(m => ({ default: m.ProductsTab })));
const OrdersTab         = lazy(() => import("./admin/OrdersTab").then(m => ({ default: m.OrdersTab })));
const SuppliersTab      = lazy(() => import("./admin/SuppliersTab").then(m => ({ default: m.SuppliersTab })));
const ZaloTab           = lazy(() => import("./admin/ZaloTab").then(m => ({ default: m.ZaloTab })));
const ReviewsTab        = lazy(() => import("./admin/ReviewsTab").then(m => ({ default: m.ReviewsTab })));
const UsersTab          = lazy(() => import("./admin/UsersTab").then(m => ({ default: m.UsersTab })));
const CustomersTab      = lazy(() => import("./admin/CustomersTab").then(m => ({ default: m.CustomersTab })));
const ApprovalsTab      = lazy(() => import("./admin/ApprovalsTab").then(m => ({ default: m.ApprovalsTab })));
const SubscriptionsTab  = lazy(() => import("./admin/SubscriptionsTab").then(m => ({ default: m.SubscriptionsTab })));
const AdminCouponsPage  = lazy(() => import("./admin/AdminCouponsPage"));
// ── 3 new operational tabs ────────────────────────────────────────────────────
const ComplaintsTab     = lazy(() => import("./admin/ComplaintsTab").then(m => ({ default: m.ComplaintsTab })));
const MartTab           = lazy(() => import("./admin/MartTab").then(m => ({ default: m.MartTab })));
const FinanceTab        = lazy(() => import("./admin/FinanceTab").then(m => ({ default: m.FinanceTab })));
const BlindBoxTab       = lazy(() => import("./admin/BlindBoxTab").then(m => ({ default: m.BlindBoxTab })));
const CommissionTab     = lazy(() => import("./admin/CommissionTab").then(m => ({ default: m.CommissionTab })));

// Responsive bottom-nav (used only on < lg screens)
import { AdminBottomNav } from "../components/admin/AdminBottomNav";

// ── Sidebar tab configuration ─────────────────────────────────────────────────
const TABS = [
  // ── Core monitoring ──────────────────────────────────────────────────────
  { value: "overview",       label: "Tổng quan",      icon: BarChart3,    group: "monitor" },
  { value: "complaints",     label: "Khiếu nại",      icon: AlertCircle,  group: "monitor" },
  { value: "mart",           label: "Quản lý Mart",   icon: Store,        group: "monitor" },
  { value: "blindbox",       label: "Blind Box",      icon: Box,          group: "monitor" },
  { value: "finance",        label: "Tài chính",      icon: DollarSign,   group: "monitor" },
  { value: "commission",     label: "Hoa hồng",       icon: Percent,      group: "monitor" },
  // ── Operations ───────────────────────────────────────────────────────────
  { value: "products",       label: "Sản phẩm",       icon: Box,          group: "ops" },
  { value: "orders",         label: "Đơn hàng",       icon: ShoppingCart, group: "ops" },
  { value: "customers",      label: "Khách hàng",     icon: Users,        group: "ops" },
  { value: "subscriptions",  label: "Gói Đăng ký",    icon: CheckCircle,  group: "ops" },
  { value: "approvals",      label: "Phê duyệt",      icon: CheckCircle,  group: "ops" },
  // ── System ───────────────────────────────────────────────────────────────
  { value: "users",          label: "Người dùng",     icon: UserCog,      group: "sys" },
  { value: "reviews",        label: "Đánh giá",       icon: Star,         group: "sys" },
  { value: "suppliers",      label: "NCC",            icon: Package,      group: "sys" },
  { value: "coupons",        label: "Mã giảm giá",    icon: Ticket,       group: "sys" },
  { value: "zalo",           label: "Zalo",           icon: MessageSquare,group: "sys" },
] as const;

type TabValue = typeof TABS[number]["value"];

const GROUP_LABELS: Record<string, string> = {
  monitor: "Vận hành",
  ops: "Quản lý",
  sys: "Hệ thống",
};

// Loading fallback
const TabLoader = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    <span className="ml-2 text-gray-500 text-sm">Đang tải...</span>
  </div>
);

// ── Sidebar nav group ─────────────────────────────────────────────────────────
function SidebarGroup({
  group,
  tabs,
  selected,
  onSelect,
  pendingComplaints,
}: {
  group: string;
  tabs: typeof TABS[number][];
  selected: string;
  onSelect: (v: string) => void;
  pendingComplaints: number;
}) {
  return (
    <div>
      <p className="px-3 mb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        {GROUP_LABELS[group]}
      </p>
      {tabs.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 mb-0.5 relative ${
            selected === value
              ? "bg-orange-50 text-orange-700 font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${selected === value ? "text-orange-600" : "text-slate-400"}`} />
          <span className="truncate text-sm">{label}</span>
          {/* Badge for complaints */}
          {value === "complaints" && pendingComplaints > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {pendingComplaints > 99 ? "99+" : pendingComplaints}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Tab content renderer ──────────────────────────────────────────────────────
function TabContent({
  tab,
  formattedStats,
  formattedRevenueData,
  statsLoading,
  statsError,
}: {
  tab: TabValue;
  formattedStats: ReturnType<typeof buildFormattedStats>;
  formattedRevenueData: { month: string; revenue: number }[];
  statsLoading: boolean;
  statsError: string | null;
}) {
  if (tab === "overview") {
    if (statsLoading) return <TabLoader />;
    if (statsError) return <div className="text-center py-10 text-red-500">Lỗi: {statsError}</div>;
    if (formattedStats) return <OverviewTab stats={formattedStats} revenueData={formattedRevenueData} totalProducts={formattedStats.totalProducts} />;
    return null;
  }
  if (tab === "complaints")    return <ComplaintsTab />;
  if (tab === "mart")          return <MartTab />;
  if (tab === "blindbox")      return <BlindBoxTab />;
  if (tab === "finance")       return <FinanceTab />;
  if (tab === "products")      return <ProductsTab />;
  if (tab === "orders")        return <OrdersTab />;
  if (tab === "customers")     return <CustomersTab />;
  if (tab === "users")         return <UsersTab />;
  if (tab === "reviews")       return <ReviewsTab />;
  if (tab === "suppliers")     return <SuppliersTab />;
  if (tab === "subscriptions") return <SubscriptionsTab />;
  if (tab === "coupons")       return <AdminCouponsPage />;
  if (tab === "approvals")     return <ApprovalsTab />;
  if (tab === "zalo")          return <ZaloTab />;
  if (tab === "commission")    return <CommissionTab />;
  return null;
}

function buildFormattedStats(stats: ReturnType<typeof useDashboardStats>["stats"]) {
  if (!stats) return null;
  return { ...stats };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab]   = useState<TabValue>("overview");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [mobileTab,   setMobileTab]     = useState<"overview" | "complaints" | "mart" | "finance">("overview");

  const { stats, revenueData, isLoading: statsLoading, error: statsError } = useDashboardStats();

  const formattedStats = useMemo(() => buildFormattedStats(stats), [stats]);
  const formattedRevenueData = useMemo(
    () => revenueData.map(r => ({ month: r.month, revenue: r.revenue })),
    [revenueData],
  );
  const handleTabChange = useCallback((value: string) => setSelectedTab(value as TabValue), []);
  const handleLogout    = useCallback(() => { localStorage.removeItem("token"); navigate("/login"); }, [navigate]);

  const pendingComplaints: number = stats?.pendingComplaints ?? 0;

  // Group sidebar tabs
  const groupedTabs = useMemo(() => {
    const groups: Record<string, typeof TABS[number][]> = {};
    for (const t of TABS) {
      if (!groups[t.group]) groups[t.group] = [];
      groups[t.group].push(t);
    }
    return groups;
  }, []);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen bg-slate-50 text-sm text-slate-800 antialiased font-sans">

        {/* Sidebar backdrop (only on medium screens when sidebar is toggled) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-30 xl:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-sm z-40 w-56 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="flex flex-col h-full">

            {/* Logo */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-bold text-slate-800">Food &amp; Care</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 xl:hidden">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {Object.entries(groupedTabs).map(([group, tabs]) => (
                <SidebarGroup
                  key={group}
                  group={group}
                  tabs={tabs}
                  selected={selectedTab}
                  onSelect={handleTabChange}
                  pendingComplaints={pendingComplaints}
                />
              ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-3 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 lg:ml-56">
          <div className="min-h-screen pb-8">

            {/* Top bar */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 h-14 flex items-center gap-4 shadow-sm">
              <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 xl:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-slate-800 flex-1">
                {TABS.find(t => t.value === selectedTab)?.label ?? "Admin Dashboard"}
              </h1>
              {pendingComplaints > 0 && (
                <button
                  onClick={() => handleTabChange("complaints")}
                  className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {pendingComplaints} khiếu nại chờ
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors text-xs font-medium"
              >
                <Home className="w-3.5 h-3.5" />
                Trang chủ
              </button>
            </div>

            {/* Tab content */}
            <div className="px-6 py-6">
              <Suspense fallback={<TabLoader />}>
                <TabContent
                  tab={selectedTab}
                  formattedStats={formattedStats}
                  formattedRevenueData={formattedRevenueData}
                  statsLoading={statsLoading}
                  statsError={statsError}
                />
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (below lg)  — bottom navigation
      ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <AdminBottomNav
          activeTab={mobileTab}
          onTabChange={tab => setMobileTab(tab as typeof mobileTab)}
          pendingComplaints={pendingComplaints}
        >
          <div className="p-4">
            <Suspense fallback={<TabLoader />}>
              {mobileTab === "overview"   && (
                statsLoading ? <TabLoader /> :
                formattedStats ? <OverviewTab stats={formattedStats} revenueData={formattedRevenueData} totalProducts={formattedStats.totalProducts} /> :
                null
              )}
              {mobileTab === "complaints" && <ComplaintsTab />}
              {mobileTab === "mart"       && <MartTab />}
              {mobileTab === "finance"    && <FinanceTab />}
            </Suspense>
          </div>
        </AdminBottomNav>
      </div>
    </>
  );
}
