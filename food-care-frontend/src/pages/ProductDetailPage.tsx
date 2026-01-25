import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/productsApi';
import { useState } from 'react';
import {
  Star, Plus, Minus, ShoppingCart, ChevronLeft, Calendar, Repeat
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

export default function ProductDetailPage() {
  const isLoggedIn = !!localStorage.getItem("token");

  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null)
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [subscriptionType, setSubscriptionType] =
    useState<'one-time' | 'subscription'>('one-time');
  const [frequency, setFrequency] =
    useState<'Weekly' | 'BiWeekly' | 'Monthly'>('Monthly');
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  const { data: product, isLoading, error } = useQuery({

    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });
  console.log('PRODUCT FROM QUERY:', product)
  console.log('PRODUCT IMAGES:', product?.images)


  if (isLoading) {
    return <div className="py-20 text-center">Đang tải sản phẩm...</div>;
  }

  if (error || !product) {
    return <div className="py-20 text-center text-red-600">
      Không tìm thấy sản phẩm
    </div>;
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

    const discounts = {
      Weekly: 15,
      BiWeekly: 12,
      Monthly: 10,
    };

    const discount = discounts[freq];
    addToCart(product, qty, true, freq, discount);

    toast.success(`Đã đăng ký đặt hàng định kỳ ${product.name}`, {
      description: `Giao hàng ${frequencyText[freq]} - Giảm ${discount}%`,
    });
  };



  // ===== UI giữ gần như 100% =====
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4" size="sm">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Quay lại
        </Button>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Image */}
          <div>
            {/* MAIN SLIDER */}
            <Swiper
              modules={[Navigation, Pagination, Thumbs]}
              spaceBetween={10}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              thumbs={{ swiper: thumbsSwiper }}
            >
              {product.images?.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="aspect-square bg-white flex items-center justify-center">
                    <img
                      src={cloudinaryResize(img, 800)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* THUMBNAILS */}
            {product.images && product.images.length > 1 && (
              <Swiper
                modules={[Thumbs]}
                onSwiper={setThumbsSwiper}
                spaceBetween={10}
                slidesPerView={4}
                breakpoints={{
                  640: { slidesPerView: 5 },
                  768: { slidesPerView: 6 }
                }}
                watchSlidesProgress
                className="mt-4"
              >
                {product.images?.map((img, index) => (
                  <SwiperSlide key={index}>
                    <div className="aspect-square border rounded cursor-pointer">
                      <img
                        src={cloudinaryResize(img, 120)}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>


          {/* Info */}
          <div>
            <Badge className="mb-1.5 text-xs">{product.categoryName}</Badge>
            <h1 className="mb-2 text-xl font-bold leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.ratingAverage)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                    }`}
                />
              ))}
              <span className="text-sm text-gray-600">({product.ratingCount})</span>
            </div>

            {/* Price */}
            <div className="mb-3">
              <span className="text-xl font-bold text-emerald-600">
                {finalPrice.toLocaleString('vi-VN')}đ
              </span>
              <p className="text-xs text-gray-500 mt-0.5">Đơn vị: {product.unit}</p>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>

            {/* Simple Subscription Options - Matching Reference */}
            <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-900">Đặt Hàng Định Kỳ</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="one-time"
                    name="subscription-type"
                    value="one-time"
                    checked={subscriptionType === 'one-time'}
                    onChange={() => setSubscriptionType('one-time')}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <label htmlFor="one-time" className="text-sm text-gray-700 cursor-pointer">
                    Mua một lần
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="subscription"
                    name="subscription-type"
                    value="subscription"
                    checked={subscriptionType === 'subscription'}
                    onChange={() => setSubscriptionType('subscription')}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <label htmlFor="subscription" className="text-sm text-emerald-700 cursor-pointer font-medium">
                    Đặt hàng định kỳ (Tiết kiệm 10-15%)
                  </label>
                </div>
              </div>
            </div>

            {/* Compact Quantity & Buttons */}
            <div className="space-y-2.5">
              {/* Quantity Row */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Số lượng:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || product.stockQuantity === 0}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}
                    disabled={quantity >= product.stockQuantity || product.stockQuantity === 0}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  ({product.stockQuantity} sản phẩm có sẵn)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  size="lg"
                  className={`flex-1 h-12 shadow-md ${product.stockQuantity > 0 ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-gray-400"}`}
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity <= 0}
                >
                  <ShoppingCart className="mr-2 w-5 h-5" />
                  <span className="text-base font-bold">Thêm vào giỏ</span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    handleAddToCart();
                    navigate('/cart');
                  }}
                  disabled={product.stockQuantity <= 0}
                  className="px-8 h-12 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold"
                >
                  <span className="text-base">Mua ngay</span>
                </Button>
              </div>

              {/* Subscription Button */}
              <Button
                size="lg"
                variant="outline"
                className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 h-12 shadow-sm"
                onClick={() => setShowSubscriptionDialog(true)}
                disabled={product.stockQuantity <= 0}
              >
                <Repeat className="w-4 h-4 mr-2" />
                <span className="text-sm font-bold uppercase tracking-wide">Đặt Hàng Định Kỳ (Giảm 10-15%)</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Thông Tin Chi Tiết</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold mb-2">Mô tả sản phẩm</h3>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2">Thông số</h3>
              <dl className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Danh mục:</dt>
                  <dd>{product.categoryName}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Đơn vị:</dt>
                  <dd>{product.unit}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Tình trạng:</dt>
                  <dd className={product.stockQuantity > 0 ? "text-emerald-600" : "text-red-500"}>
                    {product.stockQuantity > 0 ? `Còn hàng (${product.stockQuantity})` : "Hết hàng"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        {/* REVIEW SECTION */}
        <ReviewSection
          productId={id!}
          isLoggedIn={isLoggedIn}
        />
        {/* {product.reviewList && (
          <ReviewSection
            reviews={product.reviewList}
            averageRating={product.ratingAverage}
            totalReviews={product.ratingCount}
          />
        )} */}
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
