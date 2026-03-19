import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Input } from "../../components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import {
  Package, Loader2, RefreshCw, X,
} from "lucide-react";
import api from "../../services/api";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
interface BlindBoxDto {
  id: string;
  supplierId: number;
  storeName: string;
  title: string;
  description: string;
  originalValue: number;
  blindBoxPrice: number;
  quantity: number;
  quantitySold: number;
  expiryDate: string;
  contents?: string;
  imageUrl?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  daysUntilExpiry: number;
  quantityAvailable: number;
}

interface BlindBoxListResult {
  items: BlindBoxDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending:  { label: "Chờ duyệt",  className: "bg-yellow-100 text-yellow-700" },
    approved: { label: "Đã duyệt",   className: "bg-blue-100 text-blue-700" },
    active:   { label: "Đang bán",   className: "bg-green-100 text-green-700" },
    rejected: { label: "Từ chối",    className: "bg-red-100 text-red-600" },
    sold_out: { label: "Hết hàng",   className: "bg-gray-100 text-gray-500" },
    archived: { label: "Lưu trữ",    className: "bg-slate-100 text-slate-500" },
  };
  const info = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  );
}

// ── Approve Dialog ────────────────────────────────────────────────────────────
interface ApproveDialogProps {
  item: BlindBoxDto;
  onClose: () => void;
  onConfirm: (adjustedPrice?: number) => Promise<void>;
}

function ApproveDialog({ item, onClose, onConfirm }: ApproveDialogProps) {
  const [adjustedPrice, setAdjustedPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const price = adjustedPrice.trim() ? parseFloat(adjustedPrice) : undefined;
      if (price !== undefined && (isNaN(price) || price <= 0)) {
        toast.error("Giá điều chỉnh phải là số dương");
        return;
      }
      await onConfirm(price);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Duyệt Blind Box</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.storeName}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
              <span>Giá bán hiện tại: <span className="font-semibold">{formatCurrency(item.blindBoxPrice)}</span></span>
              <span>·</span>
              <span>Giá trị gốc: <span className="font-semibold">{formatCurrency(item.originalValue)}</span></span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Điều chỉnh giá bán (tuỳ chọn)
            </label>
            <Input
              type="number"
              min={0}
              placeholder={`Để trống giữ giá ${formatCurrency(item.blindBoxPrice)}`}
              value={adjustedPrice}
              onChange={e => setAdjustedPrice(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Nếu để trống, giá bán gốc sẽ được giữ nguyên.</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận duyệt
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reject Dialog ─────────────────────────────────────────────────────────────
interface RejectDialogProps {
  item: BlindBoxDto;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

function RejectDialog({ item, onClose, onConfirm }: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Từ chối Blind Box</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.storeName}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Lý do từ chối <span className="text-red-500">*</span></label>
            <textarea
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={3}
              placeholder="Nhập lý do từ chối blind box này..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận từ chối
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export function BlindBoxTab() {
  const [items, setItems] = useState<BlindBoxDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [approveTarget, setApproveTarget] = useState<BlindBoxDto | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BlindBoxDto | null>(null);

  const loadData = useCallback(async (p = page, s = statusFilter) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, pageSize };
      if (s !== "all") params.status = s;
      const res = await api.get("/admin/blind-boxes", { params });
      const data: BlindBoxListResult = res.data;
      setItems(data.items ?? []);
      setTotalCount(data.totalCount ?? 0);
    } catch {
      toast.error("Không thể tải danh sách blind box");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadData(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  // KPIs (from loaded data regardless of filter)
  const pendingCount = items.filter(i => i.status === "pending").length;
  const activeCount = items.filter(i => i.status === "approved" || i.status === "active").length;
  const soldOutCount = items.filter(i => i.status === "sold_out").length;

  const handleApprove = async (adjustedPrice?: number) => {
    if (!approveTarget) return;
    try {
      await api.patch(`/admin/blind-boxes/${approveTarget.id}/approve`, { adjustedPrice });
      toast.success("Blind box đã được duyệt");
      setApproveTarget(null);
      loadData();
    } catch {
      toast.error("Không thể duyệt blind box");
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await api.patch(`/admin/blind-boxes/${rejectTarget.id}/reject`, { reason });
      toast.success("Blind box đã bị từ chối");
      setRejectTarget(null);
      loadData();
    } catch {
      toast.error("Không thể từ chối blind box");
    }
  };

  const handleArchive = async (item: BlindBoxDto) => {
    try {
      await api.patch(`/admin/blind-boxes/${item.id}/archive`);
      toast.success("Blind box đã được lưu trữ");
      loadData();
    } catch {
      toast.error("Không thể lưu trữ blind box");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Quản lý Blind Box</h2>
        <p className="text-sm text-gray-500 mt-0.5">Duyệt hộp cận date từ mart</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Chờ duyệt</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Đang bán</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold text-gray-600">{soldOutCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Đã bán hết</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                Danh sách Blind Box
              </CardTitle>
              <CardDescription>
                Tổng {totalCount} blind box · Trang {page}/{Math.max(1, totalPages)}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filter */}
          <div className="mb-5">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="archived">Lưu trữ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Mart</TableHead>
                  <TableHead>Tên hộp</TableHead>
                  <TableHead className="w-[130px]">Giá trị gốc</TableHead>
                  <TableHead className="w-[120px]">Giá bán</TableHead>
                  <TableHead className="w-[110px]">Số lượng</TableHead>
                  <TableHead className="w-[100px]">Hết hạn</TableHead>
                  <TableHead className="w-[110px]">Trạng thái</TableHead>
                  <TableHead className="w-[160px] text-right pr-4">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                      Không tìm thấy blind box nào
                    </TableCell>
                  </TableRow>
                ) : items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-700">{item.storeName}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 line-through">{formatCurrency(item.originalValue)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(item.blindBoxPrice)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {item.quantityAvailable}/{item.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${item.daysUntilExpiry <= 3 ? "text-red-600" : item.daysUntilExpiry <= 7 ? "text-amber-600" : "text-gray-600"}`}>
                        {item.daysUntilExpiry <= 0 ? "Hết hạn" : `${item.daysUntilExpiry} ngày`}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setApproveTarget(item)}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => setRejectTarget(item)}
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                        {(item.status === "approved" || item.status === "active") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs"
                            onClick={() => handleArchive(item)}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Không tìm thấy blind box nào</p>
            ) : items.map(item => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-4 bg-white shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.storeName}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <p className="text-gray-400">Giá bán</p>
                    <p className="font-semibold text-green-600">{formatCurrency(item.blindBoxPrice)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Còn lại</p>
                    <p className="font-medium">{item.quantityAvailable}/{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Hết hạn</p>
                    <p className={`font-medium ${item.daysUntilExpiry <= 3 ? "text-red-600" : "text-gray-700"}`}>
                      {item.daysUntilExpiry <= 0 ? "Hết hạn" : `${item.daysUntilExpiry} ngày`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Giá trị gốc</p>
                    <p className="line-through text-gray-500">{formatCurrency(item.originalValue)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setApproveTarget(item)}
                      >
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => setRejectTarget(item)}
                      >
                        Từ chối
                      </Button>
                    </>
                  )}
                  {(item.status === "approved" || item.status === "active") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleArchive(item)}
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} trong {totalCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(p => p - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(p => p + 1)}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {approveTarget && (
        <ApproveDialog
          item={approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          item={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

export default BlindBoxTab;
