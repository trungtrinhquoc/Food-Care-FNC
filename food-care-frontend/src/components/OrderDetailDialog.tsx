import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { StatusBadge } from './ui/status-badge';
import { MapPin, CreditCard, Package, Clock, Truck, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Order, OrderStatus, PaymentStatus } from '../types';
import { useMemo } from 'react';

interface OrderDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order | null;
}

export function OrderDetailDialog({ open, onOpenChange, order }: OrderDetailDialogProps) {
    if (!order) return null;

    const shippingAddress = useMemo(() => {
        if (!order.shippingAddressSnapshot) return null;
        try {
            const parsed = JSON.parse(order.shippingAddressSnapshot);
            return parsed.address || parsed;
        } catch (e) {
            return order.shippingAddressSnapshot;
        }
    }, [order.shippingAddressSnapshot]);

    const paymentMethod = useMemo(() => {
        if (!order.paymentMethodSnapshot) return 'COD';
        try {
            const parsed = JSON.parse(order.paymentMethodSnapshot);
            return parsed.method || parsed;
        } catch (e) {
            return order.paymentMethodSnapshot;
        }
    }, [order.paymentMethodSnapshot]);

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'confirmed':
            case 'processing':
                return <AlertCircle className="w-5 h-5 text-blue-600" />;
            case 'shipping':
                return <Truck className="w-5 h-5 text-purple-600" />;
            case 'delivered':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusText = (status: OrderStatus) => {
        const statusMap: Record<string, string> = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            processing: 'Đang xử lý',
            shipping: 'Đang giao',
            delivered: 'Đã giao',
            cancelled: 'Đã hủy',
            returned: 'Đã trả hàng'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status: OrderStatus) => {
        const colorMap: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-blue-100 text-blue-800',
            shipping: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            returned: 'bg-gray-100 text-gray-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusText = (status: PaymentStatus) => {
        const statusMap: Record<string, string> = {
            unpaid: 'Chưa thanh toán',
            paid: 'Đã thanh toán',
            failed: 'Thanh toán lỗi',
            refunded: 'Đã hoàn tiền'
        };
        return statusMap[status] || status;
    };

    const getPaymentStatusColor = (status: PaymentStatus) => {
        const colorMap: Record<string, string> = {
            unpaid: 'bg-red-100 text-red-800',
            paid: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            refunded: 'bg-yellow-100 text-yellow-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentMethodName = (method: string) => {
        const methodMap: Record<string, string> = {
            COD: 'Thanh toán khi nhận hàng',
            MOMO: 'Ví MoMo',
            VNPAY: 'VNPay',
            BANKING: 'Chuyển khoản ngân hàng'
        };
        return methodMap[method.toUpperCase()] || method;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold">Chi tiết đơn hàng</DialogTitle>
                            <DialogDescription className="mt-1">
                                Mã đơn: <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                            </DialogDescription>
                        </div>
                        <StatusBadge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1.5">{getStatusText(order.status)}</span>
                        </StatusBadge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Items Section */}
                    <div>
                        <h4 className="flex items-center gap-2 font-semibold mb-3">
                            <Package className="w-5 h-5 text-emerald-600" />
                            Sản phẩm đã chọn
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.productName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')}đ
                                            </p>
                                            {item.isSubscription && (
                                                <StatusBadge variant="secondary" className="text-[10px] py-0">
                                                    📦 Đăng ký định kỳ
                                                </StatusBadge>
                                            )}
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-900">
                                        {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                            ))}
                            <Separator className="my-2" />
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tạm tính</span>
                                    <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Phí vận chuyển</span>
                                    <span>+{order.shippingFee.toLocaleString('vi-VN')}đ</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Giảm giá</span>
                                        <span>-{order.discountAmount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold text-emerald-600 pt-2">
                                    <span>Tổng cộng</span>
                                    <span>{order.totalAmount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Shipping Info */}
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 font-semibold">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                                Địa chỉ nhận hàng
                            </h4>
                            <div className="bg-white border rounded-lg p-4 h-full">
                                {shippingAddress ? (
                                    <div className="text-sm space-y-1">
                                        <p className="font-bold text-gray-900">{shippingAddress.recipientName || 'Người nhận'}</p>
                                        <p className="text-gray-600">{shippingAddress.phoneNumber}</p>
                                        <p className="text-gray-600">
                                            {shippingAddress.addressLine1}
                                            {shippingAddress.district ? `, ${shippingAddress.district}` : ''}
                                            {shippingAddress.city ? `, ${shippingAddress.city}` : ''}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Thông tin địa chỉ đã được lược bỏ</p>
                                )}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 font-semibold">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                Thanh toán
                            </h4>
                            <div className="bg-white border rounded-lg p-4 h-full space-y-3">
                                <div className="text-sm">
                                    <p className="text-gray-500 mb-1">Phương thức</p>
                                    <p className="font-medium">{getPaymentMethodName(paymentMethod)}</p>
                                </div>
                                <div className="text-sm">
                                    <p className="text-gray-500 mb-1">Trạng thái</p>
                                    <StatusBadge className={getPaymentStatusColor(order.paymentStatus)}>
                                        {getPaymentStatusText(order.paymentStatus)}
                                    </StatusBadge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="text-xs text-gray-400 text-center pt-4 italic">
                        Cảm ơn bạn đã tin tưởng Food & Care. Đơn hàng được đặt vào {new Date(order.createdAt).toLocaleString('vi-VN')}.
                    </div>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button onClick={() => onOpenChange(false)} variant="secondary">
                        Đóng
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        Cần hỗ trợ?
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
