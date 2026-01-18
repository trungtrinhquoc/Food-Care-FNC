import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            toast.error('Token không hợp lệ');
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const response = await axios.get(`${API_URL}/auth/verify-email?token=${token}`);
            setStatus('success');
            toast.success(response.data.message || 'Email verified successfully!');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            setStatus('error');
            toast.error(error.response?.data?.message || 'Verification failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <ShoppingBag className="w-9 h-9 text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center">
                    {status === 'verifying' && (
                        <>
                            <Loader2 className="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-spin" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Đang xác thực...
                            </h2>
                            <p className="text-gray-600">
                                Vui lòng đợi trong giây lát
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mb-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Xác thực thành công!
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Tài khoản của bạn đã được kích hoạt
                            </p>
                            <p className="text-sm text-gray-500">
                                Đang chuyển đến trang đăng nhập...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mb-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                    <XCircle className="w-10 h-10 text-red-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Xác thực thất bại
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Link xác thực không hợp lệ hoặc đã hết hạn
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary w-full"
                            >
                                Quay lại đăng nhập
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
