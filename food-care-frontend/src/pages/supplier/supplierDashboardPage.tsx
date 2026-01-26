import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import { OrderDetailDialog } from '../components/OrderDetailDialog';
import { toast } from 'sonner';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Star, 
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Truck,
  MessageSquare,
  BarChart3,
  Settings,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { ProviderStats, ProviderOrder, ProviderProduct, ProviderRevenue } from '../types';

// Mock data for provider
const mockStats: ProviderStats = {
  todayOrders: 12,
  pendingOrders: 5,
  overdueOrders: 2,
  todayRevenue: 3450000,
  rating: 4.8,
  cancelRate: 2.3,
  lateDeliveryRate: 1.2,
  lowStockProducts: 8,
};

const mockOrders: ProviderOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-20240122-001',
    date: '2024-01-22T08:30:00',
    status: 'pending',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    items: [
      {
        product: {
          id: '1',
          name: 'Gạo ST25 Cao Cấp',
          category: 'Thực phẩm khô',
          price: 185000,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
          description: 'Gạo ST25',
          unit: '5kg',
          stock: 50,
          rating: 4.8,
          reviews: 324,
        },
        quantity: 2,
        price: 185000,
      },
    ],
    subtotal: 370000,
    discount: 0,
    shipping: 30000,
    total: 400000,
    shippingAddress: {
      id: '1',
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      address: '123 Nguyễn Huệ',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      isDefault: true,
    },
    paymentMethod: {
      id: '1',
      type: 'momo',
      name: 'MoMo',
      isDefault: true,
    },
    customerNote: 'Giao giờ hành chính',
    slaDeadline: '2024-01-22T14:00:00',
    isOverdue: false,
  },
  {
    id: '2',
    orderNumber: 'ORD-20240122-002',
    date: '2024-01-22T09:15:00',
    status: 'accepted',
    customerName: 'Trần Thị B',
    customerPhone: '0912345678',
    items: [
      {
        product: {
          id: '2',
          name: 'Dầu Ăn Cao Cấp',
          category: 'Gia vị',
          price: 65000,
          image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5',
          description: 'Dầu ăn',
          unit: '2L',
          stock: 100,
          rating: 4.7,
          reviews: 256,
        },
        quantity: 3,
        price: 65000,
      },
    ],
    subtotal: 195000,
    discount: 19500,
    shipping: 25000,
    total: 200500,
    shippingAddress: {
      id: '2',
      name: 'Trần Thị B',
      phone: '0912345678',
      address: '456 Lê Lợi',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 3',
      isDefault: true,
    },
    paymentMethod: {
      id: '2',
      type: 'zalopay',
      name: 'ZaloPay',
      isDefault: true,
    },
    slaDeadline: '2024-01-22T15:00:00',
    isOverdue: false,
  },
  {
    id: '3',
    orderNumber: 'ORD-20240121-089',
    date: '2024-01-21T16:30:00',
    status: 'preparing',
    customerName: 'Lê Văn C',
    customerPhone: '0923456789',
    items: [],
    subtotal: 550000,
    discount: 0,
    shipping: 30000,
    total: 580000,
    shippingAddress: {
      id: '3',
      name: 'Lê Văn C',
      phone: '0923456789',
      address: '789 Võ Văn Tần',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 10',
      isDefault: true,
    },
    paymentMethod: {
      id: '3',
      type: 'momo',
      name: 'MoMo',
      isDefault: true,
    },
    customerNote: 'Gọi trước 15 phút',
    slaDeadline: '2024-01-22T10:00:00',
    isOverdue: true,
  },
];

