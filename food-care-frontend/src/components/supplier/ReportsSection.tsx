import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { SectionHeader } from './SupplierLayout';
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    ShoppingCart,
    Package,
    DollarSign,
    BarChart3,
    PieChart,
    Activity,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

// Mock data
const performanceData = [
    { month: 'T1', orders: 45, revenue: 12500000, products: 25 },
    { month: 'T2', orders: 52, revenue: 15200000, products: 28 },
    { month: 'T3', orders: 61, revenue: 18800000, products: 32 },
    { month: 'T4', orders: 55, revenue: 16100000, products: 30 },
    { month: 'T5', orders: 72, revenue: 21500000, products: 35 },
    { month: 'T6', orders: 65, revenue: 19200000, products: 33 },
];

const categoryData = [
    { name: 'Rau củ', value: 45, revenue: 32000000 },
    { name: 'Trái cây', value: 28, revenue: 25000000 },
    { name: 'Thực phẩm khô', value: 15, revenue: 18000000 },
    { name: 'Đồ uống', value: 12, revenue: 15000000 },
];

export function ReportsSection() {
    const [period, setPeriod] = useState('6months');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const reports = [
        {
            id: 'revenue',
            title: 'Báo cáo doanh thu',
            description: 'Tổng hợp doanh thu theo thời gian',
            icon: DollarSign,
            color: 'blue',
        },
        {
            id: 'orders',
            title: 'Báo cáo đơn hàng',
            description: 'Thống kê đơn hàng và trạng thái',
            icon: ShoppingCart,
            color: 'blue',
        },
        {
            id: 'products',
            title: 'Báo cáo sản phẩm',
            description: 'Phân tích hiệu suất sản phẩm',
            icon: Package,
            color: 'purple',
        },
        {
            id: 'performance',
            title: 'Báo cáo hiệu suất',
            description: 'Đánh giá hoạt động tổng thể',
            icon: Activity,
            color: 'orange',
        },
    ];

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
        cyan: 'bg-cyan-100 text-cyan-600',
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Báo cáo vận hành"
                description="Thống kê và phân tích hoạt động kinh doanh"
                actions={
                    <div className="flex items-center gap-3">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[180px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Chọn kỳ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7days">7 ngày qua</SelectItem>
                                <SelectItem value="30days">30 ngày qua</SelectItem>
                                <SelectItem value="6months">6 tháng qua</SelectItem>
                                <SelectItem value="1year">1 năm qua</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Xuất tất cả
                        </Button>
                    </div>
                }
            />

            {/* Quick Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reports.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Card
                            key={report.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer group"
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[report.color]}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {report.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Download className="h-4 w-4" />
                                    Tải xuống
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Performance Overview Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Tổng quan hiệu suất</CardTitle>
                                <CardDescription>So sánh doanh thu và đơn hàng theo tháng</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Xuất
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === 'revenue') return [formatCurrency(value as number), 'Doanh thu'];
                                        return [value, name === 'orders' ? 'Đơn hàng' : 'Sản phẩm'];
                                    }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="orders" name="Đơn hàng" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Category Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <PieChart className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Phân bố theo danh mục</CardTitle>
                                <CardDescription>Số lượng sản phẩm theo danh mục</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {categoryData.map((category, index) => {
                                const colors = ['bg-blue-500', 'bg-blue-400', 'bg-blue-600', 'bg-blue-300'];
                                const bgColors = ['bg-blue-100', 'bg-blue-50', 'bg-blue-100', 'bg-blue-50'];
                                return (
                                    <div key={category.name} className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{category.name}</span>
                                                <span className="text-sm text-gray-500">{category.value} SP</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${colors[index % colors.length]} rounded-full`}
                                                    style={{ width: `${(category.value / 45) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Doanh thu theo danh mục</CardTitle>
                                <CardDescription>Tổng doanh thu từ mỗi danh mục</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {categoryData.sort((a, b) => b.revenue - a.revenue).map((category, index) => (
                                <div
                                    key={category.name}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium">{category.name}</span>
                                    </div>
                                    <span className="font-semibold text-blue-600">
                                        {formatCurrency(category.revenue)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Trend Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Activity className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Xu hướng tăng trưởng</CardTitle>
                            <CardDescription>Biểu đồ tăng trưởng số lượng sản phẩm</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => [value, 'Sản phẩm']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="products"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="url(#colorProducts)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
