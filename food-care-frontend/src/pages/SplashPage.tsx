import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf } from 'lucide-react';

/**
 * SplashPage — First screen a brand-new visitor sees.
 * Goal: < 3s dwell time. No forms, no extra questions.
 * Two paths:
 *   "Bắt đầu miễn phí"  → /onboarding  (new user flow)
 *   "Đã có tài khoản"   → /login        (returning user)
 */
export default function SplashPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    // If already logged in, skip the splash entirely
    useEffect(() => {
        if (!isAuthenticated) return;
        const isOnboarded =
            !!user?.selectedMartId ||
            localStorage.getItem('onboarding_completed') === 'true';
        navigate(isOnboarded ? '/' : '/onboarding', { replace: true });
    }, [isAuthenticated, user, navigate]);

    const handleStart = () => {
        // Mark intent so login page can redirect back here after auth
        localStorage.setItem('onboarding_pending', 'true');
        navigate('/onboarding');
    };

    const handleSignIn = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white px-6">
            {/* Brand mark */}
            <div className="flex flex-col items-center text-center mb-12">
                <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/20">
                    <Leaf className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Food &amp; Care
                </h1>
                <p className="text-emerald-100 mt-3 text-base md:text-lg max-w-xs leading-relaxed">
                    Thực phẩm sạch từ mart gần nhà,<br />giao tự động đúng ngày mỗi tuần
                </p>
            </div>

            {/* CTAs */}
            <div className="w-full max-w-sm space-y-3">
                <button
                    onClick={handleStart}
                    className="w-full py-4 bg-white text-emerald-700 font-semibold rounded-2xl text-base hover:bg-emerald-50 active:scale-[0.98] transition-all shadow-lg shadow-black/10"
                >
                    Bắt đầu miễn phí
                </button>
                <button
                    onClick={handleSignIn}
                    className="w-full py-4 bg-white/15 backdrop-blur-sm text-white font-medium rounded-2xl text-base hover:bg-white/25 active:scale-[0.98] transition-all border border-white/20"
                >
                    Đã có tài khoản
                </button>
            </div>

            <p className="mt-10 text-emerald-200/50 text-xs text-center max-w-xs">
                Tiếp tục đồng nghĩa với việc bạn đồng ý với{' '}
                <span className="underline cursor-pointer">Điều khoản</span> &amp;{' '}
                <span className="underline cursor-pointer">Chính sách bảo mật</span>
            </p>
        </div>
    );
}
