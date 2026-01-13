import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Award, Clock } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <section className="text-center py-20 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Food & Care
                </h1>
                <p className="text-2xl text-gray-600 mb-8">
                    Giao hàng định kỳ - Tiết kiệm thời gian & chi phí
                </p>
                <Link to="/products" className="btn-primary text-lg px-8 py-3 inline-block">
                    Khám phá sản phẩm
                </Link>
            </section>

            {/* Features */}
            <section className="grid md:grid-cols-4 gap-8">
                <div className="text-center p-6">
                    <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Sản phẩm chất lượng</h3>
                    <p className="text-gray-600 text-sm">Các sản phẩm thiết yếu hàng ngày</p>
                </div>

                <div className="text-center p-6">
                    <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Giao hàng định kỳ</h3>
                    <p className="text-gray-600 text-sm">Tự động giao hàng theo lịch</p>
                </div>

                <div className="text-center p-6">
                    <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Ưu đãi thành viên</h3>
                    <p className="text-gray-600 text-sm">4 hạng với quyền lợi riêng</p>
                </div>

                <div className="text-center p-6">
                    <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Tiết kiệm thời gian</h3>
                    <p className="text-gray-600 text-sm">Không lo hết hàng thiết yếu</p>
                </div>
            </section>

            {/* Member Tiers */}
            <section>
                <h2 className="text-3xl font-bold text-center mb-12">Hạng thành viên</h2>
                <div className="grid md:grid-cols-4 gap-6">
                    {[
                        { name: 'Đồng', discount: '0%', color: 'bg-amber-700' },
                        { name: 'Bạc', discount: '5%', color: 'bg-gray-400' },
                        { name: 'Vàng', discount: '10%', color: 'bg-yellow-500' },
                        { name: 'Bạch Kim', discount: '15%', color: 'bg-cyan-500' },
                    ].map((tier) => (
                        <div key={tier.name} className="card text-center">
                            <div className={`${tier.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                                <Award className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">{tier.name}</h3>
                            <p className="text-2xl font-bold text-primary mb-2">{tier.discount}</p>
                            <p className="text-gray-600 text-sm">Giảm giá</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-primary text-white rounded-2xl p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Bắt đầu ngay hôm nay</h2>
                <p className="text-xl mb-8">Đăng ký để nhận ưu đãi đặc biệt</p>
                <Link to="/login" className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
                    Đăng ký ngay
                </Link>
            </section>
        </div>
    );
}
