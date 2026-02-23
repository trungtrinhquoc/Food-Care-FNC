import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
// Note: Input and Textarea can be added later for advanced features
import { toast } from 'sonner';
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  Eye,
  RefreshCw,
  ClipboardList,
  ArrowDownToLine,
  Calendar,
  Building2,
  FileWarning,
  RotateCcw,
  Activity,
  Zap,
  TrendingDown,
  ArrowRight,
  Target,
  Loader2,
} from 'lucide-react';

// Import API services
import {
  warehouseApi,
  receiptApi,
  inventoryApi,
  discrepancyApi,
  returnApi,
  staffMemberApi,
} from '../../services/staff/staffApi';

// Import Layout and Shipping Manager
import { StaffLayout } from '../../components/staff/StaffLayout';
import { StaffShippingManager } from '../../components/staff/StaffShippingManager';

// Import types
import type {
  StaffMember,
  Warehouse as WarehouseType,
  Receipt,
  WarehouseInventory,
  DiscrepancyReport,
  ReturnShipment,
} from '../../types/staff';

// Color Constants
const colors = {
  primary: '#485550',
  accent: '#C0EB6A',
  background: '#F4F6F0',
  white: '#FFFFFF',
};

interface DashboardStats {
  totalWarehouses: number;
  activeWarehouses: number;
  pendingReceipts: number;
  receiptsToday: number;
  lowStockItems: number;
  expiringItems: number;
  openDiscrepancies: number;
  pendingReturns: number;
}

