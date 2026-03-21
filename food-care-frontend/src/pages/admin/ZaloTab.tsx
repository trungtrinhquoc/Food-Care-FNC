import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Input } from "../../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { SimplePagination } from "../../components/ui/pagination";
import { Bell, Send, Search, Loader2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { zaloService, type ZaloMessage, type ZaloTemplate, type ZaloMessageFilter } from "../../services/admin/zaloService";

function ZaloStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case 'sent':
    case 'success':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Đã gửi</span>;
    case 'failed':
    case 'error':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" />Thất bại</span>;
    case 'pending':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Chờ xử lý</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status || 'N/A'}</span>;
  }
}

export function ZaloTab() {
  const [messages, setMessages] = useState<ZaloMessage[]>([]);
  const [templates, setTemplates] = useState<ZaloTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingPhone, setSendingPhone] = useState("");
  const [sendingTemplate, setSendingTemplate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const filter: ZaloMessageFilter = {
        pageSize: 100,
        sortDescending: true,
      };
      if (statusFilter !== "all") filter.status = statusFilter;
      if (searchTerm) filter.searchTerm = searchTerm;

      const [msgData, tplData] = await Promise.all([
        zaloService.getMessages(filter),
        zaloService.getTemplates(),
      ]);
      setMessages(msgData);
      setTemplates(tplData);
    } catch {
      toast.error("Không thể tải dữ liệu Zalo");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(messages.length / pageSize);
  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return messages.slice(start, start + pageSize);
  }, [messages, currentPage, pageSize]);

  const handleSendMessage = useCallback(async () => {
    if (!sendingPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (!sendingTemplate) {
      toast.error("Vui lòng chọn mẫu tin nhắn");
      return;
    }
    setIsSending(true);
    try {
      const result = await zaloService.sendMessage({
        templateId: parseInt(sendingTemplate),
        phoneNumber: sendingPhone.trim(),
      });
      if (result.success) {
        toast.success("Đã gửi tin nhắn Zalo thành công");
        setSendingPhone("");
        setSendingTemplate("");
        loadData();
      } else {
        toast.error(result.errorMessage || "Gửi tin nhắn thất bại");
      }
    } catch {
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  }, [sendingPhone, sendingTemplate, loadData]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu Zalo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Send Message Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            Gửi tin nhắn Zalo
          </CardTitle>
          <CardDescription>Chọn mẫu tin nhắn và nhập số điện thoại để gửi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={sendingTemplate} onValueChange={setSendingTemplate}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Chọn mẫu tin nhắn" />
              </SelectTrigger>
              <SelectContent>
                {templates.filter(t => t.isActive).map(tpl => (
                  <SelectItem key={tpl.id} value={String(tpl.id)}>
                    {tpl.templateName || tpl.templateId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Số điện thoại (VD: 0901234567)"
              value={sendingPhone}
              onChange={e => setSendingPhone(e.target.value)}
              className="w-full sm:w-[200px]"
            />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSendMessage}
              disabled={isSending}
            >
              {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Gửi tin nhắn
            </Button>
          </div>

          {/* Template preview */}
          {sendingTemplate && (() => {
            const tpl = templates.find(t => String(t.id) === sendingTemplate);
            return tpl?.contentSample ? (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Xem trước nội dung:</p>
                <p>{tpl.contentSample}</p>
              </div>
            ) : null;
          })()}
        </CardContent>
      </Card>

      {/* Messages History Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Lịch sử tin nhắn
              </CardTitle>
              <CardDescription>
                {messages.length} tin nhắn đã ghi nhận
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo email hoặc số điện thoại..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="sent">Đã gửi</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email / SĐT</TableHead>
                <TableHead>Mẫu tin nhắn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian gửi</TableHead>
                <TableHead>Lỗi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                    Không có tin nhắn nào
                  </TableCell>
                </TableRow>
              ) : paginatedMessages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell>
                    <div>
                      {msg.userEmail && <div className="font-medium text-sm">{msg.userEmail}</div>}
                      <div className="text-xs text-gray-500">{msg.phoneSent}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{msg.templateName || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <ZaloStatusBadge status={msg.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{formatDate(msg.sentAt)}</span>
                  </TableCell>
                  <TableCell>
                    {msg.errorMessage ? (
                      <span className="text-xs text-red-500">{msg.errorMessage}</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={messages.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="tin nhắn"
          />
        </CardContent>
      </Card>

      {/* Templates List Card */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mẫu tin nhắn Zalo đã cài đặt</CardTitle>
            <CardDescription>{templates.filter(t => t.isActive).length} mẫu đang hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.map(tpl => (
                <div key={tpl.id} className={`p-4 rounded-lg border ${tpl.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{tpl.templateName || tpl.templateId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tpl.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {tpl.isActive ? 'Hoạt động' : 'Tắt'}
                    </span>
                  </div>
                  {tpl.contentSample && (
                    <p className="text-xs text-gray-500 mt-1">{tpl.contentSample}</p>
                  )}
                  {tpl.price != null && (
                    <p className="text-xs text-gray-400 mt-1">Giá: {tpl.price.toLocaleString('vi-VN')}đ/tin</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
