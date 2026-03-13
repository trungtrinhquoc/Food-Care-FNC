import { useState, useEffect, useCallback, useMemo } from 'react';
import { walletApi, type WalletTransaction } from '../services/walletApi';
import { orderApi } from '../services/orderApi';
import type { Order } from '../types';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
    Wallet, ArrowUpCircle, ArrowDownCircle, RefreshCcw,
    TrendingUp, TrendingDown, Loader2, Plus, CheckCircle,
    ArrowUpRight, History, X, Wallet2, ArrowDownRight,
    Activity, BarChart3, Sparkles, Send, Eye, EyeOff,
    Settings, Gift, RefreshCw, ChevronRight, Search,
    Filter, Download, DollarSign, QrCode, ShieldCheck,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

type TabType = 'overview' | 'transactions' | 'analytics';

const TOPUP_PRESETS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

function formatVND(amount: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}

function TransactionIcon({ type }: { type: WalletTransaction['type'] }) {
    if (type === 'TopUp') return (
        <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center">
            <Download className="w-5 h-5 text-emerald-400" />
        </div>
    );
    if (type === 'Payment') return (
        <div className="w-10 h-10 rounded-xl bg-rose-400/20 flex items-center justify-center">
            <Send className="w-5 h-5 text-rose-400" />
        </div>
    );
    return (
        <div className="w-10 h-10 rounded-xl bg-blue-400/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-400" />
        </div>
    );
}

