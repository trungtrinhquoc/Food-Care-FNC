import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  FileText,
  RefreshCw,
  Loader2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminDeliveryApi } from '../../services/admin/adminDeliveryApi';
import type { AdminActionLog } from '../../types/shipping';
import { SHIPMENT_STATUS_CONFIG as STATUS_CONFIG } from '../../types/shipping';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  Approved: { label: 'Phê duyệt', color: 'bg-green-100 text-green-700' },
  Rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
  Hold: { label: 'Tạm dừng', color: 'bg-amber-100 text-amber-700' },
  Resume: { label: 'Tiếp tục', color: 'bg-blue-100 text-blue-700' },
  Override: { label: 'Thay đổi TT', color: 'bg-purple-100 text-purple-700' },
  ForceClose: { label: 'Đóng bắt buộc', color: 'bg-gray-200 text-gray-700' },
};

export function AdminAuditLogTab() {
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchEntity, setSearchEntity] = useState('');
  const PAGE_SIZE = 20;

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminDeliveryApi.getAuditLog({
        page,
        pageSize: PAGE_SIZE,
        action: actionFilter || undefined,
        entityId: searchEntity || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setLogs(data.items || []);
      setTotal(data.totalCount ?? data.totalItems ?? 0);
    } catch (error) {
      console.error('Error loading audit log:', error);
      toast.error('Không thể tải nhật ký');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, fromDate, toDate, searchEntity]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionBadge = (action: string) => {
    const cfg = ACTION_LABELS[action] || { label: action, color: 'bg-gray-100 text-gray-600' };
    return <Badge className={`${cfg.color} border-0`}>{cfg.label}</Badge>;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    return <Badge className={`${cfg.bgColor} ${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600" />
            Nhật ký Quản trị
          </h2>
          <p className="text-sm text-slate-500 mt-1">Theo dõi mọi thao tác quản trị trên luồng giao hàng</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm theo mã lô..."
                value={searchEntity}
                onChange={(e) => { setSearchEntity(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Hành động</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Tất cả</option>
                {Object.entries(ACTION_LABELS).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Từ ngày</label>
              <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="w-40" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Đến ngày</label>
              <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="w-40" />
            </div>
            {(actionFilter || fromDate || toDate || searchEntity) && (
              <Button variant="ghost" size="sm" onClick={() => { setActionFilter(''); setFromDate(''); setToDate(''); setSearchEntity(''); setPage(1); }}>
                Xoá bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
              Đang tải...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Chưa có nhật ký</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Lý do</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.adminName}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div>
                        <span className="text-xs text-slate-400">{log.entityType}</span>
                        <br />
                        <span className="font-mono text-xs">{log.entityId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(log.oldStatus)}
                        {log.oldStatus && log.newStatus && <ArrowRight className="w-3 h-3 text-slate-400" />}
                        {getStatusBadge(log.newStatus)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-slate-600">
                      {log.reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Trước
          </Button>
          <span className="px-3 py-1 text-sm text-slate-600">
            Trang {page} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          <Button size="sm" variant="outline" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
