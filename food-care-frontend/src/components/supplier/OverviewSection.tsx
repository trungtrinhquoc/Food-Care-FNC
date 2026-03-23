import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StatCard, SectionSkeleton, EmptyState } from './SupplierLayout';
import { ChartContainer } from '../admin/ChartContainer';
import {
    ShoppingCart,
    DollarSign,
    Package,
    TrendingUp,
    AlertTriangle,
    Eye,
    CheckCircle,
    XCircle,
    ArrowRight,
    Clock,
    Users,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import type { SupplierStats, SupplierOrder } from '../../services/supplier/supplierApi';
import { revenueApi } from '../../services/supplier/supplierApi';
import type { RevenueData } from '../../services/supplier/supplierApi';

interface OverviewSectionProps {
    stats: SupplierStats | null;
    orders: SupplierOrder[];
    loadingStats: boolean;
    loadingOrders: boolean;
    onViewOrder: (order: SupplierOrder) => void;
    onConfirmOrder: (orderId: string) => void;
    onRejectOrder: (orderId: string) => void;
    onViewAllOrders: () => void;
}

export function OverviewSection({
    stats,
    orders,
    loadingStats,
    loadingOrders,
    onViewOrder,
    onConfirmOrder,
    onRejectOrder,
    onViewAllOrders,
}: OverviewSectionProps) {
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
    const [loadingRevenue, setLoadingRevenue] = useState(true);

    useEffect(() => {
        const fetchRevenueData = async () => {
            try {
                // Fetch last 1 month of data for daily chart
                const data = await revenueApi.getRevenue(1);
                setRevenueData(data);
            } catch (err) {
                console.error('Failed to fetch revenue data:', err);
            } finally {
                setLoadingRevenue(false);
            }
        };

        fetchRevenueData();
    }, []);

    // Format daily revenue for chart display
    const chartData = useMemo(() => {
        if (!revenueData?.dailyRevenue) return [];
        
        // Get last 7 days of data
        const last7Days = revenueData.dailyRevenue.slice(-7);
        return last7Days.map(item => ({
            name: new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
            revenue: item.revenue,
        }));
    }, [revenueData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string; className: string }> = {
            pending: { variant: 'secondary', label: 'Chờ xác nhận', className: 'bg-amber-100 text-amber-800 border-amber-200' },
            confirmed: { variant: 'default', label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800 border-blue-200' },
            processing: { variant: 'default', label: 'Đang xử lý', className: 'bg-purple-100 text-purple-800 border-purple-200' },
            shipping: { variant: 'default', label: 'Đang giao', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
            shipped: { variant: 'default', label: 'Đang giao', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
            delivered: { variant: 'default', label: 'Đã giao', className: 'bg-blue-100 text-blue-800 border-blue-200' },
            cancelled: { variant: 'destructive', label: 'Đã hủy', className: 'bg-red-100 text-red-800 border-red-200' },
        };
        const config = configs[status] || { variant: 'secondary' as const, label: status, className: '' };
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    // Calculate order status distribution for pie chart
    const orderStatusData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Hoàn thành', value: stats.completedOrders, color: '#3b82f6' },
            { name: 'Đang xử lý', value: stats.pendingOrders, color: '#60a5fa' },
            { name: 'Đã hủy', value: stats.cancelledOrders, color: '#ef4444' },
        ].filter(item => item.value > 0);
    }, [stats]);

    const pendingOrders = orders.filter(o => o.status === 'pending').slice(0, 5);

    if (loadingStats) {
        return <SectionSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Chào mừng trở lại! 👋</h1>
                <p className="text-blue-100">
                    Đây là tổng quan hoạt động kinh doanh của bạn hôm nay.
                </p>
            </div>

            {/* Alert Banner */}
            {stats && (stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.pendingOrders > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-amber-800">
                                    {stats.pendingOrders} đơn hàng đang chờ xác nhận
                                </p>
                                <p className="text-sm text-amber-600">Vui lòng xử lý sớm để đảm bảo chất lượng dịch vụ</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                                onClick={onViewAllOrders}
                            >
                                Xem ngay
                            </Button>
                        </div>
                    )}
                    {stats.lowStockProducts > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-orange-800">
                                    {stats.lowStockProducts} sản phẩm sắp hết hàng
                                </p>
                                <p className="text-sm text-orange-600">Cập nhật tồn kho để tránh gián đoạn bán hàng</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Doanh thu tháng này"
                    value={formatCurrency(stats?.thisMonthRevenue || 0)}
                    subtitle={`Tổng: ${formatCurrency(stats?.totalRevenue || 0)}`}
                    icon={DollarSign}
                    trend={stats?.thisMonthRevenue && stats?.lastMonthRevenue
                        ? (stats.thisMonthRevenue > stats.lastMonthRevenue ? 'up' : 'down')
                        : 'neutral'}
                    trendValue={stats?.lastMonthRevenue
                        ? `${Math.abs(Math.round(((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100))}% so với tháng trước`
                        : undefined}
                />
                <StatCard
                    title="Tổng đơn hàng"
                    value={stats?.totalOrders || 0}
                    subtitle={`${stats?.pendingOrders || 0} đơn chờ xử lý`}
                    icon={ShoppingCart}
                />
                <StatCard
                    title="Sản phẩm"
                    value={stats?.totalProducts || 0}
                    subtitle={`${stats?.activeProducts || 0} đang bán`}
                    icon={Package}
                />
                <StatCard
                    title="Tỷ lệ hoàn thành"
                    value={`${stats?.fulfillmentRate || 0}%`}
                    subtitle={`Giao đúng hạn: ${stats?.onTimeDeliveryRate || 0}%`}
                    icon={TrendingUp}
                    trend={stats?.fulfillmentRate && stats.fulfillmentRate >= 80 ? 'up' : 'down'}
                    trendValue={stats?.fulfillmentRate && stats.fulfillmentRate >= 80 ? 'Tốt' : 'Cần cải thiện'}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Doanh thu 7 ngày qua</CardTitle>
                        <CardDescription>Biểu đồ doanh thu hàng ngày</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            {loadingRevenue ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Đang tải...
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Chưa có dữ liệu doanh thu
                                </div>
                            ) : (
                                <ChartContainer className="h-full w-full">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                        />
                                        <Tooltip
                                            formatter={(value) => [formatCurrency(value as number), 'Doanh thu']}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Order Status Pie Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Phân bố đơn hàng</CardTitle>
                        <CardDescription>Theo trạng thái</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {orderStatusData.length > 0 ? (
                            <div className="h-[200px]">
                                <ChartContainer className="h-full w-full">
                                    <PieChart>
                                        <Pie
                                            data={orderStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {orderStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ChartContainer>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-gray-500">
                                Chưa có dữ liệu
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3 mt-4 justify-center">
                            {orderStatusData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-gray-600">
                                        {item.name}: {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Pending Orders */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Đơn hàng cần xử lý</CardTitle>
                        <CardDescription>Các đơn hàng đang chờ xác nhận</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onViewAllOrders} className="gap-2">
                        Xem tất cả
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {loadingOrders ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                    ) : pendingOrders.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle}
                            title="Tuyệt vời!"
                            description="Không có đơn hàng nào đang chờ xử lý"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã đơn</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Tổng tiền</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingOrders.map((order, index) => (
                                    <TableRow key={order.id || order.orderNumber || index} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Users className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <span>{order.customerName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-blue-600">
                                            {formatCurrency(order.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-gray-500">
                                            {formatDate(order.createdAt)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onViewOrder(order)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    onClick={() => onConfirmOrder(order.id)}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => onRejectOrder(order.id)}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
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
