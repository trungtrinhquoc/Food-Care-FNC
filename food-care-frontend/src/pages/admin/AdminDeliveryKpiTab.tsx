import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  BarChart3,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminDeliveryApi } from '../../services/admin/adminDeliveryApi';
import type { DeliveryKpi } from '../../types/shipping';

export function AdminDeliveryKpiTab() {
  const [kpis, setKpis] = useState<DeliveryKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadKpis = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminDeliveryApi.getAllWarehouseKpis(
        fromDate || undefined,
        toDate || undefined
      );
      setKpis(data);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      toast.error('Không thể tải KPI');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  // Aggregate stats
  const totals = kpis.reduce(
    (acc, k) => ({
      totalDeliveries: acc.totalDeliveries + k.totalDeliveries,
      approvedCount: acc.approvedCount + k.approvedCount,
      completedCount: acc.completedCount + k.completedCount,
      cancelledCount: acc.cancelledCount + k.cancelledCount,
      onHoldCount: acc.onHoldCount + k.onHoldCount,
    }),
    { totalDeliveries: 0, approvedCount: 0, completedCount: 0, cancelledCount: 0, onHoldCount: 0 }
  );

  const avgCompliance = kpis.length > 0
    ? kpis.reduce((sum, k) => sum + k.supplierComplianceRate, 0) / kpis.length
    : 0;
  const avgOnTime = kpis.length > 0
    ? kpis.reduce((sum, k) => sum + k.onTimeDeliveryRate, 0) / kpis.length
    : 0;

  const formatPercent = (v: number) => `${(v * 100).toFixed(1)}%`;
  const formatHours = (v: number) => `${v.toFixed(1)}h`;

  const getComplianceColor = (rate: number) => {
    if (rate >= 0.9) return 'text-green-600';
    if (rate >= 0.7) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            KPI Giao hàng
          </h2>
          <p className="text-sm text-slate-500 mt-1">Thống kê hiệu suất giao hàng theo kho</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadKpis} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-slate-500">Từ ngày</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Đến ngày</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
            </div>
            {(fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setFromDate(''); setToDate(''); }}>
                Xoá bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{totals.totalDeliveries}</p>
            <p className="text-xs text-slate-500">Tổng lô hàng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{totals.approvedCount}</p>
            <p className="text-xs text-slate-500">Chờ duyệt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{totals.completedCount}</p>
            <p className="text-xs text-slate-500">Hoàn tất</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto text-red-500 mb-1" />
            <p className="text-2xl font-bold">{totals.cancelledCount}</p>
            <p className="text-xs text-slate-500">Từ chối</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{totals.onHoldCount}</p>
            <p className="text-xs text-slate-500">Tạm dừng</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${avgCompliance >= 0.9 ? 'bg-green-100' : avgCompliance >= 0.7 ? 'bg-amber-100' : 'bg-red-100'}`}>
              {avgCompliance >= 0.7 ? <TrendingUp className="w-6 h-6 text-green-600" /> : <TrendingDown className="w-6 h-6 text-red-600" />}
            </div>
            <div>
              <p className="text-sm text-slate-500">Tỷ lệ tuân thủ (TB)</p>
              <p className={`text-2xl font-bold ${getComplianceColor(avgCompliance)}`}>
                {formatPercent(avgCompliance)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${avgOnTime >= 0.9 ? 'bg-green-100' : avgOnTime >= 0.7 ? 'bg-amber-100' : 'bg-red-100'}`}>
              <Clock className={`w-6 h-6 ${avgOnTime >= 0.7 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Giao đúng hạn (TB)</p>
              <p className={`text-2xl font-bold ${getComplianceColor(avgOnTime)}`}>
                {formatPercent(avgOnTime)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Warehouse Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết theo Kho</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
              Đang tải...
            </div>
          ) : kpis.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Chưa có dữ liệu KPI</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kho</TableHead>
                  <TableHead className="text-right">Tổng</TableHead>
                  <TableHead className="text-right">Chờ duyệt</TableHead>
                  <TableHead className="text-right">Đã duyệt</TableHead>
                  <TableHead className="text-right">Từ chối</TableHead>
                  <TableHead className="text-right">Hoàn tất</TableHead>
                  <TableHead className="text-right">Tuân thủ</TableHead>
                  <TableHead className="text-right">Từ chối %</TableHead>
                  <TableHead className="text-right">Tranh chấp %</TableHead>
                  <TableHead className="text-right">Đúng hạn %</TableHead>
                  <TableHead className="text-right">TB duyệt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map((k) => (
                  <TableRow key={k.warehouseId}>
                    <TableCell className="font-medium">{k.warehouseName}</TableCell>
                    <TableCell className="text-right">{k.totalDeliveries}</TableCell>
                    <TableCell className="text-right">{k.approvedCount}</TableCell>
                    <TableCell className="text-right">{k.approvedCount}</TableCell>
                    <TableCell className="text-right">{k.cancelledCount}</TableCell>
                    <TableCell className="text-right">{k.completedCount}</TableCell>
                    <TableCell className={`text-right font-medium ${getComplianceColor(k.supplierComplianceRate)}`}>
                      {formatPercent(k.supplierComplianceRate)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">{formatPercent(k.rejectRate)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatPercent(k.disputeRate)}</TableCell>
                    <TableCell className={`text-right font-medium ${getComplianceColor(k.onTimeDeliveryRate)}`}>
                      {formatPercent(k.onTimeDeliveryRate)}
                    </TableCell>
                    <TableCell className="text-right">{formatHours(k.avgApprovalTimeMinutes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
