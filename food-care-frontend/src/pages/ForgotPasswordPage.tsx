import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingBag, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../services/api';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authApi.forgotPassword({ email });
            toast.success(response.message || 'Email đặt lại mật khẩu đã được gửi!');
            setEmailSent(true);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            toast.error(errorMessage);
            console.error('Forgot password error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <ShoppingBag className="w-9 h-9 text-white" />
                        </div>
                    </div>
                    <h1 className="text-emerald-600 mb-2 font-bold text-3xl">Food & Care</h1>
                    <p className="text-gray-600">Giao hàng định kỳ</p>
                </div>

                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center text-gray-800">
                            {emailSent ? 'Kiểm tra email của bạn' : 'Quên mật khẩu'}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {emailSent
                                ? 'Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn'
                                : 'Nhập email để nhận link đặt lại mật khẩu'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!emailSent ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="example@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 pl-10"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                                    <Mail className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-700">
                                        Vui lòng kiểm tra hộp thư đến của bạn tại <strong>{email}</strong>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Link sẽ hết hạn sau 1 giờ
                                    </p>
                                </div>
                                <Button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Quay lại đăng nhập
                                </Button>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-gray-600 hover:text-emerald-600 text-sm font-medium transition-colors hover:underline inline-flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại đăng nhập
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
