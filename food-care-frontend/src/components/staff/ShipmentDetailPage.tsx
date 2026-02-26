import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Package,
  Calendar,
  ClipboardPlus,
  CheckCircle,
  FileText,
  History,
  MapPin,
  AlertTriangle,
  ExternalLink,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { shipmentApi, receiptApi } from '@/services/staff/staffApi';
import type {
  SupplierShipment,
  ShipmentDocument,
  ShipmentStatusHistory,
  CreateReceiptRequest,
} from '@/types/staff';

// ===== Vietnamese labels =====
const statusLabels: Record<string, string> = {
  Draft: 'Nháp',
  Dispatched: 'Đã gửi đi',
  InTransit: 'Đang vận chuyển',
  Arrived: 'Đã đến kho',
  Inspected: 'Đã kiểm tra',
  Stored: 'Đã nhập kho',
  Closed: 'Đã đóng',
  Cancelled: 'Đã hủy',
};

const statusSteps = ['Draft', 'Dispatched', 'InTransit', 'Arrived', 'Inspected', 'Stored', 'Closed'];

const getStatusIndex = (status: string) => statusSteps.indexOf(status);

// ===== Status Flow Component =====
const StatusFlow: React.FC<{ currentStatus: string }> = ({ currentStatus }) => {
  const currentIdx = getStatusIndex(currentStatus);
  const displaySteps = statusSteps.filter((s) => s !== 'Draft' && s !== 'Closed');

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {displaySteps.map((step, i) => {
        const stepIdx = getStatusIndex(step);
        const isCompleted = stepIdx <= currentIdx && currentStatus !== 'Cancelled';
        const isCurrent = step === currentStatus;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center min-w-[80px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted && !isCurrent ? '✓' : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1 text-center ${
                  isCurrent ? 'font-bold text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                {statusLabels[step] || step}
              </span>
            </div>
            {i < displaySteps.length - 1 && (
              <div
                className={`h-0.5 flex-1 min-w-[20px] ${
                  stepIdx < currentIdx ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const ShipmentDetailPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<SupplierShipment | null>(null);
  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [history, setHistory] = useState<ShipmentStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateReceiptDialog, setShowCreateReceiptDialog] = useState(false);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('items');

  const loadShipment = useCallback(async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      const [shipmentData, docsData, historyData] = await Promise.all([
        shipmentApi.getById(shipmentId),
        shipmentApi.getDocuments(shipmentId).catch(() => []),
        shipmentApi.getHistory(shipmentId).catch(() => []),
      ]);
      setShipment(shipmentData);
      setDocuments(docsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading shipment:', error);
      toast.error('Không thể tải thông tin lô hàng');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    if (shipmentId) loadShipment();
  }, [shipmentId, loadShipment]);

  const handleConfirmArrival = async () => {
    if (!shipmentId) return;
    try {
      await shipmentApi.markArrived(shipmentId);
      await loadShipment();
      toast.success('Đã xác nhận lô hàng đến kho');
    } catch (error) {
      console.error('Error confirming arrival:', error);
      toast.error('Không thể xác nhận đến kho');
    }
  };

  const handleCreateReceipt = async () => {
    if (!shipment) return;
    setCreating(true);
    try {
      const request: CreateReceiptRequest = {
        shipmentId: shipment.id,
        notes: receiptNotes || undefined,
      };
      const receipt = await receiptApi.create(request);
      setShowCreateReceiptDialog(false);
      toast.success('Đã tạo phiếu nhập kho thành công');
      navigate(`/staff/receipts/${receipt.id}`);
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast.error('Không thể tạo phiếu nhập kho. Kiểm tra chứng từ đã đầy đủ chưa.');
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải thông tin lô hàng...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <div className="text-center py-16 space-y-4">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Không tìm thấy lô hàng</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const hasDocuments = documents.length > 0 || (shipment.documents && shipment.documents.length > 0);
  const allDocs = documents.length > 0 ? documents : shipment.documents || [];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Chi tiết lô hàng</h1>
              <Badge
                variant={shipment.status === 'Arrived' ? 'default' : 'secondary'}
                className={shipment.status === 'Arrived' ? 'bg-emerald-600' : ''}
              >
                {statusLabels[shipment.status] || shipment.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {shipment.shipmentNumber || shipment.externalReference}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {shipment.status === 'InTransit' && (
            <Button onClick={handleConfirmArrival} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Xác nhận đã đến kho
            </Button>
          )}
          {shipment.status === 'Arrived' && (
            <Button onClick={() => setShowCreateReceiptDialog(true)}>
              <ClipboardPlus className="h-4 w-4 mr-2" />
              Tạo phiếu nhập kho
            </Button>
          )}
        </div>
      </div>

      {/* ===== Status Flow ===== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <StatusFlow currentStatus={shipment.status} />
        </CardContent>
      </Card>

      {/* ===== Info Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shipment Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Thông tin lô hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Nhà cung cấp</p>
                <p className="font-medium">{shipment.supplierName || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Mã vận đơn</p>
                <p className="font-medium">{shipment.trackingNumber || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Hãng vận chuyển</p>
                <p className="font-medium">{shipment.carrier || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Tổng giá trị</p>
                <p className="font-medium text-primary">{formatCurrency(shipment.totalValue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse & Region Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Kho nhận hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Tên kho</p>
                <p className="font-medium">{shipment.warehouseName || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Số lượng SP</p>
                <p className="font-medium">{shipment.totalItems} sản phẩm</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Tổng đơn vị</p>
                <p className="font-medium">{shipment.totalQuantity} đơn vị</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Ghi chú</p>
                <p className="font-medium text-sm">{shipment.notes || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Mốc thời gian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-[9px] top-1.5 bottom-1.5 w-0.5 bg-gray-200" />

              {[
                {
                  label: 'Tạo lô hàng',
                  date: shipment.createdAt,
                  completed: true,
                  color: 'bg-green-500',
                },
                {
                  label: 'Đã gửi đi',
                  date: shipment.dispatchedAt || shipment.actualDispatchDate,
                  completed: !!(shipment.dispatchedAt || shipment.actualDispatchDate),
                  color: 'bg-blue-500',
                },
                {
                  label: 'Dự kiến đến',
                  date: shipment.estimatedArrival || shipment.expectedDeliveryDate,
                  completed: false,
                  color: 'bg-orange-400',
                  isEstimate: true,
                },
                {
                  label: 'Thực tế đến',
                  date: shipment.actualArrival || shipment.actualArrivalDate,
                  completed: !!(shipment.actualArrival || shipment.actualArrivalDate),
                  color: 'bg-emerald-500',
                },
              ].map((item, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 w-[18px] h-[18px] rounded-full border-2 border-white ${
                      item.completed ? item.color : item.isEstimate ? 'bg-orange-300' : 'bg-gray-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.date ? formatDateTime(item.date) : 'Chưa có'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Document Alert ===== */}
      {!hasDocuments && shipment.status === 'Arrived' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Thiếu chứng từ!</span> Lô hàng này chưa có chứng từ đi kèm. 
            Cần nhà cung cấp tải lên chứng từ trước khi tạo phiếu nhập kho.
          </AlertDescription>
        </Alert>
      )}

      {/* ===== Tabbed Content ===== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Hàng hóa ({shipment.items?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Chứng từ ({allDocs.length})
            {!hasDocuments && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1">!</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              {shipment.items && shipment.items.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold">Sản phẩm</TableHead>
                          <TableHead className="font-semibold">SKU</TableHead>
                          <TableHead className="font-semibold">Lô / HSD</TableHead>
                          <TableHead className="font-semibold text-right">Số lượng</TableHead>
                          <TableHead className="font-semibold text-right">Đơn giá</TableHead>
                          <TableHead className="font-semibold text-right">Thành tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipment.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="text-muted-foreground">{item.productSku || '-'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {item.batchNumber && (
                                  <p>Lô: <span className="font-medium">{item.batchNumber}</span></p>
                                )}
                                {item.expiryDate && (
                                  <p className="text-xs text-muted-foreground">
                                    HSD: {formatDate(item.expiryDate)}
                                  </p>
                                )}
                                {!item.batchNumber && !item.expiryDate && '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.quantity || item.expectedQuantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPrice || item.unitCost || 0)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(
                                (item.quantity || item.expectedQuantity) * (item.unitPrice || item.unitCost || 0)
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-end">
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Tổng: {shipment.items.length} sản phẩm
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(shipment.totalValue || 0)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground">Chưa có sản phẩm trong lô hàng này</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chứng từ đi kèm</CardTitle>
              <CardDescription>
                Kiểm tra các tài liệu chứng từ do nhà cung cấp tải lên (hóa đơn, phiếu giao hàng, chứng nhận...)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allDocs.map((doc) => (
                    <Card key={doc.id} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50">
                            <FileCheck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {doc.documentType || 'Tài liệu'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.uploadedAt ? formatDateTime(doc.uploadedAt) : ''}
                              {doc.fileSize ? ` • ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                            </p>
                          </div>
                          {doc.fileUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="shrink-0"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Chưa có chứng từ</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nhà cung cấp chưa tải lên chứng từ cho lô hàng này
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lịch sử thay đổi trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="relative pl-8 space-y-6">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
                  {history.map((entry, i) => (
                    <div key={entry.id || i} className="relative">
                      <div className="absolute -left-5 w-4 h-4 rounded-full bg-primary border-2 border-white" />
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {statusLabels[entry.newStatus] || entry.newStatus}
                          </Badge>
                          {entry.previousStatus && (
                            <span className="text-xs text-muted-foreground">
                              ← {statusLabels[entry.previousStatus] || entry.previousStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {entry.createdAt ? formatDateTime(entry.createdAt) : ''}
                          {entry.changedByName ? ` • ${entry.changedByName}` : ''}
                        </p>
                        {entry.notes && (
                          <p className="text-sm mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-muted-foreground">Chưa có lịch sử thay đổi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== Create Receipt Dialog ===== */}
      <Dialog open={showCreateReceiptDialog} onOpenChange={setShowCreateReceiptDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo phiếu nhập kho</DialogTitle>
            <DialogDescription>
              Tạo phiếu nhập kho để bắt đầu quy trình kiểm tra hàng hóa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document check */}
            {hasDocuments ? (
              <Alert>
                <FileCheck className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  Chứng từ đã đầy đủ ({allDocs.length} tệp). Có thể tiến hành tạo phiếu.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Lô hàng chưa có chứng từ. Hệ thống có thể từ chối tạo phiếu nhập kho.
                </AlertDescription>
              </Alert>
            )}

            {/* Shipment Summary */}
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Lô hàng</p>
                  <p className="font-medium">{shipment.shipmentNumber || shipment.externalReference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Nhà cung cấp</p>
                  <p className="font-medium">{shipment.supplierName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Số sản phẩm</p>
                  <p className="font-medium">{shipment.items?.length || 0} loại</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tổng giá trị</p>
                  <p className="font-medium">{formatCurrency(shipment.totalValue || 0)}</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Ghi chú (không bắt buộc)</Label>
              <Textarea
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                placeholder="Ghi chú ban đầu cho phiếu nhập kho..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateReceiptDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateReceipt} disabled={creating}>
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <ClipboardPlus className="h-4 w-4 mr-2" />
                  Tạo phiếu nhập kho
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShipmentDetailPage;
