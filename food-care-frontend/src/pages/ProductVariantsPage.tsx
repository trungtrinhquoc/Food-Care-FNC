import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Star, Loader2 } from 'lucide-react';
import { productsApi } from '../services/productsApi';
import { crossMartSearchApi } from '../services/crossMartSearchApi';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { martApi } from '../services/martApi';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import type { ProductVariant } from '../types/mart';

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

export default function ProductVariantsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { addToCart, items, clearCart } = useCart();
    const { user, refreshUser } = useAuth();

    const martId = Number(searchParams.get('martId'));
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(id ?? null);
    const [switching, setSwitching] = useState(false);

    const { data: sourceProduct } = useQuery({
        queryKey: ['product-detail', id],
        queryFn: () => productsApi.getProduct(id!),
        enabled: !!id,
    });

    const { data: variants, isLoading } = useQuery({
        queryKey: ['product-variants', id, martId],
        queryFn: () => crossMartSearchApi.getVariants(id!, martId),
        enabled: !!id && Number.isFinite(martId) && martId > 0,
    });

    useEffect(() => {
        if (!isLoading && variants && variants.length <= 1 && id) {
            navigate(`/products/${id}`, { replace: true });
        }
    }, [id, isLoading, navigate, variants]);

    const selectedVariant = useMemo(() => {
        if (!variants || variants.length === 0) return null;
        return variants.find((v) => v.productId === selectedVariantId) ?? variants[0];
    }, [variants, selectedVariantId]);

    const handleAddOneTime = async () => {
        if (!selectedVariant) return;

        try {
            const fullProduct = await productsApi.getProduct(selectedVariant.productId);
            const cartMartId = items[0]?.product?.supplierId;
            const targetMartId = martId;

            if (cartMartId && targetMartId && cartMartId !== targetMartId) {
                const yes = window.confirm('Giỏ hàng hiện tại thuộc mart khác. Chuyển mart sẽ xoá giỏ. Bạn có muốn tiếp tục?');
                if (!yes) return;

                setSwitching(true);
                await martApi.selectMart(targetMartId);
                clearCart();
                await refreshUser();
                setSwitching(false);
            }

            addToCart(fullProduct, 1, false);
            toast.success('Đã thêm vào giỏ hàng');
            navigate(-1);
        } catch {
            setSwitching(false);
            toast.error('Không thể thêm vào giỏ. Vui lòng thử lại.');
        }
    };

    const handleSubscribe = async () => {
        if (!selectedVariant) return;

        const targetMartId = martId;
        const cartMartId = items[0]?.product?.supplierId;

        if (cartMartId && targetMartId && cartMartId !== targetMartId) {
            const yes = window.confirm('Giỏ hàng hiện tại thuộc mart khác. Chuyển mart sẽ xoá giỏ. Bạn có muốn tiếp tục?');
            if (!yes) return;

            try {
                setSwitching(true);
                await martApi.selectMart(targetMartId);
                clearCart();
                await refreshUser();
            } catch {
                setSwitching(false);
                toast.error('Không thể chuyển mart.');
                return;
            }
        }

        setSwitching(false);
        navigate(`/products/${selectedVariant.productId}?subscription=true`);
    };

    if (!id || !Number.isFinite(martId) || martId <= 0) {
        return <div className="p-6 text-center text-gray-500">Thiếu thông tin mart để so sánh sản phẩm.</div>;
    }

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!variants || variants.length <= 1) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-semibold text-gray-900">{sourceProduct?.name || selectedVariant?.name}</h1>
                        <p className="text-sm text-gray-500">{variants.length} phiên bản · Từ mart #{martId}</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {variants.map((variant: ProductVariant) => {
                        const isSelected = selectedVariant?.productId === variant.productId;
                        return (
                            <button
                                key={variant.productId}
                                onClick={() => setSelectedVariantId(variant.productId)}
                                className={`relative text-left bg-white rounded-xl p-4 border transition-all ${variant.isPopular
                                    ? 'border-emerald-500'
                                    : 'border-gray-200'
                                    } ${isSelected ? 'ring-2 ring-emerald-200' : ''}`}
                            >
                                {variant.isPopular && (
                                    <span className="absolute -top-2 left-3 text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                        Phổ biến nhất
                                    </span>
                                )}
                                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden mb-3">
                                    {parseImage(variant.images) && (
                                        <img src={parseImage(variant.images)} alt={variant.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <p className="font-medium text-gray-900 text-sm line-clamp-2">{variant.manufacturer || variant.name}</p>
                                <p className="text-sm text-gray-500 mt-1">{variant.origin || 'Không rõ xuất xứ'}</p>
                                <p className="text-emerald-700 font-semibold mt-2">{formatPriceVnd(variant.basePrice)}</p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    {(variant.ratingAverage ?? 0).toFixed(1)} ({variant.ratingCount ?? 0})
                                </p>
                            </button>
                        );
                    })}
                </div>

                {selectedVariant && (
                    <div className="mt-5 bg-white rounded-xl border p-4">
                        <p className="font-semibold text-gray-900">
                            {selectedVariant.manufacturer || selectedVariant.name}
                            {selectedVariant.origin ? ` — ${selectedVariant.origin}` : ''}
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                            <div><span className="text-gray-500">Xuất xứ:</span> <span className="text-gray-800">{selectedVariant.origin || 'N/A'}</span></div>
                            <div><span className="text-gray-500">Đã bán:</span> <span className="text-gray-800">{selectedVariant.soldCount}</span></div>
                            <div><span className="text-gray-500">Đánh giá:</span> <span className="text-gray-800">{(selectedVariant.ratingAverage ?? 0).toFixed(1)}★</span></div>
                            <div><span className="text-gray-500">Lượt review:</span> <span className="text-gray-800">{selectedVariant.ratingCount ?? 0}</span></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                            <Button onClick={handleSubscribe} disabled={switching}>
                                Đặt định kỳ · {formatPriceVnd(selectedVariant.basePrice)}/lần
                            </Button>
                            <Button variant="outline" onClick={handleAddOneTime} disabled={switching || user?.role?.toLowerCase() !== 'customer'}>
                                Thêm vào giỏ lần này
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
