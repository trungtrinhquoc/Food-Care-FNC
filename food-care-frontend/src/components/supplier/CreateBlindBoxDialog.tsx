import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Gift, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

interface NearExpiryProduct {
  productId: string;
  productName: string;
  daysUntilExpiry: number;
  expiryDate?: string;
  currentStock?: number;
  imageUrl?: string;
  basePrice?: number;
}

interface CreateBlindBoxDialogProps {
  open: boolean;
  onClose: () => void;
  product: NearExpiryProduct | null;
  onSuccess?: () => void;
}

export function CreateBlindBoxDialog({
  open,
  onClose,
  product,
  onSuccess,
}: CreateBlindBoxDialogProps) {
  const suggestedPrice = product?.basePrice ? Math.round(product.basePrice * 0.5) : 0;
  const suggestedOriginal = product?.basePrice ?? 0;

  const [form, setForm] = useState({
    title: '',
    description: '',
    originalValue: suggestedOriginal,
    blindBoxPrice: suggestedPrice,
    quantity: 1,
    contents: '',
    imageUrl: product?.imageUrl ?? '',
  });
  const [loading, setLoading] = useState(false);

  // Reset form when product changes
  const handleClose = () => {
    setForm({
      title: '',
      description: '',
      originalValue: suggestedOriginal,
      blindBoxPrice: suggestedPrice,
      quantity: 1,
      contents: '',
      imageUrl: product?.imageUrl ?? '',
    });
    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const discount = form.originalValue > 0
    ? Math.round((1 - form.blindBoxPrice / form.originalValue) * 100)
    : 0;

  const handleSubmit = async () => {
    if (!product) return;
    if (!form.title.trim()) { toast.error('Nhập tiêu đề cho Blind Box'); return; }
    if (form.blindBoxPrice <= 0) { toast.error('Giá Blind Box phải lớn hơn 0'); return; }
    if (form.blindBoxPrice >= form.originalValue) { toast.error('Giá Blind Box phải thấp hơn giá gốc'); return; }
    if (form.quantity < 1) { toast.error('Số lượng phải ít nhất là 1'); return; }

    setLoading(true);
    try {
      await api.post('/supplier/blind-boxes', {
        title: form.title.trim(),
        description: form.description.trim() || null,
        originalValue: form.originalValue,
        blindBoxPrice: form.blindBoxPrice,
        quantity: form.quantity,
        expiryDate: product.expiryDate ?? new Date(Date.now() + product.daysUntilExpiry * 86400000).toISOString(),
        contents: form.contents.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
      });
      toast.success('Blind Box đã được gửi để phê duyệt! Admin sẽ xem xét và phản hồi sớm.');
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Tạo Blind Box thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <Gift className="w-5 h-5" />
            Tạo Blind Box
          </DialogTitle>
          <DialogDescription>
            Từ sản phẩm: <strong>{product.productName}</strong> — còn <strong>{product.daysUntilExpiry} ngày</strong> HSD
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info banner */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Blind Box cần được Admin duyệt trước khi hiển thị cho khách hàng. Thường được phê duyệt trong vòng 24 giờ.
            </span>
          </div>

          {/* Title */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Tiêu đề <span className="text-red-500">*</span></Label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder={`Blind Box ${product.productName}`}
              maxLength={200}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Mô tả (tùy chọn)</Label>
            <Textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Mô tả ngắn về Blind Box..."
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Giá gốc (đ) <span className="text-red-500">*</span></Label>
              <input
                type="number"
                value={form.originalValue}
                onChange={e => handleChange('originalValue', Number(e.target.value))}
                min={1000}
                step={1000}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Giá Blind Box (đ) <span className="text-red-500">*</span></Label>
              <input
                type="number"
                value={form.blindBoxPrice}
                onChange={e => handleChange('blindBoxPrice', Number(e.target.value))}
                min={1000}
                step={1000}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          {discount > 0 && (
            <p className="text-xs text-emerald-600 -mt-2">
              Khách được giảm <strong>{discount}%</strong> so với giá gốc ({fmt(form.originalValue)} → {fmt(form.blindBoxPrice)})
            </p>
          )}

          {/* Quantity */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Số lượng <span className="text-red-500">*</span></Label>
            <input
              type="number"
              value={form.quantity}
              onChange={e => handleChange('quantity', Number(e.target.value))}
              min={1}
              max={product.currentStock ?? 999}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {product.currentStock && (
              <p className="text-xs text-gray-400 mt-1">Tồn kho hiện tại: {product.currentStock}</p>
            )}
          </div>

          {/* Contents */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Nội dung Blind Box (tùy chọn)</Label>
            <Textarea
              value={form.contents}
              onChange={e => handleChange('contents', e.target.value)}
              placeholder="Ví dụ: 500g rau cải, 300g thịt bò... (có thể mô tả chung)"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Image URL */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">URL ảnh (tùy chọn)</Label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={e => handleChange('imageUrl', e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.title.trim() || form.blindBoxPrice <= 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
              : <><Gift className="w-4 h-4 mr-2" />Gửi phê duyệt</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
