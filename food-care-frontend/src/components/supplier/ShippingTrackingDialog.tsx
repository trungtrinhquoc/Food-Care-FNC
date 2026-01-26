import { useState } from 'react';
import { X, Truck, Calendar, Package, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { Order, ShippingInfo, ShippingStatus } from '../../types/supplier';

interface ShippingTrackingDialogProps {
  order: Order;
  onClose: () => void;
  onSave: (shippingInfo: ShippingInfo) => void;
}

export function ShippingTrackingDialog({ order, onClose, onSave }: ShippingTrackingDialogProps) {
  const [carrier, setCarrier] = useState(order.shipping?.carrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.shipping?.trackingNumber || '');
  const [expectedDelivery, setExpectedDelivery] = useState(
    order.shipping?.expectedDelivery ? new Date(order.shipping.expectedDelivery).toISOString().slice(0, 16) : ''
  );
  const [status, setStatus] = useState<ShippingStatus>(order.shipping?.status || 'preparing');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const carriers = [
    'Giao Hàng Nhanh',
    'Giao Hàng Tiết Kiệm',
    'Viettel Post',
    'VNPost',
    'J&T Express',
    'Ninja Van',
    'Best Express',
    'Shopee Express',
  ];

  const statusOptions: { value: ShippingStatus; label: string; color: string }[] = [
    { value: 'preparing', label: 'Đang chuẩn bị', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'in_transit', label: 'Đang vận chuyển', color: 'bg-blue-100 text-blue-700' },
    { value: 'delivered', label: 'Đã giao hàng', color: 'bg-green-100 text-green-700' },
    { value: 'failed_delivery', label: 'Giao thất bại', color: 'bg-red-100 text-red-700' },
  ];

  const handleCopyTracking = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (!carrier || !trackingNumber) {
      alert('Vui lòng nhập đầy đủ thông tin vận chuyển');
      return;
    }

    const newTimeline = order.shipping?.timeline || [];
    newTimeline.push({
      status,
      timestamp: new Date().toISOString(),
      notes,
    });

    const shippingInfo: ShippingInfo = {
      carrier,
      trackingNumber,
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery).toISOString() : undefined,
      status,
      timeline: newTimeline,
    };

    onSave(shippingInfo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Thông tin vận chuyển</h2>
            <p className="text-sm text-gray-600 mt-1">{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Thông tin đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Khách hàng:</span>
                <span className="font-medium">{order.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số điện thoại:</span>
                <span className="font-medium">{order.customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Địa chỉ:</span>
                <span className="font-medium text-right max-w-xs">
                  {order.shippingAddress.street}, {order.shippingAddress.ward}, {order.shippingAddress.district}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-semibold text-blue-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Đơn vị vận chuyển <span className="text-red-500">*</span>
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn đơn vị vận chuyển</option>
                {carriers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mã vận đơn <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Nhập mã vận đơn"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  disabled={!trackingNumber}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sao chép mã vận đơn"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dự kiến giao hàng</label>
              <input
                type="datetime-local"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trạng thái vận chuyển</label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      status === option.value
                        ? `${option.color} border-current`
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ghi chú (tùy chọn)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thêm ghi chú về tình trạng vận chuyển..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Timeline (if exists) */}
          {order.shipping && order.shipping.timeline.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Lịch sử vận chuyển</h3>
              <div className="space-y-3">
                {order.shipping.timeline.map((event, index) => {
                  const statusConfig = statusOptions.find((s) => s.value === event.status);
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${statusConfig?.color} flex items-center justify-center flex-shrink-0`}>
                          {event.status === 'delivered' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : event.status === 'failed_delivery' ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : event.status === 'in_transit' ? (
                            <Truck className="w-4 h-4" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                        </div>
                        {index < order.shipping!.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">{statusConfig?.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(event.timestamp).toLocaleString('vi-VN')}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-700 mt-1">{event.location}</p>
                        )}
                        {event.notes && (
                          <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Lưu ý khi cập nhật thông tin vận chuyển:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Kiểm tra kỹ mã vận đơn trước khi lưu</li>
                <li>Khách hàng sẽ nhận được thông báo qua SMS/Email</li>
                <li>Cập nhật trạng thái thường xuyên để khách hàng theo dõi</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-white transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Lưu thông tin
          </button>
        </div>
      </div>
    </div>
  );
}
