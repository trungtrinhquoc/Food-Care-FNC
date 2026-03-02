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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
  Send,
  Archive,
  ArrowLeft,
  AlertTriangle,
  Package,
  MapPin,
  User,
  Calendar,
  ShieldCheck,
  XCircle,
  Edit,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { toast } from 'sonner';
import { receiptApi } from '@/services/staff/staffApi';
import type { Receipt, ReceiptItem, InspectReceiptItemRequest } from '@/types/staff';

// ===== Vietnamese status labels =====
const receiptStatusLabels: Record<string, string> = {
  Pending: 'Chờ xử lý',
  Inspecting: 'Đang kiểm tra',
  Accepted: 'Đã chấp nhận',
  Partial: 'Chấp nhận 1 phần',
  Rejected: 'Từ chối',
  Quarantine: 'Cách ly',
  Completed: 'Hoàn thành',
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Inspecting: 'bg-amber-100 text-amber-800 border-amber-200',
    Accepted: 'bg-green-100 text-green-800 border-green-200',
    Partial: 'bg-orange-100 text-orange-800 border-orange-200',
    Rejected: 'bg-red-100 text-red-800 border-red-200',
    Quarantine: 'bg-purple-100 text-purple-800 border-purple-200',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  return map[status] || '';
};

interface InspectionFormData {
  receivedQuantity: number;
  acceptedQuantity: number;
  damagedQuantity: number;
  quarantineQuantity: number;
  batchNumber: string;
  expiryDate: string;
  qcPassed: boolean | null;
  qcNotes: string;
  inspectionNotes: string;
}

