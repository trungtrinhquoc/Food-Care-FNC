import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ShoppingBag, User, ShoppingCart, Settings, Menu,
    X, ChevronDown, LogOut, Home, LayoutDashboard, Package
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { getItemCount } = useCart();
    const location = useLocation();
    const navigate = useNavigate();

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAdminPage = location.pathname.startsWith('/admin');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
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
    }, [location.pathname]);

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

    const navLinkClass = (path: string) =>
        `relative px-1 py-2 text-sm font-medium transition-colors ${isActiveLink(path)
            ? 'text-emerald-600'
            : 'text-gray-600 hover:text-emerald-600'
        }`;

    const navLinkUnderline = (path: string) =>
        isActiveLink(path)
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

    // Default user header
    return (
        <header className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
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

                    <nav className="hidden lg:flex items-center space-x-1">
                        <Link to="/" className={navLinkClass('/')}>Trang chủ <span className={navLinkUnderline('/')} /></Link>
                        <Link to="/products" className={navLinkClass('/products')}>Sản phẩm <span className={navLinkUnderline('/products')} /></Link>
                        {isAuthenticated && (
                            <Link to="/subscriptions" className={navLinkClass('/subscriptions')}>Đơn định kỳ <span className={navLinkUnderline('/subscriptions')} /></Link>
                        )}
                        {isAuthenticated && isAdmin && (
                            <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-orange-600 hover:bg-orange-50 transition-all">
                                <Settings className="h-4 w-4" /> Admin
                            </Link>
                        )}
                    </nav>

                    <div className="flex items-center space-x-4">
                        <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group">
                            <ShoppingCart className="h-5 w-5 text-gray-600 group-hover:text-emerald-600" />
                            {getItemCount() > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                                    {getItemCount() > 99 ? '99+' : getItemCount()}
                                </span>
                            )}
                        </Link>

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
                                            <Link to="/subscriptions" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                                                <Package className="w-5 h-5 text-gray-400" /> <span className="text-sm">Đơn hàng định kỳ</span>
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
                        {isAuthenticated && (
                            <>
                                <Link to="/subscriptions" className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/subscriptions') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>Đơn định kỳ</Link>
                                <Link to="/profile" className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActiveLink('/profile') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>Tài khoản</Link>
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