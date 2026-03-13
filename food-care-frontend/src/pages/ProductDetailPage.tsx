import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/productsApi';
import { useEffect, useState } from 'react';
import {
  Star, Plus, Minus, ShoppingCart, ChevronLeft, Repeat, Tag, Package, CheckCircle2
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs } from 'swiper/modules'

import 'swiper/swiper-bundle.css'

import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { cloudinaryResize } from '../utils/cloudinary'

import { SubscriptionDialog } from '../components/SubscriptionDialog';
import { ReviewSection } from '../components/ReviewSection';
import type { Product } from '../types';

export default function ProductDetailPage() {
  const isLoggedIn = !!localStorage.getItem("token");

  const { id } = useParams<{ id: string }>();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  // Reset Swiper when navigating to a new product
  useEffect(() => {
    setThumbsSwiper(null);
  }, [id]);

  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [subscriptionType, setSubscriptionType] =
    useState<'one-time' | 'subscription'>('one-time');
  const [frequency] =
    useState<'Weekly' | 'BiWeekly' | 'Monthly'>('Monthly');
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });

  // Fetch related products — same category, exclude current product
  const { data: relatedData } = useQuery({
    queryKey: ['related-products', product?.categoryId],
    queryFn: () =>
      productsApi.getProducts({ categoryId: Number(product!.categoryId), pageSize: 8 }),
    enabled: !!product?.categoryId,
    select: (data) => data.products.filter((p: Product) => p.id !== id).slice(0, 6),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500">Không tìm thấy sản phẩm</p>
          <Button variant="outline" onClick={() => navigate(-1)} size="sm">Quay lại</Button>
        </div>
      </div>
    );
  }

  // ===== Logic giữ nguyên =====
  const subscriptionDiscounts = {
    Weekly: 15,
    BiWeekly: 12,
    Monthly: 10,
  };

  const discount =
    subscriptionType === 'subscription'
      ? subscriptionDiscounts[frequency]
      : 0;

  const finalPrice = product.basePrice * (1 - discount / 100);

  const handleAddToCart = () => {
    if (product.stockQuantity <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    if (quantity > product.stockQuantity) {
      toast.error(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho`);
      setQuantity(product.stockQuantity);
      return;
    }
    const isSubscription = subscriptionType === 'subscription';
    const freq = isSubscription ? frequency : undefined;
    addToCart(product, quantity, isSubscription, freq);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  const handleSubscriptionConfirm = (
    freq: 'Weekly' | 'BiWeekly' | 'Monthly',
    qty: number
  ) => {
    const frequencyText = {
      Weekly: 'hàng tuần',
      BiWeekly: '2 tuần/lần',
      Monthly: 'hàng tháng',
    };
    const discounts = { Weekly: 15, BiWeekly: 12, Monthly: 10 };
    const discount = discounts[freq];
    addToCart(product, qty, true, freq, discount);
    toast.success(`Đã đăng ký đặt hàng định kỳ ${product.name}`, {
      description: `Giao hàng ${frequencyText[freq]} - Giảm ${discount}%`,
    });
  };

  const handleBuyNow = () => {
    if (product.stockQuantity <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    if (quantity > product.stockQuantity) {
      toast.error(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho`);
      setQuantity(product.stockQuantity);
      return;
    }
    const isSubscription = subscriptionType === 'subscription';
    const freq = isSubscription ? frequency : undefined;

    // Build the item payload to send directly to checkout bypassing cart
    const checkoutItem = {
      product,
      quantity,
      selected: true,
      isSubscription,
      subscription: isSubscription && freq ? {
        frequency: freq,
        discount: subscriptionDiscounts[freq] || 0
      } : undefined
    };
    
    // Navigate directly to checkout with state
    navigate('/checkout', { state: { items: [checkoutItem] } });
  };

  const inStock = product.stockQuantity > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 max-w-6xl">

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-3 h-8 text-sm px-2 text-gray-600 hover:text-gray-900"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Quay lại
        </Button>

        {/* ====== MAIN GRID ====== */}
        <div key={id} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-5">

          {/* ---- LEFT: Images ---- */}
          <div className="w-full">
            <div className="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm">
              <Swiper
                modules={[Navigation, Pagination, Thumbs]}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                thumbs={{ swiper: thumbsSwiper }}
                className="aspect-square"
              >
                {product.images?.map((img, index) => (
                  <SwiperSlide key={index}>
                    <div className="w-full h-full flex items-center justify-center bg-white p-4">
                      <img
                        src={cloudinaryResize(img, 700)}
                        className="w-full h-full object-contain"
                        alt={product.name}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <Swiper
                modules={[Thumbs]}
                onSwiper={setThumbsSwiper}
                spaceBetween={8}
                slidesPerView={4}
                breakpoints={{
                  480: { slidesPerView: 5 },
                  768: { slidesPerView: 6 },
                }}
                watchSlidesProgress
                className="mt-2"
              >
                {product.images?.map((img, index) => (
                  <SwiperSlide key={index}>
                    <div className="aspect-square border border-gray-200 rounded-lg cursor-pointer overflow-hidden bg-white hover:border-emerald-400 transition-colors">
                      <img
                        src={cloudinaryResize(img, 120)}
                        className="w-full h-full object-contain p-1"
                        alt=""
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* ---- RIGHT: Info ---- */}
          <div className="flex flex-col gap-3">

            {/* Category + Name */}
            <div>
              <Badge className="mb-1.5 text-xs" variant="secondary">
                <Tag className="w-3 h-3 mr-1" />
                {product.categoryName}
              </Badge>
              <h1 className="text-lg sm:text-xl font-bold leading-snug text-gray-900">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.floor(product.ratingAverage)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200 fill-gray-200'
                      }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {product.ratingAverage?.toFixed(1)} ({product.ratingCount} đánh giá)
              </span>
              <span className="text-gray-200">·</span>
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
                {inStock
                  ? <><CheckCircle2 className="w-3 h-3" /> Còn hàng</>
                  : 'Hết hàng'}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {finalPrice.toLocaleString('vi-VN')}đ
              </span>
              {subscriptionType === 'subscription' && (
                <span className="text-xs text-gray-400 line-through">
                  {product.basePrice.toLocaleString('vi-VN')}đ
                </span>
              )}
              <span className="text-xs text-gray-500 ml-auto">/{product.unit}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Subscription toggle */}
            <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Hình thức mua</p>
              <div className="grid grid-cols-2 gap-2">
                {/* One-time */}
                <label
                  htmlFor="one-time"
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${subscriptionType === 'one-time'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    id="one-time"
                    name="subscription-type"
                    value="one-time"
                    checked={subscriptionType === 'one-time'}
                    onChange={() => setSubscriptionType('one-time')}
                    className="sr-only"
                  />
                  <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">Mua một lần</span>
                </label>

                {/* Subscription */}
                <label
                  htmlFor="subscription"
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${subscriptionType === 'subscription'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    id="subscription"
                    name="subscription-type"
                    value="subscription"
                    checked={subscriptionType === 'subscription'}
                    onChange={() => setSubscriptionType('subscription')}
                    className="sr-only"
                  />
                  <Repeat className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">Định kỳ <span className="text-emerald-600 font-bold">-10%</span></span>
                </label>
              </div>
            </div>

            {/* Quantity + Buttons */}
            <div className="space-y-2.5">
              {/* Quantity row */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Số lượng:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !inStock}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-9 text-center text-sm font-semibold text-gray-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}
                    disabled={quantity >= product.stockQuantity || !inStock}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-gray-400">({product.stockQuantity} có sẵn)</span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className={`h-10 text-sm font-semibold ${inStock ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400'}`}
                  onClick={handleAddToCart}
                  disabled={!inStock}
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Thêm vào giỏ
                </Button>
                <Button
                  variant="outline"
                  className="h-10 text-sm font-semibold border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                >
                  Mua ngay
                </Button>
              </div>

              {/* Subscription CTA */}
              <Button
                variant="outline"
                className="w-full h-9 text-sm border-dashed border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setShowSubscriptionDialog(true)}
                disabled={!inStock}
              >
                <Repeat className="w-3.5 h-3.5 mr-1.5" />
                Đăng ký giao định kỳ · Tiết kiệm 10–15%
              </Button>
            </div>

          </div>
        </div>

        {/* ====== PRODUCT DETAILS ====== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Thông Tin Sản Phẩm</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1.5">Mô tả</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1.5">Thông số</h3>
              <dl className="space-y-1.5">
                {[
                  { label: 'Danh mục', value: product.categoryName },
                  { label: 'Đơn vị', value: product.unit },
                  {
                    label: 'Tình trạng',
                    value: inStock ? `Còn hàng (${product.stockQuantity})` : 'Hết hàng',
                    color: inStock ? 'text-emerald-600' : 'text-red-500',
                  },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
                    <dt className="text-gray-500">{item.label}</dt>
                    <dd className={`font-medium ${item.color || 'text-gray-800'}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* ====== REVIEWS ====== */}
        <ReviewSection productId={id!} isLoggedIn={isLoggedIn} />

        {/* ====== RELATED PRODUCTS ====== */}
        {relatedData && relatedData.length > 0 && (
          <div className="mt-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Sản Phẩm Liên Quan</h2>
              <button
                onClick={() => navigate(`/products?categoryId=${product.categoryId}`)}
                className="text-xs text-emerald-600 hover:underline font-medium"
              >
                Xem tất cả →
              </button>
            </div>

            {/* Horizontal scroll row */}
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              {relatedData.map((rp) => (
                <div
                  key={rp.id}
                  onClick={() => navigate(`/products/${rp.id}`)}
                  className="flex-shrink-0 w-36 sm:w-44 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 cursor-pointer transition-all group"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-50">
                    <img
                      src={rp.images?.[0] ? cloudinaryResize(rp.images[0], 300) : '/placeholder.png'}
                      alt={rp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                    {rp.stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-xl">
                        <span className="text-white text-xs font-semibold">Hết hàng</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug mb-1.5 min-h-[2.5rem]">
                      {rp.name}
                    </p>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] text-gray-600">{rp.ratingAverage?.toFixed(1) || '0.0'}</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      {rp.basePrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        product={product}
        onConfirm={handleSubscriptionConfirm}
        initialQuantity={quantity}
      />
    </div>
  );
}
