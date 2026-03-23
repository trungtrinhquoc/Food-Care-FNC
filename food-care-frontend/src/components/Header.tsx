import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ShoppingBag, User, ShoppingCart, Settings, Menu,
    X, ChevronDown, LogOut, Home, LayoutDashboard, Package,
    Truck, Store, BarChart3, FileText, Bell, Ticket, MapPin,
    CheckCircle, XCircle, AlertCircle, Plus, Loader2,
    Camera, Box, ShoppingCart as ShoppingCartIcon, Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import NotificationBell from './NotificationBell';
import { profileApi } from '../services/api';
import { martApi } from '../services/martApi';
import { toast } from 'sonner';
import type { Address } from '../types';

function shortenAddress(fullAddress: string) {
    if (!fullAddress) return '';
    const firstPart = fullAddress.split(',')[0]?.trim();
    return firstPart || fullAddress;
}

export default function Header() {
    const { user, isAuthenticated, isAdmin, logout, refreshUser } = useAuth();
    const { getItemCount } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [defaultAddressLabel, setDefaultAddressLabel] = useState<string>('');
    const [selectedMartName, setSelectedMartName] = useState<string>('');
    const [customerAddresses, setCustomerAddresses] = useState<Address[]>([]);
    const [isAddressMenuOpen, setIsAddressMenuOpen] = useState(false);
    const [switchingAddressId, setSwitchingAddressId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const addressMenuRef = useRef<HTMLDivElement>(null);

    const isAdminPage = location.pathname.startsWith('/admin');
    const isSupplierPage = location.pathname.startsWith('/supplier');
    const isStaffPage = location.pathname.startsWith('/staff');
    const isSupplier = user?.role === 'supplier';
    const isStaff = user?.role === 'staff';
    const currentTab = searchParams.get('tab') || 'overview';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (addressMenuRef.current && !addressMenuRef.current.contains(event.target as Node)) {
                setIsAddressMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Detect scroll for shadow effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsAddressMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isAuthenticated || user?.role?.toLowerCase() !== 'customer') {
            setDefaultAddressLabel('');
            return;
        }

        let cancelled = false;

        const loadCustomerContext = async () => {
            try {
                const [addresses, selectedMartId] = await Promise.all([
                    profileApi.getAddresses(),
                    martApi.getSelectedMart(),
                ]);

                if (!cancelled) {
                    setCustomerAddresses(addresses.slice(0, 5));
                }

                const current = addresses.find((a) => a.isDefault);
                if (!current || cancelled) {
                    return;
                }

                const text = [
                    current.addressLine1,
                    current.ward,
                    current.district,
                    current.city,
                ]
                    .filter(Boolean)
                    .join(', ');

                setDefaultAddressLabel(text);

                if (selectedMartId) {
                    try {
                        const mart = await martApi.getMartDetail(selectedMartId);
                        if (!cancelled) {
                            setSelectedMartName(mart.storeName || 'Mart đã chọn');
                        }
                    } catch {
                        if (!cancelled) setSelectedMartName('Mart đã chọn');
                    }
                } else if (!cancelled) {
                    setSelectedMartName('Chưa chọn mart');
                }
            } catch {
                if (!cancelled) {
                    setDefaultAddressLabel('');
                    setSelectedMartName('');
                    setCustomerAddresses([]);
                }
            }
        };

        loadCustomerContext();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.role, location.pathname]);

    const handleSwitchAddress = async (address: Address) => {
        if (switchingAddressId) return;

        setSwitchingAddressId(address.id);
        try {
            await profileApi.setDefaultAddress(address.id);

            if (typeof address.latitude === 'number' && typeof address.longitude === 'number') {
                const nearest = await martApi.getNearbyMarts({
                    latitude: address.latitude,
                    longitude: address.longitude,
                    radiusKm: 0,
                    maxResults: 1,
                });

                if (nearest.length > 0) {
                    await martApi.selectMart(nearest[0].id);
                    setSelectedMartName(nearest[0].storeName);
                }
            }

            const shortText = [address.addressLine1, address.ward, address.district, address.city]
                .filter(Boolean)
                .join(', ');
            setDefaultAddressLabel(shortText);
            await refreshUser();
            toast.success('Đã đổi địa chỉ và cập nhật mart gần nhất');
            setIsAddressMenuOpen(false);
        } catch {
            toast.error('Không thể đổi địa chỉ. Vui lòng thử lại.');
        } finally {
            setSwitchingAddressId(null);
        }
    };

    // Staff pages use their own layout with integrated header - must be after all hooks
    if (isStaffPage && (isStaff || isAdmin)) {
        return null;
    }


    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
        navigate('/');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isActiveLink = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navLinkClass = (isActive: boolean) =>
        `relative px-1 py-2 text-base font-medium transition-colors flex items-center ${isActive
            ? 'text-emerald-600'
            : 'text-gray-600 hover:text-emerald-600'
        }`;

    const navLinkUnderline = (isActive: boolean) =>
        isActive
            ? 'absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full'
            : '';

    // Admin header variant
    if (isAdminPage && isAdmin) {
        return (
            <header className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/admin" className="flex items-center space-x-3 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all duration-300">
                                <ShoppingBag className="h-6 w-6 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Panel</h1>
                                <p className="text-sm text-gray-500 -mt-0.5 font-medium">Food & Care Management</p>
                            </div>
                        </Link>

                        <div className="flex items-center space-x-4">
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                                        </span>
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium text-gray-700">{user?.fullName}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Admin</span>
                                            <p className="text-sm font-semibold text-gray-900 truncate mt-1">{user?.fullName}</p>
                                        </div>
                                        <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                            <Home className="h-4 w-4 text-gray-400" /> Về trang chủ
                                        </Link>
                                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100">
                                            <LogOut className="h-4 w-4" /> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    // Supplier header variant
    if (isSupplierPage && isSupplier) {
        const supplierNavLinks = [
            { path: '/supplier', tab: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/supplier?tab=orders', tab: 'orders', label: 'Đơn hàng', icon: Package },
            { path: '/supplier?tab=products', tab: 'products', label: 'Sản phẩm', icon: Store },
            { path: '/supplier?tab=delivery', tab: 'delivery', label: 'Vận chuyển', icon: Truck },
        ];

        // Check if a nav link is active
        const isNavActive = (linkTab: string) => currentTab === linkTab;

        return (
            <header className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/supplier" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                                <Store className="h-5 w-5 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Food & Care</h1>
                                <p className="text-xs text-gray-500 -mt-0.5">Supplier Portal</p>
                            </div>
                        </Link>

                        {/* Navigation - Desktop */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            {supplierNavLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isNavActive(link.tab)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Right Side */}
                        <div className="flex items-center space-x-3">
                            {/* Notifications */}
                            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <Bell className="h-5 w-5 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* User Menu */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
                                        </span>
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">
                                        {user?.fullName || 'Nhà cung cấp'}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg ring-1 ring-black/5 z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Nhà cung cấp</span>
                                            <p className="text-sm font-semibold text-gray-900 truncate mt-1">{user?.fullName}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/supplier?tab=settings"
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Settings className="h-4 w-4 text-gray-400" /> Cài đặt tài khoản
                                        </Link>
                                        <Link
                                            to="/supplier?tab=reports"
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <BarChart3 className="h-4 w-4 text-gray-400" /> Báo cáo
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                        >
                                            <LogOut className="h-4 w-4" /> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                {isMobileMenuOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="container mx-auto px-4 py-4 space-y-1">
                            {supplierNavLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${isNavActive(link.tab)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <link.icon className="h-5 w-5" />
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                to="/supplier?tab=settings"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${currentTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                <Settings className="h-5 w-5" /> Cài đặt
                            </Link>
                        </div>
                    </div>
                )}
            </header>
        );
    }

    // Default user header
    return (
        <header className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
            {isAuthenticated && user?.role?.toLowerCase() === 'customer' && (
                <div className="border-b border-gray-100 bg-emerald-50/50">
                    <div className="container mx-auto px-4 lg:px-8 py-2 flex items-center justify-between gap-3 text-sm relative" ref={addressMenuRef}>
                        <button
                            onClick={() => setIsAddressMenuOpen((v) => !v)}
                            className="min-w-0 flex items-center gap-2 text-gray-700 hover:text-emerald-700 transition-colors"
                        >
                            <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                            <span className="truncate font-medium">
                                {selectedMartName || 'Chưa chọn mart'} · {shortenAddress(defaultAddressLabel) || 'Chưa có địa chỉ'}
                            </span>
                            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isAddressMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            onClick={() => navigate(user?.selectedMartId ? `/marts/${user.selectedMartId}` : '/mart-selection')}
                            className="shrink-0 text-emerald-700 hover:text-emerald-800 font-semibold"
                        >
                            Xem mart
                        </button>

                        {isAddressMenuOpen && (
                            <div className="absolute left-4 right-4 lg:left-8 lg:right-8 mt-10 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-2">
                                <div className="px-2 py-1 text-xs text-gray-500">Địa chỉ đã lưu (tối đa 5)</div>
                                <div className="max-h-64 overflow-auto">
                                    {customerAddresses.length > 0 ? customerAddresses.map((addr, idx) => {
                                        const text = [addr.addressLine1, addr.ward, addr.district, addr.city].filter(Boolean).join(', ');
                                        const isDefault = !!addr.isDefault;
                                        return (
                                            <button
                                                key={addr.id}
                                                onClick={() => handleSwitchAddress(addr)}
                                                disabled={!!switchingAddressId}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors ${isDefault ? 'bg-emerald-50 border border-emerald-100' : ''}`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{`Địa chỉ ${idx + 1}`}</p>
                                                    {isDefault && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">Mặc định</span>}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{text}</p>
                                                {switchingAddressId === addr.id && (
                                                    <p className="text-xs text-emerald-600 mt-1 inline-flex items-center gap-1">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Đang cập nhật mart gần nhất...
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    }) : (
                                        <p className="px-3 py-2 text-sm text-gray-500">Bạn chưa có địa chỉ nào.</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsAddressMenuOpen(false);
                                        navigate('/mart-selection');
                                    }}
                                    className="mt-2 w-full text-left px-3 py-2 rounded-lg text-emerald-700 hover:bg-emerald-50 font-medium"
                                >
                                    + Thêm địa chỉ mới
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all duration-300">
                            <ShoppingBag className="h-6 w-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Food & Care</h1>
                            <p className="text-sm text-gray-500 -mt-0.5 font-medium border-b border-emerald-50/0 group-hover:border-emerald-500 transition-all duration-300">Giao hàng định kỳ</p>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center space-x-6">
                        <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
                            Trang chủ
                            <span className={navLinkUnderline(isActiveLink('/'))} />
                        </NavLink>
                        <NavLink to="/products" className={({ isActive }) => navLinkClass(isActive)}>

                            Sản phẩm
                            <span className={navLinkUnderline(isActiveLink('/products'))} />
                        </NavLink>
                        {isAuthenticated && (
                            <NavLink to="/subscriptions" className={({ isActive }) => navLinkClass(isActive)}>
                                <Box className="w-4 h-4 text-orange-500 mr-1.5" />
                                Đơn định kỳ
                                <span className={navLinkUnderline(isActiveLink('/subscriptions'))} />
                            </NavLink>
                        )}
                        {isAuthenticated && (
                            <NavLink to="/vouchers" className={({ isActive }) => navLinkClass(isActive)}>
                                <Ticket className="w-4 h-4 text-purple-500 mr-1.5" />
                                Voucher
                                <span className={navLinkUnderline(isActiveLink('/vouchers'))} />
                            </NavLink>
                        )}
                        <NavLink to="/blind-boxes" className={({ isActive }) => navLinkClass(isActive)}>
                            <Box className="w-4 h-4 text-orange-500 mr-1.5" />
                            Blind Box
                            <span className={navLinkUnderline(isActiveLink('/blind-boxes'))} />
                        </NavLink>
                        {isAuthenticated && isAdmin && (
                            <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-orange-600 hover:bg-orange-50 transition-all">
                                <Settings className="h-4 w-4" /> Admin
                            </Link>
                        )}
                    </nav>

                    <div className="flex items-center space-x-1">
                        <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group">
                            <ShoppingCart className="h-5 w-5 text-gray-600 group-hover:text-emerald-600" />
                            {getItemCount() > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                                    {getItemCount() > 99 ? '99+' : getItemCount()}
                                </span>
                            )}
                        </Link>

                        {isAuthenticated && <NotificationBell />}
                        {isAuthenticated ? (
                            <div className="relative hidden sm:block" ref={dropdownRef}>
                                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 object-cover" />
                                        ) : (
                                            <span className="text-emerald-600 font-semibold text-sm">{getInitials(user?.fullName || 'U')}</span>
                                        )}
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.fullName}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            {isAdmin && (
                                                <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                                                    <LayoutDashboard className="w-5 h-5 text-gray-400" /> <span className="text-sm">Admin Dashboard</span>
                                                </Link>
                                            )}
                                            <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                                                <User className="w-5 h-5 text-gray-400" /> <span className="text-sm">Thông tin cá nhân</span>
                                            </Link>
                                            <Link to="/profile?tab=wallet" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                                                <Wallet className="w-5 h-5 text-emerald-500" /> <span className="text-sm">Ví FNC Pay</span>
                                            </Link>
                                            <Link to="/subscriptions" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                                                <Package className="w-5 h-5 text-gray-400" /> <span className="text-sm">Đơn hàng định kỳ</span>
                                            </Link>
                                            <Link to="/notifications" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                                                <Bell className="w-5 h-5 text-gray-400" /> <span className="text-sm">Trung tâm thông báo</span>
                                            </Link>
                                            <Link to="/feedback" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                                                <FileText className="w-5 h-5 text-gray-400" /> <span className="text-sm">Góp ý nền tảng</span>
                                            </Link>
                                            <Link to="/vouchers" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                                                <Ticket className="w-5 h-5 text-amber-500" /> <span className="text-sm">Kho Voucher ưu đãi</span>
                                                <span className="ml-auto text-[10px] bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full">Mới</span>
                                            </Link>
                                        </div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100">
                                            <LogOut className="w-5 h-5" /> <span className="text-sm font-medium">Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="hidden sm:inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors">Đăng nhập</Link>
                        )}

                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors">
                            {isMobileMenuOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="container mx-auto px-4 py-4 space-y-1">
                        <Link to="/" className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>Trang chủ</Link>
                        <Link to="/products" className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/products') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>Sản phẩm</Link>
                        <Link to="/blind-boxes" className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/blind-boxes') ? 'bg-orange-50 text-orange-600' : 'text-gray-700'}`}>
                            <Box className="h-4 w-4 text-orange-500" />
                            Blind Box
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link to="/subscriptions" className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/subscriptions') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>Đơn định kỳ</Link>
                                <Link to="/vouchers" className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/vouchers') ? 'bg-orange-50 text-orange-600' : 'text-gray-700'}`}>
                                    <Ticket className="h-4 w-4 text-amber-500" />
                                    Kho Voucher
                                    <span className="ml-auto text-[10px] bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full">Mới</span>
                                </Link>
                                <Link to="/profile" className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/profile') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>Tài khoản</Link>
                                <Link to="/feedback" className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/feedback') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>Góp ý nền tảng</Link>
                                <Link to="/profile?tab=wallet" className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${location.search.includes('tab=wallet') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>
                                    <Wallet className="h-4 w-4 text-emerald-500" />
                                    Ví FNC Pay
                                </Link>
                            </>
                        )}
                        {!isAuthenticated && (
                            <Link to="/login" className="block w-full text-center px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-lg">Đăng nhập</Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}