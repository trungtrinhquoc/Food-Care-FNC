import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { SectionHeader, SectionSkeleton } from './SupplierLayout';
import {
    ShieldCheck,
    Star,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    Clock,
    Package,
    BarChart3,
    XCircle,
} from 'lucide-react';
import { slaApi, type SupplierSlaMetrics } from '../../services/supplier/supplierApi';

// =====================================================
// SLA Requirements (static data)
// =====================================================
const SLA_REQUIREMENTS = [
    { metric: 'Tỷ lệ đơn thành công', threshold: '≥ 95%', consequence: 'Cảnh báo → tạm ngừng' },
    { metric: 'Xác nhận đơn', threshold: '≤ 30 phút', consequence: 'Tự chuyển sang mart khác' },
    { metric: 'Giao đúng giờ', threshold: '≥ 90%', consequence: 'Trừ điểm, tụt vị trí' },
    { metric: 'Rating trung bình', threshold: '≥ 4.0 sao', consequence: 'Ẩn khỏi gợi ý đầu' },
];

// =====================================================
// KPI Card
// =====================================================
interface KpiCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    status: 'good' | 'bad' | 'neutral';
    threshold?: string;
}

function KpiCard({ title, value, subtitle, icon: Icon, status, threshold }: KpiCardProps) {
    const statusColors = {
        good: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', value: 'text-emerald-700' },
        bad: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', value: 'text-red-700' },
        neutral: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', value: 'text-blue-700' },
    };
    const colors = statusColors[status];

    return (
        <div className={`rounded-xl border p-5 ${colors.bg} ${colors.border}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status === 'good' ? 'bg-emerald-100' : status === 'bad' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                {status === 'good' ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : status === 'bad' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                ) : null}
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            {threshold && (
                <p className="text-xs text-gray-400 mt-1">Ngưỡng: {threshold}</p>
            )}
        </div>
    );
}

// =====================================================
// SlaSection
// =====================================================
export function SlaSection() {
    const [metrics, setMetrics] = useState<SupplierSlaMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        slaApi.getMetrics()
            .then(setMetrics)
            .catch(() => setError('Không thể tải chỉ số SLA. Vui lòng thử lại.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <SectionSkeleton />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-gray-700 font-medium mb-1">Lỗi tải dữ liệu</p>
                <p className="text-gray-500 text-sm">{error}</p>
            </div>
        );
    }

    if (!metrics) return null;

    const isFullyCompliant = metrics.slaCompliant && metrics.ratingOk;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Hiệu suất & SLA cam kết"
                description="Chỉ số được cập nhật theo thời gian thực từ dữ liệu đơn hàng"
            />

            {/* SLA Status Banner */}
            {isFullyCompliant ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-emerald-800">Đang đạt chuẩn SLA — Tiếp tục duy trì chất lượng!</p>
                        <p className="text-sm text-emerald-600">Tất cả chỉ số đều đạt ngưỡng yêu cầu.</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
                    <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800">Cảnh báo SLA — Một số chỉ số chưa đạt</p>
                        <ul className="mt-1 space-y-0.5 text-sm text-amber-700">
                            {!metrics.slaCompliant && (
                                <li>• Tỷ lệ SLA ({metrics.slaComplianceRate.toFixed(1)}%) chưa đạt ngưỡng 95%</li>
                            )}
                            {!metrics.ratingOk && (
                                <li>• Đánh giá trung bình ({metrics.rating.toFixed(1)}★) chưa đạt ngưỡng 4.0★</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                    title="Tỷ lệ thành công"
                    value={`${metrics.orderSuccessRate.toFixed(1)}%`}
                    subtitle="ngưỡng 95%"
                    icon={TrendingUp}
                    status={metrics.orderSuccessRate >= 95 ? 'good' : 'bad'}
                    threshold="≥ 95%"
                />
                <KpiCard
                    title="Đánh giá TB"
                    value={`${metrics.rating.toFixed(1)} ★`}
                    subtitle="ngưỡng 4.0★"
                    icon={Star}
                    status={metrics.ratingOk ? 'good' : 'bad'}
                    threshold="≥ 4.0 ★"
                />
                <KpiCard
                    title="Đơn hoàn thành"
                    value={`${metrics.completedOrders}`}
                    subtitle={`/ ${metrics.totalOrders} đơn tổng`}
                    icon={CheckCircle}
                    status="neutral"
                />
                <KpiCard
                    title="Giao trễ"
                    value={`${metrics.lateDeliveryCount}`}
                    subtitle="đơn giao trễ"
                    icon={Clock}
                    status={metrics.lateDeliveryCount === 0 ? 'good' : metrics.lateDeliveryCount > 5 ? 'bad' : 'neutral'}
                />
            </div>

            {/* Performance Breakdown */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Chi tiết hiệu suất
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-500 mb-1">Xác nhận trễ</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.lateConfirmationCount}</p>
                            <p className="text-xs text-gray-400">đơn xác nhận trễ &gt; 30 phút</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-500 mb-1">Điểm chất lượng</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.qualityScore.toFixed(0)}<span className="text-base font-medium text-gray-500">/100</span></p>
                            <p className="text-xs text-gray-400">dựa trên đánh giá & phản hồi</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-500 mb-1">Tỷ lệ hoàn hàng</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.returnRate.toFixed(1)}<span className="text-base font-medium text-gray-500">%</span></p>
                            <p className="text-xs text-gray-400">% đơn bị hoàn trả</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SLA Requirements Table */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                        Bảng cam kết SLA
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 pr-4 font-medium text-gray-600">Chỉ số</th>
                                    <th className="text-left py-2 pr-4 font-medium text-gray-600">Ngưỡng tối thiểu</th>
                                    <th className="text-left py-2 font-medium text-gray-600">Hậu quả nếu vi phạm</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {SLA_REQUIREMENTS.map((req, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="py-3 pr-4 font-medium text-gray-800">{req.metric}</td>
                                        <td className="py-3 pr-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {req.threshold}
                                            </span>
                                        </td>
                                        <td className="py-3 text-gray-600">{req.consequence}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <Package className="h-5 w-5 text-blue-600" />
                        Tóm tắt đơn hàng
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900">{metrics.totalOrders}</p>
                            <p className="text-sm text-gray-500 mt-1">Tổng đơn</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-emerald-600">{metrics.completedOrders}</p>
                            <p className="text-sm text-gray-500 mt-1">Hoàn thành</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-red-600">{metrics.cancelledOrders}</p>
                            <p className="text-sm text-gray-500 mt-1">Đã hủy</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{metrics.slaComplianceRate.toFixed(1)}%</p>
                            <p className="text-sm text-gray-500 mt-1">Tỷ lệ SLA</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default SlaSection;
