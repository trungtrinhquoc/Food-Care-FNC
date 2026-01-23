import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, ShoppingBag, Repeat, Gift, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SubscriptionRecommendationCard } from '../components/SubscriptionRecommendationCard';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { recommendationsApi, type SubscriptionRecommendation } from '../services/recommendationsApi';

export default function RecommendationsPage() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Public recommendations
    const [highRated, setHighRated] = useState<Product[]>([]);
    const [trending, setTrending] = useState<Product[]>([]);

    // Phase 2.1 - Public recommendations
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [lowStockUrgent, setLowStockUrgent] = useState<Product[]>([]);
    const [biggestDiscounts, setBiggestDiscounts] = useState<Product[]>([]);
    const [healthy, setHealthy] = useState<Product[]>([]);

    // Authenticated recommendations
    const [repurchase, setRepurchase] = useState<Product[]>([]);
    const [subscriptionWorthy, setSubscriptionWorthy] = useState<SubscriptionRecommendation[]>([]);
    const [tierExclusive, setTierExclusive] = useState<Product[]>([]);
    const [userTierName, setUserTierName] = useState<string>('');

    // Phase 2.1 - Authenticated recommendations
    const [youMayLike, setYouMayLike] = useState<Product[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
        fetchRecommendations(!!token);
    }, []);

    const fetchRecommendations = async (authenticated: boolean) => {
        setIsLoading(true);

        // Fetch public recommendations independently
        try {
            const highRatedData = await recommendationsApi.getHighRated(8);
            setHighRated(highRatedData);
        } catch (error) {
            console.error('Failed to fetch high-rated products:', error);
        }

        try {
            const trendingData = await recommendationsApi.getTrending(8);
            setTrending(trendingData);
        } catch (error) {
            console.error('Failed to fetch trending products:', error);
        }

        // Phase 2.1 - Fetch new public recommendations
        try {
            const newArrivalsData = await recommendationsApi.getNewArrivals(8);
            setNewArrivals(newArrivalsData);
        } catch (error) {
            console.error('Failed to fetch new arrivals:', error);
        }

        try {
            const lowStockData = await recommendationsApi.getLowStockUrgent(8);
            setLowStockUrgent(lowStockData);
        } catch (error) {
            console.error('Failed to fetch low stock products:', error);
        }

        try {
            const discountsData = await recommendationsApi.getBiggestDiscounts(8);
            setBiggestDiscounts(discountsData);
        } catch (error) {
            console.error('Failed to fetch biggest discounts:', error);
        }

        try {
            const healthyData = await recommendationsApi.getHealthy(8);
            setHealthy(healthyData);
        } catch (error) {
            console.error('Failed to fetch healthy products:', error);
        }

        // Fetch personalized recommendations if authenticated
        if (authenticated) {
            try {
                const personalizedData = await recommendationsApi.getPersonalized();
                setRepurchase(personalizedData.repurchase);
                setSubscriptionWorthy(personalizedData.subscriptionWorthy);
                setTierExclusive(personalizedData.tierExclusive);
                setUserTierName(personalizedData.userTierName);
            } catch (error) {
                console.error('Failed to fetch personalized recommendations:', error);
            }

            // Phase 2.1 - Fetch collaborative filtering
            try {
                const youMayLikeData = await recommendationsApi.getYouMayLike(8);
                setYouMayLike(youMayLikeData);
            } catch (error) {
                console.error('Failed to fetch you may like:', error);
            }
        }

        setIsLoading(false);
    };

    const { addToCart } = useCart();

    const handleAddToCart = (product: Product) => {
        addToCart(product, 1);
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    };

    const handleViewDetail = (product: Product) => {
        navigate(`/products/${product.id}`);
    };

    const handleSubscribe = (recommendation: SubscriptionRecommendation) => {
        // TODO: Implement subscription dialog when component is ready
        console.log('Subscribe to:', recommendation.product.name);
        alert(`Tính năng đặt định kỳ cho ${recommendation.product.name} sẽ sớm được cập nhật!`);
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse space-y-8">
                        <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-4 border border-white/30">
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        Gợi ý được cá nhân hóa dành riêng cho bạn
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Gợi Ý Sản Phẩm</h1>
                    <p className="text-xl text-emerald-50 max-w-2xl mx-auto">
                        Khám phá những sản phẩm phù hợp nhất với nhu cầu của bạn
                    </p>
                </div>
            </section>

            {/* High-Rated Products Section */}
            {highRated.length > 0 && (
                <section className="py-12 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 mb-6">
                            <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
                            <h2 className="text-3xl font-bold">Được Đánh Giá Cao Nhất</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Những sản phẩm được khách hàng yêu thích và đánh giá 4.5 sao trở lên
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {highRated.map(product => (
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

            {/* Trending Products Section */}
            {trending.length > 0 && (
                <section className="py-12 bg-gradient-to-br from-orange-50 to-amber-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="w-7 h-7 text-orange-600" />
                            <h2 className="text-3xl font-bold">Đang Hot Tuần Này</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Sản phẩm bán chạy nhất trong 7 ngày qua
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {trending.map(product => (
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

            {/* Phase 2.1 - New Arrivals Section */}
            {newArrivals.length > 0 && (
                <section className="py-12 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-7 h-7 text-purple-600" />
                            <h2 className="text-3xl font-bold">Mới Ra Mắt</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Sản phẩm mới được thêm vào trong 30 ngày qua
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Phase 2.1 - Low Stock Urgent Section */}
            {lowStockUrgent.length > 0 && (
                <section className="py-12 bg-gradient-to-br from-red-50 to-orange-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="w-7 h-7 text-red-600" />
                            <h2 className="text-3xl font-bold">⚠️ Sắp Hết Hàng - Mua Ngay!</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Chỉ còn số lượng có hạn - Đặt hàng ngay kẻo lỡ!
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {lowStockUrgent.map(product => (
                                <div key={product.id} className="relative">
                                    <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        Sắp hết!
                                    </div>
                                    <ProductCard
                                        product={product}
                                        onViewDetail={handleViewDetail}
                                        onAddToCart={handleAddToCart}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Phase 2.1 - Biggest Discounts Section */}
            {biggestDiscounts.length > 0 && (
                <section className="py-12 bg-gradient-to-br from-yellow-50 to-amber-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 mb-6">
                            <Gift className="w-7 h-7 text-amber-600" />
                            <h2 className="text-3xl font-bold">💸 Giảm Giá Mạnh Nhất</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Tiết kiệm tối đa với những ưu đãi khủng
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {biggestDiscounts.map(product => (
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

            {/* Phase 2.1 - Healthy Products Section */}
            {healthy.length > 0 && (
                <section className="py-12 bg-gradient-to-br from-green-50 to-teal-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-7 h-7 text-green-600" />
                            <h2 className="text-3xl font-bold">🥗 Sản Phẩm Tốt Cho Sức Khỏe</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Organic, healthy, low-sugar, high-protein
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {healthy.map(product => (
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

            {/* Authenticated User Sections */}
            {isAuthenticated ? (
                <>
                    {/* Repurchase Section */}
                    {repurchase.length > 0 && (
                        <section className="py-12 bg-white">
                            <div className="container mx-auto px-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <Repeat className="w-7 h-7 text-blue-600" />
                                    <h2 className="text-3xl font-bold">Mua Lại Sản Phẩm Đã Thích</h2>
                                </div>
                                <p className="text-gray-600 mb-6">
                                    Những sản phẩm bạn đã từng mua và có thể muốn mua lại
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {repurchase.map(product => (
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

                    {/* Phase 2.1 - You May Like Section (Collaborative Filtering) */}
                    {youMayLike.length > 0 && (
                        <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
                            <div className="container mx-auto px-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="w-7 h-7 text-blue-600" />
                                    <h2 className="text-3xl font-bold">Bạn Có Thể Thích</h2>
                                </div>
                                <p className="text-gray-600 mb-6">
                                    Dựa trên sở thích của những người mua sản phẩm tương tự
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {youMayLike.map(product => (
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

                    {/* Subscription Recommendations Section */}
                    {subscriptionWorthy.length > 0 && (
                        <section className="py-12 bg-gradient-to-br from-emerald-50 to-teal-50">
                            <div className="container mx-auto px-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <ShoppingBag className="w-7 h-7 text-emerald-600" />
                                    <h2 className="text-3xl font-bold">Tiết Kiệm Với Đặt Hàng Định Kỳ</h2>
                                </div>
                                <p className="text-gray-600 mb-6">
                                    Bạn mua những sản phẩm này thường xuyên. Đặt định kỳ để tiết kiệm chi phí!
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {subscriptionWorthy.map((recommendation, index) => (
                                        <SubscriptionRecommendationCard
                                            key={index}
                                            recommendation={recommendation}
                                            onSubscribe={handleSubscribe}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Tier Exclusive Section */}
                    {tierExclusive.length > 0 && (
                        <section className="py-12 bg-gradient-to-br from-purple-50 to-pink-50">
                            <div className="container mx-auto px-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <Gift className="w-7 h-7 text-purple-600" />
                                    <h2 className="text-3xl font-bold">Ưu Đãi Riêng Cho Hạng {userTierName}</h2>
                                </div>
                                <p className="text-gray-600 mb-6">
                                    Những ưu đãi đặc biệt dành riêng cho thành viên hạng {userTierName}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {tierExclusive.map(product => (
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
                </>
            ) : (
                /* Login CTA for Unauthenticated Users */
                <section className="py-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    <div className="container mx-auto px-4 text-center">
                        <LogIn className="w-16 h-16 mx-auto mb-4 opacity-90" />
                        <h2 className="text-3xl font-bold mb-4">Đăng Nhập Để Nhận Gợi Ý Cá Nhân Hóa</h2>
                        <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
                            Đăng nhập để xem các sản phẩm bạn đã mua, gợi ý đặt hàng định kỳ và ưu đãi riêng cho hạng thành viên của bạn
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={() => navigate('/login')}
                                className="bg-white text-emerald-600 hover:bg-gray-100"
                            >
                                Đăng Nhập Ngay
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate('/login')}
                                className="border-2 border-white text-white hover:bg-white/10"
                            >
                                Đăng Ký Tài Khoản
                            </Button>
                        </div>
                    </div>
                </section>
            )}


        </div>
    );
}
