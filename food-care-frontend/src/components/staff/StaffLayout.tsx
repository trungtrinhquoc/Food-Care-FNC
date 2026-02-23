import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Warehouse,
    LayoutDashboard,
    Truck,
    Package,
    ClipboardList,
    FileWarning,
    RotateCcw,
    Bell,
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
    Settings,
    Building2,
    Box,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// Brand Colors
const colors = {
    primary: '#485550',      // Dark green/charcoal
    accent: '#C0EB6A',       // Bright lime green
    background: '#F4F6F0',   // Light gray/off-white
    white: '#FFFFFF',
};

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'shipping', label: 'Vận chuyển', icon: Truck },
    { id: 'warehouses', label: 'Kho hàng', icon: Building2 },
    { id: 'receipts', label: 'Nhập kho', icon: ClipboardList },
    { id: 'inventory', label: 'Tồn kho', icon: Box },
    { id: 'discrepancies', label: 'Sai lệch', icon: FileWarning },
    { id: 'returns', label: 'Trả hàng', icon: RotateCcw },
];

interface StaffLayoutProps {
    children: React.ReactNode;
    currentTab: string;
    onTabChange: (tab: string) => void;
    staffName?: string;
    staffPosition?: string;
    employeeCode?: string;
    notificationCount?: number;
    onRefresh?: () => void;
    loading?: boolean;
}

export function StaffLayout({
    children,
    currentTab,
    onTabChange,
    staffName = 'Nhân viên kho',
    staffPosition = 'Staff',
    employeeCode,
    notificationCount = 0,
    onRefresh,
    loading = false,
}: StaffLayoutProps) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = (tabId: string) => {
        onTabChange(tabId);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: colors.background }}>
            {/* Sidebar - Desktop */}
            <aside
                className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0"
                style={{ backgroundColor: colors.primary }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: colors.accent }}
                    >
                        <Warehouse className="w-6 h-6" style={{ color: colors.primary }} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white tracking-tight">Food & Care</h1>
                        <p className="text-xs text-white/60">Warehouse Management</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentTab === item.id;
                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => handleNavClick(item.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                                        style={{
                                            backgroundColor: isActive ? 'rgba(192, 235, 106, 0.15)' : 'transparent',
                                            color: isActive ? colors.accent : 'rgba(255, 255, 255, 0.7)',
                                        }}
                                    >
                                        <Icon
                                            className="w-5 h-5"
                                            style={{ color: isActive ? colors.accent : 'rgba(255, 255, 255, 0.5)' }}
                                        />
                                        {item.label}
                                        {item.id === 'discrepancies' && notificationCount > 0 && (
                                            <span
                                                className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                                style={{ backgroundColor: '#EF4444', color: 'white' }}
                                            >
                                                {notificationCount}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-2">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                            style={{ backgroundColor: colors.accent, color: colors.primary }}
                        >
                            {staffName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{staffName}</p>
                            <p className="text-xs text-white/50">{employeeCode || staffPosition}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                >
                    <div className="absolute inset-0 bg-black/50" />
                </div>
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{ backgroundColor: colors.primary }}
            >
                {/* Close Button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: colors.accent }}
                    >
                        <Warehouse className="w-6 h-6" style={{ color: colors.primary }} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white tracking-tight">Food & Care</h1>
                        <p className="text-xs text-white/60">Warehouse Management</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentTab === item.id;
                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => handleNavClick(item.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                                        style={{
                                            backgroundColor: isActive ? 'rgba(192, 235, 106, 0.15)' : 'transparent',
                                            color: isActive ? colors.accent : 'rgba(255, 255, 255, 0.7)',
                                        }}
                                    >
                                        <Icon
                                            className="w-5 h-5"
                                            style={{ color: isActive ? colors.accent : 'rgba(255, 255, 255, 0.5)' }}
                                        />
                                        {item.label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-4 lg:px-6 py-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
                            style={{ color: colors.primary }}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Page Title - Mobile */}
                        <div className="lg:hidden flex items-center gap-2">
                            <Warehouse className="w-5 h-5" style={{ color: colors.accent }} />
                            <span className="font-semibold" style={{ color: colors.primary }}>Staff Portal</span>
                        </div>

                        {/* Welcome Text - Desktop */}
                        <div className="hidden lg:block">
                            <h2 className="text-lg font-semibold" style={{ color: colors.primary }}>
                                Xin chào, {staffName}!
                            </h2>
                            <p className="text-sm text-gray-500">{staffPosition} • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2">
                            {/* Refresh Button */}
                            {onRefresh && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRefresh}
                                    disabled={loading}
                                    className="hidden sm:flex items-center gap-2"
                                >
                                    <Package className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    <span className="hidden md:inline">Làm mới</span>
                                </Button>
                            )}

                            {/* Notifications */}
                            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <Bell className="w-5 h-5" style={{ color: colors.primary }} />
                                {notificationCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </span>
                                )}
                            </button>

                            {/* User Menu */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                                        style={{ backgroundColor: colors.accent, color: colors.primary }}
                                    >
                                        {staffName.charAt(0).toUpperCase()}
                                    </div>
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                                        style={{ color: colors.primary }}
                                    />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold" style={{ color: colors.primary }}>{staffName}</p>
                                            <p className="text-xs text-gray-500">{employeeCode}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
