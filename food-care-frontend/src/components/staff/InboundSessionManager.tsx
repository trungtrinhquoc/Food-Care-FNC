import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Package,
  Trash2,
  Edit,
  ArrowLeft,
  FileText,
  Building2,
  ShoppingCart,
} from 'lucide-react';

import { inboundSessionApi } from '../../services/staff/staffApi';
import { warehouseApi } from '../../services/staff/staffApi';
import { staffMemberApi } from '../../services/staff/staffApi';
import type {
  InboundSession,
  InboundReceipt,
  InboundReceiptDetail,
  CreateInboundSessionRequest,
  AddInboundItemRequest,
  UpdateInboundDetailRequest,
  Warehouse,
  StaffMember,
} from '../../types/staff';

// Colors
const colors = {
  primary: '#485550',
  accent: '#C0EB6A',
  background: '#F4F6F0',
  white: '#FFFFFF',
};

// Status configs
const sessionStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  Draft: { label: 'Nháp', color: '#F59E0B', bgColor: '#FEF3C7' },
  Processing: { label: 'Đang xử lý', color: '#3B82F6', bgColor: '#DBEAFE' },
  Completed: { label: 'Hoàn thành', color: '#10B981', bgColor: '#D1FAE5' },
  Cancelled: { label: 'Đã huỷ', color: '#EF4444', bgColor: '#FEE2E2' },
};

const receiptStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  Pending: { label: 'Chờ xác nhận', color: '#F59E0B', bgColor: '#FEF3C7' },
  Confirmed: { label: 'Đã xác nhận', color: '#3B82F6', bgColor: '#DBEAFE' },
  Completed: { label: 'Hoàn thành', color: '#10B981', bgColor: '#D1FAE5' },
  Cancelled: { label: 'Đã huỷ', color: '#EF4444', bgColor: '#FEE2E2' },
};

interface InboundSessionManagerProps {
  onRefreshStats?: () => void;
}

type ViewMode = 'list' | 'detail' | 'create';

