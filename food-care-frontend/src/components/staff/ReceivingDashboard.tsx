import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

import {
  Package,
  Truck,
  ClipboardCheck,
  Archive,
  AlertCircle,
  Clock,
  CheckCircle,
  Search,
  RefreshCw,
  Eye,
  Plus,
  FileText,
  MapPin,
  ArrowRight,
  Calendar,

  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { shipmentApi, receiptApi, staffMemberApi } from '@/services/staff/staffApi';
import type { SupplierShipment, Receipt, ShipmentStats } from '@/types/staff';

// ========== Vietnamese status labels ==========
const shipmentStatusLabels: Record<string, string> = {
  Draft: 'Nháp',
  Dispatched: 'Đã gửi đi',
  InTransit: 'Đang vận chuyển',
  Arrived: 'Đã đến kho',
  Inspected: 'Đã kiểm tra',
  Stored: 'Đã nhập kho',
  Closed: 'Đã đóng',
  Cancelled: 'Đã hủy',
};

const receiptStatusLabels: Record<string, string> = {
  Pending: 'Chờ xử lý',
  Inspecting: 'Đang kiểm tra',
  Accepted: 'Đã chấp nhận',
  Partial: 'Chấp nhận 1 phần',
  Rejected: 'Từ chối',
  Quarantine: 'Cách ly',
  Completed: 'Hoàn thành',
};

const regionLabels: Record<string, string> = {
  North: 'Miền Bắc',
  Central: 'Miền Trung',
  South: 'Miền Nam',
};

// ========== Status Badge Component ==========
const StatusBadge: React.FC<{ status: string; type?: 'shipment' | 'receipt' }> = ({
  status,
  type = 'shipment',
}) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className?: string }> = {
    Draft: { variant: 'secondary', icon: Clock },
    Dispatched: { variant: 'outline', icon: Package, className: 'border-blue-300 text-blue-700 bg-blue-50' },
    InTransit: { variant: 'default', icon: Truck, className: 'bg-blue-600' },
    Arrived: { variant: 'default', icon: CheckCircle, className: 'bg-emerald-600' },
    Inspected: { variant: 'default', icon: ClipboardCheck, className: 'bg-purple-600' },
    Stored: { variant: 'default', icon: Archive, className: 'bg-teal-600' },
    Closed: { variant: 'secondary', icon: CheckCircle },
    Cancelled: { variant: 'destructive', icon: AlertCircle },
    Pending: { variant: 'outline', icon: Clock, className: 'border-yellow-300 text-yellow-700 bg-yellow-50' },
    Inspecting: { variant: 'default', icon: ClipboardCheck, className: 'bg-amber-600' },
    Accepted: { variant: 'default', icon: CheckCircle, className: 'bg-green-600' },
    Partial: { variant: 'outline', icon: AlertTriangle, className: 'border-orange-300 text-orange-700 bg-orange-50' },
    Rejected: { variant: 'destructive', icon: AlertCircle },
    Completed: { variant: 'default', icon: CheckCircle, className: 'bg-green-700' },
  };

  const labels = type === 'receipt' ? receiptStatusLabels : shipmentStatusLabels;
  const config = statusConfig[status] || statusConfig.Pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 w-fit ${config.className || ''}`}>
      <Icon className="h-3 w-3" />
      {labels[status] || status}
    </Badge>
  );
};

// ========== Stats Card Component ==========
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  description?: string;
  onClick?: () => void;
}> = ({ title, value, icon: Icon, color = 'text-gray-600', bgColor = 'bg-gray-50', description, onClick }) => (
  <Card
    className={`${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5' : ''} border-0 shadow-sm`}
    onClick={onClick}
  >
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ReceivingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('arrivals');

  // Data states
  const [warehouseName, setWarehouseName] = useState<string>('');
  const [shipments, setShipments] = useState<SupplierShipment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [shipmentStats, setShipmentStats] = useState<ShipmentStats | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const [stats, setStats] = useState({
    pendingArrivals: 0,
    inTransit: 0,
    pendingInspection: 0,
    completedToday: 0,
  });

  const loadStaffProfile = useCallback(async () => {
    try {
      const profile = await staffMemberApi.getMe();
      setWarehouseName(profile.warehouseName || 'Chưa gán kho');
    } catch (error) {
      console.error('Error loading staff profile:', error);
    }
  }, []);

  const loadShipments = useCallback(async () => {
    try {
      const status = selectedStatus !== 'all' ? selectedStatus : undefined;

      if (status) {
        const response = await shipmentApi.getAll(1, 100, undefined, undefined, status);
        setShipments(response.items);
      } else {
        // Load InTransit + Arrived + Dispatched for arrivals view
        const [dispatchedRes, inTransitRes, arrivedRes] = await Promise.all([
          shipmentApi.getAll(1, 50, undefined, undefined, 'Dispatched'),
          shipmentApi.getAll(1, 50, undefined, undefined, 'InTransit'),
          shipmentApi.getAll(1, 50, undefined, undefined, 'Arrived'),
        ]);
        setShipments([...arrivedRes.items, ...inTransitRes.items, ...dispatchedRes.items]);
      }
    } catch (error) {
      console.error('Error loading shipments:', error);
    }
  }, [selectedStatus]);

  const loadReceipts = useCallback(async () => {
    try {
      const response = await receiptApi.getAll(1, 100);
      setReceipts(response.items);
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await shipmentApi.getStats();
      setShipmentStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [warehouseName]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadStaffProfile(), loadShipments(), loadReceipts(), loadStats()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [loadStaffProfile, loadShipments, loadReceipts, loadStats]);

  const calculateStats = useCallback(() => {
    const today = new Date().toDateString();
    setStats({
      pendingArrivals: shipments.filter((s) => s.status === 'Arrived').length,
      inTransit: shipments.filter((s) => s.status === 'InTransit' || s.status === 'Dispatched').length,
      pendingInspection: receipts.filter(
        (r) => r.status === 'Pending' || r.status === 'Inspecting'
      ).length,
      completedToday: receipts.filter(
        (r) =>
          r.status === 'Completed' &&
          new Date(r.createdAt).toDateString() === today
      ).length,
    });
  }, [shipments, receipts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadShipments();
  }, [selectedStatus, loadShipments]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const handleMarkArrived = async (shipmentId: string) => {
    try {
      await shipmentApi.markArrived(shipmentId);
      toast.success('Đã xác nhận hàng đến kho');
      loadData();
    } catch (error) {
      console.error('Error marking arrived:', error);
      toast.error('Không thể xác nhận đến kho');
    }
  };

  const handleCreateReceipt = async (shipmentId: string) => {
    try {
      const receipt = await receiptApi.create({ shipmentId });
      toast.success('Đã tạo phiếu nhập kho');
      navigate(`/staff/receipts/${receipt.id}`);
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast.error('Không thể tạo phiếu nhập kho. Kiểm tra lại chứng từ lô hàng.');
    }
  };

  const filteredShipments = shipments.filter(
    (s) =>
      s.externalReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceipts = receipts.filter(
    (r) =>
      r.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shipmentReference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getWarehouseRegion = (_warehouseId: string) => {
    // Staff only manages 1 warehouse, region shown in header
    return '';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ===== Page Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý nhập kho</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Theo dõi lô hàng, kiểm tra và nhập kho hàng hoá
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Đang vận chuyển"
          value={stats.inTransit}
          icon={Truck}
          color="text-blue-600"
          bgColor="bg-blue-50"
          description={shipmentStats ? `Tổng: ${shipmentStats.totalShipments} lô hàng` : undefined}
          onClick={() => setActiveTab('arrivals')}
        />
        <StatsCard
          title="Chờ nhận hàng"
          value={stats.pendingArrivals}
          icon={Package}
          color="text-orange-600"
          bgColor="bg-orange-50"
          description="Đã đến kho, chờ tạo phiếu"
          onClick={() => setActiveTab('arrivals')}
        />
        <StatsCard
          title="Chờ kiểm tra"
          value={stats.pendingInspection}
          icon={ClipboardCheck}
          color="text-amber-600"
          bgColor="bg-amber-50"
          description="Phiếu nhập kho đang xử lý"
          onClick={() => setActiveTab('receipts')}
        />
        <StatsCard
          title="Hoàn thành hôm nay"
          value={stats.completedToday}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
          description={new Date().toLocaleDateString('vi-VN')}
          onClick={() => setActiveTab('receipts')}
        />
      </div>

      {/* ===== Filters ===== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã lô hàng, nhà cung cấp, mã vận đơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Kho: {warehouseName}</span>
            </div>
            {activeTab === 'arrivals' && (
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Dispatched">Đã gửi đi</SelectItem>
                  <SelectItem value="InTransit">Đang vận chuyển</SelectItem>
                  <SelectItem value="Arrived">Đã đến kho</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== Main Content Tabs ===== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="arrivals" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Lô hàng đến
            {stats.inTransit + stats.pendingArrivals > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {stats.inTransit + stats.pendingArrivals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Phiếu nhập kho
            {stats.pendingInspection > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {stats.pendingInspection}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== Arrivals Tab ===== */}
        <TabsContent value="arrivals" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Lô hàng đang đến</CardTitle>
                  <CardDescription>
                    Các lô hàng từ nhà cung cấp đang trong quá trình vận chuyển và chờ nhận
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {filteredShipments.length} lô hàng
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : filteredShipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Không có lô hàng nào</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hiện tại chưa có lô hàng đang vận chuyển đến kho
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Mã lô hàng</TableHead>
                        <TableHead className="font-semibold">Nhà cung cấp</TableHead>
                        <TableHead className="font-semibold">Kho nhận</TableHead>
                        <TableHead className="font-semibold">Trạng thái</TableHead>
                        <TableHead className="font-semibold">Ngày giao dự kiến</TableHead>
                        <TableHead className="font-semibold">Hàng hóa</TableHead>
                        <TableHead className="font-semibold">Chứng từ</TableHead>
                        <TableHead className="font-semibold text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShipments.map((shipment) => (
                        <TableRow
                          key={shipment.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/staff/shipments/${shipment.id}`)}
                        >
                          <TableCell className="font-medium text-primary">
                            {shipment.shipmentNumber || shipment.externalReference}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{shipment.supplierName || '-'}</p>
                              {shipment.trackingNumber && (
                                <p className="text-xs text-muted-foreground">
                                  MVĐ: {shipment.trackingNumber}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{shipment.warehouseName || '-'}</p>
                                {shipment.warehouseId && (
                                  <p className="text-xs text-muted-foreground">
                                    {getWarehouseRegion(shipment.warehouseId)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={shipment.status} type="shipment" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDate(shipment.expectedDeliveryDate)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {shipment.totalItems} SP ({shipment.totalQuantity} đơn vị)
                            </span>
                          </TableCell>
                          <TableCell>
                            {shipment.documents && shipment.documents.length > 0 ? (
                              <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                                <FileText className="h-3 w-3 mr-1" />
                                {shipment.documents.length} tệp
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-red-300 text-red-600 bg-red-50">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Thiếu
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                              {shipment.status === 'InTransit' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                  onClick={() => handleMarkArrived(shipment.id)}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Xác nhận đến
                                </Button>
                              )}
                              {shipment.status === 'Arrived' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateReceipt(shipment.id)}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Tạo phiếu nhập
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/staff/shipments/${shipment.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Receipts Tab ===== */}
        <TabsContent value="receipts" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Phiếu nhập kho</CardTitle>
                  <CardDescription>
                    Quản lý kiểm tra hàng hóa và xử lý phiếu nhập kho
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {filteredReceipts.length} phiếu
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : filteredReceipts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Không có phiếu nhập kho</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tạo phiếu nhập kho từ lô hàng đã đến
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Mã phiếu</TableHead>
                        <TableHead className="font-semibold">Lô hàng</TableHead>
                        <TableHead className="font-semibold">Kho hàng</TableHead>
                        <TableHead className="font-semibold">Trạng thái</TableHead>
                        <TableHead className="font-semibold">Ngày nhận</TableHead>
                        <TableHead className="font-semibold text-center">Tiến độ</TableHead>
                        <TableHead className="font-semibold text-center">Vấn đề</TableHead>
                        <TableHead className="font-semibold text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceipts.map((receipt) => {
                        const inspectionProgress =
                          receipt.totalExpected > 0
                            ? Math.round(((receipt.totalAccepted + receipt.totalDamaged) / receipt.totalExpected) * 100)
                            : 0;

                        return (
                          <TableRow
                            key={receipt.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/staff/receipts/${receipt.id}`)}
                          >
                            <TableCell className="font-medium text-primary">
                              {receipt.receiptNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {receipt.shipmentReference || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm">{receipt.warehouseName || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={receipt.status} type="receipt" />
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(receipt.arrivalDate)}
                            </TableCell>
                            <TableCell>
                              <div className="w-24 mx-auto space-y-1">
                                <Progress value={inspectionProgress} className="h-1.5" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{receipt.totalAccepted}</span>
                                  <span>/ {receipt.totalExpected}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {(receipt.totalDamaged > 0 || receipt.totalMissing > 0) ? (
                                <div className="flex gap-1 justify-center">
                                  {receipt.totalDamaged > 0 && (
                                    <Badge variant="destructive" className="text-xs px-1.5">
                                      {receipt.totalDamaged} hỏng
                                    </Badge>
                                  )}
                                  {receipt.totalMissing > 0 && (
                                    <Badge variant="outline" className="text-xs px-1.5 border-orange-300 text-orange-600">
                                      {receipt.totalMissing} thiếu
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant={
                                    receipt.status === 'Pending'
                                      ? 'default'
                                      : receipt.status === 'Inspecting'
                                        ? 'outline'
                                        : 'ghost'
                                  }
                                  onClick={() => navigate(`/staff/receipts/${receipt.id}`)}
                                >
                                  {receipt.status === 'Pending' && (
                                    <>
                                      <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                      Bắt đầu kiểm tra
                                    </>
                                  )}
                                  {receipt.status === 'Inspecting' && (
                                    <>
                                      <ArrowRight className="h-3.5 w-3.5 mr-1" />
                                      Tiếp tục
                                    </>
                                  )}
                                  {!['Pending', 'Inspecting'].includes(receipt.status) && (
                                    <>
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      Xem
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReceivingDashboard;
