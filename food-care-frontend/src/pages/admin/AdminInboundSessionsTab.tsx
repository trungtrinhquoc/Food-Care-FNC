import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { SimplePagination } from "../../components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Search,
  RefreshCw,
  Calendar,
  Warehouse,
  Eye,
  Package,
  Users,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { inboundSessionApi } from "../../services/staff/staffApi";
import type { InboundSession, InboundReceipt, InboundReceiptDetail } from "../../types/staff";
import type { PagedResponse } from "../../types/staff";

// =====================================================
// TYPES
// =====================================================

interface InboundSessionSupplier {
  registrationId: string;
  supplierId: number;
  supplierName?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierWard?: string;
  supplierDistrict?: string;
  status: string;
  note?: string;
  estimatedDeliveryDate?: string;
  registeredAt?: string;
  createdAt: string;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function AdminInboundSessionsTab() {
  const [sessions, setSessions] = useState<InboundSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Detail dialog
  const [selectedSession, setSelectedSession] = useState<InboundSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [supplierRegistrations, setSupplierRegistrations] = useState<InboundSessionSupplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Latest sessions popup
  const [showLatestPopup, setShowLatestPopup] = useState(false);
  const [latestSessions, setLatestSessions] = useState<InboundSession[]>([]);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const status = statusFilter === "all" ? undefined : statusFilter;
      const result: PagedResponse<InboundSession> = await inboundSessionApi.getAll(page, pageSize, undefined, status);
      
      let filtered = result.items;
      
      // Client-side search filter
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter(s =>
          s.sessionCode.toLowerCase().includes(lower) ||
          s.warehouseName?.toLowerCase().includes(lower) ||
          s.createdByName?.toLowerCase().includes(lower)
        );
      }