const mockProducts: ProviderProduct[] = [
  {
    id: '1',
    name: 'Gạo ST25 Cao Cấp',
    category: 'Thực phẩm khô',
    price: 185000,
    originalPrice: 200000,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
    description: 'Gạo ST25 thơm ngon, hạt dài',
    unit: '5kg',
    stock: 50,
    rating: 4.8,
    reviews: 324,
    providerId: 'provider-1',
    costPrice: 150000,
    profit: 35000,
    status: 'active',
  },
  {
    id: '2',
    name: 'Dầu Ăn Cao Cấp',
    category: 'Gia vị',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5',
    description: 'Dầu ăn tinh luyện',
    unit: '2L',
    stock: 100,
    rating: 4.7,
    reviews: 256,
    providerId: 'provider-1',
    costPrice: 52000,
    profit: 13000,
    status: 'active',
  },
  {
    id: '3',
    name: 'Cà Phê Phin Robusta',
    category: 'Đồ uống',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e',
    description: 'Cà phê rang xay',
    unit: '500g',
    stock: 5,
    rating: 4.6,
    reviews: 189,
    providerId: 'provider-1',
    costPrice: 75000,
    profit: 20000,
    status: 'active',
  },
];

const mockRevenues: ProviderRevenue[] = [
  {
    date: '2024-01-22',
    ordersCount: 12,
    revenue: 3450000,
    commission: 517500, // 15%
    netRevenue: 2932500,
    status: 'pending',
  },
  {
    date: '2024-01-21',
    ordersCount: 18,
    revenue: 5200000,
    commission: 780000,
    netRevenue: 4420000,
    status: 'pending',
  },
  {
    date: '2024-01-20',
    ordersCount: 15,
    revenue: 4100000,
    commission: 615000,
    netRevenue: 3485000,
    status: 'paid',
  },
];

