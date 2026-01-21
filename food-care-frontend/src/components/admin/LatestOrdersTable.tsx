import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Eye } from 'lucide-react';

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (seconds < 60) return 'vài giây trước';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} ngày trước`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} tháng trước`;
  return `${Math.floor(seconds / 31536000)} năm trước`;
}

export interface LatestOrder {
  id: string;
  customerName: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
  createdAt: string;
  itemCount: number;
}

interface LatestOrdersTableProps {
  orders: LatestOrder[];
  isLoading?: boolean;
  onViewOrder?: (orderId: string) => void;
}

const statusConfig = {
  pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  preparing: { label: 'Đang chuẩn bị', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  shipping: { label: 'Đang giao', className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100' },
  delivered: { label: 'Đã giao', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export function LatestOrdersTable({ orders, isLoading = false, onViewOrder }: LatestOrdersTableProps) {
  const navigate = useNavigate();

  const handleViewOrder = (orderId: string) => {
    if (onViewOrder) {
      onViewOrder(orderId);
    } else {
      navigate(`/admin?tab=orders&orderId=${orderId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">Chưa có đơn hàng nào</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Số món</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <span className="text-sm font-medium text-gray-900">#{order.id}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-700">{order.customerName}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-700">{order.itemCount} món</span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {order.totalAmount.toLocaleString('vi-VN')}đ
                </span>
              </td>
              <td className="py-3 px-4">
                <Badge variant="outline" className={statusConfig[order.status].className}>
                  {statusConfig[order.status].label}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(order.createdAt)}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewOrder(order.id)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
