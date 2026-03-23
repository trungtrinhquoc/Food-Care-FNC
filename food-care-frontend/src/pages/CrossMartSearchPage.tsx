import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { crossMartSearchApi } from '../services/crossMartSearchApi';
import { profileApi } from '../services/api';
import { martApi } from '../services/martApi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Search, MapPin, Star, Truck, Store, ChevronLeft, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CrossMartProductResult } from '../types/mart';
import { Button } from '../components/ui/button';

function formatPriceVnd(value: number) {
    return `${value.toLocaleString('vi-VN')}đ`;
}

function formatDistance(distanceKm: number) {
    if (distanceKm < 0) return 'Chưa rõ khoảng cách';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
    return `${distanceKm.toFixed(1)}km`;
}

function getImageUrl(raw?: string) {
    if (!raw) return undefined;
    if (!raw.startsWith('[')) return raw;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0] as string;
    } catch {
        return undefined;
    }
    return undefined;
}

export default function CrossMartSearchPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, refreshUser } = useAuth();
    const { items: cartItems, clearCart } = useCart();
    const initialQuery = searchParams.get('q') ?? '';

    const [searchInput, setSearchInput] = useState(initialQuery);
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [sortBy, setSortBy] = useState('nearest');
    const [openingProductId, setOpeningProductId] = useState<string | null>(null);
    const [switchTarget, setSwitchTarget] = useState<{ martId: number; martName: string } | null>(null);
    const [switchingMart, setSwitchingMart] = useState(false);

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            async () => {
                try {
                    const addresses = await profileApi.getAddresses();
                    const defaultAddress = addresses.find((a) => a.isDefault);
                    if (defaultAddress?.latitude && defaultAddress?.longitude) {
                        setUserLocation({ lat: defaultAddress.latitude, lng: defaultAddress.longitude });
                    }
                } catch {
                    // silently ignore
                }
            }
        );
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: results, isLoading } = useQuery({
        queryKey: ['cross-mart-search', searchTerm, userLocation?.lat, userLocation?.lng, sortBy],
        queryFn: () => crossMartSearchApi.search({
            query: searchTerm,
            latitude: userLocation?.lat,
            longitude: userLocation?.lng,
            radiusKm: 0,
            sortBy,
            pageSize: 100,
        }),
        enabled: searchTerm.length >= 2,
    });

    const selectedMartId = user?.selectedMartId ?? null;

    const nearestDistance = useMemo(() => {
        if (!results || results.length === 0) return null;
        const knownDistances = results.map((r) => r.distanceKm).filter((d) => d >= 0);
        if (knownDistances.length === 0) return null;
        return Math.min(...knownDistances);
    }, [results]);

    const selectedMartHasResult = useMemo(() => {
        if (!results || !selectedMartId) return true;
        return results.some((r) => r.martId === selectedMartId);
    }, [results, selectedMartId]);

    const alternativeRows = useMemo(() => {
        if (!results || !selectedMartId || selectedMartHasResult) return [];

        const seenMart = new Set<number>();
        return results
            .filter((r) => r.martId !== selectedMartId)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .filter((r) => {
                if (seenMart.has(r.martId)) return false;
                seenMart.add(r.martId);
                return true;
            })
            .slice(0, 3);
    }, [results, selectedMartId, selectedMartHasResult]);

    const handleNotify = async (productId: string, martId: number) => {
        try {
            await crossMartSearchApi.notifyAvailability(productId, martId);
            toast.success('Sẽ thông báo khi có hàng');
        } catch {
            toast.error('Không thể đăng ký thông báo');
        }
    };

    const handleOpenProduct = async (product: CrossMartProductResult) => {
        if (openingProductId) return;
        setOpeningProductId(product.productId);

        try {
            const variants = await crossMartSearchApi.getVariants(product.productId, product.martId);
            if (variants.length >= 2) {
                navigate(`/products/${product.productId}/variants?martId=${product.martId}`);
                return;
            }

            navigate(`/products/${product.productId}`);
        } catch {
            navigate(`/products/${product.productId}`);
        } finally {
            setOpeningProductId(null);
        }
    };

    const requestSwitchMart = (martId: number, martName: string) => {
        setSwitchTarget({ martId, martName });
    };

    const confirmSwitchMart = async (clearExistingCart: boolean) => {
        if (!switchTarget || switchingMart) return;
        setSwitchingMart(true);

        try {
            await martApi.selectMart(switchTarget.martId);
            if (clearExistingCart) {
                clearCart();
            }
            await refreshUser();
            toast.success(`Đã chuyển sang mart ${switchTarget.martName}`);
            setSwitchTarget(null);
        } catch {
            toast.error('Không thể chuyển mart. Vui lòng thử lại.');
        } finally {
            setSwitchingMart(false);
        }
    };

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
                                { value: 'nearest', label: 'Gần nhất' },
                                { value: 'price_asc', label: 'Giá thấp' },
                                { value: 'popular', label: 'Phổ biến' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSortBy(opt.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${sortBy === opt.value
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
                        <p className="text-gray-500">Nhập tên sản phẩm để tìm toàn bộ lựa chọn gần bạn</p>
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

                {results && results.length > 0 && selectedMartId && !selectedMartHasResult && alternativeRows.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
                        <p className="font-medium text-amber-900">Mart hiện tại chưa có sản phẩm này</p>
                        <p className="text-sm text-amber-700 mt-1">Nhưng mart khác gần bạn có:</p>
                        <div className="mt-3 space-y-2">
                            {alternativeRows.map((alt) => (
                                <div key={`alt-${alt.martId}`} className="bg-white rounded-lg border p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <button
                                            onClick={() => navigate(`/marts/${alt.martId}`)}
                                            className="text-sm font-medium text-gray-900 hover:text-emerald-700"
                                        >
                                            {alt.martName} · {formatDistance(alt.distanceKm)}
                                        </button>
                                        <p className="text-xs text-gray-500">{formatPriceVnd(alt.basePrice)} · {alt.stockStatus || 'Còn hàng'}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => requestSwitchMart(alt.martId, alt.martName)}
                                    >
                                        Chuyển mart
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <button
                            className="mt-3 text-sm text-blue-700 hover:underline inline-flex items-center gap-1"
                            onClick={() => handleNotify(results[0].productId, selectedMartId)}
                        >
                            <Bell className="w-4 h-4" />
                            Bật thông báo khi mart hiện tại nhập thêm
                        </button>
                    </div>
                )}

                {results && results.length > 0 && (
                    <div className="mb-3 text-sm text-gray-500">
                        {results.length} kết quả · {new Set(results.map((r) => r.martId)).size} mart
                    </div>
                )}

                {results && results.length > 0 && (
                    <div className="space-y-3">
                        {results.map((product) => {
                            const imageUrl = getImageUrl(product.images);
                            const stockQty = product.stockQuantity ?? 0;
                            const nearestBadge = product.distanceKm >= 0
                                && nearestDistance != null
                                && Math.abs(product.distanceKm - nearestDistance) < 0.01;

                            return (
                                <div
                                    key={`${product.martId}-${product.productId}`}
                                    className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow cursor-pointer"
                                    onClick={() => handleOpenProduct(product)}
                                >
                                    <div className="flex gap-3">
                                        {imageUrl ? (
                                            <img src={imageUrl} className="w-16 h-16 rounded-lg object-cover shrink-0" alt={product.name} />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 line-clamp-2">
                                                {product.name}{product.manufacturer ? ` · ${product.manufacturer}` : ''}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-bold text-emerald-600">{formatPriceVnd(product.basePrice)}</span>
                                                {product.originalPrice && product.originalPrice > product.basePrice && (
                                                    <span className="text-xs text-gray-400 line-through">{formatPriceVnd(product.originalPrice)}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/marts/${product.martId}`);
                                                    }}
                                                    className="hover:text-emerald-700"
                                                >
                                                    {product.martName}
                                                </button>
                                                {' · '}
                                                {formatDistance(product.distanceKm)}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                    {(product.ratingAverage ?? 0).toFixed(1)}
                                                </span>
                                                <span className={`${product.isFreeShipping ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                                    <Truck className="w-3 h-3 inline mr-1" />
                                                    {product.shippingDisplay}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {nearestBadge && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-700 text-white">Gần nhất</span>
                                                )}
                                                {stockQty > 10 && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Còn hàng</span>
                                                )}
                                                {stockQty > 0 && stockQty <= 10 && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Còn {stockQty} cái</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {openingProductId === product.productId && (
                                        <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Đang kiểm tra phiên bản sản phẩm...
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {switchTarget && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl p-4 sm:p-5">
                        <h3 className="font-semibold text-gray-900">Giỏ hàng hiện tại sẽ bị ảnh hưởng</h3>
                        {cartItems.length > 0 ? (
                            <>
                                <p className="text-sm text-gray-600 mt-1">
                                    Chuyển sang {switchTarget.martName} sẽ xóa giỏ hàng hiện tại.
                                </p>
                                <div className="mt-3 max-h-40 overflow-auto rounded-lg border p-2 space-y-1.5">
                                    {cartItems.map((item) => (
                                        <div key={item.product.id} className="text-sm flex items-center justify-between gap-2">
                                            <span className="text-gray-700 truncate">{item.product.name}</span>
                                            <span className="text-gray-500 shrink-0">{formatPriceVnd(item.product.basePrice)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-2">
                                    <Button
                                        variant="destructive"
                                        disabled={switchingMart}
                                        onClick={() => confirmSwitchMart(true)}
                                    >
                                        {switchingMart ? 'Đang chuyển mart...' : 'Chuyển mart · Xóa giỏ'}
                                    </Button>
                                    <Button variant="outline" onClick={() => setSwitchTarget(null)} disabled={switchingMart}>
                                        Giữ mart hiện tại
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 mt-1">Xác nhận chuyển sang {switchTarget.martName}?</p>
                                <div className="mt-4 flex gap-2">
                                    <Button className="flex-1" disabled={switchingMart} onClick={() => confirmSwitchMart(false)}>
                                        {switchingMart ? 'Đang chuyển...' : 'Xác nhận'}
                                    </Button>
                                    <Button className="flex-1" variant="outline" onClick={() => setSwitchTarget(null)} disabled={switchingMart}>
                                        Hủy
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