export default function ProviderDashboardPage() {
  const { user, logout } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState<ProviderOrder | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orders, setOrders] = useState<ProviderOrder[]>(mockOrders);

  if (!user || user.role !== 'provider') {
    logout();
    return null;
  }

  const providerInfo = user.providerInfo!;

  const handleViewOrder = (order: ProviderOrder) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any }
          : order
      )
    );
    
    const statusLabels: Record<string, string> = {
      accepted: 'Đã nhận đơn hàng',
      preparing: 'Đã bắt đầu chuẩn bị',
      ready_to_ship: 'Đơn hàng sẵn sàng giao',
      shipping: 'Đã bàn giao cho shipper',
      delivered: 'Đã giao hàng thành công',
      cancelled: 'Đã từ chối đơn hàng',
    };
    
    toast.success(statusLabels[newStatus] || 'Cập nhật trạng thái thành công');
    setIsOrderDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Chờ xác nhận' },
      accepted: { variant: 'default', label: 'Đã nhận' },
      preparing: { variant: 'default', label: 'Đang chuẩn bị' },
      ready_to_ship: { variant: 'default', label: 'Sẵn sàng giao' },
      shipping: { variant: 'default', label: 'Đang giao' },
      delivered: { variant: 'default', label: 'Đã giao' },
      cancelled: { variant: 'destructive', label: 'Đã hủy' },
    };
    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Package className="size-8 text-teal-600" />
              <div>
                <h1 className="font-semibold text-xl">{providerInfo.storeName}</h1>
                <p className="text-sm text-gray-600">Provider Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                Level: {providerInfo.level}
              </Badge>
              <Button variant="outline" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-6 w-full max-w-5xl mb-8">
            <TabsTrigger value="overview">
              <BarChart3 className="size-4 mr-2" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="size-4 mr-2" />
              Đơn hàng
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="size-4 mr-2" />
              Sản phẩm
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="size-4 mr-2" />
              Doanh thu
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="size-4 mr-2" />
              Đánh giá
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="size-4 mr-2" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* Alert warnings */}
            {mockStats.overdueOrders > 0 && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="size-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Bạn có <strong>{mockStats.overdueOrders} đơn hàng quá hạn</strong> cần xử lý ngay!
                </AlertDescription>
              </Alert>
            )}

            {mockStats.lowStockProducts > 0 && (
              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <AlertTriangle className="size-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Có <strong>{mockStats.lowStockProducts} sản phẩm</strong> sắp hết hàng
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đơn hôm nay</CardTitle>
                  <ShoppingCart className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.todayOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    {mockStats.pendingOrders} đơn chờ xác nhận
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Doanh thu hôm nay</CardTitle>
                  <DollarSign className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockStats.todayRevenue.toLocaleString('vi-VN')}đ
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% so với hôm qua
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đánh giá</CardTitle>
                  <Star className="size-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.rating}</div>
                  <p className="text-xs text-muted-foreground">
                    Tỉ lệ hủy: {mockStats.cancelRate}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đơn quá hạn</CardTitle>
                  <AlertTriangle className="size-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{mockStats.overdueOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Tỉ lệ giao trễ: {mockStats.lateDeliveryRate}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Đơn hàng cần xử lý</CardTitle>
                <CardDescription>Các đơn hàng đang chờ bạn xác nhận hoặc chuẩn bị</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Giá trị</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.date).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>{order.total.toLocaleString('vi-VN')}đ</TableCell>
                        <TableCell>
                          <div className={order.isOverdue ? 'text-red-600 font-medium' : ''}>
                            {new Date(order.slaDeadline).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {order.isOverdue && <AlertTriangle className="size-3 inline ml-1" />}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <>
                                <Button size="sm" variant="default">
                                  <CheckCircle className="size-3 mr-1" />
                                  Nhận
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <XCircle className="size-3 mr-1" />
                                  Từ chối
                                </Button>
                              </>
                            )}
                            {order.status === 'accepted' && (
                              <Button size="sm" variant="default">
                                <Package className="size-3 mr-1" />
                                Chuẩn bị
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button size="sm" variant="default">
                                <Truck className="size-3 mr-1" />
                                Sẵn sàng giao
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý đơn hàng</CardTitle>
                <CardDescription>Tất cả đơn hàng của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="pending">Chờ xác nhận</SelectItem>
                      <SelectItem value="accepted">Đã nhận</SelectItem>
                      <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                      <SelectItem value="ready_to_ship">Sẵn sàng giao</SelectItem>
                      <SelectItem value="shipping">Đang giao</SelectItem>
                      <SelectItem value="delivered">Đã giao</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Tìm mã đơn, SĐT..." className="max-w-sm" />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Giá trị</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          {new Date(order.date).toLocaleDateString('vi-VN')}
                          <br />
                          <span className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{order.items.length} sản phẩm</TableCell>
                        <TableCell className="font-medium">
                          {order.total.toLocaleString('vi-VN')}đ
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)}>
                            <Eye className="size-3 mr-1" />
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quản lý sản phẩm</CardTitle>
                    <CardDescription>
                      {mockProducts.length} sản phẩm • {mockStats.lowStockProducts} sắp hết hàng
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="active">Đang bán</SelectItem>
                      <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                      <SelectItem value="draft">Nháp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Tìm sản phẩm..." className="max-w-sm" />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Giá bán</TableHead>
                      <TableHead>Giá vốn</TableHead>
                      <TableHead>Lợi nhuận</TableHead>
                      <TableHead>Tồn kho</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="size-12 rounded object-cover"
                            />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.unit}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.price.toLocaleString('vi-VN')}đ
                        </TableCell>
                        <TableCell>{product.costPrice.toLocaleString('vi-VN')}đ</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          +{product.profit.toLocaleString('vi-VN')}đ
                        </TableCell>
                        <TableCell>
                          <span className={product.stock < 10 ? 'text-red-600 font-medium' : ''}>
                            {product.stock}
                            {product.stock < 10 && <AlertTriangle className="size-3 inline ml-1" />}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? 'Đang bán' : 'Hết hàng'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="size-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <div className="grid gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Doanh thu tuần này</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12,750,000đ</div>
                    <p className="text-xs text-muted-foreground">45 đơn hàng</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">8,352,500đ</div>
                    <p className="text-xs text-muted-foreground">Thanh toán T+7</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">3,485,000đ</div>
                    <p className="text-xs text-muted-foreground">Tuần trước</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Báo cáo doanh thu</CardTitle>
                      <CardDescription>Chi tiết doanh thu theo ngày</CardDescription>
                    </div>
                    <Button variant="outline">
                      <Download className="size-4 mr-2" />
                      Xuất Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Số đơn</TableHead>
                        <TableHead>Doanh thu</TableHead>
                        <TableHead>Phí nền tảng (15%)</TableHead>
                        <TableHead>Doanh thu ròng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockRevenues.map((revenue, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {new Date(revenue.date).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>{revenue.ordersCount}</TableCell>
                          <TableCell className="font-medium">
                            {revenue.revenue.toLocaleString('vi-VN')}đ
                          </TableCell>
                          <TableCell className="text-red-600">
                            -{revenue.commission.toLocaleString('vi-VN')}đ
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {revenue.netRevenue.toLocaleString('vi-VN')}đ
                          </TableCell>
                          <TableCell>
                            <Badge variant={revenue.status === 'paid' ? 'default' : 'secondary'}>
                              {revenue.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <FileText className="size-3 mr-1" />
                              Chi tiết
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá & Chất lượng</CardTitle>
                <CardDescription>
                  Rating trung bình: {mockStats.rating} ⭐ • Tỉ lệ hủy: {mockStats.cancelRate}% • Giao
                  trễ: {mockStats.lateDeliveryRate}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Star className="size-4" />
                    <AlertDescription>
                      Bạn đang làm rất tốt! Tiếp tục duy trì chất lượng để được nâng hạng lên Platinum.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Đánh giá 5 sao</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">87%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Tỉ lệ hủy đơn</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{mockStats.cancelRate}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Giao hàng đúng hạn</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">98.8%</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cửa hàng</CardTitle>
                  <CardDescription>Cập nhật thông tin cửa hàng của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="storeName">Tên cửa hàng</Label>
                    <Input id="storeName" defaultValue={providerInfo.storeName} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user.email} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input id="phone" defaultValue={user.phone} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Địa chỉ kho hàng</Label>
                    <Textarea id="address" defaultValue="123 Nguyễn Văn Linh, Quận 7, TP.HCM" />
                  </div>
                  <Button>Lưu thay đổi</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Giấy tờ pháp lý</CardTitle>
                  <CardDescription>Quản lý giấy phép kinh doanh và giấy tờ liên quan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Giấy phép kinh doanh</div>
                      <div className="text-sm text-gray-500">Đã xác thực</div>
                    </div>
                    <Badge>Đã duyệt</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">CCCD/CMND</div>
                      <div className="text-sm text-gray-500">Đã xác thực</div>
                    </div>
                    <Badge>Đã duyệt</Badge>
                  </div>
                  <Button variant="outline">
                    <Upload className="size-4 mr-2" />
                    Tải lên giấy tờ mới
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thông tin thanh toán</CardTitle>
                  <CardDescription>Tài khoản nhận tiền từ nền tảng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bankName">Ngân hàng</Label>
                    <Input id="bankName" defaultValue="Vietcombank" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="accountNumber">Số tài khoản</Label>
                    <Input id="accountNumber" defaultValue="1234567890" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="accountName">Chủ tài khoản</Label>
                    <Input id="accountName" defaultValue={providerInfo.storeName} />
                  </div>
                  <Button>Cập nhật thông tin</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hỗ trợ</CardTitle>
                  <CardDescription>Liên hệ với chúng tôi khi cần hỗ trợ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <MessageSquare className="size-8 text-teal-600" />
                    <div>
                      <div className="font-medium">Hotline hỗ trợ Provider</div>
                      <div className="text-sm text-gray-500">1900 xxxx (7:00 - 22:00)</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="size-4 mr-2" />
                    Tạo ticket hỗ trợ
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}