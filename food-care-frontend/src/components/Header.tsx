import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, ShoppingCart, ChevronDown, LogOut, Package, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { getItemCount } = useCart();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
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

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Food & Care</h1>
                            <p className="text-xs text-gray-500">Giao hàng định kỳ</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
                            Trang chủ
                        </Link>
                        <Link to="/products" className="text-gray-700 hover:text-primary transition-colors">
                            Sản phẩm
                        </Link>
                        {isAuthenticated && (
                            <Link to="/subscriptions" className="text-gray-700 hover:text-primary transition-colors">
                                Đơn định kỳ
                            </Link>
                        )}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        {/* Cart */}
                        <Link to="/cart" className="relative">
                            <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-primary transition-colors" />
                            {getItemCount() > 0 && (
                                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {getItemCount()}
                                </span>
                            )}
                        </Link>

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                {/* Avatar Button */}
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                                >
                                    {/* Avatar Circle */}
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        {user?.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.fullName}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-emerald-600 font-semibold text-sm">
                                                {getInitials(user?.fullName || 'U')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Username */}
                                    <span className="hidden md:inline text-gray-700 font-medium">
                                        {user?.fullName}
                                    </span>

                                    {/* Chevron */}
                                    <ChevronDown
                                        className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Header */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-900">Tài khoản của tôi</p>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-1">
                                            {/* Admin Dashboard - Only for admin */}
                                            {user?.role === 'admin' && (
                                                <>
                                                    <Link
                                                        to="/admin/dashboard"
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <LayoutDashboard className="w-5 h-5 text-gray-500" />
                                                        <span className="text-sm">Admin Dashboard</span>
                                                    </Link>
                                                    <div className="my-1 border-t border-gray-100"></div>
                                                </>
                                            )}

                                            <Link
                                                to="/profile"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <User className="w-5 h-5 text-gray-500" />
                                                <span className="text-sm">Thông tin cá nhân</span>
                                            </Link>

                                            <Link
                                                to="/profile?tab=orders"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Package className="w-5 h-5 text-gray-500" />
                                                <span className="text-sm">Đơn hàng định kỳ</span>
                                            </Link>

                                            {/* Divider */}
                                            <div className="my-1 border-t border-gray-100"></div>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-5 h-5" />
                                                <span className="text-sm font-medium">Đăng xuất</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="btn-primary"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
