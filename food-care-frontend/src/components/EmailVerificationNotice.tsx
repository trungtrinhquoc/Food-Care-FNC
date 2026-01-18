import { useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface EmailVerificationNoticeProps {
    email: string;
}

export function EmailVerificationNotice({ email }: EmailVerificationNoticeProps) {
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleResend = async () => {
        if (countdown > 0) return;

        setResending(true);
        try {
            await axios.post(`${API_URL}/auth/resend-verification`, { email });
            toast.success('Email đã được gửi lại! Vui lòng kiểm tra hộp thư.');

            // Start 60s countdown
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể gửi lại email');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                        Kiểm tra email của bạn
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Chúng tôi đã gửi link xác thực đến{' '}
                        <strong className="text-gray-900">{email}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                        Không thấy email? Kiểm tra thư mục spam hoặc click nút bên dưới để gửi lại.
                    </p>
                    <button
                        onClick={handleResend}
                        disabled={resending || countdown > 0}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                        {countdown > 0 ? `Gửi lại sau ${countdown}s` : resending ? 'Đang gửi...' : 'Gửi lại email'}
                    </button>
                </div>
            </div>
        </div>
    );
}
