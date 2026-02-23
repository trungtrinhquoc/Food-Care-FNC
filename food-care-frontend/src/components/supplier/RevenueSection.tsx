import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { SectionHeader, SectionSkeleton } from './SupplierLayout';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Download,
    Calendar,
    Package,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';
import { revenueApi } from '@/services/supplier/supplierApi';
import type { RevenueData } from '@/services/supplier/supplierApi';

interface RevenueSectionProps {
    loading?: boolean;
}

export function RevenueSection({ loading = false }: RevenueSectionProps) {
    const [period, setPeriod] = useState('6');
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRevenueData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const months = parseInt(period);
                const data = await revenueApi.getRevenue(months);
                setRevenueData(data);
            } catch (err) {
                console.error('Failed to fetch revenue data:', err);
                setError('Không thể tải dữ liệu doanh thu');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRevenueData();
    }, [period]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading || isLoading) {
        return <SectionSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>{error}</p>
                <Button onClick={() => setPeriod(period)} className="mt-4">
                    Thử lại
                </Button>
            </div>
        );
    }

    const totalRevenue = revenueData?.totalRevenue || 0;
    const totalOrders = revenueData?.totalOrders || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const monthlyRevenueData = revenueData?.monthlyRevenue || [];
    const topProducts = revenueData?.topProducts || [];

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Doanh thu & Phân tích"
                description="Thống kê doanh thu và hiệu suất kinh doanh"
                actions={
                    <div className="flex items-center gap-3">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[180px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Chọn kỳ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 tháng qua</SelectItem>
                                <SelectItem value="3">3 tháng qua</SelectItem>
                                <SelectItem value="6">6 tháng qua</SelectItem>
                                <SelectItem value="12">1 năm qua</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Xuất báo cáo
                        </Button>
                    </div>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Tổng doanh thu</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
                                <div className="flex items-center gap-1 mt-2 text-blue-100">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-sm">+12% so với kỳ trước</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                <DollarSign className="h-7 w-7" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Tổng đơn hàng</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalOrders}</p>
                                <div className="flex items-center gap-1 mt-2 text-blue-600">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-sm">+8% so với kỳ trước</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Package className="h-7 w-7 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Giá trị TB/đơn</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(avgOrderValue)}</p>
                                <div className="flex items-center gap-1 mt-2 text-blue-600">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-sm">+3% so với kỳ trước</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-7 w-7 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Doanh thu theo tháng</CardTitle>
                        <CardDescription>Biểu đồ so sánh doanh thu các tháng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyRevenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(value as number), 'Doanh thu']}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                    />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Trend Line Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Xu hướng đơn hàng</CardTitle>
                        <CardDescription>Số lượng đơn hàng qua các tháng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyRevenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="orders"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Sản phẩm bán chạy nhất</CardTitle>
                    <CardDescription>Top sản phẩm theo doanh thu</CardDescription>
                </CardHeader>
                <CardContent>
                    {topProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Chưa có dữ liệu sản phẩm
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((product, index) => (
                                <div
                                    key={product.productId}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{product.productName}</p>
                                        <p className="text-sm text-gray-500">Đã bán: {product.quantity} sản phẩm</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