export default function StaffDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [staffProfile, setStaffProfile] = useState<StaffMember | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalWarehouses: 0,
    activeWarehouses: 0,
    pendingReceipts: 0,
    receiptsToday: 0,
    lowStockItems: 0,
    expiringItems: 0,
    openDiscrepancies: 0,
    pendingReturns: 0,
  });
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [lowStockInventory, setLowStockInventory] = useState<WarehouseInventory[]>([]);
  const [expiringInventory, setExpiringInventory] = useState<WarehouseInventory[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyReport[]>([]);
  const [returns, setReturns] = useState<ReturnShipment[]>([]);

  // Dialog states
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptDetailOpen, setReceiptDetailOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [selectedWarehouseDetail, setSelectedWarehouseDetail] = useState<WarehouseType | null>(null);
  const [warehouseDetailOpen, setWarehouseDetailOpen] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyReport | null>(null);
  const [discrepancyDetailOpen, setDiscrepancyDetailOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnShipment | null>(null);
  const [returnDetailOpen, setReturnDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      logout();
      navigate('/login');
    }
  }, [user, logout, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        profileRes,
        warehousesRes,
        receiptsRes,
        lowStockRes,
        expiringRes,
        discrepanciesRes,
        returnsRes,
      ] = await Promise.all([
        staffMemberApi.getMe().catch(() => null),
        warehouseApi.getAll(1, 100),
        receiptApi.getAll(1, 50, undefined, 'Pending'),
        inventoryApi.getLowStock(),
        inventoryApi.getExpiring(30),
        discrepancyApi.getAll(1, 50, 'open'),
        returnApi.getAll(1, 50, 'pending'),
      ]);

      if (profileRes) setStaffProfile(profileRes);
      setWarehouses(warehousesRes.items);
      setReceipts(receiptsRes.items);
      setLowStockInventory(lowStockRes);
      setExpiringInventory(expiringRes);
      setDiscrepancies(discrepanciesRes.items);
      setReturns(returnsRes.items);

      // Calculate stats
      setStats({
        totalWarehouses: warehousesRes.totalItems,
        activeWarehouses: warehousesRes.items.filter(w => w.isActive).length,
        pendingReceipts: receiptsRes.totalItems,
        receiptsToday: receiptsRes.items.filter(r =>
          new Date(r.createdAt).toDateString() === new Date().toDateString()
        ).length,
        lowStockItems: lowStockRes.length,
        expiringItems: expiringRes.length,
        openDiscrepancies: discrepanciesRes.totalItems,
        pendingReturns: returnsRes.totalItems,
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      Pending: { variant: 'secondary', label: 'Chờ xử lý' },
      Inspecting: { variant: 'default', label: 'Đang kiểm tra' },
      Accepted: { variant: 'default', label: 'Đã chấp nhận' },
      Partial: { variant: 'outline', label: 'Một phần' },
      Rejected: { variant: 'destructive', label: 'Từ chối' },
      Completed: { variant: 'default', label: 'Hoàn thành' },
      Draft: { variant: 'secondary', label: 'Nháp' },
      Dispatched: { variant: 'default', label: 'Đã gửi' },
      InTransit: { variant: 'default', label: 'Đang vận chuyển' },
      Arrived: { variant: 'default', label: 'Đã đến' },
      open: { variant: 'secondary', label: 'Đang mở' },
      pending: { variant: 'secondary', label: 'Chờ duyệt' },
      approved: { variant: 'default', label: 'Đã duyệt' },
    };
    const config = statusConfig[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Handler functions
  const handleViewReceipt = async (receipt: Receipt) => {
    try {
      const detail = await receiptApi.getById(receipt.id);
      setSelectedReceipt(detail);
      setReceiptDetailOpen(true);
    } catch {
      setSelectedReceipt(receipt);
      setReceiptDetailOpen(true);
    }
  };

  const handleStartInspection = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setInspectionDialogOpen(true);
  };

  const handleInspectReceipt = async () => {
    if (!selectedReceipt) return;
    try {
      setActionLoading(true);
      await receiptApi.startInspection(selectedReceipt.id);
      toast.success('Đã bắt đầu kiểm tra phiếu nhập');
      setInspectionDialogOpen(false);
      fetchDashboardData();
    } catch {
      toast.error('Không thể bắt đầu kiểm tra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteInspection = async (receiptId: string, notes?: string) => {
    try {
      setActionLoading(true);
      await receiptApi.completeInspection(receiptId, notes);
      toast.success('Đã hoàn thành kiểm tra');
      setReceiptDetailOpen(false);
      fetchDashboardData();
    } catch {
      toast.error('Không thể hoàn thành kiểm tra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStoreGoods = async (receiptId: string) => {
    try {
      setActionLoading(true);
      await receiptApi.storeGoods(receiptId);
      toast.success('Đã lưu hàng vào kho thành công');
      setReceiptDetailOpen(false);
      fetchDashboardData();
    } catch {
      toast.error('Không thể lưu hàng vào kho');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewWarehouse = (warehouse: WarehouseType) => {
    setSelectedWarehouseDetail(warehouse);
    setWarehouseDetailOpen(true);
  };

  const handleViewDiscrepancy = async (discrepancy: DiscrepancyReport) => {
    try {
      const detail = await discrepancyApi.getById(discrepancy.id);
      setSelectedDiscrepancy(detail);
      setDiscrepancyDetailOpen(true);
    } catch {
      setSelectedDiscrepancy(discrepancy);
      setDiscrepancyDetailOpen(true);
    }
  };

  const handleResolveDiscrepancy = async (id: string, resolutionType: string, notes: string) => {
    try {
      setActionLoading(true);
      await discrepancyApi.resolve(id, resolutionType, notes);
      toast.success('Đã giải quyết sai lệch');
      setDiscrepancyDetailOpen(false);
      fetchDashboardData();
    } catch {
      toast.error('Không thể giải quyết sai lệch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReturn = async (returnItem: ReturnShipment) => {
    try {
      const detail = await returnApi.getById(returnItem.id);
      setSelectedReturn(detail);
      setReturnDetailOpen(true);
    } catch {
      setSelectedReturn(returnItem);
      setReturnDetailOpen(true);
    }
  };

  const handleApproveReturn = async (id: string) => {
    try {
      setActionLoading(true);
      await returnApi.approve(id);
      toast.success('Đã duyệt yêu cầu trả hàng');
      setReturnDetailOpen(false);
      fetchDashboardData();
    } catch {
      toast.error('Không thể duyệt yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return null;
  }

  // Render Overview Section
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="size-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shipping Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 hover:scale-[1.02]"
          style={{ backgroundColor: colors.white }}
          onClick={() => setSelectedTab('shipping')}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Vận chuyển</p>
                <p className="text-3xl font-bold mt-1" style={{ color: colors.primary }}>
                  {stats.pendingReceipts}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Truck className="size-3" />
                  Nhập / Xuất kho
                </p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${colors.accent}30` }}
              >
                <Truck className="size-6" style={{ color: colors.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Receipts Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 hover:scale-[1.02]"
          style={{ backgroundColor: colors.white }}
          onClick={() => setSelectedTab('receipts')}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Phiếu nhập chờ</p>
                <p className="text-3xl font-bold mt-1" style={{ color: colors.primary }}>
                  {stats.pendingReceipts}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Zap className="size-3" />
                  {stats.receiptsToday} mới hôm nay
                </p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: '#3B82F620' }}
              >
                <ArrowDownToLine className="size-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 hover:scale-[1.02]"
          style={{ backgroundColor: colors.white }}
          onClick={() => setSelectedTab('inventory')}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Tồn kho thấp</p>
                <p className="text-3xl font-bold mt-1 text-orange-600">
                  {stats.lowStockItems}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <TrendingDown className="size-3" />
                  Cần bổ sung ngay
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <AlertTriangle className="size-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiring Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 hover:scale-[1.02]"
          style={{ backgroundColor: colors.white }}
          onClick={() => setSelectedTab('inventory')}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Sắp hết hạn</p>
                <p className="text-3xl font-bold mt-1 text-amber-600">
                  {stats.expiringItems}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="size-3" />
                  Trong 30 ngày
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock className="size-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.lowStockItems > 0 && (
        <Alert
          className="border-0"
          style={{ backgroundColor: '#FEF3C7' }}
        >
          <AlertTriangle className="size-4 text-amber-600" />
          <AlertDescription className="text-amber-800 flex items-center justify-between">
            <span>
              Có <strong>{stats.lowStockItems} sản phẩm</strong> sắp hết hàng cần bổ sung
            </span>
            <Button
              size="sm"
              variant="outline"
              className="text-amber-700 border-amber-300 hover:bg-amber-100"
              onClick={() => setSelectedTab('inventory')}
            >
              Xem chi tiết <ArrowRight className="size-3 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Overview */}
        <Card className="lg:col-span-2 border-0" style={{ backgroundColor: colors.white }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                <Building2 className="size-5" style={{ color: colors.accent }} />
                Tình trạng kho hàng
              </CardTitle>
              <CardDescription>Tổng quan các kho đang hoạt động</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Activity className="size-3" />
              {stats.activeWarehouses}/{stats.totalWarehouses} kho
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warehouses.slice(0, 4).map((warehouse) => (
                <div
                  key={warehouse.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  style={{ backgroundColor: colors.background }}
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: warehouse.isActive ? `${colors.accent}30` : '#E5E7EB' }}
                  >
                    <Building2
                      className="size-5"
                      style={{ color: warehouse.isActive ? colors.primary : '#9CA3AF' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: colors.primary }}>{warehouse.name}</span>
                      {warehouse.isDefault && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5"
                          style={{ borderColor: colors.accent, color: colors.primary }}
                        >
                          Mặc định
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {[warehouse.addressDistrict, warehouse.addressCity].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
                    </p>
                  </div>
                  <Badge
                    variant={warehouse.isActive ? 'default' : 'secondary'}
                    className="text-xs"
                    style={warehouse.isActive ? { backgroundColor: colors.accent, color: colors.primary } : {}}
                  >
                    {warehouse.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                  </Badge>
                </div>
              ))}
            </div>
            {warehouses.length > 4 && (
              <Button
                variant="ghost"
                className="w-full mt-4"
                style={{ color: colors.primary }}
                onClick={() => setSelectedTab('warehouses')}
              >
                Xem tất cả kho hàng <ArrowRight className="size-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card className="border-0" style={{ backgroundColor: colors.white }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
              <Target className="size-5" style={{ color: colors.accent }} />
              Hiệu suất hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Phiếu nhập đã xử lý</span>
                <span className="font-medium" style={{ color: colors.primary }}>
                  {stats.receiptsToday}/{stats.pendingReceipts + stats.receiptsToday}
                </span>
              </div>
              <Progress
                value={stats.pendingReceipts + stats.receiptsToday > 0
                  ? (stats.receiptsToday / (stats.pendingReceipts + stats.receiptsToday)) * 100
                  : 100
                }
                className="h-2"
                style={{ backgroundColor: colors.background }}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Sai lệch đã giải quyết</span>
                <span className="font-medium" style={{ color: colors.primary }}>--/{stats.openDiscrepancies}</span>
              </div>
              <Progress value={0} className="h-2" style={{ backgroundColor: colors.background }} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Trả hàng đã duyệt</span>
                <span className="font-medium" style={{ color: colors.primary }}>--/{stats.pendingReturns}</span>
              </div>
              <Progress value={0} className="h-2" style={{ backgroundColor: colors.background }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Receipts Table */}
      <Card className="border-0" style={{ backgroundColor: colors.white }}>
        <CardHeader style={{ backgroundColor: colors.background }} className="rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                <ClipboardList className="size-5" style={{ color: colors.accent }} />
                Phiếu nhập cần xử lý
              </CardTitle>
              <CardDescription>Các phiếu nhập kho đang chờ kiểm tra và lưu kho</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTab('receipts')}
            >
              Xem tất cả <ArrowRight className="size-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="size-8 animate-spin" style={{ color: colors.accent }} />
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="size-12 mx-auto mb-3" style={{ color: colors.accent }} />
              <p className="font-medium" style={{ color: colors.primary }}>Tuyệt vời!</p>
              <p className="text-gray-500 text-sm">Không có phiếu nhập chờ xử lý</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: colors.background }}>
                  <TableHead>Số phiếu</TableHead>
                  <TableHead>Kho</TableHead>
                  <TableHead>Ngày đến</TableHead>
                  <TableHead className="text-center">Số lượng dự kiến</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.slice(0, 5).map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium" style={{ color: colors.primary }}>{receipt.receiptNumber}</TableCell>
                    <TableCell>{receipt.warehouseName || '-'}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-gray-400" />
                        {new Date(receipt.arrivalDate).toLocaleDateString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-medium">{receipt.totalExpected}</TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReceipt(receipt)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        {receipt.status === 'Pending' && (
                          <Button
                            size="sm"
                            style={{ backgroundColor: colors.accent, color: colors.primary }}
                            className="hover:opacity-90"
                            onClick={() => handleStartInspection(receipt)}
                          >
                            <ClipboardList className="size-3.5 mr-1.5" />
                            Kiểm tra
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Low Stock & Expiring Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Card */}
        <Card className="border-0" style={{ backgroundColor: colors.white }}>
          <CardHeader style={{ backgroundColor: '#FEF3C7' }} className="rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="size-5 text-amber-600" />
              Tồn kho thấp
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {lowStockInventory.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="size-10 mx-auto mb-2" style={{ color: colors.accent }} />
                <p className="text-gray-500">Không có sản phẩm tồn kho thấp</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockInventory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-amber-100 hover:border-amber-200 transition-colors"
                    style={{ backgroundColor: '#FFFBEB' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Package className="size-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: colors.primary }}>{item.productName}</div>
                        <div className="text-xs text-gray-500">{item.warehouseName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600 text-lg">{item.availableQuantity}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                        min: {item.reorderPoint || 10}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Items Card */}
        <Card className="border-0" style={{ backgroundColor: colors.white }}>
          <CardHeader style={{ backgroundColor: '#FEF9C3' }} className="rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="size-5 text-yellow-600" />
              Sắp hết hạn
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {expiringInventory.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="size-10 mx-auto mb-2" style={{ color: colors.accent }} />
                <p className="text-gray-500">Không có sản phẩm sắp hết hạn</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringInventory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-yellow-100 hover:border-yellow-200 transition-colors"
                    style={{ backgroundColor: '#FEFCE8' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="size-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: colors.primary }}>{item.productName}</div>
                        <div className="text-xs text-gray-500">Lô: {item.batchNumber || '-'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={item.daysUntilExpiry && item.daysUntilExpiry < 7 ? 'destructive' : 'outline'}
                        className="text-sm font-bold"
                      >
                        {item.daysUntilExpiry} ngày
                      </Badge>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString('vi-VN')
                          : '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render Warehouses Section
  const renderWarehouses = () => (
    <Card className="border-0" style={{ backgroundColor: colors.white }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle style={{ color: colors.primary }}>Danh sách kho hàng</CardTitle>
            <CardDescription>Quản lý các kho hàng trong hệ thống</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : warehouses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Chưa có kho hàng nào</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: colors.background }}>
                <TableHead>Mã kho</TableHead>
                <TableHead>Tên kho</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium" style={{ color: colors.primary }}>{warehouse.code}</TableCell>
                  <TableCell>
                    {warehouse.name}
                    {warehouse.isDefault && (
                      <Badge variant="outline" className="ml-2" style={{ borderColor: colors.accent }}>Mặc định</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {[warehouse.addressStreet, warehouse.addressDistrict, warehouse.addressCity]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </TableCell>
                  <TableCell>{warehouse.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={warehouse.isActive ? 'default' : 'secondary'}
                      style={warehouse.isActive ? { backgroundColor: colors.accent, color: colors.primary } : {}}
                    >
                      {warehouse.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleViewWarehouse(warehouse)}>
                      <Eye className="size-4 mr-1" />
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  // Render Receipts Section
  const renderReceipts = () => (
    <Card className="border-0" style={{ backgroundColor: colors.white }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle style={{ color: colors.primary }}>Phiếu nhập kho</CardTitle>
            <CardDescription>Quản lý các phiếu nhập kho từ nhà cung cấp</CardDescription>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md text-sm font-medium">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span>Kho: {staffProfile?.warehouseName || 'Chưa gán kho'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Chưa có phiếu nhập nào</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: colors.background }}>
                <TableHead>Số phiếu</TableHead>
                <TableHead>Mã vận đơn</TableHead>
                <TableHead>Kho nhận</TableHead>
                <TableHead>Ngày đến</TableHead>
                <TableHead>SL dự kiến</TableHead>
                <TableHead>SL nhận</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium" style={{ color: colors.primary }}>{receipt.receiptNumber}</TableCell>
                  <TableCell>{receipt.shipmentReference || '-'}</TableCell>
                  <TableCell>{receipt.warehouseName}</TableCell>
                  <TableCell>
                    {new Date(receipt.arrivalDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>{receipt.totalExpected}</TableCell>
                  <TableCell>{receipt.totalAccepted}</TableCell>
                  <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewReceipt(receipt)}>
                        <Eye className="size-4" />
                      </Button>
                      {receipt.status === 'Pending' && (
                        <Button
                          size="sm"
                          style={{ backgroundColor: colors.accent, color: colors.primary }}
                          onClick={() => handleStartInspection(receipt)}
                        >
                          <ClipboardList className="size-4 mr-1" />
                          Kiểm tra
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  // Render Inventory Section
  const renderInventory = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <Card className="border-0" style={{ backgroundColor: colors.white }}>
          <CardHeader style={{ backgroundColor: '#FEF3C7' }} className="rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="size-5" />
              Sản phẩm tồn kho thấp ({lowStockInventory.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {lowStockInventory.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Không có sản phẩm tồn kho thấp</p>
            ) : (
              <div className="space-y-2">
                {lowStockInventory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <div>
                      <p className="font-medium" style={{ color: colors.primary }}>{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.warehouseName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-600">{item.availableQuantity}</span>
                      <span className="text-xs text-gray-500 ml-1">/ min {item.reorderPoint || 10}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring */}
        <Card className="border-0" style={{ backgroundColor: colors.white }}>
          <CardHeader style={{ backgroundColor: '#FEF9C3' }} className="rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="size-5" />
              Sản phẩm sắp hết hạn ({expiringInventory.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {expiringInventory.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Không có sản phẩm sắp hết hạn</p>
            ) : (
              <div className="space-y-2">
                {expiringInventory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <div>
                      <p className="font-medium" style={{ color: colors.primary }}>{item.productName}</p>
                      <p className="text-xs text-gray-500">Lô: {item.batchNumber || '-'}</p>
                    </div>
                    <Badge variant={item.daysUntilExpiry && item.daysUntilExpiry < 7 ? 'destructive' : 'outline'}>
                      {item.daysUntilExpiry} ngày
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render Discrepancies Section
  const renderDiscrepancies = () => (
    <Card className="border-0" style={{ backgroundColor: colors.white }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
          <FileWarning className="size-5 text-red-500" />
          Báo cáo sai lệch ({discrepancies.length})
        </CardTitle>
        <CardDescription>Các sai lệch trong quá trình nhập/xuất kho cần xử lý</CardDescription>
      </CardHeader>
      <CardContent>
        {discrepancies.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="size-12 mx-auto mb-3" style={{ color: colors.accent }} />
            <p className="font-medium" style={{ color: colors.primary }}>Tuyệt vời!</p>
            <p className="text-gray-500 text-sm">Không có sai lệch cần xử lý</p>
          </div>
        ) : (
          <div className="space-y-3">
            {discrepancies.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 rounded-xl border border-red-100" style={{ backgroundColor: '#FEF2F2' }}>
                <div>
                  <p className="font-medium" style={{ color: colors.primary }}>{item.reportNumber}</p>
                  <p className="text-sm text-gray-500">{item.description || 'Không có mô tả'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(item.status)}
                  <Button size="sm" variant="outline" onClick={() => handleViewDiscrepancy(item)}>
                    <Eye className="size-4 mr-1" />
                    Chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render Returns Section
  const renderReturns = () => (
    <Card className="border-0" style={{ backgroundColor: colors.white }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
          <RotateCcw className="size-5 text-blue-500" />
          Yêu cầu trả hàng ({returns.length})
        </CardTitle>
        <CardDescription>Các yêu cầu trả hàng cần xử lý</CardDescription>
      </CardHeader>
      <CardContent>
        {returns.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="size-12 mx-auto mb-3" style={{ color: colors.accent }} />
            <p className="font-medium" style={{ color: colors.primary }}>Tuyệt vời!</p>
            <p className="text-gray-500 text-sm">Không có yêu cầu trả hàng chờ xử lý</p>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: colors.background }}>
                <div>
                  <p className="font-medium" style={{ color: colors.primary }}>{item.returnNumber}</p>
                  <p className="text-sm text-gray-500">Lý do: {item.returnReason || 'Không có lý do'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(item.status)}
                  <Button size="sm" variant="outline" onClick={() => handleViewReturn(item)}>
                    <Eye className="size-4 mr-1" />
                    Chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render content based on selected tab
  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'shipping':
        return <StaffShippingManager onRefreshStats={fetchDashboardData} />;
      case 'warehouses':
        return renderWarehouses();
      case 'receipts':
        return renderReceipts();
      case 'inventory':
        return renderInventory();
      case 'discrepancies':
        return renderDiscrepancies();
      case 'returns':
        return renderReturns();
      default:
        return renderOverview();
    }
  };

  return (
    <StaffLayout
      currentTab={selectedTab}
      onTabChange={setSelectedTab}
      staffName={staffProfile?.userFullName || user.fullName || 'Nhân viên kho'}
      staffPosition={staffProfile?.position || 'Staff'}
      employeeCode={staffProfile?.employeeCode}
      notificationCount={stats.openDiscrepancies + stats.pendingReturns}
      onRefresh={fetchDashboardData}
      loading={loading}
    >
      {renderContent()}

      {/* Receipt Detail Dialog */}
      <Dialog open={receiptDetailOpen} onOpenChange={setReceiptDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết phiếu nhập</DialogTitle>
            <DialogDescription>{selectedReceipt?.receiptNumber}</DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Kho nhận</p>
                  <p className="font-medium">{selectedReceipt.warehouseName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  {getStatusBadge(selectedReceipt.status)}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Ngày đến</p>
                  <p className="font-medium">{new Date(selectedReceipt.arrivalDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Số lượng</p>
                  <p className="font-medium">{selectedReceipt.totalAccepted}/{selectedReceipt.totalExpected}</p>
                </div>
              </div>
              {selectedReceipt.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Ghi chú</p>
                  <p className="text-sm">{selectedReceipt.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedReceipt?.status === 'Inspecting' && (
              <Button onClick={() => handleCompleteInspection(selectedReceipt.id)} disabled={actionLoading}>
                {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Hoàn thành kiểm tra
              </Button>
            )}
            {selectedReceipt?.status === 'Accepted' && (
              <Button onClick={() => handleStoreGoods(selectedReceipt.id)} disabled={actionLoading}>
                {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Lưu vào kho
              </Button>
            )}
            <Button variant="outline" onClick={() => setReceiptDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection Dialog */}
      <Dialog open={inspectionDialogOpen} onOpenChange={setInspectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bắt đầu kiểm tra phiếu nhập</DialogTitle>
            <DialogDescription>{selectedReceipt?.receiptNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Bạn có chắc muốn bắt đầu kiểm tra phiếu nhập này? Phiếu sẽ chuyển sang trạng thái "Đang kiểm tra".
            </p>
            {selectedReceipt && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Kho:</strong> {selectedReceipt.warehouseName}</p>
                <p className="text-sm"><strong>Số lượng dự kiến:</strong> {selectedReceipt.totalExpected}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectionDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleInspectReceipt} disabled={actionLoading}>
              {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Bắt đầu kiểm tra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Detail Dialog */}
      <Dialog open={warehouseDetailOpen} onOpenChange={setWarehouseDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết kho hàng</DialogTitle>
            <DialogDescription>{selectedWarehouseDetail?.code}</DialogDescription>
          </DialogHeader>
          {selectedWarehouseDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Tên kho</p>
                  <p className="font-medium">{selectedWarehouseDetail.name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  <Badge variant={selectedWarehouseDetail.isActive ? 'default' : 'secondary'}>
                    {selectedWarehouseDetail.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                  <p className="text-xs text-gray-500">Địa chỉ</p>
                  <p className="font-medium">
                    {[
                      selectedWarehouseDetail.addressStreet,
                      selectedWarehouseDetail.addressDistrict,
                      selectedWarehouseDetail.addressCity
                    ].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Điện thoại</p>
                  <p className="font-medium">{selectedWarehouseDetail.phone || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Sức chứa</p>
                  <p className="font-medium">{selectedWarehouseDetail.capacity || '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarehouseDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discrepancy Detail Dialog */}
      <Dialog open={discrepancyDetailOpen} onOpenChange={setDiscrepancyDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết sai lệch</DialogTitle>
            <DialogDescription>{selectedDiscrepancy?.reportNumber}</DialogDescription>
          </DialogHeader>
          {selectedDiscrepancy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Loại sai lệch</p>
                  <p className="font-medium">{selectedDiscrepancy.discrepancyType}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  {getStatusBadge(selectedDiscrepancy.status)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Mô tả</p>
                <p className="text-sm">{selectedDiscrepancy.description || 'Không có mô tả'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedDiscrepancy?.status === 'open' && (
              <Button 
                onClick={() => handleResolveDiscrepancy(selectedDiscrepancy.id, 'resolved', 'Đã giải quyết')} 
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Giải quyết
              </Button>
            )}
            <Button variant="outline" onClick={() => setDiscrepancyDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Detail Dialog */}
      <Dialog open={returnDetailOpen} onOpenChange={setReturnDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu trả hàng</DialogTitle>
            <DialogDescription>{selectedReturn?.returnNumber}</DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  {getStatusBadge(selectedReturn.status)}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Ngày tạo</p>
                  <p className="font-medium">{new Date(selectedReturn.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Lý do trả hàng</p>
                <p className="text-sm">{selectedReturn.returnReason || 'Không có lý do'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedReturn?.status === 'pending' && (
              <Button onClick={() => handleApproveReturn(selectedReturn.id)} disabled={actionLoading}>
                {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Duyệt yêu cầu
              </Button>
            )}
            <Button variant="outline" onClick={() => setReturnDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
