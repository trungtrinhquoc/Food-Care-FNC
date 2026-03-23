import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronLeft, MapPin, Star, Clock, Package, Loader2, Search, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { martApi } from '../services/martApi';
import { productsApi } from '../services/productsApi';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import type { MartProduct } from '../types/mart';

function formatPriceVnd(value: number) {
    return `${value.toLocaleString('vi-VN')}đ`;
}

function parseImage(raw?: string) {
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

function formatOperatingHours(raw?: string) {
    if (!raw) return 'Không rõ giờ mở cửa';

    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) return raw;

    try {
        const obj = JSON.parse(trimmed) as Record<string, string>;
        const values = Object.values(obj).filter(Boolean);
        if (values.length === 0) return 'Không rõ giờ mở cửa';
        const first = values[0];
        const allSame = values.every((v) => v === first);
        if (allSame) return `Hằng ngày: ${first}`;
        return [
            obj.mon ? `T2 ${obj.mon}` : null,
            obj.tue ? `T3 ${obj.tue}` : null,
            obj.wed ? `T4 ${obj.wed}` : null,
            obj.thu ? `T5 ${obj.thu}` : null,
            obj.fri ? `T6 ${obj.fri}` : null,
            obj.sat ? `T7 ${obj.sat}` : null,
            obj.sun ? `CN ${obj.sun}` : null,
        ].filter(Boolean).join(' · ');
    } catch {
        return raw;
    }
}

function getStockBadge(stock: number) {
    if (stock > 10) return { text: 'Còn hàng', className: 'bg-emerald-100 text-emerald-700' };
    if (stock > 0) return { text: `Còn ${stock} cái`, className: 'bg-amber-100 text-amber-700' };
    return { text: 'Hết hàng', className: 'bg-red-100 text-red-700' };
}

