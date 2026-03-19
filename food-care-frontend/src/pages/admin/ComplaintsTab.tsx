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
import { SimplePagination } from "../../components/ui/pagination";
import {
  AlertCircle, Search, RefreshCw, Eye, CheckCircle2, XCircle,
  Loader2, Clock,
} from "lucide-react";
import { complaintsService } from "../../services/admin/complaintsService";
import type { Complaint } from "../../types/admin";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "sonner";

// ── helpers ───────────────────────────────────────────────────────────────────
function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}p` : `${h} tiếng`;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-gray-100 text-gray-600",
  };
  const labels: Record<string, string> = {
    high: "Cao", medium: "Trung bình", low: "Thấp",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority] ?? styles.low}`}>
      {labels[priority] ?? priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    investigating: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    pending: "Chờ xử lý",
    investigating: "Đang điều tra",
    resolved: "Đã giải quyết",
    rejected: "Đã từ chối",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── detail dialog ─────────────────────────────────────────────────────────────
interface DetailDialogProps {
  complaint: Complaint | null;
  open: boolean;
  onClose: () => void;
  onAction: (id: string, action: "approve" | "reject" | "investigate", note?: string) => Promise<void>;
}

function ComplaintDetailDialog({ complaint, open, onClose, onAction }: DetailDialogProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!open) setNote(""); }, [open]);
  if (!open || !complaint) return null;

  const handle = async (action: "approve" | "reject" | "investigate") => {
    setSubmitting(true);
    try { await onAction(complaint.id, action, note); onClose(); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Chi tiết khiếu nại — Đơn #{complaint.orderNumber}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-4 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Khách hàng</p>
              <p className="font-medium text-gray-800">{complaint.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Mart</p>
              <p className="font-medium text-gray-800">{complaint.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Địa chỉ giao</p>
              <p className="text-gray-700">{complaint.customerAddress || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Loại khiếu nại</p>
              <p className="text-gray-700">{complaint.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Ưu tiên</p>
              <PriorityBadge priority={complaint.priority} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Thời gian chờ</p>
              <p className="text-gray-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />{formatElapsed(complaint.elapsedMinutes)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Mô tả sự việc</p>
            <p className="text-gray-700 bg-gray-50 rounded-lg px-3 py-2 text-sm">{complaint.description}</p>
          </div>

          {complaint.imageUrls && complaint.imageUrls.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Ảnh đính kèm ({complaint.imageUrls.length})</p>
              <div className="flex gap-2 flex-wrap">
                {complaint.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Ảnh ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border hover:opacity-90" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-1">Ghi chú admin</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Thêm ghi chú xử lý (không bắt buộc)..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex flex-wrap gap-2">
          {complaint.status === "pending" && complaint.type === "Không nhận hàng" && (
            <Button disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm" onClick={() => handle("investigate")}>
              <Search className="w-4 h-4 mr-1" /> Điều tra
            </Button>
          )}
          {complaint.status !== "resolved" && complaint.status !== "rejected" && (
            <>
              <Button disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white text-sm" onClick={() => handle("approve")}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Duyệt hoàn tiền
              </Button>
              <Button variant="outline" disabled={submitting} className="border-red-300 text-red-600 hover:bg-red-50 text-sm" onClick={() => handle("reject")}>
                <XCircle className="w-4 h-4 mr-1" /> Từ chối
              </Button>
            </>
          )}
          <Button variant="outline" className="text-sm ml-auto" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── main tab ─────────────────────────────────────────────────────────────────
export function ComplaintsTab() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complaintsService.getComplaints({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      // handle both paginated and plain array responses
      const items = res?.items ?? (Array.isArray(res) ? res : []);
      setComplaints(items);
      setTotal(res?.totalItems ?? items.length);
      setTotalPages(res?.totalPages ?? 1);
    } catch {
      toast.error("Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, debouncedSearch]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);
  useEffect(() => { setPage(1); }, [statusFilter, priorityFilter, debouncedSearch]);

  const handleAction = async (id: string, action: "approve" | "reject" | "investigate", note?: string) => {
    await complaintsService.action(id, { action, adminNote: note });
    const labels: Record<string, string> = {
      approve: "Đã duyệt hoàn tiền cho khách",
      reject: "Đã từ chối khiếu nại",
      investigate: "Chuyển sang điều tra",
    };
    toast.success(labels[action] ?? "Thành công");
    loadComplaints();
  };

  const pendingCount = complaints.filter(c => c.status === "pending").length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Queue Khiếu nại
              </CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap mt-1">
                <span>Tổng {total} khiếu nại · sắp xếp theo mức độ ưu tiên</span>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    {pendingCount} chờ duyệt
                  </span>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadComplaints} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo mã đơn, khách hàng, mart..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="investigating">Đang điều tra</SelectItem>
                <SelectItem value="resolved">Đã giải quyết</SelectItem>
                <SelectItem value="rejected">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="high">Ưu tiên cao</SelectItem>
                <SelectItem value="medium">Trung bình</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[100px]">Đơn #</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Mart</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="w-[110px]">Ưu tiên</TableHead>
                  <TableHead className="w-[130px]">Trạng thái</TableHead>
                  <TableHead className="w-[90px]">Chờ</TableHead>
                  <TableHead className="w-[90px] text-right pr-4">Xem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
                    </TableCell>
                  </TableRow>
                ) : complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                      Không có khiếu nại nào
                    </TableCell>
                  </TableRow>
                ) : complaints.map(c => (
                  <TableRow key={c.id} className={c.priority === "high" ? "bg-red-50/50" : undefined}>
                    <TableCell className="font-mono text-sm font-semibold text-gray-700">
                      #{c.orderNumber}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{c.customerName}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{c.customerAddress}</p>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{c.supplierName}</TableCell>
                    <TableCell className="text-sm text-gray-600">{c.type}</TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatElapsed(c.elapsedMinutes)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(c)} className="text-orange-600 hover:bg-orange-50">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile responsive cards */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
            ) : complaints.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Không có khiếu nại nào</p>
            ) : complaints.map(c => (
              <div key={c.id} className={`rounded-xl border p-4 bg-white shadow-sm ${c.priority === "high" ? "border-red-200" : "border-gray-100"}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-semibold text-sm text-gray-800">Đơn #{c.orderNumber}</span>
                    <span className="text-gray-400 text-sm"> · {c.type}</span>
                  </div>
                  <PriorityBadge priority={c.priority} />
                </div>
                <p className="text-sm text-gray-700">{c.customerName}</p>
                <p className="text-xs text-gray-400 mb-2">{c.supplierName} · {formatElapsed(c.elapsedMinutes)}</p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 mb-3 line-clamp-2">{c.description}</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={c.status} />
                  <Button variant="outline" size="sm" onClick={() => setSelected(c)} className="text-xs h-8">
                    <Eye className="w-3.5 h-3.5 mr-1" /> Xem & Xử lý
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <SimplePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="khiếu nại"
          />
        </CardContent>
      </Card>

      <ComplaintDetailDialog
        complaint={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onAction={handleAction}
      />
    </>
  );
}

export default ComplaintsTab;
