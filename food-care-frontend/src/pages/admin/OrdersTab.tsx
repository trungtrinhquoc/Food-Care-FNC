import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { SimplePagination } from "../../components/ui/pagination";
import { Search, Download, Eye, Loader2, RefreshCw, ShoppingBag } from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "../../components/ui/status-badge";
import { OrderDetailDialog } from "../../components/admin/OrderDetailDialog";
import { ordersService } from "../../services/admin";
import type { AdminOrder, OrderStatus } from "../../types/admin";
import { formatCurrency, formatShortDate } from "../../constants/admin";

export function OrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const pageSize = 10;

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await ordersService.getOrders({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as OrderStatus : undefined,
        sortBy: 'createdAt',
        sortDescending: true,
      });
      setOrders(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleViewDetail = useCallback((order: AdminOrder) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  }, []);

  const handleUpdateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, { status });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  }, [fetchOrders]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Quản lý đơn hàng
              </CardTitle>
              <CardDescription>Tổng {totalItems} đơn hàng trong hệ thống</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchOrders}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                <SelectItem value="shipping">Đang giao</SelectItem>
                <SelectItem value="delivered">Đã giao</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Không tìm thấy đơn hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{String(order.id).slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-gray-500">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatShortDate(order.createdAt)}</TableCell>
                      <TableCell>{order.orderItems?.length || 0} sản phẩm</TableCell>
                      <TableCell className="font-medium text-emerald-600">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(order)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleUpdateStatus(order.id, value as OrderStatus)}
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ xử lý</SelectItem>
                              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                              <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                              <SelectItem value="shipping">Đang giao</SelectItem>
                              <SelectItem value="delivered">Đã giao</SelectItem>
                              <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="đơn hàng"
          />
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        order={selectedOrder}
      />
    </>
  );
}
