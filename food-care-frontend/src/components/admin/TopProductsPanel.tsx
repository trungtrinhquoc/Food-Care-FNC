import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  imageUrl?: string;
}

interface TopProductsPanelProps {
  products: TopProduct[];
  isLoading?: boolean;
}

export function TopProductsPanel({ products, isLoading = false }: TopProductsPanelProps) {
  const navigate = useNavigate();

  const handleProductClick = (productId: string) => {
    navigate(`/admin?tab=products&productId=${productId}`);
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">Chưa có dữ liệu sản phẩm</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <div
          key={product.productId}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => handleProductClick(product.productId)}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
            {index + 1}
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
            <p className="text-xs text-gray-500">Đã bán: {product.totalSold} sản phẩm</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {product.revenue.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
