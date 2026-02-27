import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { couponApi } from '../services/couponApi';
import type { CouponDto } from '../services/couponApi';
import { useNavigate } from 'react-router-dom';
import { Ticket, Percent, Copy, Check, ChevronRight, Gift, Star, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CouponCardProps {
    coupon: CouponDto;
    onCopy: (code: string) => void;
    copied: boolean;
}

function CouponCard({ coupon, onCopy, copied }: CouponCardProps) {
    const isPercent = coupon.discountType === 'percentage';
    const now = new Date();
    const endDate = coupon.endDate ? new Date(coupon.endDate) : null;
    const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div className="relative flex rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white group">
            {/* Left colored panel */}
            <div className={`w-[90px] flex-shrink-0 flex flex-col items-center justify-center p-3 relative
                ${isPercent
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-b from-emerald-400 to-emerald-600'}`}
            >
                <div className="text-white text-center">
                    {isPercent
                        ? <Percent className="w-10 h-10 mb-1 mx-auto opacity-90" />
                        : <Gift className="w-10 h-10 mb-1 mx-auto opacity-90" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                        VOUCHER
                    </span>
                </div>
                {/* Dashed separator */}
                <div className="absolute top-0 right-0 h-full flex flex-col justify-between py-3 -mr-[1px]">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-[2px] h-3 bg-gray-100 rounded-full" />
                    ))}
                </div>
            </div>

            {/* Right info */}
            <div className="flex-1 p-4 flex items-center justify-between relative">
                {/* Circle notches */}
                <div className="absolute top-0 -left-3 w-6 h-6 bg-gray-50 rounded-full" />
                <div className="absolute bottom-0 -left-3 w-6 h-6 bg-gray-50 rounded-full" />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xl font-bold tracking-tight ${isPercent ? 'text-emerald-700' : 'text-emerald-600'}`}>
                            {coupon.code}
                        </span>
                        {daysLeft !== null && daysLeft <= 7 && (
                            <span className="flex items-center gap-1 bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                Còn {daysLeft} ngày
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                        Giảm{' '}
                        <span className="text-emerald-600">
                            {isPercent ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('vi-VN')}đ`}
                        </span>
                        {coupon.maxDiscountAmount && isPercent && (
                            <span className="text-gray-500 font-normal"> (tối đa {coupon.maxDiscountAmount.toLocaleString('vi-VN')}đ)</span>
                        )}
                    </p>
                    <p className="text-xs text-gray-400">
                        {coupon.minOrderValue
                            ? `Đơn từ ${coupon.minOrderValue.toLocaleString('vi-VN')}đ`
                            : 'Áp dụng cho mọi đơn hàng'}
                        {coupon.endDate && ` · HSD: ${new Date(coupon.endDate).toLocaleDateString('vi-VN')}`}
                    </p>
                </div>

                <button
                    onClick={() => onCopy(coupon.code)}
                    className={`ml-3 flex-shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-xl border-2 border-dashed transition-all
                        ${copied
                            ? 'border-green-400 bg-green-50 text-green-600'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-100'
                        }`}
                >
                    {copied ? (
                        <><Check className="w-4 h-4" /><span className="text-[10px] font-bold mt-0.5">Đã copy</span></>
                    ) : (
                        <><Copy className="w-4 h-4" /><span className="text-[10px] font-bold mt-0.5">Dùng ngay</span></>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function VoucherCenterPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState<CouponDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: '/vouchers' } });
            return;
        }
        const loadCoupons = async () => {
            try {
                const list = await couponApi.getAvailableCoupons(0);
                setCoupons(list);
            } catch {
                toast.error('Không thể tải danh sách voucher');
            } finally {
                setLoading(false);
            }
        };
        loadCoupons();
    }, [user, navigate]);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            toast.success(`Đã copy mã "${code}"! Hãy áp dụng khi thanh toán.`, {
                icon: '🎉',
                duration: 3000,
            });
            setTimeout(() => setCopiedCode(null), 2500);
        }).catch(() => {
            toast.error('Không thể copy, hãy copy thủ công');
        });
    };

    const percentCoupons = coupons.filter(c => c.discountType === 'percentage');
    const fixedCoupons = coupons.filter(c => c.discountType !== 'percentage');

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Hero Banner */}
            <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    {/* Pattern background */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border-2 border-white/30"
                            style={{
                                width: `${Math.random() * 120 + 40}px`,
                                height: `${Math.random() * 120 + 40}px`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                        />
                    ))}
                </div>
                <div className="relative container mx-auto px-4 py-12 text-center text-white">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">Kho Voucher Của Bạn</h1>
                    <p className="text-emerald-50 text-lg max-w-2xl mx-auto font-medium">
                        Tất cả ưu đãi khuyến mãi dành riêng cho bạn — sao chép và áp dụng ngay khi mua hàng!
                    </p>
                    <div className="flex justify-center gap-3 mt-6 flex-wrap">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            <span className="text-sm font-semibold">{coupons.length} Ưu đãi có sẵn</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-semibold">Cập nhật liên tục</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-10 max-w-3xl">
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Ticket className="w-20 h-20 mx-auto mb-4 text-gray-200" />
                        <h2 className="text-xl font-bold text-gray-400 mb-2">Chưa có voucher nào</h2>
                        <p className="text-gray-400 text-sm mb-6">Hãy quay lại sau, chúng tôi thường xuyên cập nhật ưu đãi mới nhé!</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Mua sắm ngay <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {percentCoupons.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Percent className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Giảm theo phần trăm</h2>
                                    <span className="bg-emerald-100 text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded-full">{percentCoupons.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {percentCoupons.map(c => (
                                        <CouponCard
                                            key={c.id}
                                            coupon={c}
                                            onCopy={handleCopy}
                                            copied={copiedCode === c.code}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {fixedCoupons.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                        <Gift className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Giảm tiền trực tiếp</h2>
                                    <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{fixedCoupons.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {fixedCoupons.map(c => (
                                        <CouponCard
                                            key={c.id}
                                            coupon={c}
                                            onCopy={handleCopy}
                                            copied={copiedCode === c.code}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* CTA */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center text-white shadow-xl shadow-emerald-500/10">
                            <p className="font-bold text-xl mb-2">Sẵn sàng mua sắm?</p>
                            <p className="text-emerald-50 text-sm mb-6">Copy mã và áp dụng ngay tại bước thanh toán để nhận ưu đãi</p>
                            <button
                                onClick={() => navigate('/products')}
                                className="bg-white text-emerald-600 font-bold px-8 py-3 rounded-xl hover:bg-emerald-50 transition-all shadow-md inline-flex items-center gap-2"
                            >
                                Mua sắm ngay <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
