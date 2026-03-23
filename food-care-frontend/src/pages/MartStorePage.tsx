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
    if (stock > 10) return { text: 'Sẵn hàng', className: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' };
    if (stock > 0) return { text: `Còn ${stock}`, className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' };
    return { text: 'Hết hàng', className: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' };
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
        <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(20,184,166,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_30%,#f8fafc_100%)]">
            <div className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 max-w-6xl flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-full inline-flex items-center justify-center border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <p className="font-semibold text-gray-900">Khám phá mart</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-5 max-w-6xl space-y-5">
                {loadingMart ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-2 text-gray-500 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải thông tin mart...
                    </div>
                ) : mart ? (
                    <div className="rounded-3xl overflow-hidden border border-emerald-100 shadow-[0_20px_60px_rgba(16,185,129,0.14)] bg-white">
                        <div className="relative h-44 md:h-52">
                            {mart.storeBannerUrl ? (
                                <img src={mart.storeBannerUrl} alt={mart.storeName} className="absolute inset-0 w-full h-full object-cover" />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-700/75 to-teal-700/70" />
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />

                            <div className="absolute left-5 right-5 bottom-4 md:bottom-5 text-white">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-medium mb-2">
                                    <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                    {(mart.rating ?? 0).toFixed(1)} điểm đánh giá
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{mart.storeName}</h1>
                                <p className="text-emerald-50/95 text-sm mt-1 line-clamp-1">{mart.address || 'Đang cập nhật địa chỉ'}</p>
                            </div>
                        </div>

                        <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
                            <div className="lg:col-span-8 flex gap-4">
                                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-white overflow-hidden -mt-12 md:-mt-14 shrink-0">
                                    {mart.storeLogoUrl ? (
                                        <img src={mart.storeLogoUrl} alt={mart.storeName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                            <Package className="w-8 h-8 text-emerald-600" />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                                        <p className="text-xs text-emerald-700/80">Sản phẩm trong mart</p>
                                        <p className="text-lg font-bold text-emerald-900">{mart.productCount ?? 0}</p>
                                    </div>
                                    <div className="rounded-2xl bg-cyan-50 border border-cyan-100 px-3 py-2.5">
                                        <p className="text-xs text-cyan-700/80">Giờ hoạt động</p>
                                        <p className="text-sm font-semibold text-cyan-900 line-clamp-1">{formatOperatingHours(mart.operatingHours)}</p>
                                    </div>
                                    <div className="sm:col-span-2 rounded-2xl bg-gray-50 border border-gray-200 px-3 py-2.5">
                                        <p className="text-xs text-gray-500 mb-1">Địa chỉ mart</p>
                                        <p className="text-sm text-gray-800 inline-flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                            {mart.address || 'Đang cập nhật địa chỉ'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 flex lg:justify-end">
                                <div className="w-full lg:w-auto rounded-2xl border border-gray-200 p-3 bg-white shadow-sm">
                                    <p className="text-xs text-gray-500 mb-2">Trạng thái tài khoản</p>
                                    {user?.selectedMartId === martId ? (
                                        <span className="inline-flex w-full justify-center text-sm px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-semibold">
                                            Mart đang được chọn
                                        </span>
                                    ) : (
                                        <Button
                                            onClick={() => selectMartMutation.mutate()}
                                            disabled={selectMartMutation.isPending}
                                            className="w-full rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {selectMartMutation.isPending ? 'Đang cập nhật...' : 'Chọn làm mart mặc định'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border p-5 text-gray-500">Không tìm thấy mart.</div>
                )}

                <div className="bg-white/95 rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Bộ lọc sản phẩm</p>
                                <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Lọc theo danh mục, tìm kiếm nhanh và sắp xếp theo mục tiêu mua hàng.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tìm trong mart..."
                                        className="h-10 w-full pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                                    />
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                >
                                    <option value="popular">Phổ biến</option>
                                    <option value="rating">Đánh giá cao</option>
                                    <option value="price_asc">Giá tăng dần</option>
                                    <option value="price_desc">Giá giảm dần</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-3.5 py-1.5 rounded-full text-sm transition-colors ${activeCategory === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Tất cả danh mục
                            </button>
                            {categories.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setActiveCategory(c!)}
                                    className={`px-3.5 py-1.5 rounded-full text-sm transition-colors ${activeCategory === c ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-gray-600">
                        Hiển thị <span className="font-semibold text-gray-900">{products.length}</span> sản phẩm
                        {activeCategory !== 'all' ? (
                            <span> trong danh mục <span className="font-semibold text-emerald-700">{activeCategory}</span></span>
                        ) : null}
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
                    {loadingProducts ? (
                        Array.from({ length: 6 }).map((_, idx) => (
                            <div key={`skeleton-${idx}`} className="bg-white rounded-2xl border border-gray-200 p-2.5 sm:p-3.5">
                                <div className="aspect-[4/3] rounded-lg skeleton-shimmer mb-2" />
                                <div className="h-4 w-3/4 skeleton-shimmer rounded mb-2" />
                                <div className="h-5 w-1/3 skeleton-shimmer rounded mb-2" />
                                <div className="h-3 w-2/3 skeleton-shimmer rounded mb-3" />
                                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                    <div className="h-8 sm:h-9 skeleton-shimmer rounded-xl" />
                                    <div className="h-8 sm:h-9 skeleton-shimmer rounded-xl" />
                                </div>
                            </div>
                        ))
                    ) : products.length === 0 ? (
                        <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">Mart này chưa có sản phẩm phù hợp.</div>
                    ) : (
                        products.map((product) => {
                            const stock = product.stockQuantity ?? 0;
                            const img = parseImage(product.images || product.imageUrl);
                            const stockBadge = getStockBadge(stock);
                            const hasDiscount = (product.originalPrice ?? 0) > product.basePrice;
                            const discountPercent = hasDiscount
                                ? Math.round((((product.originalPrice ?? 0) - product.basePrice) / (product.originalPrice ?? 1)) * 100)
                                : 0;

                            return (
                                <div key={product.id} className="group bg-white rounded-2xl border border-gray-200 p-2.5 sm:p-3 md:p-3.5 hover:shadow-lg hover:shadow-emerald-100/60 hover:-translate-y-0.5 transition-all duration-300">
                                    <div className="relative aspect-[4/3] rounded-xl bg-gray-100 overflow-hidden mb-2 border border-gray-200">
                                        {img ? <img src={img} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="w-full h-full bg-gray-100" />}
                                        <div className="absolute top-2 left-2 flex gap-1.5">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium backdrop-blur ${stockBadge.className}`}>{stockBadge.text}</span>
                                        </div>
                                        {hasDiscount ? (
                                            <span className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-rose-500 text-white shadow-sm">
                                                -{discountPercent}%
                                            </span>
                                        ) : null}
                                        <button
                                            className="absolute right-2 bottom-2 text-[11px] px-2 py-1 rounded-lg bg-white/95 hover:bg-white text-blue-700 border border-blue-100 shadow-sm inline-flex items-center gap-1"
                                            onClick={() => navigate(`/search-all?q=${encodeURIComponent(product.name)}`)}
                                        >
                                            So sánh giá
                                            <ArrowUpRight className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <p className="font-semibold text-[15px] sm:text-[17px] text-gray-900 line-clamp-2 min-h-[2.4rem] sm:min-h-[2.6rem]">{product.name}</p>
                                    {(product.manufacturer || product.origin) && (
                                        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-1 min-h-[0.95rem]">
                                            {[product.manufacturer, product.origin].filter(Boolean).join(' · ')}
                                        </p>
                                    )}

                                    <div className="mt-1 sm:mt-1.5 flex items-end gap-1.5 sm:gap-2">
                                        <p className="text-emerald-700 font-bold text-base sm:text-lg leading-none">{formatPriceVnd(product.basePrice)}</p>
                                        {hasDiscount ? (
                                            <p className="text-[11px] sm:text-xs text-gray-400 line-through mb-0.5">{formatPriceVnd(product.originalPrice ?? 0)}</p>
                                        ) : null}
                                    </div>

                                    <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
                                        <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                                            {(product.ratingAverage ?? 0).toFixed(1)}★ đánh giá
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-2.5">
                                        <Button variant="outline" onClick={() => navigate(`/products/${product.id}`)} className="rounded-xl border-gray-300 hover:bg-gray-50 h-8 sm:h-9 text-[12px] sm:text-sm font-semibold px-1.5 sm:px-3 whitespace-nowrap">
                                            <span className="sm:hidden">Chi tiết</span>
                                            <span className="hidden sm:inline">Xem chi tiết</span>
                                        </Button>
                                        <Button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={stock <= 0}
                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-500 h-8 sm:h-9 text-[12px] sm:text-sm font-semibold px-1.5 sm:px-3 whitespace-nowrap"
                                        >
                                            <span className="sm:hidden">Thêm</span>
                                            <span className="hidden sm:inline">Thêm giỏ</span>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
