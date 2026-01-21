import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { SimplePagination } from "../../components/ui/pagination";
import { Bell, Send, Eye, Search, Loader2 } from "lucide-react";
import { OrderStatusBadge, ReminderDaysBadge } from "../../components/ui/status-badge";
import type { ZaloReminder } from "../../types/admin";
import { mockZaloReminders } from "../../services/adminService";

export function ZaloTab() {
  const [reminders, setReminders] = useState<ZaloReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Fetch reminders - will be replaced with API call
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        setReminders(mockZaloReminders);
      } catch (error) {
        console.error("Error fetching reminders:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReminders();
  }, []);

  const filteredReminders = useMemo(() => {
    return reminders.filter(
      (r) =>
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm)
    );
  }, [reminders, searchTerm]);

  const totalPages = Math.ceil(filteredReminders.length / pageSize);
  const paginatedReminders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReminders.slice(startIndex, startIndex + pageSize);
  }, [filteredReminders, currentPage, pageSize]);

  const handleSendReminder = useCallback((reminderId: string) => {
    setReminders(prev => prev.map(r => 
      r.id === reminderId ? { ...r, status: 'sent' as const, sentDate: new Date().toISOString().split('T')[0] } : r
    ));
  }, []);

  const handleSendBulk = useCallback(() => {
    setReminders(prev => prev.map(r => 
      r.status === 'pending' ? { ...r, status: 'sent' as const, sentDate: new Date().toISOString().split('T')[0] } : r
    ));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hệ thống nhắc nhở Zalo</CardTitle>
              <CardDescription>
                Tự động gửi nhắc nhở khi sản phẩm của khách hàng sắp hết
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Cài đặt
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={handleSendBulk}>
                <Send className="w-4 h-4 mr-2" />
                Gửi hàng loạt
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-blue-900">Cách hoạt động</h3>
                  <p className="text-xs text-blue-700">
                    Hệ thống tự động phát hiện khách hàng có sản phẩm sắp hết dựa trên lịch sử mua
                    hàng và thời gian sử dụng trung bình. Bạn có thể gửi tin nhắn nhắc nhở qua Zalo
                    để khuyến khích họ đặt hàng lại hoặc đăng ký gói định kỳ.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên, số điện thoại hoặc sản phẩm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Mua lần cuối</TableHead>
                <TableHead>Ước tính còn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reminder.customerName}</div>
                      <div className="text-xs text-gray-500">{reminder.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{reminder.product}</TableCell>
                  <TableCell>{reminder.lastPurchase}</TableCell>
                  <TableCell>
                    <ReminderDaysBadge days={reminder.estimatedDaysLeft} />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={reminder.status} />
                    {reminder.sentDate && (
                      <div className="text-xs text-gray-500 mt-1">{reminder.sentDate}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {reminder.status === 'pending' ? (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleSendReminder(reminder.id)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Gửi ngay
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Xem
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredReminders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="lời nhắc"
          />
        </CardContent>
      </Card>

      {/* Zalo Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Mẫu tin nhắn Zalo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tiêu đề tin nhắn</Label>
            <Input placeholder="VD: Sản phẩm của bạn sắp hết!" />
          </div>
          <div>
            <Label>Nội dung tin nhắn</Label>
            <Textarea
              placeholder="VD: Xin chào {customer_name}, sản phẩm {product_name} của bạn ước tính sẽ hết trong {days_left} ngày. Đặt hàng ngay để không bỏ lỡ!"
              rows={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="auto-send" />
            <Label htmlFor="auto-send">Tự động gửi khi sản phẩm còn 3 ngày</Label>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">Lưu cài đặt</Button>
        </CardContent>
      </Card>
    </div>
  );
}