      // Client-side date filter
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter(s => new Date(s.createdAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        filtered = filtered.filter(s => new Date(s.createdAt) <= to);
      }

      setSessions(filtered);
      setTotalCount(result.totalItems);
      setTotalPages(result.totalPages || Math.ceil(result.totalItems / pageSize));
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Không thể tải danh sách phiên nhập kho");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm, dateFrom, dateTo]);

  // Load latest sessions for popup notification
  const loadLatestSessions = useCallback(async () => {
    try {
      const result = await inboundSessionApi.getAll(1, 5, undefined, undefined);
      setLatestSessions(result.items);
    } catch (error) {
      console.error("Failed to load latest sessions:", error);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadLatestSessions();
  }, [loadLatestSessions]);

  const handleViewDetail = async (session: InboundSession) => {
    setSelectedSession(session);
    setDetailOpen(true);
    
    // Load supplier registrations
    try {
      setLoadingSuppliers(true);
      // Use the session suppliers endpoint  
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5022/api'}/staff/inbound-sessions/${session.id}/suppliers`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data: InboundSessionSupplier[] = await response.json();
        setSupplierRegistrations(data);
      }
    } catch (error) {
      console.error("Failed to load supplier registrations:", error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">Nháp</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Đang xử lý</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Hoàn thành</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSupplierStatusBadge = (status: string) => {
    switch (status) {
      case "Invited":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Đã mời</Badge>;
      case "Registered":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã đăng ký</Badge>;
      case "Declined":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Từ chối</Badge>;
      case "Completed":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Hoàn thành</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Stats
  const stats = {
    total: totalCount,
    draft: sessions.filter(s => s.status.toLowerCase() === "draft").length,
    processing: sessions.filter(s => s.status.toLowerCase() === "processing").length,
    completed: sessions.filter(s => s.status.toLowerCase() === "completed").length,
    cancelled: sessions.filter(s => s.status.toLowerCase() === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý phiên nhập kho</h2>
          <p className="text-slate-500 mt-1">Xem và quản lý tất cả phiên nhập kho từ các cơ sở</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadLatestSessions();
              setShowLatestPopup(true);
            }}
            className="relative"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Phiên mới nhất
            {latestSessions.filter(s => s.status.toLowerCase() === "draft").length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {latestSessions.filter(s => s.status.toLowerCase() === "draft").length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setPage(1); loadSessions(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("all"); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Tổng phiên</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("Draft"); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.draft}</p>
                <p className="text-xs text-slate-500">Nháp</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("Processing"); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{stats.processing}</p>
                <p className="text-xs text-slate-500">Đang xử lý</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("Completed"); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                <p className="text-xs text-slate-500">Hoàn thành</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("Cancelled"); setPage(1); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                <p className="text-xs text-slate-500">Đã hủy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm theo mã phiên, tên kho, nhân viên..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Draft">Nháp</SelectItem>
                <SelectItem value="Processing">Đang xử lý</SelectItem>
                <SelectItem value="Completed">Hoàn thành</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-[150px]"
                placeholder="Từ ngày"
              />
              <span className="text-slate-400">–</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="w-[150px]"
                placeholder="Đến ngày"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Danh sách phiên nhập kho</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Không có phiên nhập nào</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã phiên</TableHead>
                    <TableHead>Kho</TableHead>
                    <TableHead>Người tạo</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-center">NCC</TableHead>
                    <TableHead className="text-center">SP</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Ngày hết hạn</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => handleViewDetail(session)}
                    >
                      <TableCell className="font-mono font-medium text-sm">
                        {session.sessionCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{session.warehouseName || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{session.createdByName || "—"}</TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell className="text-center">{session.totalSuppliers}</TableCell>
                      <TableCell className="text-center">{session.totalItems}</TableCell>
                      <TableCell className="text-right font-medium">
                        {session.totalAmount.toLocaleString("vi-VN")}₫
                      </TableCell>
                      <TableCell className="text-sm">
                        {session.expectedEndDate ? (
                          <span className={
                            new Date(session.expectedEndDate) < new Date()
                              ? "text-red-600 font-medium"
                              : "text-slate-600"
                          }>
                            {formatDate(session.expectedEndDate)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(session.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleViewDetail(session); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <SimplePagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Package className="w-5 h-5 text-orange-600" />
              Chi tiết phiên nhập kho — {selectedSession?.sessionCode}
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và đăng ký nhà cung cấp
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6 mt-4">
              {/* Session Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Kho hàng</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                    {selectedSession.warehouseName || "—"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
                  {getStatusBadge(selectedSession.status)}
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Người tạo</p>
                  <p className="font-medium text-sm">{selectedSession.createdByName || "—"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Ngày tạo</p>
                  <p className="font-medium text-sm">{formatDate(selectedSession.createdAt)}</p>
                </div>
              </div>

              {selectedSession.note && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-xs text-yellow-600 mb-1 font-medium">Ghi chú</p>
                  <p className="text-sm text-yellow-800">{selectedSession.note}</p>
                </div>
              )}

              {/* Totals */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-700">{selectedSession.totalSuppliers}</p>
                  <p className="text-xs text-blue-600">Nhà cung cấp</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-700">{selectedSession.totalItems}</p>
                  <p className="text-xs text-green-600">Loại SP</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xl font-bold text-purple-700">{selectedSession.totalQuantity}</p>
                  <p className="text-xs text-purple-600">Tổng SL</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-xl font-bold text-orange-700">{selectedSession.totalAmount.toLocaleString("vi-VN")}₫</p>
                  <p className="text-xs text-orange-600">Tổng tiền</p>
                </div>
              </div>

              {/* Supplier Registrations */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  Đăng ký nhà cung cấp ({supplierRegistrations.length})
                </h4>
                {loadingSuppliers ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  </div>
                ) : supplierRegistrations.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">Chưa có nhà cung cấp nào được mời</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nhà cung cấp</TableHead>
                        <TableHead>Liên hệ</TableHead>
                        <TableHead>Khu vực</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày GH dự kiến</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierRegistrations.map((reg) => (
                        <TableRow key={reg.registrationId}>
                          <TableCell className="font-medium">{reg.supplierName || `#${reg.supplierId}`}</TableCell>
                          <TableCell className="text-sm">
                            {reg.supplierPhone && <div>{reg.supplierPhone}</div>}
                            {reg.supplierEmail && <div className="text-slate-400">{reg.supplierEmail}</div>}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {[reg.supplierWard, reg.supplierDistrict].filter(Boolean).join(", ") || "—"}
                            </div>
                          </TableCell>
                          <TableCell>{getSupplierStatusBadge(reg.status)}</TableCell>
                          <TableCell className="text-sm">{formatDate(reg.estimatedDeliveryDate)}</TableCell>
                          <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">
                            {reg.note || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Receipts */}
              {selectedSession.receipts && selectedSession.receipts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Phiếu nhập ({selectedSession.receipts.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedSession.receipts.map((receipt: InboundReceipt) => (
                      <Card key={receipt.id} className="border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-medium">{receipt.receiptCode}</span>
                              {getStatusBadge(receipt.status)}
                            </div>
                            <span className="text-sm font-medium">{receipt.totalAmount.toLocaleString("vi-VN")}₫</span>
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-4">
                            <span>NCC: {receipt.supplierName || `#${receipt.supplierId}`}</span>
                            <span>{receipt.totalItems} loại SP</span>
                            <span>{receipt.totalQuantity} SP</span>
                          </div>
                          {receipt.details && receipt.details.length > 0 && (
                            <div className="mt-3 border-t pt-3">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Sản phẩm</TableHead>
                                    <TableHead className="text-xs text-center">SL</TableHead>
                                    <TableHead className="text-xs text-right">Đơn giá</TableHead>
                                    <TableHead className="text-xs text-right">Thành tiền</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {receipt.details.map((detail: InboundReceiptDetail) => (
                                    <TableRow key={detail.id}>
                                      <TableCell className="text-sm">{detail.productName || `#${detail.productId}`}</TableCell>
                                      <TableCell className="text-sm text-center">{detail.quantity} {detail.unit}</TableCell>
                                      <TableCell className="text-sm text-right">{detail.unitPrice.toLocaleString("vi-VN")}₫</TableCell>
                                      <TableCell className="text-sm text-right font-medium">{detail.lineTotal.toLocaleString("vi-VN")}₫</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Latest Sessions Popup */}
      <Dialog open={showLatestPopup} onOpenChange={setShowLatestPopup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Phiên nhập kho mới nhất
            </DialogTitle>
            <DialogDescription>
              Các phiên nhập kho được tạo gần đây nhất từ các cơ sở
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
            {latestSessions.length === 0 ? (
              <p className="text-center text-slate-400 py-6">Chưa có phiên nhập nào</p>
            ) : (
              latestSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => {
                    setShowLatestPopup(false);
                    handleViewDetail(session);
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-semibold text-sm">{session.sessionCode}</span>
                      {getStatusBadge(session.status)}
                      {/* "Mới" badge for Draft sessions */}
                      {session.status.toLowerCase() === "draft" && (
                        <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">MỚI</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Warehouse className="w-3.5 h-3.5" />
                        {session.warehouseName || "—"}
                      </span>
                      <span>{session.createdByName || "—"}</span>
                      <span>{formatDate(session.createdAt)}</span>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