export function InboundSessionManager({ onRefreshStats }: InboundSessionManagerProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sessions, setSessions] = useState<InboundSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<InboundSession | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [staffProfile, setStaffProfile] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create session dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateInboundSessionRequest>({
    warehouseId: '',
    note: '',
  });

  // Add item dialog
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [addItemForm, setAddItemForm] = useState<AddInboundItemRequest>({
    productId: '',
    supplierId: undefined,
    quantity: 1,
    unitPrice: 0,
    unit: '',
    batchNumber: '',
    note: '',
  });

  // Edit detail dialog
  const [editDetailDialogOpen, setEditDetailDialogOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<InboundReceiptDetail | null>(null);
  const [editForm, setEditForm] = useState<UpdateInboundDetailRequest>({});

  // Products for selection (fetched from API)
  const [products, setProducts] = useState<Array<{ id: string; name: string; basePrice: number; supplierId?: number }>>([]);

  // =====================================================
  // DATA FETCHING
  // =====================================================

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inboundSessionApi.getAll(page, 20, undefined, filterStatus || undefined);
      setSessions(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('Lỗi tải danh sách phiên nhập kho');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  const fetchStaffProfile = useCallback(async () => {
    try {
      const profile = await staffMemberApi.getMe();
      setStaffProfile(profile);
      // Auto-set warehouse for create form if staff is assigned to a warehouse
      if (profile.warehouseId) {
        setCreateForm(prev => ({ ...prev, warehouseId: profile.warehouseId! }));
      }
    } catch (err) {
      console.error('Error fetching staff profile:', err);
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    try {
      const result = await warehouseApi.getAll(1, 100);
      setWarehouses(result.items || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5022/api'}/products?page=1&pageSize=200`
      );
      const data = await response.json();
      setProducts(
        (data.items || data || []).map((p: { id: string; name: string; basePrice: number; supplierId?: number }) => ({
          id: p.id,
          name: p.name,
          basePrice: p.basePrice,
          supplierId: p.supplierId,
        }))
      );
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchWarehouses();
    fetchStaffProfile();
    fetchProducts();
  }, [fetchSessions, fetchWarehouses, fetchStaffProfile, fetchProducts]);

  const refreshSession = async (sessionId: string) => {
    try {
      const updated = await inboundSessionApi.getById(sessionId);
      setSelectedSession(updated);
      // Also update in the list
      setSessions(prev => prev.map(s => (s.id === sessionId ? updated : s)));
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  // =====================================================
  // ACTIONS
  // =====================================================

  const handleCreateSession = async () => {
    // Staff must have canCreateInboundSession permission
    if (staffProfile && !staffProfile.canCreateInboundSession) {
      toast.error('Bạn không có quyền tạo phiên nhập kho. Vui lòng liên hệ quản trị viên.');
      return;
    }

    // Staff must be assigned to a warehouse
    if (!staffProfile?.warehouseId) {
      toast.error('Bạn chưa được phân bổ vào kho nào. Vui lòng liên hệ quản trị viên.');
      return;
    }

    setActionLoading(true);
    try {
      const session = await inboundSessionApi.create({
        warehouseId: staffProfile.warehouseId,
        note: createForm.note,
      });
      toast.success(`Tạo phiên nhập thành công: ${session.sessionCode}`);
      setCreateDialogOpen(false);
      setCreateForm({ warehouseId: staffProfile.warehouseId, note: '' });
      setSelectedSession(session);
      setViewMode('detail');
      fetchSessions();
      onRefreshStats?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi tạo phiên nhập';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedSession) return;
    if (!addItemForm.productId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }
    if (addItemForm.quantity < 1) {
      toast.error('Số lượng phải >= 1');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await inboundSessionApi.addItem(selectedSession.id, addItemForm);
      setSelectedSession(updated);
      setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      toast.success('Thêm sản phẩm thành công');
      setAddItemDialogOpen(false);
      setAddItemForm({
        productId: '',
        supplierId: undefined,
        quantity: 1,
        unitPrice: 0,
        unit: '',
        batchNumber: '',
        note: '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi thêm sản phẩm';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDetail = async () => {
    if (!selectedSession || !editingDetail) return;
    setActionLoading(true);
    try {
      const updated = await inboundSessionApi.updateDetail(
        selectedSession.id,
        editingDetail.id,
        editForm
      );
      setSelectedSession(updated);
      setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      toast.success('Cập nhật thành công');
      setEditDetailDialogOpen(false);
      setEditingDetail(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDetail = async (detailId: string) => {
    if (!selectedSession) return;
    if (!confirm('Bạn có chắc muốn xoá dòng hàng này?')) return;
    setActionLoading(true);
    try {
      const updated = await inboundSessionApi.removeDetail(selectedSession.id, detailId);
      setSelectedSession(updated);
      setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      toast.success('Đã xoá dòng hàng');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi xoá';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;
    if (!confirm('Hoàn thành phiên nhập? Hàng sẽ được nhập vào kho.')) return;
    setActionLoading(true);
    try {
      const updated = await inboundSessionApi.complete(selectedSession.id, {});
      setSelectedSession(updated);
      setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      toast.success('Phiên nhập đã hoàn thành! Hàng đã nhập kho.');
      onRefreshStats?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi hoàn thành';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;
    if (!confirm('Bạn có chắc muốn huỷ phiên nhập này?')) return;
    setActionLoading(true);
    try {
      const updated = await inboundSessionApi.cancel(selectedSession.id);
      setSelectedSession(updated);
      setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      toast.success('Phiên nhập đã bị huỷ');
      onRefreshStats?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi huỷ phiên';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openEditDetail = (detail: InboundReceiptDetail) => {
    setEditingDetail(detail);
    setEditForm({
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
      unit: detail.unit || '',
      batchNumber: detail.batchNumber || '',
      note: detail.note || '',
    });
    setEditDetailDialogOpen(true);
  };

  // =====================================================
  // RENDER: SESSION LIST
  // =====================================================

  const renderSessionList = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
            Phiên nhập kho
          </h2>
          <p className="text-sm text-gray-500">
            Quản lý phiên nhập kho theo mô hình SAP — tự động phân nhóm theo NCC
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSessions()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          {staffProfile?.canCreateInboundSession && staffProfile?.warehouseId && (
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              style={{ backgroundColor: colors.accent, color: colors.primary }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Tạo phiên nhập
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Draft', 'Processing', 'Completed', 'Cancelled'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilterStatus(status); setPage(1); }}
            style={filterStatus === status ? { backgroundColor: colors.primary, color: colors.white } : {}}
          >
            {status === '' ? 'Tất cả' : sessionStatusConfig[status]?.label || status}
          </Button>
        ))}
      </div>

      {/* Sessions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {staffProfile?.canCreateInboundSession
                ? 'Chưa có phiên nhập kho nào'
                : 'Chưa có phiên nhập kho nào. Bạn không có quyền tạo phiên nhập.'}
            </p>
            {staffProfile?.canCreateInboundSession && staffProfile?.warehouseId && (
              <Button
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
                style={{ backgroundColor: colors.accent, color: colors.primary }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Tạo phiên nhập đầu tiên
              </Button>
            )}
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
                <TableHead>Ngày tạo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const statusCfg = sessionStatusConfig[session.status] || sessionStatusConfig.Draft;
                return (
                  <TableRow key={session.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-mono font-medium">{session.sessionCode}</TableCell>
                    <TableCell>{session.warehouseName || '—'}</TableCell>
                    <TableCell>{session.createdByName || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.totalSuppliers} NCC</Badge>
                    </TableCell>
                    <TableCell>{session.totalItems} SP / {session.totalQuantity} đơn vị</TableCell>
                    <TableCell className="font-medium">{formatCurrency(session.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: statusCfg.bgColor, color: statusCfg.color, border: 'none' }}>
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(session.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSession(session);
                          setViewMode('detail');
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
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
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Trước
          </Button>
          <span className="text-sm text-gray-500">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
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
    const statusCfg = sessionStatusConfig[selectedSession.status] || sessionStatusConfig.Draft;
    const isDraft = selectedSession.status === 'Draft';

    return (
      <div className="space-y-4">
        {/* Back + Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedSession(null); }}>
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
            <Badge style={{ backgroundColor: statusCfg.bgColor, color: statusCfg.color, border: 'none' }}>
              {statusCfg.label}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshSession(selectedSession.id)}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Làm mới
            </Button>
            {isDraft && (
              <>
                <Button
                  size="sm"
                  onClick={() => setAddItemDialogOpen(true)}
                  style={{ backgroundColor: colors.accent, color: colors.primary }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm hàng
                </Button>
                <Button
                  size="sm"
                  onClick={handleCompleteSession}
                  disabled={actionLoading || selectedSession.totalItems === 0}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {actionLoading ? 'Đang xử lý...' : 'Hoàn thành nhập kho'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelSession}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Huỷ
                </Button>
              </>
            )}
          </div>
        </div>

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
          <Alert>
            <AlertDescription>{selectedSession.note}</AlertDescription>
          </Alert>
        )}

        {/* Receipts by Supplier */}
        {selectedSession.receipts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Chưa có hàng nào. Bấm "Thêm hàng" để bắt đầu.</p>
            </CardContent>
          </Card>
        ) : (
          selectedSession.receipts.map((receipt) => renderReceiptCard(receipt, isDraft))
        )}
      </div>
    );
  };

  // =====================================================
  // RENDER: RECEIPT CARD (per supplier)
  // =====================================================

  const renderReceiptCard = (receipt: InboundReceipt, isDraft: boolean) => {
    const rStatusCfg = receiptStatusConfig[receipt.status] || receiptStatusConfig.Pending;

    return (
      <Card key={receipt.id} className="border-l-4" style={{ borderLeftColor: rStatusCfg.color }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {receipt.supplierName || `NCC #${receipt.supplierId}`}
              </CardTitle>
              <CardDescription className="font-mono">{receipt.receiptCode}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge style={{ backgroundColor: rStatusCfg.bgColor, color: rStatusCfg.color, border: 'none' }}>
                {rStatusCfg.label}
              </Badge>
              <span className="text-sm font-medium">{formatCurrency(receipt.totalAmount)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
                <TableHead>Lô / HSD</TableHead>
                <TableHead>Ghi chú</TableHead>
                {isDraft && <TableHead></TableHead>}
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
                    {detail.expiryDate && <span className="ml-2">HSD: {new Date(detail.expiryDate).toLocaleDateString('vi-VN')}</span>}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-[120px] truncate">
                    {detail.note || '—'}
                  </TableCell>
                  {isDraft && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDetail(detail)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveDetail(detail.id)}
                          disabled={actionLoading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  // =====================================================
  // RENDER: DIALOGS
  // =====================================================

  const renderCreateDialog = () => (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo phiên nhập kho mới</DialogTitle>
          <DialogDescription>Chọn kho và ghi chú (tuỳ chọn)</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Kho nhận hàng *</label>
            {staffProfile?.warehouseId ? (
              <div className="w-full mt-1 p-2 border rounded-md bg-gray-50 text-gray-700">
                {staffProfile.warehouseName || warehouses.find(w => w.id === staffProfile.warehouseId)?.name || staffProfile.warehouseId}
                <p className="text-xs text-gray-400 mt-1">Kho được phân bổ cho bạn — không thể thay đổi</p>
              </div>
            ) : (
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={createForm.warehouseId}
                onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
              >
                <option value="">-- Chọn kho --</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Ghi chú</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-md"
              rows={3}
              placeholder="Ghi chú phiên nhập..."
              value={createForm.note || ''}
              onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
            Huỷ
          </Button>
          <Button
            onClick={handleCreateSession}
            disabled={actionLoading || (!staffProfile?.warehouseId && !createForm.warehouseId)}
            style={{ backgroundColor: colors.accent, color: colors.primary }}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Tạo phiên nhập
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderAddItemDialog = () => (
    <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm vào phiên nhập</DialogTitle>
          <DialogDescription>
            Hệ thống tự động phân nhóm theo NCC. Nếu không chỉ định NCC, sẽ dùng NCC mặc định của sản phẩm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Sản phẩm *</label>
            <select
              className="w-full mt-1 p-2 border rounded-md"
              value={addItemForm.productId}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value);
                setAddItemForm({
                  ...addItemForm,
                  productId: e.target.value,
                  unitPrice: product?.basePrice || 0,
                  supplierId: product?.supplierId || undefined,
                });
              }}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.basePrice)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Số lượng *</label>
              <input
                type="number"
                className="w-full mt-1 p-2 border rounded-md"
                min={1}
                value={addItemForm.quantity}
                onChange={(e) => setAddItemForm({ ...addItemForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Đơn giá</label>
              <input
                type="number"
                className="w-full mt-1 p-2 border rounded-md"
                min={0}
                step={1000}
                value={addItemForm.unitPrice}
                onChange={(e) => setAddItemForm({ ...addItemForm, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Mã NCC (tuỳ chọn)</label>
              <input
                type="number"
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Để trống = NCC mặc định"
                value={addItemForm.supplierId || ''}
                onChange={(e) =>
                  setAddItemForm({
                    ...addItemForm,
                    supplierId: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Đơn vị</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="kg, hộp, thùng..."
                value={addItemForm.unit || ''}
                onChange={(e) => setAddItemForm({ ...addItemForm, unit: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Số lô</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Batch number"
                value={addItemForm.batchNumber || ''}
                onChange={(e) => setAddItemForm({ ...addItemForm, batchNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hạn sử dụng</label>
              <input
                type="date"
                className="w-full mt-1 p-2 border rounded-md"
                value={addItemForm.expiryDate ? addItemForm.expiryDate.split('T')[0] : ''}
                onChange={(e) =>
                  setAddItemForm({
                    ...addItemForm,
                    expiryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Ghi chú</label>
            <input
              type="text"
              className="w-full mt-1 p-2 border rounded-md"
              placeholder="Ghi chú"
              value={addItemForm.note || ''}
              onChange={(e) => setAddItemForm({ ...addItemForm, note: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
            Huỷ
          </Button>
          <Button
            onClick={handleAddItem}
            disabled={actionLoading || !addItemForm.productId}
            style={{ backgroundColor: colors.accent, color: colors.primary }}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderEditDetailDialog = () => (
    <Dialog open={editDetailDialogOpen} onOpenChange={setEditDetailDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sửa dòng hàng</DialogTitle>
          <DialogDescription>{editingDetail?.productName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Số lượng</label>
              <input
                type="number"
                className="w-full mt-1 p-2 border rounded-md"
                min={1}
                value={editForm.quantity || ''}
                onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || undefined })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Đơn giá</label>
              <input
                type="number"
                className="w-full mt-1 p-2 border rounded-md"
                min={0}
                step={1000}
                value={editForm.unitPrice || ''}
                onChange={(e) => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Đơn vị</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded-md"
                value={editForm.unit || ''}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Số lô</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded-md"
                value={editForm.batchNumber || ''}
                onChange={(e) => setEditForm({ ...editForm, batchNumber: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Ghi chú</label>
            <input
              type="text"
              className="w-full mt-1 p-2 border rounded-md"
              value={editForm.note || ''}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditDetailDialogOpen(false)}>
            Huỷ
          </Button>
          <Button
            onClick={handleUpdateDetail}
            disabled={actionLoading}
            style={{ backgroundColor: colors.accent, color: colors.primary }}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div>
      {viewMode === 'list' && renderSessionList()}
      {viewMode === 'detail' && renderSessionDetail()}

      {/* Dialogs */}
      {renderCreateDialog()}
      {renderAddItemDialog()}
      {renderEditDetailDialog()}
    </div>
  );
}
