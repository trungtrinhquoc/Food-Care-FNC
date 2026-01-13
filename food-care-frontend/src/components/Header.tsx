import { Link } from 'react-router-dom';
import { ShoppingBag, User, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { getItemCount } = useCart();

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
                            <div className="flex items-center space-x-4">
                                <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors">
                                    <User className="h-6 w-6" />
                                    <span className="hidden md:inline">{user?.fullName}</span>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Đăng xuất
                                </button>
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
