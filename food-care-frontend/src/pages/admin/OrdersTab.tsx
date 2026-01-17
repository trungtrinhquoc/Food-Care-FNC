import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Search, Filter, Download, Eye } from "lucide-react";
import { StatusBadge } from "../../components/admin/BadgeComponents";
import type { AdminOrder, OrderStatus } from "../../types/admin";

interface OrdersTabProps {
  orders: AdminOrder[];
  onViewDetail: (order: AdminOrder) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export function OrdersTab({ orders, onViewDetail, onUpdateStatus }: OrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý đơn hàng</CardTitle>
            <CardDescription>Tổng {orders.length} đơn hàng</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Lọc
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Xuất
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    {order.subscription && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Định kỳ
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>{order.items} sản phẩm</TableCell>
                <TableCell className="font-medium">
                  {order.total.toLocaleString('vi-VN')}đ
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetail(order)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Select
                      value={order.status}
                      onValueChange={(value) => onUpdateStatus(order.id, value as OrderStatus)}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="processing">Đang xử lý</SelectItem>
                        <SelectItem value="shipping">Đang giao</SelectItem>
                        <SelectItem value="delivered">Đã giao</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