function StatusBadge({ status }: { status: WalletTransaction['status'] }) {
    const map = {
        Completed: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30',
        Pending: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
        Failed: 'bg-red-400/20 text-red-300 border border-red-400/30',
        Canceled: 'bg-gray-400/20 text-gray-300 border border-gray-400/30',
    };
    const labels = { Completed: 'Thành công', Pending: 'Đang xử lý', Failed: 'Thất bại', Canceled: 'Đã hủy' };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status]}`}>
            {labels[status]}
        </span>
    );
}

interface TopUpModalProps {
    balance: number;
    onClose: () => void;
    onSuccess: () => void;
}

function TopUpModal({ balance, onClose, onSuccess }: TopUpModalProps) {
    const [amount, setAmount] = useState(500000);
    const [custom, setCustom] = useState('');
    const [step, setStep] = useState<'input' | 'qr'>('input');
    const [loading, setLoading] = useState(false);

    const finalAmount = custom ? Number(custom.replace(/\D/g, '')) : amount;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await walletApi.topUp(finalAmount);
            toast.success(`Đã nạp ${formatVND(finalAmount)} vào ví thành công!`);
            onSuccess();
            onClose();
        } catch {
            toast.error('Giao dịch chưa được ghi nhận, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const qrUrl = `https://img.vietqr.io/image/970422-0904000000-compact.jpg?amount=${finalAmount}&addInfo=TOPUP%20FNC%20PAY&accountName=FOOD%20CARE%20NETWORK`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-[320px] bg-gradient-to-br from-gray-900/95 via-emerald-950/95 to-teal-950/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Glow */}
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-center justify-between p-3.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-inner">
                            {step === 'input' ? <Plus className="w-3.5 h-3.5 text-white" /> : <QrCode className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <h3 className="font-bold text-white text-[13px]">
                            {step === 'input' ? 'Nạp tiền vào ví' : 'Quét mã CK'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="relative p-3.5 space-y-3">
                    {/* Balance */}
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center">
                        <p className="text-white/50 text-[10px] mb-0.5">Số dư hiện tại</p>
                        <p className="text-lg font-bold text-white">{formatVND(balance)}</p>
                    </div>

                    {step === 'input' ? (
                        <>
                            <div>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {TOPUP_PRESETS.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => { setAmount(p); setCustom(''); }}
                                            className={`py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${!custom && amount === p
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                                                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {p >= 1000000 ? `${p / 1000000}M` : `${p / 1000}K`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Số tiền khác..."
                                        value={custom}
                                        onChange={e => {
                                            const cleaned = e.target.value.replace(/\D/g, '');
                                            setCustom(cleaned ? new Intl.NumberFormat('vi-VN').format(Number(cleaned)) : '');
                                        }}
                                        className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-[13px] font-bold text-white placeholder:text-white/20 outline-none transition-all pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-emerald-400 text-sm">₫</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => {
                                    if (!finalAmount || finalAmount < 10000) {
                                        toast.error('Số tiền tối thiểu là 10.000₫');
                                        return;
                                    }
                                    setStep('qr');
                                }}
                                className="w-full h-9 text-[13px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl border-0 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] mt-1"
                            >
                                Tiếp tục {finalAmount >= 1000 ? `(${formatVND(finalAmount)})` : ''}
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center">
                                <div className="bg-white p-1.5 rounded-lg shadow-sm mb-2">
                                    <img src={qrUrl} alt="VietQR" className="w-32 h-32 object-contain" />
                                </div>
                                <div className="text-center space-y-0.5">
                                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">MB Bank</p>
                                    <p className="text-[13px] font-bold text-white">STK: 0904000000</p>
                                    <p className="text-[10px] text-white/50">Nội dung: TOPUP FNC PAY</p>
                                    <p className="text-emerald-400 font-bold text-sm">{formatVND(finalAmount)}</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="w-full h-9 text-[13px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl border-0 shadow-md shadow-emerald-500/20"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Đã chuyển xong'}
                            </Button>
                            <button
                                onClick={() => setStep('input')}
                                className="w-full text-[10px] text-white/40 hover:text-white/70 uppercase tracking-widest font-bold transition-colors"
                            >
                                Quay lại
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function WalletTab() {
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTx, setLoadingTx] = useState(true);
    const [showTopUp, setShowTopUp] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [monthsRange, setMonthsRange] = useState(12);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    const loadBalance = useCallback(async () => {
        try {
            setLoading(true);
            const data = await walletApi.getBalance();
            setBalance(data.balance);
        } catch { /* silent */ } finally { setLoading(false); }
    }, []);

    const loadTransactions = useCallback(async (p = 1) => {
        try {
            setLoadingTx(true);
            const data = await walletApi.getTransactions(p, 100);
            setTransactions(p === 1 ? data : prev => [...prev, ...data]);
            setPage(p);
        } catch { /* silent */ } finally { setLoadingTx(false); }
    }, []);

    const loadOrders = useCallback(async () => {
        try {
            setLoadingOrders(true);
            const data = await orderApi.getMyOrders();
            setOrders(data);
        } catch { /* silent */ } finally { setLoadingOrders(false); }
    }, []);

    useEffect(() => {
        loadBalance();
        loadTransactions(1);
        loadOrders();
    }, [loadBalance, loadTransactions, loadOrders]);

    // === Chart data: monthsRange from real transactions ===
    const chartData = useMemo(() => {
        const months = monthsRange;
        const now = new Date();
        const data = Array.from({ length: 12 }).map((_, i) => {
            let d: Date;
            if (months === 12) {
                // Calendar year: Jan to Dec of current year
                d = new Date(now.getFullYear(), i, 1);
            } else {
                // Rolling months: last N months
                d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
            }
            return {
                label: `T${d.getMonth() + 1}`,
                month: d.getMonth(),
                year: d.getFullYear(),
                income: 0,
                expense: 0,
                walletExpense: 0,
                balance: 0,
                isFuture: d > now && d.getMonth() !== now.getMonth(),
            };
        }).filter((_, i) => months === 12 || i >= 12 - months);

        transactions.forEach(tx => {
            const s = (tx.status || '').toLowerCase();
            if (s !== 'completed' && s !== 'success') return;

            const d = new Date(tx.createdAt);
            const item = data.find(x => x.month === d.getMonth() && x.year === d.getFullYear());
            if (item) {
                const ty = (tx.type || '').toLowerCase();
                const amt = Number(tx.amount) || 0;
                if (ty === 'topup' || ty === 'refund') item.income += amt;
                if (ty === 'payment' || ty === 'deduct') item.walletExpense += amt;
            }
        });

        // Add order expenditure to chart
        orders.forEach(o => {
            const s = (o.status || '').toLowerCase();
            const ps = (o.paymentStatus || '').toLowerCase();
            // Count as expense if delivered or paid
            if (s !== 'delivered' && ps !== 'paid') return;

            const d = new Date(o.createdAt);
            const item = data.find(x => x.month === d.getMonth() && x.year === d.getFullYear());
            if (item) {
                item.expense += (o.totalAmount || 0);
            }
        });

        // Compute running balance
        // We start from current balance at the current month and go backwards
        let back = balance;
        const currentMonthIdx = data.findIndex(x => x.month === now.getMonth() && x.year === now.getFullYear());

        if (currentMonthIdx !== -1) {
            // Backward from current month
            for (let i = currentMonthIdx; i >= 0; i--) {
                data[i].balance = back;
                back = back - data[i].income + data[i].walletExpense;
            }
            // Forward from current month (constant balance for future months in this view)
            for (let i = currentMonthIdx + 1; i < data.length; i++) {
                data[i].balance = balance;
            }
        } else {
            // Fallback for rolling view if current month not found (shouldn't happen with current logic)
            let b = balance;
            for (let i = data.length - 1; i >= 0; i--) {
                data[i].balance = b;
                b = b - data[i].income + data[i].walletExpense;
            }
        }

        return data;
    }, [transactions, orders, balance, monthsRange]);

    // === Aggregate stats ===
    const stats = useMemo(() => {
        const now = new Date();
        const startDate = monthsRange === 12
            ? new Date(now.getFullYear(), 0, 1) // Jan 1st of current year
            : new Date(now.getFullYear(), now.getMonth() - (monthsRange - 1), 1);

        const filtered = transactions.filter(t => {
            // Robust check for status (case-insensitive)
            const s = (t.status || '').toLowerCase();
            if (s !== 'completed' && s !== 'success') return false;

            const d = new Date(t.createdAt);
            return d >= startDate;
        });

        const totalIncome = filtered
            .filter(t => {
                const ty = (t.type || '').toLowerCase();
                return ty === 'topup' || ty === 'refund';
            })
            .reduce((s, t) => s + (Number(t.amount) || 0), 0);

        const filteredOrders = orders.filter(o => {
            const s = (o.status || '').toLowerCase();
            const ps = (o.paymentStatus || '').toLowerCase();
            if (s !== 'delivered' && ps !== 'paid') return false;
            const d = new Date(o.createdAt);
            return d >= startDate;
        });

        const totalExpense = filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        
        const totalRefund = filtered
            .filter(t => (t.type || '').toLowerCase() === 'refund')
            .reduce((s, t) => s + (Number(t.amount) || 0), 0);

        return { totalIncome, totalExpense, totalRefund };
    }, [transactions, orders, monthsRange]);

    const filteredTx = useMemo(() => {
        if (!searchQuery) return transactions;
        return transactions.filter(t =>
            (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [transactions, searchQuery]);

    const txColor = (type: WalletTransaction['type']) =>
        type === 'TopUp' || type === 'Refund' ? 'text-emerald-400' : 'text-rose-400';

    const tabs = [
        { id: 'overview' as TabType, icon: Activity, label: 'Tổng quan' },
        { id: 'transactions' as TabType, icon: History, label: 'Giao dịch' },
        { id: 'analytics' as TabType, icon: BarChart3, label: 'Thống kê' },
    ];

    return (
        <div className="relative w-full bg-gradient-to-br from-gray-900 via-emerald-950 to-teal-950 pb-8 mt-2 sm:mt-4 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            {/* BG glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative w-full max-w-4xl mx-auto p-3 sm:p-5 space-y-3 sm:space-y-4">

                {/* ===== HERO BALANCE CARD ===== */}
                <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <div className="relative">
                        {/* Top row */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-xs sm:text-sm">FNC Pay</p>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                        <ShieldCheck className="w-3 h-3" />
                                        Đã xác thực
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                                >
                                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => { loadBalance(); loadTransactions(1); }}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                                >
                                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="mb-4">
                            <p className="text-white/50 text-[11px] sm:text-xs mb-1">Số dư khả dụng</p>
                            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                {loading ? '...' : (showBalance ? formatVND(balance) : '••••••••')}
                            </p>
                        </div>

                        {/* Mini stats */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 border border-white/10">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] text-white/50">Thu</span>
                                </div>
                                <p className="text-sm font-bold text-white">
                                    {loadingTx ? '...' : (stats.totalIncome >= 1000000
                                        ? `+${(stats.totalIncome / 1000000).toFixed(1)}M`
                                        : `+${Math.round(stats.totalIncome / 1000)}K`)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <TrendingDown className="w-3 h-3 text-rose-400" />
                                    <span className="text-[10px] text-white/50">Chi</span>
                                </div>
                                <p className="text-sm font-bold text-white">
                                    {loadingTx ? '...' : (stats.totalExpense >= 1000000
                                        ? `-${(stats.totalExpense / 1000000).toFixed(1)}M`
                                        : `-${Math.round(stats.totalExpense / 1000)}K`)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-3 h-3 text-yellow-400" />
                                    <span className="text-[10px] text-white/50">Hoàn</span>
                                </div>
                                <p className="text-sm font-bold text-white">
                                    {loadingTx ? '...' : (stats.totalRefund >= 1000
                                        ? `${Math.round(stats.totalRefund / 1000)}K`
                                        : `${stats.totalRefund}đ`)}
                                </p>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowTopUp(true)}
                                className="flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm sm:text-base font-bold hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/30"
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                Nạp tiền
                            </button>
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className="flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm sm:text-base font-bold hover:bg-white/20 active:scale-[0.98] transition-all"
                            >
                                <History className="w-4 h-4 sm:w-5 sm:h-5" />
                                Lịch sử
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===== TABS ===== */}
                <div className="flex gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeTab === tab.id
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg'
                                    : 'text-white/50 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ===== OVERVIEW TAB ===== */}
                {activeTab === 'overview' && (
                    <div className="space-y-3 sm:space-y-4 animate-fade-in">
                        {/* Feature cards */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 hover:bg-white/15 transition-all cursor-pointer group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                        Đang bật
                                    </span>
                                </div>
                                <h3 className="font-bold text-white text-sm mb-1">Tự động thanh toán</h3>
                                <p className="text-white/50 text-xs mb-2">Đơn hàng định kỳ</p>
                                <div className="flex items-center text-emerald-400 text-xs font-semibold">
                                    <span>Quản lý</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-400/20 hover:border-yellow-400/40 transition-all cursor-pointer group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                                        Mới
                                    </span>
                                </div>
                                <h3 className="font-bold text-white text-sm mb-1">Ưu đãi đặc biệt</h3>
                                <p className="text-white/50 text-xs mb-2">Nạp 1M nhận 100K</p>
                                <div className="flex items-center text-yellow-400 text-xs font-semibold">
                                    <span>Chi tiết</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* Recent transactions */}
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                                    <History className="w-4 h-4" />
                                    Giao dịch gần đây
                                </h3>
                                <button
                                    onClick={() => setActiveTab('transactions')}
                                    className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-colors"
                                >
                                    Xem tất cả →
                                </button>
                            </div>

                            {loadingTx && transactions.length === 0 ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Wallet2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                    <p className="text-white/40 text-sm">Chưa có giao dịch</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.slice(0, 5).map(tx => (
                                        <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer">
                                            <TransactionIcon type={tx.type} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold truncate">
                                                    {tx.description || (tx.type === 'TopUp' ? 'Nạp tiền' : tx.type === 'Payment' ? 'Thanh toán' : 'Hoàn tiền')}
                                                </p>
                                                <p className="text-white/40 text-xs">{formatDate(tx.createdAt)}</p>
                                            </div>
                                            <p className={`font-bold text-sm ${txColor(tx.type)}`}>
                                                {tx.type === 'TopUp' || tx.type === 'Refund' ? '+' : '-'}{formatVND(tx.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== TRANSACTIONS TAB ===== */}
                {activeTab === 'transactions' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Search */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm giao dịch..."
                                    className="w-full pl-10 pr-3 py-2.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl text-white text-sm placeholder:text-white/40 outline-none focus:border-emerald-500/50 transition-colors"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="px-3 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white hover:bg-white/20 transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15">
                            {loadingTx && transactions.length === 0 ? (
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
                                </div>
                            ) : filteredTx.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Wallet2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                    <p className="text-white/40 text-sm">Không tìm thấy giao dịch</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredTx.map(tx => (
                                        <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer">
                                            <TransactionIcon type={tx.type} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold truncate">
                                                    {tx.description || (tx.type === 'TopUp' ? 'Nạp tiền' : tx.type === 'Payment' ? 'Thanh toán' : 'Hoàn tiền')}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-white/40 text-xs">{formatDate(tx.createdAt)}</p>
                                                    <StatusBadge status={tx.status} />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold text-sm ${txColor(tx.type)}`}>
                                                    {tx.type === 'TopUp' || tx.type === 'Refund' ? '+' : '-'}{formatVND(tx.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {transactions.length >= page * 50 && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => loadTransactions(page + 1)}
                                    disabled={loadingTx}
                                    className="text-[11px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                    {loadingTx ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                                    Xem thêm
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== ANALYTICS TAB ===== */}
                {activeTab === 'analytics' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Cash Flow Chart */}
                        <div className="p-4 rounded-2xl bg-[#0F221F] border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 opacity-20 translate-x-6 -translate-y-6 bg-emerald-500 rounded-full w-32 h-32 group-hover:scale-110 transition-transform duration-700 blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 opacity-10 -translate-x-6 translate-y-6 bg-teal-500 rounded-full w-32 h-32 blur-3xl pointer-events-none" />

                            <div className="flex items-center justify-between mb-5 relative z-10">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                    Biểu đồ dòng tiền
                                </h3>
                                <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                                    {[1, 3, 6, 12].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMonthsRange(m)}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${monthsRange === m
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : 'text-white/40 hover:text-white/70'
                                                }`}
                                        >
                                            {m}T
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative z-10 -ml-3">
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="label"
                                            stroke="rgba(255,255,255,0.35)"
                                            style={{ fontSize: '11px' }}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={8}
                                        />
                                        <YAxis
                                            stroke="rgba(255,255,255,0.35)"
                                            style={{ fontSize: '10px' }}
                                            tickFormatter={v => `${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : Math.round(v / 1000) + 'K'}`}
                                            tickLine={false}
                                            axisLine={false}
                                            width={48}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '3 3' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(15,34,31,0.95)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                            }}
                                            formatter={(v: any) => formatVND(v)}
                                            labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey="balance" stroke="#0d9488" strokeWidth={2.5} fill="url(#gBalance)" name="Số dư" activeDot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }} connectNulls />
                                        <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#gIncome)" name="Thu nhập" activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                                        <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExpense)" name="Chi tiêu" activeDot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex items-center justify-center gap-6 mt-3 text-[11px] font-medium relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                                    <span className="text-white/60">Thu nhập</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
                                    <span className="text-white/60">Chi tiêu</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(13,148,136,0.7)]" />
                                    <span className="text-white/60">Số dư</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats overview */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Total nạp */}
                            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 group hover:border-emerald-500/30 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-emerald-400/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Tổng nạp</p>
                                <p className="text-base font-extrabold text-white">
                                    {loadingTx ? '...' : (stats.totalIncome >= 1000000
                                        ? `${(stats.totalIncome / 1000000).toFixed(1)}M`
                                        : `${Math.round(stats.totalIncome / 1000)}K`)}
                                </p>
                                <div className="flex items-center gap-1 text-emerald-400 text-[10px] mt-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>+nạp</span>
                                </div>
                            </div>

                            {/* Total chi */}
                            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 group hover:border-rose-500/30 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-rose-400/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Send className="w-4 h-4 text-rose-400" />
                                </div>
                                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Tổng chi</p>
                                <p className="text-base font-extrabold text-white">
                                    {loadingTx ? '...' : (stats.totalExpense >= 1000000
                                        ? `${(stats.totalExpense / 1000000).toFixed(1)}M`
                                        : `${Math.round(stats.totalExpense / 1000)}K`)}
                                </p>
                                <div className="flex items-center gap-1 text-rose-400 text-[10px] mt-1">
                                    <TrendingDown className="w-3 h-3" />
                                    <span>đơn hàng</span>
                                </div>
                            </div>

                            {/* Hoàn tiền */}
                            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 group hover:border-yellow-500/30 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-yellow-400/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-4 h-4 text-yellow-400" />
                                </div>
                                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Hoàn tiền</p>
                                <p className="text-base font-extrabold text-white">
                                    {loadingTx ? '...' : (stats.totalRefund >= 1000
                                        ? `${Math.round(stats.totalRefund / 1000)}K`
                                        : `${stats.totalRefund}đ`)}
                                </p>
                                <div className="flex items-center gap-1 text-yellow-400 text-[10px] mt-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>nhận lại</span>
                                </div>
                            </div>
                        </div>

                        {/* Category breakdown - based on tx descriptions (simplified) */}
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                                <BarChart3 className="w-4 h-4" />
                                Phân loại chi tiêu
                            </h3>

                            {stats.totalExpense === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-white/30 text-sm">Chưa có dữ liệu chi tiêu</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {[
                                        { name: 'Đơn hàng', amount: stats.totalExpense, percent: 100, color: 'from-rose-400 to-rose-500' },
                                    ].map(cat => (
                                        <div key={cat.name}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-white text-sm font-medium">{cat.name}</span>
                                                <span className="text-white/50 text-xs">{formatVND(cat.amount)}</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${cat.percent}%` }}
                                                    className={`h-full bg-gradient-to-r ${cat.color} rounded-full`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* TopUp modal */}
            {showTopUp && (
                <TopUpModal
                    balance={balance}
                    onClose={() => setShowTopUp(false)}
                    onSuccess={() => { loadBalance(); loadTransactions(1); }}
                />
            )}
        </div>
    );
}
