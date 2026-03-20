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
  Store, AlertTriangle, Star, RefreshCw, Search, Plus, Loader2,
  TrendingUp, ShieldCheck, ShieldAlert, X,
} from "lucide-react";
import api from "../../services/api";
import type { MartSummary } from "../../types/admin";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "sonner";

// ── SLA progress bar ──────────────────────────────────────────────────────────
function SlaBar({ rate }: { rate: number }) {
  const color =
    rate >= 97 ? "bg-green-500" :
    rate >= 95 ? "bg-yellow-400" :
    "bg-red-500";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full transition-all`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${rate < 95 ? "text-red-600" : "text-gray-700"}`}>
        {rate.toFixed(0)}%
      </span>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-sm font-medium text-gray-700">
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      {rating.toFixed(1)}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Hoạt động</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Tạm ngưng</span>;
}

// ── MartDetailDialog ─────────────────────────────────────────────────────────
interface MartDetailDialogProps {
  mart: MartSummary;
  onClose: () => void;
  onRefresh: () => void;
}

function MartDetailDialog({ mart, onClose, onRefresh }: MartDetailDialogProps) {
  const [commissionInput, setCommissionInput] = useState(
    mart.commissionRate != null ? String((mart.commissionRate * 100).toFixed(2)) : ""
  );
  const [commissionLoading, setCommissionLoading] = useState(false);

  // Suspend state
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Unsuspend state
  const [unsuspendLoading, setUnsuspendLoading] = useState(false);

  const handleUpdateCommission = async () => {
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Tỷ lệ hoa hồng phải là số từ 0 đến 100 (%)");
      return;
    }
    setCommissionLoading(true);
    try {
      await api.patch(`/admin/suppliers/${mart.id}/commission`, { commissionRate: rate / 100 });
      toast.success("Cập nhật tỷ lệ hoa hồng thành công");
      onRefresh();
    } catch {
      toast.error("Không thể cập nhật tỷ lệ hoa hồng");
    } finally {
      setCommissionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Vui lòng nhập lý do tạm ngừng");
      return;
    }
    setSuspendLoading(true);
    try {
      await api.patch(`/admin/suppliers/${mart.id}/suspend`, { reason: suspendReason.trim() });
      toast.success("Mart đã được tạm ngừng");
      onRefresh();
      onClose();
    } catch {
      toast.error("Không thể tạm ngừng mart");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    setUnsuspendLoading(true);
    try {
      await api.patch(`/admin/suppliers/${mart.id}/unsuspend`);
      toast.success("Mart đã được kích hoạt lại");
      onRefresh();
      onClose();
    } catch {
      toast.error("Không thể kích hoạt lại mart");
    } finally {
      setUnsuspendLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">🏪</div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg leading-tight">{mart.storeName}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusBadge active={mart.isActive} />
                {mart.isTop && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Top</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Info Section */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông tin mart</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Rating</p>
                <RatingStars rating={mart.rating} />
                {mart.rating < 4.0 && (
                  <p className="text-[10px] text-amber-600 mt-0.5 font-medium">Dưới ngưỡng 4.0</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">SLA thành công</p>
                <SlaBar rate={mart.slaComplianceRate} />
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Đơn/tháng</p>
                <span className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  {mart.monthlyOrders} đơn
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Trạng thái</p>
                <StatusBadge active={mart.isActive} />
              </div>
            </div>
          </section>

          {/* Commission Rate Editor */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tỷ lệ hoa hồng</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-3">
                Hiện tại:{" "}
                <span className="font-semibold text-gray-800">
                  {mart.commissionRate != null
                    ? `${(mart.commissionRate * 100).toFixed(2)}%`
                    : "Chưa cài đặt"}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={commissionInput}
                    onChange={e => setCommissionInput(e.target.value)}
                    placeholder="Nhập % hoa hồng (VD: 12)"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                </div>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap"
                  onClick={handleUpdateCommission}
                  disabled={commissionLoading}
                >
                  {commissionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cập nhật"}
                </Button>
              </div>
            </div>
          </section>

          {/* Suspend / Unsuspend Section */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quản lý trạng thái</h3>
            {mart.isActive ? (
              <div className="space-y-3">
                {!showSuspendForm ? (
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    onClick={() => setShowSuspendForm(true)}
                  >
                    Tạm ngừng mart
                  </Button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-800">Lý do tạm ngừng</p>
                    <textarea
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                      rows={3}
                      placeholder="Nhập lý do tạm ngừng mart..."
                      value={suspendReason}
                      onChange={e => setSuspendReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleSuspend}
                        disabled={suspendLoading}
                      >
                        {suspendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận tạm ngừng"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowSuspendForm(false); setSuspendReason(""); }}
                        disabled={suspendLoading}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700 mb-3">Mart này đang bị tạm ngừng. Bạn có muốn kích hoạt lại?</p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleUnsuspend}
                  disabled={unsuspendLoading}
                >
                  {unsuspendLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Kích hoạt lại mart
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ── main tab ─────────────────────────────────────────────────────────────────
export function MartTab() {
  const [marts, setMarts] = useState<MartSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMart, setSelectedMart] = useState<MartSummary | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const loadMarts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/suppliers/mart-list");
      const data: MartSummary[] = res?.data?.items ?? res?.data ?? [];
      setMarts(data);
    } catch {
      toast.error("Không thể tải danh sách mart");
      setMarts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMarts(); }, [loadMarts]);

  // Client-side filter
  const filtered = marts.filter(m => {
    const matchSearch = !debouncedSearch ||
      m.storeName.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && m.isActive) ||
      (statusFilter === "inactive" && !m.isActive) ||
      (statusFilter === "warning" && m.hasSlaWarning) ||
      (statusFilter === "rating" && m.rating < 4.0);
    return matchSearch && matchStatus;
  });

  const activeMarts = marts.filter(m => m.isActive).length;
  const slaWarnings = marts.filter(m => m.hasSlaWarning);
  const ratingWarnings = marts.filter(m => m.rating < 4.0);
  const avgRating = marts.length > 0
    ? (marts.reduce((s, m) => s + m.rating, 0) / marts.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-5">
      {/* SLA warning banner */}
      {slaWarnings.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800 mb-1">
              {slaWarnings.length} mart đang vi phạm SLA
            </p>
            <ul className="text-sm text-orange-700 space-y-0.5">
              {slaWarnings.map(m => (
                <li key={m.id}>
                  <span className="font-medium">{m.storeName}</span>: tỷ lệ thành công{" "}
                  <span className="font-bold">{m.slaComplianceRate.toFixed(0)}%</span>{" "}
                  (ngưỡng tối thiểu 95%)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Rating warning banner */}
      {ratingWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 fill-amber-300" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">
              {ratingWarnings.length} mart có đánh giá dưới 4.0
            </p>
            <ul className="text-sm text-amber-700 space-y-0.5">
              {ratingWarnings.map(m => (
                <li key={m.id}>
                  <span className="font-medium">{m.storeName}</span>: rating{" "}
                  <span className="font-bold">{m.rating.toFixed(1)}</span>{" "}
                  (ngưỡng tối thiểu 4.0)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* KPI summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold text-gray-800">{marts.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Tổng mart</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold text-green-600">{activeMarts}</p>
            <p className="text-xs text-gray-500 mt-0.5">Đang hoạt động</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className={`text-2xl font-bold ${slaWarnings.length > 0 ? "text-red-500" : "text-gray-800"}`}>
              {slaWarnings.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Vi phạm SLA</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-2xl font-bold text-yellow-500">{avgRating}</p>
            <p className="text-xs text-gray-500 mt-0.5">Rating trung bình</p>
          </CardContent>
        </Card>
      </div>

      {/* Main table card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-500" />
                Quản lý Mart
              </CardTitle>
              <CardDescription>
                {activeMarts} mart hoạt động · SLA tối thiểu 95% thành công
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadMarts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => toast.info("Tính năng onboard mart đang phát triển")}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Onboard mart mới
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên mart..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[190px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm ngưng</SelectItem>
                <SelectItem value="warning">Vi phạm SLA</SelectItem>
                <SelectItem value="rating">Rating dưới 4.0</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Mart</TableHead>
                  <TableHead className="w-[90px]">Rating</TableHead>
                  <TableHead className="w-[180px]">SLA Thành công</TableHead>
                  <TableHead className="w-[120px]">Đơn/tháng</TableHead>
                  <TableHead className="w-[110px]">Trạng thái</TableHead>
                  <TableHead className="w-[130px] text-right pr-4">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                      Không tìm thấy mart nào
                    </TableCell>
                  </TableRow>
                ) : filtered.map(m => (
                  <TableRow
                    key={m.id}
                    className={m.hasSlaWarning ? "bg-red-50/40" : undefined}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-base flex-shrink-0">
                          🏪
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-gray-800">{m.storeName}</span>
                            {m.isTop && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">
                                Top
                              </span>
                            )}
                            {m.hasSlaWarning && (
                              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                            )}
                            {!m.hasSlaWarning && m.isActive && (
                              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            )}
                            {m.rating < 4.0 && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><RatingStars rating={m.rating} /></TableCell>
                    <TableCell><SlaBar rate={m.slaComplianceRate} /></TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-gray-700">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                        {m.monthlyOrders} đơn
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge active={m.isActive} /></TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        {m.hasSlaWarning && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            SLA
                          </span>
                        )}
                        {m.rating < 4.0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-600">
                            Rating
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setSelectedMart(m)}
                        >
                          Chi tiết
                        </Button>
                      </div>
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
            ) : filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Không tìm thấy mart nào</p>
            ) : filtered.map(m => (
              <div key={m.id} className={`rounded-xl border p-4 bg-white shadow-sm ${m.hasSlaWarning ? "border-red-200" : "border-gray-100"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">🏪</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{m.storeName}</span>
                      {m.isTop && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Top</span>}
                      {m.hasSlaWarning && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">⚠ SLA</span>}
                      {m.rating < 4.0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">⭐ Rating</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <RatingStars rating={m.rating} />
                      <span>·</span>
                      <span>{m.monthlyOrders} đơn/tháng</span>
                    </div>
                  </div>
                  <StatusBadge active={m.isActive} />
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-gray-400">SLA thành công</p>
                  <SlaBar rate={m.slaComplianceRate} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => setSelectedMart(m)}
                >
                  Chi tiết
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      {selectedMart && (
        <MartDetailDialog
          mart={selectedMart}
          onClose={() => setSelectedMart(null)}
          onRefresh={loadMarts}
        />
      )}
    </div>
  );
}

export default MartTab;
