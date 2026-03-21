import { useState } from 'react';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Star,
  Truck,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Users,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Lock,
  MapPin,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges?: Record<string, number>;
  onLogout?: () => void;
  isRegistrationApproved?: boolean;
}

export function SupplierSidebar({ activeTab, onTabChange, badges = {}, onLogout, isRegistrationApproved = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: Home },
    { id: 'registration', label: 'Đăng ký kinh doanh', icon: ShieldCheck },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: ShoppingCart, badge: badges.orders, requiresApproval: true },
    { id: 'products', label: 'Sản phẩm', icon: Package, badge: badges.products, requiresApproval: true },
    { id: 'revenue', label: 'Doanh thu', icon: TrendingUp, requiresApproval: true },
    { id: 'reviews', label: 'Đánh giá', icon: Star, badge: badges.reviews, requiresApproval: true },
    { id: 'delivery', label: 'Xác nhận giao hàng', icon: Truck, requiresApproval: true },
    { id: 'delivery-batches', label: 'Lô giao hàng', icon: MapPin, requiresApproval: true },
    { id: 'reports', label: 'Báo cáo vận hành', icon: FileText, requiresApproval: true },
    { id: 'sla', label: 'SLA & Hiệu suất', icon: ShieldCheck, requiresApproval: true },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Food & Care</h1>
              <p className="text-xs text-gray-600">Supplier Dashboard</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = item.requiresApproval && !isRegistrationApproved;

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : isLocked
                    ? 'text-gray-400 hover:bg-gray-50 cursor-pointer'
                    : 'text-gray-700 hover:bg-gray-100'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? (isLocked ? `${item.label} (Cần đăng ký kinh doanh)` : item.label) : ''}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : isLocked ? 'text-gray-300' : 'text-gray-600'}`} />
              {!collapsed && (
                <>
                  <span className={`flex-1 text-left font-medium ${isLocked ? 'text-gray-400' : ''}`}>{item.label}</span>
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-gray-300" />
                  ) : (
                    item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                      }`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        {/* User Info */}
        {!collapsed ? (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Cửa hàng Demo</p>
              <p className="text-xs text-gray-600 truncate">SUP001</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-5 h-5 text-white" />
          </div>
        )}
        
        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={() => {
              onLogout();
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-red-600 hover:bg-red-50 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Đăng xuất' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left font-medium">Đăng xuất</span>}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-white border-r transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
