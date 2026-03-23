import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { LowStockNotification } from '../components/LowStockNotification';
import { productsApi } from '../services/productsApi';
import { recommendationsApi } from '../services/recommendationsApi';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ArrowRight, Star, TrendingUp, Package, Clock, DollarSign, Sparkles, Percent, Heart, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';

export default function HomePage() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, [user?.selectedMartId]);

    const fetchProducts = async () => {
        try {
            const response = await productsApi.getProducts({
                pageSize: 20,
                supplierId: user?.selectedMartId ?? undefined,
            });
            setProducts(response.products);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Backend-powered recommendation sections
    const { data: highRatedProducts = [] } = useQuery({
        queryKey: ['recommendations', 'high-rated'],
        queryFn: () => recommendationsApi.getHighRated(4),
        retry: 1,
    });

    const { data: trendingProducts = [] } = useQuery({
        queryKey: ['recommendations', 'trending'],
        queryFn: () => recommendationsApi.getTrending(4),
        retry: 1,
    });

    const { data: biggestDiscounts = [] } = useQuery({
        queryKey: ['recommendations', 'biggest-discounts'],
        queryFn: () => recommendationsApi.getBiggestDiscounts(4),
        retry: 1,
    });

    const { data: newArrivals = [] } = useQuery({
        queryKey: ['recommendations', 'new-arrivals'],
        queryFn: () => recommendationsApi.getNewArrivals(4),
        retry: 1,
    });

    const { data: personalizedData } = useQuery({
        queryKey: ['recommendations', 'for-you'],
        queryFn: () => recommendationsApi.getPersonalized(),
        enabled: !!user,
        retry: 1,
    });

    const handleAddToCart = (product: Product) => {
        addToCart(product, 1);
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    };

    const handleViewDetail = (product: Product) => {
        navigate(`/products/${product.id}`);
    };

    const openSearchPage = () => navigate('/search-all');

    return (
        <div className="min-h-screen bg-white">
            {/* Low Stock Notification */}
            <LowStockNotification onAddToCart={handleAddToCart} />

            {/* Hero Section với ảnh nền */}
            <section className="relative bg-gradient-to-r from-emerald-600 to-teal-600 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <ImageWithFallback
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&h=800&fit=crop"
                        alt="Hero background"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="relative container mx-auto px-4 py-20 lg:py-28">
                    <div className="max-w-3xl mx-auto text-center text-white">
                        <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6 border border-white/30">
                            ✨ Chương trình mới: Giảm ngay 10-15% khi đặt hàng định kỳ
                        </div>
                        <h1 className="mb-6 text-white text-4xl lg:text-5xl font-bold">
                            Chăm Sóc Sức Khỏe<br />Mỗi Ngày Cùng Food & Care
                        </h1>
                        <p className="text-xl mb-8 text-emerald-50">
                            Đặt hàng một lần, nhận hàng định kỳ. Tiết kiệm thời gian và chi phí cho những sản phẩm thiết yếu hàng ngày!
                        </p>
                        <div className="max-w-2xl mx-auto mb-8">
                            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/25">
                                <p className="text-xs text-emerald-50 mb-2 text-left">Tìm sản phẩm trên toàn nền tảng</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 text-emerald-200 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <button
                                            onClick={openSearchPage}
                                            className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/95 text-gray-600 text-sm text-left"
                                        >
                                            Tìm thực phẩm khô...
                                        </button>
                                    </div>
                                    <Button onClick={openSearchPage} className="bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl px-4">
                                        Mở tìm kiếm
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button
                                size="sm"
                                onClick={() => navigate('/recommendations')}
                                className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-4 py-1.5 text-sm shadow-md border-0"
                            >
                                💡 Gợi ý cho bạn
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => navigate('/products')}
                                className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-4 py-1.5 text-sm shadow-md border-0"
                            >
                                Xem Sản Phẩm
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                                className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 font-semibold px-4 py-1.5 text-sm shadow-md"
                            >
                                Tìm Hiểu Thêm
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <Package className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h3 className="mb-2 font-bold text-lg">Giao hàng miễn phí</h3>
                            <p className="text-gray-600">
                                Miễn phí vận chuyển cho đơn hàng trên 200.000đ. Giao hàng nhanh chóng trong 24h.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border-2 border-emerald-200">
                            <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <Clock className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="mb-2 font-bold text-lg">Đặt hàng định kỳ</h3>
                            <p className="text-gray-600">
                                Tự động giao hàng theo lịch của bạn. Không lo quên mua, luôn có hàng khi cần.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <DollarSign className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h3 className="mb-2 font-bold text-lg">Tiết kiệm chi phí</h3>
                            <p className="text-gray-600">
                                Giảm giá 10-15% cho đơn hàng định kỳ. Giá tốt nhất thị trường.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recommended Products Section - High Rated from API */}
            {highRatedProducts.length > 0 && (
                <section className="py-8 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    <h2 className="text-2xl font-bold">Sản Phẩm Được Đề Xuất</h2>
                                </div>
                                <p className="text-gray-600 text-[14px]">
                                    Những sản phẩm được khách hàng yêu thích và đánh giá cao nhất
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/products')}
                                className="hidden md:flex border-2 border-gray-200 py-1"
                            >
                                Xem tất cả
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                            {highRatedProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetail={handleViewDetail}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>

                        <div className="text-center md:hidden">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/products')}
                                className="border-2 border-gray-200"
                            >
                                Xem tất cả sản phẩm
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* Trending Products Section */}
            {trendingProducts.length > 0 && (
                <section className="py-8 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                    <h2 className="text-2xl font-bold">Xu Hướng</h2>
                                </div>
                                <p className="text-gray-600 text-[14px]">
                                    Sản phẩm đang được nhiều người mua nhất
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/products')}
                                className="hidden md:flex border-2 border-gray-200 py-1"
                            >
                                Xem tất cả
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                            {trendingProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetail={handleViewDetail}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Biggest Discounts Section */}
            {biggestDiscounts.length > 0 && (
                <section className="py-8 bg-gradient-to-br from-amber-50 to-orange-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Percent className="w-5 h-5 text-red-600" />
                                    <h2 className="text-2xl font-bold">Giảm Giá Lớn</h2>
                                </div>
                                <p className="text-gray-600 text-[14px]">
                                    Sản phẩm đang có chương trình giảm giá hấp dẫn nhất
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/products')}
                                className="hidden md:flex border-2 border-gray-200 py-1"
                            >
                                Xem tất cả
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                            {biggestDiscounts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetail={handleViewDetail}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>

                        <div className="text-center md:hidden">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/products')}
                                className="border-2 border-gray-200"
                            >
                                Xem tất cả ưu đãi
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* New Arrivals Section */}
            {newArrivals.length > 0 && (
                <section className="py-8 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    <h2 className="text-2xl font-bold">Mới Nhất</h2>
                                </div>
                                <p className="text-gray-600 text-[14px]">
                                    Sản phẩm mới được thêm vào cửa hàng
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/products')}
                                className="hidden md:flex border-2 border-gray-200 py-1"
                            >
                                Xem tất cả
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                            {newArrivals.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetail={handleViewDetail}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Personalized "For You" Section (authenticated users only) */}
            {personalizedData?.forYou && personalizedData.forYou.length > 0 && (
                <section className="py-8 bg-emerald-50/50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                                    <h2 className="text-2xl font-bold">Dành Cho Bạn</h2>
                                </div>
                                <p className="text-gray-600 text-[14px]">
                                    Gợi ý dựa trên lịch sử mua hàng của bạn
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/products')}
                                className="hidden md:flex border-2 border-gray-200 py-1"
                            >
                                Xem tất cả
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                            {personalizedData.forYou.slice(0, 4).map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetail={handleViewDetail}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* How It Works Section */}
            <section className="py-10 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h2 className="mb-3 text-2xl font-bold">Đặt Hàng Định Kỳ Như Thế Nào?</h2>
                        <p className="text-base text-gray-600 max-w-2xl mx-auto">
                            Chỉ với 3 bước đơn giản, bạn sẽ không bao giờ phải lo hết hàng thiết yếu
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                1
                            </div>
                            <h3 className="mb-2 font-bold text-lg">Chọn Sản Phẩm</h3>
                            <p className="text-gray-600">
                                Duyệt qua danh sách sản phẩm thiết yếu và chọn những gì bạn cần
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                2
                            </div>
                            <h3 className="mb-2 font-bold text-lg">Đặt Lịch Giao Hàng</h3>
                            <p className="text-gray-600">
                                Chọn tần suất giao hàng phù hợp: hàng tuần, hàng tháng hoặc tùy chỉnh
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                3
                            </div>
                            <h3 className="mb-2 font-bold text-lg">Nhận Hàng Tự Động</h3>
                            <p className="text-gray-600">
                                Hàng sẽ tự động được giao đến tận nhà theo đúng lịch đã đặt
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-10 bg-emerald-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h2 className="mb-3 text-white text-2xl font-bold">Tại Sao Chọn Chúng Tôi?</h2>
                        <p className="text-base text-emerald-50 max-w-2xl mx-auto">
                            Tiết kiệm thời gian và chi phí với dịch vụ giao hàng tự động
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">💰</span>
                            </div>
                            <h3 className="mb-2 text-white font-bold text-lg">Tiết kiệm 10-15%</h3>
                            <p className="text-emerald-100">
                                Giá ưu đãi đặc biệt cho đơn hàng định kỳ. Càng mua nhiều càng tiết kiệm.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⏰</span>
                            </div>
                            <h3 className="mb-2 text-white font-bold text-lg">Không lo quên mua</h3>
                            <p className="text-emerald-100">
                                Hàng tự động đến tận nhà theo đúng lịch. Bạn chỉ việc sử dụng.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🎯</span>
                            </div>
                            <h3 className="mb-2 text-white font-bold text-lg">Linh hoạt điều chỉnh</h3>
                            <p className="text-emerald-100">
                                Tạm dừng, thay đổi hoặc hủy bất cứ lúc nào. Hoàn toàn miễn phí.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <ImageWithFallback
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&h=600&fit=crop"
                        alt="CTA background"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="relative container mx-auto px-4 text-center">
                    <h2 className="mb-3 text-white text-2xl lg:text-3xl font-bold">Sẵn Sàng Bắt Đầu?</h2>
                    <p className="text-base text-emerald-50 mb-6 max-w-2xl mx-auto">
                        Chọn sản phẩm yêu thích và kích hoạt đặt hàng định kỳ để nhận ưu đãi ngay hôm nay
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button
                            onClick={() => navigate('/products')}
                            className="bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40"
                        >
                            Mua Sắm Ngay
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 border-0"
                        >
                            Đăng Ký Ngay
                        </Button>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-12 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl text-emerald-600 mb-2 font-bold">1000+</div>
                            <p className="text-gray-600">Khách hàng tin dùng</p>
                        </div>
                        <div>
                            <div className="text-3xl text-emerald-600 mb-2 font-bold">5000+</div>
                            <p className="text-gray-600">Đơn hàng định kỳ</p>
                        </div>
                        <div>
                            <div className="text-3xl text-emerald-600 mb-2 font-bold">4.8⭐</div>
                            <p className="text-gray-600">Đánh giá trung bình</p>
                        </div>
                        <div>
                            <div className="text-3xl text-emerald-600 mb-2 font-bold">24h</div>
                            <p className="text-gray-600">Giao hàng nhanh</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
