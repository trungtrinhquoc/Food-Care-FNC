import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { crossMartSearchApi } from '../services/crossMartSearchApi';
import { Search, MapPin, Star, Truck, Store, ChevronLeft, Bell } from 'lucide-react';
import { toast } from 'sonner';
import type { CrossMartProductResult } from '../types/mart';

export default function CrossMartSearchPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') ?? '';

    const [searchInput, setSearchInput] = useState(initialQuery);
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [sortBy, setSortBy] = useState('relevance');

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {} // silently ignore
        );
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(searchInput), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: results, isLoading } = useQuery({
        queryKey: ['cross-mart-search', searchTerm, userLocation?.lat, userLocation?.lng, sortBy],
        queryFn: () => crossMartSearchApi.search({
            query: searchTerm,
            latitude: userLocation?.lat,
            longitude: userLocation?.lng,
            sortBy,
            pageSize: 30,
        }),
        enabled: searchTerm.length >= 2,
    });

    const handleNotify = async (productId: string, martId: number) => {
        try {
            await crossMartSearchApi.notifyAvailability(productId, martId);
            toast.success('Sẽ thông báo khi có hàng');
        } catch {
            toast.error('Không thể đăng ký thông báo');
        }
    };

    // Group results by mart
    const groupedByMart = results?.reduce<Record<number, { martName: string; distanceKm: number; products: CrossMartProductResult[] }>>((acc, r) => {
        if (!acc[r.martId]) {
            acc[r.martId] = { martName: r.martName, distanceKm: r.distanceKm, products: [] };
        }
        acc[r.martId].products.push(r);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Search header */}
            <div className="bg-white border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Tìm sản phẩm trên tất cả mart..."
                                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Sort options */}
                    {results && results.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                            {[
                                { value: 'relevance', label: 'Liên quan' },
                                { value: 'price', label: 'Giá thấp' },
                                { value: 'distance', label: 'Gần nhất' },
                                { value: 'rating', label: 'Đánh giá' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSortBy(opt.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                        sortBy === opt.value
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-3xl">
                {/* Loading */}
                {isLoading && searchTerm.length >= 2 && (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Empty initial state */}
                {searchTerm.length < 2 && (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nhập ít nhất 2 ký tự để tìm kiếm</p>
                    </div>
                )}

                {/* No results */}
                {results && results.length === 0 && (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Không tìm thấy sản phẩm</p>
                        <p className="text-gray-400 text-sm mt-1">Thử từ khóa khác hoặc kiểm tra chính tả.</p>
                    </div>
                )}

                {/* Grouped results */}
                {groupedByMart && Object.entries(groupedByMart).map(([martIdStr, group]) => (
                    <div key={martIdStr} className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <Store className="w-5 h-5 text-emerald-600" />
                            <h2 className="font-semibold text-gray-900">{group.martName}</h2>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {group.distanceKm.toFixed(1)} km
                            </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {group.products.map((product) => (
                                <div
                                    key={`${product.martId}-${product.productId}`}
                                    className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/products/${product.productId}`)}
                                >
                                    <div className="flex gap-3">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} className="w-16 h-16 rounded-lg object-cover shrink-0" alt="" />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 line-clamp-2">{product.productName}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-bold text-emerald-600">{product.basePrice.toLocaleString('vi-VN')}đ</span>
                                                {product.originalPrice && product.originalPrice > product.basePrice && (
                                                    <span className="text-xs text-gray-400 line-through">{product.originalPrice.toLocaleString('vi-VN')}đ</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                    {product.ratingAverage.toFixed(1)}
                                                </span>
                                                <span className={`flex items-center gap-1 ${product.isFreeShipping ? 'text-emerald-600' : ''}`}>
                                                    <Truck className="w-3 h-3" />
                                                    {product.shippingDisplay}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {product.stockQuantity === 0 && (
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-red-500">Hết hàng</span>
                                            <button
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNotify(product.productId, product.martId);
                                                }}
                                            >
                                                <Bell className="w-3 h-3" />
                                                Thông báo khi có
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
