import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, ShoppingCart, Settings, Menu, X, ChevronDown, LogOut, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { getItemCount } = useCart();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Check if currently on admin pages
    const isAdminPage = location.pathname.startsWith('/admin');

    // Detect scroll for shadow effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [location.pathname]);

    const isActiveLink = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navLinkClass = (path: string) =>
        `relative px-1 py-2 text-sm font-medium transition-colors ${
            isActiveLink(path)
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
            <header 
                className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${
                    isScrolled ? 'shadow-md' : 'shadow-sm'
                }`}
            >
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo - Links to Admin Dashboard */}
                        <Link to="/admin" className="flex items-center space-x-3 group">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-shadow">
                                    <LayoutDashboard className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Admin Panel</h1>
                                <p className="text-xs text-gray-500 -mt-0.5">Food & Care Management</p>
                            </div>
                        </Link>

                        {/* Right side - Admin User Menu */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* Admin User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                                        </span>
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">
                                        {user?.fullName}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Admin Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setIsUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Admin</span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 truncate mt-1">{user?.fullName}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    to="/"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <Home className="h-4 w-4 text-gray-400" />
                                                    Về trang chủ
                                                </Link>
                                            </div>
                                            <div className="border-t border-gray-100 pt-1">
                                                <button
                                                    onClick={() => {
                                                        setIsUserMenuOpen(false);
                                                        logout();
                                                    }}
                                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-5 w-5 text-gray-600" />
                                ) : (
                                    <Menu className="h-5 w-5 text-gray-600" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu for Admin */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="container mx-auto px-4 py-4 space-y-1">
                            <Link
                                to="/"
                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Home className="h-4 w-4" />
                                Về trang chủ
                            </Link>
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <User className="h-4 w-4" />
                                Tài khoản
                            </Link>
                            
                            <div className="pt-3 border-t border-gray-100 mt-3">
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>
        );
    }

    // Default user header
    return (
        <header 
            className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${
                isScrolled ? 'shadow-md' : 'shadow-sm'
            }`}
        >
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
                                <ShoppingBag className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Food & Care</h1>
                            <p className="text-xs text-gray-500 -mt-0.5">Giao hàng định kỳ</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        <Link to="/" className={navLinkClass('/')}>
                            Trang chủ
                            <span className={navLinkUnderline('/')} />
                        </Link>
                        <Link to="/products" className={navLinkClass('/products')}>
                            Sản phẩm
                            <span className={navLinkUnderline('/products')} />
                        </Link>
                        {isAuthenticated && (
                            <Link to="/subscriptions" className={navLinkClass('/subscriptions')}>
                                Đơn định kỳ
                                <span className={navLinkUnderline('/subscriptions')} />
                            </Link>
                        )}
                        {isAuthenticated && isAdmin && (
                            <Link 
                                to="/admin" 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    isActiveLink('/admin')
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'text-orange-600 hover:bg-orange-50'
                                }`}
                            >
                                <Settings className="h-4 w-4" />
                                Admin
                            </Link>
                        )}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Cart */}
                        <Link 
                            to="/cart" 
                            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group"
                            aria-label="Giỏ hàng"
                        >
                            <ShoppingCart className="h-5 w-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                            {getItemCount() > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                                    {getItemCount() > 99 ? '99+' : getItemCount()}
                                </span>
                            )}
                        </Link>

                        {/* User Menu - Desktop */}
                        {isAuthenticated ? (
                            <div className="relative hidden sm:block">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">
                                        {user?.fullName}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setIsUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    to="/profile"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    Tài khoản của tôi
                                                </Link>
                                                <Link
                                                    to="/subscriptions"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <ShoppingBag className="h-4 w-4 text-gray-400" />
                                                    Đơn hàng của tôi
                                                </Link>
                                            </div>
                                            <div className="border-t border-gray-100 pt-1">
                                                <button
                                                    onClick={() => {
                                                        setIsUserMenuOpen(false);
                                                        logout();
                                                    }}
                                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="hidden sm:inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-full transition-colors shadow-sm hover:shadow-md"
                            >
                                Đăng nhập
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5 text-gray-600" />
                            ) : (
                                <Menu className="h-5 w-5 text-gray-600" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="container mx-auto px-4 py-4 space-y-1">
                        <Link
                            to="/"
                            className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                isActiveLink('/') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Trang chủ
                        </Link>
                        <Link
                            to="/products"
                            className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                isActiveLink('/products') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Sản phẩm
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link
                                    to="/subscriptions"
                                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        isActiveLink('/subscriptions') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Đơn định kỳ
                                </Link>
                                <Link
                                    to="/profile"
                                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        isActiveLink('/profile') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Tài khoản
                                </Link>
                            </>
                        )}
                        {isAuthenticated && isAdmin && (
                            <Link
                                to="/admin"
                                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    isActiveLink('/admin') ? 'bg-orange-50 text-orange-700' : 'text-orange-600 hover:bg-orange-50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Admin Dashboard
                                </div>
                            </Link>
                        )}
                        
                        <div className="pt-3 border-t border-gray-100 mt-3">
                            {isAuthenticated ? (
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Đăng xuất
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className="block w-full text-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
