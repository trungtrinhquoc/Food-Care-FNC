import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import {
  Percent, TrendingUp, DollarSign, RefreshCw, Loader2, Trash2,
  Users, ShoppingCart, FileText,
} from "lucide-react";
import { adminCommissionService } from "../../services/admin/adminCommissionService";
import type {
  CommissionPolicy, CommissionReport, OrderCommission, PagedResult,
} from "../../types/admin";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M đ`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k đ`;
  return `${n.toLocaleString("vi-VN")} đ`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending:  { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ xử lý" },
    settled:  { bg: "bg-green-100",  text: "text-green-700",  label: "Đã thanh toán" },
    refunded: { bg: "bg-red-100",    text: "text-red-700",    label: "Hoàn tiền" },
  };
  const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CommissionTab() {
  // State
  const [policies, setPolicies] = useState<CommissionPolicy[]>([]);
  const [report, setReport] = useState<CommissionReport | null>(null);
  const [orders, setOrders] = useState<PagedResult<OrderCommission> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Default rate form
  const [defaultRate, setDefaultRate] = useState("");
  const [defaultDesc, setDefaultDesc] = useState("");
  const [savingDefault, setSavingDefault] = useState(false);

  // Per-supplier form
  const [supplierId, setSupplierId] = useState("");
  const [supplierRate, setSupplierRate] = useState("");
  const [supplierDesc, setSupplierDesc] = useState("");
  const [savingSupplier, setSavingSupplier] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadPolicies = useCallback(async () => {
    try {
      const data = await adminCommissionService.getPolicies();
      setPolicies(data);
      const global = data.find(p => p.supplierId === null && p.isActive);
      if (global) setDefaultRate(String(global.commissionRate));
    } catch {
      toast.error("Không thể tải chính sách hoa hồng");
    }
  }, []);

  const loadReport = useCallback(async () => {
    try {
      const data = await adminCommissionService.getReport(month, year);
      setReport(data);
    } catch {
      toast.error("Không thể tải báo cáo hoa hồng");
    }
  }, [month, year]);

  const loadOrders = useCallback(async () => {
    try {
      const data = await adminCommissionService.getOrderCommissions({
        month, year, page, pageSize: 10,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setOrders(data);
    } catch {
      toast.error("Không thể tải danh sách hoa hồng đơn hàng");
    }
  }, [month, year, page, statusFilter]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPolicies(), loadReport(), loadOrders()]);
    setLoading(false);
  }, [loadPolicies, loadReport, loadOrders]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSetDefault = async () => {
    const rate = parseFloat(defaultRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Tỷ lệ hoa hồng phải từ 0 đến 100%");
      return;
    }
    setSavingDefault(true);
    try {
      await adminCommissionService.setDefaultRate({
        rate,
        description: defaultDesc || undefined,
      });
      toast.success("Cập nhật tỷ lệ mặc định thành công");
      setDefaultDesc("");
      await loadPolicies();
    } catch {
      toast.error("Không thể cập nhật tỷ lệ mặc định");
    } finally {
      setSavingDefault(false);
    }
  };

  const handleSetSupplierRate = async () => {
    const id = parseInt(supplierId);
    const rate = parseFloat(supplierRate);
    if (isNaN(id) || id <= 0) {
      toast.error("Vui lòng nhập ID nhà cung cấp hợp lệ");
      return;
    }
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Tỷ lệ hoa hồng phải từ 0 đến 100%");
      return;
    }
    setSavingSupplier(true);
    try {
      await adminCommissionService.setSupplierRate(id, {
        rate,
        description: supplierDesc || undefined,
      });
      toast.success("Cập nhật tỷ lệ cho nhà cung cấp thành công");
      setSupplierId("");
      setSupplierRate("");
      setSupplierDesc("");
      await loadPolicies();
    } catch {
      toast.error("Không thể cập nhật tỷ lệ nhà cung cấp");
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleDeletePolicy = async (policyId: number) => {
    try {
      await adminCommissionService.deletePolicy(policyId);
      toast.success("Đã vô hiệu hóa chính sách");
      await loadPolicies();
    } catch {
      toast.error("Không thể xóa chính sách");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-500">Đang tải dữ liệu hoa hồng…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Quản lý Hoa hồng</h2>
          <p className="text-sm text-gray-500">Thiết lập tỷ lệ hoa hồng và theo dõi doanh thu</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={v => { setMonth(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>Tháng {i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => { setYear(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw className="w-4 h-4 mr-1" /> Làm mới
          </Button>
        </div>
      </div>

      {/* ── Report Summary Cards ────────────────────────────────────────── */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-500">Tổng đơn hàng</span>
              </div>
              <p className="text-xl font-bold text-gray-800">{report.totalOrderCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtCurrency(report.totalOrderAmount)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-gray-500">Tổng hoa hồng</span>
              </div>
              <p className="text-xl font-bold text-emerald-700">{fmtCurrency(report.totalCommissionAmount)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-500">Trả NCC</span>
              </div>
              <p className="text-xl font-bold text-gray-800">{fmtCurrency(report.totalSupplierAmount)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-gray-500">Trạng thái</span>
              </div>
              <div className="flex gap-2 text-xs mt-1">
                <span className="text-yellow-600">{report.pendingCount} chờ</span>
                <span className="text-green-600">{report.settledCount} đã TT</span>
                <span className="text-red-600">{report.refundedCount} hoàn</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Policies + Settings Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Default Rate Setting */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              Tỷ lệ mặc định
            </CardTitle>
            <CardDescription className="text-xs">Áp dụng cho tất cả NCC chưa có tỷ lệ riêng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Tỷ lệ hoa hồng (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={defaultRate}
                onChange={e => setDefaultRate(e.target.value)}
                placeholder="VD: 10"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Mô tả (tùy chọn)</Label>
              <Input
                value={defaultDesc}
                onChange={e => setDefaultDesc(e.target.value)}
                placeholder="Ghi chú..."
              />
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="sm"
              onClick={handleSetDefault}
              disabled={savingDefault}
            >
              {savingDefault && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Lưu tỷ lệ mặc định
            </Button>
          </CardContent>
        </Card>

        {/* Per-Supplier Rate Setting */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Tỷ lệ theo NCC
            </CardTitle>
            <CardDescription className="text-xs">Ghi đè tỷ lệ mặc định cho NCC cụ thể</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Supplier ID</Label>
              <Input
                type="number"
                min={1}
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                placeholder="VD: 1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Tỷ lệ hoa hồng (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={supplierRate}
                onChange={e => setSupplierRate(e.target.value)}
                placeholder="VD: 12"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Mô tả (tùy chọn)</Label>
              <Input
                value={supplierDesc}
                onChange={e => setSupplierDesc(e.target.value)}
                placeholder="Ghi chú..."
              />
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
              onClick={handleSetSupplierRate}
              disabled={savingSupplier}
            >
              {savingSupplier && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Lưu tỷ lệ NCC
            </Button>
          </CardContent>
        </Card>

        {/* Policies Table */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              Chính sách hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có chính sách nào</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {policies.filter(p => p.isActive).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <p className="font-medium">
                        {p.supplierId ? p.supplierName ?? `NCC #${p.supplierId}` : "Mặc định (toàn hệ thống)"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.commissionRate}% — từ {p.effectiveFrom}
                        {p.description && ` — ${p.description}`}
                      </p>
                    </div>
                    {p.supplierId && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePolicy(p.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── By-Supplier Breakdown ───────────────────────────────────────── */}
      {report && report.bySupplier.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Chi tiết theo nhà cung cấp</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NCC</TableHead>
                  <TableHead className="text-right">Tỷ lệ</TableHead>
                  <TableHead className="text-right">Doanh số</TableHead>
                  <TableHead className="text-right">Hoa hồng</TableHead>
                  <TableHead className="text-right">Trả NCC</TableHead>
                  <TableHead className="text-right">Đơn hàng</TableHead>
                  <TableHead className="text-right">Chờ TT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.bySupplier.map(s => (
                  <TableRow key={s.supplierId}>
                    <TableCell className="font-medium">{s.supplierName}</TableCell>
                    <TableCell className="text-right">{s.effectiveRate}%</TableCell>
                    <TableCell className="text-right">{fmtCurrency(s.totalSales)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{fmtCurrency(s.totalCommission)}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(s.totalDue)}</TableCell>
                    <TableCell className="text-right">{s.orderCount}</TableCell>
                    <TableCell className="text-right">{s.pendingCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Commission Orders Table ─────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Hoa hồng theo đơn hàng</CardTitle>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="settled">Đã thanh toán</SelectItem>
                <SelectItem value="refunded">Hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!orders || orders.items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Không có dữ liệu hoa hồng</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead>NCC</TableHead>
                    <TableHead className="text-right">Giá trị đơn</TableHead>
                    <TableHead className="text-right">Tỷ lệ</TableHead>
                    <TableHead className="text-right">Hoa hồng</TableHead>
                    <TableHead className="text-right">Trả NCC</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.items.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.orderId.slice(0, 8)}…</TableCell>
                      <TableCell>{o.supplierName}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(o.orderAmount)}</TableCell>
                      <TableCell className="text-right">{o.commissionRate}%</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">{fmtCurrency(o.commissionAmount)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(o.supplierAmount)}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {orders.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">
                    Trang {orders.page} / {orders.totalPages} — {orders.totalItems} bản ghi
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= orders.totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
