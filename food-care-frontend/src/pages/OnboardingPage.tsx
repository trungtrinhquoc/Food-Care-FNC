import { useNavigate } from 'react-router-dom';
import { MapPin, Repeat, Truck, ArrowRight } from 'lucide-react';

const TILES = [
    {
        icon: MapPin,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        title: 'Mart gần nhà',
        body: 'Hàng từ cửa hàng uy tín trong bán kính 3 km. Tươi ngon, đúng nguồn gốc.',
    },
    {
        icon: Repeat,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'Tự động định kỳ',
        body: 'Ví FNC Pay tự trừ và hàng giao đúng ngày đã hẹn — không cần đặt lại mỗi tuần.',
    },
    {
        icon: Truck,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        title: 'Miễn phí giao',
        body: 'Đơn subscription từ 150.000đ trở lên miễn phí ship, không giới hạn số lần.',
    },
] as const;

/**
 * OnboardingPage — Single screen explaining the 3 core value props.
 * One tap: "Tiếp tục" → mart selection step.
 */
export default function OnboardingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-lg mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <span className="inline-block text-xs font-semibold tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full mb-4">
                        Chào mừng bạn
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                        Mua sắm thực phẩm<br />thông minh hơn
                    </h1>
                </div>

                {/* Feature tiles */}
                <div className="w-full space-y-4">
                    {TILES.map(({ icon: Icon, iconBg, iconColor, title, body }) => (
                        <div
                            key={title}
                            className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                        >
                            <div className={`${iconBg} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
                                <Icon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{title}</p>
                                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom CTA — pinned */}
            <div className="px-6 pb-8 pt-4 max-w-lg mx-auto w-full">
                <button
                    onClick={() => navigate('/onboarding/mart')}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-2xl text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                    Tiếp tục
                    <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                    Bước tiếp theo: Chọn mart gần nhà bạn
                </p>
            </div>
        </div>
    );
}
