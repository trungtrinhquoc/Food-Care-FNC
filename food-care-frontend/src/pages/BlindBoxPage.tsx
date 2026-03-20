import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Tag,
  Star,
  Store,
  Calendar,
  Loader2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Gift,
  Sparkles,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BlindBoxItem {
  id: string;
  supplierId: number;
  storeName: string;
  title: string;
  description: string;
  originalValue: number;
  blindBoxPrice: number;
  quantity: number;
  quantitySold: number;
  quantityAvailable: number;
  expiryDate: string;
  contents?: string;
  imageUrl?: string;
  status: string;
  daysUntilExpiry: number;
  createdAt: string;
}

interface BlindBoxListResult {
  items: BlindBoxItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function DaysUntilBadge({ days }: { days: number }) {
  if (days <= 3) return (
    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />Còn {days} ngày
    </span>
  );
  if (days <= 7) return (
    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
      Còn {days} ngày
    </span>
  );
  return (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      HSD: {new Date(new Date().setDate(new Date().getDate() + days)).toLocaleDateString('vi-VN')}
    </span>
  );
}

function BlindBoxCard({
  item,
  onBuy,
}: {
  item: BlindBoxItem;
  onBuy: (item: BlindBoxItem) => void;
}) {
  const discount = Math.round((1 - item.blindBoxPrice / item.originalValue) * 100);
  const soldPct = Math.round((item.quantitySold / item.quantity) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-orange-300">
            <Gift className="w-16 h-16" />
            <span className="text-xs font-medium text-orange-400">Bí ẩn</span>
          </div>
        )}
        {/* Discount badge */}
        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
          -{discount}%
        </div>
        {/* Sparkle for urgent */}
        {item.daysUntilExpiry <= 5 && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />HOT
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
          <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
            <Store className="w-3 h-3" />
            <span>{item.storeName}</span>
          </div>
        </div>

        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
        )}

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-orange-600">{fmt(item.blindBoxPrice)}</p>
            <p className="text-xs text-gray-400 line-through">{fmt(item.originalValue)}</p>
          </div>
          <DaysUntilBadge days={item.daysUntilExpiry} />
        </div>

        {/* Stock progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Đã bán {item.quantitySold}/{item.quantity}</span>
            <span className="font-medium text-orange-600">Còn {item.quantityAvailable}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
              style={{ width: `${soldPct}%` }}
            />
          </div>
        </div>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          size="sm"
          onClick={() => onBuy(item)}
          disabled={item.quantityAvailable === 0}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {item.quantityAvailable === 0 ? 'Hết hàng' : 'Mua ngay'}
        </Button>
      </div>
    </div>
  );
}

function PurchaseDialog({
  item,
  open,
  onClose,
  onSuccess,
}: {
  item: BlindBoxItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const res = await api.post(`/blind-boxes/${item.id}/purchase`);
      const data = res.data as {
        message: string;
        blindBoxTitle: string;
        pricePaid: number;
        newBalance: number;
      };
      toast.success(data.message || 'Mua Blind Box thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Mua thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;
  const discount = Math.round((1 - item.blindBoxPrice / item.originalValue) * 100);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <Gift className="w-5 h-5" />
            Xác nhận mua Blind Box
          </DialogTitle>
          <DialogDescription>Thanh toán bằng số dư ví F&amp;C</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Product info */}
          <div className="bg-orange-50 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-gray-900">{item.title}</p>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Store className="w-3.5 h-3.5" />{item.storeName}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-bold text-orange-600">{fmt(item.blindBoxPrice)}</span>
              <span className="text-sm text-gray-400 line-through">{fmt(item.originalValue)}</span>
              <Badge className="bg-red-100 text-red-600 border-0 text-xs">-{discount}%</Badge>
            </div>
          </div>

          {/* Wallet notice */}
          <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <Wallet className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Số tiền <strong>{fmt(item.blindBoxPrice)}</strong> sẽ được trừ từ ví F&amp;C của bạn.</span>
          </div>

          {/* Expiry notice */}
          <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Sản phẩm gần hết hạn, sẽ được giao trong vòng 24-48 giờ sau khi đặt mua thành công.</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xử lý...</> : 'Xác nhận mua'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BlindBoxPage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<BlindBoxListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<BlindBoxItem | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const PAGE_SIZE = 12;

  const loadData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/blind-boxes', { params: { page: p, pageSize: PAGE_SIZE } });
      setData(res.data as BlindBoxListResult);
    } catch {
      toast.error('Không thể tải danh sách Blind Box');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(page); }, [page, loadData]);

  const handleBuy = (item: BlindBoxItem) => {
    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập để mua Blind Box');
      return;
    }
    setSelectedItem(item);
    setPurchaseOpen(true);
  };

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Gift className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Blind Box</h1>
              <p className="text-orange-100 mt-0.5">Sản phẩm gần hết hạn — giá ưu đãi đặc biệt</p>
            </div>
          </div>
          <p className="text-orange-100 text-sm max-w-2xl">
            Mua Blind Box để sở hữu các sản phẩm thực phẩm sạch chất lượng cao với giá chiết khấu sâu.
            Sản phẩm vẫn còn hạn sử dụng và đảm bảo an toàn vệ sinh thực phẩm.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm">
              <span className="font-semibold">Tiết kiệm đến 50%</span> so với giá gốc
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm">
              <span className="font-semibold">Giao hàng ưu tiên</span> trong 24-48 giờ
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm">
              <span className="font-semibold">Thanh toán</span> qua ví F&amp;C
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">
              {loading ? 'Đang tải...' : `${data?.totalCount ?? 0} Blind Box đang mở bán`}
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(page)}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-24">
            <Gift className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-500">Hiện chưa có Blind Box nào</h3>
            <p className="text-sm text-gray-400 mt-1">Hãy quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.items.map(item => (
              <BlindBoxCard key={item.id} item={item} onBuy={handleBuy} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Purchase dialog */}
      <PurchaseDialog
        item={selectedItem}
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onSuccess={() => loadData(page)}
      />
    </div>
  );
}
