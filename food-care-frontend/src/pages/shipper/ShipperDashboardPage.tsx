import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Package, CheckCircle2, Clock, Truck, MapPin, Phone, User, ChevronDown, ChevronUp,
    BarChart2, LogOut, RefreshCw, AlertCircle, Bike, QrCode, Check, X, Sun, Moon
} from 'lucide-react';
import {
    shipperApi,
    type ShipperInfo,
    type ShipperStats,
    type ShipperOrder,
    parseShippingAddress,
} from '../../services/shipperApi';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'available' | 'myOrders' | 'delivered' | 'stats';

// ─── Status colors ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-amber-100 text-amber-800 border-amber-200',
    shipping: 'bg-blue-100 text-blue-800 border-blue-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
};

// ─── Format currency ──────────────────────────────────────────────────────────
const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ─── OrderCard ────────────────────────────────────────────────────────────────
interface OrderCardProps {
    order: ShipperOrder;
    myShipperId: string;
    onAccept: (id: string) => void;
    onDeliver: (id: string) => void;
    onFail: (id: string) => void;
    loading: string | null;
}

function OrderCard({ order, myShipperId, onAccept, onDeliver, onFail, loading }: OrderCardProps) {
    const [expanded, setExpanded] = useState(false);
    const addr = parseShippingAddress(order.shippingAddressSnapshot);

    const recipientName = order.customerName || addr.recipientName || addr.fullName || '—';
    const recipientPhone = order.customerPhone || addr.phoneNumber || addr.phone || '—';
    const addressLine = [
        addr.addressLine1 || addr.address,
        addr.ward,
        addr.district,
        addr.city,
    ].filter(Boolean).join(', ') || '—';

    const isMine = order.acceptedByShipperId === myShipperId;
    const isLoading = loading === order.id;

    return (
        <div
            className={`relative rounded-2xl border bg-white shadow-sm transition-all duration-200 overflow-hidden mb-4
        ${order.status === 'shipping' && isMine ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-gray-100 hover:shadow-md'}`}
        >
            {/* Priority stripe */}
            {order.status === 'confirmed' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-2xl" />
            )}
            {order.status === 'shipping' && isMine && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-t-2xl" />
            )}

            {/* Header */}
            <div className="p-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {order.statusLabel}
                            </span>
                            {order.trackingNumber && (
                                <span className="text-xs text-gray-400 font-mono font-medium">{order.trackingNumber}</span>
                            )}
                        </div>

                        {/* Customer */}
                        <div className="flex items-center gap-2 text-[15px] font-bold text-gray-900 mt-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">{recipientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Phone className="w-3.5 h-3.5" />
                            </div>
                            <a href={`tel:${recipientPhone}`} className="text-blue-600 font-semibold hover:underline">
                                {recipientPhone}
                            </a>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                            <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <span className="line-clamp-2 pt-0.5 leading-snug">{addressLine}</span>
                        </div>
                    </div>

                    <div className="text-right shrink-0 bg-gray-50/80 p-3 rounded-xl border border-gray-100 shadow-inner">
                        <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Thu tiền (COD)</div>
                        <div className="text-[17px] font-bold text-emerald-600 tracking-tight">{formatVND(order.totalAmount)}</div>
                        <div className="text-[11px] font-semibold mt-1">
                            {order.paymentMethodSnapshot?.includes('COD') || order.paymentMethodSnapshot?.toLowerCase()?.includes('cod')
                                ? <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm">💵 TIỀN MẶT</span>
                                : <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">💳 ĐÃ THANH TOÁN</span>}
                        </div>
                    </div>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center justify-center gap-1.5 w-full bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 py-2 rounded-xl mt-4 transition-colors"
                >
                    {expanded ? 'Thu gọn chi tiết đơn hàng' : `Xem chi tiết ${order.items.length} món hàng`}
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Items */}
                {expanded && (
                    <div className="mt-3 space-y-3">
                        {order.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                {it.productImageUrl ? (
                                    <img src={it.productImageUrl} alt={it.productName}
                                        className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-gray-300" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-800 line-clamp-2">{it.productName}</div>
                                    <div className="text-xs font-medium text-gray-500 mt-0.5">SL: <span className="text-gray-900">{it.quantity}</span> · Giá: {formatVND(it.unitPrice)}</div>
                                </div>
                                <div className="text-sm font-bold text-emerald-600 shrink-0">{formatVND(it.totalPrice)}</div>
                            </div>
                        ))}
                        {order.note && (
                            <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-3 mt-2 flex items-start gap-2.5">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <div>
                                    <span className="block text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">Ghi chú từ khách hàng:</span>
                                    <span className="text-sm text-amber-900 font-medium">{order.note}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 pb-4">
                {order.status === 'confirmed' && (
                    <button
                        disabled={isLoading}
                        onClick={() => onAccept(order.id)}
                        className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-[0.98] text-white font-bold text-[15px] py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        {isLoading ? 'Đang xử lý nhận đơn...' : 'NHẬN GIAO ĐƠN NÀY'}
                    </button>
                )}

                {order.status === 'shipping' && isMine && (
                    <div className="flex gap-3">
                        <button
                            disabled={isLoading}
                            onClick={() => onFail(order.id)}
                            className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 active:scale-[0.98] text-red-600 font-bold text-sm px-5 py-3.5 rounded-xl border border-red-200 transition-all duration-200 disabled:opacity-70"
                        >
                            <X className="w-5 h-5" />
                            Huỷ
                        </button>
                        <button
                            disabled={isLoading}
                            onClick={() => onDeliver(order.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white font-bold text-[15px] py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-70"
                        >
                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            GIAO THÀNH CÔNG
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub, iconColor }: {
    icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string; iconColor?: string;
}) {
    return (
        <div className={`rounded-3xl p-5 ${color} flex items-center gap-4 shadow-sm border border-black/5`}>
            <div className={`w-12 h-12 rounded-2xl ${iconColor || 'bg-white/40'} flex items-center justify-center shrink-0 shadow-sm`}>
                {icon}
            </div>
            <div>
                <div className="text-[26px] font-bold tracking-tight leading-none mb-1">{value}</div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</div>
                {sub && <div className="text-[10px] opacity-70 mt-1 uppercase font-semibold tracking-wider">{sub}</div>}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ShipperDashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [info, setInfo] = useState<ShipperInfo | null>(null);
    const [stats, setStats] = useState<ShipperStats | null>(null);
    const [orders, setOrders] = useState<ShipperOrder[]>([]);
    const [tab, setTab] = useState<Tab>('available');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(false);

    // Guard: only shipper can access
    useEffect(() => {
        if (user && (user.role !== 'staff' || user.staffPositionEnum?.toLowerCase() !== 'shipper')) {
            toast.error('Bạn không có quyền truy cập trang này');
            navigate('/');
        }
    }, [user, navigate]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [infoRes, statsRes, ordersRes] = await Promise.all([
                shipperApi.getMyInfo(),
                shipperApi.getStats(),
                shipperApi.getOrders(),
            ]);
            setInfo(infoRes);
            setStats(statsRes);
            setOrders(ordersRes);
        } catch (e) {
            toast.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOrdersByStatus = useCallback(async (status?: string) => {
        setLoading(true);
        try {
            const ordersRes = await shipperApi.getOrders(status);
            setOrders(ordersRes);
        } catch {
            toast.error('Không thể tải đơn hàng');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        if (tab === 'available') fetchOrdersByStatus();
        else if (tab === 'myOrders') fetchOrdersByStatus('shipping');
        else if (tab === 'delivered') fetchOrdersByStatus('delivered');
    }, [tab, fetchOrdersByStatus]);

    const handleAccept = async (orderId: string) => {
        setActionLoading(orderId);
        try {
            const res = await shipperApi.acceptOrder(orderId);
            toast.success(res.message);
            fetchAll();
            setTab('myOrders');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Không thể nhận đơn');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateStatus = async (orderId: string, status: 'delivered' | 'cancelled', note?: string) => {
        setActionLoading(orderId);
        try {
            const res = await shipperApi.updateStatus(orderId, status, note);
            toast.success(res.message);
            fetchAll();
            if (status === 'delivered') setTab('delivered');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Không thể cập nhật trạng thái');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'available', label: 'Chạm nhận', icon: <Package className="w-5 h-5 mb-1" /> },
        { key: 'myOrders', label: 'Đang giao', icon: <Truck className="w-5 h-5 mb-1" /> },
        { key: 'delivered', label: 'Đã giao', icon: <CheckCircle2 className="w-5 h-5 mb-1" /> },
        { key: 'stats', label: 'Cá nhân', icon: <User className="w-5 h-5 mb-1" /> },
    ];

    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric'
    });

    return (
        <div className={`min-h-[100dvh] pb-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#f4f6f8] text-slate-800'} transition-colors font-sans`}>
            {/* ── TOP HEADER ── */}
            <div className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-[0_4px_20px_rgba(4,120,87,0.2)]">
                <div className="max-w-md mx-auto px-5 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner mt-0.5">
                                <Bike className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="font-bold text-[17px] tracking-tight leading-none text-white shadow-sm">Food & Care</div>
                                <div className="text-[11px] font-semibold text-emerald-100 uppercase tracking-widest mt-1">Giao hàng</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center backdrop-blur-sm transition-colors border border-white/5"
                            >
                                {darkMode ? <Sun className="w-5 h-5 text-amber-200" /> : <Moon className="w-5 h-5 text-white" />}
                            </button>
                            <button
                                onClick={fetchAll}
                                disabled={loading}
                                className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center backdrop-blur-sm transition-colors border border-white/5"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 rounded-full bg-white text-emerald-700 hover:bg-red-500 hover:text-white flex items-center justify-center shadow-lg transition-colors border border-white/5"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pb-24 pt-4">
                {/* ── SHIPPER INFO BANNER ── */}
                {info && (
                    <div className="relative rounded-[24px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 text-white p-5 shadow-xl shadow-emerald-500/20 overflow-hidden ring-1 ring-black/5">
                        {/* Decorative background circles */}
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className="relative">
                                {info.avatarUrl ? (
                                    <img src={info.avatarUrl} alt={info.fullName}
                                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-md bg-white/10" />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-md">
                                        <User className="w-8 h-8 text-white/90" />
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-[3px] border-emerald-600 shadow-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-emerald-100 uppercase tracking-widest mb-1">Xin chào,</div>
                                <div className="font-bold text-[22px] leading-tight truncate tracking-tight">{info.fullName}</div>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span className="inline-flex items-center justify-center px-2 py-0.5 bg-black/15 rounded text-[11px] font-bold font-mono text-white/90">
                                        {info.employeeCode}
                                    </span>
                                    {info.warehouseName && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-50 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                                            <MapPin className="w-3 h-3 shrink-0" />
                                            <span className="truncate max-w-[150px]">{info.warehouseName}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Today mini stats */}
                        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5">
                            {([
                                { label: 'Chờ nhận', value: info.todayPending, icon: '📦' },
                                { label: 'Đang giao', value: stats?.todayShipping ?? 0, icon: '🚚' },
                                { label: 'Đã hoàn tất', value: info.todayDelivered, icon: '✅' },
                            ] as const).map((s) => (
                                <div key={s.label} className="bg-gradient-to-b from-white/10 to-transparent border border-white/15 rounded-2xl p-3 text-center shadow-inner backdrop-blur-sm">
                                    <div className="text-xl mb-1">{s.icon}</div>
                                    <div className="text-[22px] font-bold leading-none">{s.value}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-50 mt-1 opacity-80">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── CONTENT ── */}
                <div className="mt-6 space-y-4">
                    {/* Header for current tab */}
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <h2 className="text-[18px] font-bold text-gray-800 tracking-tight flex items-center gap-2">
                            {tab === 'available' && <><Package className="w-5 h-5 text-amber-500" /> Đơn chờ Shipper lấy</>}
                            {tab === 'myOrders' && <><Truck className="w-5 h-5 text-blue-500" /> Đơn đang trên đường giao</>}
                            {tab === 'delivered' && <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Giao thành công</>}
                            {tab === 'stats' && <><BarChart2 className="w-5 h-5 text-purple-500" /> Báo cáo & Tài khoản</>}
                        </h2>
                        {tab !== 'stats' && (
                            <span className="inline-flex items-center justify-center bg-gray-200 text-gray-700 w-6 h-6 rounded-full text-xs font-bold">
                                {orders.length}
                            </span>
                        )}
                    </div>

                    {/* Available / My Orders / Delivered */}
                    {(tab === 'available' || tab === 'myOrders' || tab === 'delivered') && (
                        <>
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-20 px-4">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500">Đang quét đơn hàng mới...</p>
                                </div>
                            )}
                            {!loading && orders.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center mt-4 bg-white rounded-3xl border border-dashed border-gray-300">
                                    <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-5 border-[6px] border-white shadow-sm">
                                        {tab === 'available' ? <Package className="w-10 h-10 text-gray-300" />
                                            : tab === 'myOrders' ? <Truck className="w-10 h-10 text-gray-300" />
                                                : <CheckCircle2 className="w-10 h-10 text-gray-300" />}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                                        {tab === 'available' ? 'Chưa có đơn hàng mới'
                                            : tab === 'myOrders' ? 'Tuyệt vời, bạn rảnh rỗi!'
                                                : 'Chưa có đơn thành công nào'}
                                    </h3>
                                    <p className="text-gray-500 text-sm max-w-[250px]">
                                        {tab === 'available' ? 'Hãy quay lại sau hoặc thử làm mới danh sách nhé.'
                                            : tab === 'myOrders' ? 'Bạn chưa nhận đơn nào. Qua tab "Chạm nhận" để quét đơn!'
                                                : 'Hãy giao thành công đơn hàng đầu tiên của ngày hôm nay.'}
                                    </p>
                                    <button
                                        onClick={fetchAll}
                                        className="mt-6 px-6 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm"
                                    >
                                        Làm mới ngay
                                    </button>
                                </div>
                            )}
                            {!loading && orders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    myShipperId={info?.userId ?? ''}
                                    onAccept={handleAccept}
                                    onDeliver={(id) => handleUpdateStatus(id, 'delivered', 'Giao hàng thành công')}
                                    onFail={(id) => handleUpdateStatus(id, 'cancelled', 'Giao hàng thất bại / Khách không nhận')}
                                    loading={actionLoading}
                                />
                            ))}
                        </>
                    )}

                    {/* Stats Section */}
                    {tab === 'stats' && stats && (
                        <div className="space-y-4 pb-4">
                            {/* COD Card - Hero Stat */}
                            {stats.todayTotalAmount > 0 && (
                                <div className="rounded-[24px] bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-6 shadow-xl shadow-emerald-900/10 border-4 border-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <QrCode className="w-5 h-5 text-emerald-200" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Cần nộp thu hộ (COD) hôm nay</span>
                                    </div>
                                    <div className="text-[34px] font-bold tracking-tighter drop-shadow-sm">{formatVND(stats.todayTotalAmount)}</div>
                                    <p className="text-xs text-emerald-200 mt-2 font-medium">Bạn vui lòng quyết toán khoản này cho Kế toán kho vào cuối ca làm việc.</p>
                                </div>
                            )}

                            <h2 className="text-[16px] font-bold text-gray-800 uppercase tracking-wide mt-6">
                                📊 Thống kê hôm nay
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard
                                    icon={<Truck className="w-6 h-6 text-blue-600" />}
                                    label="Tổng đã nhận" value={stats.todayTotal}
                                    color="bg-white/80" iconColor="bg-blue-50"
                                />
                                <StatCard
                                    icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                                    label="Thành công" value={stats.todayDelivered}
                                    color="bg-white/80" iconColor="bg-emerald-50"
                                />
                            </div>

                            <h2 className="text-[16px] font-bold text-gray-800 uppercase tracking-wide mt-6">
                                📅 Thống kê tuần này
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard
                                    icon={<Package className="w-6 h-6 text-purple-600" />}
                                    label="Tổng đơn tuần" value={stats.weekTotal}
                                    color="bg-purple-50 text-purple-900" iconColor="bg-white"
                                />
                                <StatCard
                                    icon={<CheckCircle2 className="w-6 h-6 text-teal-600" />}
                                    label="Đã giao tuần" value={stats.weekDelivered}
                                    color="bg-teal-50 text-teal-900" iconColor="bg-white"
                                />
                            </div>

                            {/* Personal info */}
                            {info && (
                                <div className={`rounded-3xl mt-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5 shadow-sm'} border p-5`}>
                                    <h3 className={`text-sm font-bold uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
                                        <User className="w-4 h-4" /> Chi tiết tài khoản
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Tên nhân viên', value: info.fullName },
                                            { label: 'Mã nhân viên', value: info.employeeCode },
                                            { label: 'Trực thuộc kho', value: info.warehouseName ?? '—' },
                                            { label: 'Địa chỉ kho', value: info.warehouseAddress ?? '—' },
                                            { label: 'Kỷ lục đã giao', value: `${info.totalDelivered} đơn hàng` },
                                        ].map(row => (
                                            <div key={row.label} className="flex items-center justify-between gap-4 border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                                <span className={`text-[13px] font-medium leading-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{row.label}</span>
                                                <span className={`text-[14px] font-bold leading-none ${darkMode ? 'text-gray-200' : 'text-gray-800'} text-right max-w-[60%] truncate`}>{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full mt-6 py-3.5 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 font-bold hover:bg-red-100 text-sm transition-colors flex justify-center items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Đăng xuất khỏi thiết bị
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── BOTTOM NAV (Floating Pill Style) ── */}
            <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
                <div className="max-w-[360px] mx-auto bg-white/90 backdrop-blur-xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/50 flex overflow-hidden p-1.5 ring-1 ring-black/5">
                    {TABS.map(t => {
                        const isActive = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-[22px] transition-all duration-300 relative
                                ${isActive
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                        : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50/50'}`}
                            >
                                <div className={`${isActive ? 'scale-110 mb-0.5' : 'scale-100'} transition-transform duration-300`}>
                                    {t.icon}
                                </div>
                                <span className={`text-[10px] uppercase font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                                    {t.label}
                                </span>
                                {t.key !== 'stats' && orders.length > 0 && tab !== t.key && t.key === 'available' && (
                                    <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
