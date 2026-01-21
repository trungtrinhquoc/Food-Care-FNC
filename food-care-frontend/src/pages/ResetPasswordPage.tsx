import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingBag, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../services/api';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error('Link đặt lại mật khẩu không hợp lệ');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        // Validate password strength
        if (newPassword.length < 8) {
            toast.error('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
            toast.error('Mật khẩu phải có ít nhất 1 chữ HOA');
            return;
        }
        if (!/[a-z]/.test(newPassword)) {
            toast.error('Mật khẩu phải có ít nhất 1 chữ thường');
            return;
        }
        if (!/\d/.test(newPassword)) {
            toast.error('Mật khẩu phải có ít nhất 1 số');
            return;
        }
        if (!/[@$!%*?&]/.test(newPassword)) {
            toast.error('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&)');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authApi.resetPassword({ token, newPassword });
            toast.success(response.message || 'Đặt lại mật khẩu thành công!');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            toast.error(errorMessage);
            console.error('Reset password error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Link không hợp lệ</h2>
                                <p className="text-gray-600 mb-4">
                                    Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                                </p>
                                <Button
                                    onClick={() => navigate('/forgot-password')}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-xl"
                                >
                                    Yêu cầu link mới
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

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
                            Đặt lại mật khẩu
                        </CardTitle>
                        <CardDescription className="text-center">
                            Nhập mật khẩu mới cho tài khoản của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Mật khẩu mới</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <PasswordStrengthIndicator password={newPassword} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-gray-600 hover:text-emerald-600 text-sm font-medium transition-colors hover:underline"
                            >
                                Quay lại đăng nhập
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
