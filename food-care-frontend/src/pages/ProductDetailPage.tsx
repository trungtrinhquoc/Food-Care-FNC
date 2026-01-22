import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/productsApi';
import { useState } from 'react';
import {
  Star, Plus, Minus, ShoppingCart, ChevronLeft
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs } from 'swiper/modules'

import 'swiper/swiper-bundle.css'

import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { cloudinaryResize } from '../utils/cloudinary'

// import { SubscriptionDialog } from '../components/SubscriptionDialog';
import { ReviewSection } from '../components/ReviewSection';

export default function ProductDetailPage() {
  const isLoggedIn = !!localStorage.getItem("token");

  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null)
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [subscriptionType, _setSubscriptionType] =
    useState<'one-time' | 'subscription'>('one-time');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [frequency, _setFrequency] =
    useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showSubscriptionDialog, _setShowSubscriptionDialog] = useState(false);

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
    weekly: 15,
    biweekly: 12,
    monthly: 10,
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
    addToCart(product, quantity);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };



  // ===== UI giữ gần như 100% =====
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
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
                slidesPerView={6}
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
            <Badge className="mb-2">{product.categoryName}</Badge>
            <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(product.ratingAverage)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                    }`}
                />
              ))}
              <span>({product.ratingCount})</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl text-emerald-600">
                {finalPrice.toLocaleString('vi-VN')}đ
              </span>
              <p className="text-gray-500 mt-2">Đơn vị: {product.unit}</p>
            </div>

            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1 || product.stockQuantity === 0}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}
                disabled={quantity >= product.stockQuantity || product.stockQuantity === 0}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className={`w-full ${product.stockQuantity > 0 ? "bg-emerald-600" : "bg-gray-400"}`}
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
            >
              <ShoppingCart className="mr-2" />
              {product.stockQuantity > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}
            </Button>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="mb-6">Thông Tin Chi Tiết</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-3">Mô tả sản phẩm</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
            <div>
              <h3 className="mb-3">Thông số</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Danh mục:</dt>
                  <dd>{product.categoryName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Đơn vị:</dt>
                  <dd>{product.unit}</dd>
                </div>
                <div className="flex justify-between">
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

      {/* <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        product={product}
        onConfirm={() => {}}
        initialQuantity={quantity}
      /> */}
    </div>
  );
}
