import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { SectionHeader, SectionSkeleton, EmptyState } from './SupplierLayout';
import { toast } from 'sonner';
import {
  Warehouse,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  Package,
  Loader2,
  Truck,
} from 'lucide-react';
import {
  inboundSessionsApi,
  type SupplierInboundSession,
  type SupplierRegisterInboundRequest,
  type CreateShipmentRequest,
} from '@/services/supplier/supplierApi';

export function SupplierInboundSection() {
  const [sessions, setSessions] = useState<SupplierInboundSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Register dialog
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SupplierInboundSession | null>(null);
  const [registerForm, setRegisterForm] = useState<SupplierRegisterInboundRequest>({
    note: '',
    estimatedDeliveryDate: '',
  });

  // Create shipment dialog
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  const [shipmentSession, setShipmentSession] = useState<SupplierInboundSession | null>(null);
  const [shipmentForm, setShipmentForm] = useState({
    externalReference: '',
    expectedDeliveryDate: '',
    trackingNumber: '',
    carrier: '',
    notes: '',
  });

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inboundSessionsApi.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load inbound sessions:', error);
      toast.error('Không thể tải danh sách phiên nhập kho');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleOpenRegisterDialog = (session: SupplierInboundSession) => {
    setSelectedSession(session);
    setRegisterForm({ note: '', estimatedDeliveryDate: '' });
    setRegisterDialogOpen(true);
  };

  const handleRegister = async () => {
    if (!selectedSession) return;

    // Validate: delivery date must be before session deadline
    if (registerForm.estimatedDeliveryDate && selectedSession.expectedEndDate) {
      const deliveryDate = new Date(registerForm.estimatedDeliveryDate);
      const deadline = new Date(selectedSession.expectedEndDate);
      if (deliveryDate > deadline) {
        const formattedDeadline = deadline.toLocaleDateString('vi-VN', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
        toast.error(
          `Thời gian giao hàng phải trước hạn đóng phiên (${formattedDeadline}). Vui lòng chọn lại.`
        );
        return;
      }
    }

    try {
      setActionLoading(selectedSession.sessionId);
      await inboundSessionsApi.registerForSession(selectedSession.sessionId, registerForm);
      toast.success('Đăng ký nhập kho thành công!');
      setRegisterDialogOpen(false);
      loadSessions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (session: SupplierInboundSession) => {
    if (!confirm('Bạn có chắc muốn từ chối lời mời này?')) return;

    try {
      setActionLoading(session.sessionId);
      await inboundSessionsApi.declineSession(session.sessionId);
      toast.success('Đã từ chối lời mời');
      loadSessions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenShipmentDialog = (session: SupplierInboundSession) => {
    setShipmentSession(session);
    setShipmentForm({
      externalReference: `SHP-${session.sessionCode}-${Date.now().toString(36).toUpperCase()}`,
      expectedDeliveryDate: session.estimatedDeliveryDate || '',
      trackingNumber: '',
      carrier: '',
      notes: '',
    });
    setShipmentDialogOpen(true);
  };

  const handleCreateShipment = async () => {
    if (!shipmentSession) return;

    if (!shipmentForm.externalReference.trim()) {
      toast.error('Vui lòng nhập mã lô hàng');
      return;
    }
    if (!shipmentForm.expectedDeliveryDate) {
      toast.error('Vui lòng chọn ngày giao dự kiến');
      return;
    }

    try {
      setActionLoading(shipmentSession.sessionId);
      const request: Omit<CreateShipmentRequest, 'inboundSessionId'> = {
        externalReference: shipmentForm.externalReference,
        expectedDeliveryDate: shipmentForm.expectedDeliveryDate,
        trackingNumber: shipmentForm.trackingNumber || undefined,
        carrier: shipmentForm.carrier || undefined,
        notes: shipmentForm.notes || undefined,
        items: [],
      };
      await inboundSessionsApi.createShipmentFromSession(shipmentSession.sessionId, request);
      toast.success('Tạo lô hàng thành công! Bạn có thể thêm sản phẩm tại mục Giao hàng.');
      setShipmentDialogOpen(false);
      loadSessions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Tạo lô hàng thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Invited':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Lời mời</Badge>;
      case 'Registered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã đăng ký</Badge>;
      case 'Declined':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Đã từ chối</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Hoàn thành</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSessionStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Badge variant="secondary">Nháp</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Đang xử lý</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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

  // Group sessions by status
  const invitedSessions = sessions.filter(s => s.registrationStatus === 'Invited');
  const registeredSessions = sessions.filter(s => s.registrationStatus === 'Registered');
  const otherSessions = sessions.filter(s => s.registrationStatus !== 'Invited' && s.registrationStatus !== 'Registered');

  if (loading) return <SectionSkeleton />;

  return (
    <div>
      <SectionHeader
        title="Phiên nhập kho"
        description="Các phiên nhập kho bạn được mời tham gia. Đăng ký để gửi hàng đến kho."
        actions={
          <Button variant="outline" size="sm" onClick={loadSessions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="Chưa có phiên nhập nào"
          description="Bạn chưa được mời tham gia phiên nhập kho nào. Khi có phiên nhập mới trong khu vực của bạn, bạn sẽ nhận được lời mời."
        />
      ) : (
        <div className="space-y-6">
          {/* Invited Sessions - Highlight */}
          {invitedSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Lời mời mới ({invitedSessions.length})
              </h3>
              <div className="grid gap-4">
                {invitedSessions.map(session => (
                  <SessionCard
                    key={session.registrationId}
                    session={session}
                    onRegister={handleOpenRegisterDialog}
                    onDecline={handleDecline}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getSessionStatusBadge={getSessionStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Registered Sessions */}
          {registeredSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Đã đăng ký ({registeredSessions.length})
              </h3>
              <div className="grid gap-4">
                {registeredSessions.map(session => (
                  <SessionCard
                    key={session.registrationId}
                    session={session}
                    onCreateShipment={handleOpenShipmentDialog}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getSessionStatusBadge={getSessionStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Sessions (declined, completed) */}
          {otherSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Khác ({otherSessions.length})
              </h3>
              <div className="grid gap-4">
                {otherSessions.map(session => (
                  <SessionCard
                    key={session.registrationId}
                    session={session}
                    onRegister={session.registrationStatus === 'Declined' ? handleOpenRegisterDialog : undefined}
                    actionLoading={actionLoading}
                    getStatusBadge={getStatusBadge}
                    getSessionStatusBadge={getSessionStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Register Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đăng ký nhập kho</DialogTitle>
            <DialogDescription>
              Đăng ký gửi hàng cho phiên <strong>{selectedSession?.sessionCode}</strong> tại{' '}
              <strong>{selectedSession?.warehouseName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Ngày dự kiến giao hàng
              </label>
              <Input
                type="datetime-local"
                value={registerForm.estimatedDeliveryDate || ''}
                max={selectedSession?.expectedEndDate
                  ? new Date(selectedSession.expectedEndDate).toISOString().slice(0, 16)
                  : undefined}
                onChange={(e) =>
                  setRegisterForm(prev => ({ ...prev, estimatedDeliveryDate: e.target.value }))
                }
              />
              {selectedSession?.expectedEndDate && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Hạn chót: {formatDate(selectedSession.expectedEndDate)}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Ghi chú (tùy chọn)
              </label>
              <Textarea
                placeholder="Ví dụ: Sẽ giao 50kg rau xanh, 30kg trái cây..."
                value={registerForm.note || ''}
                onChange={(e) =>
                  setRegisterForm(prev => ({ ...prev, note: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleRegister}
              disabled={actionLoading === selectedSession?.sessionId}
            >
              {actionLoading === selectedSession?.sessionId ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Xác nhận đăng ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shipment Dialog */}
      <Dialog open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo lô hàng</DialogTitle>
            <DialogDescription>
              Tạo lô hàng giao cho phiên <strong>{shipmentSession?.sessionCode}</strong> tại{' '}
              <strong>{shipmentSession?.warehouseName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Mã lô hàng
              </label>
              <Input
                value={shipmentForm.externalReference}
                onChange={(e) =>
                  setShipmentForm(prev => ({ ...prev, externalReference: e.target.value }))
                }
                placeholder="Mã lô hàng (tự động tạo)"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Ngày giao dự kiến *
              </label>
              <Input
                type="datetime-local"
                value={shipmentForm.expectedDeliveryDate}
                max={shipmentSession?.expectedEndDate
                  ? new Date(shipmentSession.expectedEndDate).toISOString().slice(0, 16)
                  : undefined}
                onChange={(e) =>
                  setShipmentForm(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))
                }
              />
              {shipmentSession?.expectedEndDate && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Hạn chót phiên: {formatDate(shipmentSession.expectedEndDate)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Đơn vị vận chuyển
                </label>
                <Input
                  value={shipmentForm.carrier}
                  onChange={(e) =>
                    setShipmentForm(prev => ({ ...prev, carrier: e.target.value }))
                  }
                  placeholder="VD: GHTK, GHN..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Mã vận đơn
                </label>
                <Input
                  value={shipmentForm.trackingNumber}
                  onChange={(e) =>
                    setShipmentForm(prev => ({ ...prev, trackingNumber: e.target.value }))
                  }
                  placeholder="Nếu có"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Ghi chú
              </label>
              <Textarea
                placeholder="Mô tả hàng hóa, lưu ý đặc biệt..."
                value={shipmentForm.notes}
                onChange={(e) =>
                  setShipmentForm(prev => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
            <p className="text-xs text-gray-500 bg-blue-50 rounded px-3 py-2">
              <Package className="w-3 h-3 inline mr-1" />
              Sau khi tạo, bạn có thể thêm sản phẩm vào lô hàng tại mục <strong>Giao hàng</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShipmentDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateShipment}
              disabled={actionLoading === shipmentSession?.sessionId}
            >
              {actionLoading === shipmentSession?.sessionId ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Truck className="w-4 h-4 mr-2" />
              )}
              Tạo lô hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Session Card component
function SessionCard({
  session,
  onRegister,
  onDecline,
  onCreateShipment,
  actionLoading,
  getStatusBadge,
  getSessionStatusBadge,
  formatDate,
}: {
  session: SupplierInboundSession;
  onRegister?: (session: SupplierInboundSession) => void;
  onDecline?: (session: SupplierInboundSession) => void;
  onCreateShipment?: (session: SupplierInboundSession) => void;
  actionLoading: string | null;
  getStatusBadge: (status: string) => React.ReactNode;
  getSessionStatusBadge: (status: string) => React.ReactNode;
  formatDate: (dateStr?: string) => string;
}) {
  const isLoading = actionLoading === session.sessionId;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Session Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-lg text-gray-900">{session.sessionCode}</span>
              {getSessionStatusBadge(session.sessionStatus)}
              {getStatusBadge(session.registrationStatus)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-gray-400" />
                <span>{session.warehouseName || 'Không rõ'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  {session.warehouseAddress
                    || [session.warehouseWard, session.warehouseDistrict, session.warehouseCity].filter(Boolean).join(' - ')
                    || 'Không rõ'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Tạo: {formatDate(session.createdAt)}</span>
              </div>
              {session.expectedEndDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span>Hạn: {formatDate(session.expectedEndDate)}</span>
                </div>
              )}
            </div>

            {session.registrationNote && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded px-3 py-2">
                <strong>Ghi chú:</strong> {session.registrationNote}
              </p>
            )}

            {session.estimatedDeliveryDate && (
              <p className="text-sm text-gray-500">
                <Package className="w-4 h-4 inline mr-1" />
                Dự kiến giao: {formatDate(session.estimatedDeliveryDate)}
              </p>
            )}

            {session.registeredAt && (
              <p className="text-xs text-gray-400">
                Đăng ký lúc: {formatDate(session.registeredAt)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2">
            {onRegister && (
              <Button
                size="sm"
                onClick={() => onRegister(session)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1" />
                )}
                Đăng ký
              </Button>
            )}
            {onDecline && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(session)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1" />
                )}
                Từ chối
              </Button>
            )}
            {onCreateShipment && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onCreateShipment(session)}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Truck className="w-4 h-4 mr-1" />
                )}
                Tạo lô hàng
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
