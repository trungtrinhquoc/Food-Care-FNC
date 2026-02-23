import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Truck, MapPin, Clock, Package } from 'lucide-react';
import type { Order } from '../../types/supplier';

interface ShippingTrackingDialogProps {
  order: Order;
  onClose: () => void;
  onSave: (shippingInfo: ShippingInfo) => void;
}

export interface ShippingInfo {
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  currentLocation?: string;
  notes?: string;
}

const carriers = [
  { value: 'ghn', label: 'Giao Hàng Nhanh (GHN)' },
  { value: 'ghtk', label: 'Giao Hàng Tiết Kiệm (GHTK)' },
  { value: 'jt', label: 'J&T Express' },
  { value: 'viettelpost', label: 'Viettel Post' },
  { value: 'vnpost', label: 'Vietnam Post' },
  { value: 'ninja', label: 'Ninja Van' },
  { value: 'best', label: 'BEST Express' },
  { value: 'other', label: 'Khác' },
];

export function ShippingTrackingDialog({
  order,
  onClose,
  onSave,
}: ShippingTrackingDialogProps) {
  const [shippingInfo, setShippingInfo] = useState<Partial<ShippingInfo>>({
    carrier: order.shipping?.carrier || '',
    trackingNumber: order.shipping?.trackingNumber || '',
    estimatedDelivery: order.shipping?.expectedDelivery || '',
    currentLocation: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!shippingInfo.carrier || !shippingInfo.trackingNumber || !shippingInfo.estimatedDelivery) {
      return;
    }

    setIsSubmitting(true);
    try {
      onSave({
        carrier: shippingInfo.carrier,
        trackingNumber: shippingInfo.trackingNumber,
        estimatedDelivery: shippingInfo.estimatedDelivery,
        currentLocation: shippingInfo.currentLocation,
        notes: shippingInfo.notes,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Cập nhật vận chuyển - #{order.orderNumber || order.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Carrier Selection */}
          <div className="space-y-2">
            <Label htmlFor="carrier">
              Đơn vị vận chuyển <span className="text-red-500">*</span>
            </Label>
            <Select
              value={shippingInfo.carrier}
              onValueChange={(value) => handleChange('carrier', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn đơn vị vận chuyển" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((carrier) => (
                  <SelectItem key={carrier.value} value={carrier.value}>
                    {carrier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Number */}
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Mã vận đơn <span className="text-red-500">*</span>
              </div>
            </Label>
            <Input
              id="trackingNumber"
              placeholder="Nhập mã vận đơn"
              value={shippingInfo.trackingNumber}
              onChange={(e) => handleChange('trackingNumber', e.target.value)}
            />
          </div>

          {/* Estimated Delivery */}
          <div className="space-y-2">
            <Label htmlFor="estimatedDelivery">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ngày giao dự kiến <span className="text-red-500">*</span>
              </div>
            </Label>
            <Input
              id="estimatedDelivery"
              type="date"
              value={shippingInfo.estimatedDelivery}
              onChange={(e) => handleChange('estimatedDelivery', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Current Location */}
          <div className="space-y-2">
            <Label htmlFor="currentLocation">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Vị trí hiện tại
              </div>
            </Label>
            <Input
              id="currentLocation"
              placeholder="VD: Kho HCM, Đang vận chuyển..."
              value={shippingInfo.currentLocation}
              onChange={(e) => handleChange('currentLocation', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Thông tin bổ sung về vận chuyển..."
              value={shippingInfo.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !shippingInfo.carrier ||
              !shippingInfo.trackingNumber ||
              !shippingInfo.estimatedDelivery
            }
          >
            {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
