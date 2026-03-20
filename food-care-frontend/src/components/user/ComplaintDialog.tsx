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
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AlertTriangle, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

const COMPLAINT_TYPES = [
  { value: 'Không nhận hàng', label: 'Không nhận được hàng', priority: 'high' },
  { value: 'Thiếu sản phẩm', label: 'Thiếu sản phẩm trong đơn', priority: 'medium' },
  { value: 'Hàng hỏng', label: 'Hàng bị hư hỏng / không đúng chất lượng', priority: 'medium' },
  { value: 'Giao sai sản phẩm', label: 'Giao sai sản phẩm', priority: 'medium' },
  { value: 'Chất lượng kém', label: 'Chất lượng không đúng mô tả', priority: 'low' },
  { value: 'Khác', label: 'Khác', priority: 'low' },
];

interface ComplaintDialogProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
  orderNumber?: string;
  supplierId?: number;
  onSuccess?: () => void;
}

export function ComplaintDialog({
  open,
  onClose,
  orderId,
  orderNumber,
  supplierId,
  onSuccess,
}: ComplaintDialogProps) {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (imageUrls.length >= 4) {
      toast.error('Tối đa 4 ảnh');
      return;
    }
    setImageUrls(prev => [...prev, url]);
    setUrlInput('');
  };

  const handleRemoveUrl = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!type) {
      toast.error('Vui lòng chọn loại khiếu nại');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      toast.error('Mô tả phải có ít nhất 20 ký tự');
      return;
    }

    setLoading(true);
    try {
      await api.post('/complaints', {
        orderNumber: orderNumber ?? '',
        orderId: orderId ?? null,
        supplierId: supplierId ?? null,
        type,
        description: description.trim(),
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
      });
      toast.success('Gửi khiếu nại thành công! Chúng tôi sẽ xem xét và phản hồi sớm nhất.');
      setType('');
      setDescription('');
      setImageUrls([]);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gửi khiếu nại thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeMeta = COMPLAINT_TYPES.find(t => t.value === type);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="w-5 h-5" />
            Gửi khiếu nại
          </DialogTitle>
          {orderNumber && (
            <DialogDescription>
              Đơn hàng <span className="font-semibold">#{orderNumber}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Complaint type */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Loại khiếu nại <span className="text-red-500">*</span></Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại vấn đề..." />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTypeMeta?.priority === 'high' && (
              <p className="text-xs text-red-500 mt-1">
                ⚡ Vấn đề ưu tiên cao – sẽ được xử lý trong vòng 2 giờ
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Hãy mô tả chi tiết vấn đề bạn gặp phải (ít nhất 20 ký tự)..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/1000</p>
          </div>

          {/* Image URLs */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Đính kèm ảnh (tùy chọn, tối đa 4)
            </Label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
                placeholder="Dán URL ảnh vào đây..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddUrl}>
                Thêm
              </Button>
            </div>
            {imageUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5">
                    <img
                      src={url}
                      alt=""
                      className="w-8 h-8 object-cover rounded"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="flex-1 truncate text-gray-600">{url}</span>
                    <button type="button" onClick={() => handleRemoveUrl(idx)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notice */}
          <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs text-orange-700">
            Sau khi gửi, đội hỗ trợ sẽ xem xét và phản hồi trong vòng 24 giờ. Nếu khiếu nại được chấp thuận, tiền hoàn sẽ được cộng vào ví của bạn.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !type || description.trim().length < 20}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</> : 'Gửi khiếu nại'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
