
import { Link } from 'react-router-dom';
import {
    ShoppingBag,
    Mail,
    Phone,
    MapPin,
    Facebook,
    Instagram,
    Twitter,
    Github,
    ArrowRight,
    Heart
} from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#f1f7f5] text-slate-600 pt-10 pb-6 border-t border-emerald-100/50">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center space-x-3 group w-fit">
                            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                                <ShoppingBag className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Food & Care</h2>
                                <p className="text-xs text-emerald-600 -mt-1 font-medium italic">Giao hàng định kỳ</p>
                            </div>
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-500">
                            Giải pháp mua sắm thông minh giúp bạn tiết kiệm thời gian và chi phí với mô hình giao hàng định kỳ các sản phẩm thiết yếu hàng ngày.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="https://www.facebook.com/profile.php?id=61551513965314" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm">
                                <Facebook className="w-4.5 h-4.5" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm">
                                <Instagram className="w-4.5 h-4.5" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm">
                                <Twitter className="w-4.5 h-4.5" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm">
                                <Github className="w-4.5 h-4.5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-slate-900 font-bold text-base">Liên Kết Nhanh</h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Sản phẩm', path: '/products' },
                                { name: 'Gợi ý cho bạn', path: '/recommendations' },
                                { name: 'Đơn hàng định kỳ', path: '/subscriptions' },
                                { name: 'Hồ sơ cá nhân', path: '/profile' },
                                { name: 'Giỏ hàng', path: '/cart' }
                            ].map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-sm hover:text-emerald-700 flex items-center group transition-colors duration-200 text-slate-500"
                                    >
                                        <ArrowRight className="w-3.5 h-3.5 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-emerald-500" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-slate-900 font-bold text-base">Thông Tin Liên Hệ</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 w-7 h-7 rounded-lg bg-white border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-900 font-medium">Địa chỉ</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">Khu đô thị FPT, Phường Ngũ Hành Sơn, TP. Đà Nẵng</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 w-7 h-7 rounded-lg bg-white border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-900 font-medium">Điện thoại</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 hover:text-emerald-600 transition-colors cursor-pointer">0865 498 733</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 w-7 h-7 rounded-lg bg-white border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-900 font-medium">Email</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 hover:text-emerald-600 transition-colors cursor-pointer">support@foodcare.com</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-4">
                        <h3 className="text-slate-900 font-bold text-base">Đăng Ký Nhận Tin</h3>
                        <p className="text-sm text-slate-500">
                            Nhận thông báo về các chương trình khuyến mãi và sản phẩm mới nhất.
                        </p>
                        <div className="relative group">
                            <input
                                type="email"
                                placeholder="Email của bạn..."
                                className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 shadow-sm"
                            />
                            <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg px-3 flex items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/20">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            <span>Secure Payment</span>
                            <span className="w-1 h-1 bg-emerald-200 rounded-full"></span>
                            <span>24/7 Support</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-emerald-100/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-400 font-medium order-2 md:order-1">
                        &copy; {currentYear} <span className="text-slate-900 font-bold">Food & Care</span>. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider order-1 md:order-2">
                        <a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">Cookies</a>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 order-3">
                        Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> in Vietnam
                    </p>
                </div>
            </div>
        </footer>
    );
}
