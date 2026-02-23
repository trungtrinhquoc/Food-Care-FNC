import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Mail, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminSubscriptionApi, type AdminSubscriptionDto, type SubscriptionFilters } from '../../services/adminSubscriptionApi';
import { toast } from 'sonner';
import SubscriptionDetailDialog from '@/components/admin/SubscriptionDetailDialog';

export default function SubscriptionsList() {
    const [subscriptions, setSubscriptions] = useState<AdminSubscriptionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
    const [selectedForEmail, setSelectedForEmail] = useState<Set<string>>(new Set());
    const [sendingEmail, setSendingEmail] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [frequencyFilter, setFrequencyFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const pageSize = 10;

    useEffect(() => {
        loadSubscriptions();
    }, [page, statusFilter, frequencyFilter]);

    const loadSubscriptions = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập');
            return;
        }

        try {
            setLoading(true);
            const filters: SubscriptionFilters = {
                searchTerm: searchTerm || undefined,
                status: statusFilter || undefined,
                frequency: frequencyFilter || undefined,
                page,
                pageSize
            };

            const response = await adminSubscriptionApi.getAllSubscriptions(filters, token);
            if (response.success) {
                setSubscriptions(response.data.subscriptions);
                setTotalPages(response.data.totalPages);
                setTotalCount(response.data.totalCount);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải danh sách subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadSubscriptions();
    };

    const handleSelectForEmail = (id: string) => {
        const newSelected = new Set(selectedForEmail);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedForEmail(newSelected);
    };

    const handleSendEmails = async () => {
        if (selectedForEmail.size === 0) {
            toast.error('Vui lòng chọn ít nhất một subscription');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setSendingEmail(true);
            const response = await adminSubscriptionApi.sendManualReminders(
                { subscriptionIds: Array.from(selectedForEmail) },
                token
            );

            if (response.success) {
                toast.success(response.data.message);
                setSelectedForEmail(new Set());
                loadSubscriptions();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể gửi email');
        } finally {
            setSendingEmail(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            active: { label: 'Hoạt động', className: 'bg-green-100 text-green-700' },
            paused: { label: 'Tạm dừng', className: 'bg-orange-100 text-orange-700' },
            cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
        };

        const config = statusMap[status.toLowerCase()] || { label: status, className: 'bg-gray-100 text-gray-700' };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const getFrequencyLabel = (frequency: string) => {
        const map: Record<string, string> = {
            weekly: 'Hàng tuần',
            biweekly: '2 tuần/lần',
            monthly: 'Hàng tháng',
        };
        return map[frequency.toLowerCase()] || frequency;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Danh Sách Subscriptions</h2>
                <p className="text-sm text-gray-600">Quản lý tất cả subscriptions của khách hàng</p>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, số điện thoại..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition"
                    >
                        Tìm kiếm
                    </button>
                </div>

                {/* Filters Row */}
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Lọc:</span>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="paused">Tạm dừng</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>

                    <select
                        value={frequencyFilter}
                        onChange={(e) => { setFrequencyFilter(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        <option value="">Tất cả tần suất</option>
                        <option value="weekly">Hàng tuần</option>
                        <option value="biweekly">2 tuần/lần</option>
                        <option value="monthly">Hàng tháng</option>
                    </select>

                    {selectedForEmail.size > 0 && (
                        <button
                            onClick={handleSendEmails}
                            disabled={sendingEmail}
                            className="ml-auto px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition flex items-center gap-2"
                        >
                            {sendingEmail ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-4 h-4" />
                                    Gửi Email ({selectedForEmail.size})
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            ) : subscriptions.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500">Không tìm thấy subscription nào</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedForEmail.size === subscriptions.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedForEmail(new Set(subscriptions.filter(s => s.status.toLowerCase() === 'active').map(s => s.id)));
                                                } else {
                                                    setSelectedForEmail(new Set());
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Khách hàng</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Sản phẩm</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tần suất</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Giao tiếp theo</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {subscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedForEmail.has(sub.id)}
                                                onChange={() => handleSelectForEmail(sub.id)}
                                                disabled={sub.status.toLowerCase() !== 'active'}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className="font-medium text-gray-900">{sub.customerName}</div>
                                                <div className="text-xs text-gray-500">{sub.customerEmail}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {sub.productImage && (
                                                    <img src={sub.productImage} alt={sub.productName} className="w-10 h-10 rounded object-cover" />
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">{sub.productName}</div>
                                                    <div className="text-xs text-gray-500">x{sub.quantity}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{getFrequencyLabel(sub.frequency)}</td>
                                        <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {new Date(sub.nextDeliveryDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedSubscription(sub.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Hiển thị {subscriptions.length} / {totalCount} subscriptions
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-700">
                                Trang {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Detail Dialog */}
            {selectedSubscription && (
                <SubscriptionDetailDialog
                    subscriptionId={selectedSubscription}
                    onClose={() => setSelectedSubscription(null)}
                    onRefresh={loadSubscriptions}
                />
            )}
        </div>
    );
}