export default function MartStorePage() {
    const { id } = useParams();
    const martId = Number(id);
    const navigate = useNavigate();
    const { items, clearCart, addToCart } = useCart();
    const { user, refreshUser } = useAuth();

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('popular');

    const { data: mart, isLoading: loadingMart } = useQuery({
        queryKey: ['mart-detail-page', martId],
        queryFn: () => martApi.getMartDetail(martId),
        enabled: Number.isFinite(martId) && martId > 0,
        retry: 1,
    });

    const { data: martProductsResp, isLoading: loadingProducts, refetch } = useQuery({
        queryKey: ['mart-products-page', martId, search, sortBy],
        queryFn: () =>
            martApi.getMartProducts(martId, {
                search: search || undefined,
                sortBy,
                page: 1,
                pageSize: 40,
            }),
        enabled: Number.isFinite(martId) && martId > 0,
        retry: 1,
    });

    const selectMartMutation = useMutation({
        mutationFn: async () => {
            if (!martId) throw new Error('Thiếu martId');
            await martApi.selectMart(martId);
            await refreshUser();
        },
        onSuccess: () => {
            toast.success('Đã chọn mart này làm mặc định');
            refetch();
        },
        onError: () => {
            toast.error('Không thể chọn mart. Vui lòng thử lại.');
        },
    });

    const categories = useMemo(() => {
        const list = martProductsResp?.products ?? [];
        return Array.from(new Set(list.map((p) => p.categoryName).filter(Boolean)));
    }, [martProductsResp?.products]);

    const [activeCategory, setActiveCategory] = useState<string>('all');

    const products = useMemo(() => {
        const list = martProductsResp?.products ?? [];
        if (activeCategory === 'all') return list;
        return list.filter((p) => p.categoryName === activeCategory);
    }, [activeCategory, martProductsResp?.products]);

    const handleAddToCart = async (product: MartProduct) => {
        try {
            const cartMartId = items[0]?.product?.supplierId;
            if (cartMartId && cartMartId !== martId) {
                const yes = window.confirm('Giỏ hàng hiện tại thuộc mart khác. Chuyển mart sẽ xoá giỏ. Bạn có muốn tiếp tục?');
                if (!yes) return;

                await martApi.selectMart(martId);
                clearCart();
                await refreshUser();
            }

            const fullProduct = await productsApi.getProduct(product.id);
            addToCart(fullProduct, 1, false);
            toast.success('Đã thêm vào giỏ hàng');
        } catch {
            toast.error('Không thể thêm sản phẩm vào giỏ.');
        }
    };

    if (!Number.isFinite(martId) || martId <= 0) {
        return <div className="p-6 text-center text-gray-500">Mart không hợp lệ.</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-gray-50">
            <div className="bg-white/95 backdrop-blur border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 max-w-6xl flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <p className="font-semibold text-gray-900">Cửa hàng mart</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-5 max-w-6xl space-y-4">
                {loadingMart ? (
                    <div className="bg-white rounded-xl border p-5 flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải thông tin mart...
                    </div>
                ) : mart ? (
                    <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                        <div className="h-36 md:h-44 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 relative">
                            {mart.storeBannerUrl && (
                                <img src={mart.storeBannerUrl} alt={mart.storeName} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/10 to-black/5" />
                        </div>
                        <div className="p-5 -mt-14 relative">
                            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden">
                                        {mart.storeLogoUrl ? (
                                            <img src={mart.storeLogoUrl} alt={mart.storeName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                                <Package className="w-8 h-8 text-emerald-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{mart.storeName}</h1>
                                        <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {mart.address || 'Đang cập nhật địa chỉ'}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                {(mart.rating ?? 0).toFixed(1)}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Package className="w-3.5 h-3.5" />
                                                {mart.productCount ?? 0} sản phẩm
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatOperatingHours(mart.operatingHours)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {user?.selectedMartId === martId ? (
                                        <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Mart đang chọn</span>
                                    ) : (
                                        <Button
                                            onClick={() => selectMartMutation.mutate()}
                                            disabled={selectMartMutation.isPending}
                                            className="rounded-xl"
                                        >
                                            {selectMartMutation.isPending ? 'Đang chọn...' : 'Chọn mart này'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border p-5 text-gray-500">Không tìm thấy mart.</div>
                )}

                <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Lọc nhanh sản phẩm theo danh mục, giá và mức phổ biến
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${activeCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Tất cả
                                </button>
                                {categories.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setActiveCategory(c!)}
                                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${activeCategory === c ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tìm trong mart..."
                                        className="h-9 pl-8 pr-3 rounded-lg border text-sm"
                                    />
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="h-9 px-2 rounded-lg border text-sm"
                                >
                                    <option value="popular">Phổ biến</option>
                                    <option value="rating">Đánh giá</option>
                                    <option value="price_asc">Giá tăng dần</option>
                                    <option value="price_desc">Giá giảm dần</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loadingProducts ? (
                        Array.from({ length: 6 }).map((_, idx) => (
                            <div key={`skeleton-${idx}`} className="bg-white rounded-xl border p-4">
                                <div className="aspect-square rounded-lg skeleton-shimmer mb-3" />
                                <div className="h-4 w-3/4 skeleton-shimmer rounded mb-2" />
                                <div className="h-5 w-1/3 skeleton-shimmer rounded mb-2" />
                                <div className="h-3 w-2/3 skeleton-shimmer rounded mb-3" />
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="h-10 skeleton-shimmer rounded-xl" />
                                    <div className="h-10 skeleton-shimmer rounded-xl" />
                                </div>
                            </div>
                        ))
                    ) : products.length === 0 ? (
                        <div className="col-span-full bg-white rounded-xl border p-6 text-gray-500">Mart này chưa có sản phẩm phù hợp.</div>
                    ) : (
                        products.map((product) => {
                            const stock = product.stockQuantity ?? 0;
                            const img = parseImage(product.images || product.imageUrl);
                            const stockBadge = getStockBadge(stock);

                            return (
                                <div key={product.id} className="bg-white rounded-xl border p-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                                    <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden mb-3 border">
                                        {img ? <img src={img} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" /> : <div className="w-full h-full bg-gray-100" />}
                                    </div>
                                    <p className="font-medium text-gray-900 line-clamp-2">{product.name}</p>
                                    {(product.manufacturer || product.origin) && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {[product.manufacturer, product.origin].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                    <p className="text-emerald-700 font-semibold mt-1">{formatPriceVnd(product.basePrice)}</p>
                                    {product.originalPrice && product.originalPrice > product.basePrice && (
                                        <p className="text-xs text-gray-400 line-through mt-0.5">{formatPriceVnd(product.originalPrice)}</p>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${stockBadge.className}`}>{stockBadge.text}</span>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{(product.ratingAverage ?? 0).toFixed(1)}★</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <Button variant="outline" onClick={() => navigate(`/products/${product.id}`)} className="rounded-xl">
                                            Chi tiết
                                        </Button>
                                        <Button onClick={() => handleAddToCart(product)} className="rounded-xl">
                                            Thêm giỏ
                                        </Button>
                                    </div>
                                    <button
                                        className="mt-2 text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
                                        onClick={() => navigate(`/search-all?q=${encodeURIComponent(product.name)}`)}
                                    >
                                        So sánh giá ở mart khác
                                        <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
