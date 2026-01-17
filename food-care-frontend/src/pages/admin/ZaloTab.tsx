import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Bell, Send, Eye } from "lucide-react";
import { StatusBadge, ReminderDaysBadge } from "../../components/admin/BadgeComponents";
import type { ZaloReminder } from "../../types/admin";

interface ZaloTabProps {
  reminders: ZaloReminder[];
  onSendReminder: (reminderId: string) => void;
  onSendBulk: () => void;
}

export function ZaloTab({ reminders, onSendReminder, onSendBulk }: ZaloTabProps) {
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
              <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={onSendBulk}>
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
              {reminders.map((reminder) => (
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
                    <StatusBadge status={reminder.status} />
                    {reminder.sentDate && (
                      <div className="text-xs text-gray-500 mt-1">{reminder.sentDate}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {reminder.status === 'pending' ? (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onSendReminder(reminder.id)}
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
