import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  ArrowLeft,
  Package,
  Building2,
  ShoppingCart,
  FileText,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  CalendarCheck,
  Search,
} from 'lucide-react';
import { inboundSessionApi } from '../../services/staff/staffApi';
import type { InboundSession, InboundReceipt } from '../../types/staff';

// Colors
const colors = {
  primary: '#485550',
  accent: '#C0EB6A',
  white: '#FFFFFF',
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  Completed: { label: 'Hoàn thành', color: '#10B981', bgColor: '#D1FAE5', icon: CheckCircle },
  Cancelled: { label: 'Đã huỷ', color: '#EF4444', bgColor: '#FEE2E2', icon: XCircle },
};

export function InboundHistoryManager() {
  const [sessions, setSessions] = useState<InboundSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<InboundSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('Completed');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inboundSessionApi.getAll(page, 20, undefined, filterStatus || undefined);
      // Filter to only completed and cancelled sessions
      const historySessions = (result.items || []).filter(
        (s: InboundSession) => s.status === 'Completed' || s.status === 'Cancelled'
      );
      setSessions(historySessions);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error('Error fetching inbound history:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSelectSession = async (session: InboundSession) => {
    try {
      const detail = await inboundSessionApi.getById(session.id);
      setSelectedSession(detail);
    } catch {
      setSelectedSession(session);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Filter by search query
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.sessionCode.toLowerCase().includes(q) ||
      (s.warehouseName || '').toLowerCase().includes(q) ||
      (s.createdByName || '').toLowerCase().includes(q)
    );
  });

  // =====================================================
  // RENDER: SESSION LIST
  // =====================================================

  const renderSessionList = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
            Lịch sử nhập kho
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các phiên nhập kho đã hoàn thành hoặc đã huỷ
          </p>
        </div>
        <Button variant="outline" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {[
            { value: 'Completed', label: 'Hoàn thành', color: '#10B981' },
            { value: 'Cancelled', label: 'Đã huỷ', color: '#EF4444' },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filterStatus === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setFilterStatus(f.value); setPage(1); }}
              style={filterStatus === f.value ? { backgroundColor: colors.primary, color: colors.white } : {}}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã phiên, kho, người tạo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
            <p className="text-gray-500">Đang tải...</p>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Chưa có phiên nhập kho nào {filterStatus === 'Completed' ? 'hoàn thành' : 'đã huỷ'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiên</TableHead>
                <TableHead>Kho</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead>NCC</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày hoàn thành</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => {
                const cfg = statusConfig[session.status] || statusConfig.Completed;
                const StatusIcon = cfg.icon;
                return (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSelectSession(session)}
                  >
                    <TableCell className="font-mono font-medium">{session.sessionCode}</TableCell>
                    <TableCell>{session.warehouseName || '—'}</TableCell>
                    <TableCell>{session.createdByName || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.totalSuppliers} NCC</Badge>
                    </TableCell>
                    <TableCell>{session.totalItems} SP / {session.totalQuantity} đơn vị</TableCell>
                    <TableCell className="font-medium">{formatCurrency(session.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge
                        className="flex items-center gap-1 w-fit"
                        style={{ backgroundColor: cfg.bgColor, color: cfg.color, border: 'none' }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(session.completedAt || session.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Trước
          </Button>
          <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Sau
          </Button>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDER: SESSION DETAIL
  // =====================================================

  const renderSessionDetail = () => {
    if (!selectedSession) return null;
    const cfg = statusConfig[selectedSession.status] || statusConfig.Completed;
    const StatusIcon = cfg.icon;

    return (
      <div className="space-y-4">
        {/* Back + Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Quay lại
            </Button>
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
                {selectedSession.sessionCode}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedSession.warehouseName} — {formatDate(selectedSession.createdAt)}
              </p>
            </div>
            <Badge
              className="flex items-center gap-1"
              style={{ backgroundColor: cfg.bgColor, color: cfg.color, border: 'none' }}
            >
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleSelectSession(selectedSession)}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Làm mới
          </Button>
        </div>

        {/* Info banner */}
        <Card className="border-l-4" style={{ borderLeftColor: cfg.color }}>
          <CardContent className="py-3">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Hoàn thành:</span>
                <span className="font-medium">{formatDate(selectedSession.completedAt || selectedSession.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Người tạo:</span>
                <span className="font-medium">{selectedSession.createdByName || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Nhà cung cấp</p>
                  <p className="text-lg font-bold">{selectedSession.totalSuppliers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500">Sản phẩm</p>
                  <p className="text-lg font-bold">{selectedSession.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Tổng SL</p>
                  <p className="text-lg font-bold">{selectedSession.totalQuantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Tổng tiền</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedSession.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedSession.note && (
          <Card className="bg-gray-50">
            <CardContent className="py-3">
              <p className="text-sm text-gray-600">{selectedSession.note}</p>
            </CardContent>
          </Card>
        )}

        {/* Receipts by Supplier */}
        {(!selectedSession.receipts || selectedSession.receipts.length === 0) ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Không có dữ liệu sản phẩm</p>
            </CardContent>
          </Card>
        ) : (
          selectedSession.receipts.map((receipt) => renderReceiptCard(receipt))
        )}
      </div>
    );
  };

  // =====================================================
  // RENDER: RECEIPT CARD (per supplier)
  // =====================================================

  const renderReceiptCard = (receipt: InboundReceipt) => {
    const receiptStatusCfg: Record<string, { label: string; color: string; bgColor: string }> = {
      Pending: { label: 'Chờ xác nhận', color: '#F59E0B', bgColor: '#FEF3C7' },
      Confirmed: { label: 'Đã xác nhận', color: '#3B82F6', bgColor: '#DBEAFE' },
      Completed: { label: 'Hoàn thành', color: '#10B981', bgColor: '#D1FAE5' },
      Cancelled: { label: 'Đã huỷ', color: '#EF4444', bgColor: '#FEE2E2' },
    };
    const rCfg = receiptStatusCfg[receipt.status] || receiptStatusCfg.Completed;

    return (
      <Card key={receipt.id} className="border-l-4" style={{ borderLeftColor: rCfg.color }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {receipt.supplierName || `NCC #${receipt.supplierId}`}
              </CardTitle>
              <CardDescription className="font-mono">{receipt.receiptCode}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge style={{ backgroundColor: rCfg.bgColor, color: rCfg.color, border: 'none' }}>
                {rCfg.label}
              </Badge>
              <span className="text-sm font-medium">{formatCurrency(receipt.totalAmount)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {receipt.details.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Không có sản phẩm</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead>Lô / HSD</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell className="font-medium">
                      {detail.productName || detail.productId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-right">
                      {detail.quantity} {detail.unit || ''}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(detail.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(detail.lineTotal)}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {detail.batchNumber && <span>Lô: {detail.batchNumber}</span>}
                      {detail.expiryDate && (
                        <span className="ml-2">HSD: {new Date(detail.expiryDate).toLocaleDateString('vi-VN')}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-[120px] truncate">
                      {detail.note || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="p-0">
      {selectedSession ? renderSessionDetail() : renderSessionList()}
    </div>
  );
}
