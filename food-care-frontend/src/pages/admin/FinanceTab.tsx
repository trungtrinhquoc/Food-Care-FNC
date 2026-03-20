import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import {
  DollarSign, TrendingUp, Wallet, RefreshCw, AlertTriangle,
  CheckCircle2, Loader2, BadgePercent,
} from "lucide-react";
import { financeService } from "../../services/admin/financeService";
import type { FinanceSummary, MartSettlement } from "../../types/admin";
import { toast } from "sonner";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M đ`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k đ`;
  return `${n.toLocaleString("vi-VN")} đ`;
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("vi-VN");
}

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass?: string;
  bgClass?: string;
  warning?: boolean;
}
function KpiCard({ title, value, sub, icon: Icon, iconClass = "text-green-600", bgClass = "bg-green-100", warning }: KpiCardProps) {
  return (
    <Card className={`shadow-sm ${warning ? "border-orange-300" : ""}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{title}</p>
            <p className={`text-xl font-bold ${warning ? "text-orange-600" : "text-gray-800"}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-9 h-9 rounded-lg ${bgClass} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${iconClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── confirm modal ─────────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean;
  totalDue: number;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}
function SettleConfirmModal({ open, totalDue, count, onConfirm, onCancel, loading }: ConfirmProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Xác nhận thanh toán</h3>
        <p className="text-sm text-gray-600 mb-4">
          Bạn sẽ thanh toán cho <strong>{count} mart</strong>, tổng cộng{" "}
          <strong className="text-green-600">{fmtCurrency(totalDue)}</strong>.
          <br />Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>Hủy</Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Đang xử lý…</>
              : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Xác nhận</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── main tab ─────────────────────────────────────────────────────────────────
export function FinanceTab() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [settlements, setSettlements] = useState<MartSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([
        financeService.getSummary(month, year),
        financeService.getSettlements(month, year),
      ]);
      setSummary(s);
      setSettlements(Array.isArray(st) ? st : st?.items ?? []);
    } catch {
      toast.error("Không thể tải dữ liệu tài chính");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSettleAll = async () => {
    setSettling(true);
    try {
      await financeService.settleAll(month, year);
      toast.success("Đã thanh toán thành công cho tất cả mart!");
      setShowConfirm(false);
      loadData();
    } catch {
      toast.error("Lỗi khi thanh toán. Vui lòng thử lại.");
    } finally {
      setSettling(false);
    }
  };

  const unpaid = settlements.filter(s => !s.isPaid);
  const totalDue = unpaid.reduce((sum, s) => sum + s.amountDue, 0);

  const monthLabel = `Tháng ${month}/${year}`;
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      <div className="space-y-5">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tài chính tổng hợp</h2>
            <p className="text-sm text-gray-500 mt-0.5">{monthLabel} · F&amp;C nhận hoa hồng từ mỗi đơn thành công</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => (
                  <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[now.getFullYear(), now.getFullYear() - 1].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <div className="h-6 bg-gray-100 rounded animate-pulse mb-2 w-3/4" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="GMV"
              value={fmtShort(summary?.gmv ?? 0)}
              sub="Tổng giá trị giao dịch"
              icon={TrendingUp}
              iconClass="text-blue-600"
              bgClass="bg-blue-100"
            />
            <KpiCard
              title="Hoa hồng F&C"
              value={fmtShort(summary?.fAndCRevenue ?? 0)}
              sub="Doanh thu thực nhận"
              icon={BadgePercent}
              iconClass="text-green-600"
              bgClass="bg-green-100"
            />
            <KpiCard
              title="Tổng tiền ví user"
              value={fmtShort(summary?.totalWalletBalance ?? 0)}
              sub={`Dự phòng 10% = ${fmtShort(summary?.walletReserveMin ?? 0)}`}
              icon={Wallet}
              iconClass="text-orange-600"
              bgClass="bg-orange-100"
              warning={(summary?.totalWalletBalance ?? 0) > 0}
            />
            <KpiCard
              title="Đã hoàn tiền"
              value={fmtShort(summary?.totalRefunded ?? 0)}
              sub="Refund trong kỳ"
              icon={DollarSign}
              iconClass="text-purple-600"
              bgClass="bg-purple-100"
            />
          </div>
        )}

        {/* Wallet warning */}
        {!loading && (summary?.totalWalletBalance ?? 0) > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              <strong>Lưu ý:</strong> Tiền ví user ({fmtCurrency(summary!.totalWalletBalance)}) là tiền F&amp;C đang giữ hộ.
              Dự phòng tối thiểu 10% = <strong>{fmtCurrency(summary!.walletReserveMin)}</strong> phải giữ trong tài khoản.
            </p>
          </div>
        )}

        {/* Settlement table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Đối soát mart — {monthLabel}
                </CardTitle>
                <CardDescription>
                  {unpaid.length} mart cần thanh toán · Tổng{" "}
                  <strong className="text-green-600">{fmtCurrency(totalDue)}</strong>
                </CardDescription>
              </div>
              {unpaid.length > 0 && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Thanh toán tất cả mart
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Desktop table */}
            <div className="hidden md:block rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Mart</TableHead>
                    <TableHead className="w-[130px] text-right">Doanh thu</TableHead>
                    <TableHead className="w-[110px] text-right">Hoa hồng %</TableHead>
                    <TableHead className="w-[130px] text-right">Hoa hồng</TableHead>
                    <TableHead className="w-[140px] text-right font-semibold">Cần thanh toán</TableHead>
                    <TableHead className="w-[110px] text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
                      </TableCell>
                    </TableRow>
                  ) : settlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                        Không có dữ liệu đối soát cho kỳ này
                      </TableCell>
                    </TableRow>
                  ) : settlements.map(s => (
                    <TableRow key={s.supplierId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">🏪</div>
                          <span className="font-medium text-sm text-gray-800">{s.storeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700">{fmtCurrency(s.totalSales)}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">{s.commissionRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-sm text-red-600">−{fmtCurrency(s.commissionAmount)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{fmtCurrency(s.amountDue)}</TableCell>
                      <TableCell className="text-center">
                        {s.isPaid
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Đã trả</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Chờ trả</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total row */}
                  {settlements.length > 0 && (
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell colSpan={4} className="text-right text-sm text-gray-700">Tổng cần thanh toán</TableCell>
                      <TableCell className="text-right text-green-600">{fmtCurrency(totalDue)}</TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile responsive cards */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
              ) : settlements.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Không có dữ liệu</p>
              ) : settlements.map(s => (
                <div key={s.supplierId} className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm">🏪</div>
                      <span className="font-semibold text-sm text-gray-800">{s.storeName}</span>
                    </div>
                    {s.isPaid
                      ? <span className="text-xs font-medium text-green-600">Đã trả</span>
                      : <span className="text-xs font-medium text-yellow-600">Chờ trả</span>
                    }
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Doanh thu</span><span className="font-medium text-gray-700">{fmtCurrency(s.totalSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hoa hồng ({s.commissionRate.toFixed(1)}%)</span>
                      <span className="font-medium text-red-600">−{fmtCurrency(s.commissionAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
                      <span className="font-semibold text-gray-700">Cần thanh toán</span>
                      <span className="font-bold text-green-600">{fmtCurrency(s.amountDue)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {unpaid.length > 0 && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                  onClick={() => setShowConfirm(true)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Thanh toán tất cả mart ({fmtShort(totalDue)})
                </Button>
              )}
            </div>

            {!loading && settlements.length > 0 && unpaid.length === 0 && (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                <p className="text-sm font-medium text-gray-700">Đã đối soát xong kỳ {monthLabel}</p>
                <p className="text-xs text-gray-400 mt-0.5">Tất cả mart đã được thanh toán</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm modal */}
      <SettleConfirmModal
        open={showConfirm}
        totalDue={totalDue}
        count={unpaid.length}
        onConfirm={handleSettleAll}
        onCancel={() => setShowConfirm(false)}
        loading={settling}
      />
    </>
  );
}

export default FinanceTab;