export const ReceiptInspectionPage: React.FC = () => {
  const { receiptId } = useParams<{ receiptId: string }>();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inspection dialog
  const [showInspectDialog, setShowInspectDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<ReceiptItem | null>(null);
  const [formData, setFormData] = useState<InspectionFormData>({
    receivedQuantity: 0,
    acceptedQuantity: 0,
    damagedQuantity: 0,
    quarantineQuantity: 0,
    batchNumber: '',
    expiryDate: '',
    qcPassed: null,
    qcNotes: '',
    inspectionNotes: '',
  });

  // Completion dialog
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  // Store dialog
  const [showStoreDialog, setShowStoreDialog] = useState(false);

  const loadReceipt = useCallback(async () => {
    if (!receiptId) return;
    setLoading(true);
    try {
      const data = await receiptApi.getById(receiptId);
      setReceipt(data);
    } catch (error) {
      console.error('Error loading receipt:', error);
      toast.error('Không thể tải phiếu nhập kho');
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    if (receiptId) loadReceipt();
  }, [receiptId, loadReceipt]);

  const handleStartInspection = async () => {
    if (!receiptId) return;
    try {
      const updated = await receiptApi.startInspection(receiptId);
      setReceipt(updated);
      toast.success('Đã bắt đầu kiểm tra hàng hóa');
    } catch (error) {
      console.error('Error starting inspection:', error);
      toast.error('Không thể bắt đầu kiểm tra');
    }
  };

  const handleInspectItem = (item: ReceiptItem) => {
    setCurrentItem(item);
    setFormData({
      receivedQuantity: item.receivedQuantity || item.expectedQuantity,
      acceptedQuantity: item.acceptedQuantity || item.expectedQuantity,
      damagedQuantity: item.damagedQuantity || 0,
      quarantineQuantity: item.quarantineQuantity || 0,
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate?.split('T')[0] || '',
      qcPassed: item.qcPassed ?? null,
      qcNotes: item.qcNotes || '',
      inspectionNotes: item.inspectionNotes || '',
    });
    setShowInspectDialog(true);
  };

  const handleSaveInspection = async () => {
    if (!receiptId || !currentItem) return;

    const totalAllocated =
      formData.acceptedQuantity + formData.damagedQuantity + formData.quarantineQuantity;
    if (totalAllocated > formData.receivedQuantity) {
      toast.error('Tổng phân bổ không được vượt quá số lượng nhận');
      return;
    }

    setSaving(true);
    try {
      const request: InspectReceiptItemRequest = {
        receivedQuantity: formData.receivedQuantity,
        acceptedQuantity: formData.acceptedQuantity,
        damagedQuantity: formData.damagedQuantity,
        quarantineQuantity: formData.quarantineQuantity,
        batchNumber: formData.batchNumber || undefined,
        expiryDate: formData.expiryDate || undefined,
        qcPassed: formData.qcPassed ?? undefined,
        qcNotes: formData.qcNotes || undefined,
        inspectionNotes: formData.inspectionNotes || undefined,
      };

      const updated = await receiptApi.inspectItem(receiptId, currentItem.id, request);
      setReceipt(updated);
      setShowInspectDialog(false);
      toast.success('Đã lưu kết quả kiểm tra');
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast.error('Không thể lưu kết quả kiểm tra');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteInspection = async () => {
    if (!receiptId) return;

    const uninspected = receipt?.items.filter(
      (item) =>
        item.acceptedQuantity === 0 && item.damagedQuantity === 0 && item.quarantineQuantity === 0
    );

    if (uninspected && uninspected.length > 0) {
      toast.error(`Vui lòng kiểm tra tất cả sản phẩm. Còn ${uninspected.length} sản phẩm chưa kiểm tra.`);
      return;
    }

    setSaving(true);
    try {
      const updated = await receiptApi.completeInspection(receiptId, completionNotes);
      setReceipt(updated);
      setShowCompleteDialog(false);
      toast.success('Đã hoàn thành kiểm tra!');
    } catch (error) {
      console.error('Error completing inspection:', error);
      toast.error('Không thể hoàn thành kiểm tra');
    } finally {
      setSaving(false);
    }
  };

  const handleStoreGoods = async () => {
    if (!receiptId) return;
    setSaving(true);
    try {
      const updated = await receiptApi.storeGoods(receiptId);
      setReceipt(updated);
      setShowStoreDialog(false);
      toast.success('Đã nhập kho thành công!');
    } catch (error) {
      console.error('Error storing goods:', error);
      toast.error('Không thể nhập kho');
    } finally {
      setSaving(false);
    }
  };

  const getItemStatusBadge = (item: ReceiptItem) => {
    if (item.acceptedQuantity > 0 || item.damagedQuantity > 0 || item.quarantineQuantity > 0) {
      if (item.acceptedQuantity === item.expectedQuantity) {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đạt
          </Badge>
        );
      }
      if (item.acceptedQuantity > 0) {
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Thiếu
          </Badge>
        );
      }
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Lỗi
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Chưa kiểm
      </Badge>
    );
  };

  const calculateProgress = () => {
    if (!receipt?.items.length) return 0;
    const inspected = receipt.items.filter(
      (item) => item.acceptedQuantity > 0 || item.damagedQuantity > 0 || item.quarantineQuantity > 0
    ).length;
    return (inspected / receipt.items.length) * 100;
  };

  const canComplete = () => {
    if (!receipt) return false;
    return receipt.items.every(
      (item) => item.acceptedQuantity > 0 || item.damagedQuantity > 0 || item.quarantineQuantity > 0
    );
  };

  const canStore = () => {
    if (!receipt) return false;
    return ['Accepted', 'Partial'].includes(receipt.status);
  };

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
          <p className="text-sm text-muted-foreground">Đang tải phiếu nhập kho...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-6">
        <div className="text-center py-16 space-y-4">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Không tìm thấy phiếu nhập kho</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const inspectedCount = receipt.items.filter(
    (i) => i.acceptedQuantity > 0 || i.damagedQuantity > 0 || i.quarantineQuantity > 0
  ).length;

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
              <h1 className="text-2xl font-bold tracking-tight">Kiểm tra nhập kho</h1>
              <Badge className={`${getStatusColor(receipt.status)} hover:opacity-100`}>
                {receiptStatusLabels[receipt.status] || receipt.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {receipt.receiptNumber} • Lô hàng: {receipt.shipmentReference}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {receipt.status === 'Pending' && (
            <Button onClick={handleStartInspection} className="bg-amber-600 hover:bg-amber-700">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Bắt đầu kiểm tra
            </Button>
          )}
          {receipt.status === 'Inspecting' && (
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(true)}
              disabled={!canComplete()}
              className={canComplete() ? 'border-green-300 text-green-700 hover:bg-green-50' : ''}
            >
              <Send className="h-4 w-4 mr-2" />
              Hoàn thành kiểm tra
            </Button>
          )}
          {canStore() && (
            <Button onClick={() => setShowStoreDialog(true)} className="bg-teal-600 hover:bg-teal-700">
              <Archive className="h-4 w-4 mr-2" />
              Nhập vào kho
            </Button>
          )}
        </div>
      </div>

      {/* ===== Receipt Info ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kho hàng</p>
                <p className="font-semibold text-sm">{receipt.warehouseName || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-50">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ngày nhận</p>
                <p className="font-semibold text-sm">{formatDateTime(receipt.arrivalDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Người nhận</p>
                <p className="font-semibold text-sm">{receipt.receivedByName || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50">
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kiểm tra bởi</p>
                <p className="font-semibold text-sm">{receipt.inspectedByName || 'Chưa gán'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Progress & Summary ===== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tiến độ kiểm tra</span>
                <span className="text-sm font-bold">{inspectedCount}/{receipt.items.length} sản phẩm</span>
              </div>
              <Progress value={calculateProgress()} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1.5">
                {Math.round(calculateProgress())}% hoàn thành
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold">{receipt.totalExpected}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Dự kiến</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">{receipt.totalAccepted}</p>
                <p className="text-[10px] text-green-600 uppercase">Chấp nhận</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-red-600">{receipt.totalDamaged}</p>
                <p className="text-[10px] text-red-600 uppercase">Hư hỏng</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-orange-600">{receipt.totalMissing}</p>
                <p className="text-[10px] text-orange-600 uppercase">Thiếu hụt</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Start Inspection Alert ===== */}
      {receipt.status === 'Pending' && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Nhấn <strong>"Bắt đầu kiểm tra"</strong> để tiến hành kiểm tra từng sản phẩm trong lô hàng.
          </AlertDescription>
        </Alert>
      )}

      {/* ===== Items Table ===== */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Danh sách sản phẩm kiểm tra</CardTitle>
              <CardDescription>
                Kiểm tra từng sản phẩm: số lượng, chất lượng, lô hàng, hạn sử dụng
              </CardDescription>
            </div>
            <Badge variant="outline">
              {inspectedCount}/{receipt.items.length} đã kiểm
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold w-[50px]">#</TableHead>
                  <TableHead className="font-semibold">Sản phẩm</TableHead>
                  <TableHead className="font-semibold">Lô / HSD</TableHead>
                  <TableHead className="font-semibold text-center">Dự kiến</TableHead>
                  <TableHead className="font-semibold text-center">Nhận</TableHead>
                  <TableHead className="font-semibold text-center text-green-600">
                    Chấp nhận
                  </TableHead>
                  <TableHead className="font-semibold text-center text-red-600">
                    Hư hỏng
                  </TableHead>
                  <TableHead className="font-semibold text-center text-amber-600">
                    Cách ly
                  </TableHead>
                  <TableHead className="font-semibold text-center">QC</TableHead>
                  <TableHead className="font-semibold text-center">Kết quả</TableHead>
                  <TableHead className="font-semibold text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.items.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.productName}</p>
                        {item.productSku && (
                          <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.batchNumber && (
                          <p className="text-xs">Lô: <span className="font-medium">{item.batchNumber}</span></p>
                        )}
                        {item.expiryDate && (
                          <p className="text-xs text-muted-foreground">HSD: {formatDate(item.expiryDate)}</p>
                        )}
                        {!item.batchNumber && !item.expiryDate && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{item.expectedQuantity}</TableCell>
                    <TableCell className="text-center">
                      {item.receivedQuantity || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center text-green-600 font-medium">
                      {item.acceptedQuantity || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      {item.damagedQuantity || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center text-amber-600">
                      {item.quarantineQuantity || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.qcRequired ? (
                        item.qcPassed === true ? (
                          <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5">
                            <ShieldCheck className="h-3 w-3 mr-0.5" />
                            Đạt
                          </Badge>
                        ) : item.qcPassed === false ? (
                          <Badge className="bg-red-100 text-red-800 text-[10px] px-1.5">
                            <XCircle className="h-3 w-3 mr-0.5" />
                            Lỗi
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            Cần QC
                          </Badge>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{getItemStatusBadge(item)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={
                          item.acceptedQuantity > 0 || item.damagedQuantity > 0
                            ? 'ghost'
                            : 'outline'
                        }
                        onClick={() => handleInspectItem(item)}
                        disabled={receipt.status !== 'Inspecting'}
                        className="text-xs"
                      >
                        {item.acceptedQuantity > 0 || item.damagedQuantity > 0 ? (
                          <>
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Sửa
                          </>
                        ) : (
                          <>
                            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                            Kiểm tra
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Inspect Item Dialog ===== */}
      <Dialog open={showInspectDialog} onOpenChange={setShowInspectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Kiểm tra: {currentItem?.productName}
            </DialogTitle>
            <DialogDescription>
              SKU: {currentItem?.productSku || '—'} | Dự kiến: {currentItem?.expectedQuantity} đơn vị
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Quantity Section */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" /> Số lượng
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Dự kiến nhận</Label>
                  <Input type="number" value={currentItem?.expectedQuantity || 0} disabled className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs">Thực nhận *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.receivedQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, receivedQuantity: val, acceptedQuantity: val });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Allocation Section */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Phân loại chi tiết</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-green-600">Chấp nhận *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={formData.receivedQuantity}
                    value={formData.acceptedQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, acceptedQuantity: parseInt(e.target.value) || 0 })
                    }
                    className="border-green-200 focus:ring-green-500"
                  />
                </div>
                <div>
                  <Label className="text-xs text-red-600">Hư hỏng</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.damagedQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, damagedQuantity: parseInt(e.target.value) || 0 })
                    }
                    className="border-red-200 focus:ring-red-500"
                  />
                </div>
                <div>
                  <Label className="text-xs text-amber-600">Cách ly</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.quarantineQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quarantineQuantity: parseInt(e.target.value) || 0 })
                    }
                    className="border-amber-200 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Allocation Validation */}
            {formData.acceptedQuantity + formData.damagedQuantity + formData.quarantineQuantity !==
              formData.receivedQuantity && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Tổng phân bổ (
                  {formData.acceptedQuantity + formData.damagedQuantity + formData.quarantineQuantity})
                  phải bằng số thực nhận ({formData.receivedQuantity})
                </AlertDescription>
              </Alert>
            )}

            {/* Batch & Expiry */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Lô hàng & Hạn sử dụng</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Số lô</Label>
                  <Input
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="VD: LOT-2024-001"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hạn sử dụng</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* QC Section */}
            {currentItem?.qcRequired && (
              <div className="border rounded-lg p-4 bg-blue-50/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Kiểm tra chất lượng (QC)
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="qc-pass"
                        checked={formData.qcPassed === true}
                        onCheckedChange={(checked: boolean | 'indeterminate') =>
                          setFormData({ ...formData, qcPassed: checked === true ? true : null })
                        }
                      />
                      <Label htmlFor="qc-pass" className="text-sm text-green-700 font-medium">
                        Đạt chuẩn
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="qc-fail"
                        checked={formData.qcPassed === false}
                        onCheckedChange={(checked: boolean | 'indeterminate') =>
                          setFormData({ ...formData, qcPassed: checked === true ? false : null })
                        }
                      />
                      <Label htmlFor="qc-fail" className="text-sm text-red-700 font-medium">
                        Không đạt
                      </Label>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Ghi chú QC</Label>
                    <Textarea
                      value={formData.qcNotes}
                      onChange={(e) => setFormData({ ...formData, qcNotes: e.target.value })}
                      placeholder="Ghi chú kiểm tra chất lượng..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inspection Notes */}
            <div>
              <Label className="text-xs">Ghi chú kiểm tra</Label>
              <Textarea
                value={formData.inspectionNotes}
                onChange={(e) => setFormData({ ...formData, inspectionNotes: e.target.value })}
                placeholder="Ghi chú, nhận xét, vấn đề phát hiện..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInspectDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveInspection}
              disabled={
                saving ||
                formData.acceptedQuantity + formData.damagedQuantity + formData.quarantineQuantity !==
                  formData.receivedQuantity
              }
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Lưu kết quả
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Complete Inspection Dialog ===== */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành kiểm tra</DialogTitle>
            <DialogDescription>
              Xác nhận hoàn thành kiểm tra hàng hóa cho phiếu nhập kho này
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Ghi chú hoàn thành (không bắt buộc)</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Nhận xét tổng kết về lô hàng..."
                rows={3}
              />
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium text-sm mb-3">Tổng kết kiểm tra</h4>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{receipt.totalExpected}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Dự kiến</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{receipt.totalAccepted}</p>
                  <p className="text-[10px] text-green-600 uppercase">Chấp nhận</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{receipt.totalDamaged}</p>
                  <p className="text-[10px] text-red-600 uppercase">Hư hỏng</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">{receipt.totalMissing}</p>
                  <p className="text-[10px] text-orange-600 uppercase">Thiếu</p>
                </div>
              </div>
            </div>

            {receipt.totalDamaged > 0 || receipt.totalMissing > 0 ? (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Lô hàng có vấn đề: {receipt.totalDamaged > 0 ? `${receipt.totalDamaged} hư hỏng` : ''}{' '}
                  {receipt.totalMissing > 0 ? `${receipt.totalMissing} thiếu hụt` : ''}. 
                  Cân nhắc tạo báo cáo sai lệch sau khi hoàn thành.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCompleteInspection} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'Đang xử lý...' : 'Hoàn thành kiểm tra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Store Goods Dialog ===== */}
      <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập vào kho</DialogTitle>
            <DialogDescription>
              Xác nhận nhập hàng đã kiểm tra vào kho lưu trữ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-teal-50 rounded-lg p-5 text-center">
              <Archive className="h-10 w-10 text-teal-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-teal-700">{receipt.totalAccepted}</p>
              <p className="text-sm text-teal-600">đơn vị sẽ được nhập vào</p>
              <p className="text-sm font-medium text-teal-800 mt-1">{receipt.warehouseName}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStoreDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleStoreGoods}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiptInspectionPage;
